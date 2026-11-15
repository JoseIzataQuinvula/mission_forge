# Assets and licences

## 1. Visual assets

MISSION FORGE uses no external 3D models, textures, images, videos, audio or
fonts. The entire scene is generated procedurally at runtime with Three.js
primitives:

- low-resolution lunar sphere with deterministic vertex displacement;
- rocks as low-poly icosahedra;
- lander built from boxes, cylinders, cones and spheres;
- solar panels, antenna, RTG and instruments positioned in code;
- stars as `Points` with deterministic positions;
- Earth as a sphere with an emissive material.

Consequences:

- there are no third-party licences for models or textures;
- there are no runtime asset downloads;
- the scene works offline after the build;
- the visual style is intentionally stylised, not photorealistic.

Colours follow the palette defined in the product brief:

| Token | Hex | Use |
| --- | --- | --- |
| Background | `#080D16` | Application and space background |
| Surface | `#111B2A` | Panels and cards |
| Text | `#F1F5F9` | Primary text |
| Secondary text | `#94A3B8` | Captions and metadata |
| Accent | `#39BDF8` | Action, selection, telemetry |
| Success | `#22C55E` | PASS, completed objectives |
| Warning | `#F59E0B` | WARNING, reduced margins |
| Error | `#EF4444` | FAILED, critical failures |

## 2. Libraries and licences

| Dependency | Version | Licence | Use |
| --- | --- | --- | --- |
| React | 18.3.1 | MIT | Interface |
| React DOM | 18.3.1 | MIT | Rendering |
| Vite | 5.4.x | MIT | Build and dev server |
| TypeScript | 5.6.x | Apache-2.0 | Typing |
| Three.js | 0.169.x | MIT | 3D rendering |
| @react-three/fiber | 8.17.x | MIT | React/Three integration |
| Zustand | 4.5.x | MIT | Application state |
| Lucide React | 0.454.x | ISC | Icons |
| Vitest | 2.1.x | MIT | Tests |
| @vitejs/plugin-react | 4.3.x | MIT | React plugin |

The full licence for each package is available at `node_modules/<package>/LICENSE`
after `npm install`. No dependency has been modified.

## 3. Typography

The interface uses the system font stack (`Inter`, `Segoe UI`, `system-ui`,
`-apple-system`) and a system monospace stack for telemetry (`JetBrains Mono`,
`Cascadia Code`, `ui-monospace`, `Consolas`). No web fonts are loaded, so there is
no font licence to distribute.

## 4. Icons

All icons come from Lucide React (ISC licence). No agency, company or mission logos
were used.

## 5. NASA and the Space Apps Challenge

MISSION FORGE was created as an entry for the NASA Space Apps Challenge 2026. The
reference to the challenge is descriptive. This project:

- is not affiliated with, sponsored or endorsed by NASA;
- does not use NASA's logo, seal or official visual identity;
- does not present its results as official mission data;
- clearly identifies illustrative values in the catalogue and documentation.

Mention of the challenge does not imply endorsement. Any third-party trademarks
belong to their respective owners.
