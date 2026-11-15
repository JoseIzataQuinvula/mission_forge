import type {
  LaunchVehicle,
  Mission,
  SimulationReport,
  SimulationState,
  SpacecraftMetrics,
} from '../../types';
import { assessRisk } from './risk';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const round = (value: number) => Math.round(value);

/**
 * Converts the raw simulation state into the final mission report, including
 * the score breakdown shown in the debrief screen.
 */
export function buildReport(
  state: SimulationState,
  mission: Mission,
  metrics: SpacecraftMetrics,
  vehicle: LaunchVehicle | null,
): SimulationReport {
  const outcome = state.outcome ?? 'partial';
  const risk = assessRisk(metrics, mission);

  const completed = mission.objectives.filter((objective) =>
    state.completedObjectiveIds.includes(objective.id),
  );
  const failedObjectives = mission.objectives.filter(
    (objective) => !state.completedObjectiveIds.includes(objective.id),
  );

  const dataRatio =
    state.dataCollectedMbit <= 0 ? 0 : state.dataTransmittedMbit / state.dataCollectedMbit;
  const batteryRatio =
    state.batteryCapacityWh <= 0 ? 0 : state.batteryWh / state.batteryCapacityWh;
  const energyEfficiency = round(
    clamp(dataRatio * 55 + batteryRatio * 30 + state.instrumentHealth * 15, 0, 100),
  );

  const scienceScore = round(
    clamp(
      (completed.length / Math.max(1, mission.objectives.length)) * 70 +
        metrics.science.score * 0.3 * state.instrumentHealth,
      0,
      100,
    ),
  );

  const vehicleReliability = vehicle ? vehicle.reliability * 100 : 80;
  const reliabilityScore = round(
    clamp(100 - risk.score * 0.6 + (vehicleReliability - 90) * 0.5, 0, 100),
  );

  const engineeringScore = metrics.readiness;

  const weighted =
    engineeringScore * 0.25 +
    scienceScore * 0.35 +
    energyEfficiency * 0.2 +
    reliabilityScore * 0.2;
  const total = round(clamp(outcome === 'failure' ? weighted * 0.55 : weighted, 0, 100));

  const keyDecisions = state.log
    .filter((entry) => entry.message.startsWith('Decision:'))
    .map((entry) => entry.message.replace('Decision: ', '').replace(/\.$/, ''));

  const lessons: string[] = [];
  if (completed.length < mission.objectives.length) {
    lessons.push(
      'Objectives without a dedicated instrument, or without enough transmitted data, do not count in the final report.',
    );
  }
  if (state.batteryWh <= state.batteryCapacityWh * 0.1) {
    lessons.push(
      'The battery ended almost empty: more storage or a lighter science load would have left margin for the final steps.',
    );
  }
  if (state.instrumentHealth < 0.7) {
    lessons.push(
      'Instrument health degraded. Stable thermal control and power are as important as the science itself.',
    );
  }
  if (dataRatio < 0.8) {
    lessons.push(
      'Part of the data was never transmitted. A higher-bandwidth antenna would increase the science return.',
    );
  }
  if (risk.factors.length === 0) {
    lessons.push('Configuration with no significant risk factors: well-sized margins.');
  }
  if (lessons.length < 2) {
    lessons.push(
      'Every kilogram and every watt counts: the ideal mission balances science, power and mass within budget.',
    );
  }

  const headlines: Record<SimulationReport['outcome'], string> = {
    success: 'Ice confirmed. The Moon has a new map.',
    partial: 'Mission partly achieved. There is data, but answers are missing.',
    failure: 'Mission lost. Engineering failed before science could begin.',
  };

  const summaries: Record<SimulationReport['outcome'], string> = {
    success:
      'The spacecraft landed, operated and transmitted enough data to confirm water ice at the south pole. The required objectives were met within the available budget and mass.',
    partial:
      'The spacecraft reached the surface and collected data, but did not complete every required objective. The report identifies what was missing and how to correct the configuration.',
    failure:
      'The mission could not complete the science operation. The analysis below shows the root cause and the decisions that could have prevented it.',
  };

  return {
    outcome,
    headline: headlines[outcome],
    summary: summaries[outcome],
    objectivesCompleted: completed,
    objectivesFailed: failedObjectives,
    dataCollectedMbit: Math.round(state.dataCollectedMbit),
    dataTransmittedMbit: Math.round(state.dataTransmittedMbit),
    energyUsedWh: Math.round(state.energyUsedWh),
    energyGeneratedWh: Math.round(state.energyGeneratedWh),
    energyEfficiency,
    instrumentHealth: round(state.instrumentHealth * 100),
    finalBatteryWh: Math.round(state.batteryWh),
    scores: {
      engineering: engineeringScore,
      science: scienceScore,
      efficiency: energyEfficiency,
      reliability: reliabilityScore,
      total,
    },
    keyDecisions,
    lessons,
    massTotalKg: Math.round(metrics.mass.totalMassKg),
    budgetUsedUsdM: Math.round(metrics.cost.totalUsdM * 10) / 10,
  };
}
