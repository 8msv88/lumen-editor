import { useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { formatTime } from '../lib/utils'
import type { CaptionStyle } from '../types'

function CaptionOverlay({
  text,
  style,
}: {
  text: string
  style: CaptionStyle
}) {
  const bg =
    style.backgroundOpacity > 0.01
      ? hexToRgba(style.backgroundColor, style.backgroundOpacity)
      : 'transparent'

  const positionClass =
    style.position === 'top'
      ? 'top-6'
      : style.position === 'center'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-8'

  return (
    <div
      className={`absolute inset-x-0 flex pointer-events-none px-4 ${positionClass}`}
      style={{ justifyContent: style.textAlign === 'left' ? 'flex-start' : style.textAlign === 'right' ? 'flex-end' : 'center' }}
    >
      <div
        style={{
          fontFamily: style.fontFamily,
          fontSize: `clamp(14px, ${style.fontSize * 0.45}px, ${style.fontSize}px)`,
          fontWeight: style.fontWeight,
          color: style.color,
          background: bg,
          padding: `${style.paddingY * 0.5}px ${style.paddingX * 0.6}px`,
          borderRadius: style.borderRadius,
          maxWidth: `${style.maxWidth}%`,
          textAlign: style.textAlign,
          textShadow: style.textShadow ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
          lineHeight: 1.3,
        }}
      >
        {text}
      </div>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function Preview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const project = useEditorStore((s) => s.project)
  const currentTime = useEditorStore((s) => s.currentTime)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime)
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !project.videoUrl) return
    if (Math.abs(video.currentTime - currentTime) > 0.15) {
      video.currentTime = currentTime
    }
  }, [currentTime, project.videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
  }, [isPlaying, setIsPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTimeUpdate = () => {
      if (!video.paused) setCurrentTime(video.currentTime)
    }
    const onEnded = () => setIsPlaying(false)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
    }
  }, [setCurrentTime, setIsPlaying])

  const activeCaptions = project.captions.filter(
    (c) => currentTime >= c.start && currentTime <= c.end
  )

  const togglePlay = () => setIsPlaying(!isPlaying)
  const seek = (delta: number) => {
    const next = Math.max(0, Math.min(project.duration, currentTime + delta))
    setCurrentTime(next)
    if (videoRef.current) videoRef.current.currentTime = next
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0b]">
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <div className="relative max-w-full max-h-full shadow-2xl rounded-xl overflow-hidden bg-black ring-1 ring-white/5">
          {project.videoUrl && (
            <video
              ref={videoRef}
              src={project.videoUrl}
              className="preview-video max-h-[48vh] w-auto block"
              playsInline
            />
          )}
          {activeCaptions.map((c) => (
            <CaptionOverlay key={c.id} text={c.text} style={project.captionStyle} />
          ))}
        </div>
      </div>

      <div className="h-14 flex items-center justify-center gap-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
        <button
          onClick={() => seek(-5)}
          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-smooth"
          title="Back 5s"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={togglePlay}
          className="w-11 h-11 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] shadow-lg shadow-blue-500/20 transition-smooth"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button
          onClick={() => seek(5)}
          className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-smooth"
          title="Forward 5s"
        >
          <SkipForward size={18} />
        </button>
        <span className="text-xs font-mono text-[var(--text-secondary)] min-w-[110px] text-center tabular-nums">
          {formatTime(currentTime)} / {formatTime(project.duration)}
        </span>
      </div>
    </div>
  )
}
