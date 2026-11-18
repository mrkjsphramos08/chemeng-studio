export type ReactorType = 'batch' | 'cstr' | 'pfr';

export interface ReactionEngineeringInputs {
  reactorType: ReactorType;
  initialConcentration_mol_m3: number; // CA0 [mol/m^3]
  rateConstant_per_s: number; // k [s^-1]
  reactorVolume_m3: number; // V [m^3]
  volumetricFlowRate_m3_s: number; // q [m^3/s]
  batchTime_s: number; // t [s]
  targetConversion_pct: number; // X_target [%] in [0, 100]
}

export interface ReactionValidationIssue {
  severity: 'error' | 'warning';
  field?: keyof ReactionEngineeringInputs | 'general';
  message: string;
}

export interface ReactorSnapshotMetrics {
  reactorType: ReactorType;
  label: string;
  characteristicTime_s: number; // t for Batch, tau = V/q for CSTR/PFR
  timeSymbol: 't' | 'τ';
  damkohlerNumber: number; // k * t or k * tau
  outletConcentration_mol_m3: number; // CA [mol/m^3]
  conversion: number; // X in [0, 1]
  conversion_pct: number; // X [%]
  reactionRate_mol_m3_s: number; // -rA = k * CA [mol/(m^3*s)]
  molarFlowConverted_mol_s: number | null; // q * (CA0 - CA) for continuous; null for batch
  molesConverted_mol: number | null; // V * (CA0 - CA) for batch; null for continuous
}

export interface TargetDesignMetrics {
  targetConversion: number; // X_target in [0, 1]
  targetConversion_pct: number;
  isTargetAchievable: boolean;
  unachievableReason: string | null;
  requiredBatchTime_s: number | null; // Batch time excluding turnaround
  requiredVolumePFR_m3: number | null; // Ideal PFR required volume
  requiredVolumeCSTR_m3: number | null; // Ideal CSTR required volume
  cstrToPfrVolumeRatio: number | null; // V_CSTR / V_PFR = X / ((1 - X) * (-ln(1 - X)))
}

export interface ReactionEngineeringResults {
  isValid: boolean;
  validationIssues: ReactionValidationIssue[];
  activeReactor: ReactorSnapshotMetrics;
  batchAtReactionTime: ReactorSnapshotMetrics;
  continuousComparisonAvailable: boolean;
  cstrAtCurrentVolume: ReactorSnapshotMetrics | null;
  pfrAtCurrentVolume: ReactorSnapshotMetrics | null;
  // Continuous reactors evaluated at tau = batchTime_s for clean visual/time-equivalent comparisons
  equivalentCharacteristicTime_s: number; // active tau (for CSTR/PFR) or t (for Batch)
  cstrAtBatchTime: ReactorSnapshotMetrics;
  pfrAtBatchTime: ReactorSnapshotMetrics;
  batchAtResidenceTime: ReactorSnapshotMetrics | null;
  residenceTime_s: number | null; // tau = V / q when q > 0
  targetDesign: TargetDesignMetrics;
}

export interface ReactionPreset {
  id: string;
  name: string;
  description: string;
  inputs: ReactionEngineeringInputs;
}

export interface BatchTimeSeriesPoint {
  time_s: number;
  concentration_mol_m3: number;
  conversion_pct: number;
  reactionRate_mol_m3_s: number;
}

export interface ResidenceTimeSeriesPoint {
  tau_s: number;
  cstrConversion_pct: number;
  pfrConversion_pct: number;
  batchEquivalentConversion_pct: number;
  cstrConcentration_mol_m3: number;
  pfrConcentration_mol_m3: number;
}

export interface PfrVolumeSeriesPoint {
  volume_m3: number;
  concentration_mol_m3: number;
  conversion_pct: number;
  reactionRate_mol_m3_s: number;
}

export interface TargetConversionSizingPoint {
  targetConversion_pct: number;
  cstrRequiredVolume_m3: number | null;
  pfrRequiredVolume_m3: number | null;
  batchRequiredTime_s: number | null;
  cstrToPfrRatio: number | null;
}

export const DEFAULT_REACTION_ENGINEERING_INPUTS: ReactionEngineeringInputs = {
  reactorType: 'pfr',
  initialConcentration_mol_m3: 1000,
  rateConstant_per_s: 0.02,
  reactorVolume_m3: 1.5,
  volumetricFlowRate_m3_s: 0.02,
  batchTime_s: 75,
  targetConversion_pct: 80,
};

export const REACTION_ENGINEERING_PRESETS: ReactionPreset[] = [
  {
    id: 'baseline-pfr',
    name: 'Baseline — First-Order PFR (Da = 1.5)',
    description:
      'Illustrative liquid-phase A → B baseline: CA0 = 1000 mol/m³, k = 0.020 s⁻¹, V = 1.5 m³, q = 0.020 m³/s (τ = 75 s).',
    inputs: { ...DEFAULT_REACTION_ENGINEERING_INPUTS },
  },
  {
    id: 'low-reaction-rate',
    name: 'Low Reaction Rate (k = 0.004 s⁻¹)',
    description:
      'Illustrative slow first-order kinetics in a CSTR: lower conversion at moderate residence time.',
    inputs: {
      reactorType: 'cstr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.004,
      reactorVolume_m3: 2.0,
      volumetricFlowRate_m3_s: 0.015,
      batchTime_s: 133.3,
      targetConversion_pct: 70,
    },
  },
  {
    id: 'high-reaction-rate',
    name: 'High Reaction Rate (k = 0.100 s⁻¹)',
    description:
      'Illustrative rapid first-order conversion in a PFR showing steep initial reactant depletion.',
    inputs: {
      reactorType: 'pfr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.1,
      reactorVolume_m3: 1.0,
      volumetricFlowRate_m3_s: 0.025,
      batchTime_s: 40,
      targetConversion_pct: 90,
    },
  },
  {
    id: 'short-residence-time',
    name: 'Short Residence Time (τ = 15 s, CSTR)',
    description:
      'Illustrative high-throughput CSTR operating at short space time (low Damköhler number Da = 0.30).',
    inputs: {
      reactorType: 'cstr',
      initialConcentration_mol_m3: 800,
      rateConstant_per_s: 0.02,
      reactorVolume_m3: 0.6,
      volumetricFlowRate_m3_s: 0.04,
      batchTime_s: 15,
      targetConversion_pct: 50,
    },
  },
  {
    id: 'long-residence-time',
    name: 'Long Residence Time (τ = 200 s, PFR)',
    description:
      'Illustrative deep-conversion continuous tubular design where CSTR sizing penalty becomes pronounced.',
    inputs: {
      reactorType: 'pfr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.02,
      reactorVolume_m3: 2.0,
      volumetricFlowRate_m3_s: 0.01,
      batchTime_s: 200,
      targetConversion_pct: 95,
    },
  },
  {
    id: 'batch-high-conversion',
    name: 'High-Conversion Batch Run (95% Target)',
    description:
      'Illustrative isothermal batch hold showing exponential concentration decay and 3.0 half-lives of reaction time.',
    inputs: {
      reactorType: 'batch',
      initialConcentration_mol_m3: 1200,
      rateConstant_per_s: 0.025,
      reactorVolume_m3: 1.5,
      volumetricFlowRate_m3_s: 0.02,
      batchTime_s: 120,
      targetConversion_pct: 95,
    },
  },
  {
    id: 'batch-low-conversion',
    name: 'Low-Conversion Batch Regime (Initial Decay)',
    description:
      'Illustrative short batch reaction time where X ≈ kt and CSTR vs. PFR gap remains modest.',
    inputs: {
      reactorType: 'batch',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.012,
      reactorVolume_m3: 1.0,
      volumetricFlowRate_m3_s: 0.02,
      batchTime_s: 20,
      targetConversion_pct: 30,
    },
  },
];

function safeNegExp(x: number): number {
  if (x <= 0) return 1;
  if (x > 700) return 0;
  return Math.exp(-x);
}

/**
 * Computes 1 - exp(-x) stably for tiny and large non-negative x = k*t or k*tau.
 */
function safeFirstOrderConversion(damkohler: number): number {
  if (damkohler <= 0) return 0;
  if (damkohler > 700) return 1;
  const x = -Math.expm1(-damkohler);
  return Math.min(1, Math.max(0, x));
}

function safeCstrConversion(damkohler: number): number {
  if (damkohler <= 0) return 0;
  if (damkohler > 1e12) return 1;
  return Math.min(1, Math.max(0, damkohler / (1 + damkohler)));
}

function evaluateBatch(
  CA0: number,
  k: number,
  V: number,
  t: number
): ReactorSnapshotMetrics {
  const da = k * t;
  const expTerm = safeNegExp(da);
  const conversion = safeFirstOrderConversion(da);
  const CA = CA0 * expTerm;
  const reactionRate = k * CA;
  return {
    reactorType: 'batch',
    label: 'Batch Reactor',
    characteristicTime_s: t,
    timeSymbol: 't',
    damkohlerNumber: da,
    outletConcentration_mol_m3: CA,
    conversion,
    conversion_pct: conversion * 100,
    reactionRate_mol_m3_s: reactionRate,
    molarFlowConverted_mol_s: null,
    molesConverted_mol: V * (CA0 - CA),
  };
}

function evaluateCstr(
  CA0: number,
  k: number,
  V: number,
  q: number,
  tauOverride?: number
): ReactorSnapshotMetrics {
  const tau = tauOverride ?? V / q;
  const effectiveV = tauOverride !== undefined ? tau * q : V;
  const da = k * tau;
  const conversion = safeCstrConversion(da);
  const CA = CA0 / (1 + da);
  const reactionRate = k * CA;
  return {
    reactorType: 'cstr',
    label: 'Ideal CSTR',
    characteristicTime_s: tau,
    timeSymbol: 'τ',
    damkohlerNumber: da,
    outletConcentration_mol_m3: CA,
    conversion,
    conversion_pct: conversion * 100,
    reactionRate_mol_m3_s: reactionRate,
    molarFlowConverted_mol_s: q * (CA0 - CA),
    molesConverted_mol: effectiveV > 0 ? effectiveV * (CA0 - CA) : 0,
  };
}

function evaluatePfr(
  CA0: number,
  k: number,
  V: number,
  q: number,
  tauOverride?: number
): ReactorSnapshotMetrics {
  const tau = tauOverride ?? V / q;
  const effectiveV = tauOverride !== undefined ? tau * q : V;
  const da = k * tau;
  const conversion = safeFirstOrderConversion(da);
  const CA = CA0 * safeNegExp(da);
  const reactionRate = k * CA;
  return {
    reactorType: 'pfr',
    label: 'Ideal PFR',
    characteristicTime_s: tau,
    timeSymbol: 'τ',
    damkohlerNumber: da,
    outletConcentration_mol_m3: CA,
    conversion,
    conversion_pct: conversion * 100,
    reactionRate_mol_m3_s: reactionRate,
    molarFlowConverted_mol_s: q * (CA0 - CA),
    molesConverted_mol: effectiveV > 0 ? effectiveV * (CA0 - CA) : 0,
  };
}

export function validateReactionEngineeringInputs(
  inputs: ReactionEngineeringInputs
): ReactionValidationIssue[] {
  const issues: ReactionValidationIssue[] = [];
  const {
    reactorType,
    initialConcentration_mol_m3: CA0,
    rateConstant_per_s: k,
    reactorVolume_m3: V,
    volumetricFlowRate_m3_s: q,
    batchTime_s: t,
    targetConversion_pct: Xpct,
  } = inputs;

  if (
    !Number.isFinite(CA0) ||
    !Number.isFinite(k) ||
    !Number.isFinite(V) ||
    !Number.isFinite(q) ||
    !Number.isFinite(t) ||
    !Number.isFinite(Xpct)
  ) {
    issues.push({
      severity: 'error',
      field: 'general',
      message: 'All kinetic and reactor design inputs must be finite real numbers.',
    });
    return issues;
  }

  if (CA0 <= 0) {
    issues.push({
      severity: 'error',
      field: 'initialConcentration_mol_m3',
      message: 'Initial concentration CA0 must be strictly positive (> 0 mol/m³).',
    });
  }

  if (k < 0) {
    issues.push({
      severity: 'error',
      field: 'rateConstant_per_s',
      message: 'First-order rate constant k cannot be negative (must be ≥ 0 s⁻¹).',
    });
  }

  if (V < 0) {
    issues.push({
      severity: 'error',
      field: 'reactorVolume_m3',
      message: 'Reactor volume V cannot be negative (must be ≥ 0 m³).',
    });
  }

  if (reactorType !== 'batch' && q <= 0) {
    issues.push({
      severity: 'error',
      field: 'volumetricFlowRate_m3_s',
      message:
        'Volumetric flow rate q must be strictly positive (> 0 m³/s) for steady continuous CSTR and PFR operation.',
    });
  } else if (reactorType === 'batch' && q < 0) {
    issues.push({
      severity: 'error',
      field: 'volumetricFlowRate_m3_s',
      message: 'Reference volumetric flow rate q cannot be negative.',
    });
  }

  if (t < 0) {
    issues.push({
      severity: 'error',
      field: 'batchTime_s',
      message: 'Batch reaction time t cannot be negative (must be ≥ 0 s).',
    });
  }

  if (Xpct < 0 || Xpct > 100) {
    issues.push({
      severity: 'error',
      field: 'targetConversion_pct',
      message: 'Target conversion must lie within 0% ≤ X_target ≤ 100%.',
    });
  }

  const hasError = issues.some((i) => i.severity === 'error');
  if (hasError) return issues;

  // Non-blocking scientific and scope advisories
  if (k === 0) {
    issues.push({
      severity: 'warning',
      field: 'rateConstant_per_s',
      message:
        'Rate constant k = 0 s⁻¹ represents a non-reacting system: CA = CA0, conversion X = 0%, and any target conversion > 0% cannot be achieved.',
    });
  }

  if (Xpct === 100) {
    issues.push({
      severity: 'warning',
      field: 'targetConversion_pct',
      message:
        'Exact 100% conversion is an unattainable asymptotic limit for irreversible first-order kinetics (−rA = k·CA), requiring unbounded reaction time (t → ∞) or reactor volume (V → ∞).',
    });
  }

  if (reactorType === 'batch' && t === 0) {
    issues.push({
      severity: 'warning',
      field: 'batchTime_s',
      message:
        'Batch reaction time t = 0 s evaluates the initial charge state (CA = CA0, X = 0%). Reported batch times exclude filling, emptying, and turnaround.',
    });
  }

  if (reactorType !== 'batch' && V === 0) {
    issues.push({
      severity: 'warning',
      field: 'reactorVolume_m3',
      message:
        'Zero reactor volume (V = 0 m³) gives zero residence time (τ = 0 s) and 0% conversion.',
    });
  }

  const activeDa =
    reactorType === 'batch' ? k * t : q > 0 ? k * (V / q) : 0;
  if (activeDa > 20 && k > 0) {
    issues.push({
      severity: 'warning',
      field: 'general',
      message:
        `High Damköhler number (Da = ${activeDa.toFixed(1)}): ideal model predicts near-complete conversion (> 99.9999%). Real reactors at extreme conversion become constrained by mixing, equilibrium, or mass transfer.`,
    });
  }

  return issues;
}

export function calculateReactionEngineering(
  inputs: ReactionEngineeringInputs
): ReactionEngineeringResults {
  const validationIssues = validateReactionEngineeringInputs(inputs);
  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');

  const CA0 = inputs.initialConcentration_mol_m3;
  const k = inputs.rateConstant_per_s;
  const V = inputs.reactorVolume_m3;
  const q = inputs.volumetricFlowRate_m3_s;
  const t = inputs.batchTime_s;
  const XtargetPct = inputs.targetConversion_pct;

  if (hasErrors) {
    const emptySnapshot: ReactorSnapshotMetrics = {
      reactorType: inputs.reactorType,
      label:
        inputs.reactorType === 'batch'
          ? 'Batch Reactor'
          : inputs.reactorType === 'cstr'
          ? 'Ideal CSTR'
          : 'Ideal PFR',
      characteristicTime_s: 0,
      timeSymbol: inputs.reactorType === 'batch' ? 't' : 'τ',
      damkohlerNumber: 0,
      outletConcentration_mol_m3: 0,
      conversion: 0,
      conversion_pct: 0,
      reactionRate_mol_m3_s: 0,
      molarFlowConverted_mol_s: null,
      molesConverted_mol: null,
    };
    return {
      isValid: false,
      validationIssues,
      activeReactor: emptySnapshot,
      batchAtReactionTime: emptySnapshot,
      continuousComparisonAvailable: false,
      cstrAtCurrentVolume: null,
      pfrAtCurrentVolume: null,
      equivalentCharacteristicTime_s: 0,
      cstrAtBatchTime: emptySnapshot,
      pfrAtBatchTime: emptySnapshot,
      batchAtResidenceTime: null,
      residenceTime_s: null,
      targetDesign: {
        targetConversion: 0,
        targetConversion_pct: XtargetPct,
        isTargetAchievable: false,
        unachievableReason: 'Resolve input validation errors first.',
        requiredBatchTime_s: null,
        requiredVolumePFR_m3: null,
        requiredVolumeCSTR_m3: null,
        cstrToPfrVolumeRatio: null,
      },
    };
  }

  const continuousComparisonAvailable = q > 0;
  const residenceTime_s = continuousComparisonAvailable ? V / q : null;

  const batchAtReactionTime = evaluateBatch(CA0, k, V, t);
  const cstrAtCurrentVolume = continuousComparisonAvailable
    ? evaluateCstr(CA0, k, V, q)
    : null;
  const pfrAtCurrentVolume = continuousComparisonAvailable
    ? evaluatePfr(CA0, k, V, q)
    : null;

  const activeReactor =
    inputs.reactorType === 'batch'
      ? batchAtReactionTime
      : inputs.reactorType === 'cstr'
      ? (cstrAtCurrentVolume as ReactorSnapshotMetrics)
      : (pfrAtCurrentVolume as ReactorSnapshotMetrics);

  const equivalentCharacteristicTime_s = activeReactor.characteristicTime_s;
  const refFlow = continuousComparisonAvailable ? q : 0.02;

  const cstrAtBatchTime = evaluateCstr(
    CA0,
    k,
    V,
    refFlow,
    equivalentCharacteristicTime_s
  );
  const pfrAtBatchTime = evaluatePfr(
    CA0,
    k,
    V,
    refFlow,
    equivalentCharacteristicTime_s
  );
  const batchAtResidenceTime =
    residenceTime_s !== null
      ? evaluateBatch(CA0, k, V, residenceTime_s)
      : null;

  // Target conversion sizing
  const Xt = XtargetPct / 100;
  let targetDesign: TargetDesignMetrics;

  if (Xt === 0) {
    targetDesign = {
      targetConversion: 0,
      targetConversion_pct: 0,
      isTargetAchievable: true,
      unachievableReason: null,
      requiredBatchTime_s: 0,
      requiredVolumePFR_m3: 0,
      requiredVolumeCSTR_m3: 0,
      cstrToPfrVolumeRatio: 1,
    };
  } else if (Xt >= 1) {
    targetDesign = {
      targetConversion: Xt,
      targetConversion_pct: XtargetPct,
      isTargetAchievable: false,
      unachievableReason:
        'Exact 100% conversion requires infinite reaction time (t → ∞) or infinite reactor volume (V → ∞) for first-order irreversible kinetics.',
      requiredBatchTime_s: null,
      requiredVolumePFR_m3: null,
      requiredVolumeCSTR_m3: null,
      cstrToPfrVolumeRatio: null,
    };
  } else if (k === 0) {
    targetDesign = {
      targetConversion: Xt,
      targetConversion_pct: XtargetPct,
      isTargetAchievable: false,
      unachievableReason:
        'Rate constant k = 0 s⁻¹ gives zero reaction rate; positive target conversion cannot be achieved.',
      requiredBatchTime_s: null,
      requiredVolumePFR_m3: null,
      requiredVolumeCSTR_m3: null,
      cstrToPfrVolumeRatio: null,
    };
  } else {
    const tReq = -Math.log1p(-Xt) / k;
    const vReqPfr = continuousComparisonAvailable ? q * tReq : null;
    const vReqCstr = continuousComparisonAvailable ? (q * Xt) / (k * (1 - Xt)) : null;
    const ratio =
      vReqCstr !== null && vReqPfr !== null && vReqPfr > 0
        ? vReqCstr / vReqPfr
        : Xt / ((1 - Xt) * -Math.log1p(-Xt));

    targetDesign = {
      targetConversion: Xt,
      targetConversion_pct: XtargetPct,
      isTargetAchievable: true,
      unachievableReason: null,
      requiredBatchTime_s: tReq,
      requiredVolumePFR_m3: vReqPfr,
      requiredVolumeCSTR_m3: vReqCstr,
      cstrToPfrVolumeRatio: ratio,
    };
  }

  return {
    isValid: true,
    validationIssues,
    activeReactor,
    batchAtReactionTime,
    continuousComparisonAvailable,
    cstrAtCurrentVolume,
    pfrAtCurrentVolume,
    equivalentCharacteristicTime_s,
    cstrAtBatchTime,
    pfrAtBatchTime,
    batchAtResidenceTime,
    residenceTime_s,
    targetDesign,
  };
}

/**
 * Generates Batch Reactor CA(t) and X(t) curves from t = 0 up to max(1.5 * t, 4 / k, 60).
 */
export function generateBatchTimeSeries(
  inputs: ReactionEngineeringInputs,
  numPoints = 41
): BatchTimeSeriesPoint[] {
  const issues = validateReactionEngineeringInputs(inputs);
  if (issues.some((i) => i.severity === 'error')) return [];

  const k = inputs.rateConstant_per_s;
  const CA0 = inputs.initialConcentration_mol_m3;
  const kineticHorizon = k > 0 ? 4 / k : 120;
  const maxTime = Math.max(inputs.batchTime_s * 1.4, Math.min(kineticHorizon, 600), 30);

  const count = Math.max(2, numPoints);
  const points: BatchTimeSeriesPoint[] = [];

  for (let i = 0; i < count; i++) {
    const t = (maxTime * i) / (count - 1);
    const da = k * t;
    const CA = CA0 * safeNegExp(da);
    const X = safeFirstOrderConversion(da);
    points.push({
      time_s: Number(t.toFixed(3)),
      concentration_mol_m3: Number(CA.toFixed(4)),
      conversion_pct: Number((X * 100).toFixed(4)),
      reactionRate_mol_m3_s: Number((k * CA).toFixed(5)),
    });
  }

  return points;
}

/**
 * Generates Conversion X vs. Residence Time tau comparing Ideal CSTR and Ideal PFR.
 */
export function generateResidenceTimeComparisonSeries(
  inputs: ReactionEngineeringInputs,
  numPoints = 41
): ResidenceTimeSeriesPoint[] {
  const issues = validateReactionEngineeringInputs(inputs);
  if (issues.some((i) => i.severity === 'error')) return [];

  const k = inputs.rateConstant_per_s;
  const CA0 = inputs.initialConcentration_mol_m3;
  const activeTau =
    inputs.reactorType === 'batch'
      ? inputs.batchTime_s
      : inputs.volumetricFlowRate_m3_s > 0
      ? inputs.reactorVolume_m3 / inputs.volumetricFlowRate_m3_s
      : inputs.batchTime_s;

  const kineticHorizon = k > 0 ? 5 / k : 150;
  const maxTau = Math.max(activeTau * 1.5, Math.min(kineticHorizon, 600), 30);

  const count = Math.max(2, numPoints);
  const points: ResidenceTimeSeriesPoint[] = [];

  for (let i = 0; i < count; i++) {
    const tau = (maxTau * i) / (count - 1);
    const da = k * tau;
    const xCstr = safeCstrConversion(da);
    const xPfr = safeFirstOrderConversion(da);
    points.push({
      tau_s: Number(tau.toFixed(3)),
      cstrConversion_pct: Number((xCstr * 100).toFixed(4)),
      pfrConversion_pct: Number((xPfr * 100).toFixed(4)),
      batchEquivalentConversion_pct: Number((xPfr * 100).toFixed(4)),
      cstrConcentration_mol_m3: Number((CA0 / (1 + da)).toFixed(4)),
      pfrConcentration_mol_m3: Number((CA0 * safeNegExp(da)).toFixed(4)),
    });
  }

  return points;
}

/**
 * Generates spatial concentration CA(V) and conversion X(V) along an Ideal PFR
 * from V = 0 to V_total. Not applicable to ideal CSTR (uniform interior).
 */
export function generatePfrVolumeSeries(
  inputs: ReactionEngineeringInputs,
  numPoints = 41
): PfrVolumeSeriesPoint[] {
  const issues = validateReactionEngineeringInputs(inputs);
  if (issues.some((i) => i.severity === 'error')) return [];
  if (inputs.volumetricFlowRate_m3_s <= 0) return [];

  const k = inputs.rateConstant_per_s;
  const CA0 = inputs.initialConcentration_mol_m3;
  const q = inputs.volumetricFlowRate_m3_s;
  const totalV = Math.max(inputs.reactorVolume_m3, 0);

  if (totalV === 0) {
    return [
      {
        volume_m3: 0,
        concentration_mol_m3: CA0,
        conversion_pct: 0,
        reactionRate_mol_m3_s: k * CA0,
      },
    ];
  }

  const count = Math.max(2, numPoints);
  const points: PfrVolumeSeriesPoint[] = [];

  for (let i = 0; i < count; i++) {
    const vPos = (totalV * i) / (count - 1);
    const da = k * (vPos / q);
    const CA = CA0 * safeNegExp(da);
    const X = safeFirstOrderConversion(da);
    points.push({
      volume_m3: Number(vPos.toFixed(4)),
      concentration_mol_m3: Number(CA.toFixed(4)),
      conversion_pct: Number((X * 100).toFixed(4)),
      reactionRate_mol_m3_s: Number((k * CA).toFixed(5)),
    });
  }

  return points;
}

/**
 * Generates Required Reactor Volume V_req (CSTR vs PFR) and Batch t_req across
 * target conversions X_target in [5%, 96%] (stopping short of asymptotic 100%).
 */
export function generateTargetConversionSizingSeries(
  inputs: ReactionEngineeringInputs
): TargetConversionSizingPoint[] {
  const issues = validateReactionEngineeringInputs(inputs);
  if (issues.some((i) => i.severity === 'error')) return [];

  const k = inputs.rateConstant_per_s;
  const q = inputs.volumetricFlowRate_m3_s;
  if (k <= 0 || q <= 0) return [];

  const percentages = [
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 92, 95,
  ];

  return percentages.map((pct) => {
    const X = pct / 100;
    const tReq = -Math.log1p(-X) / k;
    const vPfr = q * tReq;
    const vCstr = (q * X) / (k * (1 - X));
    return {
      targetConversion_pct: pct,
      cstrRequiredVolume_m3: Number(vCstr.toFixed(4)),
      pfrRequiredVolume_m3: Number(vPfr.toFixed(4)),
      batchRequiredTime_s: Number(tReq.toFixed(3)),
      cstrToPfrRatio: Number((vCstr / vPfr).toFixed(3)),
    };
  });
}
