import { useEffect, useState } from 'react';
import {
  Activity,
  BatteryMedium,
  CircleAlert,
  Database,
  HardDriveDownload,
  RadioTower,
  Thermometer,
  WifiOff,
} from 'lucide-react';
import { LUNAR_ICE_EXPLORER } from '../data/mission';
import { useMetrics, useMissionStore } from '../store/missionStore';
import { SectionTitle } from '../components/ui';

export function OperationsPhase() {
  const sim = useMissionStore((state) => state.sim);
  const timeline = useMissionStore((state) => state.timeline);
  const advance = useMissionStore((state) => state.advance);
  const setPhase = useMissionStore((state) => state.setPhase);
  const metrics = useMetrics();

  const step = sim ? timeline[sim.stepIndex] : undefined;
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    setChoice(null);
  }, [sim?.stepIndex]);

  if (!sim) {
    return (
      <div className="phase operations">
        <p className="empty-note">No mission in progress.</p>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="phase operations">
        <p className="empty-note">This mission is already complete.</p>
        <button className="btn btn-primary" type="button" onClick={() => setPhase('debrief')}>
          Open mission debrief
        </button>
      </div>
    );
  }

  const batteryPct = sim.batteryCapacityWh > 0 ? Math.round((sim.batteryWh / sim.batteryCapacityWh) * 100) : 0;
  const healthPct = Math.round(sim.instrumentHealth * 100);
  const dataPct = Math.min(100, Math.round((sim.dataTransmittedMbit / LUNAR_ICE_EXPLORER.requiredDataMbit) * 100));
  const pendingMbit = Math.max(0, sim.dataCollectedMbit - sim.dataTransmittedMbit);

  const canProceed = step.kind === 'auto' || !step.event || Boolean(choice);

  return (
    <div className="phase operations">
      <header className="phase-head">
        <div>
          <span className="eyebrow">Phase 05 · lunar operations</span>
          <h1>Lunar Operations</h1>
          <p>Step {sim.stepIndex + 1} of {timeline.length} · seed {sim.seed}</p>
        </div>
        <span className={`comms-chip ${sim.commsOnline ? 'is-online' : 'is-offline'}`}>
          {sim.commsOnline ? <RadioTower size={15} aria-hidden="true" /> : <WifiOff size={15} aria-hidden="true" />}
          {sim.commsOnline ? 'Contact with Earth' : 'No contact'}
        </span>
      </header>

      <div className="telemetry">
        <div className="telemetry-item">
          <span className="telemetry-label"><BatteryMedium size={14} aria-hidden="true" />Battery</span>
          <strong>{Math.round(sim.batteryWh)} Wh</strong>
          <div className={`meter ${batteryPct < 25 ? 'is-danger' : batteryPct < 50 ? 'is-warn' : 'is-ok'}`}>
            <span style={{ width: `${Math.max(0, batteryPct)}%` }} />
          </div>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label"><Thermometer size={14} aria-hidden="true" />Instrument health</span>
          <strong>{healthPct}%</strong>
          <div className={`meter ${healthPct < 40 ? 'is-danger' : healthPct < 70 ? 'is-warn' : 'is-ok'}`}>
            <span style={{ width: `${healthPct}%` }} />
          </div>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label"><Database size={14} aria-hidden="true" />Data on Earth</span>
          <strong>{Math.round(sim.dataTransmittedMbit)} / {LUNAR_ICE_EXPLORER.requiredDataMbit} Mbit</strong>
          <div className={`meter ${dataPct < 40 ? 'is-danger' : dataPct < 80 ? 'is-warn' : 'is-ok'}`}>
            <span style={{ width: `${dataPct}%` }} />
          </div>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label"><HardDriveDownload size={14} aria-hidden="true" />Onboard buffer</span>
          <strong>{Math.round(pendingMbit)} Mbit</strong>
          <span className="mini-note">
            Capacity per contact: {Math.round(metrics.science.downlinkCapacityPerStepMbit)} Mbit
          </span>
        </div>
      </div>

      <div className="ops-grid">
        <section className="ops-main">
          <div className="step-card">
            <div className="step-card-head">
              <span className="step-phase">{step.phaseLabel}</span>
              <span className={`tag ${step.kind === 'decision' ? 'tag-required' : ''}`}>
                {step.kind === 'decision' ? 'Decision' : 'Automatic'}
              </span>
            </div>
            <h2>{step.title}</h2>
            <p>{step.narrative}</p>

            {step.event ? (
              <div className={`event-card event-${step.event.severity}`}>
                <div className="event-head">
                  <CircleAlert size={18} aria-hidden="true" />
                  <div>
                    <span className="mini-label">Operational event · {step.event.severity}</span>
                    <h3>{step.event.title}</h3>
                  </div>
                </div>
                <p>{step.event.description}</p>
                <div className="event-options">
                  {step.event.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`decision ${choice === option.id ? 'is-selected' : ''}`}
                      onClick={() => setChoice(option.id)}
                      aria-pressed={choice === option.id}
                    >
                      <span className="decision-radio" aria-hidden="true" />
                      <span>
                        <strong>{option.label}</strong>
                        <span className="decision-desc">{option.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="event-card event-info">
                <div className="event-head">
                  <Activity size={18} aria-hidden="true" />
                  <div>
                    <span className="mini-label">Step without a decision</span>
                    <h3>Nominal procedures</h3>
                  </div>
                </div>
                <p>Confirm the step to proceed. Telemetry is updated at the end of each step.</p>
              </div>
            )}

            <div className="ops-actions">
              <button
                className="btn btn-primary"
                type="button"
                disabled={!canProceed}
                onClick={() => advance(choice ?? undefined)}
              >
                {step.kind === 'auto' ? 'Execute step' : step.event ? 'Confirm decision' : 'Continue operations'}
              </button>
              {step.event && !choice && (
                <span className="mini-note">Choose an option to continue.</span>
              )}
            </div>
          </div>
        </section>

        <aside className="ops-side">
          <section className="panel">
            <SectionTitle title="Timeline" />
            <ol className="timeline">
              {timeline.map((item, index) => {
                const state = index < sim.stepIndex ? 'done' : index === sim.stepIndex ? 'current' : 'future';
                return (
                  <li key={item.id} className={`timeline-item is-${state}`}>
                    <span className="timeline-dot" aria-hidden="true" />
                    <div>
                      <span className="timeline-step">{item.phaseLabel}</span>
                      <strong>{item.title}</strong>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="panel">
            <SectionTitle title="Onboard log" />
            <ul className="log-list">
              {[...sim.log].reverse().slice(0, 10).map((entry, index) => (
                <li key={`${entry.step}-${index}`} className={`log-${entry.severity}`}>
                  <span className="log-step">T+{entry.step}</span>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
