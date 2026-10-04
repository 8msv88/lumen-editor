import type { Caption, CaptionWord } from '../types'
import { uid } from './utils'

export type CaptionProgress = {
  stage: 'loading-model' | 'extracting-audio' | 'transcribing' | 'done'
  progress: number
  message: string
}

type ProgressCb = (p: CaptionProgress) => void

const TARGET_SR = 16000

/** Prefer small.en for noise robustness; falls back to base if load fails */
const MODEL_PRIMARY = 'Xenova/whisper-small.en'
const MODEL_FALLBACK = 'Xenova/whisper-base.en'

let transcriberPromise: Promise<any> | null = null
let loadedModelId = ''

async function getTranscriber(onProgress?: ProgressCb) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      onProgress?.({
        stage: 'loading-model',
        progress: 0.04,
        message: 'Loading speech model (first time ~250 MB, then cached)…',
      })

      const { pipeline, env } = await import('@xenova/transformers')
      env.allowLocalModels = false
      env.useBrowserCache = true

      const progress_callback = (data: { status?: string; progress?: number }) => {
        if (data.status === 'progress' && typeof data.progress === 'number') {
          onProgress?.({
            stage: 'loading-model',
            progress: Math.min(0.48, 0.04 + (data.progress / 100) * 0.44),
            message: `Downloading model… ${Math.round(data.progress)}%`,
          })
        }
      }

      let device: 'webgpu' | 'wasm' = 'wasm'
      try {
        if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
          const adapter = await (navigator as any).gpu?.requestAdapter?.()
          if (adapter) device = 'webgpu'
        }
      } catch {
        device = 'wasm'
      }

      let pipe: any
      try {
        pipe = await pipeline('automatic-speech-recognition', MODEL_PRIMARY, {
          progress_callback,
          device,
          dtype: device === 'webgpu' ? 'fp32' : 'q8',
        })
        loadedModelId = MODEL_PRIMARY
      } catch (e) {
        console.warn('Primary model failed, falling back to base.en', e)
        onProgress?.({
          stage: 'loading-model',
          progress: 0.2,
          message: 'Loading fallback model…',
        })
        pipe = await pipeline('automatic-speech-recognition', MODEL_FALLBACK, {
          progress_callback,
          device: 'wasm',
        })
        loadedModelId = MODEL_FALLBACK
      }

      onProgress?.({
        stage: 'loading-model',
        progress: 0.5,
        message: `Model ready (${loadedModelId.split('/').pop()})`,
      })

      return pipe
    })()
  }
  return transcriberPromise
}

async function extractAudioSamples(
  videoUrl: string,
  onProgress?: ProgressCb
): Promise<Float32Array> {
  onProgress?.({
    stage: 'extracting-audio',
    progress: 0.52,
    message: 'Extracting & cleaning audio…',
  })

  const response = await fetch(videoUrl)
  const arrayBuffer = await response.arrayBuffer()

  let audioCtx: AudioContext | OfflineAudioContext
  let audioBuffer: AudioBuffer

  try {
    audioCtx = new AudioContext({ sampleRate: TARGET_SR })
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
  } catch {
    try {
      audioCtx = new AudioContext()
      audioBuffer = await (audioCtx as AudioContext).decodeAudioData(arrayBuffer.slice(0))
    } catch {
      throw new Error(
        'Could not decode audio from this video. Try an MP4 or WebM with a speech track.'
      )
    }
  }

  let samples =
    audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : new Float32Array(audioBuffer.getChannelData(0))

  if (audioBuffer.sampleRate !== TARGET_SR) {
    samples = resample(samples, audioBuffer.sampleRate, TARGET_SR)
  }

  if ('close' in audioCtx) {
    try {
      await (audioCtx as AudioContext).close()
    } catch {
      /* ignore */
    }
  }

  onProgress?.({
    stage: 'extracting-audio',
    progress: 0.58,
    message: 'Reducing noise & boosting speech…',
  })

  samples = removeDc(samples)
  samples = highPassFilter(samples, TARGET_SR, 85)
  samples = softNoiseGate(samples, TARGET_SR)
  samples = speechBandEmphasis(samples, TARGET_SR)
  samples = rmsNormalize(samples, 0.12)

  onProgress?.({
    stage: 'extracting-audio',
    progress: 0.64,
    message: 'Audio ready',
  })

  return samples
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const len = buffer.length
  const mono = new Float32Array(len)
  const channels = buffer.numberOfChannels
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < len; i++) mono[i] += data[i] / channels
  }
  return mono
}

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input
  const ratio = fromRate / toRate
  const newLen = Math.round(input.length / ratio)
  const output = new Float32Array(newLen)
  for (let i = 0; i < newLen; i++) {
    const src = i * ratio
    const i0 = Math.floor(src)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const t = src - i0
    output[i] = input[i0] * (1 - t) + input[i1] * t
  }
  return output
}

function removeDc(input: Float32Array): Float32Array {
  let sum = 0
  for (let i = 0; i < input.length; i++) sum += input[i]
  const mean = sum / input.length
  const out = new Float32Array(input.length)
  for (let i = 0; i < input.length; i++) out[i] = input[i] - mean
  return out
}

function highPassFilter(input: Float32Array, sr: number, cutoffHz: number): Float32Array {
  const rc = 1 / (2 * Math.PI * cutoffHz)
  const dt = 1 / sr
  const alpha = rc / (rc + dt)
  const out = new Float32Array(input.length)
  out[0] = input[0]
  for (let i = 1; i < input.length; i++) {
    out[i] = alpha * (out[i - 1] + input[i] - input[i - 1])
  }
  return out
}

function softNoiseGate(input: Float32Array, sr: number): Float32Array {
  const win = Math.max(64, Math.floor(sr * 0.02))
  const hop = Math.max(32, Math.floor(win / 2))
  const energies: number[] = []

  for (let i = 0; i + win <= input.length; i += hop) {
    let e = 0
    for (let j = 0; j < win; j++) {
      const s = input[i + j]
      e += s * s
    }
    energies.push(Math.sqrt(e / win))
  }
  if (!energies.length) return input

  const sorted = [...energies].sort((a, b) => a - b)
  const noiseFloor = sorted[Math.floor(sorted.length * 0.15)] || 0.001
  const threshold = Math.max(noiseFloor * 2.2, 0.004)
  const open = threshold * 1.6

  const out = new Float32Array(input.length)
  let gain = 0.15

  for (let i = 0; i < input.length; i++) {
    const frameIdx = Math.min(energies.length - 1, Math.floor(i / hop))
    const e = energies[frameIdx]
    const target =
      e >= open ? 1 : e <= threshold ? 0.08 : 0.08 + 0.92 * ((e - threshold) / (open - threshold))
    gain += (target - gain) * 0.12
    out[i] = input[i] * gain
  }
  return out
}

function speechBandEmphasis(input: Float32Array, sr: number): Float32Array {
  const lp = onePoleLowPass(input, sr, 3400)
  const band = highPassFilter(lp, sr, 280)
  const out = new Float32Array(input.length)
  for (let i = 0; i < input.length; i++) {
    out[i] = input[i] * 0.65 + band[i] * 0.55
  }
  return out
}

function onePoleLowPass(input: Float32Array, sr: number, cutoffHz: number): Float32Array {
  const rc = 1 / (2 * Math.PI * cutoffHz)
  const dt = 1 / sr
  const alpha = dt / (rc + dt)
  const out = new Float32Array(input.length)
  out[0] = input[0]
  for (let i = 1; i < input.length; i++) {
    out[i] = out[i - 1] + alpha * (input[i] - out[i - 1])
  }
  return out
}

function rmsNormalize(input: Float32Array, targetRms: number): Float32Array {
  let sum = 0
  for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
  const rms = Math.sqrt(sum / input.length) || 1e-8
  let gain = targetRms / rms
  gain = Math.min(gain, 8)
  gain = Math.max(gain, 0.25)

  const out = new Float32Array(input.length)
  let peak = 0
  for (let i = 0; i < input.length; i++) {
    out[i] = input[i] * gain
    const a = Math.abs(out[i])
    if (a > peak) peak = a
  }
  if (peak > 0.98) {
    const scale = 0.98 / peak
    for (let i = 0; i < out.length; i++) out[i] *= scale
  }
  return out
}

export async function generateCaptions(
  videoUrl: string,
  _duration: number,
  onProgress?: ProgressCb
): Promise<Caption[]> {
  const transcriber = await getTranscriber(onProgress)
  const audio = await extractAudioSamples(videoUrl, onProgress)

  onProgress?.({
    stage: 'transcribing',
    progress: 0.68,
    message: 'Transcribing speech (enhanced model)…',
  })

  const decodeOpts: Record<string, unknown> = {
    return_timestamps: 'word',
    chunk_length_s: 20,
    stride_length_s: 4,
    temperature: 0,
    no_repeat_ngram_size: 3,
  }

  let result: any
  try {
    result = await transcriber(audio, decodeOpts)
  } catch {
    onProgress?.({
      stage: 'transcribing',
      progress: 0.75,
      message: 'Retrying transcription…',
    })
    result = await transcriber(audio, {
      return_timestamps: true,
      chunk_length_s: 25,
      stride_length_s: 5,
      temperature: 0,
    })
  }

  onProgress?.({
    stage: 'transcribing',
    progress: 0.92,
    message: 'Building caption lines…',
  })

  const words = extractWords(result)
  let captions =
    words.length > 0 ? groupWordsIntoCaptions(words) : mapSegmentCaptions(result)

  captions = filterHallucinations(captions)

  onProgress?.({
    stage: 'done',
    progress: 1,
    message: captions.length
      ? `Generated ${captions.length} caption${captions.length === 1 ? '' : 's'}`
      : 'No speech detected',
  })

  if (captions.length === 0) {
    throw new Error(
      'No clear speech detected. Try a clip with louder voice, or reduce music/noise under the speech.'
    )
  }

  return captions
}

function filterHallucinations(captions: Caption[]): Caption[] {
  const BAD =
    /^(thanks for watching|thank you for watching|subscribe|please subscribe|see you next time|bye\.?|you|the end|\(.*\)|\[.*\])$/i

  return captions.filter((c) => {
    const t = c.text.trim()
    if (t.length < 1) return false
    if (BAD.test(t)) return false
    const parts = t.split(/\s+/)
    if (parts.length >= 4 && new Set(parts.map((p) => p.toLowerCase())).size === 1) {
      return false
    }
    return true
  })
}

function extractWords(result: any): CaptionWord[] {
  const chunks: any[] = result?.chunks
  if (!Array.isArray(chunks)) return []

  const words: CaptionWord[] = []
  for (const chunk of chunks) {
    const text = String(chunk.text ?? '').trim()
    if (!text) continue
    const ts = chunk.timestamp
    if (!Array.isArray(ts) || ts.length < 2) continue
    const start = typeof ts[0] === 'number' && isFinite(ts[0]) ? ts[0] : 0
    let end = typeof ts[1] === 'number' && isFinite(ts[1]) ? ts[1] : start + 0.3
    if (end <= start) end = start + 0.25

    const parts = text.split(/\s+/).filter(Boolean)
    if (parts.length === 1) {
      words.push({ text: cleanWord(parts[0]), start, end })
    } else {
      const dur = (end - start) / parts.length
      parts.forEach((p, i) => {
        words.push({
          text: cleanWord(p),
          start: start + i * dur,
          end: start + (i + 1) * dur,
        })
      })
    }
  }
  return words.filter((w) => w.text.length > 0)
}

function groupWordsIntoCaptions(words: CaptionWord[]): Caption[] {
  const MAX_WORDS = 7
  const MAX_CHARS = 42
  const MAX_DURATION = 3.8
  const PAUSE_BREAK = 0.55

  const captions: Caption[] = []
  let buf: CaptionWord[] = []

  const flush = () => {
    if (!buf.length) return
    const start = buf[0].start
    const end = buf[buf.length - 1].end
    const text = buf.map((w) => w.text).join(' ')
    captions.push({
      id: uid(),
      start: Math.round(start * 100) / 100,
      end: Math.round(Math.max(end, start + 0.4) * 100) / 100,
      text,
      words: buf.map((w) => ({ ...w })),
    })
    buf = []
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    const prev = buf[buf.length - 1]
    const gap = prev ? w.start - prev.end : 0
    const wouldChars =
      buf.reduce((n, x) => n + x.text.length, 0) + buf.length + w.text.length
    const wouldDur = prev ? w.end - buf[0].start : 0

    const shouldBreak =
      buf.length > 0 &&
      (gap >= PAUSE_BREAK ||
        buf.length >= MAX_WORDS ||
        wouldChars > MAX_CHARS ||
        wouldDur > MAX_DURATION ||
        /[.!?]$/.test(prev?.text ?? ''))

    if (shouldBreak) flush()
    buf.push(w)
  }
  flush()
  return captions
}

function mapSegmentCaptions(result: any): Caption[] {
  const chunks: any[] = result?.chunks
  if (!Array.isArray(chunks)) {
    if (typeof result?.text === 'string' && result.text.trim()) {
      return [{ id: uid(), start: 0, end: 4, text: cleanTranscript(result.text) }]
    }
    return []
  }

  return chunks
    .map((chunk) => {
      const text = cleanTranscript(String(chunk.text ?? ''))
      if (!text) return null
      const ts = chunk.timestamp
      const start = Array.isArray(ts) && typeof ts[0] === 'number' ? ts[0] : 0
      let end = Array.isArray(ts) && typeof ts[1] === 'number' ? ts[1] : start + 2
      if (end <= start) end = start + 1.5
      return {
        id: uid(),
        start: Math.round(start * 100) / 100,
        end: Math.round(end * 100) / 100,
        text,
      } as Caption
    })
    .filter(Boolean) as Caption[]
}

function cleanWord(text: string): string {
  return text.replace(/^[[(].*?[\])]$/g, '').trim()
}

function cleanTranscript(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[[(].*?[\])]\s*/g, '')
    .trim()
}

export function splitCaption(caption: Caption): [Caption, Caption] | null {
  if (caption.words && caption.words.length >= 2) {
    const mid = Math.floor(caption.words.length / 2)
    const a = caption.words.slice(0, mid)
    const b = caption.words.slice(mid)
    return [
      {
        id: uid(),
        start: a[0].start,
        end: a[a.length - 1].end,
        text: a.map((w) => w.text).join(' '),
        words: a,
      },
      {
        id: uid(),
        start: b[0].start,
        end: b[b.length - 1].end,
        text: b.map((w) => w.text).join(' '),
        words: b,
      },
    ]
  }

  const parts = caption.text.split(/\s+/)
  if (parts.length < 2) return null
  const mid = Math.floor(parts.length / 2)
  const tMid = caption.start + (caption.end - caption.start) / 2
  return [
    { id: uid(), start: caption.start, end: tMid, text: parts.slice(0, mid).join(' ') },
    { id: uid(), start: tMid, end: caption.end, text: parts.slice(mid).join(' ') },
  ]
}

export function mergeCaptions(a: Caption, b: Caption): Caption {
  const words = a.words && b.words ? [...a.words, ...b.words] : undefined
  return {
    id: uid(),
    start: Math.min(a.start, b.start),
    end: Math.max(a.end, b.end),
    text: `${a.text} ${b.text}`.replace(/\s+/g, ' ').trim(),
    words,
  }
}
