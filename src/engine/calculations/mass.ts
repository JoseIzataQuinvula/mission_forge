import { COMPONENTS_BY_ID } from '../../data/spacecraftComponents';
import type { MassBudget } from '../../types';

/**
 * Dry mass = every selected component.
 * Propellant mass = propellant carried by propulsion components.
 * Total mass = what the launch vehicle must lift toward the Moon.
 */
export function calculateMass(componentIds: string[]): MassBudget {
  let dryMassKg = 0;
  let propellantMassKg = 0;

  for (const id of componentIds) {
    const component = COMPONENTS_BY_ID[id];
    if (!component) continue;
    dryMassKg += component.massKg;
    propellantMassKg += component.propellantMassKg ?? 0;
  }

  return {
    dryMassKg: round(dryMassKg),
    propellantMassKg: round(propellantMassKg),
    totalMassKg: round(dryMassKg + propellantMassKg),
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
