import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_GRAVITY_M_S2,
  DEFAULT_FLUID_MECHANICS_INPUTS,
  FLUID_MECHANICS_PRESETS,
  calculateFluidMechanics,
  solveColebrookWhite,
  generateFlowSweepSeries,
  generateMoodySeries,
} from './fluid-mechanics';

function approxEqual(actual: number, expected: number, tolerance: number, msg?: string) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${msg ?? 'Assertion failed'}: expected ${expected} ± ${tolerance}, got ${actual}`
  );
}

test('1. Flow area, average velocity, Reynolds number, and L/s to m³/s SI unit conversion', () => {
  const res = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    flowRate_L_s: 10.0,
    diameter_m: 0.08,
    density_kg_m3: 998.2,
    viscosity_Pa_s: 0.001002,
  });

  assert.equal(res.isValid, true);
  approxEqual(res.flowRate_m3_s, 0.01, 1e-12, 'flowRate_m3_s');

  const expectedArea = (Math.PI * 0.08 * 0.08) / 4;
  approxEqual(res.area_m2, expectedArea, 1e-12, 'area_m2');

  const expectedVel = 0.01 / expectedArea;
  approxEqual(res.velocity_m_s, expectedVel, 1e-10, 'velocity_m_s');

  const expectedRe = (998.2 * expectedVel * 0.08) / 0.001002;
  approxEqual(res.reynoldsNumber, expectedRe, 1e-6, 'reynoldsNumber');
  assert.equal(res.flowRegime, 'Turbulent');
});

test('2. Laminar flow uses exact Hagen-Poiseuille f_D = 64/Re independent of pipe roughness', () => {
  const smoothRes = calculateFluidMechanics({
    flowRate_L_s: 0.8,
    diameter_m: 0.05,
    length_m: 40,
    density_kg_m3: 1150,
    viscosity_Pa_s: 0.05,
    roughness_mm: 0.0,
    minorLossK: 2.0,
    elevationDiff_m: 0,
    pumpEfficiency_pct: 70,
  });

  const roughRes = calculateFluidMechanics({
    flowRate_L_s: 0.8,
    diameter_m: 0.05,
    length_m: 40,
    density_kg_m3: 1150,
    viscosity_Pa_s: 0.05,
    roughness_mm: 1.5,
    minorLossK: 2.0,
    elevationDiff_m: 0,
    pumpEfficiency_pct: 70,
  });

  assert.equal(smoothRes.isValid, true);
  assert.equal(smoothRes.flowRegime, 'Laminar');
  assert.ok(smoothRes.reynoldsNumber > 0 && smoothRes.reynoldsNumber < 2100);

  const expectedFd = 64 / smoothRes.reynoldsNumber;
  approxEqual(smoothRes.darcyFrictionFactor, expectedFd, 1e-12, 'Darcy f_D = 64/Re');
  approxEqual(smoothRes.fanningFrictionFactor, expectedFd / 4, 1e-12, 'Fanning f_F = f_D/4');
  approxEqual(
    roughRes.darcyFrictionFactor,
    smoothRes.darcyFrictionFactor,
    1e-12,
    'Laminar friction must be independent of roughness'
  );
});

test('3. Colebrook-White turbulent solver matches implicit residual and textbook benchmarks', () => {
  // Benchmark A: Smooth pipe (ε/D = 0), Re = 10^5 -> f_D ≈ 0.017990
  const fSmooth = solveColebrookWhite(1e5, 0);
  const residualSmooth =
    1 / Math.sqrt(fSmooth) + 2 * Math.log10(2.51 / (1e5 * Math.sqrt(fSmooth)));
  assert.ok(Math.abs(residualSmooth) < 1e-11, `Smooth residual too large: ${residualSmooth}`);
  approxEqual(fSmooth, 0.017990, 1e-5, 'Smooth pipe Re=1e5');

  // Benchmark B: ε/D = 0.002, Re = 10^5 -> f_D ≈ 0.025106
  const fRough = solveColebrookWhite(1e5, 0.002);
  const residualRough =
    1 / Math.sqrt(fRough) +
    2 * Math.log10(0.002 / 3.7 + 2.51 / (1e5 * Math.sqrt(fRough)));
  assert.ok(Math.abs(residualRough) < 1e-11, `Rough residual too large: ${residualRough}`);
  approxEqual(fRough, 0.025106, 1e-5, 'Rough pipe ε/D=0.002, Re=1e5');

  // Benchmark C: High Re = 10^7, fully rough ε/D = 0.01 -> von Karman-Nikuradse limit f = [ -2 log10(0.01/3.7) ]^-2 ≈ 0.03789
  const fFullyRough = solveColebrookWhite(1e7, 0.01);
  const vonKarman = Math.pow(-2 * Math.log10(0.01 / 3.7), -2);
  approxEqual(fFullyRough, vonKarman, 2e-4, 'Fully rough zone limit');
});

test('4. Major/minor head losses, frictional ΔP vs hydrostatic elevation, and pump power calculations', () => {
  const inputs = {
    flowRate_L_s: 10,
    diameter_m: 0.08,
    length_m: 120,
    density_kg_m3: 998.2,
    viscosity_Pa_s: 0.001002,
    roughness_mm: 0.045,
    minorLossK: 6.0,
    elevationDiff_m: 18.0,
    pumpEfficiency_pct: 75,
  };

  const res = calculateFluidMechanics(inputs);
  assert.equal(res.isValid, true);

  const g = STANDARD_GRAVITY_M_S2;
  const vh = (res.velocity_m_s * res.velocity_m_s) / (2 * g);
  approxEqual(res.velocityHead_m, vh, 1e-12, 'velocityHead_m');

  const expectedHf = res.darcyFrictionFactor * (120 / 0.08) * vh;
  const expectedHm = 6.0 * vh;
  approxEqual(res.majorHeadLoss_m, expectedHf, 1e-10, 'majorHeadLoss_m');
  approxEqual(res.minorHeadLoss_m, expectedHm, 1e-10, 'minorHeadLoss_m');
  approxEqual(res.totalFrictionHeadLoss_m, expectedHf + expectedHm, 1e-10, 'totalFrictionHeadLoss');

  // Frictional ΔP must NOT include hydrostatic Δz
  const expectedDeltaP_kPa = (998.2 * g * (expectedHf + expectedHm)) / 1000;
  const expectedElev_kPa = (998.2 * g * 18.0) / 1000;
  approxEqual(res.frictionalPressureLoss_kPa, expectedDeltaP_kPa, 1e-9, 'frictional ΔP');
  approxEqual(res.elevationPressure_kPa, expectedElev_kPa, 1e-9, 'elevation ΔP');

  // Required pump head H = Δz + hf + hm
  const expectedH = 18.0 + expectedHf + expectedHm;
  approxEqual(res.requiredPumpHead_m, expectedH, 1e-10, 'requiredPumpHead_m');
  approxEqual(
    res.totalPumpPressureRise_kPa,
    expectedDeltaP_kPa + expectedElev_kPa,
    1e-9,
    'total pump pressure rise'
  );

  // Hydraulic power Ph = ρ g Q H, Shaft power Ps = Ph / η
  const expectedPh_kW = (998.2 * g * 0.01 * expectedH) / 1000;
  const expectedPs_kW = expectedPh_kW / 0.75;
  approxEqual(res.hydraulicPower_kW, expectedPh_kW, 1e-10, 'hydraulicPower_kW');
  approxEqual(res.shaftPower_kW, expectedPs_kW, 1e-10, 'shaftPower_kW');
});

test('5. Pipe diameter reduction demonstrates strong head-loss sensitivity (~D^-5 scaling)', () => {
  const wide = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    diameter_m: 0.1,
    minorLossK: 0,
    elevationDiff_m: 0,
  });
  const narrow = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    diameter_m: 0.05,
    minorLossK: 0,
    elevationDiff_m: 0,
  });

  // Halving diameter raises velocity 4x and major head loss > 2^5 = 32x (even before Re/f adjustments)
  approxEqual(narrow.velocity_m_s / wide.velocity_m_s, 4.0, 1e-9, 'velocity quadruples');
  assert.ok(
    narrow.majorHeadLoss_m / wide.majorHeadLoss_m > 25,
    'Halving pipe diameter should drastically multiply major head loss'
  );
});

test('6. Zero-flow behavior handles cleanly with static elevation head preserved', () => {
  const res = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    flowRate_L_s: 0,
    elevationDiff_m: 12.5,
  });

  assert.equal(res.isValid, true);
  assert.equal(res.flowRegime, 'Zero Flow');
  assert.equal(res.velocity_m_s, 0);
  assert.equal(res.reynoldsNumber, 0);
  assert.equal(res.darcyFrictionFactor, 0);
  assert.equal(res.majorHeadLoss_m, 0);
  assert.equal(res.minorHeadLoss_m, 0);
  assert.equal(res.frictionalPressureLoss_kPa, 0);
  assert.equal(res.requiredPumpHead_m, 12.5);
  assert.equal(res.hydraulicPower_kW, 0);
  assert.equal(res.shaftPower_kW, 0);
  assert.ok(
    res.validationIssues.some((i) => i.severity === 'warning' && i.message.includes('Zero-Flow'))
  );
});

test('7. Transitional regime (2100 <= Re <= 4000) emits explicit uncertainty warning', () => {
  // Choose Q so Re ≈ 3000 for D = 0.05 m, water at 20 °C:
  // v = 3000 * 0.001002 / (998.2 * 0.05) = 0.060228 m/s -> Q = v * pi * 0.05^2 / 4 * 1000 = 0.11825 L/s
  const res = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    flowRate_L_s: 0.11825,
    diameter_m: 0.05,
  });

  assert.equal(res.isValid, true);
  assert.equal(res.flowRegime, 'Transitional');
  assert.ok(res.reynoldsNumber >= 2100 && res.reynoldsNumber <= 4000);
  assert.ok(
    res.validationIssues.some(
      (i) =>
        i.severity === 'warning' &&
        i.message.includes('Transitional Flow Advisory') &&
        i.message.includes('uncertainty')
    ),
    'Expected transitional flow uncertainty warning'
  );
});

test('8. Input validation rejects invalid physical values cleanly', () => {
  const negativeFlow = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    flowRate_L_s: -1,
  });
  assert.equal(negativeFlow.isValid, false);

  const zeroDiameter = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    diameter_m: 0,
  });
  assert.equal(zeroDiameter.isValid, false);

  const negativeElevation = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    elevationDiff_m: -5,
  });
  assert.equal(negativeElevation.isValid, false);

  const badEfficiency = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    pumpEfficiency_pct: 105,
  });
  assert.equal(badEfficiency.isValid, false);

  const excessiveRoughness = calculateFluidMechanics({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
    diameter_m: 0.05,
    roughness_mm: 30, // ε/D = 0.6 >= 0.5
  });
  assert.equal(excessiveRoughness.isValid, false);
});

test('9. Flow sweep and Moody-diagram generators stay physically consistent', () => {
  const sweep = generateFlowSweepSeries(DEFAULT_FLUID_MECHANICS_INPUTS, 20);
  assert.ok(sweep.length >= 20);
  assert.ok(sweep.some((p) => p.flowRate_L_s === DEFAULT_FLUID_MECHANICS_INPUTS.flowRate_L_s));

  // Verify pressure loss increases monotonically with flow rate
  for (let i = 1; i < sweep.length; i++) {
    assert.ok(sweep[i].frictionalPressureLoss_kPa >= sweep[i - 1].frictionalPressureLoss_kPa);
    assert.ok(sweep[i].reynoldsNumber >= sweep[i - 1].reynoldsNumber);
  }

  // Verify Moody series separates laminar and turbulent curves (never fabricates transitional bridge)
  const moody = generateMoodySeries(0.0005625);
  const laminarPts = moody.filter((p) => p.reynoldsNumber <= 2100);
  const turbulentPts = moody.filter((p) => p.reynoldsNumber >= 4000);
  assert.ok(laminarPts.length > 0 && turbulentPts.length > 0);
  assert.ok(laminarPts.every((p) => p.laminarFriction !== null && p.turbulentCurrentRoughness === null));
  assert.ok(
    turbulentPts.every((p) => p.laminarFriction === null && p.turbulentCurrentRoughness !== null)
  );
  assert.ok(
    moody.every((p) => p.reynoldsNumber <= 2100 || p.reynoldsNumber >= 4000),
    'Moody series must not draw an arbitrary continuous curve inside (2100, 4000)'
  );
});

test('10. All built-in Fluid Mechanics presets produce valid, finite SI results', () => {
  for (const preset of FLUID_MECHANICS_PRESETS) {
    const res = calculateFluidMechanics(preset.inputs);
    assert.equal(res.isValid, true, `Preset ${preset.id} should be valid`);
    assert.ok(Number.isFinite(res.frictionalPressureLoss_kPa));
    assert.ok(Number.isFinite(res.requiredPumpHead_m));
    assert.ok(Number.isFinite(res.shaftPower_kW));
  }
});
