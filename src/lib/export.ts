import type { Project } from '../types'

/**
 * Export the project.
 * MVP: downloads the original video + an SRT file with captions.
 * For full burned-in captions you can later integrate ffmpeg.wasm
 * or a server-side renderer (Remotion, etc.).
 */
export async function exportVideo(project: Project): Promise<void> {
  if (!project.videoUrl) throw new Error('No video')

  // 1. Download original video
  const a = document.createElement('a')
  a.href = project.videoUrl
  a.download = (project.videoFileName || 'video').replace(/\.[^/.]+$/, '') + '-edited.mp4'
  a.click()

  // 2. If there are captions, also download an SRT
  if (project.captions.length > 0) {
    const srt = captionsToSrt(project.captions)
    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a2 = document.createElement('a')
    a2.href = url
    a2.download = (project.videoFileName || 'video').replace(/\.[^/.]+$/, '') + '.srt'
    setTimeout(() => {
      a2.click()
      URL.revokeObjectURL(url)
    }, 400)
  }
}

function captionsToSrt(captions: Project['captions']): string {
  const sorted = [...captions].sort((a, b) => a.start - b.start)
  return sorted
    .map((c, i) => {
      const start = secondsToSrtTime(c.start)
      const end = secondsToSrtTime(c.end)
      return `${i + 1}\n${start} --> ${end}\n${c.text}\n`
    })
    .join('\n')
}

function secondsToSrtTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms, 3)}`
}

function pad(n: number, len = 2): string {
  return n.toString().padStart(len, '0')
}
