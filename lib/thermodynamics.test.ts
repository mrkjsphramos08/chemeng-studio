import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAS_CONSTANT_R,
  THERMO_REFERENCE_FLUIDS,
  THERMO_PVT_PRESETS,
  THERMO_VLE_PRESETS,
  calculatePureFluidPVT,
  calculatePengRobinsonPressureFromVolume,
  evaluatePRCubicPolynomial,
  generatePressureSweepSeries,
  generatePVIsothermSeries,
  calculateBinaryVLE,
  generateBinaryPxySeries,
} from './thermodynamics';

// ============================================================================
// MODULE A TESTS: PURE-FLUID PVT & PENG–ROBINSON EOS
// ============================================================================

test('Thermodynamics PVT — Ideal gas molar volume v_ideal = RT/P and Z_ideal = 1', () => {
  const T = 300.0; // K
  const P = 100000.0; // 1 bar = 100,000 Pa
  const res = calculatePureFluidPVT({
    fluidId: 'N2',
    temperature_K: T,
    pressure_Pa: P,
    moles_n: 2.5,
  });

  const expectedV = (GAS_CONSTANT_R * T) / P;
  assert.ok(Math.abs(res.idealMolarVolume_m3_mol - expectedV) < 1e-12);
  assert.equal(res.idealCompressibilityFactor_Z, 1.0);
  assert.ok(Math.abs(res.totalVolumeIdeal_L - expectedV * 2.5 * 1000) < 1e-9);
});

test('Thermodynamics PVT — Compressibility factor identity Z = P*v_PR / (R*T)', () => {
  const res = calculatePureFluidPVT({
    fluidId: 'CO2',
    temperature_K: 320.0,
    pressure_Pa: 50.0e5,
  });

  const zFromPVRT =
    (res.pressure_Pa * res.prMolarVolume_m3_mol) /
    (GAS_CONSTANT_R * res.temperature_K);
  assert.ok(
    Math.abs(res.compressibilityFactor_Z - zFromPVRT) < 1e-12,
    `Expected Z = Pv/(RT), got ${res.compressibilityFactor_Z} vs ${zFromPVRT}`
  );
});

test('Thermodynamics PVT — Peng–Robinson parameters a, b, kappa, alpha, A, B and cubic coefficients', () => {
  const fluid = THERMO_REFERENCE_FLUIDS.CO2;
  const T = 310.0;
  const P = 40.0e5;

  const res = calculatePureFluidPVT({
    fluidId: 'CO2',
    temperature_K: T,
    pressure_Pa: P,
  });

  const expectedTr = T / fluid.Tc_K;
  const expectedPr = P / fluid.Pc_Pa;
  const expectedKappa =
    0.37464 + 1.54226 * fluid.omega - 0.26992 * fluid.omega * fluid.omega;
  const expectedAlpha = Math.pow(1 + expectedKappa * (1 - Math.sqrt(expectedTr)), 2);
  const expectedAcrit =
    (0.45724 * GAS_CONSTANT_R * GAS_CONSTANT_R * fluid.Tc_K * fluid.Tc_K) /
    fluid.Pc_Pa;
  const expectedB = (0.0778 * GAS_CONSTANT_R * fluid.Tc_K) / fluid.Pc_Pa;
  const expectedDimA =
    (expectedAcrit * expectedAlpha * P) / (GAS_CONSTANT_R * GAS_CONSTANT_R * T * T);
  const expectedDimB = (expectedB * P) / (GAS_CONSTANT_R * T);

  assert.ok(Math.abs(res.reducedTemperature_Tr - expectedTr) < 1e-12);
  assert.ok(Math.abs(res.reducedPressure_Pr - expectedPr) < 1e-12);
  assert.ok(Math.abs(res.kappa - expectedKappa) < 1e-12);
  assert.ok(Math.abs(res.alpha - expectedAlpha) < 1e-12);
  assert.ok(Math.abs(res.a_critical_Pa_m6_mol2 - expectedAcrit) < 1e-12);
  assert.ok(Math.abs(res.b_m3_mol - expectedB) < 1e-12);
  assert.ok(Math.abs(res.dimensionless_A - expectedDimA) < 1e-12);
  assert.ok(Math.abs(res.dimensionless_B - expectedDimB) < 1e-12);

  // Verify cubic coefficients Z^3 - (1-B)Z^2 + (A - 3B^2 - 2B)Z - (AB - B^2 - B^3) = 0
  assert.ok(Math.abs(res.cubicCoefficients.c2 - -(1 - expectedDimB)) < 1e-12);
  assert.ok(
    Math.abs(
      res.cubicCoefficients.c1 -
        (expectedDimA - 3 * expectedDimB * expectedDimB - 2 * expectedDimB)
    ) < 1e-12
  );
  assert.ok(
    Math.abs(
      res.cubicCoefficients.c0 -
        -(
          expectedDimA * expectedDimB -
          expectedDimB * expectedDimB -
          Math.pow(expectedDimB, 3)
        )
    ) < 1e-12
  );
});

test('Thermodynamics PVT — Real root residuals satisfy |f(Z)| < 1e-11 and reconstruct P(T,v) accurately', () => {
  for (const preset of THERMO_PVT_PRESETS) {
    const res = calculatePureFluidPVT(preset.inputs);
    assert.equal(res.isValid, true);
    assert.ok(
      res.rootDiagnosis.maxResidual < 1e-11,
      `Cubic residual too large for preset ${preset.id}: ${res.rootDiagnosis.maxResidual}`
    );

    const { c2, c1, c0 } = res.cubicCoefficients;
    for (const rootZ of res.rootDiagnosis.rawRealRoots_Z) {
      const polyVal = evaluatePRCubicPolynomial(rootZ, c2, c1, c0);
      assert.ok(Math.abs(polyVal) < 1e-11);
    }

    assert.ok(
      res.pressureReconstructionRelativeError < 1e-10,
      `Explicit P(T,v) reconstruction error too high for ${preset.id}: ${res.pressureReconstructionRelativeError}`
    );
  }
});

test('Thermodynamics PVT — Subcritical multi-root handling separates vapor-like and liquid-like branches', () => {
  // Subcritical CO2 at 280 K (Tr = 0.9207) and 42 bar
  const vaporRes = calculatePureFluidPVT({
    fluidId: 'CO2',
    temperature_K: 280.0,
    pressure_Pa: 42.0e5,
    rootPreference: 'vapor',
  });

  assert.equal(vaporRes.rootDiagnosis.rootCount, 3);
  assert.equal(vaporRes.rootDiagnosis.hasMultipleValidRoots, true);
  assert.ok(vaporRes.rootDiagnosis.liquidLikeRoot_Z !== null);
  assert.ok(
    vaporRes.rootDiagnosis.vaporLikeRoot_Z > vaporRes.rootDiagnosis.liquidLikeRoot_Z!,
    'Vapor root Z_max must exceed liquid root Z_min'
  );
  assert.equal(
    vaporRes.compressibilityFactor_Z,
    vaporRes.rootDiagnosis.vaporLikeRoot_Z
  );

  // Selecting liquid root preference switches active Z to Z_liquid
  const liquidRes = calculatePureFluidPVT({
    fluidId: 'CO2',
    temperature_K: 280.0,
    pressure_Pa: 42.0e5,
    rootPreference: 'liquid',
  });
  assert.equal(
    liquidRes.compressibilityFactor_Z,
    liquidRes.rootDiagnosis.liquidLikeRoot_Z
  );
  assert.ok(liquidRes.prMolarVolume_m3_mol > liquidRes.b_m3_mol);
  assert.ok(
    liquidRes.advisories.some((msg) => msg.includes('Subcritical 3-Root Domain')),
    'Should emit subcritical multi-root advisory'
  );
});

test('Thermodynamics PVT — Low-pressure convergence toward ideal-gas behavior (Z -> 1 as P -> 0)', () => {
  const fluidIds = ['CO2', 'N2', 'CH4', 'C2H6'] as const;
  for (const fluidId of fluidIds) {
    const res = calculatePureFluidPVT({
      fluidId,
      temperature_K: 350.0,
      pressure_Pa: 1000.0, // 0.01 bar
    });
    assert.ok(
      Math.abs(res.compressibilityFactor_Z - 1.0) < 1e-4,
      `Expected Z -> 1 at 0.01 bar for ${fluidId}, got ${res.compressibilityFactor_Z}`
    );
    assert.ok(Math.abs(res.volumeDeviationPercent) < 0.01);
  }
});

test('Thermodynamics PVT — Physical molar volume restriction (v > b) and invalid input handling', () => {
  const res = calculatePureFluidPVT({
    fluidId: 'CO2',
    temperature_K: 300.0,
    pressure_Pa: 50.0e5,
  });

  // Every valid physical root satisfies Z > B <=> v > b
  for (const validZ of res.rootDiagnosis.validPhysicalRoots_Z) {
    assert.ok(validZ > res.dimensionless_B);
  }
  assert.ok(res.covolumeRatio_v_over_b > 1.0);

  // Explicit P(T,v) throws if v <= b
  assert.throws(() => {
    calculatePengRobinsonPressureFromVolume(
      300.0,
      res.b_m3_mol * 0.95,
      res.a_alpha_Pa_m6_mol2,
      res.b_m3_mol
    );
  }, /Nonphysical molar volume/);

  // Negative temperature or pressure flags validation errors
  const invalidRes = calculatePureFluidPVT({
    fluidId: 'CO2',
    temperature_K: -10,
    pressure_Pa: 0,
  });
  assert.equal(invalidRes.isValid, false);
  assert.ok(invalidRes.validationErrors.length >= 2);
});

test('Thermodynamics PVT — Near-critical detection and reference fluid fixtures', () => {
  const co2NearCrit = calculatePureFluidPVT({
    fluidId: 'CO2',
    temperature_K: 304.5,
    pressure_Pa: 73.8e5,
  });
  assert.equal(co2NearCrit.isNearCritical, true);
  assert.ok(co2NearCrit.advisories.some((a) => a.includes('Near-Critical')));

  // Verify all 4 reference fluids have complete published constants and sources
  const fluidIds = ['CO2', 'N2', 'CH4', 'C2H6'] as const;
  for (const id of fluidIds) {
    const f = THERMO_REFERENCE_FLUIDS[id];
    assert.ok(f.Tc_K > 100);
    assert.ok(f.Pc_Pa > 3e6);
    assert.ok(f.omega > 0 && f.omega < 1);
    assert.ok(f.referenceSource.includes('NIST'));
  }

  const sweep = generatePressureSweepSeries('CO2', 320, 60e5, 'vapor', 25);
  assert.equal(sweep.length, 25);
  const isotherms = generatePVIsothermSeries('CO2', 310, 30);
  assert.equal(isotherms.points.length, 30);
});

// ============================================================================
// MODULE B TESTS: IDEAL BINARY VLE (RAOULT'S & DALTON'S LAWS)
// ============================================================================

test('Thermodynamics Binary VLE — Raoult and Dalton partial pressures, bubble pressure, and dew pressure', () => {
  const res = calculateBinaryVLE({
    liquidMoleFraction_xA: 0.4,
    psatA_kPa: 150.0,
    psatB_kPa: 50.0,
    systemPressure_kPa: 80.0,
  });

  assert.equal(res.isValid, true);
  // p_A = 0.4 * 150 = 60 kPa; p_B = 0.6 * 50 = 30 kPa; P_bubble = 90 kPa
  assert.ok(Math.abs(res.partialPressureA_kPa - 60.0) < 1e-12);
  assert.ok(Math.abs(res.partialPressureB_kPa - 30.0) < 1e-12);
  assert.ok(Math.abs(res.bubblePressure_kPa - 90.0) < 1e-12);

  // Equilibrium vapor at bubble point: y_A = 60 / 90 = 2/3
  assert.ok(Math.abs(res.equilibriumVapor_yA - 2.0 / 3.0) < 1e-12);
  assert.ok(Math.abs(res.equilibriumVapor_yA + res.equilibriumVapor_yB - 1.0) < 1e-12);
  assert.ok(Math.abs(res.xA + res.xB - 1.0) < 1e-12);

  // Dew pressure at y_A = 0.4: 1/P_dew = 0.4/150 + 0.6/50 = (0.4 + 1.8)/150 = 2.2/150 => P_dew = 150/2.2 = 68.1818 kPa
  const expectedPdew = 150.0 / 2.2;
  assert.ok(Math.abs(res.dewPressureAtComposition_kPa - expectedPdew) < 1e-10);
  assert.ok(
    Math.abs(res.equilibriumLiquidAtDew_xA + res.equilibriumLiquidAtDew_xB - 1.0) <
      1e-12
  );

  // Since P_dew (68.18 kPa) <= P_sys (80.0 kPa) <= P_bubble (90.0 kPa), state is Two-Phase VLE
  assert.equal(
    res.phaseStateAtSystemPressure,
    'Two-Phase Vapor–Liquid Equilibrium'
  );
  // Tie-line at P_sys = 80 kPa: x_tie = (80 - 50)/(150 - 50) = 0.30; y_tie = 0.30 * 150 / 80 = 0.5625
  assert.ok(Math.abs((res.tieLineLiquid_xA ?? 0) - 0.3) < 1e-12);
  assert.ok(Math.abs((res.tieLineVapor_yA ?? 0) - 0.5625) < 1e-12);
});

test('Thermodynamics Binary VLE — Equal saturation pressure limiting case (P_A^sat = P_B^sat)', () => {
  const res = calculateBinaryVLE({
    liquidMoleFraction_xA: 0.65,
    psatA_kPa: 100.0,
    psatB_kPa: 100.0,
    systemPressure_kPa: 100.0,
  });

  assert.ok(Math.abs(res.relativeVolatility_alphaAB - 1.0) < 1e-12);
  assert.ok(Math.abs(res.bubblePressure_kPa - 100.0) < 1e-12);
  assert.ok(Math.abs(res.dewPressureAtComposition_kPa - 100.0) < 1e-12);
  assert.ok(Math.abs(res.equilibriumVapor_yA - 0.65) < 1e-12);
});

test('Thermodynamics Binary VLE — Pure endpoints (x_A = 0 and x_A = 1) and P-x-y curve consistency', () => {
  const pureB = calculateBinaryVLE({
    liquidMoleFraction_xA: 0.0,
    psatA_kPa: 140.0,
    psatB_kPa: 60.0,
    systemPressure_kPa: 60.0,
  });
  assert.ok(Math.abs(pureB.bubblePressure_kPa - 60.0) < 1e-12);
  assert.ok(Math.abs(pureB.dewPressureAtComposition_kPa - 60.0) < 1e-12);
  assert.ok(Math.abs(pureB.equilibriumVapor_yA - 0.0) < 1e-12);

  const pureA = calculateBinaryVLE({
    liquidMoleFraction_xA: 1.0,
    psatA_kPa: 140.0,
    psatB_kPa: 60.0,
    systemPressure_kPa: 140.0,
  });
  assert.ok(Math.abs(pureA.bubblePressure_kPa - 140.0) < 1e-12);
  assert.ok(Math.abs(pureA.dewPressureAtComposition_kPa - 140.0) < 1e-12);
  assert.ok(Math.abs(pureA.equilibriumVapor_yA - 1.0) < 1e-12);

  const pxy = generateBinaryPxySeries(140.0, 60.0, 51);
  assert.equal(pxy.length, 51);
  assert.equal(pxy[0].bubblePressure_kPa, 60.0);
  assert.equal(pxy[0].dewPressure_kPa, 60.0);
  assert.equal(pxy[50].bubblePressure_kPa, 140.0);
  assert.equal(pxy[50].dewPressure_kPa, 140.0);

  // For all intermediate compositions 0 < x < 1 with P_A^sat != P_B^sat, P_bubble > P_dew
  for (let i = 1; i < 50; i++) {
    assert.ok(
      pxy[i].bubblePressure_kPa > pxy[i].dewPressure_kPa,
      `Expected P_bubble > P_dew at index ${i}`
    );
  }

  for (const preset of THERMO_VLE_PRESETS) {
    const presetRes = calculateBinaryVLE(preset.inputs);
    assert.equal(presetRes.isValid, true);
  }
});
