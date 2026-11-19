import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_HEAT_EXCHANGER_INPUTS,
  OPERATING_PRESETS,
  calculateHeatExchanger,
} from './heat-exchanger';
import {
  DEFAULT_FLUID_MECHANICS_INPUTS,
  FLUID_MECHANICS_PRESETS,
  calculateFluidMechanics,
} from './fluid-mechanics';
import {
  DEFAULT_REACTION_ENGINEERING_INPUTS,
  calculateReactionEngineering,
} from './reaction-engineering';
import {
  DEFAULT_DISTILLATION_INPUTS,
  DISTILLATION_PRESETS,
  calculateDistillation,
} from './distillation';
import {
  THERMO_PVT_PRESETS,
  THERMO_VLE_PRESETS,
  calculatePureFluidPVT,
  calculateBinaryVLE,
} from './thermodynamics';
import {
  formatHeatExchangerMobileLabels,
  formatFluidMechanicsMobileLabels,
  formatReactionMobileLabels,
  formatDistillationMobileLabels,
  formatThermoPVTMobileLabels,
  formatThermoVLEMobileLabels,
} from './schematic-formatting';

test('Batch 5A: Heat Exchanger mobile labels match solver outputs & temperature cross state', () => {
  const baseRes = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  const baseLabels = formatHeatExchangerMobileLabels(DEFAULT_HEAT_EXCHANGER_INPUTS, baseRes);
  assert.equal(baseLabels.hotInLabel, '120.0 °C');
  assert.equal(baseLabels.coldInLabel, '25.0 °C');
  assert.equal(baseLabels.isTemperatureCross, baseRes.Tc_out > baseRes.Th_out);
  assert.ok(baseLabels.dutyLabel.endsWith(' kW'));

  const lowAreaInputs = { ...DEFAULT_HEAT_EXCHANGER_INPUTS, A: 2.0 };
  const lowAreaRes = calculateHeatExchanger(lowAreaInputs);
  const lowAreaLabels = formatHeatExchangerMobileLabels(lowAreaInputs, lowAreaRes);
  assert.equal(lowAreaLabels.isTemperatureCross, false);

  const crossPreset = OPERATING_PRESETS.find((p) => {
    const r = calculateHeatExchanger(p.inputs);
    return r.isValid && r.Tc_out > r.Th_out;
  });
  assert.ok(crossPreset, 'Expected a temperature-cross preset');
  const crossRes = calculateHeatExchanger(crossPreset.inputs);
  const crossLabels = formatHeatExchangerMobileLabels(crossPreset.inputs, crossRes);
  assert.equal(crossLabels.isTemperatureCross, true);
  assert.ok(crossRes.Tc_out > crossRes.Th_out);
});

test('Batch 5A: Fluid Mechanics mobile labels reflect elevation, regime, and zero-flow states', () => {
  const baseRes = calculateFluidMechanics(DEFAULT_FLUID_MECHANICS_INPUTS);
  const baseLabels = formatFluidMechanicsMobileLabels(DEFAULT_FLUID_MECHANICS_INPUTS, baseRes);
  assert.equal(baseLabels.isZeroFlow, false);
  assert.equal(baseLabels.regimeLabel, baseRes.flowRegime);
  assert.ok(baseLabels.pumpHeadLabel.endsWith(' m'));

  const zeroInputs = { ...DEFAULT_FLUID_MECHANICS_INPUTS, flowRate_L_s: 0 };
  const zeroRes = calculateFluidMechanics(zeroInputs);
  const zeroLabels = formatFluidMechanicsMobileLabels(zeroInputs, zeroRes);
  assert.equal(zeroLabels.isZeroFlow, true);
  assert.equal(zeroLabels.frictionFactorLabel, '—');

  const elevatedPreset = FLUID_MECHANICS_PRESETS.find((p) => p.inputs.elevationDiff_m > 0);
  assert.ok(elevatedPreset, 'Expected an elevated preset');
  const elevRes = calculateFluidMechanics(elevatedPreset.inputs);
  const elevLabels = formatFluidMechanicsMobileLabels(elevatedPreset.inputs, elevRes);
  assert.equal(elevLabels.hasElevation, true);
  assert.ok(elevLabels.elevationLabel.startsWith('+'));
});

test('Batch 5A: Reaction Engineering mobile labels distinguish Batch, CSTR, and PFR accurately', () => {
  const modes = ['batch', 'cstr', 'pfr'] as const;
  for (const mode of modes) {
    const inputs = { ...DEFAULT_REACTION_ENGINEERING_INPUTS, reactorType: mode };
    const res = calculateReactionEngineering(inputs);
    const labels = formatReactionMobileLabels(inputs, res);
    assert.equal(labels.reactorType, mode);
    assert.equal(labels.isContinuous, mode !== 'batch');
    assert.ok(labels.conversionLabel.endsWith('%'));
    if (mode === 'batch') {
      assert.ok(labels.modeTag.includes('q = 0'));
      assert.ok(labels.convertedAmountLabel.endsWith(' mol'));
    } else {
      assert.ok(labels.convertedAmountLabel.endsWith(' mol/s'));
    }
  }
});

test('Batch 5A: Distillation mobile labels preserve baseline 11 stages / 10.39 fractional / NF = 5 and pinched handling', () => {
  const baseRes = calculateDistillation(DEFAULT_DISTILLATION_INPUTS);
  const baseLabels = formatDistillationMobileLabels(DEFAULT_DISTILLATION_INPUTS, baseRes);
  assert.equal(baseLabels.isPinched, false);
  assert.equal(baseLabels.stageHeadline, 'N = 11 stages (10 Trays + 1 Reboiler)');
  assert.equal(baseLabels.fractionalDetail, 'Exact 10.39 stages · Feed Stage NF = 5');
  assert.equal(baseLabels.feedPlateLabel, 'FEED STAGE NF = 5');

  const pinchedPreset = DISTILLATION_PRESETS.find(
    (p) => calculateDistillation(p.inputs).feasibilityStatus === 'below_minimum_reflux'
  );
  assert.ok(pinchedPreset, 'Expected a pinched distillation preset');
  const pinchedRes = calculateDistillation(pinchedPreset.inputs);
  const pinchedLabels = formatDistillationMobileLabels(pinchedPreset.inputs, pinchedRes);
  assert.equal(pinchedLabels.isPinched, true);
  assert.equal(pinchedLabels.stageHeadline, 'Pinched (R ≤ Rmin)');
});

test('Batch 5A: Thermodynamics PVT & VLE mobile labels reflect multi-root and all phase states', () => {
  const subcritical = THERMO_PVT_PRESETS.find((p) => p.id === 'subcritical-multi-root');
  assert.ok(subcritical, 'Expected subcritical-multi-root PVT preset');
  const pvtRes = calculatePureFluidPVT(subcritical.inputs);
  const pvtLabels = formatThermoPVTMobileLabels(pvtRes);
  assert.ok(pvtLabels.rootsLabel.startsWith('3 roots'));
  assert.ok(pvtLabels.vPrLabel.endsWith(' L/mol'));

  for (const preset of THERMO_VLE_PRESETS) {
    const vleRes = calculateBinaryVLE(preset.inputs);
    const vleLabels = formatThermoVLEMobileLabels(vleRes);
    assert.ok(vleLabels.vaporCellLabel.length > 0);
    assert.ok(vleLabels.liquidCellLabel.length > 0);
    assert.ok(vleLabels.phaseFooterLabel.length > 0);
  }
});
