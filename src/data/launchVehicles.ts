import type { LaunchVehicle } from '../types';

/**
 * Launch vehicles.
 *
 * Payload capacities toward a lunar transfer are simplified orders of
 * magnitude, not certified performance figures. Costs are illustrative game
 * values. See docs/SCIENCE_SOURCES.md.
 */
export const LAUNCH_VEHICLES: LaunchVehicle[] = [
  {
    id: 'lv-electron',
    name: 'Electron (simplified payload)',
    payloadCapacityKg: 450,
    costUsdM: 8,
    reliability: 0.93,
    description:
      'Small, cheap rocket. Only viable for a truly minimal spacecraft; any extra instrument compromises mass.',
    source: 'Illustrative capacity (order of magnitude for small launchers)',
    dataKind: 'illustrative',
  },
  {
    id: 'lv-falcon9',
    name: 'Falcon 9 (simplified payload)',
    payloadCapacityKg: 4000,
    costUsdM: 67,
    reliability: 0.96,
    description:
      'Medium launcher with a good cost-to-capacity ratio. Enough for most configurations in the game.',
    source: 'Illustrative capacity (order of magnitude for medium launchers)',
    dataKind: 'illustrative',
  },
  {
    id: 'lv-atlasv',
    name: 'Atlas V 401 (simplified payload)',
    payloadCapacityKg: 4500,
    costUsdM: 150,
    reliability: 0.97,
    description:
      'Launcher with a solid record on lunar and planetary missions. Slightly higher capacity, much higher cost.',
    source: 'Illustrative capacity (order of magnitude for medium launchers)',
    dataKind: 'illustrative',
  },
  {
    id: 'lv-sls',
    name: 'SLS Block 1 (simplified payload)',
    payloadCapacityKg: 26000,
    costUsdM: 2200,
    reliability: 0.9,
    description:
      'Super-heavy launcher. Enormous capacity, but the cost completely exceeds this mission budget.',
    source: 'Illustrative capacity (order of magnitude for super-heavy launchers)',
    dataKind: 'illustrative',
  },
];

export const LAUNCH_VEHICLES_BY_ID: Record<string, LaunchVehicle> = Object.fromEntries(
  LAUNCH_VEHICLES.map((vehicle) => [vehicle.id, vehicle]),
);
