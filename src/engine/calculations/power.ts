import { COMPONENTS_BY_ID } from '../../data/spacecraftComponents';
import type { Mission, PowerBudget, SpacecraftComponent } from '../../types';

function getComponents(ids: string[]): SpacecraftComponent[] {
  return ids
    .map((id) => COMPONENTS_BY_ID[id])
    .filter((component): component is SpacecraftComponent => Boolean(component));
}

/**
 * Power is instantaneous (W); energy is integrated over time (Wh).
 *
 * - nominal load  : housekeeping, propulsion standby, comms and thermal control
 * - science load  : all instruments active at the same time
 * - peak load     : nominal + science (worst case the battery must absorb)
 * - daily energy  : solar production is integrated over the illuminated
 *                   fraction of the day; RTG production is constant.
 */
export function calculatePower(componentIds: string[], mission: Mission): PowerBudget {
  const components = getComponents(componentIds);

  let productionW = 0;
  let constantProductionW = 0;
  let solarProductionW = 0;
  let nominalConsumptionW = 0;
  let scienceLoadW = 0;
  let batteryCapacityWh = 0;

  for (const component of components) {
    productionW += component.powerProductionW;
    if (component.constantProduction) {
      constantProductionW += component.powerProductionW;
    } else {
      solarProductionW += component.powerProductionW;
    }

    if (component.category === 'instruments') {
      scienceLoadW += component.powerConsumptionW;
    } else {
      nominalConsumptionW += component.powerConsumptionW;
    }

    batteryCapacityWh += component.batteryCapacityWh ?? 0;
  }

  const peakConsumptionW = nominalConsumptionW + scienceLoadW;
  const darkFraction = 1 - mission.illuminationFraction;

  return {
    productionW: productionW,
    nominalConsumptionW: nominalConsumptionW,
    scienceLoadW: scienceLoadW,
    peakConsumptionW: peakConsumptionW,
    nominalMarginW: round1(productionW - nominalConsumptionW),
    peakMarginW: round1(productionW - peakConsumptionW),
    batteryCapacityWh: batteryCapacityWh,
    dailyGenerationWh: round1(
      constantProductionW * 24 + solarProductionW * mission.illuminationFraction * 24,
    ),
    dailyConsumptionWh: round1(nominalConsumptionW * 24),
    peakDailyConsumptionWh: round1(peakConsumptionW * 24),
    nightEnergyNeedWh: round1(nominalConsumptionW * darkFraction * 24),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
