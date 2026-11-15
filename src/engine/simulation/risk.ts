import type { Mission, SpacecraftMetrics } from '../../types';

export interface RiskFactor {
  label: string;
  detail: string;
  impact: number;
}

export interface RiskAssessment {
  /** 0–100, higher is riskier. */
  score: number;
  level: 'low' | 'moderate' | 'high';
  factors: RiskFactor[];
}

/**
 * Qualitative-to-quantitative risk model. It is intentionally simple: each
 * factor adds risk points that later influence which operational events occur.
 */
export function assessRisk(metrics: SpacecraftMetrics, mission: Mission): RiskAssessment {
  const factors: RiskFactor[] = [];

  const massMargin = mission.maxMassKg - metrics.mass.totalMassKg;
  if (massMargin < mission.maxMassKg * 0.1) {
    factors.push({
      label: 'Mass margin',
      detail: `Only ${massMargin.toFixed(0)} kg of reserve.`,
      impact: 7,
    });
  }

  if (metrics.power.peakMarginW < 0) {
    factors.push({
      label: 'Science power deficit',
      detail: `${Math.abs(metrics.power.peakMarginW).toFixed(0)} W short when every instrument is active.`,
      impact: 12,
    });
  }

  if (metrics.power.batteryCapacityWh < metrics.power.nightEnergyNeedWh) {
    factors.push({
      label: 'Night energy',
      detail: 'The battery does not cover the estimated need during darkness.',
      impact: 10,
    });
  }

  if (metrics.science.thermalProtection < 45) {
    factors.push({
      label: 'Thermal margin',
      detail: `Thermal protection of ${metrics.science.thermalProtection}/100.`,
      impact: 9,
    });
  }

  if (metrics.science.structuralRating < 50) {
    factors.push({
      label: 'Landing',
      detail: `Structural index of ${metrics.science.structuralRating}/100.`,
      impact: 10,
    });
  }

  if (metrics.science.downlinkMbps < 1) {
    factors.push({
      label: 'Data link',
      detail: 'Low-capacity antenna, prone to data loss.',
      impact: 6,
    });
  }

  const scienceCoverage = mission.requiredObjectives.filter((id) =>
    metrics.science.objectivesCovered.includes(id),
  ).length;
  if (scienceCoverage < mission.requiredObjectives.length) {
    factors.push({
      label: 'Science coverage',
      detail: `${scienceCoverage}/${mission.requiredObjectives.length} required objectives covered.`,
      impact: 10,
    });
  }

  const rawScore = factors.reduce((sum, factor) => sum + factor.impact, 0);
  const score = Math.min(100, rawScore);
  return {
    score,
    level: score >= 30 ? 'high' : score >= 10 ? 'moderate' : 'low',
    factors,
  };
}
