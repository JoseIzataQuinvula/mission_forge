import type { ReactNode } from 'react';
import type { ValidationSeverity } from '../types';

export function Stat({
  label,
  value,
  unit,
  tone = 'default',
  hint,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: 'default' | 'accent' | 'ok' | 'warn' | 'danger';
  hint?: string;
}) {
  return (
    <div className={`stat tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: ValidationSeverity }) {
  const labels: Record<ValidationSeverity, string> = {
    pass: 'PASS',
    warning: 'WARNING',
    failed: 'FAILED',
  };
  return <span className={`badge badge-${severity}`}>{labels[severity]}</span>;
}

export function SectionTitle({
  index,
  title,
  hint,
}: {
  index?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="section-title">
      {index && <span className="section-index">{index}</span>}
      <h2>{title}</h2>
      {hint && <span className="section-hint">{hint}</span>}
    </div>
  );
}
