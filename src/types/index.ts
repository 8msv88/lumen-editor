export interface CaptionWord {
  text: string
  start: number
  end: number
}

export interface CaptionStyle {
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  highlightColor: string
  outlineColor: string
  outlineWidth: number
  backgroundColor: string
  backgroundOpacity: number
  textAlign: 'left' | 'center' | 'right'
  position: 'top' | 'center' | 'bottom'
  paddingX: number
  paddingY: number
  borderRadius: number
  textShadow: boolean
  maxWidth: number
  karaoke: boolean
  uppercase: boolean
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 32,
  fontWeight: 700,
  color: '#FFFFFF',
  highlightColor: '#FFE566',
  outlineColor: '#000000',
  outlineWidth: 3,
  backgroundColor: '#000000',
  backgroundOpacity: 0,
  textAlign: 'center',
  position: 'bottom',
  paddingX: 16,
  paddingY: 10,
  borderRadius: 8,
  textShadow: true,
  maxWidth: 90,
  karaoke: true,
  uppercase: false,
}

export interface Caption {
  id: string
  start: number
  end: number
  text: string
  words?: CaptionWord[]
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
  { label: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Comic Sans', value: '"Comic Sans MS", "Chalkboard SE", cursive' },
]

export const PRESET_STYLES: { name: string; style: Partial<CaptionStyle> }[] = [
  {
    name: 'Karaoke',
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 34,
      fontWeight: 800,
      color: '#FFFFFF',
      highlightColor: '#FFE566',
      outlineColor: '#000000',
      outlineWidth: 4,
      backgroundOpacity: 0,
      position: 'bottom',
      karaoke: true,
      uppercase: false,
      textShadow: false,
    },
  },
  {
    name: 'Neon',
    style: {
      fontFamily: 'Montserrat, system-ui, sans-serif',
      fontSize: 32,
      fontWeight: 700,
      color: '#00FFD1',
      highlightColor: '#FF00E5',
      outlineColor: '#000000',
      outlineWidth: 2,
      backgroundOpacity: 0,
      position: 'bottom',
      karaoke: true,
      textShadow: true,
    },
  },
  {
    name: 'Bold Outline',
    style: {
      fontFamily: 'Impact, Haettenschweiler, sans-serif',
      fontSize: 40,
      fontWeight: 700,
      color: '#FFFFFF',
      highlightColor: '#FFD60A',
      outlineColor: '#000000',
      outlineWidth: 5,
      backgroundOpacity: 0,
      position: 'bottom',
      karaoke: true,
      uppercase: true,
      textShadow: false,
    },
  },
  {
    name: 'Classic Box',
    style: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 28,
      fontWeight: 600,
      color: '#FFFFFF',
      highlightColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 0,
      backgroundColor: '#000000',
      backgroundOpacity: 0.75,
      position: 'bottom',
      borderRadius: 8,
      karaoke: false,
      uppercase: false,
      textShadow: false,
    },
  },
  {
    name: 'Clean',
    style: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      fontSize: 26,
      fontWeight: 500,
      color: '#FFFFFF',
      highlightColor: '#FFFFFF',
      outlineColor: '#000000',
      outlineWidth: 2,
      backgroundOpacity: 0,
      position: 'bottom',
      karaoke: false,
      textShadow: true,
    },
  },
  {
    name: 'TikTok',
    style: {
      fontFamily: 'Montserrat, system-ui, sans-serif',
      fontSize: 36,
      fontWeight: 800,
      color: '#FFFFFF',
      highlightColor: '#39E508',
      outlineColor: '#000000',
      outlineWidth: 4,
      backgroundOpacity: 0,
      position: 'center',
      karaoke: true,
      uppercase: false,
      textShadow: false,
    },
  },
  {
    name: 'Top Bar',
    style: {
      fontFamily: 'Roboto, system-ui, sans-serif',
      fontSize: 24,
      fontWeight: 600,
      color: '#FFFFFF',
      highlightColor: '#FFFFFF',
      outlineWidth: 0,
      backgroundColor: '#0a84ff',
      backgroundOpacity: 0.95,
      position: 'top',
      borderRadius: 0,
      karaoke: false,
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
      highlightColor: '#F5F5F7',
      outlineWidth: 0,
      backgroundColor: '#1c1c1f',
      backgroundOpacity: 0.9,
      position: 'bottom',
      borderRadius: 12,
      karaoke: false,
      textShadow: false,
    },
  },
]
