/**
 * ChemEng Studio — Ideal Countercurrent Heat Exchanger Scientific Calculation Module
 *
 * Implements the Effectiveness–NTU (ε–NTU) method for a steady-state, ideal
 * countercurrent, single-phase heat exchanger using consistent SI units internally.
 *
 * Model Assumptions & Idealizations:
 * 1. Steady-state operation (∂T/∂t = 0, constant mass flow rates).
 * 2. Ideal 1D countercurrent flow (no shell-side cross-flow, baffle leakage, or multi-pass LMTD correction F_T).
 * 3. Single-phase fluids throughout the exchanger.
 * 4. Constant isobaric specific heat capacities (Cp,h and Cp,c independent of temperature).
 * 5. Constant overall heat transfer coefficient (U uniform over area A).
 * 6. No heat losses to the surroundings (adiabatic outer boundary).
 * 7. Negligible axial heat conduction in fluid streams and exchanger wall.
 * 8. No pressure-drop modeling.
 * 9. No phase-change calculations (sensible heat transfer only).
 *
 * Internal SI Units:
 * - Temperatures (Th_in, Tc_in, Th_out, Tc_out): °C (temperature differences ΔT in K are numerically identical to °C)
 * - Mass flow rates (mh, mc): kg/s
 * - Specific heat capacities (Cph, Cpc): converted from kJ/(kg·K) to J/(kg·K) internally
 * - Overall heat transfer coefficient (U): W/(m²·K)
 * - Heat transfer surface area (A): m²
 * - Heat capacity rates (Ch, Cc, Cmin, Cmax): W/K (and kW/K for display)
 * - Heat transfer rate (Q, Qmax): W (and kW for display)
 */

export interface HeatExchangerInputs {
  /** Hot fluid inlet temperature (°C) */
  Th_in: number;
  /** Cold fluid inlet temperature (°C) */
  Tc_in: number;
  /** Hot stream mass flow rate (kg/s) */
  mh: number;
  /** Cold stream mass flow rate (kg/s) */
  mc: number;
  /** Hot stream specific heat capacity (kJ/(kg·K)) */
  Cph_kJ: number;
  /** Cold stream specific heat capacity (kJ/(kg·K)) */
  Cpc_kJ: number;
  /** Overall heat transfer coefficient U (W/(m²·K)) */
  U: number;
  /** Heat transfer surface area A (m²) */
  A: number;
}

export interface ValidationIssue {
  field: keyof HeatExchangerInputs | 'general';
  message: string;
  severity: 'error' | 'warning';
}

export interface AxialTemperaturePoint {
  /** Normalized dimensionless position x/L from 0 (Hot Inlet / Cold Outlet) to 1 (Hot Outlet / Cold Inlet) */
  normalizedPosition: number;
  /** Cumulative area position (m²) */
  areaPosition: number;
  /** Hot fluid temperature at position x (°C) */
  Th: number;
  /** Cold fluid temperature at position x (°C) */
  Tc: number;
  /** Local temperature driving force Th(x) - Tc(x) (°C or K) */
  deltaT: number;
}

export interface SensitivityPoint {
  parameterValue: number;
  Q_kW: number;
  effectiveness_pct: number;
  Th_out: number;
  Tc_out: number;
  NTU: number;
}

export interface HeatExchangerResults {
  /** Whether the inputs are valid for physical calculation */
  isValid: boolean;
  /** Validation errors or physical advisories */
  validationIssues: ValidationIssue[];
  /** Hot stream heat capacity rate Ch = mh * Cph (W/K) */
  Ch_W_K: number;
  /** Cold stream heat capacity rate Cc = mc * Cpc (W/K) */
  Cc_W_K: number;
  /** Hot stream heat capacity rate (kW/K) */
  Ch_kW_K: number;
  /** Cold stream heat capacity rate (kW/K) */
  Cc_kW_K: number;
  /** Minimum heat capacity rate Cmin (W/K) */
  Cmin_W_K: number;
  /** Maximum heat capacity rate Cmax (W/K) */
  Cmax_W_K: number;
  /** Minimum heat capacity rate (kW/K) */
  Cmin_kW_K: number;
  /** Maximum heat capacity rate (kW/K) */
  Cmax_kW_K: number;
  /** Which stream has Cmin */
  limitingStream: 'Hot Stream' | 'Cold Stream' | 'Balanced (Ch = Cc)';
  /** Heat capacity ratio Cr = Cmin / Cmax (dimensionless, 0 <= Cr <= 1) */
  Cr: number;
  /** Overall conductance UA (W/K) */
  UA_W_K: number;
  /** Number of Transfer Units NTU = UA / Cmin (dimensionless) */
  NTU: number;
  /** Heat exchanger thermal effectiveness ε (0 to 1) */
  effectiveness: number;
  /** Heat exchanger thermal effectiveness (%) */
  effectiveness_pct: number;
  /** Maximum thermodynamically possible heat transfer rate Qmax (W) */
  Qmax_W: number;
  /** Maximum thermodynamically possible heat transfer rate Qmax (kW) */
  Qmax_kW: number;
  /** Actual heat transfer rate Q (W) */
  Q_W: number;
  /** Actual heat transfer rate Q (kW) */
  Q_kW: number;
  /** Hot stream outlet temperature Th,out (°C) */
  Th_out: number;
  /** Cold stream outlet temperature Tc,out (°C) */
  Tc_out: number;
  /** Hot stream temperature drop Th,in - Th,out (°C or K) */
  deltaTh: number;
  /** Cold stream temperature rise Tc,out - Tc,in (°C or K) */
  deltaTc: number;
  /** Log-Mean Temperature Difference LMTD (°C or K) */
  LMTD: number;
  /** Hot-end approach temperature ΔT1 = Th,in - Tc,out (°C) */
  approachTempHotEnd: number;
  /** Cold-end approach temperature ΔT2 = Th,out - Tc,in (°C) */
  approachTempColdEnd: number;
  /** Energy balance residual |Q_hot - Q_cold| (W) to verify conservation of energy */
  energyBalanceResidual_W: number;
  /** Scientifically exact axial temperature profile along the exchanger length */
  axialProfile: AxialTemperaturePoint[];
}

export const DEFAULT_HEAT_EXCHANGER_INPUTS: HeatExchangerInputs = {
  Th_in: 120,     // °C (pressurized hot liquid water / aqueous process stream)
  Tc_in: 25,      // °C (utility cooling water inlet)
  mh: 2.0,        // kg/s
  mc: 1.5,        // kg/s
  Cph_kJ: 4.18,   // kJ/(kg·K)
  Cpc_kJ: 4.18,   // kJ/(kg·K)
  U: 850,         // W/(m²·K)
  A: 12.0,        // m²
};

export interface OperatingPreset {
  id: string;
  name: string;
  description: string;
  inputs: HeatExchangerInputs;
}

export const OPERATING_PRESETS: OperatingPreset[] = [
  {
    id: 'baseline-water',
    name: 'Pressurized Water-to-Water Cooler (Baseline)',
    description:
      'Pressurized hot water (120 °C, constant Cp = 4.18 kJ/(kg·K)) cooled by ambient utility water (25 °C).',
    inputs: { ...DEFAULT_HEAT_EXCHANGER_INPUTS },
  },
  {
    id: 'subboiling-water',
    name: 'Atmospheric Water-to-Water Cooler (≤ 90 °C)',
    description:
      'Atmospheric-pressure liquid water service (85 °C hot inlet) comfortably below the 100 °C normal boiling point.',
    inputs: {
      Th_in: 85,
      Tc_in: 20,
      mh: 2.2,
      mc: 1.8,
      Cph_kJ: 4.18,
      Cpc_kJ: 4.18,
      U: 800,
      A: 10.0,
    },
  },
  {
    id: 'balanced-regenerator',
    name: 'Balanced Capacity Regenerator (Cr = 1.0)',
    description:
      'Equal heat capacity rates (Ch = Cc), producing parallel linear axial temperature profiles with constant ΔT.',
    inputs: {
      Th_in: 140,
      Tc_in: 30,
      mh: 1.8,
      mc: 1.8,
      Cph_kJ: 4.18,
      Cpc_kJ: 4.18,
      U: 950,
      A: 15.0,
    },
  },
  {
    id: 'oil-cooler',
    name: 'Hydrocarbon Thermal Oil-to-Water Exchanger',
    description:
      'Hot thermal oil (Cp = 2.15 kJ/(kg·K)) cooled by high-capacity cooling water stream.',
    inputs: {
      Th_in: 165,
      Tc_in: 20,
      mh: 3.2,
      mc: 2.5,
      Cph_kJ: 2.15,
      Cpc_kJ: 4.18,
      U: 420,
      A: 18.0,
    },
  },
  {
    id: 'high-ntu-pinch',
    name: 'High-NTU Deep Heat Recovery (Temperature Cross)',
    description:
      'Pressurized aqueous streams with large conductance UA enabling Tc,out > Th,out in ideal countercurrent flow.',
    inputs: {
      Th_in: 130,
      Tc_in: 20,
      mh: 1.6,
      mc: 1.5,
      Cph_kJ: 4.18,
      Cpc_kJ: 4.18,
      U: 1200,
      A: 24.0,
    },
  },
];

/**
 * Checks whether a specific heat capacity value is consistent with liquid water (~4.18 kJ/(kg·K)).
 */
function isWaterLikeCp(cp_kJ: number): boolean {
  return cp_kJ >= 3.95 && cp_kJ <= 4.35;
}

/**
 * Validates heat exchanger inputs against physical and numerical bounds.
 */
export function validateHeatExchangerInputs(inputs: HeatExchangerInputs): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Number.isFinite(inputs.Th_in) || !Number.isFinite(inputs.Tc_in)) {
    issues.push({
      field: 'Th_in',
      message: 'Inlet temperatures must be finite numerical values.',
      severity: 'error',
    });
  } else if (inputs.Th_in <= inputs.Tc_in) {
    issues.push({
      field: 'Th_in',
      message:
        'Hot inlet temperature (Th,in) must be strictly greater than cold inlet temperature (Tc,in) for heat transfer from the hot stream to the cold stream.',
      severity: 'error',
    });
  }

  if (!Number.isFinite(inputs.mh) || inputs.mh <= 0) {
    issues.push({
      field: 'mh',
      message: 'Hot stream mass flow rate (mh) must be strictly positive (> 0 kg/s).',
      severity: 'error',
    });
  }

  if (!Number.isFinite(inputs.mc) || inputs.mc <= 0) {
    issues.push({
      field: 'mc',
      message: 'Cold stream mass flow rate (mc) must be strictly positive (> 0 kg/s).',
      severity: 'error',
    });
  }

  if (!Number.isFinite(inputs.Cph_kJ) || inputs.Cph_kJ <= 0) {
    issues.push({
      field: 'Cph_kJ',
      message: 'Hot stream specific heat capacity (Cp,h) must be strictly positive (> 0 kJ/(kg·K)).',
      severity: 'error',
    });
  }

  if (!Number.isFinite(inputs.Cpc_kJ) || inputs.Cpc_kJ <= 0) {
    issues.push({
      field: 'Cpc_kJ',
      message: 'Cold stream specific heat capacity (Cp,c) must be strictly positive (> 0 kJ/(kg·K)).',
      severity: 'error',
    });
  }

  if (!Number.isFinite(inputs.U) || inputs.U < 0) {
    issues.push({
      field: 'U',
      message: 'Overall heat transfer coefficient (U) cannot be negative.',
      severity: 'error',
    });
  }

  if (!Number.isFinite(inputs.A) || inputs.A < 0) {
    issues.push({
      field: 'A',
      message: 'Heat transfer surface area (A) cannot be negative.',
      severity: 'error',
    });
  }

  // Educational advisories for water-like streams outside 0–100 °C at atmospheric pressure
  const hotWaterLike = Number.isFinite(inputs.Cph_kJ) && isWaterLikeCp(inputs.Cph_kJ);
  const coldWaterLike = Number.isFinite(inputs.Cpc_kJ) && isWaterLikeCp(inputs.Cpc_kJ);

  if (hotWaterLike && Number.isFinite(inputs.Th_in) && inputs.Th_in > 100) {
    issues.push({
      field: 'Th_in',
      message:
        'High-Temperature Aqueous Advisory: Th,in exceeds 100 °C with Cp,h ≈ 4.18 kJ/(kg·K). Liquid water above 100 °C requires elevated system pressure (e.g., > 2 bar at 120 °C) to suppress boiling. This constant-property model does not evaluate pressure or vapor–liquid phase change.',
      severity: 'warning',
    });
  }

  if (coldWaterLike && Number.isFinite(inputs.Tc_in) && inputs.Tc_in > 100) {
    issues.push({
      field: 'Tc_in',
      message:
        'High-Temperature Aqueous Advisory: Tc,in exceeds 100 °C with Cp,c ≈ 4.18 kJ/(kg·K). Pressurized operation is required to keep aqueous streams single-phase liquid.',
      severity: 'warning',
    });
  }

  if (
    (hotWaterLike && Number.isFinite(inputs.Th_in) && inputs.Th_in <= 0) ||
    (coldWaterLike && Number.isFinite(inputs.Tc_in) && inputs.Tc_in <= 0)
  ) {
    issues.push({
      field: 'Tc_in',
      message:
        'Sub-Zero Aqueous Advisory: Temperature ≤ 0 °C with water-like Cp assumes an antifreeze/brine solution or suppressed freezing; pure water freezes at 0 °C (1 atm).',
      severity: 'warning',
    });
  }

  return issues;
}

/**
 * Computes the countercurrent effectiveness ε given NTU and capacity ratio Cr = Cmin/Cmax.
 *
 * Uses the exact algebraic form with expm1 to remain smooth and free of catastrophic cancellation
 * across all regimes: Cr -> 1, very small NTU, and very large NTU.
 *
 * Let δ = 1 - Cr ∈ [0, 1] and u = NTU * δ.
 *   ε = (1 - exp(-u)) / ((1 - exp(-u)) + δ * exp(-u))
 * Dividing numerator and denominator by δ when δ > 0 (and u is small) gives:
 *   (1 - exp(-u)) / δ = NTU * [(1 - exp(-u)) / u] = NTU * (-expm1(-u) / u)
 * which cleanly approaches NTU / (1 + NTU) as δ -> 0 for any finite NTU.
 */
export function computeCountercurrentEffectiveness(NTU: number, Cr: number): number {
  if (!Number.isFinite(NTU) || !Number.isFinite(Cr)) {
    throw new RangeError('NTU and Cr must be finite numbers.');
  }
  if (NTU <= 0) {
    return 0;
  }
  if (Cr < 0 || Cr > 1.000001) {
    throw new RangeError(`Capacity ratio Cr must be in [0, 1], received ${Cr}`);
  }

  const clampedCr = Math.min(1, Math.max(0, Cr));
  const delta = 1 - clampedCr;

  if (delta === 0) {
    return NTU / (1 + NTU);
  }

  const u = NTU * delta;

  // When u is very large (e.g. u > 700), exp(-u) underflows to 0 and ε -> 1
  if (u > 700) {
    return 1;
  }

  // Stable evaluation of (1 - exp(-u)) / u using -expm1(-u)/u or Taylor series for tiny u
  const phi =
    u < 1e-8
      ? 1 - u / 2 + (u * u) / 6 - (u * u * u) / 24
      : -Math.expm1(-u) / u;

  // Divide both numerator and denominator by δ:
  // numOverDelta = NTU * phi
  // denOverDelta = NTU * phi + exp(-u)
  const numOverDelta = NTU * phi;
  const expNegU = Math.exp(-u);
  const denOverDelta = numOverDelta + expNegU;

  if (denOverDelta === 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, numOverDelta / denOverDelta));
}

/**
 * Computes the exact analytical axial temperature distribution Th(x) and Tc(x)
 * for an ideal countercurrent heat exchanger from x/L = 0 (Hot Inlet / Cold Outlet)
 * to x/L = 1 (Hot Outlet / Cold Inlet).
 *
 * Differential equations along axial coordinate ξ = x/L ∈ [0, 1]:
 *   dTh / dξ = -(UA / Ch) * (Th(ξ) - Tc(ξ))
 *   dTc / dξ = -(UA / Cc) * (Th(ξ) - Tc(ξ))
 *
 * Numerically stabilized for all γ = UA * (1/Ch - 1/Cc) ∈ (-∞, +∞), including γ = 0 and |γ| >> 1.
 */
export function computeAxialTemperatureProfile(
  Th_in: number,
  Tc_in: number,
  Th_out: number,
  Tc_out: number,
  Ch_W_K: number,
  Cc_W_K: number,
  UA_W_K: number,
  totalArea: number,
  steps = 20
): AxialTemperaturePoint[] {
  const points: AxialTemperaturePoint[] = [];
  const gamma = UA_W_K * (1 / Ch_W_K - 1 / Cc_W_K);

  for (let i = 0; i <= steps; i++) {
    const xi = i / steps; // 0 to 1
    let Th_x: number;
    let Tc_x: number;

    if (UA_W_K <= 0 || Math.abs(Th_in - Tc_in) < 1e-12) {
      Th_x = Th_in;
      Tc_x = Tc_in;
    } else if (Math.abs(gamma) < 1e-6) {
      // Balanced capacity rates (Ch ≈ Cc): second-order accurate expansion around γ = 0
      const frac =
        xi *
        ((1 - (gamma * xi) / 2 + (gamma * gamma * xi * xi) / 6) /
          (1 - gamma / 2 + (gamma * gamma) / 6));
      Th_x = Th_in - (Th_in - Th_out) * frac;
      Tc_x = Tc_out - (Ch_W_K / Cc_W_K) * (Th_in - Th_x);
    } else if (gamma > 0) {
      // γ > 0 (Ch < Cc): all exponents are non-positive, zero overflow risk
      const denom = -Math.expm1(-gamma);
      const frac = denom === 0 ? xi : -Math.expm1(-gamma * xi) / denom;
      Th_x = Th_in - (Th_in - Th_out) * frac;
      Tc_x = Tc_out - (Ch_W_K / Cc_W_K) * (Th_in - Th_x);
    } else {
      // γ < 0 (Cc < Ch): rewrite (1 - e^{-γξ})/(1 - e^{-γ}) = (e^{γ(1-ξ)} - e^{γ}) / (1 - e^{γ})
      // so all exponents γ and γ(1-ξ) are strictly <= 0, preventing exp(+|γ|) overflow at large NTU
      const expGamma = Math.exp(gamma);
      const denom = 1 - expGamma;
      const num = Math.exp(gamma * (1 - xi)) - expGamma;
      const frac = denom === 0 ? xi : num / denom;
      Th_x = Th_in - (Th_in - Th_out) * frac;
      Tc_x = Tc_out - (Ch_W_K / Cc_W_K) * (Th_in - Th_x);
    }

    points.push({
      normalizedPosition: Number(xi.toFixed(4)),
      areaPosition: Number((xi * totalArea).toFixed(3)),
      Th: Number(Th_x.toFixed(4)),
      Tc: Number(Tc_x.toFixed(4)),
      deltaT: Number((Th_x - Tc_x).toFixed(4)),
    });
  }

  return points;
}

/**
 * Main calculation engine for the ideal countercurrent heat exchanger using the ε–NTU method.
 */
export function calculateHeatExchanger(inputs: HeatExchangerInputs): HeatExchangerResults {
  const validationIssues = validateHeatExchangerInputs(inputs);
  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');

  if (hasErrors) {
    return {
      isValid: false,
      validationIssues,
      Ch_W_K: 0,
      Cc_W_K: 0,
      Ch_kW_K: 0,
      Cc_kW_K: 0,
      Cmin_W_K: 0,
      Cmax_W_K: 0,
      Cmin_kW_K: 0,
      Cmax_kW_K: 0,
      limitingStream: 'Balanced (Ch = Cc)',
      Cr: 0,
      UA_W_K: 0,
      NTU: 0,
      effectiveness: 0,
      effectiveness_pct: 0,
      Qmax_W: 0,
      Qmax_kW: 0,
      Q_W: 0,
      Q_kW: 0,
      Th_out: Number.isFinite(inputs.Th_in) ? inputs.Th_in : 0,
      Tc_out: Number.isFinite(inputs.Tc_in) ? inputs.Tc_in : 0,
      deltaTh: 0,
      deltaTc: 0,
      LMTD: 0,
      approachTempHotEnd: 0,
      approachTempColdEnd: 0,
      energyBalanceResidual_W: 0,
      axialProfile: [],
    };
  }

  // Convert specific heats from kJ/(kg·K) to SI J/(kg·K)
  const Cph_J = inputs.Cph_kJ * 1000;
  const Cpc_J = inputs.Cpc_kJ * 1000;

  // Heat capacity rates in W/K
  const Ch_W_K = inputs.mh * Cph_J;
  const Cc_W_K = inputs.mc * Cpc_J;

  const Cmin_W_K = Math.min(Ch_W_K, Cc_W_K);
  const Cmax_W_K = Math.max(Ch_W_K, Cc_W_K);

  let limitingStream: 'Hot Stream' | 'Cold Stream' | 'Balanced (Ch = Cc)';
  if (Math.abs(Ch_W_K - Cc_W_K) / Cmax_W_K < 1e-6) {
    limitingStream = 'Balanced (Ch = Cc)';
  } else if (Ch_W_K < Cc_W_K) {
    limitingStream = 'Hot Stream';
  } else {
    limitingStream = 'Cold Stream';
  }

  const Cr = Cmin_W_K / Cmax_W_K;
  const UA_W_K = inputs.U * inputs.A;
  const NTU = UA_W_K / Cmin_W_K;

  const effectiveness = computeCountercurrentEffectiveness(NTU, Cr);
  const Qmax_W = Cmin_W_K * (inputs.Th_in - inputs.Tc_in);
  const Q_W = effectiveness * Qmax_W;

  const Th_out = inputs.Th_in - Q_W / Ch_W_K;
  const Tc_out = inputs.Tc_in + Q_W / Cc_W_K;

  const deltaTh = inputs.Th_in - Th_out;
  const deltaTc = Tc_out - inputs.Tc_in;

  // Verify conservation of energy: Q_hot = Ch * (Th,in - Th,out), Q_cold = Cc * (Tc,out - Tc,in)
  const Q_hot_W = Ch_W_K * deltaTh;
  const Q_cold_W = Cc_W_K * deltaTc;
  const energyBalanceResidual_W = Math.abs(Q_hot_W - Q_cold_W);

  // Hot-end approach ΔT1 = Th,in - Tc,out; Cold-end approach ΔT2 = Th,out - Tc,in
  const dT1 = inputs.Th_in - Tc_out;
  const dT2 = Th_out - inputs.Tc_in;

  let LMTD = 0;
  if (dT1 > 0 && dT2 > 0) {
    if (Math.abs(dT1 - dT2) / Math.max(dT1, dT2) < 1e-6) {
      LMTD = (dT1 + dT2) / 2;
    } else {
      LMTD = (dT1 - dT2) / Math.log(dT1 / dT2);
    }
  } else if (UA_W_K > 0 && Q_W > 0) {
    // At extreme NTU where one terminal ΔT rounds to 0 in IEEE-754 float64,
    // maintain consistency with Q = U * A * LMTD.
    LMTD = Q_W / UA_W_K;
  } else {
    LMTD = inputs.Th_in - inputs.Tc_in;
  }

  // Output-level aqueous advisory if cold outlet rises above 100 °C while hot inlet was <= 100 °C
  // (e.g., hot oil heating water above 100 °C)
  if (
    isWaterLikeCp(inputs.Cpc_kJ) &&
    Tc_out > 100 &&
    inputs.Tc_in <= 100 &&
    !(isWaterLikeCp(inputs.Cph_kJ) && inputs.Th_in > 100)
  ) {
    validationIssues.push({
      field: 'Tc_in',
      message: `High-Temperature Aqueous Advisory: Calculated cold outlet Tc,out = ${Tc_out.toFixed(
        1
      )} °C exceeds 100 °C with Cp,c ≈ 4.18 kJ/(kg·K). Pressurized operation is required to keep the cold aqueous stream single-phase liquid.`,
      severity: 'warning',
    });
  }

  const axialProfile = computeAxialTemperatureProfile(
    inputs.Th_in,
    inputs.Tc_in,
    Th_out,
    Tc_out,
    Ch_W_K,
    Cc_W_K,
    UA_W_K,
    inputs.A,
    20
  );

  return {
    isValid: true,
    validationIssues,
    Ch_W_K,
    Cc_W_K,
    Ch_kW_K: Ch_W_K / 1000,
    Cc_kW_K: Cc_W_K / 1000,
    Cmin_W_K,
    Cmax_W_K,
    Cmin_kW_K: Cmin_W_K / 1000,
    Cmax_kW_K: Cmax_W_K / 1000,
    limitingStream,
    Cr,
    UA_W_K,
    NTU,
    effectiveness,
    effectiveness_pct: effectiveness * 100,
    Qmax_W,
    Qmax_kW: Qmax_W / 1000,
    Q_W,
    Q_kW: Q_W / 1000,
    Th_out,
    Tc_out,
    deltaTh,
    deltaTc,
    LMTD,
    approachTempHotEnd: dT1,
    approachTempColdEnd: dT2,
    energyBalanceResidual_W,
    axialProfile,
  };
}

/**
 * Generates a parametric sensitivity curve showing how Heat Duty Q (kW) and Effectiveness (%)
 * respond as a chosen design/operating variable is varied across its engineering range.
 * Dynamically expands the upper sweep bound if the active input exceeds the nominal slider maximum.
 */
export function generateSensitivitySeries(
  baseInputs: HeatExchangerInputs,
  parameter: 'A' | 'mh' | 'mc' | 'U',
  steps = 25
): SensitivityPoint[] {
  const defaultRanges: Record<'A' | 'mh' | 'mc' | 'U', [number, number]> = {
    A: [0.5, 50],
    mh: [0.2, 8.0],
    mc: [0.2, 8.0],
    U: [50, 2500],
  };

  const [baseMin, baseMax] = defaultRanges[parameter];
  const currentVal = baseInputs[parameter];
  const minVal = currentVal > 0 && currentVal < baseMin ? currentVal : baseMin;
  const maxVal = currentVal > baseMax ? currentVal * 1.15 : baseMax;
  const series: SensitivityPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const val = minVal + ((maxVal - minVal) * i) / steps;
    const modified: HeatExchangerInputs = {
      ...baseInputs,
      [parameter]: val,
    };
    const res = calculateHeatExchanger(modified);
    if (res.isValid) {
      series.push({
        parameterValue: Number(val.toFixed(2)),
        Q_kW: Number(res.Q_kW.toFixed(2)),
        effectiveness_pct: Number(res.effectiveness_pct.toFixed(2)),
        Th_out: Number(res.Th_out.toFixed(2)),
        Tc_out: Number(res.Tc_out.toFixed(2)),
        NTU: Number(res.NTU.toFixed(3)),
      });
    }
  }

  return series;
}
