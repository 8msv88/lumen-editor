import type { Caption } from '../types'
import { uid } from './utils'

export type CaptionProgress = {
  stage: 'loading-model' | 'extracting-audio' | 'transcribing' | 'done'
  progress: number // 0–1
  message: string
}

type ProgressCb = (p: CaptionProgress) => void

/** Cached Whisper pipeline so the model is only downloaded once per session */
let transcriberPromise: Promise<any> | null = null

async function getTranscriber(onProgress?: ProgressCb) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      onProgress?.({
        stage: 'loading-model',
        progress: 0.05,
        message: 'Loading speech model (first time may take a minute)…',
      })

      const { pipeline, env } = await import('@xenova/transformers')

      // Use local cache in the browser; allow remote model download
      env.allowLocalModels = false
      env.useBrowserCache = true

      const pipe = await pipeline(
        'automatic-speech-recognition',
        // tiny.en is fast & good for English; change to Xenova/whisper-base.en for higher accuracy
        'Xenova/whisper-tiny.en',
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

/**
 * Decode the audio track from a video blob URL and return mono Float32 samples at 16 kHz
 * (the rate Whisper expects).
 */
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

  // Decode at native rate first, then resample to 16 kHz
  const audioCtx = new AudioContext()
  let audioBuffer: AudioBuffer

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
  } catch {
    await audioCtx.close()
    throw new Error(
      'Could not decode audio from this video. Try an MP4 or WebM with an audio track.'
    )
  }

  // Mix down to mono
  const channelData =
    audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0)

  // Resample to 16 kHz if needed
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
    for (let i = 0; i < len; i++) {
      mono[i] += data[i] / channels
    }
  }
  return mono
}

/** Simple linear resampler */
function resample(
  input: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
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

/**
 * Transcribe video audio with local Whisper and return timed captions.
 * Everything runs in the browser — no server, no API key.
 */
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
    message: 'Transcribing speech…',
  })

  // Chunk long audio so the UI stays responsive and memory stays reasonable
  const result = await transcriber(audio, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  })

  onProgress?.({
    stage: 'transcribing',
    progress: 0.95,
    message: 'Building captions…',
  })

  const captions = mapResultToCaptions(result)

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

function mapResultToCaptions(result: any): Caption[] {
  const captions: Caption[] = []

  const chunks: any[] = result?.chunks

  if (Array.isArray(chunks) && chunks.length > 0) {
    for (const chunk of chunks) {
      const text = String(chunk.text ?? '').trim()
      if (!text) continue

      let start = 0
      let end = 0
      const ts = chunk.timestamp

      if (Array.isArray(ts) && ts.length >= 2) {
        start = typeof ts[0] === 'number' && isFinite(ts[0]) ? ts[0] : 0
        end =
          typeof ts[1] === 'number' && isFinite(ts[1])
            ? ts[1]
            : start + Math.max(1.5, text.split(/\s+/).length * 0.35)
      } else {
        start = captions.length === 0 ? 0 : captions[captions.length - 1].end
        end = start + Math.max(1.5, text.split(/\s+/).length * 0.35)
      }

      if (end <= start) end = start + 1.2

      captions.push({
        id: uid(),
        start: Math.round(start * 100) / 100,
        end: Math.round(end * 100) / 100,
        text: cleanTranscript(text),
      })
    }
  } else if (typeof result?.text === 'string' && result.text.trim()) {
    captions.push({
      id: uid(),
      start: 0,
      end: 5,
      text: cleanTranscript(result.text),
    })
  }

  return mergeShortCaptions(captions)
}

function cleanTranscript(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[[(].*?[\])]\s*/g, '')
    .trim()
}

/** Merge very short adjacent captions for cleaner reading */
function mergeShortCaptions(captions: Caption[]): Caption[] {
  if (captions.length < 2) return captions
  const merged: Caption[] = []
  let current = { ...captions[0] }

  for (let i = 1; i < captions.length; i++) {
    const next = captions[i]
    const gap = next.start - current.end
    const currentLen = current.end - current.start

    if (currentLen < 1.2 && gap < 0.4 && (current.text + ' ' + next.text).length < 90) {
      current = {
        ...current,
        end: next.end,
        text: `${current.text} ${next.text}`.replace(/\s+/g, ' ').trim(),
      }
    } else {
      merged.push(current)
      current = { ...next }
    }
  }
  merged.push(current)
  return merged
}
