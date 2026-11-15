# MISSION FORGE — Game Design

## 1. Vision

**MISSION FORGE** is an educational space mission engineering simulator. The player
receives a scientific objective — confirm and map water ice at the lunar south pole
— and must achieve it with a spacecraft they design themselves, within a budget, a
mass limit and a compatible launcher.

The game teaches three core ideas:

1. **Engineering is compromise.** Every kilogram spent on science is a kilogram not
   spent on power or propellant.
2. **Systems fail in chains.** A small battery degrades instruments, which degrade
   the data, which degrades the scientific result.
3. **The same decision can be technically valid and scientifically weak.** Passing
   validation does not guarantee meeting the objectives.

The product is single-player, with no backend, authentication, database or
multiplayer. Everything runs in the browser.

## 2. Structure

| # | Phase | Player goal | System |
| --- | --- | --- | --- |
| 01 | Mission Briefing | Understand objectives and constraints | Reading + CTA to design |
| 02 | Spacecraft Design | Choose subsystems | Catalogue, live budget, 3D scene |
| 03 | Mission Validation | Understand what is wrong and why | PASS/WARNING/FAILED review |
| 04 | Launch Control | Choose launcher and authorise | Go/No-Go, payload capacity |
| 05 | Lunar Operations | Manage 7 steps and events | Deterministic simulation with decisions |
| 06 | Mission Debrief | Interpret the result | Report, score, lessons |

Phases 01–04 are preparation. Phase 05 is the only one with randomness — always
deterministic. Phase 06 does not change state: it reads the result.

## 3. Game loop

```
Briefing → Design → Validation ─┬─ critical failures → back to Design
                                └─ launchable → Launch → Operations → Debrief
                                                              ↓
                                                         Try again
```

The player can navigate back at any time, except to Operations before a mission is
in progress. The configuration state persists between phases.

## 4. Components

Six categories, one choice per category except Instruments:

- **Structure** — bus, mass and landing robustness;
- **Power** — solar with battery or RTG, with cost/power trade-offs;
- **Propulsion** — hypergolic, methane/LOX or ion (cruise only);
- **Communication** — high-gain, omnidirectional or redundant package;
- **Scientific Instruments** — five instruments, four objectives;
- **Thermal Control** — MLI + heaters, radiator or RHU.

Each component exposes mass, cost, power, energy, science, data, thermal,
structural and a source note. The catalogue lives in
`src/data/spacecraftComponents.ts`.

### Selection rules

- Structure, power, propulsion, communication and thermal are mutually exclusive
  within their category.
- Instruments accumulate up to `maxCount` per instrument.
- An ion engine has no descent capability and blocks launch.
- A configuration without structure, power, propulsion, communications or thermal
  control fails validation.

## 5. Engineering engine

Separated from the UI, in `src/engine/`:

- `calculations/mass.ts` — dry, propellant and total mass;
- `calculations/budget.ts` — hardware + launcher vs budget;
- `calculations/power.ts` — instantaneous W and daily Wh, peak margin, night need;
- `calculations/science.ts` — science, objective coverage, data, downlink, thermal
  and robustness;
- `calculations/metrics.ts` — aggregation and readiness index (0–100);
- `validators/missionValidator.ts` — mission review;
- `simulation/timeline.ts` — construction of the 7 steps and events;
- `simulation/simulator.ts` — step physics and decision effects;
- `simulation/report.ts` — final report and score;
- `simulation/risk.ts` — risk factors.

### Validation

Every check always returns:

- **severity**: `pass`, `warning` or `failed`;
- **problem**: what is wrong;
- **why**: why it matters;
- **consequence**: what happens during the mission;
- **fix**: how to correct it.

Implemented rules: structure, power source, nominal deficit, peak deficit, battery
for shadow, daily deficit, antenna, bandwidth, descent engine, required
instruments, science capability, total data volume, thermal, mass, budget,
launcher and landing robustness.

A single `failed` check blocks launch (`canLaunch: false`). Warnings do not block,
but they reduce the margin and the reliability score.

## 6. Simulation

### Determinism

The signature is `sorted componentIds + launcher + seed`. The generator is
`mulberry32` seeded with `hashString(signature)`. There is no `Math.random()` in
the engine. Consequences:

- same configuration + same seed + same decisions = same final state;
- the report is reproducible;
- tests compare complete states.

### Step structure

| Step | Type | Instruments |
| --- | --- | --- |
| Trans-lunar cruise | automatic | off |
| Orbit insertion | automatic | off |
| Descent and landing | automatic | off |
| Deployment | decision | on |
| Geological survey | decision | on |
| Sample collection and analysis | decision | on |
| Final transmission | decision | on |

Landing applies deterministic damage based on the structural index and the seed
(`0.04 + (1 − structural/100) × 0.24 + rng × 0.08`).

### Step physics

1. Generate energy (`dailyGenerationWh × stepHours / 24`).
2. Consume the nominal load and, if active, the science load scaled by health.
3. If the battery goes negative, clamp it to zero and degrade health.
4. Collect data if instruments are active, with battery and minimum health.
5. Transmit up to the contact capacity; the rest stays in the buffer.
6. Apply the step's automatic effect and the player's decision.
7. Check completed objectives.
8. Check failures: two consecutive steps with an empty battery, health ≤ 5%, or the
   end of the timeline.

### Events

Six families: contact loss, dust on the radiators, consumption above plan, extended
shadow, instrument fault and final contact window. Each family has 2–3 options with
explicit effects on battery, health, data or communications. Configuration risk
determines the probability of an event appearing (65%, 80% or 95%).

Events are drawn without repetition and deterministically. The player can never
continue a decision step without choosing.

### Objectives

An objective counts as complete when:

1. the instrument that supports it is on board;
2. instrument health is ≥ 45%;
3. at least 40% of the mission's minimum data has been transmitted.

Full success requires every **required** objective and the minimum data volume.
Otherwise the result is `partial`; power or health failures produce `failure`.

## 7. Scoring

```
engineering = readiness (0–100)
science     = completed objectives / total × 70 + science capability × 0.3 × health
efficiency  = transmitted/collected data × 55 + final battery/capacity × 30 + health × 15
reliability = 100 − risk × 0.6 + (launcher reliability × 100 − 90) × 0.5

total = engineering × 0.25 + science × 0.35 + efficiency × 0.20 + reliability × 0.20
```

On failure, the total is multiplied by 0.55. All values are clamped to 0–100.

## 8. Balance

- The 450 M USD budget allows several architectures, but not all of them.
- The 2000 kg maximum mass is generous for a small lander; the real limit is the
  chosen launcher.
- The solar + battery pair is cheaper and more powerful; the RTG is more reliable
  at night and much more expensive.
- The omnidirectional antenna is light, but it cannot downlink the full science
  catalogue in a 120 s contact.
- The cheap thermal system (MLI + heaters) draws 35 W continuously; the RHU is
  almost passive but costs 22 M USD.
- The ion engine is a pedagogical trap: efficient in cruise, invalid for landing.

## 9. Interface and accessibility

- High-contrast dark palette with PASS/WARNING/FAILED states distinguished by
  colour **and** text.
- Responsive layout down to 540 px; the 3D scene moves above the content.
- Buttons with `aria-pressed`, `aria-current`, `role="tab"` and textual labels.
- `prefers-reduced-motion` disables animations.
- The 3D scene is decorative; no decision depends on seeing it.
- No icons without meaning: every icon has adjacent text.

## 10. Performance

- No external assets: the build is self-contained and works offline.
- Low-poly scene with `dpr` capped at 1.6 and no dynamic shadows.
- Global Zustand state to avoid deep re-renders.
- Pure calculations that can be memoised per configuration.
- Production build generated with `vite build`.

## 11. Code structure

```
src/
  components/    3D scene and UI primitives
  data/          mission, components, launch vehicles
  engine/        calculations, validation and simulation (no React)
  phases/        the six interface phases
  store/         Zustand state
  styles/        tokens and structured global CSS
  types/         shared contracts
  App.tsx        shell and navigation
  main.tsx       entry point
```

## 12. Tests

`npm test` runs Vitest against the engine:

- mass, budget, power, science and metric calculations;
- validation of good and invalid configurations, checking all four fields of every
  issue;
- determinism of the timeline, simulator and validation;
- success path with the required objectives;
- failure path from an energy deficit;
- decision requirement on steps with an event;
- report generation and score limits.

## 13. Possible next steps

- Multiple missions and landing sites.
- Side-by-side configuration comparison.
- Challenge mode with additional constraints.
- Report export to PDF/JSON.
- Localisation to other languages.
- Simplified orbital model with explicit delta-v.
