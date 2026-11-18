/**
 * ChemEng Studio — Fluid Flow and Pipe Hydraulics Scientific Calculation Module
 *
 * Implements steady-state, incompressible, isothermal internal pipe flow hydraulics
 * using consistent SI units internally.
 *
 * Model Assumptions & Idealizations:
 * 1. Steady-state flow (∂/∂t = 0) of a single-phase, incompressible, Newtonian fluid.
 * 2. Constant fluid density (ρ) and dynamic viscosity (μ) along the pipe.
 * 3. Circular pipe of uniform internal diameter (D) and uniform equivalent roughness (ε).
 * 4. Fully developed flow along straight length L; entrance-region development effects
 *    and fitting interactions are lumped into the total minor-loss coefficient K.
 * 5. Equal inlet and outlet gauge pressures (P1 = P2) for the introductory pumping-head
 *    model, with nonnegative elevation rise (Δz = z2 - z1 >= 0).
 * 6. Transitional flow (2100 <= Re <= 4000) carries inherent physical uncertainty;
 *    Turbulent Colebrook–White is reported strictly as a conservative engineering reference,
 *    not an exact transitional law.
 * 7. Does not predict real centrifugal pump H–Q operating curves, system intersection points,
 *    or NPSH / cavitation margins.
 *
 * Internal SI Units:
 * - Volumetric flow rate Q: converted from L/s to m³/s (Q_m3_s = flowRate_L_s / 1000)
 * - Pipe internal diameter D: m
 * - Pipe length L: m
 * - Flow area A: m²
 * - Average velocity v: m/s
 * - Fluid density ρ: kg/m³
 * - Dynamic viscosity μ: Pa·s (= kg/(m·s))
 * - Absolute roughness ε: converted from mm to m (roughness_m = roughness_mm / 1000)
 * - Minor-loss coefficient K: dimensionless
 * - Elevation difference Δz: m
 * - Head losses (hf, hm, H): m
 * - Pressures (ΔP_friction, ΔP_elevation, ΔP_pump): Pa (and kPa for display)
 * - Powers (Ph, Ps): W (and kW for display)
 */

export const STANDARD_GRAVITY_M_S2 = 9.80665;
export const LAMINAR_RE_LIMIT = 2100;
export const TURBULENT_RE_THRESHOLD = 4000;

export type FlowRegime = 'Zero Flow' | 'Laminar' | 'Transitional' | 'Turbulent';

export interface FluidMechanicsInputs {
  /** Volumetric flow rate Q (L/s) */
  flowRate_L_s: number;
  /** Pipe internal diameter D (m) */
  diameter_m: number;
  /** Pipe length L (m) */
  length_m: number;
  /** Fluid density ρ (kg/m³) */
  density_kg_m3: number;
  /** Dynamic viscosity μ (Pa·s) */
  viscosity_Pa_s: number;
  /** Absolute pipe roughness ε (mm) */
  roughness_mm: number;
  /** Total minor-loss coefficient K = ΣKi (dimensionless) */
  minorLossK: number;
  /** Nonnegative elevation difference Δz = z2 - z1 (m) */
  elevationDiff_m: number;
  /** Pump efficiency η (%) */
  pumpEfficiency_pct: number;
}

export interface FluidValidationIssue {
  field: keyof FluidMechanicsInputs | 'general';
  message: string;
  severity: 'error' | 'warning';
}

export interface FluidSweepPoint {
  flowRate_L_s: number;
  velocity_m_s: number;
  reynoldsNumber: number;
  darcyFrictionFactor: number;
  majorHeadLoss_m: number;
  minorHeadLoss_m: number;
  frictionalPressureLoss_kPa: number;
  requiredPumpHead_m: number;
  shaftPower_kW: number;
  regime: FlowRegime;
}

export interface MoodyPoint {
  reynoldsNumber: number;
  laminarFriction: number | null;
  turbulentCurrentRoughness: number | null;
  turbulentSmoothPipe: number | null;
}

export interface FluidMechanicsResults {
  /** Whether the inputs are valid for physical calculation */
  isValid: boolean;
  /** Validation errors or educational advisories */
  validationIssues: FluidValidationIssue[];
  /** Volumetric flow rate in SI (m³/s) */
  flowRate_m3_s: number;
  /** Cross-sectional flow area A = π D² / 4 (m²) */
  area_m2: number;
  /** Average fluid velocity v = Q / A (m/s) */
  velocity_m_s: number;
  /** Velocity head v² / (2g) (m) */
  velocityHead_m: number;
  /** Reynolds number Re = ρ v D / μ (dimensionless) */
  reynoldsNumber: number;
  /** Flow regime classification */
  flowRegime: FlowRegime;
  /** Relative pipe roughness ε / D (dimensionless) */
  relativeRoughness: number;
  /** Darcy–Weisbach friction factor f_D (dimensionless; 0 at zero flow) */
  darcyFrictionFactor: number;
  /** Fanning friction factor f_F = f_D / 4 (dimensionless; 0 at zero flow) */
  fanningFrictionFactor: number;
  /** Friction factor formula/method note */
  frictionCorrelationUsed: string;
  /** Major (pipe) head loss hf = f_D (L/D) (v² / 2g) (m) */
  majorHeadLoss_m: number;
  /** Minor (fittings) head loss hm = K (v² / 2g) (m) */
  minorHeadLoss_m: number;
  /** Total friction head loss hf + hm (m) */
  totalFrictionHeadLoss_m: number;
  /** Total frictional pressure loss ΔP_friction = ρ g (hf + hm) (Pa) */
  frictionalPressureLoss_Pa: number;
  /** Total frictional pressure loss (kPa) */
  frictionalPressureLoss_kPa: number;
  /** Hydrostatic elevation pressure term ρ g Δz (kPa) */
  elevationPressure_kPa: number;
  /** Total required pump head H = Δz + hf + hm (m) */
  requiredPumpHead_m: number;
  /** Total pump pressure rise ρ g H (kPa) */
  totalPumpPressureRise_kPa: number;
  /** Hydraulic fluid power Ph = ρ g Q H (W) */
  hydraulicPower_W: number;
  /** Hydraulic fluid power (kW) */
  hydraulicPower_kW: number;
  /** Estimated pump shaft power Ps = Ph / η (W) */
  shaftPower_W: number;
  /** Estimated pump shaft power (kW) */
  shaftPower_kW: number;
}

export interface FluidMechanicsPreset {
  id: string;
  name: string;
  description: string;
  inputs: FluidMechanicsInputs;
}

/**
 * Water at approximately 20 °C flowing through a commercial steel pipe (D = 80 mm, L = 100 m).
 */
export const DEFAULT_FLUID_MECHANICS_INPUTS: FluidMechanicsInputs = {
  flowRate_L_s: 10.0,
  diameter_m: 0.08,
  length_m: 100,
  density_kg_m3: 998.2,
  viscosity_Pa_s: 0.001002,
  roughness_mm: 0.045,
  minorLossK: 4.5,
  elevationDiff_m: 0,
  pumpEfficiency_pct: 75,
};

export const FLUID_MECHANICS_PRESETS: FluidMechanicsPreset[] = [
  {
    id: 'water-baseline',
    name: '20 °C Water in Commercial Steel Pipe (Baseline)',
    description:
      'Water at 20 °C (ρ = 998.2 kg/m³, μ = 1.002 mPa·s) flowing at 10 L/s through an 80 mm steel line with standard fittings.',
    inputs: { ...DEFAULT_FLUID_MECHANICS_INPUTS },
  },
  {
    id: 'laminar-viscous',
    name: 'Low-Reynolds Laminar Flow (Viscous Glycerin Solution)',
    description:
      'Viscous solution (μ = 0.050 Pa·s) at low flow rate producing Re ≈ 469. Friction follows exact f = 64/Re independent of pipe roughness.',
    inputs: {
      flowRate_L_s: 0.8,
      diameter_m: 0.05,
      length_m: 40,
      density_kg_m3: 1150,
      viscosity_Pa_s: 0.05,
      roughness_mm: 0.045,
      minorLossK: 2.0,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 70,
    },
  },
  {
    id: 'turbulent-smooth',
    name: 'Turbulent Flow in Smooth Drawn Tubing / PVC',
    description:
      'High-Reynolds water flow (12 L/s) in hydraulically smooth tubing (ε = 0.0015 mm), minimizing wall roughness losses.',
    inputs: {
      flowRate_L_s: 12.0,
      diameter_m: 0.08,
      length_m: 100,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.0015,
      minorLossK: 3.0,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 75,
    },
  },
  {
    id: 'turbulent-rough',
    name: 'Turbulent Flow in Aged / Rough Cast-Iron Pipe',
    description:
      'Identical flow and diameter to the smooth-pipe case, but with heavy wall roughness (ε = 0.80 mm), doubling friction factor and pressure drop.',
    inputs: {
      flowRate_L_s: 12.0,
      diameter_m: 0.08,
      length_m: 100,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.8,
      minorLossK: 3.0,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 75,
    },
  },
  {
    id: 'high-pressure-loss',
    name: 'High-Pressure-Loss Small-Bore Piping System',
    description:
      '15 L/s forced through a narrow 50 mm, 200 m header with K = 12 fittings—demonstrating strong D⁻⁵ velocity-squared head loss scaling.',
    inputs: {
      flowRate_L_s: 15.0,
      diameter_m: 0.05,
      length_m: 200,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.045,
      minorLossK: 12.0,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 72,
    },
  },
  {
    id: 'elevated-piping',
    name: 'Elevated Process Transfer Line (Δz = 18 m)',
    description:
      'Pumping 20 °C water up an 18 m column elevation rise, separating static elevation head (Δz) from frictional pressure drop (hf + hm).',
    inputs: {
      flowRate_L_s: 10.0,
      diameter_m: 0.08,
      length_m: 120,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.045,
      minorLossK: 6.0,
      elevationDiff_m: 18.0,
      pumpEfficiency_pct: 75,
    },
  },
];

/**
 * Validate physical and numerical bounds for all Fluid Mechanics inputs.
 */
export function validateFluidMechanicsInputs(
  inputs: FluidMechanicsInputs
): FluidValidationIssue[] {
  const issues: FluidValidationIssue[] = [];

  const fields: (keyof FluidMechanicsInputs)[] = [
    'flowRate_L_s',
    'diameter_m',
    'length_m',
    'density_kg_m3',
    'viscosity_Pa_s',
    'roughness_mm',
    'minorLossK',
    'elevationDiff_m',
    'pumpEfficiency_pct',
  ];

  for (const field of fields) {
    if (!Number.isFinite(inputs[field])) {
      issues.push({
        field,
        severity: 'error',
        message: `Parameter "${field}" must be a finite numeric value.`,
      });
    }
  }

  if (issues.length > 0) {
    return issues;
  }

  if (inputs.flowRate_L_s < 0) {
    issues.push({
      field: 'flowRate_L_s',
      severity: 'error',
      message: 'Volumetric flow rate (Q) cannot be negative.',
    });
  }
  if (inputs.diameter_m <= 0) {
    issues.push({
      field: 'diameter_m',
      severity: 'error',
      message: 'Pipe internal diameter (D) must be greater than 0 m.',
    });
  }
  if (inputs.length_m < 0) {
    issues.push({
      field: 'length_m',
      severity: 'error',
      message: 'Pipe length (L) cannot be negative.',
    });
  }
  if (inputs.density_kg_m3 <= 0) {
    issues.push({
      field: 'density_kg_m3',
      severity: 'error',
      message: 'Fluid density (ρ) must be greater than 0 kg/m³.',
    });
  }
  if (inputs.viscosity_Pa_s <= 0) {
    issues.push({
      field: 'viscosity_Pa_s',
      severity: 'error',
      message: 'Dynamic viscosity (μ) must be greater than 0 Pa·s.',
    });
  }
  if (inputs.roughness_mm < 0) {
    issues.push({
      field: 'roughness_mm',
      severity: 'error',
      message: 'Absolute pipe roughness (ε) cannot be negative.',
    });
  }
  if (inputs.minorLossK < 0) {
    issues.push({
      field: 'minorLossK',
      severity: 'error',
      message: 'Total minor-loss coefficient (K) cannot be negative.',
    });
  }
  if (inputs.elevationDiff_m < 0) {
    issues.push({
      field: 'elevationDiff_m',
      severity: 'error',
      message:
        'Elevation difference (Δz) must be nonnegative (≥ 0 m) for this introductory pumping-head model.',
    });
  }
  if (inputs.pumpEfficiency_pct <= 0 || inputs.pumpEfficiency_pct > 100) {
    issues.push({
      field: 'pumpEfficiency_pct',
      severity: 'error',
      message: 'Pump efficiency (η) must be strictly between 0% and 100%.',
    });
  }

  if (inputs.diameter_m > 0 && inputs.roughness_mm / 1000 >= inputs.diameter_m * 0.5) {
    issues.push({
      field: 'roughness_mm',
      severity: 'error',
      message:
        'Absolute roughness (ε) exceeds half the pipe diameter (ε/D ≥ 0.5), outside valid Moody/Colebrook–White pipe hydraulics.',
    });
  }

  return issues;
}

/**
 * Solve the implicit Colebrook–White equation for turbulent Darcy friction factor f_D:
 *   1 / sqrt(f_D) = -2.0 * log10( (ε/D) / 3.7 + 2.51 / (Re * sqrt(f_D)) )
 *
 * Uses Haaland's explicit correlation as initial guess, followed by Newton–Raphson
 * on x = 1 / sqrt(f_D), whose derivative is strictly > 1 everywhere.
 */
export function solveColebrookWhite(
  reynoldsNumber: number,
  relativeRoughness: number
): number {
  if (reynoldsNumber <= 0) return 0;
  const relRough = Math.max(0, relativeRoughness);

  // Haaland explicit starting estimate
  const haalandTerm =
    Math.pow(relRough / 3.7, 1.11) + 6.9 / reynoldsNumber;
  let x = -1.8 * Math.log10(Math.max(1e-18, haalandTerm));
  if (!Number.isFinite(x) || x <= 0) {
    x = 5.0;
  }

  const ln10 = Math.LN10;
  const c1 = relRough / 3.7;
  const c2 = 2.51 / reynoldsNumber;

  for (let i = 0; i < 25; i++) {
    const arg = c1 + c2 * x;
    if (arg <= 0) break;
    const fx = x + 2.0 * Math.log10(arg);
    const dfx = 1.0 + (2.0 / ln10) * (c2 / arg);
    const step = fx / dfx;
    x -= step;
    if (Math.abs(step) < 1e-13) {
      break;
    }
  }

  return 1 / (x * x);
}

/**
 * Determine flow regime from Reynolds number.
 */
export function classifyFlowRegime(reynoldsNumber: number): FlowRegime {
  if (reynoldsNumber <= 0) return 'Zero Flow';
  if (reynoldsNumber < LAMINAR_RE_LIMIT) return 'Laminar';
  if (reynoldsNumber <= TURBULENT_RE_THRESHOLD) return 'Transitional';
  return 'Turbulent';
}

/**
 * Main Fluid Mechanics solver in consistent SI units.
 */
export function calculateFluidMechanics(
  inputs: FluidMechanicsInputs
): FluidMechanicsResults {
  const validationIssues = validateFluidMechanicsInputs(inputs);
  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');

  if (hasErrors) {
    return {
      isValid: false,
      validationIssues,
      flowRate_m3_s: 0,
      area_m2: 0,
      velocity_m_s: 0,
      velocityHead_m: 0,
      reynoldsNumber: 0,
      flowRegime: 'Zero Flow',
      relativeRoughness: 0,
      darcyFrictionFactor: 0,
      fanningFrictionFactor: 0,
      frictionCorrelationUsed: 'Invalid inputs',
      majorHeadLoss_m: 0,
      minorHeadLoss_m: 0,
      totalFrictionHeadLoss_m: 0,
      frictionalPressureLoss_Pa: 0,
      frictionalPressureLoss_kPa: 0,
      elevationPressure_kPa: 0,
      requiredPumpHead_m: 0,
      totalPumpPressureRise_kPa: 0,
      hydraulicPower_W: 0,
      hydraulicPower_kW: 0,
      shaftPower_W: 0,
      shaftPower_kW: 0,
    };
  }

  const Q_m3_s = inputs.flowRate_L_s / 1000;
  const D = inputs.diameter_m;
  const L = inputs.length_m;
  const rho = inputs.density_kg_m3;
  const mu = inputs.viscosity_Pa_s;
  const roughness_m = inputs.roughness_mm / 1000;
  const relRoughness = roughness_m / D;
  const eta = inputs.pumpEfficiency_pct / 100;
  const g = STANDARD_GRAVITY_M_S2;

  const area_m2 = (Math.PI * D * D) / 4;
  const velocity_m_s = Q_m3_s / area_m2;
  const velocityHead_m = (velocity_m_s * velocity_m_s) / (2 * g);
  const reynoldsNumber = (rho * velocity_m_s * D) / mu;
  const flowRegime = classifyFlowRegime(reynoldsNumber);

  let darcyFrictionFactor = 0;
  let frictionCorrelationUsed = 'Zero Flow (No Friction)';

  if (flowRegime === 'Zero Flow') {
    validationIssues.push({
      field: 'flowRate_L_s',
      severity: 'warning',
      message:
        'Zero-Flow Condition (Q = 0 L/s): Velocity and frictional losses are zero. Required pump head equals the static elevation column Δz, with zero hydraulic or shaft power.',
    });
  } else if (flowRegime === 'Laminar') {
    darcyFrictionFactor = 64 / reynoldsNumber;
    frictionCorrelationUsed = 'Hagen–Poiseuille Laminar (f_D = 64 / Re)';
  } else if (flowRegime === 'Transitional') {
    darcyFrictionFactor = solveColebrookWhite(reynoldsNumber, relRoughness);
    frictionCorrelationUsed =
      'Transitional Regime — Colebrook–White Turbulent Reference Estimate';
    validationIssues.push({
      field: 'general',
      severity: 'warning',
      message: `Transitional Flow Advisory (Re = ${Math.round(
        reynoldsNumber
      ).toLocaleString()} in 2,100–4,000): Flow alternates intermittently between laminar and turbulent behavior, so friction-factor predictions carry high uncertainty. The value shown (${darcyFrictionFactor.toFixed(
        4
      )}) uses Colebrook–White as a conservative turbulent reference—not an exact physical law (for comparison, laminar 64/Re = ${(
        64 / reynoldsNumber
      ).toFixed(4)}).`,
    });
  } else {
    darcyFrictionFactor = solveColebrookWhite(reynoldsNumber, relRoughness);
    frictionCorrelationUsed = 'Colebrook–White Turbulent Solver';
  }

  if (relRoughness > 0.05) {
    validationIssues.push({
      field: 'roughness_mm',
      severity: 'warning',
      message: `High Relative Roughness Advisory (ε/D = ${relRoughness.toFixed(
        4
      )} > 0.05): Commercial Moody chart correlations are primarily calibrated for ε/D ≤ 0.05.`,
    });
  }

  const fanningFrictionFactor = darcyFrictionFactor / 4;
  const majorHeadLoss_m = darcyFrictionFactor * (L / D) * velocityHead_m;
  const minorHeadLoss_m = inputs.minorLossK * velocityHead_m;
  const totalFrictionHeadLoss_m = majorHeadLoss_m + minorHeadLoss_m;

  const frictionalPressureLoss_Pa = rho * g * totalFrictionHeadLoss_m;
  const frictionalPressureLoss_kPa = frictionalPressureLoss_Pa / 1000;
  const elevationPressure_kPa = (rho * g * inputs.elevationDiff_m) / 1000;

  const requiredPumpHead_m = inputs.elevationDiff_m + totalFrictionHeadLoss_m;
  const totalPumpPressureRise_kPa = (rho * g * requiredPumpHead_m) / 1000;

  const hydraulicPower_W = rho * g * Q_m3_s * requiredPumpHead_m;
  const hydraulicPower_kW = hydraulicPower_W / 1000;
  const shaftPower_W = hydraulicPower_W / eta;
  const shaftPower_kW = shaftPower_W / 1000;

  return {
    isValid: true,
    validationIssues,
    flowRate_m3_s: Q_m3_s,
    area_m2,
    velocity_m_s,
    velocityHead_m,
    reynoldsNumber,
    flowRegime,
    relativeRoughness: relRoughness,
    darcyFrictionFactor,
    fanningFrictionFactor,
    frictionCorrelationUsed,
    majorHeadLoss_m,
    minorHeadLoss_m,
    totalFrictionHeadLoss_m,
    frictionalPressureLoss_Pa,
    frictionalPressureLoss_kPa,
    elevationPressure_kPa,
    requiredPumpHead_m,
    totalPumpPressureRise_kPa,
    hydraulicPower_W,
    hydraulicPower_kW,
    shaftPower_W,
    shaftPower_kW,
  };
}

/**
 * Generate real parametric sweep curves across volumetric flow rate Q (L/s)
 * while holding pipe geometry, fluid properties, roughness, K, Δz, and η constant.
 */
export function generateFlowSweepSeries(
  inputs: FluidMechanicsInputs,
  points = 25
): FluidSweepPoint[] {
  const baseCheck = validateFluidMechanicsInputs(inputs);
  if (baseCheck.some((i) => i.severity === 'error')) {
    return [];
  }

  const maxFlow = Math.max(25, inputs.flowRate_L_s * 1.5, 20);
  const flowGrid = new Set<number>();

  for (let i = 0; i < points; i++) {
    const q = (maxFlow * i) / (points - 1);
    flowGrid.add(Number(q.toFixed(3)));
  }
  flowGrid.add(Number(inputs.flowRate_L_s.toFixed(3)));

  const sortedFlows = Array.from(flowGrid).sort((a, b) => a - b);

  return sortedFlows.map((q) => {
    const res = calculateFluidMechanics({ ...inputs, flowRate_L_s: q });
    return {
      flowRate_L_s: q,
      velocity_m_s: Number(res.velocity_m_s.toFixed(4)),
      reynoldsNumber: Number(res.reynoldsNumber.toFixed(1)),
      darcyFrictionFactor: Number(res.darcyFrictionFactor.toFixed(5)),
      majorHeadLoss_m: Number(res.majorHeadLoss_m.toFixed(4)),
      minorHeadLoss_m: Number(res.minorHeadLoss_m.toFixed(4)),
      frictionalPressureLoss_kPa: Number(res.frictionalPressureLoss_kPa.toFixed(3)),
      requiredPumpHead_m: Number(res.requiredPumpHead_m.toFixed(3)),
      shaftPower_kW: Number(res.shaftPower_kW.toFixed(4)),
      regime: res.flowRegime,
    };
  });
}

/**
 * Generate Moody-diagram-style Darcy friction factor curves vs. Reynolds number:
 * - Laminar line (Re: 300 to 2100)
 * - Turbulent Colebrook–White curve at active ε/D (Re: 4000 to 1e7)
 * - Turbulent smooth pipe curve ε/D = 0 (Re: 4000 to 1e7)
 * Intentionally leaves [2100, 4000) unplotted as a continuous curve to respect
 * transitional regime uncertainty.
 */
export function generateMoodySeries(relativeRoughness: number): MoodyPoint[] {
  const relRough = Math.max(0, relativeRoughness);
  const laminarRe = [300, 450, 650, 900, 1200, 1600, 2100];
  const turbulentRe = [
    4000, 6000, 10000, 18000, 32000, 60000, 100000, 200000, 400000, 800000,
    1500000, 3000000, 6000000, 10000000,
  ];

  const points: MoodyPoint[] = [];

  for (const re of laminarRe) {
    points.push({
      reynoldsNumber: re,
      laminarFriction: Number((64 / re).toFixed(5)),
      turbulentCurrentRoughness: null,
      turbulentSmoothPipe: null,
    });
  }

  for (const re of turbulentRe) {
    points.push({
      reynoldsNumber: re,
      laminarFriction: null,
      turbulentCurrentRoughness: Number(solveColebrookWhite(re, relRough).toFixed(5)),
      turbulentSmoothPipe: Number(solveColebrookWhite(re, 0).toFixed(5)),
    });
  }

  return points;
}
