import { useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { formatTime } from '../lib/utils'

export function Preview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const project = useEditorStore((s) => s.project)
  const currentTime = useEditorStore((s) => s.currentTime)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime)
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying)

  // Sync video element with store
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

  // Time update from video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      if (!video.paused) {
        setCurrentTime(video.currentTime)
      }
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
  const activeTexts = project.textOverlays.filter(
    (t) => currentTime >= t.start && currentTime <= t.end
  )

  const togglePlay = () => setIsPlaying(!isPlaying)

  const seek = (delta: number) => {
    const next = Math.max(0, Math.min(project.duration, currentTime + delta))
    setCurrentTime(next)
    if (videoRef.current) videoRef.current.currentTime = next
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black/40">
      {/* Preview area */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden bg-black">
          {project.videoUrl && (
            <video
              ref={videoRef}
              src={project.videoUrl}
              className="preview-video max-h-[50vh] w-auto"
              playsInline
              muted={false}
            />
          )}

          {/* Caption overlay */}
          <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none px-4">
            {activeCaptions.map((c) => (
              <div
                key={c.id}
                className="px-3 py-1.5 rounded-md bg-black/75 text-white text-center text-sm md:text-base font-medium max-w-[90%] leading-snug"
              >
                {c.text}
              </div>
            ))}
          </div>

          {/* Text overlays */}
          {activeTexts.map((t) => (
            <div
              key={t.id}
              className="absolute pointer-events-none"
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: t.fontSize,
                color: t.color,
                fontWeight: t.fontWeight,
                background: t.background || 'transparent',
                padding: t.background ? '4px 8px' : 0,
                borderRadius: 4,
              }}
            >
              {t.text}
            </div>
          ))}
        </div>
      </div>

      {/* Transport controls */}
      <div className="h-12 flex items-center justify-center gap-4 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
        <button
          onClick={() => seek(-5)}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-smooth"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] transition-smooth"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button
          onClick={() => seek(5)}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-smooth"
        >
          <SkipForward size={18} />
        </button>
        <span className="text-xs font-mono text-[var(--text-secondary)] min-w-[100px] text-center">
          {formatTime(currentTime)} / {formatTime(project.duration)}
        </span>
      </div>
    </div>
  )
}
