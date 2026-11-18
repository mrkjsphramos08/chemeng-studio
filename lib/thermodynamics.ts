/**
 * ChemEng Studio — Phase 2.3
 * Chemical Engineering Thermodynamics Calculation Engine
 *
 * Module A: Pure-Fluid PVT Behavior & Peng–Robinson Equation of State (PR EOS)
 * Module B: Ideal Binary Vapor–Liquid Equilibrium (Raoult's Law & Dalton's Law)
 *
 * Pure, deterministic TypeScript module with zero React/DOM dependencies.
 * All internal calculations use strict SI units:
 * - Temperature T: K
 * - Pressure P: Pa (with convenience kPa/bar conversions for display)
 * - Molar volume v: m³ / mol (with L / mol convenience conversions)
 * - Universal gas constant R = 8.314462618 J / (mol·K)
 */

export const GAS_CONSTANT_R = 8.314462618; // J / (mol·K) [CODATA 2018 exact]

export type ReferenceFluidId = 'CO2' | 'N2' | 'CH4' | 'C2H6';

export interface ReferenceFluidProperties {
  id: ReferenceFluidId;
  name: string;
  formula: string;
  formulaLatex: string;
  Tc_K: number; // Critical temperature [K]
  Pc_Pa: number; // Critical pressure [Pa]
  Pc_bar: number; // Critical pressure [bar]
  omega: number; // Pitzer acentric factor [-]
  Vc_cm3_mol: number; // Critical molar volume [cm³/mol]
  molarMass_g_mol: number; // Molecular weight [g/mol]
  normalBoilingPoint_K: number; // Normal boiling/sublimation point at 1 atm [K]
  referenceSource: string; // Published textbook / NIST reference source
  engineeringContext: string;
}

/**
 * Verified pure-component critical constants from NIST Chemistry WebBook,
 * Poling, Prausnitz & O'Connell (The Properties of Gases and Liquids, 5th Ed.),
 * and Smith, Van Ness & Abbott (Introduction to Chemical Engineering Thermodynamics, 8th Ed.).
 */
export const THERMO_REFERENCE_FLUIDS: Record<ReferenceFluidId, ReferenceFluidProperties> = {
  CO2: {
    id: 'CO2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    formulaLatex: '\\mathrm{CO_2}',
    Tc_K: 304.13,
    Pc_Pa: 7.3773e6,
    Pc_bar: 73.773,
    omega: 0.22394,
    Vc_cm3_mol: 94.1,
    molarMass_g_mol: 44.01,
    normalBoilingPoint_K: 194.68,
    referenceSource:
      'NIST Chemistry WebBook (Span & Wagner, J. Phys. Chem. Ref. Data, 1996); Smith, Van Ness & Abbott (8th Ed.)',
    engineeringContext:
      'Near-ambient critical point (304.13 K, 73.77 bar) makes CO₂ the classic fluid for studying strong intermolecular attraction (Z < 1), subcritical multi-root behavior, and supercritical fluid extraction.',
  },
  N2: {
    id: 'N2',
    name: 'Nitrogen',
    formula: 'N₂',
    formulaLatex: '\\mathrm{N_2}',
    Tc_K: 126.192,
    Pc_Pa: 3.3958e6,
    Pc_bar: 33.958,
    omega: 0.0372,
    Vc_cm3_mol: 89.5,
    molarMass_g_mol: 28.0134,
    normalBoilingPoint_K: 77.355,
    referenceSource:
      'NIST Chemistry WebBook (Span, Lemmon, Jacobsen, Wagner & Yokozeki, 2000); Poling, Prausnitz & O’Connell (5th Ed.)',
    engineeringContext:
      'Cryogenic critical temperature (126.19 K) means N₂ at room temperature (T_r ≈ 2.38) behaves nearly ideally at moderate pressures and exhibits repulsive Z > 1 departure at very high cylinder pressures.',
  },
  CH4: {
    id: 'CH4',
    name: 'Methane',
    formula: 'CH₄',
    formulaLatex: '\\mathrm{CH_4}',
    Tc_K: 190.564,
    Pc_Pa: 4.5992e6,
    Pc_bar: 45.992,
    omega: 0.01142,
    Vc_cm3_mol: 98.6,
    molarMass_g_mol: 16.043,
    normalBoilingPoint_K: 111.667,
    referenceSource:
      'NIST Chemistry WebBook (Setzmann & Wagner, J. Phys. Chem. Ref. Data, 1991); Smith, Van Ness & Abbott (8th Ed.)',
    engineeringContext:
      'Nearly spherical non-polar molecule (ω = 0.01142) central to natural gas pipeline compression and LNG liquefaction.',
  },
  C2H6: {
    id: 'C2H6',
    name: 'Ethane',
    formula: 'C₂H₆',
    formulaLatex: '\\mathrm{C_2H_6}',
    Tc_K: 305.322,
    Pc_Pa: 4.8722e6,
    Pc_bar: 48.722,
    omega: 0.0995,
    Vc_cm3_mol: 145.5,
    molarMass_g_mol: 30.07,
    normalBoilingPoint_K: 184.55,
    referenceSource:
      'NIST Chemistry WebBook (Bücker & Wagner, J. Phys. Chem. Ref. Data, 2006); Poling, Prausnitz & O’Connell (5th Ed.)',
    engineeringContext:
      'Light hydrocarbon feedstock for steam cracking with a near-ambient critical temperature (305.32 K) and moderate acentricity.',
  },
};

export type RootSelectionPreference = 'vapor' | 'liquid';

export interface PureFluidPVTInputs {
  fluidId: ReferenceFluidId;
  temperature_K: number; // System temperature T [K]
  pressure_Pa: number; // System pressure P [Pa]
  moles_n?: number; // Total moles n [mol], default = 1.0 mol
  rootPreference?: RootSelectionPreference; // Preferred branch when 3 real roots occur
}

export type PVTRegimeClassification =
  | 'Ideal-Gas Limit'
  | 'Subcritical Multi-Root Region'
  | 'Near-Critical Region'
  | 'Attractive-Dominated Real Gas (Z < 1)'
  | 'Repulsive-Dominated Real Gas (Z > 1)';

export interface CubicRootDiagnosis {
  rawRealRoots_Z: number[]; // All mathematically real roots of Z^3 + c2*Z^2 + c1*Z + c0 = 0
  validPhysicalRoots_Z: number[]; // Roots satisfying Z > B (v > b > 0)
  rejectedNonPhysicalRoots_Z: number[]; // Roots rejected because Z <= B
  maxResidual: number; // Maximum |f(Z)| across all returned real roots
  rootCount: 1 | 3;
  hasMultipleValidRoots: boolean;
  vaporLikeRoot_Z: number; // Largest valid root (Z_max)
  liquidLikeRoot_Z: number | null; // Smallest valid root (Z_min) when >1 valid roots exist
  unstableMiddleRoot_Z: number | null; // Intermediate spinodal root when 3 valid roots exist
}

export interface PureFluidPVTResults {
  isValid: boolean;
  validationErrors: string[];
  advisories: string[];

  fluid: ReferenceFluidProperties;
  temperature_K: number;
  temperature_C: number;
  pressure_Pa: number;
  pressure_bar: number;
  pressure_MPa: number;
  moles_n: number;

  // Reduced coordinates
  reducedTemperature_Tr: number;
  reducedPressure_Pr: number;

  // Peng-Robinson EOS parameters
  kappa: number;
  alpha: number;
  a_critical_Pa_m6_mol2: number; // a = 0.45724 * R^2 * Tc^2 / Pc
  a_alpha_Pa_m6_mol2: number; // a * alpha(Tr)
  b_m3_mol: number; // b = 0.07780 * R * Tc / Pc
  b_cm3_mol: number;
  dimensionless_A: number; // A = a*alpha*P / (R^2 * T^2)
  dimensionless_B: number; // B = b*P / (R*T)

  // Cubic polynomial Z^3 + c2*Z^2 + c1*Z + c0 = 0
  cubicCoefficients: {
    c2: number; // -(1 - B)
    c1: number; // A - 3B^2 - 2B
    c0: number; // -(AB - B^2 - B^3)
  };

  rootDiagnosis: CubicRootDiagnosis;
  activeRootPreference: RootSelectionPreference;

  // Active compressibility & molar volume
  compressibilityFactor_Z: number;
  idealCompressibilityFactor_Z: number; // 1.0
  idealMolarVolume_m3_mol: number;
  idealMolarVolume_L_mol: number;
  prMolarVolume_m3_mol: number;
  prMolarVolume_L_mol: number;
  totalVolumeIdeal_L: number;
  totalVolumePR_L: number;

  // Vapor-like and liquid-like branch volumes (equal when single root)
  vaporLikeMolarVolume_m3_mol: number;
  vaporLikeMolarVolume_L_mol: number;
  liquidLikeMolarVolume_m3_mol: number | null;
  liquidLikeMolarVolume_L_mol: number | null;

  // Reconstructed pressure from explicit PR EOS P(T, v_PR) for self-consistency verification
  reconstructedPressure_Pa: number;
  pressureReconstructionRelativeError: number;

  // Deviations & physical interpretation
  volumeDeviationPercent: number; // (v_PR - v_ideal) / v_ideal * 100 = (Z - 1)*100
  repulsivePressureTerm_Pa: number; // RT / (v - b)
  attractivePressureTerm_Pa: number; // a*alpha / (v(v+b) + b(v-b))
  covolumeRatio_v_over_b: number; // v_PR / b (must be > 1)
  isNearCritical: boolean;
  regime: PVTRegimeClassification;
}

/**
 * Evaluates the Peng-Robinson cubic polynomial f(Z) = Z^3 + c2*Z^2 + c1*Z + c0
 */
export function evaluatePRCubicPolynomial(
  Z: number,
  c2: number,
  c1: number,
  c0: number
): number {
  return ((Z + c2) * Z + c1) * Z + c0;
}

/**
 * Evaluates explicit Peng-Robinson pressure P(T, v) [Pa] from temperature T [K]
 * and molar volume v [m³/mol]. Requires v > b.
 */
export function calculatePengRobinsonPressureFromVolume(
  temperature_K: number,
  molarVolume_m3_mol: number,
  a_alpha_Pa_m6_mol2: number,
  b_m3_mol: number
): number {
  if (molarVolume_m3_mol <= b_m3_mol) {
    throw new Error(
      `Nonphysical molar volume v = ${molarVolume_m3_mol} m³/mol must exceed molecular covolume b = ${b_m3_mol} m³/mol.`
    );
  }
  const v = molarVolume_m3_mol;
  const b = b_m3_mol;
  const repulsive = (GAS_CONSTANT_R * temperature_K) / (v - b);
  const attractive = a_alpha_Pa_m6_mol2 / (v * (v + b) + b * (v - b));
  return repulsive - attractive;
}

/**
 * Refines a single real root of Z^3 + c2*Z^2 + c1*Z + c0 = 0 using Newton-Raphson.
 */
function polishCubicRootNewton(
  initialZ: number,
  c2: number,
  c1: number,
  c0: number
): number {
  let z = initialZ;
  for (let iter = 0; iter < 25; iter++) {
    const f = ((z + c2) * z + c1) * z + c0;
    if (Math.abs(f) < 1e-14) {
      break;
    }
    const df = (3 * z + 2 * c2) * z + c1;
    if (Math.abs(df) < 1e-14) {
      break;
    }
    const step = f / df;
    z -= step;
    if (Math.abs(step) < 1e-14) {
      break;
    }
  }
  return z;
}

/**
 * Solves the monic cubic equation Z^3 + c2*Z^2 + c1*Z + c0 = 0 for all real roots,
 * sorted in ascending order, and polished with Newton-Raphson.
 */
export function solveCubicRealRoots(c2: number, c1: number, c0: number): number[] {
  // Depressed cubic substitution Z = y - c2 / 3 => y^3 + p*y + q = 0
  const p = c1 - (c2 * c2) / 3.0;
  const q = (2.0 * c2 * c2 * c2) / 27.0 - (c2 * c1) / 3.0 + c0;

  const halfQ = q / 2.0;
  const thirdP = p / 3.0;
  const discriminant = halfQ * halfQ + thirdP * thirdP * thirdP;

  const shift = c2 / 3.0;
  const rawRoots: number[] = [];

  if (discriminant > 1e-16) {
    // One real root and two complex conjugate roots
    const sqrtD = Math.sqrt(discriminant);
    const u = Math.cbrt(-halfQ + sqrtD);
    const v = Math.cbrt(-halfQ - sqrtD);
    const z1 = u + v - shift;
    rawRoots.push(polishCubicRootNewton(z1, c2, c1, c0));
  } else if (Math.abs(discriminant) <= 1e-16) {
    // Multiple real roots (degenerate boundary)
    if (Math.abs(halfQ) < 1e-16 && Math.abs(thirdP) < 1e-16) {
      rawRoots.push(polishCubicRootNewton(-shift, c2, c1, c0));
    } else {
      const u = Math.cbrt(-halfQ);
      const z1 = 2.0 * u - shift;
      const z2 = -u - shift;
      const r1 = polishCubicRootNewton(z1, c2, c1, c0);
      const r2 = polishCubicRootNewton(z2, c2, c1, c0);
      rawRoots.push(r1);
      if (Math.abs(r1 - r2) > 1e-7) {
        rawRoots.push(r2);
      }
    }
  } else {
    // Three distinct real roots (Casus irreducibilis, p < 0)
    const r = Math.sqrt(Math.max(0, -thirdP));
    const cosArg = Math.max(-1.0, Math.min(1.0, -halfQ / (r * r * r)));
    const phi = Math.acos(cosArg);
    const twoR = 2.0 * r;

    const y1 = twoR * Math.cos(phi / 3.0) - shift;
    const y2 = twoR * Math.cos((phi + 2.0 * Math.PI) / 3.0) - shift;
    const y3 = twoR * Math.cos((phi + 4.0 * Math.PI) / 3.0) - shift;

    rawRoots.push(
      polishCubicRootNewton(y1, c2, c1, c0),
      polishCubicRootNewton(y2, c2, c1, c0),
      polishCubicRootNewton(y3, c2, c1, c0)
    );
  }

  rawRoots.sort((a, b) => a - b);
  return rawRoots;
}

/**
 * Core Pure-Fluid PVT & Peng–Robinson EOS calculation function.
 */
export function calculatePureFluidPVT(inputs: PureFluidPVTInputs): PureFluidPVTResults {
  const fluid = THERMO_REFERENCE_FLUIDS[inputs.fluidId] ?? THERMO_REFERENCE_FLUIDS.CO2;
  const T = inputs.temperature_K;
  const P = inputs.pressure_Pa;
  const n = inputs.moles_n ?? 1.0;
  const pref: RootSelectionPreference = inputs.rootPreference ?? 'vapor';

  const validationErrors: string[] = [];
  const advisories: string[] = [];

  if (!Number.isFinite(T) || T <= 0) {
    validationErrors.push('Absolute temperature T must be finite and strictly positive (T > 0 K).');
  }
  if (!Number.isFinite(P) || P <= 0) {
    validationErrors.push('Absolute pressure P must be finite and strictly positive (P > 0 Pa).');
  }
  if (!Number.isFinite(n) || n <= 0) {
    validationErrors.push('Molar amount n must be finite and strictly positive (n > 0 mol).');
  }

  const safeT = Number.isFinite(T) && T > 0 ? T : 300;
  const safeP = Number.isFinite(P) && P > 0 ? P : 101325;
  const safeN = Number.isFinite(n) && n > 0 ? n : 1.0;

  const Tc = fluid.Tc_K;
  const Pc = fluid.Pc_Pa;
  const omega = fluid.omega;

  const Tr = safeT / Tc;
  const Pr = safeP / Pc;

  // Peng-Robinson parameters
  const kappa = 0.37464 + 1.54226 * omega - 0.26992 * omega * omega;
  const sqrtTr = Math.sqrt(Tr);
  const alphaTerm = 1.0 + kappa * (1.0 - sqrtTr);
  const alpha = alphaTerm * alphaTerm;

  const a_critical = (0.45724 * GAS_CONSTANT_R * GAS_CONSTANT_R * Tc * Tc) / Pc;
  const a_alpha = a_critical * alpha;
  const b = (0.0778 * GAS_CONSTANT_R * Tc) / Pc;

  const A = (a_alpha * safeP) / (GAS_CONSTANT_R * GAS_CONSTANT_R * safeT * safeT);
  const B = (b * safeP) / (GAS_CONSTANT_R * safeT);

  // Z^3 - (1 - B)Z^2 + (A - 3B^2 - 2B)Z - (AB - B^2 - B^3) = 0
  const c2 = -(1.0 - B);
  const c1 = A - 3.0 * B * B - 2.0 * B;
  const c0 = -(A * B - B * B - B * B * B);

  const rawRealRoots = solveCubicRealRoots(c2, c1, c0);
  const validPhysicalRoots = rawRealRoots.filter((z) => z > B + 1e-12 && z > 0);
  const rejectedNonPhysicalRoots = rawRealRoots.filter((z) => !(z > B + 1e-12 && z > 0));

  // Guarantee at least the largest root if extreme numerical edge case
  const effectiveValidRoots =
    validPhysicalRoots.length > 0
      ? validPhysicalRoots
      : [Math.max(rawRealRoots[rawRealRoots.length - 1], B * 1.0001)];

  const maxResidual = rawRealRoots.reduce((maxRes, z) => {
    const res = Math.abs(evaluatePRCubicPolynomial(z, c2, c1, c0));
    return Math.max(maxRes, res);
  }, 0);

  const vaporLikeRoot_Z = effectiveValidRoots[effectiveValidRoots.length - 1];
  const hasMultipleValidRoots = effectiveValidRoots.length >= 2;
  const liquidLikeRoot_Z = hasMultipleValidRoots ? effectiveValidRoots[0] : null;
  const unstableMiddleRoot_Z =
    effectiveValidRoots.length === 3 ? effectiveValidRoots[1] : null;

  const selectedZ =
    pref === 'liquid' && liquidLikeRoot_Z !== null ? liquidLikeRoot_Z : vaporLikeRoot_Z;

  const idealMolarVolume_m3_mol = (GAS_CONSTANT_R * safeT) / safeP;
  const prMolarVolume_m3_mol = (selectedZ * GAS_CONSTANT_R * safeT) / safeP;

  const vaporLikeMolarVolume_m3_mol = (vaporLikeRoot_Z * GAS_CONSTANT_R * safeT) / safeP;
  const liquidLikeMolarVolume_m3_mol =
    liquidLikeRoot_Z !== null ? (liquidLikeRoot_Z * GAS_CONSTANT_R * safeT) / safeP : null;

  const repulsivePressureTerm_Pa =
    (GAS_CONSTANT_R * safeT) / (prMolarVolume_m3_mol - b);
  const attractivePressureTerm_Pa =
    a_alpha /
    (prMolarVolume_m3_mol * (prMolarVolume_m3_mol + b) +
      b * (prMolarVolume_m3_mol - b));
  const reconstructedPressure_Pa = repulsivePressureTerm_Pa - attractivePressureTerm_Pa;
  const pressureReconstructionRelativeError =
    Math.abs(reconstructedPressure_Pa - safeP) / safeP;

  const volumeDeviationPercent =
    ((prMolarVolume_m3_mol - idealMolarVolume_m3_mol) / idealMolarVolume_m3_mol) * 100.0;

  const isNearCritical = Tr >= 0.95 && Tr <= 1.05 && Pr >= 0.85 && Pr <= 1.25;

  let regime: PVTRegimeClassification;
  if (hasMultipleValidRoots) {
    regime = 'Subcritical Multi-Root Region';
  } else if (isNearCritical) {
    regime = 'Near-Critical Region';
  } else if (Math.abs(selectedZ - 1.0) < 0.015 && Pr < 0.1) {
    regime = 'Ideal-Gas Limit';
  } else if (selectedZ < 1.0) {
    regime = 'Attractive-Dominated Real Gas (Z < 1)';
  } else {
    regime = 'Repulsive-Dominated Real Gas (Z > 1)';
  }

  if (hasMultipleValidRoots) {
    advisories.push(
      `Subcritical 3-Root Domain (T_r = ${Tr.toFixed(3)} < 1): The Peng–Robinson cubic yields three real roots. The largest root (Z_vapor = ${vaporLikeRoot_Z.toFixed(4)}) represents the vapor-like branch, the smallest root (Z_liquid = ${liquidLikeRoot_Z?.toFixed(4)}) represents the liquid-like branch, and the intermediate root (Z_mid = ${unstableMiddleRoot_Z?.toFixed(4) ?? '—'}) lies on the mechanically unstable spinodal (∂P/∂v > 0). Rigorous phase stability requires equal fugacity (f^V = f^L), which is outside Phase 2.3 scope.`
    );
  }

  if (isNearCritical) {
    advisories.push(
      `Near-Critical Condition (T_r = ${Tr.toFixed(3)}, P_r = ${Pr.toFixed(3)}): Fluid compressibility (∂v/∂P)_T diverges near the critical point (T_c = ${Tc.toFixed(2)} K, P_c = ${fluid.Pc_bar.toFixed(2)} bar), where Z_c,PR ≈ 0.3074.`
    );
  }

  if (rejectedNonPhysicalRoots.length > 0) {
    advisories.push(
      `Excluded ${rejectedNonPhysicalRoots.length} mathematical root(s) with Z ≤ B = ${B.toFixed(4)} because molar volume v must strictly exceed the hard-sphere molecular covolume b = ${(b * 1e6).toFixed(2)} cm³/mol.`
    );
  }

  return {
    isValid: validationErrors.length === 0,
    validationErrors,
    advisories,
    fluid,
    temperature_K: safeT,
    temperature_C: safeT - 273.15,
    pressure_Pa: safeP,
    pressure_bar: safeP / 1e5,
    pressure_MPa: safeP / 1e6,
    moles_n: safeN,
    reducedTemperature_Tr: Tr,
    reducedPressure_Pr: Pr,
    kappa,
    alpha,
    a_critical_Pa_m6_mol2: a_critical,
    a_alpha_Pa_m6_mol2: a_alpha,
    b_m3_mol: b,
    b_cm3_mol: b * 1e6,
    dimensionless_A: A,
    dimensionless_B: B,
    cubicCoefficients: { c2, c1, c0 },
    rootDiagnosis: {
      rawRealRoots_Z: rawRealRoots,
      validPhysicalRoots_Z: effectiveValidRoots,
      rejectedNonPhysicalRoots_Z: rejectedNonPhysicalRoots,
      maxResidual,
      rootCount: rawRealRoots.length >= 3 ? 3 : 1,
      hasMultipleValidRoots,
      vaporLikeRoot_Z,
      liquidLikeRoot_Z,
      unstableMiddleRoot_Z,
    },
    activeRootPreference: pref,
    compressibilityFactor_Z: selectedZ,
    idealCompressibilityFactor_Z: 1.0,
    idealMolarVolume_m3_mol,
    idealMolarVolume_L_mol: idealMolarVolume_m3_mol * 1000.0,
    prMolarVolume_m3_mol,
    prMolarVolume_L_mol: prMolarVolume_m3_mol * 1000.0,
    totalVolumeIdeal_L: idealMolarVolume_m3_mol * safeN * 1000.0,
    totalVolumePR_L: prMolarVolume_m3_mol * safeN * 1000.0,
    vaporLikeMolarVolume_m3_mol,
    vaporLikeMolarVolume_L_mol: vaporLikeMolarVolume_m3_mol * 1000.0,
    liquidLikeMolarVolume_m3_mol,
    liquidLikeMolarVolume_L_mol:
      liquidLikeMolarVolume_m3_mol !== null ? liquidLikeMolarVolume_m3_mol * 1000.0 : null,
    reconstructedPressure_Pa,
    pressureReconstructionRelativeError,
    volumeDeviationPercent,
    repulsivePressureTerm_Pa,
    attractivePressureTerm_Pa,
    covolumeRatio_v_over_b: prMolarVolume_m3_mol / b,
    isNearCritical,
    regime,
  };
}

export interface ZvsPressurePoint {
  pressure_bar: number;
  pressure_MPa: number;
  Z_ideal: number;
  Z_PR_selected: number;
  Z_PR_vapor: number;
  Z_PR_liquid: number | null;
  v_ideal_L_mol: number;
  v_PR_L_mol: number;
  deviationPercent: number;
}

/**
 * Generates series across pressure (1 bar to maxPressureBar) at fixed T for:
 * 1. Compressibility factor Z vs. Pressure
 * 2. Ideal vs. Peng–Robinson Molar Volume v vs. Pressure
 * 3. Relative Ideal-Gas Deviation (%) vs. Pressure
 */
export function generatePressureSweepSeries(
  fluidId: ReferenceFluidId,
  temperature_K: number,
  activePressure_Pa: number,
  rootPreference: RootSelectionPreference = 'vapor',
  numPoints: number = 60
): ZvsPressurePoint[] {
  const maxBar = Math.max(150, Math.ceil((activePressure_Pa / 1e5) * 1.25));
  const minBar = 1.0;
  const points: ZvsPressurePoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const frac = i / (numPoints - 1);
    const pBar = minBar + frac * (maxBar - minBar);
    const res = calculatePureFluidPVT({
      fluidId,
      temperature_K,
      pressure_Pa: pBar * 1e5,
      rootPreference,
    });
    points.push({
      pressure_bar: Number(pBar.toFixed(2)),
      pressure_MPa: Number((pBar / 10).toFixed(3)),
      Z_ideal: 1.0,
      Z_PR_selected: Number(res.compressibilityFactor_Z.toFixed(4)),
      Z_PR_vapor: Number(res.rootDiagnosis.vaporLikeRoot_Z.toFixed(4)),
      Z_PR_liquid:
        res.rootDiagnosis.liquidLikeRoot_Z !== null
          ? Number(res.rootDiagnosis.liquidLikeRoot_Z.toFixed(4))
          : null,
      v_ideal_L_mol: Number(res.idealMolarVolume_L_mol.toFixed(4)),
      v_PR_L_mol: Number(res.prMolarVolume_L_mol.toFixed(4)),
      deviationPercent: Number(res.volumeDeviationPercent.toFixed(2)),
    });
  }
  return points;
}

export interface PVIsothermPoint {
  molarVolume_L_mol: number;
  P_ideal_activeT_bar: number;
  P_PR_activeT_bar: number;
  P_PR_criticalT_bar: number;
  P_PR_highT_bar: number;
}

/**
 * Generates Pressure–Volume (P–v) isotherm curves comparing:
 * - Ideal gas at active T
 * - Peng–Robinson at active T
 * - Peng–Robinson at critical temperature T_c
 * - Peng–Robinson at supercritical temperature 1.20 * T_c
 */
export function generatePVIsothermSeries(
  fluidId: ReferenceFluidId,
  activeTemperature_K: number,
  numPoints: number = 65
): {
  points: PVIsothermPoint[];
  labels: {
    activeT_K: number;
    criticalT_K: number;
    highT_K: number;
  };
} {
  const fluid = THERMO_REFERENCE_FLUIDS[fluidId] ?? THERMO_REFERENCE_FLUIDS.CO2;
  const Tc = fluid.Tc_K;
  const Pc = fluid.Pc_Pa;
  const omega = fluid.omega;

  const kappa = 0.37464 + 1.54226 * omega - 0.26992 * omega * omega;
  const a_crit = (0.45724 * GAS_CONSTANT_R * GAS_CONSTANT_R * Tc * Tc) / Pc;
  const b = (0.0778 * GAS_CONSTANT_R * Tc) / Pc;

  const calcAlpha = (T: number) => {
    const term = 1.0 + kappa * (1.0 - Math.sqrt(T / Tc));
    return term * term;
  };

  const T_active = activeTemperature_K;
  const T_crit = Tc;
  const T_high = Number((1.2 * Tc).toFixed(1));

  const a_active = a_crit * calcAlpha(T_active);
  const a_critT = a_crit * calcAlpha(T_crit);
  const a_high = a_crit * calcAlpha(T_high);

  // Logarithmically spaced molar volumes from 1.65 * b up to ~2.5 L/mol
  const vMin = b * 1.65;
  const vMax = 0.0025; // 2.5 L/mol in m³/mol
  const logMin = Math.log(vMin);
  const logMax = Math.log(vMax);

  const clampBar = (pPa: number) =>
    Number(Math.max(-50, Math.min(350, pPa / 1e5)).toFixed(2));

  const points: PVIsothermPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const frac = i / (numPoints - 1);
    const v = Math.exp(logMin + frac * (logMax - logMin));
    const pIdeal = (GAS_CONSTANT_R * T_active) / v;
    const pActive = calculatePengRobinsonPressureFromVolume(T_active, v, a_active, b);
    const pCrit = calculatePengRobinsonPressureFromVolume(T_crit, v, a_critT, b);
    const pHigh = calculatePengRobinsonPressureFromVolume(T_high, v, a_high, b);

    points.push({
      molarVolume_L_mol: Number((v * 1000).toFixed(4)),
      P_ideal_activeT_bar: clampBar(pIdeal),
      P_PR_activeT_bar: clampBar(pActive),
      P_PR_criticalT_bar: clampBar(pCrit),
      P_PR_highT_bar: clampBar(pHigh),
    });
  }

  return {
    points,
    labels: {
      activeT_K: T_active,
      criticalT_K: T_crit,
      highT_K: T_high,
    },
  };
}

// ============================================================================
// MODULE B: IDEAL BINARY VAPOR–LIQUID EQUILIBRIUM (RAOULT'S & DALTON'S LAWS)
// ============================================================================

export interface BinaryVLEInputs {
  liquidMoleFraction_xA: number; // Overall / liquid mole fraction of component A in [0, 1]
  psatA_kPa: number; // Saturation vapor pressure of pure A at isothermal T [kPa]
  psatB_kPa: number; // Saturation vapor pressure of pure B at isothermal T [kPa]
  systemPressure_kPa: number; // Operating vessel pressure P_sys [kPa] for phase-region exploration
  systemTemperature_K?: number; // Nominal isothermal cell temperature T [K] (display context)
}

export type BinaryPhaseState =
  | 'Compressed (Subcooled) Liquid'
  | 'Two-Phase Vapor–Liquid Equilibrium'
  | 'Superheated Vapor';

export interface BinaryVLEResults {
  isValid: boolean;
  validationErrors: string[];
  advisories: string[];

  // Normalized compositions at specified x_A
  xA: number;
  xB: number;
  psatA_kPa: number;
  psatB_kPa_Pa: number;
  psatA_Pa: number;
  psatB_kPa: number;
  systemPressure_kPa: number;
  systemPressure_Pa: number;
  systemTemperature_K: number;

  // Partial pressures at liquid composition x_A (Raoult's Law)
  partialPressureA_kPa: number; // p_A = x_A * P_A^sat
  partialPressureB_kPa: number; // p_B = (1 - x_A) * P_B^sat
  partialPressureA_Pa: number;
  partialPressureB_Pa: number;

  // Bubble-point properties at composition x_A
  bubblePressure_kPa: number; // P_bubble = p_A + p_B
  bubblePressure_Pa: number;
  equilibriumVapor_yA: number; // y_A = p_A / P_bubble
  equilibriumVapor_yB: number; // y_B = 1 - y_A

  // Dew-point properties if vapor has composition y_A = x_A
  dewPressureAtComposition_kPa: number; // 1 / P_dew = y_A / P_A^sat + (1 - y_A) / P_B^sat
  dewPressureAtComposition_Pa: number;
  equilibriumLiquidAtDew_xA: number; // x_A,dew = y_A * P_dew / P_A^sat
  equilibriumLiquidAtDew_xB: number;

  // Volatility & separation factor
  relativeVolatility_alphaAB: number; // alpha_AB = P_A^sat / P_B^sat
  moreVolatileComponent: 'Component A' | 'Component B' | 'Equal Volatility (α = 1)';

  // Isothermal state classification at (z_A = x_A, P_sys)
  phaseStateAtSystemPressure: BinaryPhaseState;
  tieLineLiquid_xA: number | null; // Equilibrium liquid composition at P_sys when in two-phase envelope
  tieLineVapor_yA: number | null; // Equilibrium vapor composition at P_sys when in two-phase envelope
  vaporMoleFraction_betaV: number; // 0 in liquid, 1 in vapor, (z_A - x_tie)/(y_tie - x_tie) in 2-phase
}

/**
 * Calculates ideal binary VLE behavior using Raoult's Law and Dalton's Law.
 * Models two hypothetical ideal volatile components A and B at constant temperature.
 */
export function calculateBinaryVLE(inputs: BinaryVLEInputs): BinaryVLEResults {
  const validationErrors: string[] = [];
  const advisories: string[] = [];

  const rawXA = inputs.liquidMoleFraction_xA;
  const rawPsatA = inputs.psatA_kPa;
  const rawPsatB = inputs.psatB_kPa;
  const rawPsys = inputs.systemPressure_kPa;
  const T_K = inputs.systemTemperature_K ?? 350.0;

  if (!Number.isFinite(rawXA) || rawXA < 0 || rawXA > 1) {
    validationErrors.push('Mole fraction x_A must lie in the closed interval [0, 1].');
  }
  if (!Number.isFinite(rawPsatA) || rawPsatA <= 0) {
    validationErrors.push(
      'Saturation vapor pressure P_A^sat must be finite and strictly positive (> 0 kPa).'
    );
  }
  if (!Number.isFinite(rawPsatB) || rawPsatB <= 0) {
    validationErrors.push(
      'Saturation vapor pressure P_B^sat must be finite and strictly positive (> 0 kPa).'
    );
  }
  if (!Number.isFinite(rawPsys) || rawPsys <= 0) {
    validationErrors.push(
      'System operating pressure P_sys must be finite and strictly positive (> 0 kPa).'
    );
  }

  const xA = Number.isFinite(rawXA) ? Math.max(0, Math.min(1, rawXA)) : 0.5;
  const xB = 1.0 - xA;
  const psatA_kPa = Number.isFinite(rawPsatA) && rawPsatA > 0 ? rawPsatA : 120.0;
  const psatB_kPa = Number.isFinite(rawPsatB) && rawPsatB > 0 ? rawPsatB : 45.0;
  const systemPressure_kPa = Number.isFinite(rawPsys) && rawPsys > 0 ? rawPsys : 80.0;

  const partialPressureA_kPa = xA * psatA_kPa;
  const partialPressureB_kPa = xB * psatB_kPa;
  const bubblePressure_kPa = partialPressureA_kPa + partialPressureB_kPa;

  const equilibriumVapor_yA =
    bubblePressure_kPa > 0 ? partialPressureA_kPa / bubblePressure_kPa : xA;
  const equilibriumVapor_yB = 1.0 - equilibriumVapor_yA;

  // Dew pressure at vapor composition y_A = xA: 1 / P_dew = y_A / P_A^sat + (1 - y_A) / P_B^sat
  const invPdew = xA / psatA_kPa + xB / psatB_kPa;
  const dewPressureAtComposition_kPa = invPdew > 0 ? 1.0 / invPdew : bubblePressure_kPa;
  const equilibriumLiquidAtDew_xA =
    (xA * dewPressureAtComposition_kPa) / psatA_kPa;
  const equilibriumLiquidAtDew_xB = 1.0 - equilibriumLiquidAtDew_xA;

  const relativeVolatility_alphaAB = psatA_kPa / psatB_kPa;
  const moreVolatileComponent =
    Math.abs(relativeVolatility_alphaAB - 1.0) < 1e-6
      ? 'Equal Volatility (α = 1)'
      : relativeVolatility_alphaAB > 1.0
        ? 'Component A'
        : 'Component B';

  // Phase state at (z_A = xA, P_sys)
  const eps = 1e-7;
  let phaseStateAtSystemPressure: BinaryPhaseState;
  let tieLineLiquid_xA: number | null = null;
  let tieLineVapor_yA: number | null = null;
  let vaporMoleFraction_betaV = 0;

  if (systemPressure_kPa > bubblePressure_kPa + eps) {
    phaseStateAtSystemPressure = 'Compressed (Subcooled) Liquid';
    vaporMoleFraction_betaV = 0.0;
  } else if (systemPressure_kPa < dewPressureAtComposition_kPa - eps) {
    phaseStateAtSystemPressure = 'Superheated Vapor';
    vaporMoleFraction_betaV = 1.0;
  } else {
    phaseStateAtSystemPressure = 'Two-Phase Vapor–Liquid Equilibrium';
    if (Math.abs(psatA_kPa - psatB_kPa) > 1e-9) {
      const xTie = (systemPressure_kPa - psatB_kPa) / (psatA_kPa - psatB_kPa);
      const clampedXTie = Math.max(0, Math.min(1, xTie));
      const yTie = (clampedXTie * psatA_kPa) / systemPressure_kPa;
      tieLineLiquid_xA = clampedXTie;
      tieLineVapor_yA = Math.max(0, Math.min(1, yTie));
      const denom = tieLineVapor_yA - tieLineLiquid_xA;
      vaporMoleFraction_betaV =
        Math.abs(denom) > 1e-9
          ? Math.max(0, Math.min(1, (xA - tieLineLiquid_xA) / denom))
          : 0.5;
    } else {
      tieLineLiquid_xA = xA;
      tieLineVapor_yA = xA;
      vaporMoleFraction_betaV = 0.5;
    }
  }

  if (Math.abs(relativeVolatility_alphaAB - 1.0) < 0.05) {
    advisories.push(
      `Near-Equal Volatility (α_AB = ${relativeVolatility_alphaAB.toFixed(3)} ≈ 1): Because P_A^sat and P_B^sat are nearly identical, the bubble and dew curves collapse toward a horizontal line and y_A ≈ x_A, making simple distillation unfeasible.`
    );
  }

  if (phaseStateAtSystemPressure === 'Two-Phase Vapor–Liquid Equilibrium' && tieLineLiquid_xA !== null && tieLineVapor_yA !== null) {
    advisories.push(
      `Two-Phase Coexistence Envelope: At P_sys = ${systemPressure_kPa.toFixed(1)} kPa and overall composition z_A = ${xA.toFixed(3)}, the mixture splits along a horizontal tie-line into equilibrium liquid x_A = ${tieLineLiquid_xA.toFixed(3)} and enriched vapor y_A = ${tieLineVapor_yA.toFixed(3)} (vapor fraction V/F = ${(vaporMoleFraction_betaV * 100).toFixed(1)}%).`
    );
  }

  return {
    isValid: validationErrors.length === 0,
    validationErrors,
    advisories,
    xA,
    xB,
    psatA_kPa,
    psatB_kPa,
    psatA_Pa: psatA_kPa * 1000.0,
    psatB_kPa_Pa: psatB_kPa * 1000.0,
    systemPressure_kPa,
    systemPressure_Pa: systemPressure_kPa * 1000.0,
    systemTemperature_K: T_K,
    partialPressureA_kPa,
    partialPressureB_kPa,
    partialPressureA_Pa: partialPressureA_kPa * 1000.0,
    partialPressureB_Pa: partialPressureB_kPa * 1000.0,
    bubblePressure_kPa,
    bubblePressure_Pa: bubblePressure_kPa * 1000.0,
    equilibriumVapor_yA,
    equilibriumVapor_yB,
    dewPressureAtComposition_kPa,
    dewPressureAtComposition_Pa: dewPressureAtComposition_kPa * 1000.0,
    equilibriumLiquidAtDew_xA,
    equilibriumLiquidAtDew_xB,
    relativeVolatility_alphaAB,
    moreVolatileComponent,
    phaseStateAtSystemPressure,
    tieLineLiquid_xA,
    tieLineVapor_yA,
    vaporMoleFraction_betaV,
  };
}

export interface BinaryPxyPoint {
  moleFraction: number; // Composition axis (x_A for bubble curve, y_A for dew curve)
  bubblePressure_kPa: number; // P_bubble(x_A = moleFraction)
  dewPressure_kPa: number; // P_dew(y_A = moleFraction)
  partialPressureA_kPa: number; // p_A = x_A * P_A^sat
  partialPressureB_kPa: number; // p_B = (1 - x_A) * P_B^sat
  equilibriumVapor_yA: number; // y_A*(x_A) for y-x diagram
  diagonal_x: number; // y = x reference line
}

/**
 * Generates the complete isothermal P-x-y, y-x, and partial-pressure curves
 * across moleFraction in [0, 1].
 */
export function generateBinaryPxySeries(
  psatA_kPa: number,
  psatB_kPa: number,
  numPoints: number = 51
): BinaryPxyPoint[] {
  const safeA = psatA_kPa > 0 ? psatA_kPa : 120.0;
  const safeB = psatB_kPa > 0 ? psatB_kPa : 45.0;
  const points: BinaryPxyPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const comp = i / (numPoints - 1);
    const pA = comp * safeA;
    const pB = (1.0 - comp) * safeB;
    const pBubble = pA + pB;
    const invPdew = comp / safeA + (1.0 - comp) / safeB;
    const pDew = invPdew > 0 ? 1.0 / invPdew : pBubble;
    const yEq = pBubble > 0 ? pA / pBubble : comp;

    points.push({
      moleFraction: Number(comp.toFixed(4)),
      bubblePressure_kPa: Number(pBubble.toFixed(3)),
      dewPressure_kPa: Number(pDew.toFixed(3)),
      partialPressureA_kPa: Number(pA.toFixed(3)),
      partialPressureB_kPa: Number(pB.toFixed(3)),
      equilibriumVapor_yA: Number(yEq.toFixed(4)),
      diagonal_x: Number(comp.toFixed(4)),
    });
  }

  return points;
}

// ============================================================================
// SCENARIO PRESETS FOR BOTH MODULES
// ============================================================================

export interface ThermoPVTPreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  expectedObservation: string;
  inputs: PureFluidPVTInputs;
}

export const THERMO_PVT_PRESETS: ThermoPVTPreset[] = [
  {
    id: 'low-pressure-ideal-limit',
    name: 'Low-Pressure Ideal Limit',
    tag: 'CO₂ · 350 K · 1.0 bar',
    description:
      'Carbon dioxide at 350 K and atmospheric pressure (P_r = 0.0136), where intermolecular spacing is large and molecular covolume is negligible.',
    expectedObservation:
      'Z ≈ 0.9964 and Peng–Robinson molar volume matches the ideal gas law within -0.36%.',
    inputs: {
      fluidId: 'CO2',
      temperature_K: 350.0,
      pressure_Pa: 1.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
  },
  {
    id: 'moderate-pressure-real-gas',
    name: 'Moderate-Pressure Real Gas',
    tag: 'CO₂ · 320 K · 60 bar',
    description:
      'Slightly supercritical CO₂ (T_r = 1.052, P_r = 0.813) where long-range attractive forces (aα) pull molecules closer together than an ideal gas.',
    expectedObservation:
      'Compressibility drops to Z ≈ 0.695, reducing true molar volume by 30.5% relative to PV = nRT.',
    inputs: {
      fluidId: 'CO2',
      temperature_K: 320.0,
      pressure_Pa: 60.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
  },
  {
    id: 'high-pressure-non-ideal',
    name: 'High-Pressure Repulsive Departure',
    tag: 'N₂ · 300 K · 250 bar',
    description:
      'High-pressure compressed nitrogen cylinder at room temperature (T_r = 2.377, P_r = 7.362), well above the critical temperature.',
    expectedObservation:
      'Hard-sphere covolume repulsion (v - b) dominates over attraction, driving Z ≈ 1.106 > 1 (+10.6% larger volume than ideal gas).',
    inputs: {
      fluidId: 'N2',
      temperature_K: 300.0,
      pressure_Pa: 250.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
  },
  {
    id: 'near-critical-compression',
    name: 'Near-Critical Compression',
    tag: 'CO₂ · 305 K · 74 bar',
    description:
      'Carbon dioxide operated immediately adjacent to its critical point (T_c = 304.13 K, P_c = 73.77 bar; T_r = 1.003, P_r = 1.003).',
    expectedObservation:
      'Extreme isothermal compressibility and dramatic negative deviation (Z ≈ 0.305, nearly -70% below ideal gas volume).',
    inputs: {
      fluidId: 'CO2',
      temperature_K: 305.0,
      pressure_Pa: 74.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
  },
  {
    id: 'subcritical-multi-root',
    name: 'Subcritical Multi-Root Coexistence',
    tag: 'CO₂ · 280 K · 42 bar',
    description:
      'Subcritical carbon dioxide (T_r = 0.921 < 1, P_r = 0.569) inside the van der Waals / Peng–Robinson three-root loop.',
    expectedObservation:
      'Three real roots appear: vapor-like Z_vapor ≈ 0.659, liquid-like Z_liquid ≈ 0.106, and an unstable spinodal middle root.',
    inputs: {
      fluidId: 'CO2',
      temperature_K: 280.0,
      pressure_Pa: 42.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
  },
];

export interface ThermoVLEPreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  expectedObservation: string;
  inputs: BinaryVLEInputs;
}

export const THERMO_VLE_PRESETS: ThermoVLEPreset[] = [
  {
    id: 'equimolar-ideal-mixture',
    name: 'Equimolar Ideal Binary Mixture',
    tag: 'x_A = 0.50 · α = 2.50',
    description:
      'Equimolar liquid feed (x_A = 0.50) of hypothetical ideal components A (P_A^sat = 125 kPa) and B (P_B^sat = 50 kPa) in two-phase VLE.',
    expectedObservation:
      'Bubble pressure is 87.5 kPa with equilibrium vapor enriched to y_A = 0.714; at P_sys = 80 kPa the mixture splits along a tie-line.',
    inputs: {
      liquidMoleFraction_xA: 0.5,
      psatA_kPa: 125.0,
      psatB_kPa: 50.0,
      systemPressure_kPa: 80.0,
      systemTemperature_K: 350.0,
    },
  },
  {
    id: 'high-volatility-contrast',
    name: 'Wide-Boiling High Volatility Contrast',
    tag: 'x_A = 0.40 · α = 4.50',
    description:
      'Large vapor-pressure ratio (P_A^sat = 180 kPa, P_B^sat = 40 kPa, α_AB = 4.50) creating a wide P-x-y two-phase lens.',
    expectedObservation:
      'Strong vapor enrichment: liquid at x_A = 0.40 generates first bubble vapor at y_A = 0.750, enabling easy stagewise separation.',
    inputs: {
      liquidMoleFraction_xA: 0.4,
      psatA_kPa: 180.0,
      psatB_kPa: 40.0,
      systemPressure_kPa: 85.0,
      systemTemperature_K: 350.0,
    },
  },
  {
    id: 'close-boiling-pinch',
    name: 'Close-Boiling Mixture (Low α)',
    tag: 'x_A = 0.50 · α = 1.15',
    description:
      'Close-boiling ideal components (P_A^sat = 92 kPa, P_B^sat = 80 kPa, α_AB = 1.15) with a narrow P-x-y phase envelope.',
    expectedObservation:
      'Bubble (86.0 kPa) and dew (85.6 kPa) pressures are only 0.4 kPa apart, and y_A = 0.535 barely exceeds x_A = 0.500.',
    inputs: {
      liquidMoleFraction_xA: 0.5,
      psatA_kPa: 92.0,
      psatB_kPa: 80.0,
      systemPressure_kPa: 85.8,
      systemTemperature_K: 350.0,
    },
  },
  {
    id: 'light-component-rich',
    name: 'Light-Component-Rich Mixture',
    tag: 'x_A = 0.85 · Compressed Liquid',
    description:
      'Mixture rich in more-volatile component A (x_A = 0.85, P_A^sat = 140 kPa, P_B^sat = 45 kPa) pressurized above its bubble point.',
    expectedObservation:
      'Because P_sys = 135 kPa exceeds P_bubble = 125.8 kPa, the system exists entirely as a compressed (subcooled) liquid.',
    inputs: {
      liquidMoleFraction_xA: 0.85,
      psatA_kPa: 140.0,
      psatB_kPa: 45.0,
      systemPressure_kPa: 135.0,
      systemTemperature_K: 350.0,
    },
  },
  {
    id: 'equal-volatility-degenerate',
    name: 'Equal-Volatility Limit (α = 1.00)',
    tag: 'P_A^sat = P_B^sat = 100 kPa',
    description:
      'Limiting case where both components have identical pure-component vapor pressures (P_A^sat = P_B^sat = 100 kPa).',
    expectedObservation:
      'P_bubble = P_dew = 100 kPa across all compositions and y_A = x_A everywhere; zero selective enrichment occurs.',
    inputs: {
      liquidMoleFraction_xA: 0.6,
      psatA_kPa: 100.0,
      psatB_kPa: 100.0,
      systemPressure_kPa: 100.0,
      systemTemperature_K: 350.0,
    },
  },
];
