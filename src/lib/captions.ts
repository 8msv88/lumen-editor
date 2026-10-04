import type { Caption, CaptionWord } from '../types'
import { uid } from './utils'

export type CaptionProgress = {
  stage: 'loading-model' | 'extracting-audio' | 'transcribing' | 'done'
  progress: number
  message: string
}

type ProgressCb = (p: CaptionProgress) => void

let transcriberPromise: Promise<any> | null = null

async function getTranscriber(onProgress?: ProgressCb) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      onProgress?.({
        stage: 'loading-model',
        progress: 0.05,
        message: 'Loading speech model (first time ~40–75 MB)…',
      })

      const { pipeline, env } = await import('@xenova/transformers')
      env.allowLocalModels = false
      env.useBrowserCache = true

      const pipe = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-base.en',
        {
          progress_callback: (data: { status?: string; progress?: number }) => {
            if (data.status === 'progress' && typeof data.progress === 'number') {
              onProgress?.({
                stage: 'loading-model',
                progress: Math.min(0.45, 0.05 + (data.progress / 100) * 0.4),
                message: `Downloading model… ${Math.round(data.progress)}%`,
              })
            }
          },
        }
      )

      onProgress?.({
        stage: 'loading-model',
        progress: 0.5,
        message: 'Model ready',
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
    progress: 0.55,
    message: 'Extracting audio from video…',
  })

  const response = await fetch(videoUrl)
  const arrayBuffer = await response.arrayBuffer()
  const audioCtx = new AudioContext()
  let audioBuffer: AudioBuffer

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
  } catch {
    await audioCtx.close()
    throw new Error(
      'Could not decode audio from this video. Try an MP4 or WebM with a clear speech track.'
    )
  }

  const channelData =
    audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0)

  const targetRate = 16000
  const samples =
    audioBuffer.sampleRate === targetRate
      ? new Float32Array(channelData)
      : resample(channelData, audioBuffer.sampleRate, targetRate)

  await audioCtx.close()

  onProgress?.({
    stage: 'extracting-audio',
    progress: 0.65,
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

export async function generateCaptions(
  videoUrl: string,
  _duration: number,
  onProgress?: ProgressCb
): Promise<Caption[]> {
  const transcriber = await getTranscriber(onProgress)
  const audio = await extractAudioSamples(videoUrl, onProgress)

  onProgress?.({
    stage: 'transcribing',
    progress: 0.7,
    message: 'Transcribing speech (word-level)…',
  })

  let result: any
  try {
    result = await transcriber(audio, {
      return_timestamps: 'word',
      chunk_length_s: 30,
      stride_length_s: 5,
    })
  } catch {
    result = await transcriber(audio, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    })
  }

  onProgress?.({
    stage: 'transcribing',
    progress: 0.92,
    message: 'Building caption lines…',
  })

  const words = extractWords(result)
  const captions =
    words.length > 0 ? groupWordsIntoCaptions(words) : mapSegmentCaptions(result)

  onProgress?.({
    stage: 'done',
    progress: 1,
    message: captions.length
      ? `Generated ${captions.length} caption${captions.length === 1 ? '' : 's'}`
      : 'No speech detected',
  })

  if (captions.length === 0) {
    throw new Error('No speech detected in this video.')
  }

  return captions
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
      return [
        {
          id: uid(),
          start: 0,
          end: 4,
          text: cleanTranscript(result.text),
        },
      ]
    }
    return []
  }

  return chunks
    .map((chunk) => {
      const text = cleanTranscript(String(chunk.text ?? ''))
      if (!text) return null
      const ts = chunk.timestamp
      const start =
        Array.isArray(ts) && typeof ts[0] === 'number' ? ts[0] : 0
      let end =
        Array.isArray(ts) && typeof ts[1] === 'number' ? ts[1] : start + 2
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
    {
      id: uid(),
      start: caption.start,
      end: tMid,
      text: parts.slice(0, mid).join(' '),
    },
    {
      id: uid(),
      start: tMid,
      end: caption.end,
      text: parts.slice(mid).join(' '),
    },
  ]
}

export function mergeCaptions(a: Caption, b: Caption): Caption {
  const words =
    a.words && b.words ? [...a.words, ...b.words] : undefined
  return {
    id: uid(),
    start: Math.min(a.start, b.start),
    end: Math.max(a.end, b.end),
    text: `${a.text} ${b.text}`.replace(/\s+/g, ' ').trim(),
    words,
  }
}
