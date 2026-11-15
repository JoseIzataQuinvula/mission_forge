import { ArrowLeft, CheckCircle2, CircleSlash, RotateCcw, XCircle } from 'lucide-react';
import { useMissionStore } from '../store/missionStore';
import { SectionTitle, Stat } from '../components/ui';
import type { SimulationReport } from '../types';

const SCORE_LABELS: Array<[keyof SimulationReport['scores'], string]> = [
  ['engineering', 'Engineering'],
  ['science', 'Science'],
  ['efficiency', 'Efficiency'],
  ['reliability', 'Reliability'],
];

export function DebriefPhase() {
  const report = useMissionStore((state) => state.report);
  const restartMission = useMissionStore((state) => state.restartMission);
  const setPhase = useMissionStore((state) => state.setPhase);

  if (!report) {
    return (
      <div className="phase debrief">
        <p className="empty-note">No report yet. Complete a mission first.</p>
      </div>
    );
  }

  return (
    <div className="phase debrief">
      <header className={`debrief-hero outcome-${report.outcome}`}>
        <span className="eyebrow">Phase 06 · final report</span>
        <h1>{report.headline}</h1>
        <p>{report.summary}</p>
        <div className="debrief-score">
          <span className="score-number">{report.scores.total}</span>
          <span className="score-max">/100<br /><span>total score</span></span>
        </div>
      </header>

      <div className="debrief-grid">
        <section className="panel">
          <SectionTitle title="Score" />
          <div className="score-bars">
            {SCORE_LABELS.map(([key, label]) => (
              <div key={key} className="score-row">
                <span>{label}</span>
                <div className="score-track"><span style={{ width: `${report.scores[key]}%` }} /></div>
                <strong>{report.scores[key]}</strong>
              </div>
            ))}
          </div>
          <p className="mini-note">
            The score combines engineering readiness, science objectives, power efficiency
            and configuration reliability.
          </p>
        </section>

        <section className="panel">
          <SectionTitle title="Final telemetry" />
          <div className="stat-grid mini">
            <Stat label="Data collected" value={report.dataCollectedMbit} unit=" Mbit" />
            <Stat label="Data on Earth" value={report.dataTransmittedMbit} unit=" Mbit" tone="accent" />
            <Stat label="Energy used" value={report.energyUsedWh} unit=" Wh" />
            <Stat label="Energy generated" value={report.energyGeneratedWh} unit=" Wh" />
            <Stat label="Instrument health" value={report.instrumentHealth} unit="%" tone={report.instrumentHealth < 50 ? 'danger' : 'ok'} />
            <Stat label="Final battery" value={report.finalBatteryWh} unit=" Wh" />
            <Stat label="Launched mass" value={report.massTotalKg} unit=" kg" />
            <Stat label="Cost" value={report.budgetUsedUsdM} unit=" M USD" />
          </div>
        </section>
      </div>

      <div className="debrief-grid">
        <section className="panel">
          <SectionTitle title="Objectives" hint={`${report.objectivesCompleted.length}/${report.objectivesCompleted.length + report.objectivesFailed.length}`} />
          <ul className="objective-results">
            {report.objectivesCompleted.map((objective) => (
              <li key={objective.id} className="is-done">
                <CheckCircle2 size={16} aria-hidden="true" />
                <div>
                  <strong>{objective.title}</strong>
                  <span>Data received and validated.</span>
                </div>
              </li>
            ))}
            {report.objectivesFailed.map((objective) => (
              <li key={objective.id} className="is-missed">
                <XCircle size={16} aria-hidden="true" />
                <div>
                  <strong>{objective.title}</strong>
                  <span>No dedicated instrument, enough data or minimum health.</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <SectionTitle title="Decisions and lessons" />
          {report.keyDecisions.length > 0 ? (
            <ul className="decision-summary">
              {report.keyDecisions.map((decision, index) => (
                <li key={index}>{decision}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No operational decisions recorded.</p>
          )}
          <ul className="lessons">
            {report.lessons.map((lesson, index) => (
              <li key={index}>{lesson}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="debrief-actions">
        <button className="btn btn-primary" type="button" onClick={restartMission}>
          <RotateCcw size={16} aria-hidden="true" />
          Try again
        </button>
        <button className="btn btn-outline" type="button" onClick={() => setPhase('design')}>
          <ArrowLeft size={16} aria-hidden="true" />
          Adjust the spacecraft
        </button>
        <span className="mini-note">
          <CircleSlash size={13} aria-hidden="true" /> The report is deterministic for the same
          configuration and seed.
        </span>
      </div>
    </div>
  );
}
