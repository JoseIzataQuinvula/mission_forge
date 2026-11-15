/**
 * Shared type definitions for MISSION FORGE.
 *
 * Units (kept consistent across the whole engine):
 * - Mass: kilograms (kg)
 * - Cost: millions of US dollars (M USD), illustrative game economy
 * - Power: watts (W) — instantaneous
 * - Energy: watt-hours (Wh) — integrated over time
 * - Data: megabits (Mbit) and megabits per second (Mbps)
 * - Temperature: degrees Celsius (°C)
 */

export type PhaseId =
  | 'briefing'
  | 'design'
  | 'validation'
  | 'launch'
  | 'operations'
  | 'debrief';

export type ComponentCategory =
  | 'structure'
  | 'power'
  | 'propulsion'
  | 'communication'
  | 'instruments'
  | 'thermal';

/** How a value should be read by the player: sourced fact or game simplification. */
export type DataKind = 'heritage-based' | 'illustrative';

export interface SpacecraftComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  /** Dry mass added to the spacecraft. */
  massKg: number;
  /** Cost in millions of USD (illustrative game economy). */
  costUsdM: number;
  /** Continuous electrical consumption when the subsystem is active. */
  powerConsumptionW: number;
  /** Continuous electrical production (RTG, solar array average). */
  powerProductionW: number;
  /** True when production does not depend on sunlight (RTG). */
  constantProduction?: boolean;
  /** Usable storage capacity added (batteries). */
  batteryCapacityWh?: number;
  /** 0–100 scientific capability contributed. */
  scienceCapability: number;
  /** Scientific objectives this instrument addresses. */
  objectives?: string[];
  /** Data generated per mission operations step when active. */
  dataPerStepMbit?: number;
  /** Downlink capacity contributed. */
  downlinkMbps?: number;
  /** 0–100 thermal protection contributed. */
  thermalProtection?: number;
  /** 0–100 structural robustness contributed (landing tolerance). */
  structuralRating?: number;
  /** Propellant loaded for the descent/ascent manoeuvres. */
  propellantMassKg?: number;
  /** Manoeuvre capabilities provided (used by launch/validation rules). */
  capabilities?: Array<'descent' | 'cruise' | 'precision-landing'>;
  /** Maximum number of copies allowed on one spacecraft. */
  maxCount: number;
  advantages: string[];
  disadvantages: string[];
  /** Short source note or "Valor ilustrativo". */
  source: string;
  dataKind: DataKind;
}

export type LaunchVehicleId = string;

export interface LaunchVehicle {
  id: LaunchVehicleId;
  name: string;
  /** Payload capacity toward lunar transfer, simplified. */
  payloadCapacityKg: number;
  costUsdM: number;
  /** 0–1 launch reliability used by the simulation. */
  reliability: number;
  description: string;
  source: string;
  dataKind: DataKind;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  /** Instrument ids that can satisfy this objective. */
  instrumentIds: string[];
}

export type ValidationSeverity = 'pass' | 'warning' | 'failed';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  title: string;
  problem: string;
  why: string;
  consequence: string;
  fix: string;
  subsystem: ComponentCategory | 'mission' | 'launch';
}

export interface ValidationResult {
  status: 'pass' | 'warning' | 'failed';
  canLaunch: boolean;
  issues: ValidationIssue[];
  passed: number;
  warnings: number;
  failed: number;
}

export interface Mission {
  id: string;
  name: string;
  codename: string;
  destination: string;
  objective: string;
  description: string;
  budgetUsdM: number;
  maxMassKg: number;
  /** Number of operations steps simulated on the surface / cruise. */
  opsSteps: number;
  /** Hours represented by one operations step. */
  stepHours: number;
  /** Hours of surface operation simulated. */
  surfaceHours: number;
  /** Fraction of each Earth day with usable solar illumination at the site. */
  illuminationFraction: number;
  /** Ground contact window per operations step (seconds). */
  contactWindowSeconds: number;
  objectives: MissionObjective[];
  requiredObjectives: string[];
  requiredScienceScore: number;
  requiredDataMbit: number;
  environment: {
    dayTemperatureC: number;
    nightTemperatureC: number;
    description: string;
  };
}

export interface MissionConfiguration {
  componentIds: string[];
  launchVehicleId: LaunchVehicleId | null;
  seed: number;
}

export interface MassBudget {
  dryMassKg: number;
  propellantMassKg: number;
  totalMassKg: number;
}

export interface PowerBudget {
  productionW: number;
  /** Housekeeping, propulsion standby, communications and thermal. */
  nominalConsumptionW: number;
  /** Electrical load of scientific instruments when active. */
  scienceLoadW: number;
  peakConsumptionW: number;
  nominalMarginW: number;
  peakMarginW: number;
  batteryCapacityWh: number;
  /** Energy generated per Earth day at the selected site. */
  dailyGenerationWh: number;
  /** Energy consumed per Earth day in nominal operations. */
  dailyConsumptionWh: number;
  /** Energy consumed per Earth day with all instruments active. */
  peakDailyConsumptionWh: number;
  /** Battery Wh needed to survive the lunar night with nominal loads. */
  nightEnergyNeedWh: number;
}

export interface ScienceBudget {
  score: number;
  objectivesCovered: string[];
  objectivesMissing: string[];
  dataPerStepMbit: number;
  downlinkMbps: number;
  /** Mbit receivable in one contact window. */
  downlinkCapacityPerStepMbit: number;
  thermalProtection: number;
  structuralRating: number;
}

export interface SpacecraftMetrics {
  mass: MassBudget;
  cost: { totalUsdM: number; remainingUsdM: number; overBudget: boolean };
  power: PowerBudget;
  science: ScienceBudget;
  componentCount: number;
  countsByCategory: Record<ComponentCategory, number>;
  readiness: number;
}

export type SimEventOptionId = string;

export interface SimEffect {
  batteryDeltaWh?: number;
  instrumentHealthDelta?: number;
  dataDeltaMbit?: number;
  transmittedDeltaMbit?: number;
  commsRestored?: boolean;
  commsLost?: boolean;
  energyUsedWh?: number;
  note?: string;
}

export interface SimDecisionOption {
  id: SimEventOptionId;
  label: string;
  description: string;
  effect: SimEffect;
}

export interface SimulationEvent {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  /** Event family used to avoid repeating the same flavour too often. */
  family: string;
  /** State change caused by the event itself, applied before the decision. */
  initialEffect?: SimEffect;
  options: SimDecisionOption[];
}

export type OpsStepKind = 'auto' | 'decision';

export interface OpsStep {
  id: string;
  title: string;
  /** Timeline label shown in the operations log. */
  phaseLabel: string;
  kind: OpsStepKind;
  narrative: string;
  /** Instruments collect data during this step. */
  instrumentsActive: boolean;
  /** Deterministic effect applied when the step is processed. */
  autoEffect?: SimEffect;
  event?: SimulationEvent;
}

export interface SimLogEntry {
  step: number;
  message: string;
  severity: ValidationSeverity | 'info';
}

export interface SimulationState {
  seed: number;
  stepIndex: number;
  batteryWh: number;
  batteryCapacityWh: number;
  /** Consecutive steps that ended with an empty battery. */
  consecutiveDepletions: number;
  instrumentHealth: number;
  commsOnline: boolean;
  /** A contact loss that recovers automatically at the next step. */
  commsBlackout: boolean;
  dataCollectedMbit: number;
  dataTransmittedMbit: number;
  energyUsedWh: number;
  energyGeneratedWh: number;
  completedObjectiveIds: string[];
  log: SimLogEntry[];
  finished: boolean;
  outcome: 'success' | 'partial' | 'failure' | null;
}

export interface SimulationReport {
  outcome: 'success' | 'partial' | 'failure';
  headline: string;
  summary: string;
  objectivesCompleted: MissionObjective[];
  objectivesFailed: MissionObjective[];
  dataCollectedMbit: number;
  dataTransmittedMbit: number;
  energyUsedWh: number;
  energyGeneratedWh: number;
  energyEfficiency: number;
  instrumentHealth: number;
  finalBatteryWh: number;
  scores: {
    engineering: number;
    science: number;
    efficiency: number;
    reliability: number;
    total: number;
  };
  keyDecisions: string[];
  lessons: string[];
  massTotalKg: number;
  budgetUsedUsdM: number;
}

/** Alias used by the public API: the report produced at the end of a mission. */
export type MissionReport = SimulationReport;
