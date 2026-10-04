import { create } from 'zustand'
import type { Caption, CaptionStyle, Project, TextOverlay, Tool } from '../types'
import { DEFAULT_CAPTION_STYLE } from '../types'

interface EditorState {
  project: Project
  currentTime: number
  isPlaying: boolean
  selectedTool: Tool
  selectedCaptionId: string | null
  isGeneratingCaptions: boolean
  isExporting: boolean
  exportProgress: number
  zoom: number

  setVideo: (url: string, fileName: string, duration: number, width: number, height: number) => void
  setCurrentTime: (t: number) => void
  setIsPlaying: (p: boolean) => void
  setSelectedTool: (t: Tool) => void
  setCaptions: (c: Caption[]) => void
  addCaption: (c: Caption) => void
  updateCaption: (id: string, patch: Partial<Caption>) => void
  removeCaption: (id: string) => void
  setSelectedCaptionId: (id: string | null) => void
  setIsGeneratingCaptions: (v: boolean) => void
  setCaptionStyle: (style: Partial<CaptionStyle>) => void
  applyPresetStyle: (style: Partial<CaptionStyle>) => void
  addTextOverlay: (t: TextOverlay) => void
  updateTextOverlay: (id: string, patch: Partial<TextOverlay>) => void
  removeTextOverlay: (id: string) => void
  setZoom: (z: number) => void
  setIsExporting: (v: boolean) => void
  setExportProgress: (p: number) => void
  reset: () => void
}

const defaultProject: Project = {
  id: 'default',
  name: 'Untitled Project',
  duration: 0,
  width: 1920,
  height: 1080,
  fps: 30,
  videoUrl: null,
  videoFileName: null,
  captions: [],
  captionStyle: { ...DEFAULT_CAPTION_STYLE },
  textOverlays: [],
  clips: [],
}

export const useEditorStore = create<EditorState>((set) => ({
  project: defaultProject,
  currentTime: 0,
  isPlaying: false,
  selectedTool: 'select',
  selectedCaptionId: null,
  isGeneratingCaptions: false,
  isExporting: false,
  exportProgress: 0,
  zoom: 1,

  setVideo: (url, fileName, duration, width, height) =>
    set({
      project: {
        ...defaultProject,
        videoUrl: url,
        videoFileName: fileName,
        duration,
        width,
        height,
        name: fileName.replace(/\.[^/.]+$/, '') || 'Untitled',
        captionStyle: { ...DEFAULT_CAPTION_STYLE },
      },
      currentTime: 0,
      isPlaying: false,
      selectedCaptionId: null,
    }),

  setCurrentTime: (t) => set({ currentTime: Math.max(0, t) }),
  setIsPlaying: (p) => set({ isPlaying: p }),
  setSelectedTool: (t) => set({ selectedTool: t }),
  setCaptions: (c) => set((s) => ({ project: { ...s.project, captions: c } })),
  addCaption: (c) =>
    set((s) => ({ project: { ...s.project, captions: [...s.project.captions, c] } })),
  updateCaption: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        captions: s.project.captions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
    })),
  removeCaption: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        captions: s.project.captions.filter((c) => c.id !== id),
      },
    })),
  setSelectedCaptionId: (id) => set({ selectedCaptionId: id }),
  setIsGeneratingCaptions: (v) => set({ isGeneratingCaptions: v }),
  setCaptionStyle: (style) =>
    set((s) => ({
      project: {
        ...s.project,
        captionStyle: { ...s.project.captionStyle, ...style },
      },
    })),
  applyPresetStyle: (style) =>
    set((s) => ({
      project: {
        ...s.project,
        captionStyle: { ...s.project.captionStyle, ...style },
      },
    })),
  addTextOverlay: (t) =>
    set((s) => ({
      project: { ...s.project, textOverlays: [...s.project.textOverlays, t] },
    })),
  updateTextOverlay: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        textOverlays: s.project.textOverlays.map((t) =>
          t.id === id ? { ...t, ...patch } : t
        ),
      },
    })),
  removeTextOverlay: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        textOverlays: s.project.textOverlays.filter((t) => t.id !== id),
      },
    })),
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(4, z)) }),
  setIsExporting: (v) => set({ isExporting: v }),
  setExportProgress: (p) => set({ exportProgress: p }),
  reset: () =>
    set({
      project: defaultProject,
      currentTime: 0,
      isPlaying: false,
      selectedCaptionId: null,
      isExporting: false,
      exportProgress: 0,
    }),
}))
