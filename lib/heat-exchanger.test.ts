import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHeatExchanger,
  computeCountercurrentEffectiveness,
  DEFAULT_HEAT_EXCHANGER_INPUTS,
  generateSensitivitySeries,
  validateHeatExchangerInputs,
} from './heat-exchanger';

test('1. Unequal heat capacity rates (Cr != 1) matches independent reference calculation', () => {
  // Independent reference problem (countercurrent water-to-water):
  // Th_in = 120 °C, Tc_in = 25 °C, mh = 2.0 kg/s, mc = 1.5 kg/s, Cph = Cpc = 4.18 kJ/(kg·K), U = 850 W/(m²·K), A = 12.0 m²
  const res = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  assert.equal(res.isValid, true);

  // SI unit conversion check: kJ/(kg·K) -> J/(kg·K)
  // Ch = 2.0 * 4180 = 8360 W/K = 8.36 kW/K
  // Cc = 1.5 * 4180 = 6270 W/K = 6.27 kW/K
  assert.equal(res.Ch_W_K, 8360);
  assert.equal(res.Cc_W_K, 6270);
  assert.ok(Math.abs(res.Ch_kW_K - 8.36) < 1e-12);
  assert.ok(Math.abs(res.Cc_kW_K - 6.27) < 1e-12);
  assert.equal(res.Cmin_W_K, 6270);
  assert.equal(res.Cmax_W_K, 8360);
  assert.equal(res.limitingStream, 'Cold Stream');
  assert.ok(Math.abs(res.Cr - 0.75) < 1e-12);

  // UA = 850 * 12 = 10200 W/K; NTU = 10200 / 6270 = 1.6267942583732058
  const expectedNTU = 10200 / 6270;
  assert.ok(Math.abs(res.NTU - expectedNTU) < 1e-12);

  // ε = [1 - exp(-1.626794258 * 0.25)] / [1 - 0.75 * exp(-1.626794258 * 0.25)]
  const expTerm = Math.exp(-expectedNTU * 0.25);
  const expectedEps = (1 - expTerm) / (1 - 0.75 * expTerm);
  assert.ok(Math.abs(res.effectiveness - expectedEps) < 1e-12);
  assert.ok(Math.abs(res.effectiveness_pct - expectedEps * 100) < 1e-10);

  // Qmax = 6270 * (120 - 25) = 595,650 W = 595.65 kW
  assert.ok(Math.abs(res.Qmax_kW - 595.65) < 1e-9);
  assert.ok(Math.abs(res.Q_kW - expectedEps * 595.65) < 1e-9);
});

test('2. Equal heat capacity rates (Cr = 1) follows ε = NTU / (1 + NTU) and linear profiles', () => {
  const inputs = {
    Th_in: 140,
    Tc_in: 40,
    mh: 2.0,
    mc: 2.0,
    Cph_kJ: 4.0,
    Cpc_kJ: 4.0,
    U: 800,
    A: 10.0,
  };
  // Ch = Cc = 8000 W/K, UA = 8000 W/K => NTU = 1.0, Cr = 1.0
  // ε = 1 / (1 + 1) = 0.5, Q = 0.5 * 8000 * 100 = 400 kW
  const res = calculateHeatExchanger(inputs);
  assert.equal(res.isValid, true);
  assert.equal(res.Cr, 1);
  assert.equal(res.NTU, 1);
  assert.equal(res.limitingStream, 'Balanced (Ch = Cc)');
  assert.ok(Math.abs(res.effectiveness - 0.5) < 1e-12);
  assert.ok(Math.abs(res.Q_kW - 400) < 1e-9);
  assert.ok(Math.abs(res.Th_out - 90) < 1e-9);
  assert.ok(Math.abs(res.Tc_out - 90) < 1e-9);
  assert.ok(Math.abs(res.LMTD - 50) < 1e-9);

  // Constant local ΔT(x) = 50 °C across all axial points
  for (const pt of res.axialProfile) {
    assert.ok(Math.abs(pt.deltaT - 50) < 1e-3, `Expected linear constant ΔT=50, got ${pt.deltaT}`);
  }
});

test('3. Numerical stability when Cr approaches 1 across moderate and high NTU', () => {
  for (const ntu of [0.5, 2.5, 15, 1000]) {
    const exactAtOne = ntu / (1 + ntu);
    let prevEps = exactAtOne;

    for (const delta of [0, 1e-14, 1e-11, 1e-8, 1e-6, 1e-4, 1e-2]) {
      const cr = 1 - delta;
      const eps = computeCountercurrentEffectiveness(ntu, cr);
      assert.ok(Number.isFinite(eps), `ε must be finite for NTU=${ntu}, Cr=${cr}`);
      assert.ok(eps >= 0 && eps <= 1, `ε=${eps} must lie in [0, 1]`);
      // For countercurrent flow at fixed NTU, decreasing Cr (increasing delta) strictly increases or preserves ε
      assert.ok(
        eps + 1e-14 >= prevEps,
        `ε(${ntu}, ${cr})=${eps} should be monotonically non-decreasing as Cr decreases from 1 (prev=${prevEps})`
      );
      prevEps = eps;
    }
  }
});

test('4. Very small NTU and zero NTU handle cleanly without NaN or division by zero', () => {
  const zeroAreaRes = calculateHeatExchanger({
    ...DEFAULT_HEAT_EXCHANGER_INPUTS,
    A: 0,
  });
  assert.equal(zeroAreaRes.isValid, true);
  assert.equal(zeroAreaRes.NTU, 0);
  assert.equal(zeroAreaRes.effectiveness, 0);
  assert.equal(zeroAreaRes.Q_kW, 0);
  assert.equal(zeroAreaRes.Th_out, DEFAULT_HEAT_EXCHANGER_INPUTS.Th_in);
  assert.equal(zeroAreaRes.Tc_out, DEFAULT_HEAT_EXCHANGER_INPUTS.Tc_in);

  // Very small NTU (~1.35e-4)
  const tinyRes = calculateHeatExchanger({
    ...DEFAULT_HEAT_EXCHANGER_INPUTS,
    A: 0.0001,
  });
  assert.equal(tinyRes.isValid, true);
  assert.ok(tinyRes.NTU > 0 && tinyRes.NTU < 1e-3);
  // As NTU -> 0, ε -> NTU
  assert.ok(Math.abs(tinyRes.effectiveness - tinyRes.NTU) / tinyRes.NTU < 1e-3);
  assert.ok(tinyRes.energyBalanceResidual_W < 1e-9);
});

test('5. Large NTU (including negative gamma Cc < Ch) produces valid bounded temperatures without overflow', () => {
  // Large NTU with Cc < Ch (gamma < 0, tests negative-gamma overflow guard in axial profile)
  const highNtuColdMin = calculateHeatExchanger({
    Th_in: 150,
    Tc_in: 20,
    mh: 4.0,
    mc: 0.5,
    Cph_kJ: 4.0,
    Cpc_kJ: 4.0,
    U: 2500,
    A: 500, // UA = 1,250,000 W/K, Cc = 2,000 W/K => NTU = 625, gamma = -546.875
  });
  assert.equal(highNtuColdMin.isValid, true);
  assert.ok(highNtuColdMin.NTU > 500);
  assert.ok(highNtuColdMin.effectiveness <= 1 && highNtuColdMin.effectiveness > 0.9999);
  assert.ok(Number.isFinite(highNtuColdMin.LMTD) && highNtuColdMin.LMTD > 0);
  for (const pt of highNtuColdMin.axialProfile) {
    assert.ok(Number.isFinite(pt.Th) && Number.isFinite(pt.Tc), 'Axial points must be finite');
    assert.ok(pt.Th >= pt.Tc - 1e-3, 'Second law requires Th(x) >= Tc(x)');
  }

  // Large NTU with Ch < Cc (gamma > 0)
  const highNtuHotMin = calculateHeatExchanger({
    Th_in: 150,
    Tc_in: 20,
    mh: 0.5,
    mc: 4.0,
    Cph_kJ: 4.0,
    Cpc_kJ: 4.0,
    U: 2500,
    A: 500,
  });
  assert.equal(highNtuHotMin.isValid, true);
  for (const pt of highNtuHotMin.axialProfile) {
    assert.ok(Number.isFinite(pt.Th) && Number.isFinite(pt.Tc));
    assert.ok(pt.Th >= pt.Tc - 1e-3);
  }
});

test('6. Energy conservation, physical outlet bounds, approach consistency, and LMTD consistency', () => {
  const cases = [
    DEFAULT_HEAT_EXCHANGER_INPUTS,
    { Th_in: 165, Tc_in: 20, mh: 3.2, mc: 2.5, Cph_kJ: 2.15, Cpc_kJ: 4.18, U: 420, A: 18.0 },
    { Th_in: 130, Tc_in: 20, mh: 1.6, mc: 1.5, Cph_kJ: 4.18, Cpc_kJ: 4.18, U: 1200, A: 24.0 },
  ];

  for (const inputs of cases) {
    const res = calculateHeatExchanger(inputs);
    assert.equal(res.isValid, true);

    // First Law Energy Conservation: Q_hot == Q_cold == Q
    const Q_hot_W = res.Ch_W_K * (inputs.Th_in - res.Th_out);
    const Q_cold_W = res.Cc_W_K * (res.Tc_out - inputs.Tc_in);
    assert.ok(Math.abs(Q_hot_W - res.Q_W) < 1e-6);
    assert.ok(Math.abs(Q_cold_W - res.Q_W) < 1e-6);
    assert.ok(res.energyBalanceResidual_W < 1e-6);

    // Physical Outlet Temperature Bounds: Tc,in <= Th,out <= Th,in and Tc,in <= Tc,out <= Th,in
    assert.ok(res.Th_out >= inputs.Tc_in && res.Th_out <= inputs.Th_in);
    assert.ok(res.Tc_out >= inputs.Tc_in && res.Tc_out <= inputs.Th_in);

    // Approach Temperature Consistency
    assert.ok(Math.abs(res.approachTempHotEnd - (inputs.Th_in - res.Tc_out)) < 1e-9);
    assert.ok(Math.abs(res.approachTempColdEnd - (res.Th_out - inputs.Tc_in)) < 1e-9);
    assert.ok(res.approachTempHotEnd > 0 && res.approachTempColdEnd > 0);

    // LMTD Consistency: Q = U * A * LMTD
    const Q_from_LMTD_W = inputs.U * inputs.A * res.LMTD;
    assert.ok(Math.abs(Q_from_LMTD_W - res.Q_W) < 1e-4);
  }
});

test('7. Analytical axial temperature-profile endpoints match terminal stream temperatures', () => {
  const res = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  assert.equal(res.axialProfile.length, 21);

  const first = res.axialProfile[0];
  const last = res.axialProfile[res.axialProfile.length - 1];

  // At x/L = 0: Th = Th,in, Tc = Tc,out
  assert.equal(first.normalizedPosition, 0);
  assert.ok(Math.abs(first.Th - DEFAULT_HEAT_EXCHANGER_INPUTS.Th_in) < 1e-3);
  assert.ok(Math.abs(first.Tc - res.Tc_out) < 1e-3);
  assert.ok(Math.abs(first.deltaT - res.approachTempHotEnd) < 1e-3);

  // At x/L = 1: Th = Th,out, Tc = Tc,in
  assert.equal(last.normalizedPosition, 1);
  assert.ok(Math.abs(last.Th - res.Th_out) < 1e-3);
  assert.ok(Math.abs(last.Tc - DEFAULT_HEAT_EXCHANGER_INPUTS.Tc_in) < 1e-3);
  assert.ok(Math.abs(last.deltaT - res.approachTempColdEnd) < 1e-3);

  // Monotonically decreasing hot & cold temperatures along x/L from 0 to 1, with Th(x) > Tc(x)
  for (let i = 0; i < res.axialProfile.length; i++) {
    assert.ok(res.axialProfile[i].Th > res.axialProfile[i].Tc);
    if (i > 0) {
      assert.ok(res.axialProfile[i].Th < res.axialProfile[i - 1].Th);
      assert.ok(res.axialProfile[i].Tc < res.axialProfile[i - 1].Tc);
    }
  }
});

test('8. Input validation rejects invalid conditions and emits high-temperature water advisories', () => {
  // Inverted or equal inlet temperatures
  const equalTempIssues = validateHeatExchangerInputs({
    ...DEFAULT_HEAT_EXCHANGER_INPUTS,
    Th_in: 50,
    Tc_in: 50,
  });
  assert.ok(equalTempIssues.some((i) => i.severity === 'error' && i.field === 'Th_in'));

  // Non-positive mass flow and specific heat, negative U and A
  const badRes = calculateHeatExchanger({
    Th_in: 80,
    Tc_in: 20,
    mh: 0,
    mc: -1,
    Cph_kJ: 0,
    Cpc_kJ: -2,
    U: -10,
    A: -5,
  });
  assert.equal(badRes.isValid, false);
  assert.equal(badRes.validationIssues.filter((i) => i.severity === 'error').length, 6);

  // High-temperature water advisory when hot water > 100 °C
  const hotWaterRes = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  assert.ok(
    hotWaterRes.validationIssues.some(
      (i) => i.severity === 'warning' && i.message.includes('High-Temperature Aqueous Advisory')
    )
  );

  // High-temperature water advisory when thermal oil heats cold water above 100 °C
  const oilHeatingWaterAbove100 = calculateHeatExchanger({
    Th_in: 180,
    Tc_in: 30,
    mh: 4.0,
    mc: 1.0,
    Cph_kJ: 2.15,
    Cpc_kJ: 4.18,
    U: 600,
    A: 25.0,
  });
  assert.ok(oilHeatingWaterAbove100.Tc_out > 100);
  assert.ok(
    oilHeatingWaterAbove100.validationIssues.some(
      (i) => i.severity === 'warning' && i.message.includes('Calculated cold outlet')
    )
  );

  // No aqueous boiling warning when water stays below 100 °C
  const subBoilingRes = calculateHeatExchanger({
    Th_in: 85,
    Tc_in: 20,
    mh: 2.2,
    mc: 1.8,
    Cph_kJ: 4.18,
    Cpc_kJ: 4.18,
    U: 800,
    A: 10.0,
  });
  assert.equal(subBoilingRes.validationIssues.length, 0);
});

test('9. Independent textbook benchmark (countercurrent rating check with Cr = 0.9569, NTU = 2.0)', () => {
  // Hot oil (mh = 0.5 kg/s, Cph = 2.0 kJ/kg·K, Th,in = 150 °C) cooled by water (mc = 0.25 kg/s, Cpc = 4.18 kJ/kg·K, Tc,in = 20 °C)
  // U = 500 W/(m²·K), A = 4.0 m²
  // Ch = 1000 W/K, Cc = 1045 W/K => Cmin = 1000 W/K, Cmax = 1045 W/K, Cr = 1000/1045 ≈ 0.9569378
  // UA = 2000 W/K => NTU = 2.0
  // ε = [1 - exp(-2*(1 - 1000/1045))] / [1 - (1000/1045)*exp(-2*(1 - 1000/1045))] ≈ 0.6762340
  // Qmax = 1000 * 130 = 130 kW => Q ≈ 87.9104 kW
  // Th,out = 150 - 87.9104 / 1.0 ≈ 62.0896 °C
  // Tc,out = 20 + 87.9104 / 1.045 ≈ 104.1248 °C
  const res = calculateHeatExchanger({
    Th_in: 150,
    Tc_in: 20,
    mh: 0.5,
    mc: 0.25,
    Cph_kJ: 2.0,
    Cpc_kJ: 4.18,
    U: 500,
    A: 4.0,
  });
  const cr = 1000 / 1045;
  const expectedEps = (1 - Math.exp(-2 * (1 - cr))) / (1 - cr * Math.exp(-2 * (1 - cr)));
  assert.equal(res.isValid, true);
  assert.ok(Math.abs(res.Cr - cr) < 1e-12);
  assert.ok(Math.abs(res.NTU - 2.0) < 1e-12);
  assert.ok(Math.abs(res.effectiveness - expectedEps) < 1e-12);
  assert.ok(Math.abs(res.effectiveness - 0.676234) < 1e-6);
  assert.ok(Math.abs(res.Q_kW - 87.9104) < 1e-3);
  assert.ok(Math.abs(res.Th_out - 62.0896) < 1e-3);
  assert.ok(Math.abs(res.Tc_out - 104.1248) < 1e-3);
});

test('10. Sensitivity series dynamically encompasses custom parameter values above default range', () => {
  const customInputs = {
    ...DEFAULT_HEAT_EXCHANGER_INPUTS,
    A: 80,
  };
  const series = generateSensitivitySeries(customInputs, 'A', 20);
  assert.ok(series.length > 0);
  const maxPoint = series[series.length - 1];
  assert.ok(maxPoint.parameterValue >= 80);
});
