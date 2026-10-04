import { useRef, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import { formatTime } from '../lib/utils'
import clsx from 'clsx'

export function Timeline() {
  const trackRef = useRef<HTMLDivElement>(null)
  const project = useEditorStore((s) => s.project)
  const currentTime = useEditorStore((s) => s.currentTime)
  const zoom = useEditorStore((s) => s.zoom)
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime)
  const setZoom = useEditorStore((s) => s.setZoom)
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId)
  const setSelectedCaptionId = useEditorStore((s) => s.setSelectedCaptionId)

  const duration = project.duration || 1
  const pixelsPerSecond = 80 * zoom

  const handleSeek = useCallback(
    (e: React.MouseEvent) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const x = e.clientX - rect.left + track.scrollLeft
      const t = Math.max(0, Math.min(duration, x / pixelsPerSecond))
      setCurrentTime(t)
    },
    [duration, pixelsPerSecond, setCurrentTime]
  )

  return (
    <div className="h-40 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
      {/* Zoom + ruler header */}
      <div className="h-8 flex items-center px-3 gap-3 border-b border-[var(--border)]">
        <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">
          Timeline
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setZoom(zoom - 0.25)}
          className="text-xs px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          −
        </button>
        <span className="text-[11px] text-[var(--text-secondary)] w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom + 0.25)}
          className="text-xs px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)]"
        >
          +
        </button>
      </div>

      {/* Tracks */}
      <div
        ref={trackRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="relative h-full"
          style={{ width: `${duration * pixelsPerSecond + 40}px`, minWidth: '100%' }}
        >
          {/* Time ruler */}
          <div className="absolute top-0 left-0 right-0 h-5 border-b border-[var(--border)]">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-[var(--border)] text-[9px] text-[var(--text-secondary)] pl-1"
                style={{ left: `${i * pixelsPerSecond}px` }}
              >
                {formatTime(i).split('.')[0]}
              </div>
            ))}
          </div>

          {/* Video track */}
          <div className="absolute top-6 left-0 h-10 rounded-md bg-[var(--accent)]/20 border border-[var(--accent)]/40 overflow-hidden"
            style={{ width: `${duration * pixelsPerSecond}px` }}
          >
            <div className="h-full flex items-center px-2">
              <span className="text-[11px] font-medium text-[var(--accent)] truncate">
                {project.videoFileName || 'Video'}
              </span>
            </div>
          </div>

          {/* Caption track */}
          <div className="absolute top-[68px] left-0 h-8" style={{ width: `${duration * pixelsPerSecond}px` }}>
            {project.captions.map((c) => {
              const left = c.start * pixelsPerSecond
              const width = Math.max(4, (c.end - c.start) * pixelsPerSecond)
              return (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedCaptionId(c.id)
                    setCurrentTime(c.start)
                  }}
                  className={clsx(
                    'absolute h-full rounded px-1.5 flex items-center text-[10px] font-medium truncate cursor-pointer transition-smooth',
                    selectedCaptionId === c.id
                      ? 'bg-[var(--accent)] text-white z-10'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                  title={c.text}
                >
                  {c.text}
                </div>
              )
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--danger)] z-20 pointer-events-none"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[var(--danger)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
