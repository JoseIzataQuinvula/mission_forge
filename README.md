# MISSION FORGE — Lunar Ice Explorer

An educational space mission engineering simulator built for the **NASA Space Apps
Challenge 2026**. The player sizes a spacecraft, validates the architecture, chooses
a launcher and manages seven steps of lunar operations to confirm water ice at the
lunar south pole.

> Independent project. Not affiliated with, sponsored or endorsed by NASA.

## Live demo

**https://mission-forge-sigma.vercel.app/**

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for deployment details.

## Requirements

- Node.js 18 or newer
- Chrome (or any modern browser with WebGL)

## Commands

```bash
npm install
npm run dev       # development server
npm run build     # typecheck + production build
npm run preview   # serve the production build
npm test          # engine tests (Vitest)
npm run typecheck # TypeScript verification
```

## How to play

1. **Mission Briefing** — read the objectives and constraints.
2. **Spacecraft Design** — choose structure, power, propulsion, communications,
   instruments and thermal control. Indicators update in real time.
3. **Mission Validation** — resolve every `FAILED` check. Warnings do not block,
   but they reduce the margin.
4. **Launch Control** — choose a compatible launcher and start the mission.
5. **Lunar Operations** — execute the steps and decide when events occur.
6. **Mission Debrief** — review objectives, telemetry, score and lessons.

The simulation is deterministic: the same configuration, seed and decisions always
produce the same result.

## Structure

```
src/
  components/   procedural 3D scene and UI primitives
  data/         mission, components and launch vehicles
  engine/       calculations, validation, simulation and report (no React)
  phases/       the six phases
  store/        Zustand state
  styles/       tokens and global CSS
  types/        shared contracts
docs/
  DEPLOYMENT.md
  SCIENCE_SOURCES.md
  ASSETS_LICENSES.md
  GAME_DESIGN.md
```

## Stack

React 18, TypeScript, Vite, Three.js, React Three Fiber, Zustand, Lucide React and
Vitest. No backend, authentication, database or multiplayer.

## Data

Values marked **illustrative** are gameplay estimates. Values marked
**heritage-based** use orders of magnitude from real hardware. See
[`docs/SCIENCE_SOURCES.md`](docs/SCIENCE_SOURCES.md) and
[`docs/ASSETS_LICENSES.md`](docs/ASSETS_LICENSES.md).
