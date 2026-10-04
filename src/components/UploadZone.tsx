import { useRef, useState } from 'react'
import { Upload, Film } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'

export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const setVideo = useEditorStore((s) => s.setVideo)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file')
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
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          w-full max-w-lg aspect-video rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center gap-4 cursor-pointer
          transition-smooth
          ${dragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/5'
            : 'border-[var(--border)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface)]'
          }
        `}
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center">
          <Film size={28} className="text-[var(--text-secondary)]" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-[var(--text)]">
            Drop a video here
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            or click to browse · MP4, WebM, MOV
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Upload size={14} />
          <span>Files stay on your device</span>
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
