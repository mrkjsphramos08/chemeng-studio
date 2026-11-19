import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_HEAT_EXCHANGER_INPUTS,
  OPERATING_PRESETS,
  calculateHeatExchanger,
  computeCountercurrentEffectiveness,
} from './heat-exchanger';
import {
  DEFAULT_HEAT_EXCHANGER_TARGET,
  computeParallelFlowReference,
  computeRequiredCountercurrentNTU,
  evaluateHeatExchangerTarget,
  evaluateScenarioComparisons,
  generateTargetSensitivitySeries,
} from './heat-exchanger-experiment';

test('1. Baseline Heat Exchanger experiment fails default 95 °C cold-outlet target and yields exact analytical A_req', () => {
  const res = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  const evalRes = evaluateHeatExchangerTarget(
    DEFAULT_HEAT_EXCHANGER_INPUTS,
    res,
    DEFAULT_HEAT_EXCHANGER_TARGET
  );

  assert.equal(evalRes.status, 'not_achieved');
  assert.equal(evalRes.isThermodynamicallyReachable, true);
  assert.ok(Math.abs(evalRes.calculatedTemp_C - 88.411) < 0.02);
  assert.ok(evalRes.margin_C < -6.0 && evalRes.margin_C > -7.0);
  assert.equal(evalRes.thermodynamicLimit_C, DEFAULT_HEAT_EXCHANGER_INPUTS.Th_in);
  assert.ok(evalRes.requiredArea_m2 !== null && evalRes.requiredArea_m2 > 15.6 && evalRes.requiredArea_m2 < 15.7);
  assert.equal(evalRes.isWithinNominalAreaRange, true);

  // Round-trip verification: plugging A_req back into the authoritative solver hits 95.0 °C exactly
  const roundTrip = calculateHeatExchanger({
    ...DEFAULT_HEAT_EXCHANGER_INPUTS,
    A: evalRes.requiredArea_m2!,
  });
  assert.equal(roundTrip.isValid, true);
  assert.ok(
    Math.abs(roundTrip.Tc_out - DEFAULT_HEAT_EXCHANGER_TARGET.targetTemp_C) < 1e-6,
    `Expected Tc,out = 95.0 °C at A_req, got ${roundTrip.Tc_out}`
  );
});

test('2. Modified area (A = 16.0 m²) achieves the 95 °C target and detects valid countercurrent temperature cross', () => {
  const modifiedInputs = {
    ...DEFAULT_HEAT_EXCHANGER_INPUTS,
    A: 16.0,
  };
  const res = calculateHeatExchanger(modifiedInputs);
  const evalRes = evaluateHeatExchangerTarget(
    modifiedInputs,
    res,
    DEFAULT_HEAT_EXCHANGER_TARGET
  );

  assert.equal(evalRes.status, 'achieved');
  assert.ok(evalRes.calculatedTemp_C > 95.0);
  assert.ok(evalRes.margin_C > 0);
  assert.equal(evalRes.isTemperatureCrossActive, true);
  assert.ok(res.Tc_out > res.Th_out);
  assert.ok(evalRes.areaDelta_m2 !== null && evalRes.areaDelta_m2 < 0);
  assert.ok(
    evalRes.interpretations.some((line) => line.includes('temperature cross')),
    'Should explain countercurrent temperature cross'
  );
});

test('3. Intentionally unreachable targets are handled honestly without NaN or false attainment', () => {
  const baselineRes = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);

  // 3a. Cold outlet target above Th,in (Second Law violation)
  const aboveHotInlet = evaluateHeatExchangerTarget(
    DEFAULT_HEAT_EXCHANGER_INPUTS,
    baselineRes,
    { variable: 'Tc_out', targetTemp_C: 125.0, tolerance_C: 0.5 }
  );
  assert.equal(aboveHotInlet.status, 'unreachable');
  assert.equal(aboveHotInlet.isThermodynamicallyReachable, false);
  assert.equal(aboveHotInlet.unreachableReason, 'above_hot_inlet');
  assert.equal(aboveHotInlet.requiredArea_m2, null);

  // 3b. Cold outlet target within tolerance of Th,in but strictly above Th,in must STILL be unreachable
  const justAboveHotInlet = evaluateHeatExchangerTarget(
    DEFAULT_HEAT_EXCHANGER_INPUTS,
    baselineRes,
    { variable: 'Tc_out', targetTemp_C: 120.2, tolerance_C: 0.5 }
  );
  assert.equal(justAboveHotInlet.status, 'unreachable');

  // 3c. Hot outlet cooling target below capacity-rate floor (48.75 °C) even though > Tc,in (25 °C)
  const belowCapacityFloor = evaluateHeatExchangerTarget(
    DEFAULT_HEAT_EXCHANGER_INPUTS,
    baselineRes,
    { variable: 'Th_out', targetTemp_C: 40.0, tolerance_C: 0.5 }
  );
  assert.equal(belowCapacityFloor.status, 'unreachable');
  assert.equal(belowCapacityFloor.unreachableReason, 'capacity_rate_ceiling');
  assert.ok(Math.abs(belowCapacityFloor.thermodynamicLimit_C - 48.75) < 1e-6);
  assert.equal(belowCapacityFloor.requiredArea_m2, null);

  // 3d. Hot-stream-limited Oil Cooler preset targeting cold outlet above Cmin ceiling (115.46 °C < 165 °C)
  const oilPreset = OPERATING_PRESETS.find((p) => p.id === 'oil-cooler')!;
  const oilRes = calculateHeatExchanger(oilPreset.inputs);
  const oilEval = evaluateHeatExchangerTarget(oilPreset.inputs, oilRes, {
    variable: 'Tc_out',
    targetTemp_C: 130.0,
    tolerance_C: 0.5,
  });
  assert.equal(oilEval.status, 'unreachable');
  assert.equal(oilEval.unreachableReason, 'capacity_rate_ceiling');
  assert.ok(oilEval.thermodynamicLimit_C < oilPreset.inputs.Th_in);
  assert.ok(Math.abs(oilEval.thermodynamicLimit_C - (20 + (6.88 * 145) / 10.45)) < 1e-3);
});

test('4. Inverse NTU relation is numerically stable across Cr -> 1 and matches forward solver', () => {
  for (const Cr of [0, 0.25, 0.75, 0.99999, 1.0]) {
    for (const eps of [0.1, 0.5, 0.85, 0.95]) {
      const ntu = computeRequiredCountercurrentNTU(eps, Cr);
      assert.ok(ntu !== null && Number.isFinite(ntu) && ntu > 0);
      const forwardEps = computeCountercurrentEffectiveness(ntu, Cr);
      assert.ok(
        Math.abs(forwardEps - eps) < 1e-10,
        `Inverse/forward mismatch at Cr=${Cr}, eps=${eps}: got ${forwardEps}`
      );
    }
  }
  assert.equal(computeRequiredCountercurrentNTU(1.0, 0.75), null);
  assert.equal(computeRequiredCountercurrentNTU(0, 0.75), 0);
});

test('5. Zero conductance (U = 0) and invalid operating inputs are handled safely without NaN', () => {
  const zeroUInputs = { ...DEFAULT_HEAT_EXCHANGER_INPUTS, U: 0 };
  const zeroURes = calculateHeatExchanger(zeroUInputs);
  const zeroUEval = evaluateHeatExchangerTarget(
    zeroUInputs,
    zeroURes,
    DEFAULT_HEAT_EXCHANGER_TARGET
  );
  assert.equal(zeroUEval.status, 'unreachable');
  assert.equal(zeroUEval.unreachableReason, 'zero_conductance');
  assert.equal(zeroUEval.requiredArea_m2, null);

  const invalidInputs = { ...DEFAULT_HEAT_EXCHANGER_INPUTS, Th_in: 20, Tc_in: 25 };
  const invalidRes = calculateHeatExchanger(invalidInputs);
  const invalidEval = evaluateHeatExchangerTarget(
    invalidInputs,
    invalidRes,
    DEFAULT_HEAT_EXCHANGER_TARGET
  );
  assert.equal(invalidEval.status, 'invalid_inputs');
  assert.ok(Number.isFinite(invalidEval.calculatedTemp_C));
});

test('6. Parallel-flow reference obeys thermodynamic bounds and countercurrent superiority', () => {
  const res = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  const par = computeParallelFlowReference(DEFAULT_HEAT_EXCHANGER_INPUTS, res);
  assert.ok(par !== null);
  assert.ok(res.effectiveness >= par.effectiveness);
  assert.ok(res.Q_kW >= par.Q_kW);
  // Parallel flow can never exhibit temperature cross
  assert.ok(par.Th_out >= par.asymptoticEquilibriumTemp_C - 1e-9);
  assert.ok(par.Tc_out <= par.asymptoticEquilibriumTemp_C + 1e-9);
  assert.ok(par.Th_out >= par.Tc_out);

  // Energy conservation in parallel reference: Ch*(Th,in - Th,out) == Cc*(Tc,out - Tc,in)
  const Qh_par = res.Ch_kW_K * (DEFAULT_HEAT_EXCHANGER_INPUTS.Th_in - par.Th_out);
  const Qc_par = res.Cc_kW_K * (par.Tc_out - DEFAULT_HEAT_EXCHANGER_INPUTS.Tc_in);
  assert.ok(Math.abs(Qh_par - par.Q_kW) < 1e-9);
  assert.ok(Math.abs(Qc_par - par.Q_kW) < 1e-9);
});

test('7. Target sensitivity series matches authoritative solver and shows diminishing returns in A', () => {
  const steps = 20;
  const series = generateTargetSensitivitySeries(DEFAULT_HEAT_EXCHANGER_INPUTS, 'A', steps);
  assert.equal(series.length, steps + 1);

  series.forEach((pt, i) => {
    const exactA = 0.5 + ((50 - 0.5) * i) / steps;
    assert.ok(Math.abs(pt.parameterValue - Number(exactA.toFixed(2))) < 1e-9);
    const direct = calculateHeatExchanger({
      ...DEFAULT_HEAT_EXCHANGER_INPUTS,
      A: exactA,
    });
    assert.equal(pt.Tc_out, Number(direct.Tc_out.toFixed(2)));
    assert.equal(pt.Th_out, Number(direct.Th_out.toFixed(2)));
    assert.equal(pt.Q_kW, Number(direct.Q_kW.toFixed(2)));
  });

  // Diminishing returns: slope at low A > slope at high A
  const lowSlope =
    (series[2].Tc_out - series[0].Tc_out) / (series[2].parameterValue - series[0].parameterValue);
  const highSlope =
    (series[series.length - 1].Tc_out - series[series.length - 3].Tc_out) /
    (series[series.length - 1].parameterValue - series[series.length - 3].parameterValue);
  assert.ok(lowSlope > highSlope * 3, `Expected strong diminishing returns: low=${lowSlope}, high=${highSlope}`);
});

test('8. Scenario trade-off comparison accurately identifies passing runs, smallest passing area, and highest duty', () => {
  const baseRes = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  const inputs16 = { ...DEFAULT_HEAT_EXCHANGER_INPUTS, A: 16.0 };
  const res16 = calculateHeatExchanger(inputs16);
  const inputs24 = { ...DEFAULT_HEAT_EXCHANGER_INPUTS, A: 24.0 };
  const res24 = calculateHeatExchanger(inputs24);

  const saved = [
    {
      id: 'base',
      label: 'Baseline (A=12m²)',
      inputs: DEFAULT_HEAT_EXCHANGER_INPUTS,
      Q_kW: baseRes.Q_kW,
      effectiveness_pct: baseRes.effectiveness_pct,
      NTU: baseRes.NTU,
      Cr: baseRes.Cr,
      Th_out: baseRes.Th_out,
      Tc_out: baseRes.Tc_out,
    },
    {
      id: 'run-16',
      label: 'Design A (16m²)',
      inputs: inputs16,
      Q_kW: res16.Q_kW,
      effectiveness_pct: res16.effectiveness_pct,
      NTU: res16.NTU,
      Cr: res16.Cr,
      Th_out: res16.Th_out,
      Tc_out: res16.Tc_out,
    },
  ];

  const comparison = evaluateScenarioComparisons(
    saved,
    inputs24,
    res24,
    DEFAULT_HEAT_EXCHANGER_TARGET
  );

  assert.equal(comparison.entries.length, 3);
  assert.equal(comparison.meetingCount, 2);
  assert.equal(comparison.entries[0].statusShortLabel, 'Missed');
  assert.equal(comparison.entries[1].statusShortLabel, 'Met');
  assert.equal(comparison.entries[2].statusShortLabel, 'Met');
  assert.equal(comparison.smallestPassingRun?.id, 'run-16');
  assert.equal(comparison.highestDutyRun?.id, '__live__');
  assert.equal(comparison.largestAreaRun?.id, '__live__');
});
