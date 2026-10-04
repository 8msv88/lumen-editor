import type { Caption, CaptionStyle, Project } from '../types'

/**
 * Burn captions into the video and download a final MP4/WebM.
 * Uses canvas compositing + MediaRecorder for a pure browser export.
 */
export async function exportVideo(
  project: Project,
  onProgress?: (p: number) => void
): Promise<void> {
  if (!project.videoUrl) throw new Error('No video')

  const video = document.createElement('video')
  video.src = project.videoUrl
  video.crossOrigin = 'anonymous'
  video.muted = false
  video.playsInline = true
  video.preload = 'auto'

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve()
    video.onerror = () => reject(new Error('Failed to load video for export'))
  })

  const width = video.videoWidth || project.width || 1280
  const height = video.videoHeight || project.height || 720
  const duration = video.duration || project.duration

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  if (!ctx) throw new Error('Canvas not supported')

  const mimeCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm',
  ]
  const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm'

  const stream = canvas.captureStream(30)

  try {
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaElementSource(video)
    const dest = audioCtx.createMediaStreamDestination()
    source.connect(dest)
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
  } catch {
    // Audio may fail on some browsers; continue video-only
  }

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      resolve(blob)
    }
  })

  recorder.start(100)
  video.currentTime = 0
  await video.play()

  const style = project.captionStyle
  const captions = project.captions

  const drawFrame = () => {
    if (video.ended || video.paused) return

    ctx.drawImage(video, 0, 0, width, height)

    const t = video.currentTime
    const active = captions.filter((c) => t >= c.start && t <= c.end)
    for (const c of active) {
      drawCaption(ctx, c, style, width, height)
    }

    if (onProgress) {
      onProgress(Math.min(0.99, t / duration))
    }

    requestAnimationFrame(drawFrame)
  }

  drawFrame()

  await new Promise<void>((resolve) => {
    video.onended = () => resolve()
  })

  ctx.drawImage(video, 0, 0, width, height)
  const lastActive = captions.filter((c) => duration - 0.05 >= c.start && duration - 0.05 <= c.end)
  for (const c of lastActive) {
    drawCaption(ctx, c, style, width, height)
  }

  recorder.stop()
  video.pause()

  const blob = await finished
  if (onProgress) onProgress(1)

  const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(project.videoFileName || 'video').replace(/\.[^/.]+$/, '')}-captioned.${ext}`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  caption: Caption,
  style: CaptionStyle,
  canvasW: number,
  canvasH: number
) {
  const {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    backgroundColor,
    backgroundOpacity,
    textAlign,
    position,
    paddingX,
    paddingY,
    borderRadius,
    textShadow,
    maxWidth,
  } = style

  ctx.save()
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.textAlign = textAlign
  ctx.textBaseline = 'middle'

  const maxTextWidth = (canvasW * maxWidth) / 100
  const lines = wrapText(ctx, caption.text, maxTextWidth)
  const lineHeight = fontSize * 1.3
  const textBlockHeight = lines.length * lineHeight
  const boxWidth = Math.min(
    maxTextWidth,
    Math.max(...lines.map((l) => ctx.measureText(l).width)) + paddingX * 2
  )
  const boxHeight = textBlockHeight + paddingY * 2

  let boxX = (canvasW - boxWidth) / 2
  if (textAlign === 'left') boxX = canvasW * 0.05
  if (textAlign === 'right') boxX = canvasW - boxWidth - canvasW * 0.05

  let boxY: number
  if (position === 'top') {
    boxY = canvasH * 0.06
  } else if (position === 'center') {
    boxY = (canvasH - boxHeight) / 2
  } else {
    boxY = canvasH - boxHeight - canvasH * 0.08
  }

  if (backgroundOpacity > 0.01) {
    ctx.globalAlpha = backgroundOpacity
    ctx.fillStyle = backgroundColor
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, borderRadius)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  ctx.fillStyle = color
  if (textShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.75)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 1
  }

  let textX = boxX + boxWidth / 2
  if (textAlign === 'left') textX = boxX + paddingX
  if (textAlign === 'right') textX = boxX + boxWidth - paddingX

  lines.forEach((line, i) => {
    const y = boxY + paddingY + lineHeight * i + lineHeight / 2
    ctx.fillText(line, textX, y)
  })

  ctx.restore()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
