import type { Caption } from '../types'
import { uid } from './utils'

/**
 * Auto-generate captions for a video.
 *
 * Current implementation:
 * - Creates evenly spaced placeholder captions (demo mode)
 * - In production you can swap this for:
 *   1. @xenova/transformers Whisper (fully local, browser)
 *   2. AssemblyAI / Deepgram / OpenAI Whisper API (server)
 *   3. Web Speech API (limited, live only)
 *
 * The interface stays the same: (videoUrl, duration) => Caption[]
 */
export async function generateCaptions(
  videoUrl: string,
  duration: number
): Promise<Caption[]> {
  // Simulate processing time
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))

  // Demo: create sensible placeholder captions based on length
  // Replace this block with real STT when ready.
  const segmentLength = 3.2
  const captions: Caption[] = []
  let t = 0.3

  const phrases = [
    'This is an auto-generated caption',
    'Edit the text in the side panel',
    'Drag the playhead to preview',
    'Export when you are happy',
    'Your video never leaves the browser',
    'Lumen keeps things simple',
    'Add more captions manually',
    'Style and timing are fully editable',
  ]

  let i = 0
  while (t < duration - 0.5) {
    const end = Math.min(t + segmentLength, duration - 0.1)
    captions.push({
      id: uid(),
      start: Math.round(t * 10) / 10,
      end: Math.round(end * 10) / 10,
      text: phrases[i % phrases.length],
    })
    t = end + 0.4
    i++
  }

  // Keep a reference so the unused param warning goes away and
  // future real implementations can use the video URL.
  void videoUrl

  return captions
}

/**
 * Example of how to wire real local Whisper later:
 *
 * import { pipeline } from '@xenova/transformers'
 *
 * const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en')
 * const result = await transcriber(audioUrl, { return_timestamps: true })
 * // map result.chunks to Caption[]
 */
