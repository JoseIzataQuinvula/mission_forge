import { COMPONENTS_BY_ID } from '../../data/spacecraftComponents';
import { LAUNCH_VEHICLES_BY_ID } from '../../data/launchVehicles';
import type {
  Mission,
  MissionConfiguration,
  ValidationIssue,
  ValidationResult,
  ValidationSeverity,
} from '../../types';
import { computeMetrics } from '../calculations/metrics';

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Technical review executed before launch.
 *
 * Every issue carries four pieces of information the player needs:
 * what is wrong, why it matters, the likely consequence and how to fix it.
 * PASS entries are included too, so the review reads like a real checklist.
 */
export function validateMission(
  config: MissionConfiguration,
  mission: Mission,
): ValidationResult {
  const metrics = computeMetrics(config, mission);
  const issues: ValidationIssue[] = [];
  const hasPropulsionWith = (capability: 'descent' | 'cruise' | 'precision-landing') =>
    config.componentIds.some((id) =>
      COMPONENTS_BY_ID[id]?.capabilities?.includes(capability),
    );

  const add = (
    severity: ValidationSeverity,
    code: string,
    subsystem: ValidationIssue['subsystem'],
    title: string,
    problem: string,
    why: string,
    consequence: string,
    fix: string,
  ) => {
    issues.push({ severity, code, subsystem, title, problem, why, consequence, fix });
  };

  // ------------------------------------------------------------- STRUCTURE
  if (metrics.countsByCategory.structure === 0) {
    add(
      'failed',
      'STRUCTURE_MISSING',
      'structure',
      'No structure selected',
      'The spacecraft has no structural bus.',
      'Every subsystem needs a structure to mount and protect it.',
      'The mission cannot be integrated or launched.',
      'Select one of the three buses in the Structure category.',
    );
  } else {
    add(
      'pass',
      'STRUCTURE_OK',
      'structure',
      'Structure integrated',
      `Structural bus selected (${metrics.countsByCategory.structure}).`,
      'The structure supports the subsystems and launch loads.',
      'No negative consequence in this check.',
      'No action required.',
    );
  }

  // ----------------------------------------------------------------- POWER
  if (metrics.power.productionW === 0 && metrics.power.batteryCapacityWh === 0) {
    add(
      'failed',
      'POWER_SOURCE_MISSING',
      'power',
      'No power source',
      'The spacecraft has neither power generation nor storage.',
      'Without electricity there are no communications, instruments or heating.',
      'The spacecraft becomes inoperable immediately after separation.',
      'Add a solar system (with battery) or a radioisotope power system.',
    );
  } else if (metrics.power.productionW < metrics.power.nominalConsumptionW) {
    add(
      'failed',
      'POWER_HOUSEKEEPING_DEFICIT',
      'power',
      'Housekeeping power deficit',
      `Generation (${metrics.power.productionW} W) is below nominal loads (${metrics.power.nominalConsumptionW} W).`,
      'Nominal loads include communications, thermal control and avionics, which must always run.',
      'The battery drains even with instruments off and the mission enters failure.',
      'Increase generation (solar system) or reduce consumption (low-gain antenna, radiator instead of heaters).',
    );
  } else {
    add(
      'pass',
      'POWER_NOMINAL_OK',
      'power',
      'Positive nominal power balance',
      `Margin of ${metrics.power.nominalMarginW} W for essential loads.`,
      'Generation covers the loads that can never be switched off.',
      'The spacecraft stays alive between science observations.',
      'No action required.',
    );
  }

  if (metrics.power.peakMarginW < 0) {
    add(
      'warning',
      'POWER_PEAK_DEFICIT',
      'power',
      'Instruments exceed instantaneous generation',
      `With all instruments on, the deficit is ${Math.abs(metrics.power.peakMarginW)} W.`,
      'The battery must cover what the source does not produce.',
      'Science capability is limited to short windows; without enough battery the instruments shut down mid-observation.',
      'Add battery capacity, remove instruments or choose a higher-power source.',
    );
  }

  const usesSolar = metrics.power.productionW > 0 && config.componentIds.some((id) => {
    const component = COMPONENTS_BY_ID[id];
    return Boolean(component?.powerProductionW) && !component?.constantProduction;
  });

  if (usesSolar && metrics.power.batteryCapacityWh === 0) {
    add(
      'failed',
      'BATTERY_MISSING',
      'power',
      'No battery for the lunar shadow',
      'The spacecraft relies on solar power but has no storage.',
      'The landing site spends part of the day without illumination.',
      'The spacecraft loses power in the first shadow and never wakes up.',
      'Choose the Solar Array + 1.2 kWh Battery or a radioisotope system.',
    );
  } else if (
    usesSolar &&
    metrics.power.batteryCapacityWh < metrics.power.nightEnergyNeedWh
  ) {
    add(
      'warning',
      'BATTERY_SMALL',
      'power',
      'Battery small for the lunar night',
      `The battery (${metrics.power.batteryCapacityWh} Wh) is below the estimated need for shadow (${metrics.power.nightEnergyNeedWh} Wh).`,
      'Essential loads keep consuming during darkness.',
      'The spacecraft enters forced hibernation and may not recover communications.',
      'Increase battery capacity or reduce permanent loads (for example, passive thermal control).',
    );
  }

  if (
    metrics.power.dailyGenerationWh > 0 &&
    metrics.power.dailyGenerationWh < metrics.power.dailyConsumptionWh
  ) {
    add(
      'failed',
      'POWER_DAILY_DEFICIT',
      'power',
      'Insufficient daily energy',
      `${metrics.power.dailyGenerationWh} Wh/day is generated against ${metrics.power.dailyConsumptionWh} Wh/day of nominal loads.`,
      'The energy available over a lunar day is what guarantees continuous operations.',
      'The mission loses charge until it fails, even with a battery.',
      'Reduce consumption or increase power generation.',
    );
  }

  // --------------------------------------------------------- COMMUNICATION
  if (metrics.countsByCategory.communication === 0) {
    add(
      'failed',
      'COMMS_MISSING',
      'communication',
      'No communication system',
      'There is no antenna on board.',
      'Without a link to Earth there are no commands and no science data.',
      'The mission is technically useless even if the landing goes well.',
      'Add an antenna in the Communication category.',
    );
  } else if (metrics.science.dataPerStepMbit > metrics.science.downlinkCapacityPerStepMbit) {
    add(
      'warning',
      'COMMS_BANDWIDTH_LOW',
      'communication',
      'Bandwidth insufficient for the science payload',
      `Instruments generate ${metrics.science.dataPerStepMbit} Mbit per step and the antenna delivers ${metrics.science.downlinkCapacityPerStepMbit} Mbit per contact.`,
      'Data accumulates faster than it can be transmitted.',
      'Part of the measurements never reaches Earth and objectives may remain incomplete.',
      'Choose the high-gain/redundant antenna, remove instruments or increase the contact window.',
    );
  } else {
    add(
      'pass',
      'COMMS_OK',
      'communication',
      'Adequate data link',
      `${metrics.science.downlinkCapacityPerStepMbit} Mbit per contact for ${metrics.science.dataPerStepMbit} Mbit generated.`,
      'The data fits within the available contact window.',
      'Science results can be transmitted.',
      'No action required.',
    );
  }

  // -------------------------------------------------------------- PROPULSION
  if (metrics.countsByCategory.propulsion === 0) {
    add(
      'failed',
      'PROPULSION_MISSING',
      'propulsion',
      'No propulsion',
      'The spacecraft has no engine to perform the descent.',
      'Lunar insertion and landing require velocity control.',
      'The spacecraft cannot land on the surface.',
      'Select a descent engine in the Propulsion category.',
    );
  } else if (!hasPropulsionWith('descent')) {
    add(
      'failed',
      'PROPULSION_NO_DESCENT',
      'propulsion',
      'Propulsion incompatible with landing',
      'The selected engine is for cruise and has no thrust for the final descent.',
      'An ion engine accelerates very slowly and cannot counter lunar gravity during approach.',
      'The spacecraft remains in orbit or impacts the surface.',
      'Choose a hypergolic or methane/LOX engine.',
    );
  } else {
    add(
      'pass',
      'PROPULSION_OK',
      'propulsion',
      'Descent propulsion available',
      'An engine with descent capability is installed.',
      'Velocity can be reduced until contact with the ground.',
      'The landing can be attempted.',
      'No action required.',
    );
  }

  // --------------------------------------------------------------- SCIENCE
  const missingObjectives = metrics.science.objectivesMissing;
  if (metrics.countsByCategory.instruments === 0) {
    add(
      'failed',
      'INSTRUMENTS_MISSING',
      'instruments',
      'No science instruments',
      'The spacecraft carries no instruments.',
      'The mission goal is scientific; without sensors there are no discoveries.',
      'The mission would achieve the landing but fail its primary objective.',
      'Select at least the neutron spectrometer and the radar.',
    );
  } else if (missingObjectives.length > 0) {
    add(
      'failed',
      'SCIENCE_OBJECTIVES_MISSING',
      'instruments',
      'Required objectives without instruments',
      `Missing instruments for: ${missingObjectives.join(', ')}.`,
      'Each required objective needs a specific sensor on board.',
      'The final report would count those objectives as not completed.',
      'Add the instruments associated with the missing objectives.',
    );
  } else {
    add(
      'pass',
      'SCIENCE_OBJECTIVES_OK',
      'instruments',
      'Required objectives covered',
      'Every required objective has dedicated instrumentation.',
      'The mission can produce the measurements it was asked for.',
      'The science component is technically viable.',
      'No action required.',
    );
  }

  if (metrics.science.score < mission.requiredScienceScore) {
    add(
      'warning',
      'SCIENCE_SCORE_LOW',
      'instruments',
      'Science capability below recommendation',
      `Capability of ${metrics.science.score}/100 against a recommended ${mission.requiredScienceScore}/100.`,
      'Fewer instruments means less independent confirmation of results.',
      'The ice discovery will be less robust and the science score lower.',
      'Add complementary instruments such as the context camera or the drill.',
    );
  } else {
    add(
      'pass',
      'SCIENCE_SCORE_OK',
      'instruments',
      'Sufficient science capability',
      `Capability of ${metrics.science.score}/100.`,
      'The science payload can validate results with more than one sensor.',
      'A good basis for reaching the objectives with margin.',
      'No action required.',
    );
  }

  const surfaceScienceSteps = Math.max(1, mission.opsSteps - 3);
  const estimatedScienceDataMbit = round1(
    metrics.science.dataPerStepMbit * surfaceScienceSteps * 0.85,
  );

  if (estimatedScienceDataMbit < mission.requiredDataMbit) {
    add(
      'warning',
      'SCIENCE_DATA_VOLUME_LOW',
      'instruments',
      'Not enough science data for the objective',
      `The science payload produces about ${estimatedScienceDataMbit} Mbit across the ${surfaceScienceSteps} surface steps, below the required ${mission.requiredDataMbit} Mbit.`,
      'The minimum data volume is one of the mission success criteria.',
      'Even with every objective covered, the mission would end as partial.',
      'Add an instrument with a higher data volume, such as the context camera.',
    );
  } else {
    add(
      'pass',
      'SCIENCE_DATA_VOLUME_OK',
      'instruments',
      'Sufficient data volume',
      `The science payload produces about ${estimatedScienceDataMbit} Mbit across the ${surfaceScienceSteps} surface steps.`,
      'The estimated volume exceeds the mission minimum.',
      'The mission can meet the data criterion.',
      'No action required.',
    );
  }

  const totalDataMbit = metrics.science.dataPerStepMbit * mission.opsSteps;
  const totalDownlinkMbit = metrics.science.downlinkCapacityPerStepMbit * mission.opsSteps;
  if (totalDataMbit > totalDownlinkMbit) {
    add(
      'warning',
      'DATA_VOLUME_HIGH',
      'communication',
      'Total data volume above downlink capacity',
      `The mission would generate ${totalDataMbit} Mbit and can transmit up to ${totalDownlinkMbit} Mbit.`,
      'Onboard memory does not grow and old data may be overwritten.',
      'Part of the science record is lost before reaching Earth.',
      'Increase downlink capacity or reduce the instruments with the highest data volume.',
    );
  }

  // ----------------------------------------------------------------- THERMAL
  if (metrics.countsByCategory.thermal === 0) {
    add(
      'failed',
      'THERMAL_MISSING',
      'thermal',
      'No thermal control',
      'No thermal system has been selected.',
      'The lunar night drops to -180 °C and can damage electronics and instruments.',
      'Instruments fail from cold after the first shadow.',
      'Select MLI + heaters, a radiator or RHU.',
    );
  } else if (metrics.science.thermalProtection < 30) {
    add(
      'failed',
      'THERMAL_LOW',
      'thermal',
      'Insufficient thermal protection',
      `The thermal system provides only ${metrics.science.thermalProtection}/100 protection.`,
      'Surviving the polar night depends on insulation and heating.',
      'High probability of losing instruments during darkness.',
      'Choose the RHU Cold Case + MLI or the MLI + heaters system.',
    );
  } else if (metrics.science.thermalProtection < 45) {
    add(
      'warning',
      'THERMAL_MARGIN_LOW',
      'thermal',
      'Reduced thermal margin',
      `Protection of ${metrics.science.thermalProtection}/100.`,
      'Radiation to space cools exposed panels quickly.',
      'Instrumentation may have intermittent faults in shadow.',
      'Consider a more robust thermal system.',
    );
  } else {
    add(
      'pass',
      'THERMAL_OK',
      'thermal',
      'Adequate thermal control',
      `Protection of ${metrics.science.thermalProtection}/100.`,
      'Electronics are protected from extreme temperature swings.',
      'Instruments should survive the day/night cycle.',
      'No action required.',
    );
  }

  // -------------------------------------------------------------------- MASS
  if (metrics.mass.totalMassKg > mission.maxMassKg) {
    add(
      'failed',
      'MASS_LIMIT_EXCEEDED',
      'mission',
      'Total mass above the mission limit',
      `${metrics.mass.totalMassKg} kg against a maximum of ${mission.maxMassKg} kg.`,
      'The limit represents the maximum mass the integrated system can carry with margin.',
      'The launcher may not be able to inject the spacecraft onto the lunar trajectory.',
      'Remove components or choose lighter alternatives.',
    );
  } else if (metrics.mass.totalMassKg > mission.maxMassKg * 0.9) {
    add(
      'warning',
      'MASS_MARGIN_LOW',
      'mission',
      'Reduced mass margin',
      `${metrics.mass.totalMassKg} kg of ${mission.maxMassKg} kg allowed.`,
      'Mass margins below 10% leave little room for integration surprises.',
      'Any last-minute addition forces an instrument to be removed.',
      'Consider a composite bus or lighter instruments.',
    );
  } else {
    add(
      'pass',
      'MASS_OK',
      'mission',
      'Mass within limit',
      `${metrics.mass.totalMassKg} kg of ${mission.maxMassKg} kg allowed.`,
      'The spacecraft fits the mass budget with a healthy margin.',
      'No risk of excess mass at launch.',
      'No action required.',
    );
  }

  // ------------------------------------------------------------------ BUDGET
  if (metrics.cost.overBudget) {
    add(
      'failed',
      'BUDGET_EXCEEDED',
      'mission',
      'Budget exceeded',
      `Total cost of ${metrics.cost.totalUsdM.toFixed(1)} M USD against ${mission.budgetUsdM} M USD available.`,
      'The budget covers hardware and launch; nothing can be financed outside it.',
      'The mission is cancelled before launch.',
      'Replace expensive components or choose a more affordable launcher.',
    );
  } else if (metrics.cost.remainingUsdM < mission.budgetUsdM * 0.05) {
    add(
      'warning',
      'BUDGET_MARGIN_LOW',
      'mission',
      'Budget reserve almost exhausted',
      `${metrics.cost.remainingUsdM.toFixed(1)} M USD remaining.`,
      'Contingency, testing and integration consume reserve.',
      'A last-minute problem could make the mission unaffordable.',
      'Free up budget by removing a non-essential component.',
    );
  } else {
    add(
      'pass',
      'BUDGET_OK',
      'mission',
      'Budget balanced',
      `${metrics.cost.remainingUsdM.toFixed(1)} M USD remaining out of ${mission.budgetUsdM} M USD.`,
      'There is reserve for integration and test contingency.',
      'Cost does not block the launch.',
      'No action required.',
    );
  }

  // ------------------------------------------------------------------ LAUNCH
  const vehicle = config.launchVehicleId ? LAUNCH_VEHICLES_BY_ID[config.launchVehicleId] : null;
  if (!vehicle) {
    add(
      'warning',
      'LAUNCH_VEHICLE_MISSING',
      'launch',
      'Launch vehicle not selected yet',
      'The spacecraft configuration is defined, but the launch vehicle has not been chosen.',
      'Mass compatibility can only be confirmed after choosing a launcher.',
      'Launch Control will block the launch until a compatible vehicle exists.',
      'Select a vehicle in the Launch Control phase and confirm Go/No-Go.',
    );
  } else if (metrics.mass.totalMassKg > vehicle.payloadCapacityKg) {
    add(
      'failed',
      'LAUNCH_PAYLOAD_EXCEEDED',
      'launch',
      'Payload above launcher capacity',
      `${metrics.mass.totalMassKg} kg against ${vehicle.payloadCapacityKg} kg of capacity.`,
      'The capacity shown is already a simplification of lunar-transfer capability.',
      'The launcher cannot send the spacecraft to the Moon in this configuration.',
      'Choose a larger launcher or reduce spacecraft mass.',
    );
  } else if (metrics.mass.totalMassKg > vehicle.payloadCapacityKg * 0.9) {
    add(
      'warning',
      'LAUNCH_PAYLOAD_TIGHT',
      'launch',
      'Launcher at capacity limit',
      `${metrics.mass.totalMassKg} kg of ${vehicle.payloadCapacityKg} kg.`,
      'With no payload margin, exact performance depends on launch conditions.',
      'The lunar trajectory may demand more performance than available.',
      'Consider a launcher with more capacity or shed mass.',
    );
  } else {
    add(
      'pass',
      'LAUNCH_OK',
      'launch',
      'Compatible launcher',
      `${vehicle.name} supports the ${metrics.mass.totalMassKg} kg mass.`,
      'The payload is within the simplified vehicle capacity.',
      'The mission can proceed to the countdown.',
      'No action required.',
    );
  }

  // --------------------------------------------------------------- LANDING
  if (metrics.science.structuralRating < 50) {
    add(
      'warning',
      'LANDING_ROBUSTNESS_LOW',
      'structure',
      'Limited landing robustness',
      `Structural index of ${metrics.science.structuralRating}/100.`,
      'The polar site has slopes and rocks that demand impact tolerance.',
      'Increases the probability of damage at touchdown.',
      'Choose a reinforced bus or an engine with better descent control.',
    );
  } else {
    add(
      'pass',
      'LANDING_ROBUSTNESS_OK',
      'structure',
      'Adequate landing robustness',
      `Structural index of ${metrics.science.structuralRating}/100.`,
      'The structure absorbs contact with the polar terrain.',
      'The landing has acceptable margin.',
      'No action required.',
    );
  }

  const failed = issues.filter((issue) => issue.severity === 'failed').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  const passed = issues.filter((issue) => issue.severity === 'pass').length;

  return {
    status: failed > 0 ? 'failed' : warnings > 0 ? 'warning' : 'pass',
    canLaunch: failed === 0,
    issues,
    passed,
    warnings,
    failed,
  };
}
