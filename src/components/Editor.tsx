import { Header } from './Header'
import { Preview } from './Preview'
import { Timeline } from './Timeline'
import { Toolbar } from './Toolbar'
import { CaptionsPanel } from './CaptionsPanel'
import { useEditorStore } from '../store/editorStore'
import { UploadZone } from './UploadZone'

export function Editor() {
  const videoUrl = useEditorStore((s) => s.project.videoUrl)

  if (!videoUrl) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <UploadZone />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Header />
      <div className="flex-1 flex min-h-0">
        {/* Left toolbar */}
        <Toolbar />

        {/* Center: Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          <Preview />
          <Timeline />
        </div>

        {/* Right panel: Captions */}
        <CaptionsPanel />
      </div>
    </div>
  )
}
