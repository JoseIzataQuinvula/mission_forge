import { COMPONENTS_BY_ID } from '../../data/spacecraftComponents';
import { LAUNCH_VEHICLES_BY_ID } from '../../data/launchVehicles';

export interface BudgetResult {
  hardwareUsdM: number;
  launchUsdM: number;
  totalUsdM: number;
  remainingUsdM: number;
  overBudget: boolean;
}

/**
 * Costs are expressed in millions of USD for readability. Values belong to
 * the game economy and are not real procurement prices.
 */
export function calculateBudget(
  componentIds: string[],
  launchVehicleId: string | null,
  missionBudgetUsdM: number,
): BudgetResult {
  const hardwareUsdM = componentIds.reduce((sum, id) => {
    const component = COMPONENTS_BY_ID[id];
    return component ? sum + component.costUsdM : sum;
  }, 0);

  const vehicle = launchVehicleId ? LAUNCH_VEHICLES_BY_ID[launchVehicleId] : undefined;
  const launchUsdM = vehicle?.costUsdM ?? 0;
  const totalUsdM = round1(hardwareUsdM + launchUsdM);

  return {
    hardwareUsdM: round1(hardwareUsdM),
    launchUsdM: round1(launchUsdM),
    totalUsdM,
    remainingUsdM: round1(missionBudgetUsdM - totalUsdM),
    overBudget: totalUsdM > missionBudgetUsdM,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
