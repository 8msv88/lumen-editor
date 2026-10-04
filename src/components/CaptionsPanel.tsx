import { useState } from 'react'
import { Captions, Loader2, Plus, Trash2, Sparkles } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { uid } from '../lib/utils'
import { generateCaptions } from '../lib/captions'
import clsx from 'clsx'

export function CaptionsPanel() {
  const project = useEditorStore((s) => s.project)
  const selectedCaptionId = useEditorStore((s) => s.selectedCaptionId)
  const setSelectedCaptionId = useEditorStore((s) => s.setSelectedCaptionId)
  const setCaptions = useEditorStore((s) => s.setCaptions)
  const updateCaption = useEditorStore((s) => s.updateCaption)
  const removeCaption = useEditorStore((s) => s.removeCaption)
  const addCaption = useEditorStore((s) => s.addCaption)
  const isGenerating = useEditorStore((s) => s.isGeneratingCaptions)
  const setIsGenerating = useEditorStore((s) => s.setIsGeneratingCaptions)
  const currentTime = useEditorStore((s) => s.currentTime)
  const [error, setError] = useState<string | null>(null)

  const handleAutoCaptions = async () => {
    if (!project.videoUrl) return
    setIsGenerating(true)
    setError(null)
    try {
      const captions = await generateCaptions(project.videoUrl, project.duration)
      setCaptions(captions)
    } catch (e) {
      console.error(e)
      setError('Could not generate captions. Using demo captions instead.')
      // Fallback demo captions
      const demo = [
        { id: uid(), start: 0, end: 2.5, text: 'Welcome to Lumen' },
        { id: uid(), start: 2.5, end: 5, text: 'Auto captions demo' },
        { id: uid(), start: 5, end: Math.min(8, project.duration), text: 'Edit me in the panel →' },
      ].filter((c) => c.end <= project.duration)
      setCaptions(demo)
    } finally {
      setIsGenerating(false)
    }
  }

  const addManual = () => {
    const start = currentTime
    const end = Math.min(currentTime + 3, project.duration)
    const c = { id: uid(), start, end, text: 'New caption' }
    addCaption(c)
    setSelectedCaptionId(c.id)
  }

  const selected = project.captions.find((c) => c.id === selectedCaptionId)

  return (
    <aside className="w-72 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
      <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Captions size={16} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-medium">Captions</span>
        </div>
        <span className="text-[11px] text-[var(--text-secondary)]">
          {project.captions.length}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <button
          onClick={handleAutoCaptions}
          disabled={isGenerating || !project.videoUrl}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-smooth"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Auto Captions
            </>
          )}
        </button>
        <button
          onClick={addManual}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-smooth"
        >
          <Plus size={16} />
          Add caption
        </button>
        {error && (
          <p className="text-[11px] text-amber-400/90 leading-snug">{error}</p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {project.captions.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)] text-center py-8">
            No captions yet.<br />Try Auto Captions.
          </p>
        )}
        {project.captions
          .slice()
          .sort((a, b) => a.start - b.start)
          .map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCaptionId(c.id)}
              className={clsx(
                'p-2.5 rounded-xl cursor-pointer transition-smooth group',
                selectedCaptionId === c.id
                  ? 'bg-[var(--accent)]/15 border border-[var(--accent)]/40'
                  : 'hover:bg-[var(--surface-2)] border border-transparent'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-[var(--text)] line-clamp-2 flex-1">
                  {c.text || 'Empty'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCaption(c.id)
                    if (selectedCaptionId === c.id) setSelectedCaptionId(null)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-smooth"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono">
                {c.start.toFixed(1)}s – {c.end.toFixed(1)}s
              </p>
            </div>
          ))}
      </div>

      {/* Editor for selected */}
      {selected && (
        <div className="border-t border-[var(--border)] p-3 space-y-2 bg-[var(--surface-2)]">
          <label className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider">
            Edit caption
          </label>
          <textarea
            value={selected.text}
            onChange={(e) => updateCaption(selected.id, { text: e.target.value })}
            rows={3}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-secondary)]">Start</label>
              <input
                type="number"
                step="0.1"
                value={selected.start}
                onChange={(e) =>
                  updateCaption(selected.id, { start: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-secondary)]">End</label>
              <input
                type="number"
                step="0.1"
                value={selected.end}
                onChange={(e) =>
                  updateCaption(selected.id, { end: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
