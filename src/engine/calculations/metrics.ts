import { COMPONENTS_BY_ID } from '../../data/spacecraftComponents';
import type {
  ComponentCategory,
  Mission,
  MissionConfiguration,
  SpacecraftMetrics,
} from '../../types';
import { calculateBudget } from './budget';
import { calculateMass } from './mass';
import { calculatePower } from './power';
import { calculateScience } from './science';

const EMPTY_COUNTS: Record<ComponentCategory, number> = {
  structure: 0,
  power: 0,
  propulsion: 0,
  communication: 0,
  instruments: 0,
  thermal: 0,
};

export function computeMetrics(
  config: MissionConfiguration,
  mission: Mission,
): SpacecraftMetrics {
  const componentIds = config.componentIds;
  const mass = calculateMass(componentIds);
  const budget = calculateBudget(componentIds, config.launchVehicleId, mission.budgetUsdM);
  const power = calculatePower(componentIds, mission);
  const science = calculateScience(componentIds, mission);

  const countsByCategory: Record<ComponentCategory, number> = { ...EMPTY_COUNTS };
  for (const id of componentIds) {
    const component = COMPONENTS_BY_ID[id];
    if (component) countsByCategory[component.category] += 1;
  }

  const metrics: Omit<SpacecraftMetrics, 'readiness'> = {
    mass,
    cost: {
      totalUsdM: budget.totalUsdM,
      remainingUsdM: budget.remainingUsdM,
      overBudget: budget.overBudget,
    },
    power,
    science,
    componentCount: componentIds.length,
    countsByCategory,
  };

  return { ...metrics, readiness: computeReadiness(metrics, mission) };
}

/**
 * Readiness is a 0–100 summary of how close a configuration is to being
 * launchable. It never replaces validation: it is a progress indicator for the
 * design screen.
 */
export function computeReadiness(
  metrics: Omit<SpacecraftMetrics, 'readiness'>,
  mission: Mission,
): number {
  const requiredObjectives = mission.requiredObjectives.length;
  const coveredObjectives = mission.requiredObjectives.filter((id) =>
    metrics.science.objectivesCovered.includes(id),
  ).length;
  const objectiveScore = requiredObjectives === 0 ? 1 : coveredObjectives / requiredObjectives;

  const massHeadroom =
    mission.maxMassKg <= 0
      ? 0
      : clamp01((mission.maxMassKg - metrics.mass.totalMassKg) / (mission.maxMassKg * 0.5));

  const budgetHeadroom = clamp01(metrics.cost.remainingUsdM / (mission.budgetUsdM * 0.4));

  const powerScore =
    metrics.power.productionW === 0
      ? 0
      : metrics.power.peakMarginW >= 0
        ? 1
        : clamp01(1 + metrics.power.peakMarginW / Math.max(1, metrics.power.peakConsumptionW));

  const thermalScore = clamp01(metrics.science.thermalProtection / 60);
  const systemsScore =
    (metrics.countsByCategory.structure > 0 ? 0.25 : 0) +
    (metrics.countsByCategory.propulsion > 0 ? 0.25 : 0) +
    (metrics.countsByCategory.communication > 0 ? 0.25 : 0) +
    (metrics.countsByCategory.power > 0 ? 0.25 : 0);

  const readiness =
    objectiveScore * 0.28 +
    massHeadroom * 0.18 +
    budgetHeadroom * 0.14 +
    powerScore * 0.18 +
    thermalScore * 0.1 +
    systemsScore * 0.12;

  return Math.round(clamp01(readiness) * 100);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
