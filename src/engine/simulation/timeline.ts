import type {
  Mission,
  MissionConfiguration,
  OpsStep,
  SimEffect,
  SimulationEvent,
  SpacecraftMetrics,
} from '../../types';
import { createRng, pick } from './random';
import { assessRisk, type RiskAssessment } from './risk';

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Builds the fixed seven-step operational timeline.
 *
 * Cruise, orbit insertion and descent are automatic. Surface operations are
 * decision points drawn deterministically from a family pool; the same
 * configuration and seed always draw the same events in the same order.
 */
export function buildTimeline(
  mission: Mission,
  config: MissionConfiguration,
  metrics: SpacecraftMetrics,
  risk: RiskAssessment = assessRisk(metrics, mission),
): OpsStep[] {
  const signature = `${[...config.componentIds].sort().join('|')}::${config.launchVehicleId ?? 'none'}`;
  const rng = createRng(signature, config.seed);

  const battery = Math.max(metrics.power.batteryCapacityWh, 400);
  const dataPerStep = Math.max(metrics.science.dataPerStepMbit, 1);

  // Landing is deterministic given the spacecraft configuration: a fragile
  // structure always lands harder, but the exact damage depends on the seed.
  const landingDamage = round(
    0.04 + (1 - metrics.science.structuralRating / 100) * 0.24 + rng() * 0.08,
    3,
  );

  const scaled = (base: SimEffect): SimEffect => ({ ...base });

  const energy = (fraction: number) => round(battery * fraction, 0);
  const data = (fraction: number) => round(dataPerStep * fraction, 1);

  const eventPool: Array<() => SimulationEvent> = [
    () => ({
      id: 'comms-dropout',
      family: 'comms-dropout',
      title: 'Contact window lost',
      severity: 'critical',
      description:
        'The signal to Earth dropped mid-transmission. The onboard buffer is nearly full and the next contact is hours away.',
      initialEffect: {
        commsLost: true,
        note: 'Contact with Earth lost.',
      },
      options: [
        {
          id: 'repoint',
          label: 'Repoint the antenna',
          description: `Spends about ${energy(0.07)} Wh of battery, but recovers contact during this step.`,
          effect: scaled({
            batteryDeltaWh: -energy(0.07),
            commsRestored: true,
            note: 'Antenna repointed toward Earth.',
          }),
        },
        {
          id: 'buffer',
          label: 'Buffer the data and wait',
          description: 'Keeps science running and tries to transmit everything at the next contact.',
          effect: scaled({
            instrumentHealthDelta: -0.01,
            note: 'Data buffered; transmission postponed.',
          }),
        },
        {
          id: 'safe-mode',
          label: 'Enter safe mode',
          description: `Saves ${energy(0.04)} Wh and protects the electronics, but loses the science window.`,
          effect: scaled({
            batteryDeltaWh: energy(0.04),
            instrumentHealthDelta: 0.02,
            dataDeltaMbit: -data(0.35),
            commsRestored: true,
            note: 'Safe mode engaged; science collection reduced.',
          }),
        },
      ],
    }),
    () => ({
      id: 'regolith-dust',
      family: 'dust',
      title: 'Lunar dust on the radiators',
      severity: 'warning',
      description:
        'Dust raised by the thrusters settles on the radiators and instrument lenses. Heat dissipation is getting worse.',
      options: [
        {
          id: 'brush',
          label: 'Clean with the actuators',
          description: `Uses ${energy(0.05)} Wh to clean the exposed surfaces.`,
          effect: scaled({
            batteryDeltaWh: -energy(0.05),
            instrumentHealthDelta: 0.04,
            note: 'Radiators and lenses cleaned.',
          }),
        },
        {
          id: 'ignore',
          label: 'Ignore it and keep measuring',
          description: 'Saves power, but overheating degrades the sensors.',
          effect: scaled({
            instrumentHealthDelta: -0.07,
            note: 'Dust accumulated on the radiators.',
          }),
        },
      ],
    }),
    () => ({
      id: 'power-overdraw',
      family: 'power',
      title: 'Consumption above plan',
      severity: 'critical',
      description:
        'Heaters and instruments are drawing more than predicted. The battery is falling faster than planned.',
      options: [
        {
          id: 'shed',
          label: 'Switch off a secondary instrument',
          description: `Saves ${energy(0.06)} Wh and cuts ${data(0.25)} Mbit of data from this step.`,
          effect: scaled({
            batteryDeltaWh: energy(0.06),
            dataDeltaMbit: -data(0.25),
            note: 'Science load reduced to stabilise power.',
          }),
        },
        {
          id: 'draw',
          label: 'Continue at full load',
          description: 'Keeps every instrument active and draws on the battery reserve.',
          effect: scaled({
            batteryDeltaWh: -energy(0.09),
            note: 'Battery reserve used to keep the science going.',
          }),
        },
        {
          id: 'hibernate',
          label: 'Hibernate for the step',
          description: `Recovers ${energy(0.04)} Wh, but loses ${data(0.4)} Mbit of observations.`,
          effect: scaled({
            batteryDeltaWh: energy(0.04),
            dataDeltaMbit: -data(0.4),
            instrumentHealthDelta: 0.01,
            note: 'Short hibernation; observations lost.',
          }),
        },
      ],
    }),
    () => ({
      id: 'long-shadow',
      family: 'thermal',
      title: 'Shadow longer than predicted',
      severity: 'warning',
      description:
        'The terrain blocks the Sun for longer than the model predicted. Electronics temperature is approaching the lower limit.',
      options: [
        {
          id: 'heaters',
          label: 'Prioritise the heaters',
          description: `Spends ${energy(0.1)} Wh, but keeps the instruments within operating temperature.`,
          effect: scaled({
            batteryDeltaWh: -energy(0.1),
            instrumentHealthDelta: 0.02,
            note: 'Heaters at maximum power.',
          }),
        },
        {
          id: 'conserve',
          label: 'Reduce heating',
          description: `Saves ${energy(0.04)} Wh, with a risk of thermal degradation to the sensors.`,
          effect: scaled({
            batteryDeltaWh: energy(0.04),
            instrumentHealthDelta: -0.06,
            note: 'Reduced heating during the shadow.',
          }),
        },
        {
          id: 'instruments-off',
          label: 'Switch off the instruments',
          description: `Saves ${energy(0.06)} Wh and protects the hardware, but loses ${data(0.3)} Mbit.`,
          effect: scaled({
            batteryDeltaWh: energy(0.06),
            dataDeltaMbit: -data(0.3),
            instrumentHealthDelta: 0.03,
            note: 'Instruments switched off during the shadow.',
          }),
        },
      ],
    }),
    () => ({
      id: 'instrument-fault',
      family: 'fault',
      title: 'Instrument channel fault',
      severity: 'critical',
      description:
        'One of the science channels stopped responding. Data still arrives, but with noise and gaps.',
      options: [
        {
          id: 'reset',
          label: 'Restart the instrument',
          description: `Consumes ${energy(0.03)} Wh and tries to recover the failed channel.`,
          effect: scaled({
            batteryDeltaWh: -energy(0.03),
            instrumentHealthDelta: 0.03,
            note: 'Science channel restarted.',
          }),
        },
        {
          id: 'isolate',
          label: 'Isolate the channel and continue',
          description: `Loses ${data(0.2)} Mbit and slightly degrades the sensor suite.`,
          effect: scaled({
            dataDeltaMbit: -data(0.2),
            instrumentHealthDelta: -0.08,
            note: 'Failed channel isolated.',
          }),
        },
        {
          id: 'redundant',
          label: 'Switch to the redundant channel',
          description: `Uses ${energy(0.05)} Wh, but keeps data quality.`,
          effect: scaled({
            batteryDeltaWh: -energy(0.05),
            instrumentHealthDelta: 0.01,
            note: 'Redundant channel activated.',
          }),
        },
      ],
    }),
    () => ({
      id: 'uplink-window',
      family: 'uplink',
      title: 'Final contact window',
      severity: 'info',
      description:
        'The ground station has a short window to downlink the missing data. The battery also needs reserve for the rest of the mission.',
      options: [
        {
          id: 'dump',
          label: 'Transmit the full buffer',
          description: `Downlinks up to ${data(2)} Mbit extra at a cost of ${energy(0.04)} Wh.`,
          effect: scaled({
            batteryDeltaWh: -energy(0.04),
            transmittedDeltaMbit: data(2),
            note: 'Buffer downlinked to Earth.',
          }),
        },
        {
          id: 'science',
          label: 'Keep collecting science',
          description: `Generates ${data(0.3)} Mbit more, which may not arrive in time.`,
          effect: scaled({
            dataDeltaMbit: data(0.3),
            note: 'Science collection extended.',
          }),
        },
        {
          id: 'reserve',
          label: 'Preserve the battery',
          description: `Recovers ${energy(0.05)} Wh for the final steps.`,
          effect: scaled({
            batteryDeltaWh: energy(0.05),
            note: 'Energy preserved for the end of the mission.',
          }),
        },
      ],
    }),
  ];

  // Draw without repetition, deterministically.
  const pool = [...eventPool];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const eventChance = risk.level === 'high' ? 0.95 : risk.level === 'moderate' ? 0.8 : 0.65;
  const decisionIndexes = [3, 4, 5, 6];
  const events: Array<SimulationEvent | undefined> = decisionIndexes.map(() =>
    rng() < eventChance ? pool.pop()?.() : undefined,
  );
  let eventCursor = 0;

  const takeEvent = (): SimulationEvent | undefined => {
    const next = events[eventCursor];
    eventCursor += 1;
    return next;
  };

  const decision = (
    id: string,
    title: string,
    phaseLabel: string,
    narrative: string,
  ): OpsStep => ({
    id,
    title,
    phaseLabel,
    kind: 'decision',
    narrative,
    instrumentsActive: true,
    event: takeEvent(),
  });

  return [
    {
      id: 'step-cruise',
      title: 'Trans-lunar cruise',
      phaseLabel: 'TRANSLUNAR CRUISE',
      kind: 'auto',
      narrative:
        'The spacecraft leaves Earth orbit and heads for the Moon. Systems are checked and the instruments remain off.',
      instrumentsActive: false,
    },
    {
      id: 'step-orbit',
      title: 'Lunar orbit insertion',
      phaseLabel: 'LUNAR ORBIT INSERTION',
      kind: 'auto',
      narrative:
        'The insertion burn places the spacecraft in a low polar orbit. The south polar terrain passes beneath the sensors.',
      instrumentsActive: false,
    },
    {
      id: 'step-descent',
      title: 'Descent and landing',
      phaseLabel: 'POWERED DESCENT',
      kind: 'auto',
      narrative:
        'The descent is performed with the main engine. Contact with the regolith is the highest structural risk of the mission.',
      instrumentsActive: false,
      autoEffect: {
        instrumentHealthDelta: -landingDamage,
        note: `Landing complete with ${Math.round(landingDamage * 100)}% structural damage.`,
      },
    },
    decision(
      'step-deploy',
      'Instrument deployment',
      'SURFACE OPERATIONS',
      'Solar panels and instruments are deployed. The landing site is a permanently shadowed area next to an illuminated ridge.',
    ),
    decision(
      'step-survey',
      'Geological survey',
      'SURFACE OPERATIONS',
      'The spacecraft surveys the landing area and collects context measurements. Ground readings begin to form a map of the ice.',
    ),
    decision(
      'step-sample',
      'Sample collection and analysis',
      'SURFACE OPERATIONS',
      'The drill penetrates the regolith and the mass spectrometer analyses the released volatiles. This is the most science-intensive step.',
    ),
    decision(
      'step-uplink',
      'Final data transmission',
      'DATA UPLINK',
      'The mission enters its last contact window. Anything not transmitted now is lost when operations end.',
    ),
  ];
}

export { pick };
