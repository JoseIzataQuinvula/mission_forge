import type {
  Mission,
  MissionConfiguration,
  OpsStep,
  SimEffect,
  SimLogEntry,
  SimulationState,
  SpacecraftMetrics,
} from '../../types';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const round1 = (value: number) => Math.round(value * 10) / 10;

function log(
  state: SimulationState,
  message: string,
  severity: SimLogEntry['severity'],
): void {
  state.log.push({ step: state.stepIndex, message, severity });
}

/**
 * Creates a fresh simulation. Battery starts full: the spacecraft charges
 * during the cruise phase, which is not simulated hour by hour.
 */
export function createSimulation(
  config: MissionConfiguration,
  metrics: SpacecraftMetrics,
  timeline: OpsStep[],
): SimulationState {
  return {
    seed: config.seed,
    stepIndex: 0,
    batteryWh: metrics.power.batteryCapacityWh,
    batteryCapacityWh: metrics.power.batteryCapacityWh,
    consecutiveDepletions: 0,
    instrumentHealth: 1,
    commsOnline: true,
    commsBlackout: false,
    dataCollectedMbit: 0,
    dataTransmittedMbit: 0,
    energyUsedWh: 0,
    energyGeneratedWh: 0,
    completedObjectiveIds: [],
    log: [
      {
        step: 0,
        message: `Simulation started (seed ${config.seed}). ${timeline.length} steps planned.`,
        severity: 'info',
      },
    ],
    finished: false,
    outcome: null,
  };
}

function applyEffect(state: SimulationState, effect: SimEffect): void {
  if (effect.batteryDeltaWh) {
    state.batteryWh = clamp(
      state.batteryWh + effect.batteryDeltaWh,
      0,
      state.batteryCapacityWh,
    );
  }
  if (effect.instrumentHealthDelta) {
    state.instrumentHealth = clamp(
      state.instrumentHealth + effect.instrumentHealthDelta,
      0,
      1,
    );
  }
  if (effect.dataDeltaMbit) {
    state.dataCollectedMbit = Math.max(0, state.dataCollectedMbit + effect.dataDeltaMbit);
    // A decision can discard buffered data; never report more data on Earth
    // than the spacecraft actually collected.
    state.dataTransmittedMbit = Math.min(
      state.dataTransmittedMbit,
      state.dataCollectedMbit,
    );
  }
  if (effect.transmittedDeltaMbit) {
    state.dataTransmittedMbit = Math.min(
      state.dataCollectedMbit,
      state.dataTransmittedMbit + effect.transmittedDeltaMbit,
    );
  }
  if (effect.energyUsedWh) {
    state.energyUsedWh += Math.max(0, effect.energyUsedWh);
  }
  if (effect.commsLost) {
    state.commsOnline = false;
    state.commsBlackout = true;
  }
  if (effect.commsRestored) {
    state.commsOnline = true;
    state.commsBlackout = false;
  }
  if (effect.note) log(state, effect.note, 'info');
}

/**
 * Runs one operational step. The step physics (energy, data, thermal) happen
 * first, then the player's decision effect, then the state is evaluated.
 */
export function processStep(
  previous: SimulationState,
  step: OpsStep,
  mission: Mission,
  metrics: SpacecraftMetrics,
  config: MissionConfiguration,
  timelineLength: number,
  choiceId?: string,
): SimulationState {
  if (previous.finished) return previous;

  const state: SimulationState = {
    ...previous,
    log: [...previous.log],
    completedObjectiveIds: [...previous.completedObjectiveIds],
    stepIndex: previous.stepIndex + 1,
  };

  // A contact loss lasts one step: the next ground station pass recovers it.
  if (state.commsBlackout) {
    state.commsOnline = true;
    state.commsBlackout = false;
    log(state, 'Contact with Earth re-established at the next window.', 'info');
  }

  // ------------------------------------------------------------- BASELINE OPS
  const generationWh = (metrics.power.dailyGenerationWh * mission.stepHours) / 24;
  const nominalWh = (metrics.power.nominalConsumptionW * mission.stepHours) / 1;
  const healthFactor = 0.35 + state.instrumentHealth * 0.65;
  const scienceWh =
    step.instrumentsActive && state.instrumentHealth > 0.1
      ? metrics.power.scienceLoadW * mission.stepHours * healthFactor
      : 0;

  state.energyGeneratedWh += generationWh;
  state.energyUsedWh += nominalWh + scienceWh;
  state.batteryWh = state.batteryWh + generationWh - nominalWh - scienceWh;

  if (state.batteryWh < 0) {
    const deficit = Math.abs(state.batteryWh);
    state.batteryWh = 0;
    state.consecutiveDepletions += 1;
    const strain = clamp(deficit / Math.max(metrics.power.batteryCapacityWh, 1), 0, 1);
    state.instrumentHealth = clamp(state.instrumentHealth - (0.08 + strain * 0.12), 0, 1);
    log(
      state,
      `Energy deficit of ${Math.round(deficit)} Wh: the instruments lose reliability.`,
      'warning',
    );
  } else {
    state.consecutiveDepletions = 0;
    if (state.batteryWh > state.batteryCapacityWh) {
      state.batteryWh = state.batteryCapacityWh;
    }
  }

  if (step.instrumentsActive && state.batteryWh > 0 && state.instrumentHealth > 0.1) {
    const collected = metrics.science.dataPerStepMbit * healthFactor;
    state.dataCollectedMbit += collected;
    log(
      state,
      `${round1(collected)} Mbit collected by the instruments (health ${Math.round(
        state.instrumentHealth * 100,
      )}%).`,
      'info',
    );
  }

  applyEffect(state, step.autoEffect ?? {});
  applyEffect(state, step.event?.initialEffect ?? {});

  const choice = step.event?.options.find((option) => option.id === choiceId);
  if (choice) {
    applyEffect(state, choice.effect);
    log(state, `Decision: ${choice.label}.`, 'info');
  }

  // Transmission happens after the event and the decision, so restoring the
  // link in time actually saves the current contact window.
  if (state.commsOnline) {
    const transmitted = Math.min(
      metrics.science.downlinkCapacityPerStepMbit,
      state.dataCollectedMbit - state.dataTransmittedMbit,
    );
    if (transmitted > 0) {
      state.dataTransmittedMbit += transmitted;
      log(state, `${round1(transmitted)} Mbit transmitted to Earth.`, 'info');
    }
  } else {
    log(state, 'No contact with Earth: data remains in the buffer.', 'warning');
  }

  // --------------------------------------------------------------- OBJECTIVES
  const threshold = mission.requiredDataMbit * 0.4;
  for (const objective of mission.objectives) {
    if (state.completedObjectiveIds.includes(objective.id)) continue;
    const supported = objective.instrumentIds.some((id) =>
      config.componentIds.includes(id),
    );
    const hasData = state.dataTransmittedMbit >= threshold;
    if (supported && hasData && state.instrumentHealth >= 0.45) {
      state.completedObjectiveIds.push(objective.id);
      log(state, `Objective complete: ${objective.title}.`, 'pass');
    }
  }

  // ------------------------------------------------------------------- FAILURE
  if (state.consecutiveDepletions >= 2 && state.batteryCapacityWh > 0) {
    state.finished = true;
    state.outcome = 'failure';
    log(
      state,
      'The battery was empty on two consecutive steps. The spacecraft lost the ability to operate.',
      'failed',
    );
    return state;
  }

  if (state.instrumentHealth <= 0.05) {
    state.finished = true;
    state.outcome = 'failure';
    log(state, 'The science payload became inoperable. Mission lost.', 'failed');
    return state;
  }

  if (state.stepIndex >= timelineLength) {
    state.finished = true;
    const completedRequired = mission.requiredObjectives.every((id) =>
      state.completedObjectiveIds.includes(id),
    );
    const enoughData = state.dataTransmittedMbit >= mission.requiredDataMbit;
    state.outcome = completedRequired && enoughData ? 'success' : 'partial';
    log(
      state,
      state.outcome === 'success'
        ? 'Mission complete with every required objective.'
        : 'Mission ended with objectives still outstanding.',
      state.outcome === 'success' ? 'pass' : 'warning',
    );
  }

  return state;
}
