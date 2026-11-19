import type { HeatExchangerInputs, HeatExchangerResults } from './heat-exchanger';
import type { FluidMechanicsInputs, FluidMechanicsResults } from './fluid-mechanics';
import type { ReactionEngineeringInputs, ReactionEngineeringResults } from './reaction-engineering';
import type { DistillationInputs, DistillationResults } from './distillation';
import type { PureFluidPVTResults, BinaryVLEResults } from './thermodynamics';

/**
 * Pure presentation & formatting helpers shared by mobile schematic views.
 * Performs ZERO independent physics calculations — strictly formats values
 * already computed by the authoritative simulation engines.
 */

export function formatFeedQualityLabel(q: number): string {
  if (Math.abs(q - 1) < 1e-6) return 'Sat. Liquid';
  if (Math.abs(q) < 1e-6) return 'Sat. Vapor';
  if (q > 1) return 'Subcooled Liq.';
  if (q < 0) return 'Superheated Vap.';
  return 'Two-Phase';
}

export function formatHeatExchangerMobileLabels(
  inputs: HeatExchangerInputs,
  results: HeatExchangerResults
) {
  const isTemperatureCross = results.isValid && results.Tc_out > results.Th_out;
  return {
    isTemperatureCross,
    dutyLabel: results.isValid ? `${results.Q_kW.toFixed(1)} kW` : 'Invalid Input',
    uaLabel: `${(results.UA_W_K / 1000).toFixed(2)} kW/K`,
    lmtdLabel: results.isValid ? `${results.LMTD.toFixed(1)} °C` : '—',
    hotInLabel: `${inputs.Th_in.toFixed(1)} °C`,
    hotOutLabel: results.isValid ? `${results.Th_out.toFixed(1)} °C` : '—',
    deltaThLabel: `−${results.isValid ? results.deltaTh.toFixed(1) : '0.0'} °C`,
    coldInLabel: `${inputs.Tc_in.toFixed(1)} °C`,
    coldOutLabel: results.isValid ? `${results.Tc_out.toFixed(1)} °C` : '—',
    deltaTcLabel: `+${results.isValid ? results.deltaTc.toFixed(1) : '0.0'} °C`,
    approachHotLabel: results.isValid ? `${results.approachTempHotEnd.toFixed(1)} °C` : '—',
    approachColdLabel: results.isValid ? `${results.approachTempColdEnd.toFixed(1)} °C` : '—',
    chLabel: results.isValid ? `${results.Ch_kW_K.toFixed(2)} kW/K` : '0.00 kW/K',
    ccLabel: results.isValid ? `${results.Cc_kW_K.toFixed(2)} kW/K` : '0.00 kW/K',
  };
}

export function formatFluidMechanicsMobileLabels(
  inputs: FluidMechanicsInputs,
  results: FluidMechanicsResults
) {
  const hasElevation = inputs.elevationDiff_m > 0;
  const isZeroFlow = results.isValid && results.flowRegime === 'Zero Flow';
  return {
    hasElevation,
    isZeroFlow,
    regimeLabel: results.isValid ? results.flowRegime : 'Invalid',
    velocityLabel: results.isValid ? `${results.velocity_m_s.toFixed(2)} m/s` : '—',
    reynoldsLabel: results.isValid ? Math.round(results.reynoldsNumber).toLocaleString('en-US') : '—',
    frictionFactorLabel:
      results.isValid && !isZeroFlow ? results.darcyFrictionFactor.toFixed(4) : '—',
    pumpHeadLabel: results.isValid ? `${results.requiredPumpHead_m.toFixed(2)} m` : '—',
    shaftPowerLabel: results.isValid ? `${results.shaftPower_kW.toFixed(2)} kW` : '—',
    pressureLossLabel: results.isValid ? `${results.frictionalPressureLoss_kPa.toFixed(2)} kPa` : '—',
    majorLossLabel: results.isValid ? `${results.majorHeadLoss_m.toFixed(2)} m` : '—',
    minorLossLabel: results.isValid ? `${results.minorHeadLoss_m.toFixed(2)} m` : '—',
    elevationLabel: hasElevation
      ? `+${inputs.elevationDiff_m.toFixed(1)} m`
      : '0.0 m (Horizontal)',
    elevationPressureLabel: results.isValid
      ? `${results.elevationPressure_kPa.toFixed(1)} kPa`
      : '—',
  };
}

export function formatReactionMobileLabels(
  inputs: ReactionEngineeringInputs,
  results: ReactionEngineeringResults
) {
  const active = results.activeReactor;
  const isValid = results.isValid;
  const reactorType = inputs.reactorType;
  const isContinuous = reactorType !== 'batch';

  return {
    reactorType,
    isContinuous,
    modeTag:
      reactorType === 'batch'
        ? 'CLOSED BATCH (q = 0)'
        : reactorType === 'cstr'
          ? 'IDEAL CSTR (WELL-MIXED)'
          : 'IDEAL PFR (PLUG FLOW)',
    characteristicTimeLabel: isValid
      ? `${active.timeSymbol} = ${active.characteristicTime_s.toFixed(1)} s`
      : `${active.timeSymbol} = —`,
    damkohlerLabel: isValid ? active.damkohlerNumber.toFixed(2) : '—',
    conversionLabel: isValid ? `${active.conversion_pct.toFixed(2)}%` : '—',
    outletConcLabel: isValid ? `${active.outletConcentration_mol_m3.toFixed(2)} mol/m³` : '—',
    rateLabel: isValid ? `${active.reactionRate_mol_m3_s.toFixed(3)} mol/(m³·s)` : '—',
    convertedAmountLabel:
      reactorType === 'batch'
        ? isValid && active.molesConverted_mol !== null
          ? `${active.molesConverted_mol.toFixed(1)} mol`
          : '—'
        : isValid && active.molarFlowConverted_mol_s !== null
          ? `${active.molarFlowConverted_mol_s.toFixed(2)} mol/s`
          : '—',
  };
}

export function formatDistillationMobileLabels(
  inputs: DistillationInputs,
  results: DistillationResults
) {
  const { isValid, stageCalculation, minimumReflux } = results;
  const totalStages = stageCalculation.totalTheoreticalStages;
  const columnTrays = stageCalculation.columnTheoreticalTrays;
  const fracStages = stageCalculation.fractionalTheoreticalStages;
  const feedStage = stageCalculation.feedStageNumber;
  const rMin = minimumReflux.minimumRefluxRatio_Rmin;

  const isPinched = results.feasibilityStatus === 'below_minimum_reflux';

  return {
    isValid,
    isPinched,
    feedQualityLabel: formatFeedQualityLabel(inputs.feedQuality_q),
    stageHeadline:
      stageCalculation.converged && totalStages !== null && columnTrays !== null
        ? `N = ${totalStages} stages (${columnTrays} Trays + 1 Reboiler)`
        : isPinched
          ? 'Pinched (R ≤ Rmin)'
          : 'Theoretical Stages: Unresolved',
    fractionalDetail:
      fracStages !== null
        ? `Exact ${fracStages.toFixed(2)} stages · Feed Stage NF = ${feedStage ?? '—'}`
        : rMin !== null
          ? `Minimum Reflux Rmin = ${rMin.toFixed(3)}`
          : 'Check composition bounds',
    feedPlateLabel: feedStage !== null ? `FEED STAGE NF = ${feedStage}` : 'FEED ZONE',
    rMinLabel: rMin !== null ? rMin.toFixed(3) : '—',
    refluxRatioMultipleLabel:
      minimumReflux.operatingToMinRefluxRatio !== null
        ? `${minimumReflux.operatingToMinRefluxRatio.toFixed(2)}×`
        : '—',
    fenskeLabel:
      minimumReflux.fenskeMinimumStages_Nmin !== null
        ? minimumReflux.fenskeMinimumStages_Nmin.toFixed(2)
        : '—',
  };
}

export function formatThermoPVTMobileLabels(results: PureFluidPVTResults) {
  return {
    stateSummary: `${results.fluid.formula} @ ${results.temperature_K.toFixed(1)} K, ${results.pressure_bar.toFixed(1)} bar`,
    zLabel: results.compressibilityFactor_Z.toFixed(4),
    vIdealLabel: `${results.idealMolarVolume_L_mol.toFixed(3)} L/mol`,
    vPrLabel: `${results.prMolarVolume_L_mol.toFixed(3)} L/mol`,
    repulsiveBarLabel: `${(results.repulsivePressureTerm_Pa / 1e5).toFixed(1)} bar`,
    attractiveBarLabel: `-${(results.attractivePressureTerm_Pa / 1e5).toFixed(1)} bar`,
    covolumeRatioLabel: `${results.covolumeRatio_v_over_b.toFixed(2)}×`,
    deviationLabel: `${results.volumeDeviationPercent >= 0 ? '+' : ''}${results.volumeDeviationPercent.toFixed(2)}%`,
    rootsLabel: results.rootDiagnosis.hasMultipleValidRoots
      ? `3 roots (${results.activeRootPreference})`
      : '1 physical root',
  };
}

export function formatThermoVLEMobileLabels(results: BinaryVLEResults) {
  const isTwoPhase =
    results.phaseStateAtSystemPressure === 'Two-Phase Vapor–Liquid Equilibrium';
  const isLiquidOnly =
    results.phaseStateAtSystemPressure === 'Compressed (Subcooled) Liquid';
  const isVaporOnly =
    results.phaseStateAtSystemPressure === 'Superheated Vapor';

  return {
    isTwoPhase,
    isLiquidOnly,
    isVaporOnly,
    vaporCellLabel: isLiquidOnly
      ? 'Subcooled Liquid'
      : isTwoPhase
        ? `Vapor y_A = ${(results.tieLineVapor_yA ?? results.equilibriumVapor_yA).toFixed(3)}`
        : `Vapor y_A = ${results.xA.toFixed(3)}`,
    liquidCellLabel: isVaporOnly
      ? 'All Vapor (P < P_dew)'
      : isTwoPhase
        ? `Liquid x_A = ${(results.tieLineLiquid_xA ?? results.xA).toFixed(3)}`
        : `Liquid x_A = ${results.xA.toFixed(3)}`,
    phaseFooterLabel: isTwoPhase
      ? `Two-Phase Coexistence · V/F = ${(results.vaporMoleFraction_betaV * 100).toFixed(1)}%`
      : results.phaseStateAtSystemPressure,
    enrichmentLabel:
      results.xA > 0 ? `${(results.equilibriumVapor_yA / results.xA).toFixed(2)}×` : '—',
  };
}
