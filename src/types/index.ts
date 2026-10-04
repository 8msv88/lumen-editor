export interface Caption {
  id: string
  start: number // seconds
  end: number
  text: string
}

export interface TextOverlay {
  id: string
  start: number
  end: number
  text: string
  x: number // 0-100 %
  y: number
  fontSize: number
  color: string
  fontWeight: number
  background?: string
}

export interface Clip {
  id: string
  type: 'video' | 'audio' | 'text' | 'caption'
  sourceUrl?: string
  start: number // on timeline
  duration: number
  sourceStart?: number // trim start in source
  sourceEnd?: number
  name?: string
}

export interface Project {
  id: string
  name: string
  duration: number
  width: number
  height: number
  fps: number
  videoUrl: string | null
  videoFileName: string | null
  captions: Caption[]
  textOverlays: TextOverlay[]
  clips: Clip[]
}

export type Tool = 'select' | 'trim' | 'text' | 'caption'
