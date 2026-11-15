import { useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ListChecks, ShieldAlert } from 'lucide-react';
import { useMissionStore, useValidation } from '../store/missionStore';
import { SeverityBadge, SectionTitle, Stat } from '../components/ui';
import type { ValidationSeverity } from '../types';

type Filter = 'all' | ValidationSeverity;

export function ValidationPhase() {
  const validation = useValidation();
  const setPhase = useMissionStore((state) => state.setPhase);
  const startLaunch = useMissionStore((state) => state.startLaunch);
  const [filter, setFilter] = useState<Filter>('all');

  const issues = validation.issues.filter((issue) => filter === 'all' || issue.severity === filter);
  const ordered = [...issues].sort((a, b) => {
    const rank = { failed: 0, warning: 1, pass: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  return (
    <div className="phase validation">
      <header className="phase-head">
        <div>
          <span className="eyebrow">Phase 03 · technical review</span>
          <h1>Mission Validation</h1>
          <p>The engineering engine checks the configuration as a launch readiness review.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-outline" type="button" onClick={() => setPhase('design')}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to design
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!validation.canLaunch}
            onClick={startLaunch}
            title={validation.canLaunch ? 'Proceed to launch' : 'Critical failures remain'}
          >
            Authorise launch
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={`verdict verdict-${validation.status}`}>
        <div className="verdict-icon">
          {validation.status === 'pass' ? (
            <CheckCircle2 size={26} aria-hidden="true" />
          ) : validation.status === 'warning' ? (
            <AlertTriangle size={26} aria-hidden="true" />
          ) : (
            <ShieldAlert size={26} aria-hidden="true" />
          )}
        </div>
        <div>
          <h2>
            {validation.status === 'pass'
              ? 'Configuration ready for launch'
              : validation.status === 'warning'
                ? 'Launchable configuration, with warnings'
                : 'Launch blocked'}
          </h2>
          <p>
            {validation.status === 'failed'
              ? 'Resolve every FAILED check before continuing. Critical failures prevent launch.'
              : validation.status === 'warning'
                ? 'There are no critical failures, but warnings reduce the mission success margin.'
                : 'Every required check passed. You can proceed to launch.'}
          </p>
        </div>
        <div className="verdict-counts">
          <Stat label="Pass" value={validation.passed} tone="ok" />
          <Stat label="Warnings" value={validation.warnings} tone="warn" />
          <Stat label="Failures" value={validation.failed} tone="danger" />
        </div>
      </div>

      <div className="filter-row" role="group" aria-label="Filter checks">
        {([
          ['all', 'All', validation.issues.length],
          ['failed', 'Failed', validation.failed],
          ['warning', 'Warnings', validation.warnings],
          ['pass', 'Pass', validation.passed],
        ] as Array<[Filter, string, number]>).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            className={`chip ${filter === value ? 'is-active' : ''}`}
            onClick={() => setFilter(value)}
          >
            <ListChecks size={14} aria-hidden="true" />
            {label}
            <span className="chip-count">{count}</span>
          </button>
        ))}
      </div>

      <div className="issue-list">
        {ordered.map((issue) => (
          <article key={issue.code} className={`issue issue-${issue.severity}`}>
            <div className="issue-head">
              <SeverityBadge severity={issue.severity} />
              <h3>{issue.title}</h3>
              <span className="issue-subsystem">{issue.subsystem}</span>
            </div>
            <div className="issue-body">
              <div className="issue-block">
                <span className="issue-label">Problem</span>
                <p>{issue.problem}</p>
              </div>
              <div className="issue-block">
                <span className="issue-label">Why</span>
                <p>{issue.why}</p>
              </div>
              <div className="issue-block">
                <span className="issue-label">Consequence</span>
                <p>{issue.consequence}</p>
              </div>
              <div className="issue-block">
                <span className="issue-label">Fix</span>
                <p>{issue.fix}</p>
              </div>
            </div>
          </article>
        ))}
        {ordered.length === 0 && (
          <p className="empty-note">No checks in this filter.</p>
        )}
      </div>

      <div className="validation-foot">
        <SectionTitle title="Deterministic engine" hint="Same configuration, same results" />
        <p className="panel-text">
          The checks use only data declared in the catalogue and the mission. There are no random
          numbers at this stage: if you change a component, the review changes predictably.
        </p>
      </div>
    </div>
  );
}
