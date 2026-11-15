import { describe, expect, it } from 'vitest';
import { LUNAR_ICE_EXPLORER } from '../../data/mission';
import { validateMission } from './missionValidator';
import type { MissionConfiguration } from '../../types';

const GOOD_CONFIG: MissionConfiguration = {
  componentIds: [
    'struct-composite',
    'pwr-solar-battery',
    'prop-methalox',
    'comm-hga',
    'inst-neutron',
    'inst-radar',
    'inst-camera',
    'thm-rhu',
  ],
  launchVehicleId: 'lv-falcon9',
  seed: 2026,
};

describe('validateMission', () => {
  it('approves a balanced, launchable configuration', () => {
    const result = validateMission(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    expect(result.canLaunch).toBe(true);
    expect(result.status).toBe('pass');
    expect(result.failed).toBe(0);
  });

  it('blocks launch when the spacecraft has no subsystems', () => {
    const result = validateMission(
      { componentIds: [], launchVehicleId: null, seed: 1 },
      LUNAR_ICE_EXPLORER,
    );
    expect(result.canLaunch).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.failed).toBeGreaterThan(0);
  });

  it('gives every issue a problem, reason, consequence and fix', () => {
    const result = validateMission(
      { componentIds: ['struct-composite'], launchVehicleId: null, seed: 1 },
      LUNAR_ICE_EXPLORER,
    );
    for (const issue of result.issues) {
      expect(issue.problem.length).toBeGreaterThan(0);
      expect(issue.why.length).toBeGreaterThan(0);
      expect(issue.consequence.length).toBeGreaterThan(0);
      expect(issue.fix.length).toBeGreaterThan(0);
    }
  });

  it('rejects an ion stage as the only propulsion system', () => {
    const result = validateMission(
      {
        ...GOOD_CONFIG,
        componentIds: GOOD_CONFIG.componentIds
          .filter((id) => id !== 'prop-methalox')
          .concat('prop-electric'),
      },
      LUNAR_ICE_EXPLORER,
    );
    expect(result.canLaunch).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'PROPULSION_NO_DESCENT')).toBe(true);
  });

  it('rejects a launch vehicle that cannot lift the spacecraft', () => {
    const result = validateMission(
      { ...GOOD_CONFIG, launchVehicleId: 'lv-electron' },
      LUNAR_ICE_EXPLORER,
    );
    expect(result.canLaunch).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'LAUNCH_PAYLOAD_EXCEEDED')).toBe(true);
  });

  it('flags missing required science instruments', () => {
    const result = validateMission(
      {
        ...GOOD_CONFIG,
        componentIds: GOOD_CONFIG.componentIds.filter((id) => id !== 'inst-radar'),
      },
      LUNAR_ICE_EXPLORER,
    );
    expect(result.canLaunch).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'SCIENCE_OBJECTIVES_MISSING')).toBe(true);
  });

  it('is deterministic', () => {
    expect(validateMission(GOOD_CONFIG, LUNAR_ICE_EXPLORER)).toEqual(
      validateMission(GOOD_CONFIG, LUNAR_ICE_EXPLORER),
    );
  });
});
