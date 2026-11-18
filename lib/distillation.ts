/**
 * ChemEng Studio — Binary Distillation Calculation Engine (Phase 2.2)
 *
 * Pure TypeScript engineering module implementing the McCabe–Thiele method for
 * steady-state continuous binary fractional distillation under Constant Molar Overflow (CMO)
 * and constant relative volatility (α).
 *
 * Model Assumptions:
 * 1. Binary mixture of a hypothetical light component (A) and heavy component (B).
 * 2. Steady-state continuous operation with one feed (F), one distillate (D), and one bottoms (B).
 * 3. Constant relative volatility (α > 1) across the column (ideal/near-ideal VLE, no azeotropes).
 * 4. Constant Molar Overflow (CMO): equal molar heats of vaporization and negligible heat losses,
 *    making liquid and vapor molar flow rates constant within the rectifying and stripping sections.
 * 5. Ideal equilibrium stages (100% stage efficiency; theoretical equilibrium stages reported).
 * 6. Total condenser (condenses all overhead vapor to saturated liquid at xD; not an equilibrium stage).
 * 7. Partial reboiler (generates boilup vapor in equilibrium with bottoms xB; counted as 1 equilibrium stage).
 * 8. Supported feed thermal conditions: 0 <= q <= 1 (saturated vapor q = 0, partially vaporized 0 < q < 1,
 *    saturated liquid q = 1).
 * 9. No tray hydraulics, weeping/flooding, entrainment, or pressure-drop/temperature profiles.
 */

export type FeasibilityStatus =
  | 'feasible'
  | 'near_minimum_reflux'
  | 'below_minimum_reflux'
  | 'unconverged_pinch'
  | 'invalid_specifications';

export interface DistillationInputs {
  /** Feed molar flow rate F (kmol/h) */
  feedFlow_kmol_h: number;
  /** Feed mole fraction of light component zF (mol/mol, 0 < zF < 1) */
  feedComposition_zF: number;
  /** Distillate mole fraction of light component xD (mol/mol, 0 < xD < 1) */
  distillateComposition_xD: number;
  /** Bottoms mole fraction of light component xB (mol/mol, 0 < xB < 1) */
  bottomsComposition_xB: number;
  /** Constant relative volatility alpha (dimensionless, alpha > 1) */
  relativeVolatility_alpha: number;
  /** External reflux ratio R = L / D (dimensionless, R > 0) */
  refluxRatio_R: number;
  /** Feed thermal quality q (dimensionless, 0 <= q <= 1) */
  feedQuality_q: number;
}

export interface DistillationValidationIssue {
  field?: keyof DistillationInputs | 'separation' | 'reflux' | 'volatility';
  severity: 'error' | 'warning';
  message: string;
}

export interface McCabeThieleStage {
  /** 1-indexed stage number counting top-down from below the total condenser */
  stageNumber: number;
  /** Section where this stage operates ('rectifying', 'feed' for optimal feed stage, or 'stripping') */
  section: 'rectifying' | 'feed' | 'stripping';
  /** Vapor composition entering/leaving stage horizontally y_n */
  y_in: number;
  /** Liquid composition starting horizontal step x_{n-1} (xD for stage 1) */
  x_prev: number;
  /** Equilibrium liquid composition leaving stage n: x_n = x*(y_n) */
  x_eq: number;
  /** Operating line vapor composition below stage n: y_{n+1} (or x_n on final stage) */
  y_next: number;
  /** Fractional completion of this stage toward reaching xB (1.0 for all stages except the final stage) */
  stageEfficiencyFraction: number;
}

export interface StaircasePoint {
  x: number;
  y: number;
  stageNumber: number;
  pointType: 'start' | 'equilibrium' | 'operating';
}

export interface DistillationCurvePoint {
  x: number;
  diagonal_y: number;
  equilibrium_y: number;
  rectifying_y: number | null;
  stripping_y: number | null;
  qLine_y: number | null;
}

export interface DistillationResults {
  isValid: boolean;
  feasibilityStatus: FeasibilityStatus;
  feasibilityLabel: string;
  validationIssues: DistillationValidationIssue[];

  /** Overall & component material balance results */
  materialBalance: {
    feedFlow_kmol_h: number;
    distillateFlow_kmol_h: number;
    bottomsFlow_kmol_h: number;
    lightComponentInFeed_kmol_h: number;
    lightComponentInDistillate_kmol_h: number;
    lightComponentInBottoms_kmol_h: number;
    lightRecoveryInDistillate_pct: number;
    totalBalanceResidual_kmol_h: number;
    componentBalanceResidual_kmol_h: number;
    isBalanced: boolean;
  };

  /** Internal column section molar flows under Constant Molar Overflow (kmol/h) */
  internalFlows: {
    rectifyingLiquid_L_kmol_h: number;
    rectifyingVapor_V_kmol_h: number;
    strippingLiquid_Lbar_kmol_h: number;
    strippingVapor_Vbar_kmol_h: number;
    boilupRatio_Vb: number;
  };

  /** Operating lines & q-line geometry */
  operatingLines: {
    rectifyingSlope: number;
    rectifyingIntercept: number;
    strippingSlope: number;
    strippingIntercept: number;
    qLineIsVertical: boolean;
    qLineIsHorizontal: boolean;
    qLineSlope: number | null;
    qLineIntercept: number | null;
    feedRegimeLabel: string;
    intersection_x: number;
    intersection_y: number;
    equilibriumAtIntersection_y: number;
  };

  /** Minimum reflux, Fenske minimum stages, and pinch point */
  minimumReflux: {
    isSupported: boolean;
    minimumRefluxRatio_Rmin: number | null;
    operatingToMinRefluxRatio: number | null;
    pinch_x: number | null;
    pinch_y: number | null;
    fenskeMinimumStages_Nmin: number | null;
  };

  /** McCabe-Thiele stage stepping results */
  stageCalculation: {
    isFeasible: boolean;
    converged: boolean;
    /** Integer theoretical equilibrium stages (including partial reboiler) */
    totalTheoreticalStages: number | null;
    /** Theoretical column trays (excluding partial reboiler) */
    columnTheoreticalTrays: number | null;
    /** Exact fractional theoretical stage requirement */
    fractionalTheoreticalStages: number | null;
    /** Optimal feed stage number (counting from top = 1) */
    feedStageNumber: number | null;
    rectifyingStageCount: number | null;
    strippingStageCount: number | null;
    stages: McCabeThieleStage[];
    staircasePath: StaircasePoint[];
    terminationReason: string;
  };
}

export interface DistillationPreset {
  id: string;
  label: string;
  description: string;
  inputs: DistillationInputs;
}

export const MAX_SAFEGUARD_STAGES = 120;

export const DEFAULT_DISTILLATION_INPUTS: DistillationInputs = {
  feedFlow_kmol_h: 100.0,
  feedComposition_zF: 0.5,
  distillateComposition_xD: 0.95,
  bottomsComposition_xB: 0.05,
  relativeVolatility_alpha: 2.5,
  refluxRatio_R: 2.0,
  feedQuality_q: 1.0,
};

export const DISTILLATION_PRESETS: DistillationPreset[] = [
  {
    id: 'baseline-moderate-alpha',
    label: 'Baseline — Moderate Volatility (α = 2.5, q = 1.0)',
    description:
      'Standard binary separation (zF = 0.50 → xD = 0.95, xB = 0.05) with saturated liquid feed (q = 1.0) and R = 2.00 (1.82× Rmin).',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.95,
      bottomsComposition_xB: 0.05,
      relativeVolatility_alpha: 2.5,
      refluxRatio_R: 2.0,
      feedQuality_q: 1.0,
    },
  },
  {
    id: 'high-volatility-easy',
    label: 'High Relative Volatility (α = 4.0, Easy Separation)',
    description:
      'Wide vapor–liquid equilibrium loop (α = 4.0) requiring fewer equilibrium stages and a lower minimum reflux ratio.',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.95,
      bottomsComposition_xB: 0.05,
      relativeVolatility_alpha: 4.0,
      refluxRatio_R: 1.5,
      feedQuality_q: 1.0,
    },
  },
  {
    id: 'low-volatility-difficult',
    label: 'Low Relative Volatility (α = 1.50, Difficult Separation)',
    description:
      'Close-boiling binary pair (α = 1.50) where the equilibrium curve hugs the x = y diagonal, demanding high reflux and many stages.',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.92,
      bottomsComposition_xB: 0.08,
      relativeVolatility_alpha: 1.5,
      refluxRatio_R: 4.2,
      feedQuality_q: 1.0,
    },
  },
  {
    id: 'high-reflux-operation',
    label: 'High Reflux Ratio (R = 5.0, Near Total-Reflux Limit)',
    description:
      'Operating lines pull close to the x = y diagonal, reducing theoretical stage count toward the Fenske minimum Nmin at the expense of high reboiler/condenser duty.',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.95,
      bottomsComposition_xB: 0.05,
      relativeVolatility_alpha: 2.5,
      refluxRatio_R: 5.0,
      feedQuality_q: 1.0,
    },
  },
  {
    id: 'near-minimum-reflux',
    label: 'Near-Minimum Reflux Ratio (R = 1.25 vs. Rmin = 1.100)',
    description:
      'Demonstrates stage crowding (pinch zone) near the feed intersection when operating at only 1.14× Rmin.',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.95,
      bottomsComposition_xB: 0.05,
      relativeVolatility_alpha: 2.5,
      refluxRatio_R: 1.25,
      feedQuality_q: 1.0,
    },
  },
  {
    id: 'partially-vaporized-feed',
    label: 'Partially Vaporized Two-Phase Feed (q = 0.50)',
    description:
      '50% liquid / 50% vapor feed produces a q-line with slope −1.0, shifting the feed intersection leftward and increasing Rmin.',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.95,
      bottomsComposition_xB: 0.05,
      relativeVolatility_alpha: 2.5,
      refluxRatio_R: 2.4,
      feedQuality_q: 0.5,
    },
  },
  {
    id: 'saturated-vapor-feed',
    label: 'Saturated Vapor Feed (q = 0.00, Dew-Point Feed)',
    description:
      'All-vapor feed produces a horizontal q-line (y = zF = 0.50), adding feed directly to the rectifying vapor stream.',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.95,
      bottomsComposition_xB: 0.05,
      relativeVolatility_alpha: 2.5,
      refluxRatio_R: 2.8,
      feedQuality_q: 0.0,
    },
  },
  {
    id: 'infeasible-below-rmin',
    label: 'Infeasible Case — Below Minimum Reflux (R = 0.95 < Rmin)',
    description:
      'Intentionally demonstrates a pinched/infeasible specification where operating lines cross the equilibrium curve and separation cannot be achieved with any finite number of stages.',
    inputs: {
      feedFlow_kmol_h: 100.0,
      feedComposition_zF: 0.5,
      distillateComposition_xD: 0.95,
      bottomsComposition_xB: 0.05,
      relativeVolatility_alpha: 2.5,
      refluxRatio_R: 0.95,
      feedQuality_q: 1.0,
    },
  },
];

/**
 * Forward Vapor-Liquid Equilibrium (VLE):
 * y* = (alpha * x) / (1 + (alpha - 1) * x)
 */
export function equilibriumVaporY(x: number, alpha: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const denom = 1 + (alpha - 1) * x;
  if (denom <= 0) return 0;
  return (alpha * x) / denom;
}

/**
 * Analytical Inverse Vapor-Liquid Equilibrium (VLE):
 * x* = y / (alpha - (alpha - 1) * y)
 */
export function equilibriumLiquidX(y: number, alpha: number): number {
  if (y <= 0) return 0;
  if (y >= 1) return 1;
  const denom = alpha - (alpha - 1) * y;
  if (denom <= 0) return 1;
  return y / denom;
}

/**
 * Fenske equation for minimum theoretical equilibrium stages at total reflux (R -> infinity):
 * N_min = ln[(xD / (1 - xD)) * ((1 - xB) / xB)] / ln(alpha)
 */
export function calculateFenskeMinimumStages(
  xD: number,
  xB: number,
  alpha: number
): number | null {
  if (xB <= 0 || xB >= 1 || xD <= 0 || xD >= 1 || xD <= xB || alpha <= 1) {
    return null;
  }
  const separationFactor = (xD / (1 - xD)) * ((1 - xB) / xB);
  const lnAlpha = Math.log(alpha);
  if (separationFactor <= 1 || lnAlpha <= 1e-12) {
    return null;
  }
  return Math.log(separationFactor) / lnAlpha;
}

/**
 * Analytical pinch-point and minimum reflux ratio R_min calculation for
 * constant-relative-volatility binary mixtures with 0 <= q <= 1.
 *
 * Solves the exact intersection of the q-line:
 *   q * x + (1 - q) * y = zF
 * with the constant-volatility VLE curve:
 *   y = (alpha * x) / [1 + (alpha - 1) * x]
 */
export function calculateMinimumReflux(
  zF: number,
  xD: number,
  alpha: number,
  q: number
): {
  isSupported: boolean;
  pinch_x: number | null;
  pinch_y: number | null;
  minimumRefluxRatio_Rmin: number | null;
} {
  if (
    !Number.isFinite(zF) ||
    !Number.isFinite(xD) ||
    !Number.isFinite(alpha) ||
    !Number.isFinite(q) ||
    alpha <= 1 ||
    zF <= 0 ||
    zF >= 1 ||
    xD <= zF ||
    xD >= 1 ||
    q < -1e-9 ||
    q > 1 + 1e-9
  ) {
    return {
      isSupported: false,
      pinch_x: null,
      pinch_y: null,
      minimumRefluxRatio_Rmin: null,
    };
  }

  const clampedQ = Math.max(0, Math.min(1, q));
  let xPinch: number;

  if (Math.abs(clampedQ - 1) < 1e-9) {
    // Saturated liquid feed: vertical q-line x = zF
    xPinch = zF;
  } else if (clampedQ < 1e-9) {
    // Saturated vapor feed: horizontal q-line y = zF
    xPinch = equilibriumLiquidX(zF, alpha);
  } else {
    // Partially vaporized feed (0 < q < 1):
    // Quadratic: a * x^2 + b * x + c = 0
    const a = clampedQ * (alpha - 1);
    const b = clampedQ + alpha * (1 - clampedQ) - zF * (alpha - 1);
    const c = -zF;
    const discriminant = Math.max(0, b * b - 4 * a * c);
    xPinch = (-b + Math.sqrt(discriminant)) / (2 * a);
  }

  const yPinch = equilibriumVaporY(xPinch, alpha);

  if (yPinch <= xPinch + 1e-9) {
    return {
      isSupported: false,
      pinch_x: xPinch,
      pinch_y: yPinch,
      minimumRefluxRatio_Rmin: null,
    };
  }

  // If desired xD is already at or below the pinch vapor composition yPinch,
  // R_min approaches 0 (feed vapor already satisfies distillate purity).
  if (xD <= yPinch) {
    return {
      isSupported: true,
      pinch_x: xPinch,
      pinch_y: yPinch,
      minimumRefluxRatio_Rmin: 0,
    };
  }

  const rMin = (xD - yPinch) / (yPinch - xPinch);
  return {
    isSupported: true,
    pinch_x: xPinch,
    pinch_y: yPinch,
    minimumRefluxRatio_Rmin: Math.max(0, rMin),
  };
}

/**
 * Validates simulation inputs and returns structured errors and engineering advisories.
 */
export function validateDistillationInputs(
  inputs: DistillationInputs
): DistillationValidationIssue[] {
  const issues: DistillationValidationIssue[] = [];

  if (!Number.isFinite(inputs.feedFlow_kmol_h) || inputs.feedFlow_kmol_h <= 0) {
    issues.push({
      field: 'feedFlow_kmol_h',
      severity: 'error',
      message: 'Feed molar flow rate (F) must be strictly positive (> 0 kmol/h).',
    });
  }

  if (
    !Number.isFinite(inputs.feedComposition_zF) ||
    inputs.feedComposition_zF <= 0 ||
    inputs.feedComposition_zF >= 1
  ) {
    issues.push({
      field: 'feedComposition_zF',
      severity: 'error',
      message: 'Feed composition (zF) must lie strictly between 0 and 1 (0 < zF < 1).',
    });
  }

  if (
    !Number.isFinite(inputs.distillateComposition_xD) ||
    inputs.distillateComposition_xD <= 0 ||
    inputs.distillateComposition_xD >= 1
  ) {
    issues.push({
      field: 'distillateComposition_xD',
      severity: 'error',
      message: 'Distillate composition (xD) must lie strictly between 0 and 1 (0 < xD < 1).',
    });
  }

  if (
    !Number.isFinite(inputs.bottomsComposition_xB) ||
    inputs.bottomsComposition_xB <= 0 ||
    inputs.bottomsComposition_xB >= 1
  ) {
    issues.push({
      field: 'bottomsComposition_xB',
      severity: 'error',
      message: 'Bottoms composition (xB) must lie strictly between 0 and 1 (0 < xB < 1).',
    });
  }

  // Check normal separation ordering: 0 < xB < zF < xD < 1
  if (
    inputs.bottomsComposition_xB > 0 &&
    inputs.feedComposition_zF > 0 &&
    inputs.distillateComposition_xD < 1
  ) {
    if (inputs.bottomsComposition_xB >= inputs.feedComposition_zF) {
      issues.push({
        field: 'separation',
        severity: 'error',
        message: `Invalid composition ordering: Bottoms composition (xB = ${inputs.bottomsComposition_xB.toFixed(3)}) must be strictly less than feed composition (zF = ${inputs.feedComposition_zF.toFixed(3)}).`,
      });
    }
    if (inputs.feedComposition_zF >= inputs.distillateComposition_xD) {
      issues.push({
        field: 'separation',
        severity: 'error',
        message: `Invalid composition ordering: Feed composition (zF = ${inputs.feedComposition_zF.toFixed(3)}) must be strictly less than distillate composition (xD = ${inputs.distillateComposition_xD.toFixed(3)}).`,
      });
    }
  }

  if (
    !Number.isFinite(inputs.relativeVolatility_alpha) ||
    inputs.relativeVolatility_alpha <= 1
  ) {
    issues.push({
      field: 'relativeVolatility_alpha',
      severity: 'error',
      message:
        'Relative volatility (α) must be strictly greater than 1.0 for Component A to be more volatile than Component B.',
    });
  } else if (inputs.relativeVolatility_alpha <= 1.25) {
    issues.push({
      field: 'volatility',
      severity: 'warning',
      message: `Close-boiling system advisory (α = ${inputs.relativeVolatility_alpha.toFixed(2)}): As α approaches 1.0, vapor and liquid compositions become nearly identical, requiring very high reflux ratios and large stage counts.`,
    });
  }

  if (!Number.isFinite(inputs.refluxRatio_R) || inputs.refluxRatio_R <= 0) {
    issues.push({
      field: 'refluxRatio_R',
      severity: 'error',
      message: 'Reflux ratio (R = L/D) must be strictly positive (R > 0).',
    });
  }

  if (
    !Number.isFinite(inputs.feedQuality_q) ||
    inputs.feedQuality_q < 0 ||
    inputs.feedQuality_q > 1
  ) {
    issues.push({
      field: 'feedQuality_q',
      severity: 'error',
      message:
        'Feed thermal quality (q) in this simulator is supported from q = 0.0 (saturated vapor) to q = 1.0 (saturated liquid).',
    });
  }

  return issues;
}

/**
 * Executes the complete binary distillation calculation:
 * 1. Input validation & composition ordering
 * 2. Overall & component material balances (F, D, B)
 * 3. Constant Molar Overflow section flows (L, V, L_bar, V_bar)
 * 4. Rectifying line, q-line, intersection point, and stripping line
 * 5. Minimum reflux ratio (R_min), pinch point, and Fenske minimum stages (N_min)
 * 6. Deterministic McCabe-Thiele stage-by-stage equilibrium stepping
 */
export function calculateDistillation(inputs: DistillationInputs): DistillationResults {
  const validationIssues = validateDistillationInputs(inputs);
  const hasErrors = validationIssues.some((issue) => issue.severity === 'error');

  if (hasErrors) {
    return {
      isValid: false,
      feasibilityStatus: 'invalid_specifications',
      feasibilityLabel: 'Invalid Operating Specifications',
      validationIssues,
      materialBalance: {
        feedFlow_kmol_h: 0,
        distillateFlow_kmol_h: 0,
        bottomsFlow_kmol_h: 0,
        lightComponentInFeed_kmol_h: 0,
        lightComponentInDistillate_kmol_h: 0,
        lightComponentInBottoms_kmol_h: 0,
        lightRecoveryInDistillate_pct: 0,
        totalBalanceResidual_kmol_h: 0,
        componentBalanceResidual_kmol_h: 0,
        isBalanced: false,
      },
      internalFlows: {
        rectifyingLiquid_L_kmol_h: 0,
        rectifyingVapor_V_kmol_h: 0,
        strippingLiquid_Lbar_kmol_h: 0,
        strippingVapor_Vbar_kmol_h: 0,
        boilupRatio_Vb: 0,
      },
      operatingLines: {
        rectifyingSlope: 0,
        rectifyingIntercept: 0,
        strippingSlope: 0,
        strippingIntercept: 0,
        qLineIsVertical: true,
        qLineIsHorizontal: false,
        qLineSlope: null,
        qLineIntercept: null,
        feedRegimeLabel: 'Invalid',
        intersection_x: 0,
        intersection_y: 0,
        equilibriumAtIntersection_y: 0,
      },
      minimumReflux: {
        isSupported: false,
        minimumRefluxRatio_Rmin: null,
        operatingToMinRefluxRatio: null,
        pinch_x: null,
        pinch_y: null,
        fenskeMinimumStages_Nmin: null,
      },
      stageCalculation: {
        isFeasible: false,
        converged: false,
        totalTheoreticalStages: null,
        columnTheoreticalTrays: null,
        fractionalTheoreticalStages: null,
        feedStageNumber: null,
        rectifyingStageCount: null,
        strippingStageCount: null,
        stages: [],
        staircasePath: [],
        terminationReason: 'Resolve input validation errors to run McCabe–Thiele simulation.',
      },
    };
  }

  const F = inputs.feedFlow_kmol_h;
  const zF = inputs.feedComposition_zF;
  const xD = inputs.distillateComposition_xD;
  const xB = inputs.bottomsComposition_xB;
  const alpha = inputs.relativeVolatility_alpha;
  const R = inputs.refluxRatio_R;
  const q = inputs.feedQuality_q;

  // 1. Overall & Component Material Balances
  const D = (F * (zF - xB)) / (xD - xB);
  const B = F - D;
  const lightInFeed = F * zF;
  const lightInDistillate = D * xD;
  const lightInBottoms = B * xB;
  const totalResidual = Math.abs(F - (D + B));
  const componentResidual = Math.abs(lightInFeed - (lightInDistillate + lightInBottoms));
  const lightRecovery_pct = lightInFeed > 0 ? (lightInDistillate / lightInFeed) * 100 : 0;

  // 2. Internal Section Molar Flows (Constant Molar Overflow)
  const L = R * D;
  const V = (R + 1) * D;
  const Lbar = L + q * F;
  const Vbar = V - (1 - q) * F;
  const boilupRatio_Vb = B > 0 ? Vbar / B : 0;

  // 3. Rectifying Operating Line: y = [R/(R+1)]*x + xD/(R+1)
  const rectSlope = R / (R + 1);
  const rectIntercept = xD / (R + 1);

  // 4. Feed Condition & q-Line Geometry
  const qLineIsVertical = Math.abs(q - 1) < 1e-9;
  const qLineIsHorizontal = Math.abs(q) < 1e-9;
  const qLineSlope = qLineIsVertical ? null : qLineIsHorizontal ? 0 : q / (q - 1);
  const qLineIntercept = qLineIsVertical ? null : qLineIsHorizontal ? zF : -zF / (q - 1);

  const feedRegimeLabel = qLineIsVertical
    ? 'Saturated Liquid (q = 1.00)'
    : qLineIsHorizontal
    ? 'Saturated Vapor (q = 0.00)'
    : `Partially Vaporized Two-Phase (q = ${q.toFixed(2)})`;

  // Exact singularity-free intersection of ROL and q-line:
  // x_int = [(R + 1)*zF - (1 - q)*xD] / (R + q)
  // y_int = (R*zF + q*xD) / (R + q)
  const intersection_x = ((R + 1) * zF - (1 - q) * xD) / (R + q);
  const intersection_y = (R * zF + q * xD) / (R + q);
  const equilibriumAtIntersection_y = equilibriumVaporY(intersection_x, alpha);

  // 5. Stripping Operating Line through (xB, xB) and (intersection_x, intersection_y)
  const stripSlope =
    Math.abs(intersection_x - xB) > 1e-12
      ? (intersection_y - xB) / (intersection_x - xB)
      : Lbar / Math.max(Vbar, 1e-9);
  const stripIntercept = xB * (1 - stripSlope);

  // 6. Minimum Reflux Ratio & Fenske Minimum Stages
  const minRefluxData = calculateMinimumReflux(zF, xD, alpha, q);
  const fenskeNmin = calculateFenskeMinimumStages(xD, xB, alpha);
  const rMin = minRefluxData.minimumRefluxRatio_Rmin;
  const rRatio = rMin !== null && rMin > 0 ? R / rMin : null;

  // 7. Check Separation Feasibility & Pinch Conditions before/during Stage Stepping
  const isBelowMinReflux =
    (rMin !== null && R <= rMin * (1 + 1e-6)) ||
    intersection_y >= equilibriumAtIntersection_y - 1e-7 ||
    intersection_x <= xB + 1e-7 ||
    Vbar <= 0;

  if (isBelowMinReflux) {
    const rMinText = rMin !== null ? `Rmin = ${rMin.toFixed(3)}` : 'minimum reflux';
    validationIssues.push({
      field: 'reflux',
      severity: 'warning',
      message: `Infeasible Separation (Pinch Condition): Operating reflux ratio (R = ${R.toFixed(2)}) is at or below ${rMinText}. The operating lines intersect at or above the vapor–liquid equilibrium curve (y_int = ${intersection_y.toFixed(3)} >= y*(x_int) = ${equilibriumAtIntersection_y.toFixed(3)}), requiring an infinite number of stages.`,
    });

    return {
      isValid: true,
      feasibilityStatus: 'below_minimum_reflux',
      feasibilityLabel: 'Infeasible — Below Minimum Reflux (Pinched)',
      validationIssues,
      materialBalance: {
        feedFlow_kmol_h: F,
        distillateFlow_kmol_h: D,
        bottomsFlow_kmol_h: B,
        lightComponentInFeed_kmol_h: lightInFeed,
        lightComponentInDistillate_kmol_h: lightInDistillate,
        lightComponentInBottoms_kmol_h: lightInBottoms,
        lightRecoveryInDistillate_pct: lightRecovery_pct,
        totalBalanceResidual_kmol_h: totalResidual,
        componentBalanceResidual_kmol_h: componentResidual,
        isBalanced: totalResidual < 1e-7 && componentResidual < 1e-7,
      },
      internalFlows: {
        rectifyingLiquid_L_kmol_h: L,
        rectifyingVapor_V_kmol_h: V,
        strippingLiquid_Lbar_kmol_h: Lbar,
        strippingVapor_Vbar_kmol_h: Vbar,
        boilupRatio_Vb,
      },
      operatingLines: {
        rectifyingSlope: rectSlope,
        rectifyingIntercept: rectIntercept,
        strippingSlope: stripSlope,
        strippingIntercept: stripIntercept,
        qLineIsVertical,
        qLineIsHorizontal,
        qLineSlope,
        qLineIntercept,
        feedRegimeLabel,
        intersection_x,
        intersection_y,
        equilibriumAtIntersection_y,
      },
      minimumReflux: {
        isSupported: minRefluxData.isSupported,
        minimumRefluxRatio_Rmin: rMin,
        operatingToMinRefluxRatio: rRatio,
        pinch_x: minRefluxData.pinch_x,
        pinch_y: minRefluxData.pinch_y,
        fenskeMinimumStages_Nmin: fenskeNmin,
      },
      stageCalculation: {
        isFeasible: false,
        converged: false,
        totalTheoreticalStages: null,
        columnTheoreticalTrays: null,
        fractionalTheoreticalStages: null,
        feedStageNumber: null,
        rectifyingStageCount: null,
        strippingStageCount: null,
        stages: [],
        staircasePath: [],
        terminationReason: `Reflux ratio R = ${R.toFixed(2)} is below ${rMinText}. Operating lines cross the equilibrium curve (infinite stages required).`,
      },
    };
  }

  // 8. Deterministic McCabe-Thiele Equilibrium Stage Stepping
  const stages: McCabeThieleStage[] = [];
  const staircasePath: StaircasePoint[] = [
    {
      x: xD,
      y: xD,
      stageNumber: 1,
      pointType: 'start',
    },
  ];

  let currentY = xD;
  let prevX = xD;
  let feedStageNumber: number | null = null;
  let converged = false;
  let fractionalTheoreticalStages: number | null = null;
  let terminationReason = '';

  for (let n = 1; n <= MAX_SAFEGUARD_STAGES; n++) {
    // Horizontal step to equilibrium curve: x_n = x*(y_n)
    const xEq = equilibriumLiquidX(currentY, alpha);

    // Numerical pinch safeguard: if horizontal step makes negligible progress
    if (prevX - xEq < 1e-6) {
      terminationReason = `Numerical pinch encountered at stage ${n} (x = ${xEq.toFixed(4)}). Increase reflux ratio R or relative volatility α.`;
      break;
    }

    staircasePath.push({
      x: xEq,
      y: currentY,
      stageNumber: n,
      pointType: 'equilibrium',
    });

    // Determine active section & optimal feed-stage switch
    let section: 'rectifying' | 'feed' | 'stripping';
    if (xEq > intersection_x) {
      section = 'rectifying';
    } else if (feedStageNumber === null) {
      feedStageNumber = n;
      section = 'feed';
    } else {
      section = 'stripping';
    }

    // Check if bottoms specification xB is reached on this stage
    if (xEq <= xB + 1e-12) {
      const stageFraction =
        prevX > xEq ? Math.max(0, Math.min(1, (prevX - xB) / (prevX - xEq))) : 1;

      stages.push({
        stageNumber: n,
        section,
        y_in: currentY,
        x_prev: prevX,
        x_eq: xEq,
        y_next: xEq,
        stageEfficiencyFraction: stageFraction,
      });

      staircasePath.push({
        x: xEq,
        y: xEq,
        stageNumber: n,
        pointType: 'operating',
      });

      fractionalTheoreticalStages = n - 1 + stageFraction;
      converged = true;
      terminationReason = `Converged in ${n} graphical equilibrium steps (${fractionalTheoreticalStages.toFixed(2)} fractional stages) with optimal feed at stage ${feedStageNumber}.`;
      break;
    }

    // Vertical step to appropriate operating line
    const yNext =
      xEq > intersection_x
        ? rectSlope * xEq + rectIntercept
        : stripSlope * xEq + stripIntercept;

    stages.push({
      stageNumber: n,
      section,
      y_in: currentY,
      x_prev: prevX,
      x_eq: xEq,
      y_next: yNext,
      stageEfficiencyFraction: 1.0,
    });

    staircasePath.push({
      x: xEq,
      y: yNext,
      stageNumber: n,
      pointType: 'operating',
    });

    prevX = xEq;
    currentY = yNext;
  }

  if (!converged && !terminationReason) {
    terminationReason = `Exceeded numerical safeguard limit of ${MAX_SAFEGUARD_STAGES} equilibrium stages without reaching xB = ${xB.toFixed(3)}. Increase R or α, or relax product purities.`;
  }

  if (!converged) {
    validationIssues.push({
      field: 'reflux',
      severity: 'warning',
      message: terminationReason,
    });

    return {
      isValid: true,
      feasibilityStatus: 'unconverged_pinch',
      feasibilityLabel: `Unconverged (> ${MAX_SAFEGUARD_STAGES} Stages Required)`,
      validationIssues,
      materialBalance: {
        feedFlow_kmol_h: F,
        distillateFlow_kmol_h: D,
        bottomsFlow_kmol_h: B,
        lightComponentInFeed_kmol_h: lightInFeed,
        lightComponentInDistillate_kmol_h: lightInDistillate,
        lightComponentInBottoms_kmol_h: lightInBottoms,
        lightRecoveryInDistillate_pct: lightRecovery_pct,
        totalBalanceResidual_kmol_h: totalResidual,
        componentBalanceResidual_kmol_h: componentResidual,
        isBalanced: totalResidual < 1e-7 && componentResidual < 1e-7,
      },
      internalFlows: {
        rectifyingLiquid_L_kmol_h: L,
        rectifyingVapor_V_kmol_h: V,
        strippingLiquid_Lbar_kmol_h: Lbar,
        strippingVapor_Vbar_kmol_h: Vbar,
        boilupRatio_Vb,
      },
      operatingLines: {
        rectifyingSlope: rectSlope,
        rectifyingIntercept: rectIntercept,
        strippingSlope: stripSlope,
        strippingIntercept: stripIntercept,
        qLineIsVertical,
        qLineIsHorizontal,
        qLineSlope,
        qLineIntercept,
        feedRegimeLabel,
        intersection_x,
        intersection_y,
        equilibriumAtIntersection_y,
      },
      minimumReflux: {
        isSupported: minRefluxData.isSupported,
        minimumRefluxRatio_Rmin: rMin,
        operatingToMinRefluxRatio: rRatio,
        pinch_x: minRefluxData.pinch_x,
        pinch_y: minRefluxData.pinch_y,
        fenskeMinimumStages_Nmin: fenskeNmin,
      },
      stageCalculation: {
        isFeasible: false,
        converged: false,
        totalTheoreticalStages: null,
        columnTheoreticalTrays: null,
        fractionalTheoreticalStages: null,
        feedStageNumber: null,
        rectifyingStageCount: null,
        strippingStageCount: null,
        stages: [],
        staircasePath: [],
        terminationReason,
      },
    };
  }

  const totalStages = stages.length;
  const columnTrays = Math.max(0, totalStages - 1);
  const resolvedFeedStage = feedStageNumber ?? totalStages;
  // Number of stages strictly above the feed stage in the rectifying section
  const rectifyingStageCount = Math.max(0, resolvedFeedStage - 1);
  // Number of stages from feed stage downward (including feed stage and partial reboiler)
  const strippingStageCount = totalStages - rectifyingStageCount;

  const isNearMinimumReflux = rRatio !== null && rRatio <= 1.15;
  if (isNearMinimumReflux && rMin !== null) {
    validationIssues.push({
      field: 'reflux',
      severity: 'warning',
      message: `Near-Minimum Reflux Advisory: Operating reflux ratio R = ${R.toFixed(2)} is only ${rRatio.toFixed(2)}× Rmin (${rMin.toFixed(3)}). Notice the tight stage crowding near the feed intersection (x_int = ${intersection_x.toFixed(3)}); industrial columns typically operate at 1.2× to 1.5× Rmin to balance capital and energy costs.`,
    });
  }

  return {
    isValid: true,
    feasibilityStatus: isNearMinimumReflux ? 'near_minimum_reflux' : 'feasible',
    feasibilityLabel: isNearMinimumReflux
      ? `Feasible — Near Minimum Reflux (${(rRatio ?? 1).toFixed(2)}× Rmin)`
      : `Feasible Separation (${(rRatio ?? 1).toFixed(2)}× Rmin)`,
    validationIssues,
    materialBalance: {
      feedFlow_kmol_h: F,
      distillateFlow_kmol_h: D,
      bottomsFlow_kmol_h: B,
      lightComponentInFeed_kmol_h: lightInFeed,
      lightComponentInDistillate_kmol_h: lightInDistillate,
      lightComponentInBottoms_kmol_h: lightInBottoms,
      lightRecoveryInDistillate_pct: lightRecovery_pct,
      totalBalanceResidual_kmol_h: totalResidual,
      componentBalanceResidual_kmol_h: componentResidual,
      isBalanced: totalResidual < 1e-7 && componentResidual < 1e-7,
    },
    internalFlows: {
      rectifyingLiquid_L_kmol_h: L,
      rectifyingVapor_V_kmol_h: V,
      strippingLiquid_Lbar_kmol_h: Lbar,
      strippingVapor_Vbar_kmol_h: Vbar,
      boilupRatio_Vb,
    },
    operatingLines: {
      rectifyingSlope: rectSlope,
      rectifyingIntercept: rectIntercept,
      strippingSlope: stripSlope,
      strippingIntercept: stripIntercept,
      qLineIsVertical,
      qLineIsHorizontal,
      qLineSlope,
      qLineIntercept,
      feedRegimeLabel,
      intersection_x,
      intersection_y,
      equilibriumAtIntersection_y,
    },
    minimumReflux: {
      isSupported: minRefluxData.isSupported,
      minimumRefluxRatio_Rmin: rMin,
      operatingToMinRefluxRatio: rRatio,
      pinch_x: minRefluxData.pinch_x,
      pinch_y: minRefluxData.pinch_y,
      fenskeMinimumStages_Nmin: fenskeNmin,
    },
    stageCalculation: {
      isFeasible: true,
      converged: true,
      totalTheoreticalStages: totalStages,
      columnTheoreticalTrays: columnTrays,
      fractionalTheoreticalStages,
      feedStageNumber: resolvedFeedStage,
      rectifyingStageCount,
      strippingStageCount,
      stages,
      staircasePath,
      terminationReason,
    },
  };
}

/**
 * Generates the x-y grid for the McCabe–Thiele diagram (x from 0 to 1),
 * including exact break points at xB, intersection_x, zF, and xD so operating lines
 * and the q-line render with crisp geometric endpoints.
 */
export function generateMcCabeThieleDiagramData(
  inputs: DistillationInputs,
  results: DistillationResults,
  numBasePoints = 101
): DistillationCurvePoint[] {
  if (!results.isValid) return [];

  const alpha = inputs.relativeVolatility_alpha;
  const xB = inputs.bottomsComposition_xB;
  const zF = inputs.feedComposition_zF;
  const xD = inputs.distillateComposition_xD;
  const {
    rectifyingSlope,
    rectifyingIntercept,
    strippingSlope,
    strippingIntercept,
    qLineIsVertical,
    qLineIsHorizontal,
    qLineSlope,
    qLineIntercept,
    intersection_x,
  } = results.operatingLines;

  // Build sorted set of x coordinates including critical anchors
  const xSet = new Set<number>();
  for (let i = 0; i < numBasePoints; i++) {
    xSet.add(Number((i / (numBasePoints - 1)).toFixed(5)));
  }
  const criticalX = [xB, zF, xD, intersection_x];
  if (results.minimumReflux.pinch_x !== null) {
    criticalX.push(results.minimumReflux.pinch_x);
  }
  for (const val of criticalX) {
    if (Number.isFinite(val) && val >= 0 && val <= 1) {
      xSet.add(Number(val.toFixed(5)));
    }
  }

  const sortedX = Array.from(xSet).sort((a, b) => a - b);

  // Determine x bounds for plotting the non-vertical q-line segment
  const qMinX = Math.max(0, Math.min(zF, intersection_x, results.minimumReflux.pinch_x ?? zF));
  const qMaxX = Math.min(1, Math.max(zF, intersection_x));

  return sortedX.map((x) => {
    const eqY = equilibriumVaporY(x, alpha);

    // Rectifying line active from intersection_x to xD
    const clampedIntersectionX = Math.max(0, Math.min(1, intersection_x));
    const rectY =
      x >= clampedIntersectionX - 1e-4 && x <= xD + 1e-4
        ? rectifyingSlope * x + rectifyingIntercept
        : null;

    // Stripping line active from xB to intersection_x
    const stripY =
      x >= xB - 1e-4 && x <= clampedIntersectionX + 1e-4 && intersection_x > xB
        ? strippingSlope * x + strippingIntercept
        : null;

    // Non-vertical q-line active between qMinX and qMaxX
    let qY: number | null = null;
    if (!qLineIsVertical && x >= qMinX - 1e-4 && x <= qMaxX + 1e-4) {
      if (qLineIsHorizontal) {
        qY = zF;
      } else if (qLineSlope !== null && qLineIntercept !== null) {
        const rawQy = qLineSlope * x + qLineIntercept;
        if (rawQy >= 0 && rawQy <= 1) {
          qY = rawQy;
        }
      }
    }

    return {
      x,
      diagonal_y: x,
      equilibrium_y: Number(eqY.toFixed(5)),
      rectifying_y: rectY !== null ? Number(rectY.toFixed(5)) : null,
      stripping_y: stripY !== null ? Number(stripY.toFixed(5)) : null,
      qLine_y: qY !== null ? Number(qY.toFixed(5)) : null,
    };
  });
}

/**
 * Secondary Chart 1: Vapor-Liquid Equilibrium curves across multiple relative volatilities (alpha),
 * including the user's currently active alpha value.
 */
export interface VolatilityComparisonPoint {
  x: number;
  diagonal_y: number;
  alpha_1_5: number;
  alpha_2_5: number;
  alpha_4_0: number;
  active_alpha_y: number;
}

export function generateRelativeVolatilityComparisonSeries(
  activeAlpha: number,
  numPoints = 51
): VolatilityComparisonPoint[] {
  const safeAlpha = Number.isFinite(activeAlpha) && activeAlpha > 1 ? activeAlpha : 2.5;
  const points: VolatilityComparisonPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = Number((i / (numPoints - 1)).toFixed(4));
    points.push({
      x,
      diagonal_y: x,
      alpha_1_5: Number(equilibriumVaporY(x, 1.5).toFixed(4)),
      alpha_2_5: Number(equilibriumVaporY(x, 2.5).toFixed(4)),
      alpha_4_0: Number(equilibriumVaporY(x, 4.0).toFixed(4)),
      active_alpha_y: Number(equilibriumVaporY(x, safeAlpha).toFixed(4)),
    });
  }
  return points;
}

/**
 * Secondary Chart 2: Theoretical Stages (N) vs. Reflux Ratio (R) curve
 * from ~1.05 * R_min up to max(6.0, 3.5 * R_min, 1.3 * active R).
 */
export interface RefluxVsStagesPoint {
  refluxRatio_R: number;
  fractionalStages_N: number;
  integerStages_N: number;
  fenskeMinimum_Nmin: number;
}

export function generateRefluxVsStagesSeries(
  inputs: DistillationInputs,
  numPoints = 28
): RefluxVsStagesPoint[] {
  const baseResults = calculateDistillation(inputs);
  if (!baseResults.isValid) return [];

  const rMin = baseResults.minimumReflux.minimumRefluxRatio_Rmin;
  const nMin = baseResults.minimumReflux.fenskeMinimumStages_Nmin;
  if (rMin === null || nMin === null) return [];

  const startR = Math.max(0.15, rMin * 1.06);
  const endR = Math.max(startR + 2.0, rMin * 3.8, inputs.refluxRatio_R * 1.25, 5.5);

  const rValues = new Set<number>();
  for (let i = 0; i < numPoints; i++) {
    const r = startR + (i / (numPoints - 1)) * (endR - startR);
    rValues.add(Number(r.toFixed(3)));
  }
  if (inputs.refluxRatio_R >= startR) {
    rValues.add(Number(inputs.refluxRatio_R.toFixed(3)));
  }

  const sortedR = Array.from(rValues).sort((a, b) => a - b);
  const points: RefluxVsStagesPoint[] = [];

  for (const rVal of sortedR) {
    const res = calculateDistillation({
      ...inputs,
      refluxRatio_R: rVal,
    });
    if (
      res.stageCalculation.converged &&
      res.stageCalculation.fractionalTheoreticalStages !== null &&
      res.stageCalculation.totalTheoreticalStages !== null
    ) {
      points.push({
        refluxRatio_R: rVal,
        fractionalStages_N: Number(res.stageCalculation.fractionalTheoreticalStages.toFixed(2)),
        integerStages_N: res.stageCalculation.totalTheoreticalStages,
        fenskeMinimum_Nmin: Number(nMin.toFixed(2)),
      });
    }
  }

  return points;
}

/**
 * Secondary Chart 3: Product Flow Rates (D and B) vs. Feed Composition (zF)
 * across the valid separation window xB < zF < xD at fixed F, xD, and xB.
 */
export interface ProductFlowVsFeedPoint {
  feedComposition_zF: number;
  distillateFlow_D_kmol_h: number;
  bottomsFlow_B_kmol_h: number;
  lightRecovery_pct: number;
}

export function generateProductFlowsVsFeedSeries(
  inputs: DistillationInputs,
  numPoints = 25
): ProductFlowVsFeedPoint[] {
  const {
    feedFlow_kmol_h: F,
    bottomsComposition_xB: xB,
    distillateComposition_xD: xD,
    feedComposition_zF: activeZf,
  } = inputs;

  if (F <= 0 || xB <= 0 || xD >= 1 || xB >= xD - 0.02) {
    return [];
  }

  const minZf = xB + 0.01;
  const maxZf = xD - 0.01;
  if (minZf >= maxZf) return [];

  const zValues = new Set<number>();
  for (let i = 0; i < numPoints; i++) {
    const z = minZf + (i / (numPoints - 1)) * (maxZf - minZf);
    zValues.add(Number(z.toFixed(4)));
  }
  if (activeZf > xB && activeZf < xD) {
    zValues.add(Number(activeZf.toFixed(4)));
  }

  return Array.from(zValues)
    .sort((a, b) => a - b)
    .map((z) => {
      const D = (F * (z - xB)) / (xD - xB);
      const B = F - D;
      const recovery = z > 0 ? ((D * xD) / (F * z)) * 100 : 0;
      return {
        feedComposition_zF: z,
        distillateFlow_D_kmol_h: Number(D.toFixed(2)),
        bottomsFlow_B_kmol_h: Number(B.toFixed(2)),
        lightRecovery_pct: Number(recovery.toFixed(2)),
      };
    });
}
