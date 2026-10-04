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
    <div className="h-44 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
      <div className="h-8 flex items-center px-3 gap-3 border-b border-[var(--border)]">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-medium">
          Timeline
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-[var(--surface-2)] rounded-lg p-0.5">
          <button
            onClick={() => setZoom(zoom - 0.25)}
            className="w-7 h-6 rounded-md text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-smooth"
          >
            −
          </button>
          <span className="text-[10px] text-[var(--text-secondary)] w-9 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.25)}
            className="w-7 h-6 rounded-md text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-smooth"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative cursor-crosshair"
        onClick={handleSeek}
      >
        <div
          className="relative h-full"
          style={{ width: `${duration * pixelsPerSecond + 48}px`, minWidth: '100%' }}
        >
          <div className="absolute top-0 left-0 right-0 h-5 border-b border-[var(--border)]">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-[var(--border)] text-[9px] text-[var(--text-secondary)]/70 pl-1 pt-0.5"
                style={{ left: `${i * pixelsPerSecond}px` }}
              >
                {formatTime(i).split('.')[0]}
              </div>
            ))}
          </div>

          <div
            className="absolute top-6 left-0 h-9 rounded-lg bg-gradient-to-r from-[var(--accent)]/25 to-[var(--accent)]/10 border border-[var(--accent)]/30 overflow-hidden"
            style={{ width: `${duration * pixelsPerSecond}px` }}
          >
            <div className="h-full flex items-center px-2.5">
              <span className="text-[11px] font-medium text-[var(--accent)] truncate">
                {project.videoFileName || 'Video'}
              </span>
            </div>
          </div>

          <div
            className="absolute top-[68px] left-0 h-8"
            style={{ width: `${duration * pixelsPerSecond}px` }}
          >
            {project.captions.map((c) => {
              const left = c.start * pixelsPerSecond
              const width = Math.max(6, (c.end - c.start) * pixelsPerSecond)
              return (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedCaptionId(c.id)
                    setCurrentTime(c.start)
                  }}
                  className={clsx(
                    'absolute h-full rounded-md px-1.5 flex items-center text-[10px] font-medium truncate cursor-pointer transition-smooth border',
                    selectedCaptionId === c.id
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] z-10 shadow-md shadow-blue-500/20'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--border)] hover:text-[var(--text)]'
                  )}
                  style={{ left: `${left}px`, width: `${width}px` }}
                  title={c.text}
                >
                  {c.text}
                </div>
              )
            })}
          </div>

          <div
            className="absolute top-0 bottom-0 w-px bg-[var(--danger)] z-20 pointer-events-none"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-sm shadow-red-500/40" />
          </div>
        </div>
      </div>
    </div>
  )
}
