import { describe, expect, it } from 'vitest';
import { LUNAR_ICE_EXPLORER } from '../../data/mission';
import { LAUNCH_VEHICLES_BY_ID } from '../../data/launchVehicles';
import { computeMetrics } from '../calculations/metrics';
import { buildTimeline } from './timeline';
import { createSimulation, processStep } from './simulator';
import { buildReport } from './report';
import type { MissionConfiguration, OpsStep, SimulationState } from '../../types';

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

const POWER_HUNGRY_CONFIG: MissionConfiguration = {
  componentIds: [
    'struct-composite',
    'pwr-rtg-battery',
    'prop-hypergolic',
    'comm-hga',
    'inst-neutron',
    'inst-radar',
    'inst-massspec',
    'inst-camera',
    'inst-drill',
  ],
  launchVehicleId: 'lv-falcon9',
  seed: 2026,
};

function run(config: MissionConfiguration, timeline: OpsStep[]): SimulationState {
  const metrics = computeMetrics(config, LUNAR_ICE_EXPLORER);
  let state = createSimulation(config, metrics, timeline);
  let guard = 0;
  while (!state.finished && guard < 50) {
    const step = timeline[state.stepIndex];
    if (!step) break;
    state = processStep(
      state,
      step,
      LUNAR_ICE_EXPLORER,
      metrics,
      config,
      timeline.length,
      step.event?.options[0]?.id,
    );
    guard += 1;
  }
  return state;
}

describe('timeline', () => {
  it('produces the same events for the same configuration and seed', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const a = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    const b = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    expect(a.map((step) => [step.id, step.event?.id ?? null])).toEqual(
      b.map((step) => [step.id, step.event?.id ?? null]),
    );
  });

  it('changes the draw when the seed changes', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const a = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    const b = buildTimeline(
      LUNAR_ICE_EXPLORER,
      { ...GOOD_CONFIG, seed: 777 },
      metrics,
    );
    expect(a.map((step) => step.event?.id ?? null)).not.toEqual(
      b.map((step) => step.event?.id ?? null),
    );
  });

  it('has seven steps and automates cruise, orbit and descent', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const timeline = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    expect(timeline).toHaveLength(7);
    expect(timeline.slice(0, 3).every((step) => step.kind === 'auto')).toBe(true);
    expect(timeline.slice(3).every((step) => step.kind === 'decision')).toBe(true);
  });
});

describe('simulator', () => {
  it('replays identically for the same configuration and decisions', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const timeline = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    const first = run(GOOD_CONFIG, timeline);
    const second = run(GOOD_CONFIG, timeline);
    expect(first).toEqual(second);
  });

  it('completes a balanced mission with the required objectives', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const timeline = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    const state = run(GOOD_CONFIG, timeline);
    expect(state.finished).toBe(true);
    expect(state.outcome).toBe('success');
    expect(state.completedObjectiveIds).toContain('ice-detection');
    expect(state.completedObjectiveIds).toContain('subsurface-ice-mapping');
    expect(state.dataTransmittedMbit).toBeGreaterThanOrEqual(
      LUNAR_ICE_EXPLORER.requiredDataMbit,
    );
  });

  it('fails when the power system cannot sustain the science load', () => {
    const metrics = computeMetrics(POWER_HUNGRY_CONFIG, LUNAR_ICE_EXPLORER);
    const timeline = buildTimeline(LUNAR_ICE_EXPLORER, POWER_HUNGRY_CONFIG, metrics);
    const state = run(POWER_HUNGRY_CONFIG, timeline);
    expect(state.finished).toBe(true);
    expect(state.outcome).toBe('failure');
    expect(state.instrumentHealth).toBeLessThan(0.5);
  });

  it('loses the link for one step when a contact-loss event occurs', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const timeline = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    const step: OpsStep = {
      ...timeline[3],
      event: {
        id: 'test-dropout',
        family: 'comms-dropout',
        title: 'Contact window lost',
        description: 'Test event.',
        severity: 'critical',
        initialEffect: { commsLost: true },
        options: [
          { id: 'buffer', label: 'Buffer the data', description: '', effect: {} },
          { id: 'repoint', label: 'Repoint the antenna', description: '', effect: { commsRestored: true } },
        ],
      },
    };
    const state = createSimulation(GOOD_CONFIG, metrics, timeline);
    const buffered = processStep(
      { ...state, stepIndex: 3 },
      step,
      LUNAR_ICE_EXPLORER,
      metrics,
      GOOD_CONFIG,
      timeline.length,
      'buffer',
    );
    expect(buffered.commsOnline).toBe(false);

    const nextStep = timeline[4];
    const recovered = processStep(
      buffered,
      nextStep,
      LUNAR_ICE_EXPLORER,
      metrics,
      GOOD_CONFIG,
      timeline.length,
      nextStep.event?.options[0]?.id,
    );
    expect(recovered.commsOnline).toBe(true);
    expect(recovered.log.some((entry) => entry.message.includes('re-established'))).toBe(true);

    const repointed = processStep(
      { ...state, stepIndex: 3 },
      step,
      LUNAR_ICE_EXPLORER,
      metrics,
      GOOD_CONFIG,
      timeline.length,
      'repoint',
    );
    expect(repointed.commsOnline).toBe(true);
  });

  it('requires a decision when an event is active', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const timeline = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    const step = timeline.find((item) => item.kind === 'decision' && item.event);
    expect(step).toBeDefined();
    const state = createSimulation(GOOD_CONFIG, metrics, timeline);
    const withoutChoice = processStep(
      { ...state, stepIndex: timeline.indexOf(step as OpsStep) },
      step as OpsStep,
      LUNAR_ICE_EXPLORER,
      metrics,
      GOOD_CONFIG,
      timeline.length,
    );
    const withChoice = processStep(
      { ...state, stepIndex: timeline.indexOf(step as OpsStep) },
      step as OpsStep,
      LUNAR_ICE_EXPLORER,
      metrics,
      GOOD_CONFIG,
      timeline.length,
      (step as OpsStep).event?.options[0].id,
    );
    expect(withoutChoice.log.some((entry) => entry.message.startsWith('Decision:'))).toBe(false);
    expect(withChoice.log.some((entry) => entry.message.startsWith('Decision:'))).toBe(true);
  });
});

describe('report', () => {
  it('summarises objectives, data and scores', () => {
    const metrics = computeMetrics(GOOD_CONFIG, LUNAR_ICE_EXPLORER);
    const timeline = buildTimeline(LUNAR_ICE_EXPLORER, GOOD_CONFIG, metrics);
    const state = run(GOOD_CONFIG, timeline);
    const vehicle = LAUNCH_VEHICLES_BY_ID['lv-falcon9'];
    const report = buildReport(state, LUNAR_ICE_EXPLORER, metrics, vehicle);
    expect(report.outcome).toBe('success');
    expect(report.objectivesCompleted.length).toBeGreaterThanOrEqual(2);
    expect(report.scores.total).toBeGreaterThan(0);
    expect(report.scores.total).toBeLessThanOrEqual(100);
    expect(report.energyGeneratedWh).toBeGreaterThan(0);
    expect(report.keyDecisions.length).toBeGreaterThanOrEqual(0);
    expect(report.lessons.length).toBeGreaterThan(0);
  });
});
