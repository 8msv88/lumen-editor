export interface CaptionStyle {
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  backgroundColor: string
  backgroundOpacity: number
  textAlign: 'left' | 'center' | 'right'
  position: 'top' | 'center' | 'bottom'
  paddingX: number
  paddingY: number
  borderRadius: number
  textShadow: boolean
  maxWidth: number // percent 40-100
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 28,
  fontWeight: 600,
  color: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  textAlign: 'center',
  position: 'bottom',
  paddingX: 16,
  paddingY: 8,
  borderRadius: 8,
  textShadow: true,
  maxWidth: 85,
}

export interface Caption {
  id: string
  start: number
  end: number
  text: string
}

export interface TextOverlay {
  id: string
  start: number
  end: number
  text: string
  x: number
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
  start: number
  duration: number
  sourceStart?: number
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
  captionStyle: CaptionStyle
  textOverlays: TextOverlay[]
  clips: Clip[]
}

export type Tool = 'select' | 'trim' | 'text' | 'caption'

export const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'SF Pro', value: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' },
  { label: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Courier', value: '"Courier New", Courier, monospace' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
]

export const PRESET_STYLES: { name: string; style: Partial<CaptionStyle> }[] = [
  {
    name: 'Classic',
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 28,
      fontWeight: 600,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundOpacity: 0.7,
      position: 'bottom',
      textShadow: true,
    },
  },
  {
    name: 'Clean',
    style: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      fontSize: 26,
      fontWeight: 500,
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      backgroundOpacity: 0,
      position: 'bottom',
      textShadow: true,
    },
  },
  {
    name: 'Bold',
    style: {
      fontFamily: 'Impact, Haettenschweiler, sans-serif',
      fontSize: 36,
      fontWeight: 700,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundOpacity: 0.85,
      position: 'bottom',
      textShadow: false,
    },
  },
  {
    name: 'Minimal',
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 22,
      fontWeight: 400,
      color: '#F5F5F7',
      backgroundColor: '#1c1c1f',
      backgroundOpacity: 0.9,
      position: 'bottom',
      borderRadius: 12,
      textShadow: false,
    },
  },
  {
    name: 'Top Bar',
    style: {
      fontFamily: 'Roboto, system-ui, sans-serif',
      fontSize: 24,
      fontWeight: 500,
      color: '#FFFFFF',
      backgroundColor: '#0a84ff',
      backgroundOpacity: 0.95,
      position: 'top',
      borderRadius: 0,
      textShadow: false,
    },
  },
]
