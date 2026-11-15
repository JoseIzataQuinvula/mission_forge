import { COMPONENTS_BY_ID } from '../../data/spacecraftComponents';
import type { Mission, ScienceBudget, SpacecraftComponent } from '../../types';

function getComponents(ids: string[]): SpacecraftComponent[] {
  return ids
    .map((id) => COMPONENTS_BY_ID[id])
    .filter((component): component is SpacecraftComponent => Boolean(component));
}

export function calculateScience(componentIds: string[], mission: Mission): ScienceBudget {
  const components = getComponents(componentIds);

  let score = 0;
  let dataPerStepMbit = 0;
  let downlinkMbps = 0;
  let thermalProtection = 0;
  let structuralRating = 0;
  const covered = new Set<string>();

  for (const component of components) {
    score += component.scienceCapability;
    dataPerStepMbit += component.dataPerStepMbit ?? 0;
    downlinkMbps += component.downlinkMbps ?? 0;
    thermalProtection += component.thermalProtection ?? 0;
    structuralRating += component.structuralRating ?? 0;
    for (const objective of component.objectives ?? []) {
      covered.add(objective);
    }
  }

  const objectivesCovered = [...covered];
  const objectivesMissing = mission.requiredObjectives.filter(
    (objectiveId) => !covered.has(objectiveId),
  );

  return {
    score: Math.min(100, Math.round(score)),
    objectivesCovered,
    objectivesMissing,
    dataPerStepMbit: round1(dataPerStepMbit),
    downlinkMbps: round1(downlinkMbps),
    downlinkCapacityPerStepMbit: round1(downlinkMbps * mission.contactWindowSeconds),
    thermalProtection: Math.min(100, thermalProtection),
    structuralRating: Math.min(100, structuralRating),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
