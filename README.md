# Lumen

**Minimal, privacy-first web video editor** — CapCut simplicity meets Apple design.

Upload a video → **auto-generate captions from the actual speech** → style them → export a finished video with captions burned in. Everything runs in the browser. Your footage never leaves the device.

## Features

- **Upload** — drag & drop or click (MP4, WebM, MOV)
- **Real auto captions** — on-device Whisper (`whisper-tiny.en`) transcribes the video’s audio track with timestamps
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

## Auto captions

Click **Auto Captions**. Lumen will:

1. Download the Whisper model once (~40 MB, cached in the browser)
2. Extract audio from your video
3. Transcribe speech with timestamps
4. Place editable captions on the timeline

Requires a video with a clear audio / speech track. English is optimized (`whisper-tiny.en`). For other languages, switch the model in `src/lib/captions.ts` to `Xenova/whisper-tiny` or `Xenova/whisper-base`.

First run is slower while the model downloads; later runs reuse the cache.

## Export

Click **Export**. Lumen plays the video on a canvas, draws each caption with your style, and records the result. Best in Chrome or Edge.

## Caption styling

Open the **Style** tab:

- Presets: Classic, Clean, Bold, Minimal, Top Bar
- Font, size, weight, colors, opacity
- Position, alignment, shadow, max width

## Deploy

Import the repo on [Vercel](https://vercel.com) — zero config.

```bash
npx vercel
```

## Tech

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 + Zustand
- `@xenova/transformers` (Whisper in-browser)
- Canvas + MediaRecorder for export

## License

MIT
