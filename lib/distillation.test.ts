import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DISTILLATION_INPUTS,
  DISTILLATION_PRESETS,
  calculateDistillation,
  calculateFenskeMinimumStages,
  calculateMinimumReflux,
  equilibriumLiquidX,
  equilibriumVaporY,
  generateMcCabeThieleDiagramData,
  generateProductFlowsVsFeedSeries,
  generateRefluxVsStagesSeries,
  generateRelativeVolatilityComparisonSeries,
  validateDistillationInputs,
} from './distillation';

test('1. VLE forward and inverse equations satisfy exact round-trip identity and mole fraction bounds', () => {
  const alphas = [1.2, 2.5, 4.0, 8.5];
  const xSamples = [0, 0.05, 0.2, 0.5, 0.75, 0.95, 1];

  for (const alpha of alphas) {
    assert.equal(equilibriumVaporY(0, alpha), 0);
    assert.equal(equilibriumVaporY(1, alpha), 1);
    assert.equal(equilibriumLiquidX(0, alpha), 0);
    assert.equal(equilibriumLiquidX(1, alpha), 1);

    for (const x of xSamples) {
      const y = equilibriumVaporY(x, alpha);
      assert.ok(y >= 0 && y <= 1, `y*=${y} must lie within [0, 1]`);
      if (x > 0 && x < 1) {
        assert.ok(y > x, `For alpha=${alpha} > 1 and 0 < x < 1, y* (${y}) must exceed x (${x})`);
      }
      const xRecovered = equilibriumLiquidX(y, alpha);
      assert.ok(
        Math.abs(xRecovered - x) < 1e-12,
        `Inverse VLE x*(y*(x))=${xRecovered} must match x=${x}`
      );
    }
  }
});

test('2. Overall and component material balances conserve total and light-component moles', () => {
  const res = calculateDistillation({
    feedFlow_kmol_h: 120,
    feedComposition_zF: 0.45,
    distillateComposition_xD: 0.96,
    bottomsComposition_xB: 0.04,
    relativeVolatility_alpha: 2.5,
    refluxRatio_R: 2.2,
    feedQuality_q: 1.0,
  });

  assert.equal(res.isValid, true);
  // Analytical check: D = 120 * (0.45 - 0.04) / (0.96 - 0.04) = 120 * 0.41 / 0.92 = 53.47826087
  const expectedD = (120 * (0.45 - 0.04)) / (0.96 - 0.04);
  const expectedB = 120 - expectedD;

  assert.ok(Math.abs(res.materialBalance.distillateFlow_kmol_h - expectedD) < 1e-10);
  assert.ok(Math.abs(res.materialBalance.bottomsFlow_kmol_h - expectedB) < 1e-10);
  assert.ok(res.materialBalance.totalBalanceResidual_kmol_h < 1e-12);
  assert.ok(res.materialBalance.componentBalanceResidual_kmol_h < 1e-12);
  assert.equal(res.materialBalance.isBalanced, true);
});

test('3. Rectifying and stripping operating lines match section material balances (L/V and L_bar/V_bar)', () => {
  const qValues = [1.0, 0.65, 0.25, 0.0];

  for (const q of qValues) {
    const inputs = {
      ...DEFAULT_DISTILLATION_INPUTS,
      refluxRatio_R: 2.6,
      feedQuality_q: q,
    };
    const res = calculateDistillation(inputs);
    assert.equal(res.isValid, true);

    const { rectifyingLiquid_L_kmol_h: L, rectifyingVapor_V_kmol_h: V, strippingLiquid_Lbar_kmol_h: Lbar, strippingVapor_Vbar_kmol_h: Vbar } =
      res.internalFlows;
    const { rectifyingSlope, rectifyingIntercept, strippingSlope, strippingIntercept, intersection_x, intersection_y } =
      res.operatingLines;

    // Rectifying operating line passes through (xD, xD) and has slope L/V = R/(R+1)
    assert.ok(Math.abs(rectifyingSlope - L / V) < 1e-12);
    const yAtXd = rectifyingSlope * inputs.distillateComposition_xD + rectifyingIntercept;
    assert.ok(Math.abs(yAtXd - inputs.distillateComposition_xD) < 1e-12);

    // Stripping section overall molar balance: Lbar - Vbar = B
    assert.ok(Math.abs(Lbar - Vbar - res.materialBalance.bottomsFlow_kmol_h) < 1e-10);

    // Stripping operating line passes through (xB, xB) and (intersection_x, intersection_y), and slope equals Lbar / Vbar
    const yAtXb = strippingSlope * inputs.bottomsComposition_xB + strippingIntercept;
    assert.ok(Math.abs(yAtXb - inputs.bottomsComposition_xB) < 1e-12);
    const yAtInt = strippingSlope * intersection_x + strippingIntercept;
    assert.ok(Math.abs(yAtInt - intersection_y) < 1e-12);
    assert.ok(
      Math.abs(strippingSlope - Lbar / Vbar) < 1e-10,
      `Stripping line slope ${strippingSlope} must equal Lbar/Vbar = ${Lbar / Vbar} at q=${q}`
    );
  }
});

test('4. Feed condition q-line handles q = 1 (vertical), q = 0 (horizontal), and 0 < q < 1 without singularity', () => {
  // Case A: q = 1 (saturated liquid -> vertical line x = zF)
  const resQ1 = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    feedQuality_q: 1.0,
  });
  assert.equal(resQ1.operatingLines.qLineIsVertical, true);
  assert.equal(resQ1.operatingLines.qLineIsHorizontal, false);
  assert.equal(resQ1.operatingLines.qLineSlope, null);
  assert.ok(Math.abs(resQ1.operatingLines.intersection_x - 0.5) < 1e-12);

  // Case B: q = 0 (saturated vapor -> horizontal line y = zF)
  const resQ0 = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    refluxRatio_R: 2.8,
    feedQuality_q: 0.0,
  });
  assert.equal(resQ0.operatingLines.qLineIsVertical, false);
  assert.equal(resQ0.operatingLines.qLineIsHorizontal, true);
  assert.equal(resQ0.operatingLines.qLineSlope, 0);
  assert.ok(Math.abs(resQ0.operatingLines.intersection_y - 0.5) < 1e-12);

  // Case C: q = 0.5 (partially vaporized -> slope = q/(q-1) = -1.0)
  const resQHalf = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    refluxRatio_R: 2.4,
    feedQuality_q: 0.5,
  });
  assert.equal(resQHalf.operatingLines.qLineIsVertical, false);
  assert.equal(resQHalf.operatingLines.qLineIsHorizontal, false);
  assert.ok(Math.abs((resQHalf.operatingLines.qLineSlope ?? 0) - -1.0) < 1e-12);
  // Verify intersection lies on q-line y = -1*x + 2*zF
  const expectedY =
    (resQHalf.operatingLines.qLineSlope ?? 0) * resQHalf.operatingLines.intersection_x +
    (resQHalf.operatingLines.qLineIntercept ?? 0);
  assert.ok(Math.abs(resQHalf.operatingLines.intersection_y - expectedY) < 1e-12);

  // Case D: Near-unity q = 0.99999999 remains numerically stable and approaches q = 1 smoothly
  const resNear1 = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    feedQuality_q: 0.9999999,
  });
  assert.ok(Math.abs(resNear1.operatingLines.intersection_x - resQ1.operatingLines.intersection_x) < 1e-6);
  assert.ok(Math.abs(resNear1.operatingLines.intersection_y - resQ1.operatingLines.intersection_y) < 1e-6);
});

test('5. Independent McCabe-Thiele analytical benchmark (alpha=2.5, zF=0.50, xD=0.95, xB=0.05, q=1.0, R=2.0)', () => {
  const res = calculateDistillation(DEFAULT_DISTILLATION_INPUTS);
  assert.equal(res.isValid, true);
  assert.equal(res.feasibilityStatus, 'feasible');
  assert.equal(res.stageCalculation.converged, true);

  // 1. Minimum reflux benchmark at q=1, zF=0.5, alpha=2.5:
  // y_pinch = 2.5*0.5 / (1 + 1.5*0.5) = 1.25 / 1.75 = 5/7 ≈ 0.7142857
  // R_min = (0.95 - 5/7) / (5/7 - 0.5) = 0.2357143 / 0.2142857 = 1.10 * (33/30) = 1.10? Wait:
  // (0.95 - 5/7) = (6.65 - 5)/7 = 1.65/7; (5/7 - 3.5/7) = 1.5/7 -> 1.65 / 1.5 = 1.10!
  const expectedYPinch = 2.5 * 0.5 / (1 + 1.5 * 0.5); // 5/7
  const expectedRmin = (0.95 - expectedYPinch) / (expectedYPinch - 0.5); // 1.10
  assert.ok(Math.abs((res.minimumReflux.minimumRefluxRatio_Rmin ?? 0) - expectedRmin) < 1e-12);

  // 2. Fenske minimum stages N_min = ln((0.95/0.05)^2) / ln(2.5) = 2 * ln(19) / ln(2.5) = 6.42545
  const expectedNmin = (2 * Math.log(19)) / Math.log(2.5);
  assert.ok(Math.abs((res.minimumReflux.fenskeMinimumStages_Nmin ?? 0) - expectedNmin) < 1e-12);

  // 3. Verify Stage 1 and Stage 2 analytical stepping coordinates:
  // Stage 1: y1 = xD = 0.95 -> x1 = 0.95 / (2.5 - 1.5*0.95) = 0.95 / 1.075 = 0.88372093
  // y2 = (2/3)*x1 + 0.95/3 = (2*0.88372093 + 0.95)/3 = 0.90581395
  const stages = res.stageCalculation.stages;
  assert.ok(stages.length > 0);
  assert.ok(Math.abs(stages[0].y_in - 0.95) < 1e-12);
  assert.ok(Math.abs(stages[0].x_eq - 0.95 / 1.075) < 1e-12);
  assert.ok(Math.abs(stages[0].y_next - (2 * (0.95 / 1.075) + 0.95) / 3) < 1e-12);

  // 4. Verify optimal feed stage transition occurs at first stage where x_eq <= x_int (0.50)
  const feedStage = res.stageCalculation.feedStageNumber!;
  assert.ok(feedStage >= 2 && feedStage < stages.length);
  assert.ok(stages[feedStage - 2].x_eq > 0.5, 'Stage above feed stage must have x_eq > x_int');
  assert.ok(stages[feedStage - 1].x_eq <= 0.5, 'Feed stage must be the first stage with x_eq <= x_int');
  assert.equal(stages[feedStage - 1].section, 'feed');

  // 5. Verify final stage reaches x_eq <= xB (0.05) and total stage count is 11 (with 10 column trays + 1 reboiler, 10.39 fractional stages)
  const lastStage = stages[stages.length - 1];
  assert.ok(lastStage.x_eq <= 0.05 && lastStage.x_prev > 0.05);
  assert.equal(res.stageCalculation.totalTheoreticalStages, 11);
  assert.equal(res.stageCalculation.columnTheoreticalTrays, 10);
  assert.equal(res.stageCalculation.feedStageNumber, 5);
  assert.equal(res.stageCalculation.fractionalTheoreticalStages?.toFixed(2), '10.39');
  assert.equal(
    res.stageCalculation.columnTheoreticalTrays,
    (res.stageCalculation.totalTheoreticalStages ?? 0) - 1
  );
  assert.ok(
    (res.stageCalculation.fractionalTheoreticalStages ?? 0) >
      (res.stageCalculation.totalTheoreticalStages ?? 0) - 1 &&
      (res.stageCalculation.fractionalTheoreticalStages ?? 0) <=
        (res.stageCalculation.totalTheoreticalStages ?? 0)
  );
});

test('6. Minimum reflux calculation and below-minimum-reflux pinch detection across feed qualities', () => {
  // At q = 1.0, zF = 0.5, xD = 0.95, alpha = 2.5 -> Rmin = 1.10
  // At q = 0.5 -> pinch x is lower, so Rmin must be strictly higher than at q = 1.0
  // At q = 0.0 -> pinch x is even lower, so Rmin must be strictly higher than at q = 0.5
  const rMinQ1 = calculateMinimumReflux(0.5, 0.95, 2.5, 1.0).minimumRefluxRatio_Rmin!;
  const rMinQ05 = calculateMinimumReflux(0.5, 0.95, 2.5, 0.5).minimumRefluxRatio_Rmin!;
  const rMinQ0 = calculateMinimumReflux(0.5, 0.95, 2.5, 0.0).minimumRefluxRatio_Rmin!;

  assert.ok(rMinQ1 < rMinQ05 && rMinQ05 < rMinQ0);

  // Operating below Rmin must report below_minimum_reflux and null stage counts (never finite stage count)
  const pinchedRes = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    refluxRatio_R: 0.95, // < Rmin = 1.10
  });
  assert.equal(pinchedRes.isValid, true);
  assert.equal(pinchedRes.feasibilityStatus, 'below_minimum_reflux');
  assert.equal(pinchedRes.stageCalculation.isFeasible, false);
  assert.equal(pinchedRes.stageCalculation.totalTheoreticalStages, null);
  assert.equal(pinchedRes.stageCalculation.fractionalTheoreticalStages, null);
  assert.equal(pinchedRes.stageCalculation.feedStageNumber, null);
  assert.ok(pinchedRes.validationIssues.some((i) => i.severity === 'warning'));
});

test('7. Increasing reflux ratio R monotonically reduces required theoretical stages toward Fenske N_min', () => {
  const rValues = [1.25, 1.5, 2.0, 3.0, 5.0, 10.0];
  let prevFractionalStages = Infinity;
  const fenskeNmin = calculateFenskeMinimumStages(0.95, 0.05, 2.5)!;

  for (const r of rValues) {
    const res = calculateDistillation({
      ...DEFAULT_DISTILLATION_INPUTS,
      refluxRatio_R: r,
    });
    assert.equal(res.stageCalculation.converged, true);
    const nFrac = res.stageCalculation.fractionalTheoreticalStages!;
    assert.ok(
      nFrac < prevFractionalStages,
      `Fractional stages at R=${r} (${nFrac}) should be less than at lower R (${prevFractionalStages})`
    );
    assert.ok(
      nFrac > fenskeNmin,
      `Fractional stages at finite R=${r} (${nFrac}) must exceed Fenske Nmin (${fenskeNmin})`
    );
    prevFractionalStages = nFrac;
  }
});

test('8. Near-unity relative volatility (alpha -> 1) emits close-boiling warning and requires more stages', () => {
  const easyRes = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    relativeVolatility_alpha: 3.5,
    refluxRatio_R: 3.0,
  });
  const hardRes = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    relativeVolatility_alpha: 1.6,
    refluxRatio_R: 3.0,
  });

  assert.ok(
    (hardRes.stageCalculation.fractionalTheoreticalStages ?? 0) >
      (easyRes.stageCalculation.fractionalTheoreticalStages ?? 0)
  );

  // Close-boiling alpha = 1.20 triggers volatility warning
  const issues = validateDistillationInputs({
    ...DEFAULT_DISTILLATION_INPUTS,
    relativeVolatility_alpha: 1.2,
  });
  assert.ok(issues.some((i) => i.field === 'volatility' && i.severity === 'warning'));
});

test('9. Input validation rejects physically invalid compositions, flow rates, volatility, and q bounds', () => {
  // xB >= zF
  const badOrder1 = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    bottomsComposition_xB: 0.55,
    feedComposition_zF: 0.5,
  });
  assert.equal(badOrder1.isValid, false);
  assert.equal(badOrder1.feasibilityStatus, 'invalid_specifications');

  // zF >= xD
  const badOrder2 = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    feedComposition_zF: 0.96,
    distillateComposition_xD: 0.95,
  });
  assert.equal(badOrder2.isValid, false);

  // alpha <= 1
  const badAlpha = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    relativeVolatility_alpha: 1.0,
  });
  assert.equal(badAlpha.isValid, false);

  // q outside [0, 1]
  const badQ = calculateDistillation({
    ...DEFAULT_DISTILLATION_INPUTS,
    feedQuality_q: 1.2,
  });
  assert.equal(badQ.isValid, false);
});

test('10. All built-in Distillation presets and chart series generators produce valid, consistent outputs', () => {
  assert.ok(DISTILLATION_PRESETS.length >= 7);

  for (const preset of DISTILLATION_PRESETS) {
    const res = calculateDistillation(preset.inputs);
    assert.equal(res.isValid, true, `Preset ${preset.id} must have valid inputs`);
    assert.equal(res.materialBalance.isBalanced, true);

    if (preset.id === 'infeasible-below-rmin') {
      assert.equal(res.feasibilityStatus, 'below_minimum_reflux');
      assert.equal(res.stageCalculation.converged, false);
    } else {
      assert.equal(res.stageCalculation.converged, true, `Preset ${preset.id} must converge`);
      assert.ok((res.stageCalculation.totalTheoreticalStages ?? 0) >= 2);
      assert.ok(res.stageCalculation.staircasePath.length >= 3);
    }
  }

  // Verify chart generators
  const baseRes = calculateDistillation(DEFAULT_DISTILLATION_INPUTS);
  const diagramData = generateMcCabeThieleDiagramData(DEFAULT_DISTILLATION_INPUTS, baseRes);
  assert.ok(diagramData.length >= 101);
  assert.equal(diagramData[0].x, 0);
  assert.equal(diagramData[diagramData.length - 1].x, 1);

  const volSeries = generateRelativeVolatilityComparisonSeries(2.5);
  assert.equal(volSeries.length, 51);

  const refluxSeries = generateRefluxVsStagesSeries(DEFAULT_DISTILLATION_INPUTS);
  assert.ok(refluxSeries.length >= 15);

  const flowSeries = generateProductFlowsVsFeedSeries(DEFAULT_DISTILLATION_INPUTS);
  assert.ok(flowSeries.length >= 15);
  for (const pt of flowSeries) {
    assert.ok(
      Math.abs(pt.distillateFlow_D_kmol_h + pt.bottomsFlow_B_kmol_h - 100) < 0.05
    );
  }
});

test('11. Distillation Guided Exploration Questions agree with verified baseline (N = 11, 10.39 fractional) and target scenario solver results', async () => {
  const { DISTILLATION_GUIDED_EXPLORATION_QUESTIONS } = await import('./labs-data');
  const baseRes = calculateDistillation(DEFAULT_DISTILLATION_INPUTS);
  assert.equal(baseRes.stageCalculation.totalTheoreticalStages, 11);
  assert.equal(baseRes.stageCalculation.fractionalTheoreticalStages?.toFixed(2), '10.39');

  for (const q of DISTILLATION_GUIDED_EXPLORATION_QUESTIONS) {
    const correctOptions = q.selfCheckOptions.filter((o) => o.isCorrect);
    assert.equal(
      correctOptions.length,
      1,
      `Question ${q.id} must have exactly one correct option`
    );

    const combinedText = [
      q.question,
      q.experimentPrompt,
      q.keyObservation,
      q.engineeringExplanation,
      ...q.selfCheckOptions.flatMap((o) => [o.label, o.feedback]),
    ].join(' ');

    assert.ok(
      !combinedText.includes('8.72') && !combinedText.includes('9 (8.72)'),
      `Question ${q.id} must not contain obsolete N = 9 (8.72) stage reference`
    );
  }

  // Verify Q01, Q02, Q03 explicitly reference the verified baseline 11 (10.39) and target solver values
  const [q1, q2, q3] = DISTILLATION_GUIDED_EXPLORATION_QUESTIONS;
  assert.ok(q1.experimentPrompt.includes('N = 11 stages / 10.39 fractional'));
  assert.ok(q1.selfCheckOptions[0].label.includes('from 11 (10.39) to 6 (5.59) stages'));
  assert.ok(q1.keyObservation.includes('from 11 (10.39 fractional) to 6 (5.59 fractional)'));

  assert.ok(q2.experimentPrompt.includes('N = 11 stages / 10.39 frac'));
  assert.ok(q2.selfCheckOptions[0].label.includes('from 11 (10.39) to 8 (7.79)'));
  assert.ok(q2.keyObservation.includes('from 11 (10.39 fractional) to 8 (7.79 fractional'));

  assert.ok(q3.selfCheckOptions[0].label.includes('19 stages at R = 1.18'));
  assert.ok(q3.selfCheckOptions[0].feedback.includes('19 stages (18.45 fractional) compared to 11 (10.39)'));
  assert.ok(q3.keyObservation.includes('from 11 (10.39) to 19 (18.45)'));
});

