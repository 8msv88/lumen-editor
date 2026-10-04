import { Download, Film, RotateCcw } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { exportVideo } from '../lib/export'

export function Header() {
  const project = useEditorStore((s) => s.project)
  const reset = useEditorStore((s) => s.reset)
  const isPlaying = useEditorStore((s) => s.isPlaying)

  const handleExport = async () => {
    if (!project.videoUrl) return
    try {
      await exportVideo(project)
    } catch (e) {
      console.error(e)
      alert('Export failed. Try a shorter clip or different browser.')
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <Film size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--text)]">
            Lumen
          </h1>
          <p className="text-[11px] text-[var(--text-secondary)] -mt-0.5">
            {project.videoFileName || 'Minimal video editor'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {project.videoUrl && (
          <>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-smooth"
              title="New project"
            >
              <RotateCcw size={14} />
              New
            </button>
            <button
              onClick={handleExport}
              disabled={isPlaying}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-smooth"
            >
              <Download size={14} />
              Export
            </button>
          </>
        )}
      </div>
    </header>
  )
}
