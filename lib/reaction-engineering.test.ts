import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_REACTION_ENGINEERING_INPUTS,
  REACTION_ENGINEERING_PRESETS,
  calculateReactionEngineering,
  generateBatchTimeSeries,
  generatePfrVolumeSeries,
  generateResidenceTimeComparisonSeries,
  generateTargetConversionSizingSeries,
} from './reaction-engineering';

function assertClose(actual: number, expected: number, tol = 1e-6, label = '') {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tol,
    `${label ? label + ': ' : ''}expected ${expected}, got ${actual} (diff ${diff} > tol ${tol})`
  );
}

test('1. Ideal Batch Reactor matches analytical first-order kinetics CA(t) and X(t)', () => {
  const res = calculateReactionEngineering({
    reactorType: 'batch',
    initialConcentration_mol_m3: 1000,
    rateConstant_per_s: 0.02,
    reactorVolume_m3: 1.5,
    volumetricFlowRate_m3_s: 0.02,
    batchTime_s: 75,
    targetConversion_pct: 80,
  });

  assert.equal(res.isValid, true);
  assert.equal(res.activeReactor.reactorType, 'batch');
  assert.equal(res.activeReactor.timeSymbol, 't');
  assertClose(res.activeReactor.characteristicTime_s, 75, 1e-9, 'Batch reaction time');

  const expectedCA = 1000 * Math.exp(-0.02 * 75);
  const expectedX = 1 - Math.exp(-0.02 * 75);
  assertClose(res.activeReactor.outletConcentration_mol_m3, expectedCA, 1e-6, 'Batch CA');
  assertClose(res.activeReactor.conversion, expectedX, 1e-8, 'Batch conversion');
  assertClose(
    res.activeReactor.reactionRate_mol_m3_s,
    0.02 * expectedCA,
    1e-8,
    'Batch reaction rate -rA'
  );
  assertClose(
    res.activeReactor.molesConverted_mol ?? 0,
    1.5 * (1000 - expectedCA),
    1e-6,
    'Batch moles converted'
  );
});

test('2. Ideal CSTR satisfies steady-state material balance q*(CA0 - CA) = (-rA)*V', () => {
  const inputs = {
    reactorType: 'cstr' as const,
    initialConcentration_mol_m3: 1200,
    rateConstant_per_s: 0.03,
    reactorVolume_m3: 2.4,
    volumetricFlowRate_m3_s: 0.02, // tau = 120 s, k*tau = 3.6
    batchTime_s: 120,
    targetConversion_pct: 75,
  };
  const res = calculateReactionEngineering(inputs);

  assert.equal(res.isValid, true);
  assert.equal(res.activeReactor.reactorType, 'cstr');
  assert.equal(res.activeReactor.timeSymbol, 'τ');
  assertClose(res.residenceTime_s ?? 0, 120, 1e-9, 'Residence time tau');

  const expectedCA = 1200 / (1 + 0.03 * 120);
  const expectedX = (0.03 * 120) / (1 + 0.03 * 120);
  assertClose(res.activeReactor.outletConcentration_mol_m3, expectedCA, 1e-8, 'CSTR CA');
  assertClose(res.activeReactor.conversion, expectedX, 1e-8, 'CSTR conversion');

  // Verify CSTR design equation residual: q*(CA0 - CA) - (k*CA)*V === 0
  const lhs =
    inputs.volumetricFlowRate_m3_s *
    (inputs.initialConcentration_mol_m3 - res.activeReactor.outletConcentration_mol_m3);
  const rhs = res.activeReactor.reactionRate_mol_m3_s * inputs.reactorVolume_m3;
  assertClose(lhs, rhs, 1e-9, 'CSTR material balance conservation');
});

test('3. Ideal PFR matches analytical exponential conversion and matches Batch at t = tau', () => {
  const res = calculateReactionEngineering(DEFAULT_REACTION_ENGINEERING_INPUTS);

  assert.equal(res.isValid, true);
  assert.equal(res.activeReactor.reactorType, 'pfr');
  assertClose(res.residenceTime_s ?? 0, 75, 1e-9, 'PFR tau');

  const expectedCA = 1000 * Math.exp(-1.5);
  const expectedX = 1 - Math.exp(-1.5);
  assertClose(res.activeReactor.outletConcentration_mol_m3, expectedCA, 1e-8, 'PFR CA');
  assertClose(res.activeReactor.conversion, expectedX, 1e-8, 'PFR conversion');

  // Constant-density isothermal PFR at tau = t yields identical conversion to Batch at t
  assertClose(
    res.activeReactor.conversion,
    res.batchAtResidenceTime?.conversion ?? -1,
    1e-10,
    'PFR at tau vs Batch at t=tau'
  );
});

test('4. At identical positive V, q, and k > 0, PFR strictly outperforms CSTR in first-order conversion', () => {
  const res = calculateReactionEngineering({
    reactorType: 'cstr',
    initialConcentration_mol_m3: 1000,
    rateConstant_per_s: 0.02,
    reactorVolume_m3: 1.5,
    volumetricFlowRate_m3_s: 0.02,
    batchTime_s: 75,
    targetConversion_pct: 80,
  });

  const cstrX = res.cstrAtCurrentVolume?.conversion_pct ?? 0;
  const pfrX = res.pfrAtCurrentVolume?.conversion_pct ?? 0;
  assertClose(cstrX, 60.0, 1e-6, 'CSTR conversion at Da=1.5');
  assertClose(pfrX, 77.686984, 1e-4, 'PFR conversion at Da=1.5');
  assert.ok(pfrX > cstrX, 'PFR must achieve higher conversion than CSTR for positive first-order kinetics');
});

test('5. Target conversion sizing computes exact required Batch time, PFR volume, and CSTR volume', () => {
  const res = calculateReactionEngineering(DEFAULT_REACTION_ENGINEERING_INPUTS);
  // X_target = 80%, k = 0.02 s^-1, q = 0.02 m^3/s
  const expectedT = -Math.log(0.2) / 0.02; // 80.4718956 s
  const expectedVPfr = 0.02 * expectedT; // 1.6094379 m^3
  const expectedVCstr = (0.02 * 0.8) / (0.02 * 0.2); // 4.0 m^3

  assert.equal(res.targetDesign.isTargetAchievable, true);
  assertClose(res.targetDesign.requiredBatchTime_s ?? 0, expectedT, 1e-6, 't_req');
  assertClose(res.targetDesign.requiredVolumePFR_m3 ?? 0, expectedVPfr, 1e-6, 'V_req PFR');
  assertClose(res.targetDesign.requiredVolumeCSTR_m3 ?? 0, expectedVCstr, 1e-6, 'V_req CSTR');
  assertClose(
    res.targetDesign.cstrToPfrVolumeRatio ?? 0,
    expectedVCstr / expectedVPfr,
    1e-6,
    'V_CSTR / V_PFR ratio'
  );
  assert.ok((res.targetDesign.requiredVolumeCSTR_m3 ?? 0) > (res.targetDesign.requiredVolumePFR_m3 ?? 0));
});

test('6. Zero rate constant (k = 0) yields zero conversion, warning, and unachievable positive target', () => {
  const res = calculateReactionEngineering({
    reactorType: 'pfr',
    initialConcentration_mol_m3: 1000,
    rateConstant_per_s: 0,
    reactorVolume_m3: 2.0,
    volumetricFlowRate_m3_s: 0.02,
    batchTime_s: 60,
    targetConversion_pct: 50,
  });

  assert.equal(res.isValid, true);
  assertClose(res.activeReactor.conversion, 0, 1e-12, 'Zero-k conversion');
  assertClose(res.activeReactor.outletConcentration_mol_m3, 1000, 1e-9, 'Zero-k outlet CA');
  assertClose(res.activeReactor.reactionRate_mol_m3_s, 0, 1e-12, 'Zero-k reaction rate');
  assert.equal(res.targetDesign.isTargetAchievable, false);
  assert.equal(res.targetDesign.requiredVolumeCSTR_m3, null);
  assert.equal(res.targetDesign.requiredVolumePFR_m3, null);
  assert.ok(res.validationIssues.some((i) => i.severity === 'warning' && i.field === 'rateConstant_per_s'));
});

test('7. Zero reaction time (Batch t=0) and zero volume (Continuous V=0) yield zero conversion cleanly', () => {
  const batchZero = calculateReactionEngineering({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
    reactorType: 'batch',
    batchTime_s: 0,
  });
  assert.equal(batchZero.isValid, true);
  assertClose(batchZero.activeReactor.conversion, 0, 1e-12);
  assertClose(batchZero.activeReactor.outletConcentration_mol_m3, 1000, 1e-9);

  const cstrZero = calculateReactionEngineering({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
    reactorType: 'cstr',
    reactorVolume_m3: 0,
  });
  assert.equal(cstrZero.isValid, true);
  assertClose(cstrZero.activeReactor.conversion, 0, 1e-12);
  assertClose(cstrZero.residenceTime_s ?? -1, 0, 1e-12);
});

test('8. Target conversion = 100% is explicitly flagged as unbounded/unachievable (no Infinity or NaN)', () => {
  const res = calculateReactionEngineering({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
    targetConversion_pct: 100,
  });

  assert.equal(res.isValid, true);
  assert.equal(res.targetDesign.isTargetAchievable, false);
  assert.equal(res.targetDesign.requiredBatchTime_s, null);
  assert.equal(res.targetDesign.requiredVolumePFR_m3, null);
  assert.equal(res.targetDesign.requiredVolumeCSTR_m3, null);
  assert.ok(
    res.validationIssues.some((i) => i.severity === 'warning' && i.field === 'targetConversion_pct')
  );
});

test('9. Numerical stability at tiny and extreme Damkohler numbers (expm1 / log1p accuracy)', () => {
  const tiny = calculateReactionEngineering({
    reactorType: 'pfr',
    initialConcentration_mol_m3: 1000,
    rateConstant_per_s: 1e-9,
    reactorVolume_m3: 1.0,
    volumetricFlowRate_m3_s: 1.0,
    batchTime_s: 1.0,
    targetConversion_pct: 0.0001,
  });
  assert.equal(tiny.isValid, true);
  assertClose(tiny.activeReactor.conversion, 1e-9, 1e-16, 'Tiny Da linear limit X ≈ k*tau');
  assert.ok(Number.isFinite(tiny.targetDesign.requiredVolumePFR_m3 ?? NaN));

  const extreme = calculateReactionEngineering({
    reactorType: 'pfr',
    initialConcentration_mol_m3: 1000,
    rateConstant_per_s: 5.0,
    reactorVolume_m3: 100,
    volumetricFlowRate_m3_s: 0.01, // Da = 50,000
    batchTime_s: 1000,
    targetConversion_pct: 99.9,
  });
  assert.equal(extreme.isValid, true);
  assert.equal(extreme.activeReactor.conversion, 1);
  assert.equal(extreme.activeReactor.outletConcentration_mol_m3, 0);
  assert.ok(Number.isFinite(extreme.cstrAtCurrentVolume?.conversion ?? NaN));
  assert.ok(extreme.validationIssues.some((i) => i.severity === 'warning'));
});

test('10. Validation rejects negative/zero invalid physical inputs cleanly', () => {
  const zeroConc = calculateReactionEngineering({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
    initialConcentration_mol_m3: 0,
  });
  assert.equal(zeroConc.isValid, false);

  const negRate = calculateReactionEngineering({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
    rateConstant_per_s: -0.01,
  });
  assert.equal(negRate.isValid, false);

  const zeroFlowPfr = calculateReactionEngineering({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
    reactorType: 'pfr',
    volumetricFlowRate_m3_s: 0,
  });
  assert.equal(zeroFlowPfr.isValid, false);

  const badTarget = calculateReactionEngineering({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
    targetConversion_pct: 105,
  });
  assert.equal(badTarget.isValid, false);
});

test('11. All educational presets evaluate validly and produce consistent chart sweeps', () => {
  assert.ok(REACTION_ENGINEERING_PRESETS.length >= 6);
  for (const preset of REACTION_ENGINEERING_PRESETS) {
    const res = calculateReactionEngineering(preset.inputs);
    assert.equal(res.isValid, true, `Preset ${preset.id} must be valid`);
    assert.ok(res.activeReactor.conversion >= 0 && res.activeReactor.conversion <= 1);
    assert.ok(res.activeReactor.outletConcentration_mol_m3 >= 0);

    const batchSeries = generateBatchTimeSeries(preset.inputs);
    assert.ok(batchSeries.length > 10);
    assertClose(batchSeries[0].concentration_mol_m3, preset.inputs.initialConcentration_mol_m3, 1e-4);

    const tauSeries = generateResidenceTimeComparisonSeries(preset.inputs);
    assert.ok(tauSeries.length > 10);

    const pfrSeries = generatePfrVolumeSeries(preset.inputs);
    assert.ok(pfrSeries.length > 10);
    assertClose(
      pfrSeries[pfrSeries.length - 1].conversion_pct,
      (res.pfrAtCurrentVolume?.conversion_pct ?? 0),
      1e-3,
      `PFR outlet matches sweep endpoint for ${preset.id}`
    );

    const sizingSeries = generateTargetConversionSizingSeries(preset.inputs);
    assert.ok(sizingSeries.length > 10);
    for (const pt of sizingSeries) {
      assert.ok((pt.cstrRequiredVolume_m3 ?? 0) > (pt.pfrRequiredVolume_m3 ?? 0));
    }
  }
});
