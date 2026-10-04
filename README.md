# Lumen

**Minimal, privacy-first web video editor** — CapCut simplicity meets Apple design.

Upload a video, auto-generate captions, trim on a clean timeline, and export. Everything runs in the browser. Your footage never leaves the device.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![React](https://img.shields.io/badge/React-19-61dafb)

## Features

- **Upload** — drag & drop or click. MP4, WebM, MOV
- **Auto Captions** — one-click generation (demo mode included; easy to swap for real Whisper)
- **Timeline** — scrub, zoom, click-to-seek, caption blocks
- **Caption editor** — edit text, start/end times, delete
- **Preview** — live caption overlay while playing
- **Export** — original video + SRT subtitles
- **Privacy** — 100% client-side. No accounts, no uploads, no tracking
- **UI** — dark, minimal, Apple-inspired (SF Pro feel, soft radius, clear hierarchy)

## Quick start

```bash
git clone https://github.com/8msv88/lumen-editor.git
cd lumen-editor
npm install
npm run dev
```

Open http://localhost:5173

## Deploy

### Vercel (recommended)

1. Push this repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Deploy — zero config

Or from CLI:

```bash
npx vercel
```

### GitHub Pages

```bash
npm run build
# serve the `dist` folder (or use GitHub Actions with peaceiris/actions-gh-pages)
```

Set `base` in `vite.config.ts` if deploying to a sub-path.

## Project structure

```
src/
  components/     # UI: Editor, Preview, Timeline, CaptionsPanel, Toolbar…
  store/          # Zustand state
  lib/            # captions, export, utils
  types/          # shared TypeScript types
```

## Adding real auto-captions

The current `generateCaptions` in `src/lib/captions.ts` creates sensible demo captions so the UI is fully usable offline.

To use real speech-to-text:

### Option A — Local Whisper (recommended for privacy)

```bash
npm install @xenova/transformers
```

Then replace the body of `generateCaptions` with a pipeline call (see comments in the file). Models download once and cache in the browser.

### Option B — Cloud API

Send the audio track to AssemblyAI, Deepgram, or OpenAI Whisper from a tiny serverless function, return timed segments, map to `Caption[]`.

## Roadmap (easy next steps)

- [ ] Real Whisper integration
- [ ] Multi-track (audio + video)
- [ ] Trim / split clips
- [ ] Text overlays with style panel
- [ ] Transitions (fade, dissolve)
- [ ] Burn-in captions on export (ffmpeg.wasm or WebCodecs)
- [ ] Project save/load (IndexedDB)
- [ ] Keyboard shortcuts (Space, J/K/L, arrows)

## Tech

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Zustand
- Lucide icons

## License

MIT — free for personal and commercial use.

---

Built for creators who want a clean, fast editor without the bloat or the cloud.
