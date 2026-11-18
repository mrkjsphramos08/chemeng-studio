/**
 * ChemEng Studio — Phase 2.4
 * Process Dynamics & Control Calculation Engine (SISO FOPDT + P / PI / PID Control)
 *
 * Governing Process Model (Deviation Form):
 *   \tau \frac{dy(t)}{dt} + y(t) = K_p [ u(t - \theta) + d(t) ]
 *
 * Where:
 *   Y(t) = Y_0 + y(t)          : Measured process variable (PV, %)
 *   U(t) = U_0 + u(t)          : Actual saturated actuator signal (MV, %)
 *   r(t) = Y_0 + \Delta r(t)   : Setpoint trajectory (PV, %)
 *   e(t) = r(t) - Y(t)         : Feedback control error (% PV)
 *   d(t)                       : Additive process-input load disturbance (% MV equivalent)
 *   K_p                        : Steady-state process gain (% PV / % MV)
 *   \tau                       : First-order process time constant (s, \tau > 0)
 *   \theta                     : Process dead time / transport delay (s, \theta >= 0)
 *
 * Controller Modes (ISA Parallel / Standard Form with Derivative-on-Measurement):
 *   - Open-Loop:
 *       u_cmd(t) = U_0 + \Delta u_OL * H(t - t_step)
 *   - Proportional (P):
 *       u_cmd(t) = U_0 + K_c * e(t)
 *   - Proportional-Integral (PI):
 *       u_cmd(t) = U_0 + K_c * [ e(t) + (1 / \tau_I) \int_0^t e(\tau') d\tau' ]
 *   - Proportional-Integral-Derivative (PID, derivative on PV to avoid setpoint kick):
 *       u_cmd(t) = U_0 + K_c * [ e(t) + (1 / \tau_I) \int_0^t e(\tau') d\tau' - D_f(t) ]
 *       where filtered PV derivative D_f(t) satisfies:
 *       (\alpha_D \tau_D) \frac{dD_f}{dt} + D_f = \tau_D \frac{dY}{dt}
 *
 * Actuator Saturation & Conditional Anti-Windup:
 *   U_act(t) = clamp(u_cmd(t), U_min, U_max)
 *   When antiWindupEnabled === true and the actuator is saturated in the direction
 *   that would further increase saturation ((u_cmd > U_max && e > 0) || (u_cmd < U_min && e < 0)),
 *   the integral state update is clamped (conditional integration / integral clamping).
 */

export type ControllerMode = 'open-loop' | 'P' | 'PI' | 'PID';

export type ControlStabilityStatus =
  | 'Open-Loop Step Response'
  | 'Well-Damped Stable'
  | 'Underdamped Oscillatory'
  | 'Sustained / Growing Oscillation (Unstable)'
  | 'Actuator Saturated / Offset Limited';

export interface ProcessControlInputs {
  // Process Dynamics (FOPDT)
  processGain_Kp: number; // [% PV / % MV], e.g. 0.2 to 10.0
  timeConstant_tau_s: number; // [s], > 0, e.g. 1.0 to 200.0
  deadTime_theta_s: number; // [s], >= 0, e.g. 0.0 to 100.0
  initialOutput_Y0: number; // [% PV], baseline steady-state PV (corresponds to U_0 = 50%)
  baselineActuator_U0?: number; // [% MV], defaults to 50.0%
  simulationDuration_s: number; // [s], e.g. 20 to 600
  timeStep_dt_s: number; // [s], e.g. 0.05 to 2.0

  // Controller Configuration
  controllerMode: ControllerMode;
  controllerGain_Kc: number; // [% MV / % PV], >= 0
  integralTime_Ti_s: number; // [s], > 0 (used in PI and PID)
  derivativeTime_Td_s: number; // [s], >= 0 (used in PID)
  derivativeFilterAlpha: number; // dimensionless filter factor \alpha_D in [0.02, 1.0], default 0.10
  actuatorMin_Umin: number; // [% MV], e.g. 0
  actuatorMax_Umax: number; // [% MV], e.g. 100
  antiWindupEnabled: boolean;

  // Experiment Forcing (Setpoint, Disturbance, Open-Loop Step)
  setpointTarget_Ysp: number; // [% PV] after step
  setpointStepTime_s: number; // [s], >= 0
  disturbanceMagnitude_d: number; // [% MV equivalent load input], can be negative or positive
  disturbanceTime_s: number; // [s], >= 0
  openLoopStep_du: number; // [% MV] manual step change when controllerMode === 'open-loop'
}

export interface ProcessControlTimePoint {
  time_s: number;
  setpoint_r: number;
  processOutput_Y: number;
  analyticalOpenLoop_Y: number;
  error_e: number;
  unconstrainedCommand_Ucmd: number;
  actuatorOutput_Uact: number;
  delayedActuator_Udel: number;
  disturbance_d: number;
  proportionalTerm_P: number;
  integralTerm_I: number;
  derivativeTerm_D: number;
  isSaturated: boolean;
}

export interface ProcessControlMetrics {
  // Rise time (10% to 90% of step change \Delta r or open-loop steady-state change)
  riseTime_10_90_s: number | null;
  riseTimeStatus: string;

  // Peak & Overshoot
  peakOutput_Y: number;
  peakTime_s: number;
  minOutput_Y: number;
  overshootPercent: number | null;
  overshootStatus: string;
  peakDisturbanceDeviation: number | null;

  // Settling time (\pm 2% band around target, must remain settled through end of window)
  settlingTime_2pct_s: number | null;
  settlingStatus: string;
  isSettledWithinWindow: boolean;

  // Steady-state & terminal error
  finalOutput_Y: number;
  finalTarget_Y: number;
  steadyStateError_ess: number;
  theoreticalProportionalOffset_ess: number | null;
  terminalSlope_dYdt: number;

  // Integral error & control effort
  iae: number; // \int |e(t)| dt [% PV * s]
  itae: number; // \int t_rel |e(t)| dt [% PV * s^2]
  controlEffort_TV: number; // \sum |\Delta U_act| [% MV]
  maxCommand_Ucmd: number;
  minCommand_Ucmd: number;
  saturationDuration_s: number;
  saturationPercent: number;

  // Oscillation & stability diagnostics
  errorZeroCrossings: number;
  decayRatioEstimate: number | null;
  stabilityStatus: ControlStabilityStatus;
}

export interface ProcessControlResults {
  isValid: boolean;
  validationErrors: string[];
  advisories: string[];

  inputs: ProcessControlInputs;
  baselineActuator_U0: number;
  controllabilityRatio_theta_over_tau: number;
  loopGain_KpKc: number;

  timeSeries: ProcessControlTimePoint[];
  metrics: ProcessControlMetrics;
}

/**
 * Evaluates the exact analytical open-loop FOPDT response Y(t) for a step in actuator
 * \Delta u at t = t_step and an input load disturbance step \Delta d at t = t_dist,
 * starting from steady state Y_0.
 */
export function evaluateAnalyticalOpenLoopFOPDT(
  time_s: number,
  params: {
    processGain_Kp: number;
    timeConstant_tau_s: number;
    deadTime_theta_s: number;
    initialOutput_Y0: number;
    stepMagnitude_du: number;
    stepTime_s: number;
    disturbanceMagnitude_d?: number;
    disturbanceTime_s?: number;
  }
): number {
  const {
    processGain_Kp,
    timeConstant_tau_s,
    deadTime_theta_s,
    initialOutput_Y0,
    stepMagnitude_du,
    stepTime_s,
    disturbanceMagnitude_d = 0,
    disturbanceTime_s = 0,
  } = params;

  if (timeConstant_tau_s <= 0) {
    return initialOutput_Y0;
  }

  let deltaY = 0;

  // Delayed manipulated input response: u(t - \theta) steps at t = stepTime_s + deadTime_theta_s
  const effectiveInputStart = stepTime_s + deadTime_theta_s;
  if (time_s > effectiveInputStart && stepMagnitude_du !== 0) {
    const elapsed = time_s - effectiveInputStart;
    deltaY +=
      processGain_Kp *
      stepMagnitude_du *
      (-Math.expm1(-elapsed / timeConstant_tau_s));
  }

  // Load disturbance enters directly into the first-order process input at t = disturbanceTime_s
  if (time_s > disturbanceTime_s && disturbanceMagnitude_d !== 0) {
    const elapsedDist = time_s - disturbanceTime_s;
    deltaY +=
      processGain_Kp *
      disturbanceMagnitude_d *
      (-Math.expm1(-elapsedDist / timeConstant_tau_s));
  }

  return initialOutput_Y0 + deltaY;
}

/**
 * Helper to interpolate delayed signal u(t - \theta) from historical discrete samples uHistory[0..k]
 * sampled on uniform grid t_i = i * dt, with u(t) = uBaseline for t < 0.
 */
export function getDelayedSignalValue(
  uHistory: number[],
  currentIndex: number,
  deadTime_theta_s: number,
  dt_s: number,
  uBaseline: number
): number {
  if (deadTime_theta_s <= 0 || dt_s <= 0) {
    return uHistory[currentIndex];
  }

  const delaySteps = deadTime_theta_s / dt_s;
  const exactDelayedIndex = currentIndex - delaySteps;

  if (exactDelayedIndex <= 0) {
    // If between -1 and 0, interpolate between uBaseline (at t < 0) and uHistory[0]
    if (exactDelayedIndex > -1) {
      const frac = exactDelayedIndex + 1; // in (0, 1]
      return (1 - frac) * uBaseline + frac * uHistory[0];
    }
    return uBaseline;
  }

  const idxLow = Math.floor(exactDelayedIndex);
  const idxHigh = Math.min(uHistory.length - 1, idxLow + 1);
  const frac = exactDelayedIndex - idxLow;

  const valLow = uHistory[idxLow] ?? uBaseline;
  const valHigh = uHistory[idxHigh] ?? valLow;

  return (1 - frac) * valLow + frac * valHigh;
}

/**
 * Validates ProcessControlInputs and returns any hard errors or engineering advisories.
 */
export function validateProcessControlInputs(inputs: ProcessControlInputs): {
  validationErrors: string[];
  advisories: string[];
} {
  const validationErrors: string[] = [];
  const advisories: string[] = [];

  if (!Number.isFinite(inputs.processGain_Kp) || inputs.processGain_Kp === 0) {
    validationErrors.push(
      'Process gain K_p must be a non-zero finite number (% PV / % MV).'
    );
  } else if (inputs.processGain_Kp < 0) {
    validationErrors.push(
      'This introductory laboratory requires a positive process gain K_p > 0 (standard negative-feedback sign convention).'
    );
  }

  if (!Number.isFinite(inputs.timeConstant_tau_s) || inputs.timeConstant_tau_s <= 0) {
    validationErrors.push(
      'Process time constant τ must be strictly positive (τ > 0 s).'
    );
  }

  if (!Number.isFinite(inputs.deadTime_theta_s) || inputs.deadTime_theta_s < 0) {
    validationErrors.push(
      'Process dead time θ must be non-negative (θ ≥ 0 s).'
    );
  }

  if (
    !Number.isFinite(inputs.simulationDuration_s) ||
    inputs.simulationDuration_s <= 0
  ) {
    validationErrors.push(
      'Simulation duration must be strictly positive (t_sim > 0 s).'
    );
  }

  if (!Number.isFinite(inputs.timeStep_dt_s) || inputs.timeStep_dt_s <= 0) {
    validationErrors.push(
      'Simulation time step Δt must be strictly positive (Δt > 0 s).'
    );
  } else if (
    Number.isFinite(inputs.simulationDuration_s) &&
    inputs.simulationDuration_s / inputs.timeStep_dt_s > 20000
  ) {
    validationErrors.push(
      'Simulation step count (t_sim / Δt) exceeds 20,000 points. Increase Δt or reduce t_sim.'
    );
  } else if (
    Number.isFinite(inputs.timeConstant_tau_s) &&
    inputs.timeConstant_tau_s > 0 &&
    inputs.timeStep_dt_s > inputs.timeConstant_tau_s * 0.5
  ) {
    validationErrors.push(
      `Time step Δt (${inputs.timeStep_dt_s} s) exceeds 50% of the process time constant τ (${inputs.timeConstant_tau_s} s), which degrades discrete controller fidelity.`
    );
  }

  if (
    !Number.isFinite(inputs.actuatorMin_Umin) ||
    !Number.isFinite(inputs.actuatorMax_Umax) ||
    inputs.actuatorMin_Umin >= inputs.actuatorMax_Umax
  ) {
    validationErrors.push(
      'Actuator minimum limit U_min must be strictly less than maximum limit U_max.'
    );
  }

  if (inputs.controllerMode !== 'open-loop') {
    if (!Number.isFinite(inputs.controllerGain_Kc) || inputs.controllerGain_Kc <= 0) {
      validationErrors.push(
        'Controller proportional gain K_c must be strictly positive (K_c > 0) in closed-loop modes.'
      );
    }

    if (
      (inputs.controllerMode === 'PI' || inputs.controllerMode === 'PID') &&
      (!Number.isFinite(inputs.integralTime_Ti_s) || inputs.integralTime_Ti_s <= 0)
    ) {
      validationErrors.push(
        'Integral time τ_I must be strictly positive (τ_I > 0 s) for PI and PID controllers.'
      );
    }

    if (
      inputs.controllerMode === 'PID' &&
      (!Number.isFinite(inputs.derivativeTime_Td_s) || inputs.derivativeTime_Td_s < 0)
    ) {
      validationErrors.push(
        'Derivative time τ_D must be non-negative (τ_D ≥ 0 s) for PID control.'
      );
    }

    if (
      inputs.controllerMode === 'PID' &&
      (!Number.isFinite(inputs.derivativeFilterAlpha) ||
        inputs.derivativeFilterAlpha <= 0 ||
        inputs.derivativeFilterAlpha > 1)
    ) {
      validationErrors.push(
        'Derivative filter factor α_D must lie within (0, 1].'
      );
    }
  }

  if (
    !Number.isFinite(inputs.setpointStepTime_s) ||
    inputs.setpointStepTime_s < 0 ||
    !Number.isFinite(inputs.disturbanceTime_s) ||
    inputs.disturbanceTime_s < 0
  ) {
    validationErrors.push(
      'Setpoint step time and disturbance activation time must be non-negative (≥ 0 s).'
    );
  }

  // Engineering Advisories (non-blocking warnings)
  if (validationErrors.length === 0) {
    const thetaOverTau = inputs.deadTime_theta_s / inputs.timeConstant_tau_s;
    if (thetaOverTau >= 0.8) {
      advisories.push(
        `High Dead-Time Ratio (θ/τ = ${thetaOverTau.toFixed(2)}): When transport delay θ approaches or exceeds the process time constant τ, phase lag severely limits closed-loop bandwidth and aggressive K_c or small τ_I will rapidly destabilize the loop.`
      );
    }

    if (
      inputs.controllerMode === 'P' &&
      Math.abs(inputs.setpointTarget_Ysp - inputs.initialOutput_Y0) > 1e-6
    ) {
      const loopGain = inputs.processGain_Kp * inputs.controllerGain_Kc;
      const offset =
        (inputs.setpointTarget_Ysp - inputs.initialOutput_Y0) / (1 + loopGain);
      advisories.push(
        `Proportional-Only Offset: Without integral action (1/τ_I = 0), a P controller cannot eliminate steady-state error. Theoretical closed-loop offset for Δr = ${(inputs.setpointTarget_Ysp - inputs.initialOutput_Y0).toFixed(1)}% is e_ss = Δr / (1 + K_p·K_c) = ${offset.toFixed(2)}% (assuming no actuator saturation).`
      );
    }
  }

  return { validationErrors, advisories };
}

/**
 * Main deterministic numerical simulator for SISO FOPDT Process Dynamics & PID Control.
 */
export function simulateProcessControl(
  rawInputs: ProcessControlInputs
): ProcessControlResults {
  const { validationErrors, advisories } = validateProcessControlInputs(rawInputs);

  const U0 = Number.isFinite(rawInputs.baselineActuator_U0)
    ? (rawInputs.baselineActuator_U0 as number)
    : 50.0;

  // Sanitize fallback values so calculation never throws NaN even when reporting validationErrors
  const Kp =
    Number.isFinite(rawInputs.processGain_Kp) && rawInputs.processGain_Kp > 0
      ? rawInputs.processGain_Kp
      : 1.5;
  const tau =
    Number.isFinite(rawInputs.timeConstant_tau_s) && rawInputs.timeConstant_tau_s > 0
      ? rawInputs.timeConstant_tau_s
      : 20.0;
  const theta =
    Number.isFinite(rawInputs.deadTime_theta_s) && rawInputs.deadTime_theta_s >= 0
      ? rawInputs.deadTime_theta_s
      : 4.0;
  const Y0 = Number.isFinite(rawInputs.initialOutput_Y0)
    ? rawInputs.initialOutput_Y0
    : 50.0;
  const duration =
    Number.isFinite(rawInputs.simulationDuration_s) &&
    rawInputs.simulationDuration_s > 0
      ? Math.min(rawInputs.simulationDuration_s, 2000)
      : 120.0;
  const dt =
    Number.isFinite(rawInputs.timeStep_dt_s) && rawInputs.timeStep_dt_s > 0
      ? Math.max(rawInputs.timeStep_dt_s, duration / 10000)
      : 0.2;

  const mode = rawInputs.controllerMode;
  const Kc =
    Number.isFinite(rawInputs.controllerGain_Kc) && rawInputs.controllerGain_Kc > 0
      ? rawInputs.controllerGain_Kc
      : 2.0;
  const Ti =
    Number.isFinite(rawInputs.integralTime_Ti_s) && rawInputs.integralTime_Ti_s > 0
      ? rawInputs.integralTime_Ti_s
      : 18.0;
  const Td =
    Number.isFinite(rawInputs.derivativeTime_Td_s) &&
    rawInputs.derivativeTime_Td_s >= 0
      ? rawInputs.derivativeTime_Td_s
      : 2.0;
  const alphaD =
    Number.isFinite(rawInputs.derivativeFilterAlpha) &&
    rawInputs.derivativeFilterAlpha > 0 &&
    rawInputs.derivativeFilterAlpha <= 1
      ? rawInputs.derivativeFilterAlpha
      : 0.1;

  const Umin = Number.isFinite(rawInputs.actuatorMin_Umin)
    ? rawInputs.actuatorMin_Umin
    : 0.0;
  const Umax =
    Number.isFinite(rawInputs.actuatorMax_Umax) &&
    rawInputs.actuatorMax_Umax > Umin
      ? rawInputs.actuatorMax_Umax
      : 100.0;
  const antiWindup = Boolean(rawInputs.antiWindupEnabled);

  const Ysp = Number.isFinite(rawInputs.setpointTarget_Ysp)
    ? rawInputs.setpointTarget_Ysp
    : 65.0;
  const tStep =
    Number.isFinite(rawInputs.setpointStepTime_s) && rawInputs.setpointStepTime_s >= 0
      ? rawInputs.setpointStepTime_s
      : 5.0;
  const dMag = Number.isFinite(rawInputs.disturbanceMagnitude_d)
    ? rawInputs.disturbanceMagnitude_d
    : 0.0;
  const tDist =
    Number.isFinite(rawInputs.disturbanceTime_s) && rawInputs.disturbanceTime_s >= 0
      ? rawInputs.disturbanceTime_s
      : 60.0;
  const duOpenLoop = Number.isFinite(rawInputs.openLoopStep_du)
    ? rawInputs.openLoopStep_du
    : 10.0;

  const numSteps = Math.max(1, Math.round(duration / dt));
  const expDecay = Math.exp(-dt / tau);
  const oneMinusExp = -Math.expm1(-dt / tau); // 1 - exp(-dt/tau) with high precision

  const timeSeries: ProcessControlTimePoint[] = [];
  const uDeviationHistory: number[] = [];

  let yDev = 0.0; // y(t) = Y(t) - Y0
  let prevY = Y0;
  let integralError = 0.0; // \int e(t) dt
  let filteredDerivative_Df = 0.0; // filtered dY/dt term

  for (let k = 0; k <= numSteps; k++) {
    const t = Number((k * dt).toFixed(6));

    // Setpoint r(t)
    const r =
      mode === 'open-loop'
        ? Y0
        : t >= tStep - 1e-9
          ? Ysp
          : Y0;

    // Load disturbance d(t)
    const d = t >= tDist - 1e-9 ? dMag : 0.0;

    // Current process variable Y(t_k)
    const Y = Y0 + yDev;
    const e = r - Y;

    // Controller evaluation at t_k
    let pTerm = 0.0;
    let iTerm = 0.0;
    let dTerm = 0.0;
    let uCmd = U0;

    if (mode === 'open-loop') {
      const du = t >= tStep - 1e-9 ? duOpenLoop : 0.0;
      pTerm = du;
      uCmd = U0 + du;
    } else {
      // Proportional term on error
      pTerm = Kc * e;

      // Derivative term on measured PV (PID only)
      if (mode === 'PID' && Td > 0 && k > 0) {
        const tauFilter = alphaD * Td;
        const denom = tauFilter + dt;
        filteredDerivative_Df =
          (tauFilter / denom) * filteredDerivative_Df +
          (Td / denom) * (Y - prevY);
        dTerm = -Kc * filteredDerivative_Df;
      } else {
        dTerm = 0.0;
      }

      // Candidate integral update for PI / PID
      if (mode === 'PI' || mode === 'PID') {
        const candidateIntegral = k === 0 ? 0.0 : integralError + e * dt;
        const candidateITerm = (Kc / Ti) * candidateIntegral;
        const candidateUcmd = U0 + pTerm + candidateITerm + dTerm;

        if (antiWindup) {
          // Conditional integration (clamping): freeze integral when command exceeds limits in same direction as error
          const saturatingHigh = candidateUcmd > Umax && e > 0;
          const saturatingLow = candidateUcmd < Umin && e < 0;
          if (!saturatingHigh && !saturatingLow && k > 0) {
            integralError = candidateIntegral;
          }
        } else if (k > 0) {
          integralError = candidateIntegral;
        }

        iTerm = (Kc / Ti) * integralError;
      }

      uCmd = U0 + pTerm + iTerm + dTerm;
    }

    // Actuator saturation
    const uAct = Math.max(Umin, Math.min(Umax, uCmd));
    const isSaturated = Math.abs(uCmd - uAct) > 1e-6;
    const uDev = uAct - U0;
    uDeviationHistory.push(uDev);

    // Delayed actuator deviation u(t_k - \theta)
    const uDelDev = getDelayedSignalValue(uDeviationHistory, k, theta, dt, 0.0);
    const uDelActual = U0 + uDelDev;

    // Analytical open-loop reference at time t
    const equivalentStepDu =
      mode === 'open-loop'
        ? duOpenLoop
        : (Ysp - Y0) / Kp;
    const analyticalOpenLoop_Y = evaluateAnalyticalOpenLoopFOPDT(t, {
      processGain_Kp: Kp,
      timeConstant_tau_s: tau,
      deadTime_theta_s: theta,
      initialOutput_Y0: Y0,
      stepMagnitude_du: mode === 'open-loop' ? duOpenLoop : equivalentStepDu,
      stepTime_s: tStep,
      disturbanceMagnitude_d: dMag,
      disturbanceTime_s: tDist,
    });

    timeSeries.push({
      time_s: Number(t.toFixed(4)),
      setpoint_r: Number(r.toFixed(5)),
      processOutput_Y: Number(Y.toFixed(5)),
      analyticalOpenLoop_Y: Number(analyticalOpenLoop_Y.toFixed(5)),
      error_e: Number(e.toFixed(5)),
      unconstrainedCommand_Ucmd: Number(uCmd.toFixed(5)),
      actuatorOutput_Uact: Number(uAct.toFixed(5)),
      delayedActuator_Udel: Number(uDelActual.toFixed(5)),
      disturbance_d: Number(d.toFixed(5)),
      proportionalTerm_P: Number(pTerm.toFixed(5)),
      integralTerm_I: Number(iTerm.toFixed(5)),
      derivativeTerm_D: Number(dTerm.toFixed(5)),
      isSaturated,
    });

    prevY = Y;

    // Advance process state from t_k to t_{k+1} using exact ZOH update over interval [t_k, t_{k+1}]
    const forcing = Kp * (uDelDev + d);
    yDev = expDecay * yDev + oneMinusExp * forcing;
  }

  const metrics = computePerformanceMetrics(timeSeries, {
    mode,
    Kp,
    tau,
    theta,
    Kc,
    Y0,
    Ysp,
    tStep,
    dMag,
    tDist,
    duOpenLoop,
    duration,
    dt,
  });

  if (metrics.saturationDuration_s > 0) {
    advisories.push(
      `Actuator Saturation Detected (${metrics.saturationDuration_s.toFixed(1)} s, ${metrics.saturationPercent.toFixed(1)}% of run): The controller demand u_cmd(t) exceeded [${Umin.toFixed(0)}%, ${Umax.toFixed(0)}%]. ${
        antiWindup
          ? 'Anti-windup (conditional integration clamping) is ACTIVE, preventing integral state accumulation during saturation.'
          : 'Anti-windup is DISABLED—integral windup accumulated excess error during saturation, delaying recovery.'
      }`
    );
  }

  if (
    metrics.stabilityStatus ===
    'Sustained / Growing Oscillation (Unstable)'
  ) {
    advisories.push(
      `Closed-Loop Instability / Sustained Oscillation Warning: The closed-loop trajectory exhibits non-decaying or growing oscillations (decay ratio ${
        metrics.decayRatioEstimate !== null
          ? metrics.decayRatioEstimate.toFixed(2)
          : '≥ 1.0'
      }). Reduce controller gain K_c or increase integral time τ_I.`
    );
  } else if (metrics.stabilityStatus === 'Underdamped Oscillatory') {
    advisories.push(
      `Underdamped Oscillatory Response: The loop crosses its target ${metrics.errorZeroCrossings} times before damping out. Adding moderate derivative action τ_D or reducing K_c can improve damping.`
    );
  }

  return {
    isValid: validationErrors.length === 0,
    validationErrors,
    advisories,
    inputs: rawInputs,
    baselineActuator_U0: U0,
    controllabilityRatio_theta_over_tau: theta / tau,
    loopGain_KpKc: Kp * Kc,
    timeSeries,
    metrics,
  };
}

/**
 * Computes rigorous engineering performance metrics from a simulated time-series trajectory.
 */
function computePerformanceMetrics(
  series: ProcessControlTimePoint[],
  ctx: {
    mode: ControllerMode;
    Kp: number;
    tau: number;
    theta: number;
    Kc: number;
    Y0: number;
    Ysp: number;
    tStep: number;
    dMag: number;
    tDist: number;
    duOpenLoop: number;
    duration: number;
    dt: number;
  }
): ProcessControlMetrics {
  const {
    mode,
    Kp,
    tau,
    Kc,
    Y0,
    Ysp,
    tStep,
    dMag,
    tDist,
    duOpenLoop,
    duration,
    dt,
  } = ctx;

  const n = series.length;
  const lastPt = series[n - 1];
  const prevPt = series[Math.max(0, n - 2)];

  const finalOutput_Y = lastPt.processOutput_Y;
  const finalTarget_Y =
    mode === 'open-loop'
      ? Y0 + Kp * (duOpenLoop + dMag)
      : Ysp;

  const steadyStateError_ess =
    mode === 'open-loop'
      ? finalTarget_Y - finalOutput_Y
      : lastPt.setpoint_r - finalOutput_Y;

  const terminalSlope_dYdt =
    n > 1 ? (lastPt.processOutput_Y - prevPt.processOutput_Y) / dt : 0;

  // Theoretical P-only steady-state offset for setpoint + disturbance
  const theoreticalProportionalOffset_ess =
    mode === 'P'
      ? (Ysp - Y0 - Kp * dMag) / (1 + Kp * Kc)
      : null;

  // Peak & min output
  let peakOutput_Y = -Infinity;
  let peakTime_s = 0;
  let minOutput_Y = Infinity;
  let maxCommand_Ucmd = -Infinity;
  let minCommand_Ucmd = Infinity;

  // Trapezoidal IAE, ITAE, Control Effort TV, Saturation duration
  let iae = 0;
  let itae = 0;
  let controlEffort_TV = 0;
  let saturatedSteps = 0;

  const eventStartTime =
    Math.abs(Ysp - Y0) > 1e-6 || mode === 'open-loop' ? tStep : tDist;

  for (let i = 0; i < n; i++) {
    const pt = series[i];
    if (pt.processOutput_Y > peakOutput_Y) {
      peakOutput_Y = pt.processOutput_Y;
      peakTime_s = pt.time_s;
    }
    if (pt.processOutput_Y < minOutput_Y) {
      minOutput_Y = pt.processOutput_Y;
    }
    if (pt.unconstrainedCommand_Ucmd > maxCommand_Ucmd) {
      maxCommand_Ucmd = pt.unconstrainedCommand_Ucmd;
    }
    if (pt.unconstrainedCommand_Ucmd < minCommand_Ucmd) {
      minCommand_Ucmd = pt.unconstrainedCommand_Ucmd;
    }
    if (pt.isSaturated && i > 0) {
      saturatedSteps++;
    }
    if (i > 0) {
      const prev = series[i - 1];
      const absE0 = Math.abs(prev.error_e);
      const absE1 = Math.abs(pt.error_e);
      iae += 0.5 * (absE0 + absE1) * dt;

      const tRel0 = Math.max(0, prev.time_s - eventStartTime);
      const tRel1 = Math.max(0, pt.time_s - eventStartTime);
      itae += 0.5 * (tRel0 * absE0 + tRel1 * absE1) * dt;

      controlEffort_TV += Math.abs(
        pt.actuatorOutput_Uact - prev.actuatorOutput_Uact
      );
    }
  }

  const saturationDuration_s = saturatedSteps * dt;
  const saturationPercent = (saturationDuration_s / Math.max(dt, duration)) * 100;

  // Step magnitude for rise time & overshoot calculation
  const stepReferenceChange =
    mode === 'open-loop'
      ? Kp * duOpenLoop
      : Ysp - Y0;

  let riseTime_10_90_s: number | null = null;
  let riseTimeStatus = 'Not applicable (zero step change)';
  let overshootPercent: number | null = null;
  let overshootStatus = 'Not applicable (zero setpoint step)';
  let peakDisturbanceDeviation: number | null = null;

  if (Math.abs(stepReferenceChange) > 1e-4) {
    const dir = Math.sign(stepReferenceChange);
    const absDelta = Math.abs(stepReferenceChange);
    const y10 = Y0 + dir * 0.1 * absDelta;
    const y90 = Y0 + dir * 0.9 * absDelta;

    let t10: number | null = null;
    let t90: number | null = null;

    for (let i = 1; i < n; i++) {
      const prev = series[i - 1];
      const curr = series[i];
      if (curr.time_s < tStep) continue;

      const prevProg = dir * (prev.processOutput_Y - Y0);
      const currProg = dir * (curr.processOutput_Y - Y0);

      if (t10 === null && currProg >= 0.1 * absDelta) {
        const denom = currProg - prevProg;
        const frac =
          Math.abs(denom) > 1e-9
            ? (dir * (y10 - Y0) - prevProg) / denom
            : 0;
        t10 = prev.time_s + Math.max(0, Math.min(1, frac)) * dt;
      }

      if (t90 === null && currProg >= 0.9 * absDelta) {
        const denom = currProg - prevProg;
        const frac =
          Math.abs(denom) > 1e-9
            ? (dir * (y90 - Y0) - prevProg) / denom
            : 0;
        t90 = prev.time_s + Math.max(0, Math.min(1, frac)) * dt;
        break;
      }
    }

    if (t10 !== null && t90 !== null && t90 >= t10) {
      riseTime_10_90_s = t90 - t10;
      riseTimeStatus = `10%–90% step rise (${t10.toFixed(2)} s → ${t90.toFixed(2)} s)`;
    } else {
      riseTimeStatus =
        '90% of step target not reached (offset or slow response)';
    }

    // Overshoot relative to target step
    let maxExcursionBeyondTarget = 0;
    for (let i = 0; i < n; i++) {
      const pt = series[i];
      if (pt.time_s < tStep) continue;
      const excursion = dir * (pt.processOutput_Y - (Y0 + stepReferenceChange));
      if (excursion > maxExcursionBeyondTarget) {
        maxExcursionBeyondTarget = excursion;
      }
    }
    overshootPercent = (maxExcursionBeyondTarget / absDelta) * 100;
    overshootStatus =
      overshootPercent > 0.05
        ? `${overshootPercent.toFixed(1)}% above target`
        : '0.0% (no overshoot)';
  } else if (Math.abs(dMag) > 1e-4) {
    // Pure regulatory disturbance rejection
    let maxDev = 0;
    for (let i = 0; i < n; i++) {
      const dev = Math.abs(series[i].processOutput_Y - Ysp);
      if (dev > maxDev) maxDev = dev;
    }
    peakDisturbanceDeviation = maxDev;
    riseTimeStatus = 'Regulatory mode (disturbance rejection)';
    overshootStatus = `Peak deviation |Y - r|_max = ${maxDev.toFixed(2)}%`;
  }

  // Settling time (\pm 2% of step magnitude, or \pm 0.5% PV if pure regulatory)
  const referenceScale =
    Math.abs(stepReferenceChange) > 1e-4
      ? Math.abs(stepReferenceChange)
      : Math.max(5.0, Math.abs(Kp * dMag));
  const settlingBand = Math.max(0.05, 0.02 * referenceScale);

  // Target around which settling is tested:
  // In closed-loop, settling is defined relative to the desired setpoint Ysp!
  // In open-loop, settling is relative to the final steady-state open-loop output.
  const settlingReferenceTarget =
    mode === 'open-loop' ? finalTarget_Y : Ysp;

  // Check if the process is inside the band at the end of the simulation window
  // AND has remained inside for at least minHoldTime
  const minHoldTime = Math.min(duration * 0.15, Math.max(3 * dt, 0.25 * tau));
  let lastOutsideIndex = -1;
  for (let i = 0; i < n; i++) {
    if (series[i].time_s < eventStartTime) continue;
    const errFromTarget = Math.abs(
      series[i].processOutput_Y - settlingReferenceTarget
    );
    if (errFromTarget > settlingBand) {
      lastOutsideIndex = i;
    }
  }

  let settlingTime_2pct_s: number | null = null;
  let isSettledWithinWindow = false;
  let settlingStatus = 'Not settled within simulation window';

  if (lastOutsideIndex === -1) {
    settlingTime_2pct_s = 0;
    isSettledWithinWindow = true;
    settlingStatus = `Remained within ±${settlingBand.toFixed(2)}% band`;
  } else if (lastOutsideIndex < n - 1) {
    const enterIndex = lastOutsideIndex + 1;
    const enterTime = series[enterIndex].time_s;
    const remainingTime = duration - enterTime;
    if (remainingTime >= minHoldTime) {
      settlingTime_2pct_s = Math.max(0, enterTime - eventStartTime);
      isSettledWithinWindow = true;
      settlingStatus = `Settled within ±${settlingBand.toFixed(2)}% after ${settlingTime_2pct_s.toFixed(1)} s`;
    } else {
      settlingStatus = `Entered ±${settlingBand.toFixed(2)}% near end of window (unverified hold)`;
    }
  } else {
    if (mode === 'P' && Math.abs(steadyStateError_ess) > settlingBand) {
      settlingStatus = `Unsettled on setpoint (steady-state P offset e_ss = ${steadyStateError_ess.toFixed(2)}%)`;
    } else {
      settlingStatus = `Not settled within ${duration.toFixed(0)} s simulation window`;
    }
  }

  // Oscillation & stability analysis: count error zero-crossings after eventStartTime
  let errorZeroCrossings = 0;
  const peakExcursionsAfterCrossings: number[] = [];
  let currentHalfWavePeak = 0;
  let prevErrorSign = 0;

  for (let i = 0; i < n; i++) {
    const pt = series[i];
    if (pt.time_s <= eventStartTime + dt) continue;
    const err =
      mode === 'open-loop'
        ? finalTarget_Y - pt.processOutput_Y
        : pt.error_e;

    if (Math.abs(err) > 0.05) {
      const sign = Math.sign(err);
      if (prevErrorSign !== 0 && sign !== prevErrorSign) {
        errorZeroCrossings++;
        if (currentHalfWavePeak > 0) {
          peakExcursionsAfterCrossings.push(currentHalfWavePeak);
        }
        currentHalfWavePeak = Math.abs(err);
      } else {
        currentHalfWavePeak = Math.max(currentHalfWavePeak, Math.abs(err));
      }
      prevErrorSign = sign;
    }
  }

  let decayRatioEstimate: number | null = null;
  if (peakExcursionsAfterCrossings.length >= 3) {
    // Compare full-cycle peaks (peak k+2 vs peak k)
    const len = peakExcursionsAfterCrossings.length;
    const pLater = peakExcursionsAfterCrossings[len - 1];
    const pEarlier = peakExcursionsAfterCrossings[len - 3];
    if (pEarlier > 1e-5) {
      decayRatioEstimate = pLater / pEarlier;
    }
  }

  let stabilityStatus: ControlStabilityStatus = 'Well-Damped Stable';
  if (mode === 'open-loop') {
    stabilityStatus = 'Open-Loop Step Response';
  } else if (
    (decayRatioEstimate !== null && decayRatioEstimate >= 0.92) ||
    (errorZeroCrossings >= 6 && !isSettledWithinWindow)
  ) {
    stabilityStatus = 'Sustained / Growing Oscillation (Unstable)';
  } else if (errorZeroCrossings >= 2 || (overshootPercent !== null && overshootPercent > 8.0)) {
    stabilityStatus = 'Underdamped Oscillatory';
  } else if (saturationPercent > 45 && !isSettledWithinWindow) {
    stabilityStatus = 'Actuator Saturated / Offset Limited';
  }

  return {
    riseTime_10_90_s,
    riseTimeStatus,
    peakOutput_Y,
    peakTime_s,
    minOutput_Y,
    overshootPercent,
    overshootStatus,
    peakDisturbanceDeviation,
    settlingTime_2pct_s,
    settlingStatus,
    isSettledWithinWindow,
    finalOutput_Y,
    finalTarget_Y,
    steadyStateError_ess,
    theoreticalProportionalOffset_ess,
    terminalSlope_dYdt,
    iae,
    itae,
    controlEffort_TV,
    maxCommand_Ucmd,
    minCommand_Ucmd,
    saturationDuration_s,
    saturationPercent,
    errorZeroCrossings,
    decayRatioEstimate,
    stabilityStatus,
  };
}

export interface ControllerComparisonPoint {
  time_s: number;
  setpoint_r: number;
  openLoop_Y: number;
  pControl_Y: number;
  piControl_Y: number;
  pidControl_Y: number;
}

export interface ControllerComparisonSummary {
  series: ControllerComparisonPoint[];
  pMetrics: ProcessControlMetrics;
  piMetrics: ProcessControlMetrics;
  pidMetrics: ProcessControlMetrics;
}

/**
 * Simulates P, PI, PID, and Open-Loop responses side-by-side under identical
 * process and disturbance parameters so students can directly compare modes.
 */
export function generateControllerModeComparison(
  baseInputs: ProcessControlInputs
): ControllerComparisonSummary {
  const equivalentOpenLoopDu =
    Math.abs(baseInputs.setpointTarget_Ysp - baseInputs.initialOutput_Y0) > 1e-6
      ? (baseInputs.setpointTarget_Ysp - baseInputs.initialOutput_Y0) /
        Math.max(0.1, baseInputs.processGain_Kp)
      : baseInputs.openLoopStep_du;

  const openLoopRun = simulateProcessControl({
    ...baseInputs,
    controllerMode: 'open-loop',
    openLoopStep_du: equivalentOpenLoopDu,
  });
  const pRun = simulateProcessControl({
    ...baseInputs,
    controllerMode: 'P',
  });
  const piRun = simulateProcessControl({
    ...baseInputs,
    controllerMode: 'PI',
  });
  const pidRun = simulateProcessControl({
    ...baseInputs,
    controllerMode: 'PID',
    derivativeTime_Td_s:
      baseInputs.derivativeTime_Td_s > 0
        ? baseInputs.derivativeTime_Td_s
        : Math.max(0.5, baseInputs.deadTime_theta_s * 0.5),
  });

  const series: ControllerComparisonPoint[] = pRun.timeSeries.map((pt, idx) => ({
    time_s: pt.time_s,
    setpoint_r: pt.setpoint_r,
    openLoop_Y: openLoopRun.timeSeries[idx]?.processOutput_Y ?? pt.processOutput_Y,
    pControl_Y: pt.processOutput_Y,
    piControl_Y: piRun.timeSeries[idx]?.processOutput_Y ?? pt.processOutput_Y,
    pidControl_Y: pidRun.timeSeries[idx]?.processOutput_Y ?? pt.processOutput_Y,
  }));

  return {
    series,
    pMetrics: pRun.metrics,
    piMetrics: piRun.metrics,
    pidMetrics: pidRun.metrics,
  };
}

export type SensitivityParameterKey =
  | 'controllerGain_Kc'
  | 'integralTime_Ti_s'
  | 'derivativeTime_Td_s'
  | 'timeConstant_tau_s'
  | 'deadTime_theta_s';

export interface SensitivityCurvePoint {
  time_s: number;
  setpoint_r: number;
  lowCase_Y: number;
  nominalCase_Y: number;
  highCase_Y: number;
}

export interface SensitivitySweepResult {
  parameterKey: SensitivityParameterKey;
  lowLabel: string;
  nominalLabel: string;
  highLabel: string;
  series: SensitivityCurvePoint[];
}

/**
 * Generates a 3-curve time-domain parameter sensitivity sweep (0.5x, 1.0x, 2.0x)
 * for any of the 5 key tuning/process parameters: K_c, \tau_I, \tau_D, \tau, \theta.
 */
export function generateControlSensitivitySeries(
  baseInputs: ProcessControlInputs,
  parameterKey: SensitivityParameterKey
): SensitivitySweepResult {
  // Ensure closed-loop mode is active when exploring controller parameters
  const effectiveBase: ProcessControlInputs =
    baseInputs.controllerMode === 'open-loop' &&
    (parameterKey === 'controllerGain_Kc' ||
      parameterKey === 'integralTime_Ti_s' ||
      parameterKey === 'derivativeTime_Td_s')
      ? { ...baseInputs, controllerMode: 'PID' }
      : parameterKey === 'derivativeTime_Td_s' &&
          baseInputs.controllerMode !== 'PID'
        ? { ...baseInputs, controllerMode: 'PID' }
        : parameterKey === 'integralTime_Ti_s' &&
            baseInputs.controllerMode === 'P'
          ? { ...baseInputs, controllerMode: 'PI' }
          : baseInputs;

  const nominalVal = effectiveBase[parameterKey] as number;
  const safeNominal =
    parameterKey === 'deadTime_theta_s' || parameterKey === 'derivativeTime_Td_s'
      ? Math.max(1.0, nominalVal)
      : Math.max(0.5, nominalVal);

  const lowVal =
    parameterKey === 'deadTime_theta_s' && nominalVal === 0
      ? 0.0
      : Number((0.5 * safeNominal).toFixed(2));
  const midVal = Number(safeNominal.toFixed(2));
  const highVal = Number((2.0 * safeNominal).toFixed(2));

  const runLow = simulateProcessControl({
    ...effectiveBase,
    [parameterKey]: lowVal,
  });
  const runMid = simulateProcessControl({
    ...effectiveBase,
    [parameterKey]: midVal,
  });
  const runHigh = simulateProcessControl({
    ...effectiveBase,
    [parameterKey]: highVal,
  });

  const symbolMap: Record<SensitivityParameterKey, { sym: string; unit: string }> = {
    controllerGain_Kc: { sym: 'Kc', unit: '' },
    integralTime_Ti_s: { sym: 'τI', unit: ' s' },
    derivativeTime_Td_s: { sym: 'τD', unit: ' s' },
    timeConstant_tau_s: { sym: 'τ', unit: ' s' },
    deadTime_theta_s: { sym: 'θ', unit: ' s' },
  };

  const { sym, unit } = symbolMap[parameterKey];

  const series: SensitivityCurvePoint[] = runMid.timeSeries.map((pt, idx) => ({
    time_s: pt.time_s,
    setpoint_r: pt.setpoint_r,
    lowCase_Y: runLow.timeSeries[idx]?.processOutput_Y ?? pt.processOutput_Y,
    nominalCase_Y: pt.processOutput_Y,
    highCase_Y: runHigh.timeSeries[idx]?.processOutput_Y ?? pt.processOutput_Y,
  }));

  return {
    parameterKey,
    lowLabel: `Low (${sym} = ${lowVal}${unit})`,
    nominalLabel: `Baseline (${sym} = ${midVal}${unit})`,
    highLabel: `High (${sym} = ${highVal}${unit})`,
    series,
  };
}

// ============================================================================
// EDUCATIONAL SCENARIO PRESETS (10 VERIFIED SCENARIOS)
// ============================================================================

export interface ProcessControlPreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  expectedObservation: string;
  inputs: ProcessControlInputs;
}

export const PROCESS_CONTROL_PRESETS: ProcessControlPreset[] = [
  {
    id: 'first-order-open-loop',
    name: '1. First-Order Open-Loop Step Response',
    tag: 'Open-Loop · θ = 0 s · τ = 20 s',
    description:
      'Pure first-order process ($K_p = 1.5, \\tau = 20\\,\\mathrm{s}, \\theta = 0\\,\\mathrm{s}$) subjected to a $+10\\%$ manual actuator step ($\\Delta u = +10\\%$) at $t = 5\\,\\mathrm{s}$.',
    expectedObservation:
      'Output rises exponentially by $\\Delta Y = K_p \\Delta u = +15.0\\%$ (from $50\\%$ to $65\\%$), reaching $63.2\\%$ of its final change ($59.48\\%$) at $t = t_{\\mathrm{step}} + \\tau = 25.0\\,\\mathrm{s}$.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 0.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'open-loop',
      controllerGain_Kc: 2.0,
      integralTime_Ti_s: 20.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'slow-process-response',
    name: '2. High-Thermal-Inertia Slow Process',
    tag: 'Open-Loop · τ = 50 s · θ = 3 s',
    description:
      'Large-holdup vessel with a long time constant ($\\tau = 50\\,\\mathrm{s}, K_p = 1.5, \\theta = 3\\,\\mathrm{s}$) experiencing a $+10\\%$ actuator step.',
    expectedObservation:
      'Because $\\tau$ is $2.5\\times$ larger than baseline, the $10\\%\\text{–}90\\%$ rise time stretches to $\\approx 110\\,\\mathrm{s}$ ($2.2\\tau$) even though the eventual steady-state gain $K_p \\Delta u = +15\\%$ is identical.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 50.0,
      deadTime_theta_s: 3.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 220.0,
      timeStep_dt_s: 0.25,
      controllerMode: 'open-loop',
      controllerGain_Kc: 1.8,
      integralTime_Ti_s: 45.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 100.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'significant-dead-time',
    name: '3. Delay-Dominated FOPDT Process',
    tag: 'PI Control · θ = 12 s · τ = 15 s',
    description:
      'Process with substantial transport delay ($\\theta = 12\\,\\mathrm{s}, \\tau = 15\\,\\mathrm{s}, \\theta/\\tau = 0.80$) under moderate PI feedback control.',
    expectedObservation:
      'No process response occurs for $12\\,\\mathrm{s}$ after the setpoint step at $t = 5\\,\\mathrm{s}$; during dead time the controller integrates blind error, causing noticeable overshoot.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 15.0,
      deadTime_theta_s: 12.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 160.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 0.9,
      integralTime_Ti_s: 20.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 80.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'conservative-proportional',
    name: '4. Conservative Proportional (P) Control',
    tag: 'P Control · Kc = 1.6 · Steady-State Offset',
    description:
      'Proportional-only feedback controller ($K_c = 1.6$) responding to a $+15\\%$ setpoint step ($50\\% \\to 65\\%$) on an FOPDT process ($K_p = 1.5, \\tau = 20\\,\\mathrm{s}, \\theta = 3\\,\\mathrm{s}$).',
    expectedObservation:
      'Fast initial response with minimal overshoot, but settles permanently below setpoint at $Y_{\\mathrm{ss}} = 60.6\\%$ with steady-state offset $e_{\\mathrm{ss}} = \\Delta r / (1 + K_p K_c) = 4.41\\%$.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 3.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'P',
      controllerGain_Kc: 1.6,
      integralTime_Ti_s: 20.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'pi-integral-action',
    name: '5. Balanced PI Control (Zero Offset)',
    tag: 'PI Control · Kc = 1.8 · τI = 18 s',
    description:
      'Well-tuned Proportional-Integral controller ($K_c = 1.8, \\tau_I = 18\\,\\mathrm{s}$) tracking a $+15\\%$ setpoint step ($50\\% \\to 65\\%$).',
    expectedObservation:
      'Integral action drives steady-state offset $e_{\\mathrm{ss}}$ to $0.00\\%$, settling smoothly within $\\pm 2\\%$ of the $65.0\\%$ target with low overshoot.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 3.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 1.8,
      integralTime_Ti_s: 18.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'pid-filtered-derivative',
    name: '6. PID Controller with Filtered Derivative',
    tag: 'PID Control · Kc = 2.2 · τI = 16 s · τD = 2.5 s',
    description:
      'Three-mode PID controller using derivative-on-measurement ($\\tau_D = 2.5\\,\\mathrm{s}, \\alpha_D = 0.10$) to provide predictive phase lead without setpoint derivative kick.',
    expectedObservation:
      'Faster rise and settling time than PI control while braking the upward slope $dY/dt$ to restrain peak overshoot.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 4.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PID',
      controllerGain_Kc: 2.2,
      integralTime_Ti_s: 16.0,
      derivativeTime_Td_s: 2.5,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'poorly-tuned-oscillatory',
    name: '7. Aggressive / Poorly Tuned Oscillatory Loop',
    tag: 'PI Control · High Kc = 4.2 · Fast τI = 6 s',
    description:
      'Excessive controller gain ($K_c = 4.2$) combined with overly aggressive integral reset ($\\tau_I = 6\\,\\mathrm{s}$) on a delayed process ($\\theta = 5\\,\\mathrm{s}$).',
    expectedObservation:
      'Produces large overshoot and sustained/poorly damped oscillations that fail to settle within the simulation window.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 5.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 140.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 4.2,
      integralTime_Ti_s: 6.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 70.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'disturbance-rejection',
    name: '8. Load Disturbance Rejection Experiment',
    tag: 'PID Regulatory · Setpoint + Load Step at t = 65 s',
    description:
      'Setpoint step to $60\\%$ at $t = 5\\,\\mathrm{s}$ followed by an unmeasured load disturbance step ($d = -8\\%$ MV equivalent) entering the process at $t = 65\\,\\mathrm{s}$.',
    expectedObservation:
      'After settling at $60\\%$, the negative load disturbance causes a temporary dip in $Y(t)$, which the integral term automatically counteracts by raising steady-state actuator output by $+8\\%$.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 18.0,
      deadTime_theta_s: 3.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 150.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PID',
      controllerGain_Kc: 2.0,
      integralTime_Ti_s: 15.0,
      derivativeTime_Td_s: 2.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 60.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: -8.0,
      disturbanceTime_s: 65.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'saturation-windup',
    name: '9. Actuator Saturation & Integral Windup (Anti-Windup OFF)',
    tag: 'PI Control · Umax = 75% · Anti-Windup OFF',
    description:
      'Large $+30\\%$ setpoint step ($50\\% \\to 80\\%$) with upper actuator limit constrained at $U_{\\max} = 75\\%$ and anti-windup protection disabled.',
    expectedObservation:
      'Actuator clamps at $75\\%$ while unconstrained command $u_{\\mathrm{cmd}}(t)$ winds up above $115\\%$; the excess integral charge causes severe prolonged overshoot before recovery.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 4.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 150.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 2.4,
      integralTime_Ti_s: 8.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 75.0,
      antiWindupEnabled: false,
      setpointTarget_Ysp: 80.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 80.0,
      openLoopStep_du: 10.0,
    },
  },
  {
    id: 'anti-windup-protected',
    name: '10. Improved Anti-Windup Response (Anti-Windup ON)',
    tag: 'PI Control · Umax = 75% · Anti-Windup ON',
    description:
      'Identical $+30\\%$ setpoint step and $U_{\\max} = 75\\%$ constraint as Preset 9, but with conditional integration anti-windup enabled.',
    expectedObservation:
      'Freezing integral accumulation while $U_{\\mathrm{act}}$ is saturated at $75\\%$ prevents $u_{\\mathrm{cmd}}$ windup, dramatically cutting peak overshoot and settling time.',
    inputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 4.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 150.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 2.4,
      integralTime_Ti_s: 8.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 75.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 80.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 80.0,
      openLoopStep_du: 10.0,
    },
  },
];
