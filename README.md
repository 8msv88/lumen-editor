# Lumen

**Minimal, privacy-first web video editor** — CapCut simplicity meets Apple design.

Upload a video → auto-generate captions → style them → **export a finished video with captions burned in**. Everything runs in the browser. Your footage never leaves the device.

## Features

- **Upload** — drag & drop or click (MP4, WebM, MOV)
- **Auto Captions** — one-click generation (demo mode + easy Whisper hook)
- **Caption styles** — fonts, size, weight, colors, background, position, alignment, shadow, presets
- **Live preview** — captions render with full styling while you scrub/play
- **Timeline** — scrub, zoom, caption blocks, click-to-select
- **Export** — burns captions into the video (canvas + MediaRecorder) → downloads a WebM
- **Privacy** — 100% client-side. No accounts, no uploads, no tracking
- **UI** — dark, refined, Apple-inspired

## Quick start

```bash
git clone https://github.com/8msv88/lumen-editor.git
cd lumen-editor
npm install
npm run dev
```

Open http://localhost:5173

## Export

Click **Export**. Lumen plays the video on a hidden canvas, draws each caption with your chosen style, and records the result with `MediaRecorder`. The finished file downloads automatically (usually WebM/VP9).

Best results in Chrome or Edge. Audio is included when the browser allows it.

## Caption styling

Open the **Style** tab in the right panel:

- Presets: Classic, Clean, Bold, Minimal, Top Bar
- Font family, size, weight
- Text + background color + opacity
- Position (top / center / bottom)
- Alignment
- Text shadow toggle
- Max width

Changes appear instantly on the preview.

## Deploy

### Vercel

Import the GitHub repo → Deploy. Zero config.

```bash
npx vercel
```

## Tech

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Zustand
- Canvas + MediaRecorder for export
- Lucide icons

## Adding real speech-to-text

See comments in `src/lib/captions.ts`. Swap the demo generator for `@xenova/transformers` (Whisper) or a cloud STT API.

## License

MIT
