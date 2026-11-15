import { useEffect } from 'react';
import {
  Compass,
  FlaskConical,
  Rocket,
  ShieldCheck,
  SquarePen,
  Satellite,
} from 'lucide-react';
import { useMissionStore } from './store/missionStore';
import { LUNAR_ICE_EXPLORER } from './data/mission';
import { SpacecraftScene } from './components/SpacecraftScene';
import { BriefingPhase } from './phases/BriefingPhase';
import { DesignPhase } from './phases/DesignPhase';
import { ValidationPhase } from './phases/ValidationPhase';
import { LaunchPhase } from './phases/LaunchPhase';
import { OperationsPhase } from './phases/OperationsPhase';
import { DebriefPhase } from './phases/DebriefPhase';
import type { PhaseId } from './types';

const PHASES: Array<{ id: PhaseId; label: string; index: string; icon: typeof Compass }> = [
  { id: 'briefing', label: 'Mission Briefing', index: '01', icon: Compass },
  { id: 'design', label: 'Spacecraft Design', index: '02', icon: SquarePen },
  { id: 'validation', label: 'Mission Validation', index: '03', icon: ShieldCheck },
  { id: 'launch', label: 'Launch Control', index: '04', icon: Rocket },
  { id: 'operations', label: 'Lunar Operations', index: '05', icon: FlaskConical },
  { id: 'debrief', label: 'Mission Debrief', index: '06', icon: Satellite },
];

function App() {
  const phase = useMissionStore((state) => state.phase);
  const setPhase = useMissionStore((state) => state.setPhase);
  const sim = useMissionStore((state) => state.sim);
  const report = useMissionStore((state) => state.report);

  // Keep the document title in sync with the product identity.
  useEffect(() => {
    document.title = 'MISSION FORGE — Lunar Ice Explorer';
  }, []);

  const missionActive = Boolean(sim) && !sim?.finished;

  const canEnter = (target: PhaseId): boolean => {
    if (target === 'operations') return Boolean(sim) && !sim?.finished;
    if (target === 'debrief') return Boolean(report);
    // The spacecraft is frozen while a mission is in progress: editing it would
    // make the running simulation inconsistent with the design screen.
    return !missionActive;
  };

  const showScene = phase === 'design' || phase === 'launch' || phase === 'operations';

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPhase('briefing')} type="button">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <span className="brand-name">MISSION FORGE</span>
            <span className="brand-sub">Lunar engineering simulator</span>
          </span>
        </button>

        <div className="mission-chip">
          <span className="mission-chip-dot" aria-hidden="true" />
          <span className="mission-chip-code">{LUNAR_ICE_EXPLORER.codename}</span>
          <span className="mission-chip-dest">{LUNAR_ICE_EXPLORER.destination}</span>
        </div>
      </header>

      <nav className="stepper" aria-label="Mission phases">
        {PHASES.map((item) => {
          const Icon = item.icon;
          const active = phase === item.id;
          const enabled = canEnter(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`step ${active ? 'is-active' : ''}`}
              disabled={!enabled}
              aria-current={active ? 'step' : undefined}
              title={
                !enabled
                  ? missionActive
                    ? 'Finish the mission in progress first'
                    : 'Complete a mission to unlock this phase'
                  : undefined
              }
              onClick={() => enabled && setPhase(item.id)}
            >
              <span className="step-index">{item.index}</span>
              <Icon size={16} aria-hidden="true" />
              <span className="step-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <main className={`workspace ${showScene ? 'has-scene' : ''}`}>
        <section className="phase-area">
          {phase === 'briefing' && <BriefingPhase />}
          {phase === 'design' && <DesignPhase />}
          {phase === 'validation' && <ValidationPhase />}
          {phase === 'launch' && <LaunchPhase />}
          {phase === 'operations' && <OperationsPhase />}
          {phase === 'debrief' && <DebriefPhase />}
        </section>

        {showScene && (
          <aside className="scene-panel" aria-label="3D spacecraft view">
            <SpacecraftScene />
            <div className="scene-caption">
              <span>Engineering view</span>
              <span className="scene-hint">Drag to rotate</span>
            </div>
          </aside>
        )}
      </main>

      <footer className="app-footer">
        <span>MISSION FORGE · educational prototype for the NASA Space Apps Challenge 2026</span>
        <span>Independent project. Not affiliated with or sponsored by NASA.</span>
      </footer>
    </div>
  );
}

export default App;
