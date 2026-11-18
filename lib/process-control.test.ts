import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ProcessControlInputs,
  PROCESS_CONTROL_PRESETS,
  evaluateAnalyticalOpenLoopFOPDT,
  simulateProcessControl,
  generateControllerModeComparison,
  generateControlSensitivitySeries,
} from './process-control';

const BASE_TEST_INPUTS: ProcessControlInputs = {
  processGain_Kp: 1.5,
  timeConstant_tau_s: 20.0,
  deadTime_theta_s: 0.0,
  initialOutput_Y0: 50.0,
  simulationDuration_s: 160.0,
  timeStep_dt_s: 0.1,
  controllerMode: 'open-loop',
  controllerGain_Kc: 1.8,
  integralTime_Ti_s: 18.0,
  derivativeTime_Td_s: 2.0,
  derivativeFilterAlpha: 0.1,
  actuatorMin_Umin: 0.0,
  actuatorMax_Umax: 100.0,
  antiWindupEnabled: true,
  setpointTarget_Ysp: 65.0,
  setpointStepTime_s: 5.0,
  disturbanceMagnitude_d: 0.0,
  disturbanceTime_s: 60.0,
  openLoopStep_du: 10.0,
};

test('Process Control 1 — Analytical first-order step response matches numerical ZOH open-loop trajectory (θ = 0)', () => {
  const res = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    deadTime_theta_s: 0.0,
    controllerMode: 'open-loop',
    openLoopStep_du: 10.0,
  });

  assert.equal(res.isValid, true);
  for (const pt of res.timeSeries) {
    assert.ok(
      Math.abs(pt.processOutput_Y - pt.analyticalOpenLoop_Y) < 1e-4,
      `Mismatch at t=${pt.time_s}: numerical=${pt.processOutput_Y}, analytical=${pt.analyticalOpenLoop_Y}`
    );
  }
});

test('Process Control 2 — Time constant τ reaches 63.212% of final step change at t = t_step + τ and steady-state gain Kp*Δu', () => {
  const tau = 20.0;
  const Kp = 2.0;
  const du = 12.0; // steady-state ΔY = 24.0
  const tStep = 5.0;

  const res = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    processGain_Kp: Kp,
    timeConstant_tau_s: tau,
    deadTime_theta_s: 0.0,
    openLoopStep_du: du,
    setpointStepTime_s: tStep,
    simulationDuration_s: 240.0,
    timeStep_dt_s: 0.1,
  });

  const ptAtOneTau = res.timeSeries.find(
    (p) => Math.abs(p.time_s - (tStep + tau)) < 1e-4
  );
  assert.ok(ptAtOneTau, 'Point at t = t_step + τ should exist');
  const expectedOneTau = 50.0 + Kp * du * (1 - Math.exp(-1));
  assert.ok(
    Math.abs(ptAtOneTau.processOutput_Y - expectedOneTau) < 1e-3,
    `Expected ${expectedOneTau}, got ${ptAtOneTau.processOutput_Y}`
  );

  // Final steady-state output approaches Y0 + Kp*du = 74.0
  assert.ok(Math.abs(res.metrics.finalOutput_Y - 74.0) < 0.01);
  // Rise time for first-order system is tau * ln(9) = 20 * 2.19722 = 43.944 s
  assert.ok(res.metrics.riseTime_10_90_s !== null);
  assert.ok(
    Math.abs(res.metrics.riseTime_10_90_s - tau * Math.log(9)) < 0.15,
    `Expected 10-90% rise time ~${tau * Math.log(9)} s, got ${res.metrics.riseTime_10_90_s}`
  );
});

test('Process Control 3 — Dead-time FOPDT response remains strictly at Y0 for t <= t_step + θ and matches shifted exponential after', () => {
  const theta = 6.0;
  const tStep = 5.0;
  const res = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    deadTime_theta_s: theta,
    setpointStepTime_s: tStep,
    timeStep_dt_s: 0.1,
  });

  for (const pt of res.timeSeries) {
    if (pt.time_s <= tStep + theta + 1e-6) {
      assert.ok(
        Math.abs(pt.processOutput_Y - 50.0) < 1e-5,
        `Output changed prematurely during dead time at t=${pt.time_s}: ${pt.processOutput_Y}`
      );
    } else {
      assert.ok(
        Math.abs(pt.processOutput_Y - pt.analyticalOpenLoop_Y) < 0.02,
        `Delayed FOPDT mismatch at t=${pt.time_s}: ${pt.processOutput_Y} vs ${pt.analyticalOpenLoop_Y}`
      );
    }
  }
});

test('Process Control 4 — Non-integer dead time (θ / Δt not an integer) interpolates smoothly and converges with Δt', () => {
  const theta = 3.37; // non-integer multiple of dt = 0.2 or 0.05
  const runCoarse = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    deadTime_theta_s: theta,
    timeStep_dt_s: 0.2,
    simulationDuration_s: 80.0,
  });
  const runFine = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    deadTime_theta_s: theta,
    timeStep_dt_s: 0.04,
    simulationDuration_s: 80.0,
  });

  const exactAt30 = evaluateAnalyticalOpenLoopFOPDT(30.0, {
    processGain_Kp: BASE_TEST_INPUTS.processGain_Kp,
    timeConstant_tau_s: BASE_TEST_INPUTS.timeConstant_tau_s,
    deadTime_theta_s: theta,
    initialOutput_Y0: BASE_TEST_INPUTS.initialOutput_Y0,
    stepMagnitude_du: BASE_TEST_INPUTS.openLoopStep_du,
    stepTime_s: BASE_TEST_INPUTS.setpointStepTime_s,
  });

  const yCoarse30 = runCoarse.timeSeries.find((p) => Math.abs(p.time_s - 30.0) < 1e-4)!
    .processOutput_Y;
  const yFine30 = runFine.timeSeries.find((p) => Math.abs(p.time_s - 30.0) < 1e-4)!
    .processOutput_Y;

  const errCoarse = Math.abs(yCoarse30 - exactAt30);
  const errFine = Math.abs(yFine30 - exactAt30);

  assert.ok(errCoarse < 0.05, `Coarse non-integer delay error too large: ${errCoarse}`);
  assert.ok(errFine < errCoarse, `Fine grid error (${errFine}) should be smaller than coarse (${errCoarse})`);
});

test('Process Control 5 — Proportional (P) controller exhibits exact theoretical steady-state offset Δr / (1 + Kp*Kc)', () => {
  const Kp = 1.5;
  const Kc = 1.6;
  const deltaR = 15.0; // 50 -> 65
  const expectedOffset = deltaR / (1 + Kp * Kc); // 15 / (1 + 2.4) = 4.41176%

  const res = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    processGain_Kp: Kp,
    controllerMode: 'P',
    controllerGain_Kc: Kc,
    deadTime_theta_s: 1.0,
    simulationDuration_s: 180.0,
    timeStep_dt_s: 0.1,
  });

  assert.equal(res.isValid, true);
  assert.ok(res.metrics.theoreticalProportionalOffset_ess !== null);
  assert.ok(
    Math.abs(res.metrics.steadyStateError_ess - expectedOffset) < 0.02,
    `Expected P steady-state offset ${expectedOffset.toFixed(4)}, got ${res.metrics.steadyStateError_ess}`
  );
  // Because steady-state error is 4.41% (> 2% band = 0.3%), it must NOT be reported as settled on setpoint
  assert.equal(res.metrics.isSettledWithinWindow, false);
  assert.equal(res.metrics.settlingTime_2pct_s, null);
});

test('Process Control 6 — Proportional-Integral (PI) controller eliminates steady-state offset to zero', () => {
  const res = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    controllerMode: 'PI',
    controllerGain_Kc: 1.8,
    integralTime_Ti_s: 18.0,
    deadTime_theta_s: 3.0,
    simulationDuration_s: 160.0,
    timeStep_dt_s: 0.1,
  });

  assert.equal(res.isValid, true);
  assert.ok(
    Math.abs(res.metrics.steadyStateError_ess) < 0.02,
    `PI controller should eliminate steady-state error, got ${res.metrics.steadyStateError_ess}`
  );
  assert.equal(res.metrics.isSettledWithinWindow, true);
  assert.ok(res.metrics.settlingTime_2pct_s !== null && res.metrics.settlingTime_2pct_s > 0);
});

test('Process Control 7 — PID controller with derivative-on-measurement avoids derivative kick on setpoint step and damps overshoot', () => {
  const piRun = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    controllerMode: 'PI',
    controllerGain_Kc: 2.2,
    integralTime_Ti_s: 14.0,
    deadTime_theta_s: 4.0,
    simulationDuration_s: 140.0,
    timeStep_dt_s: 0.1,
  });

  const pidRun = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    controllerMode: 'PID',
    controllerGain_Kc: 2.2,
    integralTime_Ti_s: 14.0,
    derivativeTime_Td_s: 2.5,
    derivativeFilterAlpha: 0.1,
    deadTime_theta_s: 4.0,
    simulationDuration_s: 140.0,
    timeStep_dt_s: 0.1,
  });

  // At the exact instant of the setpoint step (t = 5.0 s), Y has not changed yet (Y[k] == Y[k-1]),
  // so derivative-on-measurement produces zero derivative kick (derivativeTerm_D === 0)!
  const stepPt = pidRun.timeSeries.find((p) => Math.abs(p.time_s - 5.0) < 1e-4)!;
  assert.equal(stepPt.derivativeTerm_D, 0, 'Derivative-on-measurement must not kick on setpoint step');

  // Later during upward rise of Y(t), derivative term must be negative (braking action)
  const risingPt = pidRun.timeSeries.find((p) => Math.abs(p.time_s - 12.0) < 1e-4)!;
  assert.ok(risingPt.derivativeTerm_D < 0, `Expected negative braking derivative term during rise, got ${risingPt.derivativeTerm_D}`);

  // PID with derivative damping reduces overshoot compared to identical Kc/Ti PI
  assert.ok(
    (pidRun.metrics.overshootPercent ?? 0) < (piRun.metrics.overshootPercent ?? 0),
    `Expected PID overshoot (${pidRun.metrics.overshootPercent}) < PI overshoot (${piRun.metrics.overshootPercent})`
  );
});

test('Process Control 8 — Actuator saturation clamps U_act within [U_min, U_max] and Anti-Windup reduces windup overshoot', () => {
  const windupOffPreset = PROCESS_CONTROL_PRESETS.find((p) => p.id === 'saturation-windup')!;
  const windupOnPreset = PROCESS_CONTROL_PRESETS.find((p) => p.id === 'anti-windup-protected')!;

  const resOff = simulateProcessControl(windupOffPreset.inputs);
  const resOn = simulateProcessControl(windupOnPreset.inputs);

  // Verify actuator output never violates [0, 75] in either run
  for (const pt of resOff.timeSeries) {
    assert.ok(pt.actuatorOutput_Uact >= 0 - 1e-6 && pt.actuatorOutput_Uact <= 75.0 + 1e-6);
  }
  for (const pt of resOn.timeSeries) {
    assert.ok(pt.actuatorOutput_Uact >= 0 - 1e-6 && pt.actuatorOutput_Uact <= 75.0 + 1e-6);
  }

  // Unconstrained command exceeds 75% in both, but winds up much higher when anti-windup is OFF
  assert.ok(resOff.metrics.maxCommand_Ucmd > 110);
  assert.ok(resOn.metrics.maxCommand_Ucmd < resOff.metrics.maxCommand_Ucmd);

  // Anti-windup ON achieves lower peak overshoot and lower IAE than Anti-windup OFF
  assert.ok(
    (resOn.metrics.overshootPercent ?? 0) < (resOff.metrics.overshootPercent ?? 0),
    `Expected anti-windup overshoot (${resOn.metrics.overshootPercent}) < windup OFF (${resOff.metrics.overshootPercent})`
  );
  assert.ok(
    resOn.metrics.iae < resOff.metrics.iae,
    `Expected anti-windup IAE (${resOn.metrics.iae}) < windup OFF IAE (${resOff.metrics.iae})`
  );
});

test('Process Control 9 — Load disturbance rejection restores process output to setpoint and shifts actuator by -d', () => {
  const res = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    controllerMode: 'PI',
    controllerGain_Kc: 2.0,
    integralTime_Ti_s: 15.0,
    deadTime_theta_s: 2.0,
    setpointTarget_Ysp: 50.0, // pure regulatory (r = Y0 = 50%)
    disturbanceMagnitude_d: -10.0, // -10% load step at t = 20 s
    disturbanceTime_s: 20.0,
    simulationDuration_s: 180.0,
    timeStep_dt_s: 0.1,
  });

  assert.equal(res.isValid, true);
  assert.ok(res.metrics.peakDisturbanceDeviation !== null && res.metrics.peakDisturbanceDeviation > 2.0);
  // Output returns to 50.0%
  assert.ok(Math.abs(res.metrics.finalOutput_Y - 50.0) < 0.05);
  // Final actuator output must equal U0 - d = 50 - (-10) = 60.0% to cancel the input disturbance
  const lastActuator = res.timeSeries[res.timeSeries.length - 1].actuatorOutput_Uact;
  assert.ok(
    Math.abs(lastActuator - 60.0) < 0.05,
    `Expected final actuator to shift to 60.0% to reject d=-10%, got ${lastActuator}`
  );
});

test('Process Control 10 — Closed-loop time-step convergence across Δt = 0.4 s, 0.1 s, and 0.025 s', () => {
  const run04 = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    controllerMode: 'PID',
    deadTime_theta_s: 3.2,
    timeStep_dt_s: 0.4,
    simulationDuration_s: 100.0,
  });
  const run01 = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    controllerMode: 'PID',
    deadTime_theta_s: 3.2,
    timeStep_dt_s: 0.1,
    simulationDuration_s: 100.0,
  });
  const run0025 = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    controllerMode: 'PID',
    deadTime_theta_s: 3.2,
    timeStep_dt_s: 0.025,
    simulationDuration_s: 100.0,
  });

  const diffCoarse = Math.abs(run04.metrics.peakOutput_Y - run0025.metrics.peakOutput_Y);
  const diffFine = Math.abs(run01.metrics.peakOutput_Y - run0025.metrics.peakOutput_Y);
  assert.ok(diffFine < diffCoarse, `Expected fine Δt difference (${diffFine}) < coarse (${diffCoarse})`);
  assert.ok(diffFine < 0.25);
});

test('Process Control 11 — Poorly tuned oscillatory preset is detected and NOT falsely reported as settled', () => {
  const oscPreset = PROCESS_CONTROL_PRESETS.find((p) => p.id === 'poorly-tuned-oscillatory')!;
  const res = simulateProcessControl(oscPreset.inputs);

  assert.equal(res.isValid, true);
  assert.ok(res.metrics.errorZeroCrossings >= 4, `Expected multiple oscillations, got ${res.metrics.errorZeroCrossings}`);
  assert.ok(
    res.metrics.stabilityStatus === 'Underdamped Oscillatory' ||
      res.metrics.stabilityStatus === 'Sustained / Growing Oscillation (Unstable)'
  );
  assert.equal(res.metrics.isSettledWithinWindow, false);
  assert.equal(res.metrics.settlingTime_2pct_s, null);
});

test('Process Control 12 — Invalid parameters are cleanly rejected without producing NaN or Infinity', () => {
  const invalidRes = simulateProcessControl({
    ...BASE_TEST_INPUTS,
    processGain_Kp: -1.0,
    timeConstant_tau_s: 0,
    deadTime_theta_s: -2,
    controllerMode: 'PID',
    controllerGain_Kc: 0,
    integralTime_Ti_s: -5,
    derivativeTime_Td_s: -1,
    actuatorMin_Umin: 80,
    actuatorMax_Umax: 20,
  });

  assert.equal(invalidRes.isValid, false);
  assert.ok(invalidRes.validationErrors.length >= 6);
  for (const pt of invalidRes.timeSeries) {
    assert.ok(Number.isFinite(pt.processOutput_Y));
    assert.ok(Number.isFinite(pt.actuatorOutput_Uact));
  }
});

test('Process Control 13 — All 10 educational presets evaluate validly and comparison/sensitivity helpers return finite curves', () => {
  assert.equal(PROCESS_CONTROL_PRESETS.length, 10);
  for (const preset of PROCESS_CONTROL_PRESETS) {
    const res = simulateProcessControl(preset.inputs);
    assert.equal(res.isValid, true, `Preset ${preset.id} should be valid`);
    assert.ok(res.timeSeries.length > 50);
    assert.ok(Number.isFinite(res.metrics.iae));
    assert.ok(Number.isFinite(res.metrics.itae));
  }

  const comp = generateControllerModeComparison(PROCESS_CONTROL_PRESETS[4].inputs);
  assert.ok(comp.series.length > 50);
  assert.ok(Math.abs(comp.piMetrics.steadyStateError_ess) < Math.abs(comp.pMetrics.steadyStateError_ess));

  const sens = generateControlSensitivitySeries(
    PROCESS_CONTROL_PRESETS[4].inputs,
    'controllerGain_Kc'
  );
  assert.ok(sens.series.length > 50);
});
