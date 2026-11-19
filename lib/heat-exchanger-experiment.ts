/**
 * Entrolume — Phase 2.6
 * Heat Exchanger Engineering Experiment & Target-Evaluation Module
 *
 * Pure, deterministic scientific utilities built directly on top of the
 * authoritative ε–NTU countercurrent solver in `lib/heat-exchanger.ts`.
 *
 * Model Assumptions & Scope (inherited from ideal 1D countercurrent solver):
 * 1. Steady-state, single-phase sensible heat exchange with constant Cp and uniform U.
 * 2. Ideal pure 1D countercurrent flow (no multi-pass shell-side F_T factor, pressure drop,
 *    fouling resistance, or boiling/condensation phase change).
 * 3. Parallel-flow benchmark metrics use the exact analytical ideal co-current ε–NTU relation
 *    for educational flow-arrangement comparison under identical UA, Ch, Cc, and inlets.
 */

import {
  HeatExchangerInputs,
  HeatExchangerResults,
  SensitivityPoint,
  calculateHeatExchanger,
  generateSensitivitySeries,
} from './heat-exchanger';

export type HeatExchangerTargetVariable = 'Tc_out' | 'Th_out';

export type TargetEvaluationStatus =
  | 'achieved'
  | 'not_achieved'
  | 'unreachable'
  | 'invalid_inputs';

export type UnreachableReason =
  | 'above_hot_inlet'
  | 'below_cold_inlet'
  | 'capacity_rate_ceiling'
  | 'infinite_area_asymptote'
  | 'zero_conductance'
  | null;

export interface HeatExchangerTargetSpec {
  variable: HeatExchangerTargetVariable;
  targetTemp_C: number;
  /** Engineering/numerical tolerance (°C) applied only to thermodynamically reachable targets */
  tolerance_C: number;
}

export interface ParallelFlowReference {
  effectiveness: number;
  effectiveness_pct: number;
  Q_kW: number;
  Th_out: number;
  Tc_out: number;
  /** Infinite-area asymptotic equilibrium temperature T_eq = (Ch*Th,in + Cc*Tc,in)/(Ch + Cc) (°C) */
  asymptoticEquilibriumTemp_C: number;
  /** Maximum parallel-flow effectiveness ε_max = 1 / (1 + Cr) */
  maxEffectiveness: number;
}

export interface HeatExchangerTargetEvaluation {
  status: TargetEvaluationStatus;
  statusLabel: string;
  variable: HeatExchangerTargetVariable;
  targetTemp_C: number;
  tolerance_C: number;
  calculatedTemp_C: number;
  /**
   * Signed thermal margin relative to target (°C):
   * - Positive (>= 0) means the target is met or exceeded in the desired direction.
   * - Negative (< 0) means the exchanger falls short of the target by |margin_C| °C.
   */
  margin_C: number;
  /** Signed difference (calculatedTemp_C - targetTemp_C) in °C */
  difference_C: number;
  /** Thermodynamic asymptotic ceiling (for Tc_out) or floor (for Th_out) at A -> ∞ (°C) */
  thermodynamicLimit_C: number;
  /** Whether the target is strictly achievable with finite positive area under current Ch, Cc, inlets */
  isThermodynamicallyReachable: boolean;
  unreachableReason: UnreachableReason;
  /** Required effectiveness ε_req in [0, 1) when reachable; null if unreachable */
  requiredEffectiveness: number | null;
  /** Required NTU_req when reachable; null if unreachable */
  requiredNTU: number | null;
  /** Required heat-transfer area A_req (m²) holding U, flows, and inlets constant; null if unreachable or U <= 0 */
  requiredArea_m2: number | null;
  /** Additional area needed (A_req - A_current) in m²; negative when current area exceeds requirement */
  areaDelta_m2: number | null;
  /** Whether A_req falls within the nominal slider maximum (50 m²) */
  isWithinNominalAreaRange: boolean;
  /** Local marginal sensitivity |dT_obj / dA| (°C / m²) at active area A */
  localAreaSensitivity_C_per_m2: number | null;
  /** Baseline marginal sensitivity |dT_obj / dA| (°C / m²) near A = 1 m² to quantify diminishing returns */
  initialAreaSensitivity_C_per_m2: number | null;
  /** Whether countercurrent temperature cross (Tc_out > Th_out) occurs at active operating point */
  isTemperatureCrossActive: boolean;
  /** Analytical ideal parallel-flow reference at identical UA, flows, and inlets */
  parallelReference: ParallelFlowReference | null;
  /** Concise, solver-derived physical interpretation bullets */
  interpretations: string[];
}

export interface HeatExchangerScenarioLike {
  id: string;
  label: string;
  inputs: HeatExchangerInputs;
  Q_kW: number;
  effectiveness_pct: number;
  NTU: number;
  Cr: number;
  Th_out: number;
  Tc_out: number;
}

export interface EvaluatedScenarioSummary {
  id: string;
  label: string;
  isLive: boolean;
  area_m2: number;
  Q_kW: number;
  effectiveness_pct: number;
  Th_out: number;
  Tc_out: number;
  status: TargetEvaluationStatus;
  statusShortLabel: 'Met' | 'Missed' | 'Unreachable' | 'Invalid';
  margin_C: number;
}

export interface ScenarioTradeoffComparison {
  entries: EvaluatedScenarioSummary[];
  meetingCount: number;
  smallestPassingRun: EvaluatedScenarioSummary | null;
  highestDutyRun: EvaluatedScenarioSummary | null;
  largestAreaRun: EvaluatedScenarioSummary | null;
  summaryText: string;
}

export const DEFAULT_TARGET_TOLERANCE_C = 0.5;
export const NOMINAL_MAX_AREA_M2 = 50.0;

/**
 * Default Lab 01 engineering experiment objective:
 * Heat the cold stream from 25 °C to at least 95.0 °C.
 * Baseline (A = 12.0 m²) reaches 88.41 °C (Not Achieved; requires A ≈ 15.66 m²).
 */
export const DEFAULT_HEAT_EXCHANGER_TARGET: HeatExchangerTargetSpec = {
  variable: 'Tc_out',
  targetTemp_C: 95.0,
  tolerance_C: DEFAULT_TARGET_TOLERANCE_C,
};

/**
 * Computes the exact inverse of the ideal countercurrent ε–NTU relation:
 * Given ε ∈ [0, 1) and Cr ∈ [0, 1], returns NTU >= 0 such that
 * computeCountercurrentEffectiveness(NTU, Cr) === ε.
 *
 * Uses log1p((δ * ε) / (1 - ε)) / δ with δ = 1 - Cr to avoid catastrophic cancellation
 * as Cr -> 1, smoothly converging to ε / (1 - ε) at Cr = 1.
 */
export function computeRequiredCountercurrentNTU(
  effectiveness: number,
  Cr: number
): number | null {
  if (!Number.isFinite(effectiveness) || !Number.isFinite(Cr)) {
    return null;
  }
  if (effectiveness <= 0) {
    return 0;
  }
  if (effectiveness >= 1) {
    return null;
  }

  const clampedCr = Math.min(1, Math.max(0, Cr));
  const delta = 1 - clampedCr;
  const oneMinusEps = 1 - effectiveness;

  if (oneMinusEps <= 1e-12) {
    return null;
  }

  if (delta < 1e-9) {
    return effectiveness / oneMinusEps;
  }

  const ratio = (delta * effectiveness) / oneMinusEps;
  const ntu = Math.log1p(ratio) / delta;
  return Number.isFinite(ntu) && ntu >= 0 ? ntu : null;
}

/**
 * Computes exact analytical performance for an ideal parallel-flow (co-current)
 * exchanger at the same UA, Ch, Cc, and inlet temperatures as the active countercurrent run.
 */
export function computeParallelFlowReference(
  inputs: HeatExchangerInputs,
  results: HeatExchangerResults
): ParallelFlowReference | null {
  if (!results.isValid || results.Ch_W_K <= 0 || results.Cc_W_K <= 0) {
    return null;
  }

  const Cr = results.Cr;
  const NTU = results.NTU;
  const maxEffectiveness = 1 / (1 + Cr);

  let effectiveness = 0;
  if (NTU > 0) {
    const exponent = NTU * (1 + Cr);
    effectiveness =
      exponent > 700 ? maxEffectiveness : -Math.expm1(-exponent) / (1 + Cr);
  }

  const Q_W = effectiveness * results.Qmax_W;
  const Th_out = inputs.Th_in - Q_W / results.Ch_W_K;
  const Tc_out = inputs.Tc_in + Q_W / results.Cc_W_K;
  const asymptoticEquilibriumTemp_C =
    (results.Ch_W_K * inputs.Th_in + results.Cc_W_K * inputs.Tc_in) /
    (results.Ch_W_K + results.Cc_W_K);

  return {
    effectiveness,
    effectiveness_pct: effectiveness * 100,
    Q_kW: Q_W / 1000,
    Th_out,
    Tc_out,
    asymptoticEquilibriumTemp_C,
    maxEffectiveness,
  };
}

/**
 * Computes local numerical sensitivity |dT_targetVar / dA| (°C / m²) around a given area
 * using the authoritative `calculateHeatExchanger` solver.
 */
function computeLocalAreaSensitivity(
  inputs: HeatExchangerInputs,
  variable: HeatExchangerTargetVariable,
  evalArea: number
): number | null {
  if (!Number.isFinite(evalArea) || evalArea < 0 || inputs.U <= 0) {
    return null;
  }

  const h = Math.max(0.1, Math.min(0.5, evalArea * 0.02 || 0.2));
  const aLow = Math.max(0, evalArea - h);
  const aHigh = evalArea + h;
  const span = aHigh - aLow;
  if (span <= 0) return null;

  const resLow = calculateHeatExchanger({ ...inputs, A: aLow });
  const resHigh = calculateHeatExchanger({ ...inputs, A: aHigh });
  if (!resLow.isValid || !resHigh.isValid) return null;

  const valLow = variable === 'Tc_out' ? resLow.Tc_out : resLow.Th_out;
  const valHigh = variable === 'Tc_out' ? resHigh.Tc_out : resHigh.Th_out;
  return Math.abs(valHigh - valLow) / span;
}

/**
 * Evaluates whether the active heat exchanger operating point satisfies an explicit
 * outlet-temperature target, checks thermodynamic reachability, computes exact required area,
 * and generates model-derived physical interpretations.
 */
export function evaluateHeatExchangerTarget(
  inputs: HeatExchangerInputs,
  results: HeatExchangerResults,
  spec: HeatExchangerTargetSpec
): HeatExchangerTargetEvaluation {
  const tolerance_C =
    Number.isFinite(spec.tolerance_C) && spec.tolerance_C >= 0
      ? spec.tolerance_C
      : DEFAULT_TARGET_TOLERANCE_C;

  if (!results.isValid || !Number.isFinite(spec.targetTemp_C)) {
    return {
      status: 'invalid_inputs',
      statusLabel: 'Invalid Operating Inputs',
      variable: spec.variable,
      targetTemp_C: Number.isFinite(spec.targetTemp_C) ? spec.targetTemp_C : 0,
      tolerance_C,
      calculatedTemp_C: 0,
      margin_C: 0,
      difference_C: 0,
      thermodynamicLimit_C: 0,
      isThermodynamicallyReachable: false,
      unreachableReason: null,
      requiredEffectiveness: null,
      requiredNTU: null,
      requiredArea_m2: null,
      areaDelta_m2: null,
      isWithinNominalAreaRange: false,
      localAreaSensitivity_C_per_m2: null,
      initialAreaSensitivity_C_per_m2: null,
      isTemperatureCrossActive: false,
      parallelReference: null,
      interpretations: [
        'Resolve the active input validation errors before evaluating target feasibility.',
      ],
    };
  }

  const isColdTarget = spec.variable === 'Tc_out';
  const calculatedTemp_C = isColdTarget ? results.Tc_out : results.Th_out;
  const targetTemp_C = spec.targetTemp_C;
  const difference_C = calculatedTemp_C - targetTemp_C;
  // Positive margin means target satisfied or exceeded in the desired direction
  const margin_C = isColdTarget
    ? results.Tc_out - targetTemp_C
    : targetTemp_C - results.Th_out;

  const thermodynamicLimit_C = isColdTarget
    ? inputs.Tc_in + results.Qmax_W / results.Cc_W_K
    : inputs.Th_in - results.Qmax_W / results.Ch_W_K;

  const parallelReference = computeParallelFlowReference(inputs, results);
  const isTemperatureCrossActive = results.Tc_out > results.Th_out;

  // Check thermodynamic reachability with finite exchanger area
  let isThermodynamicallyReachable = true;
  let unreachableReason: UnreachableReason = null;
  let requiredEffectiveness: number | null = null;
  let requiredNTU: number | null = null;
  let requiredArea_m2: number | null = null;

  const EPS_TEMP = 1e-6;

  if (isColdTarget) {
    if (targetTemp_C > inputs.Th_in + EPS_TEMP) {
      isThermodynamicallyReachable = false;
      unreachableReason = 'above_hot_inlet';
    } else if (targetTemp_C > thermodynamicLimit_C + EPS_TEMP) {
      isThermodynamicallyReachable = false;
      unreachableReason = 'capacity_rate_ceiling';
    } else if (Math.abs(targetTemp_C - thermodynamicLimit_C) <= EPS_TEMP) {
      isThermodynamicallyReachable = false;
      unreachableReason = 'infinite_area_asymptote';
    } else if (targetTemp_C <= inputs.Tc_in) {
      requiredEffectiveness = 0;
      requiredNTU = 0;
      requiredArea_m2 = 0;
    } else {
      const Q_req_W = results.Cc_W_K * (targetTemp_C - inputs.Tc_in);
      requiredEffectiveness = Q_req_W / results.Qmax_W;
      requiredNTU = computeRequiredCountercurrentNTU(requiredEffectiveness, results.Cr);
      if (requiredNTU === null) {
        isThermodynamicallyReachable = false;
        unreachableReason = 'infinite_area_asymptote';
      } else if (inputs.U <= 0) {
        isThermodynamicallyReachable = false;
        unreachableReason = 'zero_conductance';
      } else {
        requiredArea_m2 = (requiredNTU * results.Cmin_W_K) / inputs.U;
      }
    }
  } else {
    if (targetTemp_C < inputs.Tc_in - EPS_TEMP) {
      isThermodynamicallyReachable = false;
      unreachableReason = 'below_cold_inlet';
    } else if (targetTemp_C < thermodynamicLimit_C - EPS_TEMP) {
      isThermodynamicallyReachable = false;
      unreachableReason = 'capacity_rate_ceiling';
    } else if (Math.abs(targetTemp_C - thermodynamicLimit_C) <= EPS_TEMP) {
      isThermodynamicallyReachable = false;
      unreachableReason = 'infinite_area_asymptote';
    } else if (targetTemp_C >= inputs.Th_in) {
      requiredEffectiveness = 0;
      requiredNTU = 0;
      requiredArea_m2 = 0;
    } else {
      const Q_req_W = results.Ch_W_K * (inputs.Th_in - targetTemp_C);
      requiredEffectiveness = Q_req_W / results.Qmax_W;
      requiredNTU = computeRequiredCountercurrentNTU(requiredEffectiveness, results.Cr);
      if (requiredNTU === null) {
        isThermodynamicallyReachable = false;
        unreachableReason = 'infinite_area_asymptote';
      } else if (inputs.U <= 0) {
        isThermodynamicallyReachable = false;
        unreachableReason = 'zero_conductance';
      } else {
        requiredArea_m2 = (requiredNTU * results.Cmin_W_K) / inputs.U;
      }
    }
  }

  let status: TargetEvaluationStatus;
  let statusLabel: string;

  if (!isThermodynamicallyReachable) {
    status = 'unreachable';
    statusLabel =
      unreachableReason === 'zero_conductance'
        ? 'Unreachable (U = 0)'
        : 'Thermodynamically Unreachable';
  } else if (margin_C >= -tolerance_C) {
    status = 'achieved';
    statusLabel = 'Target Achieved';
  } else {
    status = 'not_achieved';
    statusLabel = 'Target Not Achieved';
  }

  const areaDelta_m2 =
    requiredArea_m2 !== null ? requiredArea_m2 - inputs.A : null;
  const isWithinNominalAreaRange =
    requiredArea_m2 !== null && requiredArea_m2 <= NOMINAL_MAX_AREA_M2;

  const localAreaSensitivity_C_per_m2 = computeLocalAreaSensitivity(
    inputs,
    spec.variable,
    inputs.A
  );
  const initialAreaSensitivity_C_per_m2 = computeLocalAreaSensitivity(
    inputs,
    spec.variable,
    1.0
  );

  // Build concise, strictly solver-derived engineering interpretations
  const interpretations: string[] = [];
  const varLabel = isColdTarget ? 'Tc,out' : 'Th,out';

  if (status === 'unreachable') {
    if (unreachableReason === 'above_hot_inlet') {
      interpretations.push(
        `Unreachable target: ${varLabel} cannot exceed the hot inlet temperature Th,in = ${inputs.Th_in.toFixed(1)} °C without violating the Second Law of Thermodynamics.`
      );
    } else if (unreachableReason === 'below_cold_inlet') {
      interpretations.push(
        `Unreachable target: ${varLabel} cannot drop below the cold inlet temperature Tc,in = ${inputs.Tc_in.toFixed(1)} °C without violating the Second Law of Thermodynamics.`
      );
    } else if (unreachableReason === 'capacity_rate_ceiling') {
      const limitingLabel =
        results.limitingStream === 'Hot Stream'
          ? `hot stream (Ch = ${results.Ch_kW_K.toFixed(2)} kW/K < Cc = ${results.Cc_kW_K.toFixed(2)} kW/K)`
          : `cold stream (Cc = ${results.Cc_kW_K.toFixed(2)} kW/K < Ch = ${results.Ch_kW_K.toFixed(2)} kW/K)`;
      const leverHint = isColdTarget
        ? 'increase mh, raise Th,in, or reduce mc'
        : 'increase mc, lower Tc,in, or reduce mh';
      interpretations.push(
        `Capacity-rate ceiling: even at infinite area (ε → 100%, Qmax = ${results.Qmax_kW.toFixed(1)} kW), the limiting ${limitingLabel} caps ${varLabel} at ${thermodynamicLimit_C.toFixed(2)} °C. To reach ${targetTemp_C.toFixed(1)} °C, ${leverHint}.`
      );
    } else if (unreachableReason === 'infinite_area_asymptote') {
      interpretations.push(
        `Asymptotic limit: ${targetTemp_C.toFixed(1)} °C equals the theoretical ε = 100% ceiling (${thermodynamicLimit_C.toFixed(2)} °C), which requires infinite surface area (A → ∞).`
      );
    } else if (unreachableReason === 'zero_conductance') {
      interpretations.push(
        `Zero conductance: with U = 0 W/(m²·K), no heat is transferred regardless of area A. Increase U above 0 to evaluate required sizing.`
      );
    }
  } else if (status === 'achieved') {
    const excessNote =
      areaDelta_m2 !== null && areaDelta_m2 < -0.25
        ? ` Current area (${inputs.A.toFixed(1)} m²) exceeds the exact minimum requirement (${requiredArea_m2!.toFixed(2)} m²) by ${Math.abs(areaDelta_m2).toFixed(2)} m².`
        : '';
    interpretations.push(
      `Objective met: ${varLabel} = ${calculatedTemp_C.toFixed(2)} °C satisfies the ${targetTemp_C.toFixed(1)} °C target (${margin_C >= 0 ? '+' : ''}${margin_C.toFixed(2)} °C vs. spec; ±${tolerance_C.toFixed(1)} °C tol.).${excessNote}`
    );
  } else {
    const areaNote =
      requiredArea_m2 !== null
        ? isWithinNominalAreaRange
          ? `Holding U and flows fixed requires A ≈ ${requiredArea_m2.toFixed(2)} m² (+${areaDelta_m2!.toFixed(2)} m², required ε = ${(requiredEffectiveness! * 100).toFixed(1)}%).`
          : `Holding U and flows fixed requires A ≈ ${requiredArea_m2.toFixed(1)} m² (above the 50 m² nominal range, required ε = ${(requiredEffectiveness! * 100).toFixed(1)}%) — consider also raising U or adjusting stream flows.`
        : '';
    interpretations.push(
      `Short of target by ${Math.abs(margin_C).toFixed(2)} °C (${varLabel} = ${calculatedTemp_C.toFixed(2)} °C vs. ${targetTemp_C.toFixed(1)} °C). ${areaNote}`
    );
  }

  // Diminishing-returns insight
  if (
    localAreaSensitivity_C_per_m2 !== null &&
    initialAreaSensitivity_C_per_m2 !== null &&
    initialAreaSensitivity_C_per_m2 > 1e-4 &&
    inputs.A > 1.5
  ) {
    const retainedPct = Math.min(
      100,
      (localAreaSensitivity_C_per_m2 / initialAreaSensitivity_C_per_m2) * 100
    );
    interpretations.push(
      `Diminishing area returns: at A = ${inputs.A.toFixed(1)} m², marginal gain is ${localAreaSensitivity_C_per_m2.toFixed(2)} °C/m² (${retainedPct.toFixed(0)}% of the initial ${initialAreaSensitivity_C_per_m2.toFixed(2)} °C/m² slope at 1 m²) because local ΔT shrinks as ε approaches 100%.`
    );
  }

  // Temperature cross & parallel-flow benchmark insight
  if (parallelReference !== null) {
    if (isTemperatureCrossActive) {
      interpretations.push(
        `Valid countercurrent temperature cross: Tc,out (${results.Tc_out.toFixed(1)} °C) > Th,out (${results.Th_out.toFixed(1)} °C) while Th(x) > Tc(x) everywhere along the exchanger. Ideal parallel flow at the same UA is thermodynamically capped below ${parallelReference.asymptoticEquilibriumTemp_C.toFixed(1)} °C and reaches only Tc,out = ${parallelReference.Tc_out.toFixed(1)} °C (Q = ${parallelReference.Q_kW.toFixed(1)} kW).`
      );
    } else if (results.NTU > 0.05) {
      const gain_kW = results.Q_kW - parallelReference.Q_kW;
      interpretations.push(
        `Flow arrangement advantage: countercurrent recovers ${results.Q_kW.toFixed(1)} kW vs. ${parallelReference.Q_kW.toFixed(1)} kW in ideal parallel flow (+${gain_kW.toFixed(1)} kW; parallel ceiling = ${parallelReference.asymptoticEquilibriumTemp_C.toFixed(1)} °C).`
      );
    }
  }

  return {
    status,
    statusLabel,
    variable: spec.variable,
    targetTemp_C,
    tolerance_C,
    calculatedTemp_C,
    margin_C,
    difference_C,
    thermodynamicLimit_C,
    isThermodynamicallyReachable,
    unreachableReason,
    requiredEffectiveness,
    requiredNTU,
    requiredArea_m2,
    areaDelta_m2,
    isWithinNominalAreaRange,
    localAreaSensitivity_C_per_m2,
    initialAreaSensitivity_C_per_m2,
    isTemperatureCrossActive,
    parallelReference,
    interpretations,
  };
}

/**
 * Generates target-aware parametric sensitivity data by delegating directly to the
 * authoritative `generateSensitivitySeries` engine function.
 */
export function generateTargetSensitivitySeries(
  baseInputs: HeatExchangerInputs,
  parameter: 'A' | 'mh' | 'mc' | 'U',
  steps = 28
): SensitivityPoint[] {
  return generateSensitivitySeries(baseInputs, parameter, steps);
}

/**
 * Evaluates all saved scenarios plus the active live run against the selected
 * engineering target and builds a concise trade-off comparison summary.
 */
export function evaluateScenarioComparisons(
  savedScenarios: HeatExchangerScenarioLike[],
  liveInputs: HeatExchangerInputs,
  liveResults: HeatExchangerResults,
  targetSpec: HeatExchangerTargetSpec
): ScenarioTradeoffComparison {
  const entries: EvaluatedScenarioSummary[] = savedScenarios.map((scenario) => {
    const res = calculateHeatExchanger(scenario.inputs);
    const evalRes = evaluateHeatExchangerTarget(scenario.inputs, res, targetSpec);
    const statusShortLabel: EvaluatedScenarioSummary['statusShortLabel'] =
      evalRes.status === 'achieved'
        ? 'Met'
        : evalRes.status === 'unreachable'
          ? 'Unreachable'
          : evalRes.status === 'invalid_inputs'
            ? 'Invalid'
            : 'Missed';
    return {
      id: scenario.id,
      label: scenario.label,
      isLive: false,
      area_m2: scenario.inputs.A,
      Q_kW: scenario.Q_kW,
      effectiveness_pct: scenario.effectiveness_pct,
      Th_out: scenario.Th_out,
      Tc_out: scenario.Tc_out,
      status: evalRes.status,
      statusShortLabel,
      margin_C: evalRes.margin_C,
    };
  });

  if (liveResults.isValid) {
    const liveEval = evaluateHeatExchangerTarget(liveInputs, liveResults, targetSpec);
    const liveShort: EvaluatedScenarioSummary['statusShortLabel'] =
      liveEval.status === 'achieved'
        ? 'Met'
        : liveEval.status === 'unreachable'
          ? 'Unreachable'
          : liveEval.status === 'invalid_inputs'
            ? 'Invalid'
            : 'Missed';
    entries.push({
      id: '__live__',
      label: 'Current Live Run',
      isLive: true,
      area_m2: liveInputs.A,
      Q_kW: liveResults.Q_kW,
      effectiveness_pct: liveResults.effectiveness_pct,
      Th_out: liveResults.Th_out,
      Tc_out: liveResults.Tc_out,
      status: liveEval.status,
      statusShortLabel: liveShort,
      margin_C: liveEval.margin_C,
    });
  }

  const passing = entries.filter((e) => e.status === 'achieved');
  const smallestPassingRun =
    passing.length > 0
      ? passing.reduce((best, curr) =>
          curr.area_m2 < best.area_m2 - 1e-6 ||
          (Math.abs(curr.area_m2 - best.area_m2) <= 1e-6 && curr.Q_kW > best.Q_kW)
            ? curr
            : best
        )
      : null;

  const highestDutyRun =
    entries.length > 0
      ? entries.reduce((best, curr) => (curr.Q_kW > best.Q_kW ? curr : best))
      : null;

  const largestAreaRun =
    entries.length > 0
      ? entries.reduce((best, curr) => (curr.area_m2 > best.area_m2 ? curr : best))
      : null;

  const varLabel = targetSpec.variable === 'Tc_out' ? 'Tc,out' : 'Th,out';
  const dirSymbol = targetSpec.variable === 'Tc_out' ? '≥' : '≤';

  let summaryText: string;
  if (entries.length === 0) {
    summaryText = 'Save operating runs to compare target attainment, area requirements, and heat duty.';
  } else if (passing.length === 0) {
    summaryText = `None of the ${entries.length} compared runs currently satisfy ${varLabel} ${dirSymbol} ${targetSpec.targetTemp_C.toFixed(1)} °C. Highest heat duty is ${highestDutyRun!.label} (${highestDutyRun!.Q_kW.toFixed(1)} kW at A = ${highestDutyRun!.area_m2.toFixed(1)} m²).`;
  } else {
    const dutyNote =
      highestDutyRun && highestDutyRun.id !== smallestPassingRun!.id
        ? ` Highest heat duty is ${highestDutyRun.label} (${highestDutyRun.Q_kW.toFixed(1)} kW at A = ${highestDutyRun.area_m2.toFixed(1)} m²).`
        : ` It also delivers the highest heat duty (${smallestPassingRun!.Q_kW.toFixed(1)} kW).`;
    summaryText = `${passing.length} of ${entries.length} compared runs meet ${varLabel} ${dirSymbol} ${targetSpec.targetTemp_C.toFixed(1)} °C. Smallest passing exchanger area: ${smallestPassingRun!.label} (A = ${smallestPassingRun!.area_m2.toFixed(1)} m², Q = ${smallestPassingRun!.Q_kW.toFixed(1)} kW).${dutyNote}`;
  }

  return {
    entries,
    meetingCount: passing.length,
    smallestPassingRun,
    highestDutyRun,
    largestAreaRun,
    summaryText,
  };
}
