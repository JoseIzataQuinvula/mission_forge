import { describe, expect, it } from 'vitest';
import { LUNAR_ICE_EXPLORER } from '../../data/mission';
import { calculateMass } from './mass';
import { calculateBudget } from './budget';
import { calculatePower } from './power';
import { calculateScience } from './science';
import { computeMetrics } from './metrics';

const GOOD_CONFIG = [
  'struct-composite',
  'pwr-solar-battery',
  'prop-methalox',
  'comm-hga',
  'inst-neutron',
  'inst-radar',
  'inst-camera',
  'thm-rhu',
];

describe('mass budget', () => {
  it('adds dry mass and propellant separately', () => {
    const mass = calculateMass(['struct-composite', 'prop-methalox']);
    // composite bus 135 kg + engine 110 kg + 240 kg of propellant
    expect(mass.dryMassKg).toBe(245);
    expect(mass.propellantMassKg).toBe(240);
    expect(mass.totalMassKg).toBe(485);
  });

  it('ignores unknown component ids', () => {
    expect(calculateMass(['does-not-exist']).totalMassKg).toBe(0);
  });
});

describe('budget', () => {
  it('sums components plus launch vehicle', () => {
    const budget = calculateBudget(GOOD_CONFIG, 'lv-falcon9', LUNAR_ICE_EXPLORER.budgetUsdM);
    expect(budget.hardwareUsdM).toBeGreaterThan(0);
    expect(budget.launchUsdM).toBe(67);
    expect(budget.totalUsdM).toBe(budget.hardwareUsdM + 67);
    expect(budget.overBudget).toBe(false);
  });

  it('flags an over-budget configuration', () => {
    const budget = calculateBudget(GOOD_CONFIG, 'lv-sls', 100);
    expect(budget.overBudget).toBe(true);
    expect(budget.remainingUsdM).toBeLessThan(0);
  });
});

describe('power', () => {
  it('integrates solar production over the illuminated fraction', () => {
    const power = calculatePower(['pwr-solar-battery'], LUNAR_ICE_EXPLORER);
    expect(power.productionW).toBe(380);
    expect(power.dailyGenerationWh).toBeCloseTo(380 * 0.8 * 24, 1);
    expect(power.batteryCapacityWh).toBe(1200);
  });

  it('keeps RTG production constant across day and night', () => {
    const power = calculatePower(['pwr-rtg'], LUNAR_ICE_EXPLORER);
    expect(power.dailyGenerationWh).toBeCloseTo(110 * 24, 1);
  });

  it('separates nominal load from science load', () => {
    const power = calculatePower(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    expect(power.nominalConsumptionW).toBe(70); // HGA 45 + engine 20 + RHU 5
    expect(power.scienceLoadW).toBe(55); // neutron 12 + radar 35 + camera 8
    expect(power.peakConsumptionW).toBe(125);
  });
});

describe('science', () => {
  it('reports covered and missing required objectives', () => {
    const science = calculateScience(['inst-neutron'], LUNAR_ICE_EXPLORER);
    expect(science.objectivesCovered).toContain('ice-detection');
    expect(science.objectivesMissing).toContain('subsurface-ice-mapping');
  });

  it('converts Mbps into Mbit per contact window', () => {
    const science = calculateScience(['comm-hga'], LUNAR_ICE_EXPLORER);
    expect(science.downlinkCapacityPerStepMbit).toBeCloseTo(
      8 * LUNAR_ICE_EXPLORER.contactWindowSeconds,
      1,
    );
  });
});

describe('metrics', () => {
  it('is deterministic for the same configuration', () => {
    const config = {
      componentIds: GOOD_CONFIG,
      launchVehicleId: 'lv-falcon9',
      seed: 7,
    };
    expect(computeMetrics(config, LUNAR_ICE_EXPLORER)).toEqual(
      computeMetrics(config, LUNAR_ICE_EXPLORER),
    );
  });

  it('counts components per category', () => {
    const metrics = computeMetrics(
      { componentIds: GOOD_CONFIG, launchVehicleId: 'lv-falcon9', seed: 1 },
      LUNAR_ICE_EXPLORER,
    );
    expect(metrics.countsByCategory.instruments).toBe(3);
    expect(metrics.countsByCategory.structure).toBe(1);
    expect(metrics.readiness).toBeGreaterThan(0);
  });
});
