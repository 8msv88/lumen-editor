import { useState } from 'react'
import {
  Captions,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { uid } from '../lib/utils'
import { generateCaptions } from '../lib/captions'
import { FONT_OPTIONS, PRESET_STYLES } from '../types'
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
  const setCaptionStyle = useEditorStore((s) => s.setCaptionStyle)
  const applyPresetStyle = useEditorStore((s) => s.applyPresetStyle)
  const currentTime = useEditorStore((s) => s.currentTime)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'list' | 'style'>('list')

  const style = project.captionStyle

  const handleAutoCaptions = async () => {
    if (!project.videoUrl) return
    setIsGenerating(true)
    setError(null)
    try {
      const captions = await generateCaptions(project.videoUrl, project.duration)
      setCaptions(captions)
      setTab('list')
    } catch (e) {
      console.error(e)
      setError('Demo captions applied. Real STT can be wired later.')
      const demo = [
        { id: uid(), start: 0, end: 2.5, text: 'Welcome to Lumen' },
        { id: uid(), start: 2.5, end: 5, text: 'Edit text and style freely' },
        { id: uid(), start: 5, end: Math.min(8, project.duration), text: 'Export burns captions in' },
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
    setTab('list')
  }

  const selected = project.captions.find((c) => c.id === selectedCaptionId)

  return (
    <aside className="w-80 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
      <div className="h-12 flex items-center px-2 border-b border-[var(--border)] gap-1">
        <button
          onClick={() => setTab('list')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-smooth',
            tab === 'list'
              ? 'bg-[var(--surface-2)] text-[var(--text)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          )}
        >
          <Captions size={14} />
          Captions
          {project.captions.length > 0 && (
            <span className="ml-0.5 text-[10px] opacity-60">{project.captions.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('style')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-smooth',
            tab === 'style'
              ? 'bg-[var(--surface-2)] text-[var(--text)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
          )}
        >
          <Type size={14} />
          Style
        </button>
      </div>

      {tab === 'list' ? (
        <>
          <div className="p-3 flex flex-col gap-2">
            <button
              onClick={handleAutoCaptions}
              disabled={isGenerating || !project.videoUrl}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-smooth shadow-lg shadow-blue-500/10"
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

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {project.captions.length === 0 && (
              <p className="text-xs text-[var(--text-secondary)] text-center py-10 leading-relaxed">
                No captions yet.<br />
                Generate or add manually.
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
                    <p className="text-xs text-[var(--text)] line-clamp-2 flex-1 leading-snug">
                      {c.text || 'Empty'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCaption(c.id)
                        if (selectedCaptionId === c.id) setSelectedCaptionId(null)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-smooth"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 font-mono tabular-nums">
                    {c.start.toFixed(1)}s – {c.end.toFixed(1)}s
                  </p>
                </div>
              ))}
          </div>

          {selected && (
            <div className="border-t border-[var(--border)] p-3 space-y-2.5 bg-[var(--surface-2)]">
              <label className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium">
                Edit text
              </label>
              <textarea
                value={selected.text}
                onChange={(e) => updateCaption(selected.id, { text: e.target.value })}
                rows={2}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm text-[var(--text)] resize-none focus:outline-none focus:border-[var(--accent)] transition-smooth"
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
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium mb-2 block">
              Presets
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_STYLES.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPresetStyle(p.style)}
                  className="py-2 px-2.5 rounded-lg text-xs bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-smooth text-left"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium mb-1.5 block">
              Font
            </label>
            <div className="relative">
              <select
                value={style.fontFamily}
                onChange={(e) => setCaptionStyle({ fontFamily: e.target.value })}
                className="w-full appearance-none bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] pr-8"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">
                Size · {style.fontSize}px
              </label>
              <input
                type="range"
                min={16}
                max={64}
                value={style.fontSize}
                onChange={(e) => setCaptionStyle({ fontSize: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">
                Weight · {style.fontWeight}
              </label>
              <input
                type="range"
                min={300}
                max={800}
                step={100}
                value={style.fontWeight}
                onChange={(e) => setCaptionStyle({ fontWeight: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-secondary)] mb-1.5 block">Text color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.color}
                  onChange={(e) => setCaptionStyle({ color: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-[var(--text-secondary)]">{style.color}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-secondary)] mb-1.5 block">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => setCaptionStyle({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-[var(--text-secondary)]">{style.backgroundColor}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">
              Background opacity · {Math.round(style.backgroundOpacity * 100)}%
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={style.backgroundOpacity}
              onChange={(e) => setCaptionStyle({ backgroundOpacity: parseFloat(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium mb-1.5 block">
              Position
            </label>
            <div className="flex gap-1">
              {(['top', 'center', 'bottom'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setCaptionStyle({ position: pos })}
                  className={clsx(
                    'flex-1 py-1.5 rounded-lg text-xs capitalize transition-smooth',
                    style.position === pos
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium mb-1.5 block">
              Align
            </label>
            <div className="flex gap-1">
              {(
                [
                  { v: 'left' as const, icon: AlignLeft },
                  { v: 'center' as const, icon: AlignCenter },
                  { v: 'right' as const, icon: AlignRight },
                ]
              ).map(({ v, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setCaptionStyle({ textAlign: v })}
                  className={clsx(
                    'flex-1 py-2 rounded-lg flex items-center justify-center transition-smooth',
                    style.textAlign === v
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                  )}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-[var(--text-secondary)]">Text shadow</span>
            <button
              onClick={() => setCaptionStyle({ textShadow: !style.textShadow })}
              className={clsx(
                'w-10 h-6 rounded-full transition-smooth relative',
                style.textShadow ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
              )}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-smooth"
                style={{ left: style.textShadow ? '18px' : '2px' }}
              />
            </button>
          </label>

          <div>
            <label className="text-[10px] text-[var(--text-secondary)] mb-1 block">
              Max width · {style.maxWidth}%
            </label>
            <input
              type="range"
              min={40}
              max={100}
              value={style.maxWidth}
              onChange={(e) => setCaptionStyle({ maxWidth: parseInt(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        </div>
      )}
    </aside>
  )
}
