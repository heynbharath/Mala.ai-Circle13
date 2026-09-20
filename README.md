# Nitya

A digital mala for mantra japa meditation. Drag the beads, tap them, or chant out loud — every gesture counts toward your round of 108.

## Core interaction

- **Drag** the mala to spin it; each bead's worth of rotation counts one repetition, and momentum keeps counting through a flick.
- **Tap** anywhere on the scene for a single count.
- **Voice** mode (optional) listens for the full Hare Krishna maha-mantra and counts automatically. It falls back gracefully with an on-screen message on browsers without `SpeechRecognition` support (e.g. iOS Safari).

Every 27 counts rings a light bell; every 108 completes a round, rings a deep bell, and logs a milestone.

## Stack

- Next.js 16 (App Router) + React 19
- `@react-three/fiber` / `three` for the 3D mala
- Dexie (IndexedDB) for session history, used by the in-app stats dashboard
- `@ducanh2912/next-pwa` for offline/installable support

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deployed on Vercel, tracking the `main` branch of this repository. `npm run build` uses `--webpack` (see `vercel.json`) to avoid a Turbopack/next-pwa conflict.
