import { MousePointer2, Scissors, Type, Captions } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import type { Tool } from '../types'
import clsx from 'clsx'

const tools: { id: Tool; icon: typeof MousePointer2; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'trim', icon: Scissors, label: 'Trim' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'caption', icon: Captions, label: 'Captions' },
]

export function Toolbar() {
  const selectedTool = useEditorStore((s) => s.selectedTool)
  const setSelectedTool = useEditorStore((s) => s.setSelectedTool)

  return (
    <aside className="w-14 flex flex-col items-center py-4 gap-1 border-r border-[var(--border)] bg-[var(--surface)] shrink-0">
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setSelectedTool(id)}
          title={label}
          className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-smooth',
            selectedTool === id
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
          )}
        >
          <Icon size={18} />
        </button>
      ))}
    </aside>
  )
}
