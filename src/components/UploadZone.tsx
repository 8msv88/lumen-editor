import { useRef, useState } from 'react'
import { Upload, Film, Sparkles } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const setVideo = useEditorStore((s) => s.setVideo)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file (MP4, WebM, MOV…)')
      return
    }
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      setVideo(url, file.name, video.duration, video.videoWidth, video.videoHeight)
    }
    video.src = url
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-[var(--bg)]">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          w-full max-w-xl aspect-[16/10] rounded-3xl border-2 border-dashed
          flex flex-col items-center justify-center gap-5 cursor-pointer
          transition-all duration-300
          ${dragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01] shadow-2xl shadow-blue-500/10'
            : 'border-[var(--border)] hover:border-[var(--text-secondary)]/50 hover:bg-[var(--surface)]'
          }
        `}
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--border)] flex items-center justify-center shadow-inner">
          <Film size={32} className="text-[var(--text-secondary)]" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-lg font-semibold text-[var(--text)] tracking-tight">
            Drop a video here
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            or click to browse · MP4, WebM, MOV
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <Upload size={13} />
            Stays on device
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} />
            Auto captions
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>
    </div>
  )
}
