import { Download, Film, RotateCcw, Loader2 } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { exportVideo } from '../lib/export'

export function Header() {
  const project = useEditorStore((s) => s.project)
  const reset = useEditorStore((s) => s.reset)
  const isPlaying = useEditorStore((s) => s.isPlaying)
  const isExporting = useEditorStore((s) => s.isExporting)
  const exportProgress = useEditorStore((s) => s.exportProgress)
  const setIsExporting = useEditorStore((s) => s.setIsExporting)
  const setExportProgress = useEditorStore((s) => s.setExportProgress)
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying)

  const handleExport = async () => {
    if (!project.videoUrl || isExporting) return
    setIsPlaying(false)
    setIsExporting(true)
    setExportProgress(0)
    try {
      await exportVideo(project, (p) => setExportProgress(p))
    } catch (e) {
      console.error(e)
      alert('Export failed. Try Chrome/Edge for best results, or a shorter clip.')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-5 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shrink-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <Film size={15} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--text)] leading-none">
            Lumen
          </h1>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate max-w-[180px]">
            {project.videoFileName || 'Minimal video editor'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {project.videoUrl && (
          <>
            <button
              onClick={reset}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-smooth disabled:opacity-40"
              title="New project"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              onClick={handleExport}
              disabled={isPlaying || isExporting}
              className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-smooth overflow-hidden min-w-[100px] justify-center shadow-lg shadow-blue-500/15"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {Math.round(exportProgress * 100)}%
                </>
              ) : (
                <>
                  <Download size={14} />
                  Export
                </>
              )}
              {isExporting && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-white/40 transition-all duration-200"
                  style={{ width: `${exportProgress * 100}%` }}
                />
              )}
            </button>
          </>
        )}
      </div>
    </header>
  )
}
