import { create } from 'zustand';
import { LUNAR_ICE_EXPLORER } from '../data/mission';
import { COMPONENTS_BY_ID } from '../data/spacecraftComponents';
import { LAUNCH_VEHICLES_BY_ID } from '../data/launchVehicles';
import { computeMetrics } from '../engine/calculations/metrics';
import { validateMission } from '../engine/validators/missionValidator';
import { buildTimeline } from '../engine/simulation/timeline';
import {
  createSimulation,
  processStep,
} from '../engine/simulation/simulator';
import { buildReport } from '../engine/simulation/report';
import type {
  MissionConfiguration,
  OpsStep,
  PhaseId,
  SimulationReport,
  SimulationState,
} from '../types';

interface MissionStore {
  phase: PhaseId;
  config: MissionConfiguration;
  timeline: OpsStep[];
  sim: SimulationState | null;
  report: SimulationReport | null;
  decisions: Record<string, string>;
  lastError: string | null;

  setPhase: (phase: PhaseId) => void;
  toggleComponent: (componentId: string) => void;
  selectVehicle: (vehicleId: string) => void;
  setSeed: (seed: number) => void;
  resetConfiguration: () => void;
  startLaunch: () => void;
  advance: (choiceId?: string) => void;
  goToDebrief: () => void;
  restartMission: () => void;
}

const DEFAULT_CONFIG: MissionConfiguration = {
  componentIds: [],
  launchVehicleId: null,
  seed: 2026,
};

export const useMissionStore = create<MissionStore>((set, get) => ({
  phase: 'briefing',
  config: DEFAULT_CONFIG,
  timeline: [],
  sim: null,
  report: null,
  decisions: {},
  lastError: null,

  setPhase: (phase) => set({ phase }),

  toggleComponent: (componentId) => {
    const component = COMPONENTS_BY_ID[componentId];
    if (!component) return;
    const { componentIds } = get().config;

    if (componentIds.includes(componentId)) {
      set({
        config: { ...get().config, componentIds: componentIds.filter((id) => id !== componentId) },
        lastError: null,
        ...invalidateFinishedMission(get),
      });
      return;
    }

    let next = componentIds;
    if (component.category !== 'instruments') {
      // One bus, one power source, one engine, one antenna, one thermal system.
      next = next.filter((id) => COMPONENTS_BY_ID[id]?.category !== component.category);
    } else {
      const copies = next.filter((id) => id === componentId).length;
      if (copies >= component.maxCount) {
        set({ lastError: 'This instrument is already at the onboard copy limit.' });
        return;
      }
    }

    set({
      config: { ...get().config, componentIds: [...next, componentId] },
      lastError: null,
      ...invalidateFinishedMission(get),
    });
  },

  selectVehicle: (vehicleId) => {
    if (!LAUNCH_VEHICLES_BY_ID[vehicleId]) return;
    set({
      config: { ...get().config, launchVehicleId: vehicleId },
      lastError: null,
      ...invalidateFinishedMission(get),
    });
  },

  setSeed: (seed) => {
    if (!Number.isFinite(seed)) return;
    set({
      config: { ...get().config, seed: Math.max(1, Math.round(seed)) },
      ...invalidateFinishedMission(get),
    });
  },

  resetConfiguration: () =>
    set({
      config: { ...get().config, componentIds: [] },
      lastError: null,
      ...invalidateFinishedMission(get),
    }),

  startLaunch: () => {
    const { config, phase } = get();
    const mission = LUNAR_ICE_EXPLORER;
    const metrics = computeMetrics(config, mission);
    const validation = validateMission(config, mission);

    if (!validation.canLaunch) {
      set({ lastError: 'Critical checks are still unresolved. Fix them before launch.' });
      return;
    }

    if (phase === 'launch') {
      const timeline = buildTimeline(mission, config, metrics);
      const sim = createSimulation(config, metrics, timeline);
      set({
        timeline,
        sim,
        report: null,
        decisions: {},
        phase: 'operations',
        lastError: null,
      });
    } else {
      set({ phase: 'launch', lastError: null });
    }
  },

  advance: (choiceId) => {
    const { sim, timeline, config, decisions } = get();
    if (!sim || sim.finished) return;
    const step = timeline[sim.stepIndex];
    if (!step) return;

    if (step.event && !choiceId) {
      set({ lastError: 'This step requires a decision before continuing.' });
      return;
    }

    const mission = LUNAR_ICE_EXPLORER;
    const metrics = computeMetrics(config, mission);
    const next = processStep(sim, step, mission, metrics, config, timeline.length, choiceId);

    const nextDecisions = choiceId ? { ...decisions, [step.id]: choiceId } : decisions;

    if (next.finished) {
      const vehicle = config.launchVehicleId
        ? LAUNCH_VEHICLES_BY_ID[config.launchVehicleId] ?? null
        : null;
      const report = buildReport(next, mission, metrics, vehicle);
      set({ sim: next, decisions: nextDecisions, report, phase: 'debrief', lastError: null });
    } else {
      set({ sim: next, decisions: nextDecisions, lastError: null });
    }
  },

  goToDebrief: () => set({ phase: 'debrief' }),

  restartMission: () =>
    set({
      phase: 'briefing',
      timeline: [],
      sim: null,
      report: null,
      decisions: {},
      lastError: null,
    }),
}));

/**
 * A finished mission belongs to the configuration that produced it. When the
 * player changes the design or the launcher, the old report is no longer valid
 * and must not remain reachable from the stepper.
 */
function invalidateFinishedMission(get: () => MissionStore): Partial<MissionStore> {
  const { sim, report } = get();
  if (!sim && !report) return {};
  return { sim: null, report: null, timeline: [], decisions: {} };
}

export function useMetrics() {
  const config = useMissionStore((store) => store.config);
  return computeMetrics(config, LUNAR_ICE_EXPLORER);
}

export function useValidation() {
  const config = useMissionStore((store) => store.config);
  return validateMission(config, LUNAR_ICE_EXPLORER);
}
