import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HERO_DEFAULT_CONTROL_INPUTS,
  HERO_DEFAULT_PVT_INPUTS,
  HERO_PREVIEW_LABS,
  buildHeroPreviewLabs,
} from './hero-preview';
import {
  DEFAULT_HEAT_EXCHANGER_INPUTS,
  calculateHeatExchanger,
} from './heat-exchanger';
import {
  DEFAULT_FLUID_MECHANICS_INPUTS,
  calculateFluidMechanics,
} from './fluid-mechanics';
import {
  DEFAULT_REACTION_ENGINEERING_INPUTS,
  calculateReactionEngineering,
} from './reaction-engineering';
import {
  DEFAULT_DISTILLATION_INPUTS,
  calculateDistillation,
} from './distillation';
import { calculatePureFluidPVT } from './thermodynamics';
import {
  PROCESS_CONTROL_PRESETS,
  simulateProcessControl,
} from './process-control';
import {
  GUIDED_EXPLORATION_QUESTIONS,
  PROCESS_CONTROL_GUIDED_QUESTIONS,
} from './labs-data';
import { formatSignedZero } from './navigation';

test('NEW-01: Landing Hero preview has all 6 labs and matches exact baseline solver outputs', () => {
  const rebuilt = buildHeroPreviewLabs();
  assert.equal(HERO_PREVIEW_LABS.length, 6);
  assert.deepEqual(
    HERO_PREVIEW_LABS.map((l) => l.id),
    [
      'heat-exchanger',
      'fluid-mechanics',
      'reaction-engineering',
      'distillation',
      'thermodynamics',
      'process-control',
    ]
  );
  assert.deepEqual(rebuilt, HERO_PREVIEW_LABS);

  // 1. Heat Exchanger
  const hx = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  const hxTab = HERO_PREVIEW_LABS[0];
  assert.equal(hxTab.metrics[0].value, `${hx.Q_kW.toFixed(2)} kW`);
  assert.equal(hxTab.metrics[1].value, `${hx.effectiveness_pct.toFixed(2)}%`);
  assert.ok(hxTab.metrics[1].sub.includes(hx.NTU.toFixed(3)));
  assert.ok(hxTab.metrics[1].sub.includes(hx.Cr.toFixed(3)));
  assert.equal(hxTab.metrics[2].value, `${hx.Th_out.toFixed(2)} °C`);
  assert.equal(hxTab.metrics[3].value, `${hx.Tc_out.toFixed(2)} °C`);
  assert.equal(hxTab.rawMetrics.Q_kW, hx.Q_kW);

  // 2. Fluid Mechanics
  const fm = calculateFluidMechanics(DEFAULT_FLUID_MECHANICS_INPUTS);
  const fmTab = HERO_PREVIEW_LABS[1];
  assert.equal(
    fmTab.metrics[0].value,
    Math.round(fm.reynoldsNumber).toLocaleString('en-US')
  );
  assert.equal(fmTab.metrics[1].value, fm.darcyFrictionFactor.toFixed(4));
  assert.equal(
    fmTab.metrics[2].value,
    `${fm.frictionalPressureLoss_kPa.toFixed(2)} kPa`
  );
  assert.equal(fmTab.metrics[3].value, `${fm.requiredPumpHead_m.toFixed(2)} m`);
  assert.ok(fmTab.metrics[3].sub.includes(`${fm.shaftPower_kW.toFixed(2)} kW`));
  assert.equal(fmTab.rawMetrics.reynoldsNumber, fm.reynoldsNumber);

  // 3. Reaction Engineering
  const rx = calculateReactionEngineering(DEFAULT_REACTION_ENGINEERING_INPUTS);
  const rxPfr = rx.pfrAtCurrentVolume ?? rx.pfrAtBatchTime;
  const rxCstr = rx.cstrAtCurrentVolume ?? rx.cstrAtBatchTime;
  const rxTab = HERO_PREVIEW_LABS[2];
  assert.equal(rxTab.metrics[0].value, rxPfr.damkohlerNumber.toFixed(3));
  assert.equal(rxTab.metrics[1].value, `${rxPfr.conversion_pct.toFixed(2)}%`);
  assert.ok(
    rxTab.metrics[1].sub.includes(
      rxPfr.outletConcentration_mol_m3.toFixed(2)
    )
  );
  assert.equal(rxTab.metrics[2].value, `${rxCstr.conversion_pct.toFixed(2)}%`);
  assert.ok(
    rxTab.metrics[2].sub.includes(
      rxCstr.outletConcentration_mol_m3.toFixed(2)
    )
  );
  assert.equal(
    rxTab.metrics[3].value,
    `${(rx.targetDesign.cstrToPfrVolumeRatio ?? 0).toFixed(2)}×`
  );

  // 4. Distillation
  const dist = calculateDistillation(DEFAULT_DISTILLATION_INPUTS);
  const distTab = HERO_PREVIEW_LABS[3];
  assert.equal(
    distTab.metrics[0].value,
    `${dist.stageCalculation.totalTheoreticalStages} Stages`
  );
  assert.ok(
    distTab.metrics[0].sub.includes(
      dist.stageCalculation.fractionalTheoreticalStages!.toFixed(2)
    )
  );
  assert.equal(
    distTab.metrics[1].value,
    `Stage ${dist.stageCalculation.feedStageNumber}`
  );
  assert.equal(
    distTab.metrics[2].value,
    dist.minimumReflux.minimumRefluxRatio_Rmin!.toFixed(3)
  );
  assert.ok(
    distTab.metrics[2].sub.includes(
      dist.minimumReflux.operatingToMinRefluxRatio!.toFixed(2)
    )
  );
  assert.equal(
    distTab.metrics[3].value,
    `${dist.materialBalance.distillateFlow_kmol_h.toFixed(1)} / ${dist.materialBalance.bottomsFlow_kmol_h.toFixed(1)}`
  );

  // 5. Thermodynamics
  const pvt = calculatePureFluidPVT(HERO_DEFAULT_PVT_INPUTS);
  const pvtTab = HERO_PREVIEW_LABS[4];
  assert.equal(pvtTab.metrics[0].value, pvt.compressibilityFactor_Z.toFixed(4));
  assert.equal(
    pvtTab.metrics[1].value,
    `${pvt.prMolarVolume_L_mol.toFixed(4)} L/mol`
  );
  assert.ok(
    pvtTab.metrics[1].sub.includes(pvt.idealMolarVolume_L_mol.toFixed(4))
  );
  assert.equal(
    pvtTab.metrics[2].value,
    `−${Math.abs(pvt.volumeDeviationPercent).toFixed(2)}%`
  );
  assert.equal(
    pvtTab.metrics[3].value,
    `${pvt.reducedTemperature_Tr.toFixed(3)}, ${pvt.reducedPressure_Pr.toFixed(3)}`
  );
  assert.equal(pvtTab.metrics[3].sub, pvt.regime);

  // 6. Process Control
  const pc = simulateProcessControl(HERO_DEFAULT_CONTROL_INPUTS);
  const pcTab = HERO_PREVIEW_LABS[5];
  assert.equal(
    pcTab.metrics[0].value,
    `${formatSignedZero(pc.metrics.steadyStateError_ess, 2, { positivePrefix: true })}%`
  );
  assert.equal(
    pcTab.metrics[1].value,
    `${pc.metrics.riseTime_10_90_s!.toFixed(2)} s`
  );
  assert.equal(
    pcTab.metrics[2].value,
    `${pc.metrics.overshootPercent!.toFixed(1)}%`
  );
  assert.equal(
    pcTab.metrics[3].value,
    pc.controllabilityRatio_theta_over_tau.toFixed(3)
  );
  assert.ok(
    pcTab.metrics[3].sub.includes(pc.metrics.settlingTime_2pct_s!.toFixed(1))
  );
  assert.ok(pcTab.metrics[3].sub.includes(pc.metrics.iae.toFixed(1)));
});

test('NEW-01: Landing Hero preview does not retain stale mismatched metrics', () => {
  const serialized = JSON.stringify(HERO_PREVIEW_LABS);
  const staleTokens = [
    '317,831',
    '0.01800',
    '14.51 m',
    '29.51 m',
    '2.26×',
    '12 Stages',
    'Stage 6',
    '1.169',
    '0.7016',
    '0.3111',
    '29.84%',
    'Supercritical Fluid Regime',
    '12.40 s',
    '8.25%',
    '0.200',
  ];
  for (const token of staleTokens) {
    assert.ok(
      !serialized.includes(token),
      `Hero preview should not contain obsolete value "${token}"`
    );
  }
});

test('NEW-02: Heat Exchanger q3-temperature-cross matches live solver output', () => {
  const q3 = GUIDED_EXPLORATION_QUESTIONS.find(
    (q) => q.id === 'q3-temperature-cross'
  );
  assert.ok(q3);
  assert.equal(q3.selfCheckOptions.filter((o) => o.isCorrect).length, 1);

  const res = calculateHeatExchanger(q3.suggestedInputs);
  assert.equal(res.isValid, true);
  assert.ok(res.Tc_out > res.Th_out);

  const text = [
    q3.keyObservation,
    ...q3.selfCheckOptions.map((o) => `${o.label} ${o.feedback}`),
  ].join(' ');

  assert.ok(q3.keyObservation.includes(res.NTU.toFixed(3)));
  assert.ok(q3.keyObservation.includes(`${res.effectiveness_pct.toFixed(2)}%`));
  assert.ok(q3.keyObservation.includes(`${res.Q_kW.toFixed(2)} kW`));
  assert.ok(q3.keyObservation.includes(`${res.Tc_out.toFixed(2)} °C`));
  assert.ok(q3.keyObservation.includes(`${res.Th_out.toFixed(2)} °C`));
  assert.ok(
    q3.keyObservation.includes(
      `${(res.Tc_out - res.Th_out).toFixed(2)} °C`
    )
  );
  assert.ok(text.includes(`${res.Tc_out.toFixed(2)} °C`));
  assert.ok(text.includes(`${res.Th_out.toFixed(2)} °C`));

  for (const stale of ['84.33', '581.61', '112.76', '43.04', '69.72']) {
    assert.ok(
      !text.includes(stale),
      `q3-temperature-cross should not include stale number "${stale}"`
    );
  }
});

test('NEW-02: Process Control inquiries pc-7, pc-8, and pc-10 match live solver outputs', () => {
  const pc7 = PROCESS_CONTROL_GUIDED_QUESTIONS.find(
    (q) => q.id === 'pc-7-integral-windup'
  );
  const pc8 = PROCESS_CONTROL_GUIDED_QUESTIONS.find(
    (q) => q.id === 'pc-8-anti-windup-protection'
  );
  const pc10 = PROCESS_CONTROL_GUIDED_QUESTIONS.find(
    (q) => q.id === 'pc-10-multi-metric-evaluation'
  );
  assert.ok(pc7 && pc8 && pc10);

  for (const q of [pc7, pc8, pc10]) {
    assert.equal(
      q.selfCheckOptions.filter((o) => o.isCorrect).length,
      1,
      `${q.id} must have exactly 1 correct option`
    );
  }

  // Verify pc-7 against live simulation
  const r7 = simulateProcessControl(pc7.suggestedInputs);
  const pc7Text = [
    pc7.keyObservation,
    ...pc7.selfCheckOptions.map((o) => `${o.label} ${o.feedback}`),
  ].join(' ');
  assert.ok(pc7Text.includes(`${r7.metrics.maxCommand_Ucmd.toFixed(1)}%`));
  assert.ok(pc7Text.includes(`${r7.metrics.peakOutput_Y.toFixed(2)}%`));
  assert.ok(pc7Text.includes(`${r7.metrics.overshootPercent!.toFixed(1)}%`));
  assert.ok(pc7Text.includes(`${r7.metrics.iae.toFixed(1)} %·s`));
  assert.ok(
    pc7Text.includes(`${r7.metrics.saturationDuration_s.toFixed(1)} s`)
  );
  assert.ok(pc7Text.includes(`${r7.metrics.settlingTime_2pct_s!.toFixed(1)} s`));
  for (const stale of ['118.4', '84.5%', '15.0%']) {
    assert.ok(
      !pc7Text.includes(stale),
      `pc-7 must not contain stale number "${stale}"`
    );
  }

  // Verify pc-8 against live simulation
  const r8 = simulateProcessControl(pc8.suggestedInputs);
  const pc8Text = [
    pc8.keyObservation,
    ...pc8.selfCheckOptions.map((o) => `${o.label} ${o.feedback}`),
  ].join(' ');
  assert.ok(pc8Text.includes(`${r8.metrics.maxCommand_Ucmd.toFixed(1)}%`));
  assert.ok(pc8Text.includes(`${r8.metrics.peakOutput_Y.toFixed(2)}%`));
  assert.ok(pc8Text.includes(`${r8.metrics.overshootPercent!.toFixed(1)}%`));
  assert.ok(pc8Text.includes(`${r8.metrics.iae.toFixed(1)} %·s`));
  assert.ok(
    pc8Text.includes(`${r8.metrics.saturationDuration_s.toFixed(1)} s`)
  );
  assert.ok(pc8Text.includes(`${r8.metrics.settlingTime_2pct_s!.toFixed(1)} s`));
  for (const stale of ['118.4', '86.0%', '15.0%', '1.5%', '575', '479']) {
    assert.ok(
      !pc8Text.includes(stale),
      `pc-8 must not contain stale number "${stale}"`
    );
  }

  // Verify pc-10 against live Filtered PID vs. Oscillatory Preset
  const r10Pid = simulateProcessControl(pc10.suggestedInputs);
  const oscPreset = PROCESS_CONTROL_PRESETS.find(
    (p) => p.id === 'poorly-tuned-oscillatory'
  )!;
  const r10Osc = simulateProcessControl(oscPreset.inputs);
  const tvRatio = (
    r10Osc.metrics.controlEffort_TV / r10Pid.metrics.controlEffort_TV
  ).toFixed(1);

  assert.ok(
    pc10.keyObservation.includes(`${r10Osc.metrics.riseTime_10_90_s!.toFixed(2)} s`)
  );
  assert.ok(
    pc10.keyObservation.includes(`${r10Osc.metrics.overshootPercent!.toFixed(1)}%`)
  );
  assert.ok(pc10.keyObservation.includes(`${tvRatio}×`));
  assert.ok(
    pc10.keyObservation.includes(`${r10Osc.metrics.controlEffort_TV.toFixed(1)}%`)
  );
  assert.ok(
    pc10.keyObservation.includes(`${r10Pid.metrics.controlEffort_TV.toFixed(1)}%`)
  );
  for (const stale of ['5.8 s', '51%']) {
    assert.ok(
      !pc10.keyObservation.includes(stale),
      `pc-10 must not contain stale number "${stale}"`
    );
  }
});
