import {
  DEFAULT_HEAT_EXCHANGER_INPUTS,
  HeatExchangerInputs,
  calculateHeatExchanger,
} from '@/lib/heat-exchanger';
import {
  DEFAULT_FLUID_MECHANICS_INPUTS,
  FluidMechanicsInputs,
  calculateFluidMechanics,
} from '@/lib/fluid-mechanics';
import {
  DEFAULT_REACTION_ENGINEERING_INPUTS,
  ReactionEngineeringInputs,
  calculateReactionEngineering,
} from '@/lib/reaction-engineering';
import {
  DEFAULT_DISTILLATION_INPUTS,
  DistillationInputs,
  calculateDistillation,
} from '@/lib/distillation';
import {
  PureFluidPVTInputs,
  THERMO_PVT_PRESETS,
  calculatePureFluidPVT,
} from '@/lib/thermodynamics';
import {
  PROCESS_CONTROL_PRESETS,
  ProcessControlInputs,
  simulateProcessControl,
} from '@/lib/process-control';
import { PlatformView, formatSignedZero } from '@/lib/navigation';

export interface HeroPreviewMetric {
  label: string;
  value: string;
  sub: string;
  accent: string;
}

export interface HeroPreviewLab {
  id: Exclude<PlatformView, 'landing' | 'directory'>;
  code: string;
  shortTitle: string;
  domain: string;
  presetName: string;
  equationLatex: string;
  metrics: HeroPreviewMetric[];
  conservationNote: string;
  inputs:
    | HeatExchangerInputs
    | FluidMechanicsInputs
    | ReactionEngineeringInputs
    | DistillationInputs
    | PureFluidPVTInputs
    | ProcessControlInputs;
  rawMetrics: Record<string, number | string | null>;
}

/**
 * Authoritative default baseline inputs used by the Landing Page Hero interactive
 * preview tabs. Every entry matches the default baseline state of its corresponding
 * virtual laboratory workspace.
 */
export const HERO_DEFAULT_PVT_INPUTS: PureFluidPVTInputs = {
  ...THERMO_PVT_PRESETS[1].inputs, // CO2 at 320 K, 60 bar (matches THERMODYNAMICS_LAB DEFAULT_PVT_INPUTS)
};

export const HERO_DEFAULT_CONTROL_INPUTS: ProcessControlInputs = {
  ...PROCESS_CONTROL_PRESETS[4].inputs, // Balanced PI Control (matches PROCESS_CONTROL_LAB DEFAULT_CONTROL_INPUTS)
};

export function buildHeroPreviewLabs(): HeroPreviewLab[] {
  // 1. Heat Exchanger (Baseline Water-to-Water Countercurrent)
  const hxInputs = { ...DEFAULT_HEAT_EXCHANGER_INPUTS };
  const hx = calculateHeatExchanger(hxInputs);

  // 2. Fluid Mechanics (20 C Water in 80 mm Commercial Steel Pipe)
  const fmInputs = { ...DEFAULT_FLUID_MECHANICS_INPUTS };
  const fm = calculateFluidMechanics(fmInputs);

  // 3. Reaction Engineering (First-Order PFR vs. CSTR Comparison, Da = 1.5)
  const rxInputs = { ...DEFAULT_REACTION_ENGINEERING_INPUTS };
  const rx = calculateReactionEngineering(rxInputs);
  const rxPfr = rx.pfrAtCurrentVolume ?? rx.pfrAtBatchTime;
  const rxCstr = rx.cstrAtCurrentVolume ?? rx.cstrAtBatchTime;

  // 4. Distillation (Saturated Liquid Feed Binary McCabe-Thiele Baseline)
  const distInputs = { ...DEFAULT_DISTILLATION_INPUTS };
  const dist = calculateDistillation(distInputs);

  // 5. Thermodynamics (CO2 Near-Critical Compression, T = 320 K, P = 60 bar)
  const pvtInputs = { ...HERO_DEFAULT_PVT_INPUTS };
  const pvt = calculatePureFluidPVT(pvtInputs);

  // 6. Process Control (Balanced PI Control, Kp = 1.5, tau = 20 s, theta = 3 s)
  const pcInputs = { ...HERO_DEFAULT_CONTROL_INPUTS };
  const pc = simulateProcessControl(pcInputs);

  return [
    {
      id: 'heat-exchanger',
      code: 'LAB 01',
      shortTitle: 'Heat Exchanger',
      domain: 'Countercurrent $\\varepsilon\\text{–}\\mathrm{NTU}$ Thermal Analysis',
      presetName: `Baseline Water–Water ($A = ${hxInputs.A.toFixed(1)}\\,\\mathrm{m}^2$, $U = ${hxInputs.U.toFixed(0)}\\,\\mathrm{W/(m^2\\cdot K)}$)`,
      equationLatex:
        '\\varepsilon = \\frac{1 - \\exp\\left[-\\mathrm{NTU}(1 - C_r)\\right]}{1 - C_r \\exp\\left[-\\mathrm{NTU}(1 - C_r)\\right]}',
      metrics: [
        {
          label: 'Heat Duty ($Q$)',
          value: `${hx.Q_kW.toFixed(2)} kW`,
          sub: `$Q_{\\max}$ = ${hx.Qmax_kW.toFixed(2)} kW`,
          accent: 'text-white',
        },
        {
          label: 'Effectiveness ($\\varepsilon$)',
          value: `${hx.effectiveness_pct.toFixed(2)}%`,
          sub: `$\\mathrm{NTU}$ = ${hx.NTU.toFixed(3)} · $C_r$ = ${hx.Cr.toFixed(3)}`,
          accent: 'text-teal-300',
        },
        {
          label: 'Hot Outlet ($T_{h,\\mathrm{out}}$)',
          value: `${hx.Th_out.toFixed(2)} °C`,
          sub: `Inlet: ${hxInputs.Th_in.toFixed(1)} °C`,
          accent: 'text-rose-300',
        },
        {
          label: 'Cold Outlet ($T_{c,\\mathrm{out}}$)',
          value: `${hx.Tc_out.toFixed(2)} °C`,
          sub:
            hx.Tc_out > hx.Th_out
              ? 'Temperature Cross Active'
              : 'No Temperature Cross',
          accent: 'text-sky-300',
        },
      ],
      conservationNote: `First Law Verified: $|Q_h - Q_c| = ${hx.energyBalanceResidual_W.toExponential(1)}\\,\\mathrm{W}$`,
      inputs: hxInputs,
      rawMetrics: {
        Q_kW: hx.Q_kW,
        Qmax_kW: hx.Qmax_kW,
        effectiveness_pct: hx.effectiveness_pct,
        NTU: hx.NTU,
        Cr: hx.Cr,
        Th_out: hx.Th_out,
        Tc_out: hx.Tc_out,
      },
    },
    {
      id: 'fluid-mechanics',
      code: 'LAB 02',
      shortTitle: 'Fluid Mechanics',
      domain: 'Darcy–Weisbach & Colebrook–White Hydraulics',
      presetName: `Commercial Steel Pipe ($Q = ${fmInputs.flowRate_L_s.toFixed(1)}\\,\\mathrm{L/s}$, $D = ${fmInputs.diameter_m.toFixed(2)}\\,\\mathrm{m}$, $L = ${fmInputs.length_m.toFixed(0)}\\,\\mathrm{m}$)`,
      equationLatex:
        'h_f = f_D \\frac{L}{D} \\frac{v^2}{2g}, \\quad \\frac{1}{\\sqrt{f_D}} = -2.0\\log_{10}\\!\\left(\\frac{\\varepsilon/D}{3.7} + \\frac{2.51}{\\mathrm{Re}\\sqrt{f_D}}\\right)',
      metrics: [
        {
          label: 'Reynolds Number ($\\mathrm{Re}$)',
          value: Math.round(fm.reynoldsNumber).toLocaleString('en-US'),
          sub: `${fm.flowRegime} Flow Regime`,
          accent: 'text-teal-300',
        },
        {
          label: 'Darcy Friction ($f_D$)',
          value: fm.darcyFrictionFactor.toFixed(4),
          sub: `$\\varepsilon/D$ = ${fm.relativeRoughness.toExponential(2)}`,
          accent: 'text-white',
        },
        {
          label: 'Frictional Loss ($\\Delta P_f$)',
          value: `${fm.frictionalPressureLoss_kPa.toFixed(2)} kPa`,
          sub: `$h_{f,\\mathrm{total}}$ = ${fm.totalFrictionHeadLoss_m.toFixed(2)} m`,
          accent: 'text-amber-300',
        },
        {
          label: 'Required Pump Head',
          value: `${fm.requiredPumpHead_m.toFixed(2)} m`,
          sub: `$P_{\\mathrm{shaft}}$ = ${fm.shaftPower_kW.toFixed(2)} kW ($\\eta$ = ${fmInputs.pumpEfficiency_pct.toFixed(0)}%)`,
          accent: 'text-sky-300',
        },
      ],
      conservationNote: fm.frictionCorrelationUsed,
      inputs: fmInputs,
      rawMetrics: {
        reynoldsNumber: fm.reynoldsNumber,
        darcyFrictionFactor: fm.darcyFrictionFactor,
        relativeRoughness: fm.relativeRoughness,
        frictionalPressureLoss_kPa: fm.frictionalPressureLoss_kPa,
        totalFrictionHeadLoss_m: fm.totalFrictionHeadLoss_m,
        requiredPumpHead_m: fm.requiredPumpHead_m,
        shaftPower_kW: fm.shaftPower_kW,
      },
    },
    {
      id: 'reaction-engineering',
      code: 'LAB 03',
      shortTitle: 'Reaction Eng.',
      domain: 'Isothermal First-Order Reactor Design ($A \\to B$)',
      presetName: `PFR vs. CSTR Comparison ($k = ${rxInputs.rateConstant_per_s.toFixed(3)}\\,\\mathrm{s}^{-1}$, $\\tau = ${rxPfr.characteristicTime_s.toFixed(1)}\\,\\mathrm{s}$)`,
      equationLatex:
        'X_{\\mathrm{PFR}} = 1 - e^{-\\mathrm{Da}}, \\quad X_{\\mathrm{CSTR}} = \\frac{\\mathrm{Da}}{1 + \\mathrm{Da}}, \\quad \\mathrm{Da} = k\\tau',
      metrics: [
        {
          label: 'Damköhler Number ($\\mathrm{Da}$)',
          value: rxPfr.damkohlerNumber.toFixed(3),
          sub: `$k$ = ${rxInputs.rateConstant_per_s.toFixed(3)} s⁻¹ · $\\tau$ = ${rxPfr.characteristicTime_s.toFixed(1)} s`,
          accent: 'text-white',
        },
        {
          label: 'PFR Conversion ($X_{\\mathrm{PFR}}$)',
          value: `${rxPfr.conversion_pct.toFixed(2)}%`,
          sub: `$C_{A,\\mathrm{out}}$ = ${rxPfr.outletConcentration_mol_m3.toFixed(2)} mol/m³`,
          accent: 'text-teal-300',
        },
        {
          label: 'CSTR Conversion ($X_{\\mathrm{CSTR}}$)',
          value: `${rxCstr.conversion_pct.toFixed(2)}%`,
          sub: `$C_{A,\\mathrm{out}}$ = ${rxCstr.outletConcentration_mol_m3.toFixed(2)} mol/m³`,
          accent: 'text-amber-300',
        },
        {
          label: 'Volume Ratio ($V_{\\mathrm{CSTR}}/V_{\\mathrm{PFR}}$)',
          value: `${(rx.targetDesign.cstrToPfrVolumeRatio ?? 0).toFixed(2)}×`,
          sub: `At $X_{\\mathrm{target}}$ = ${rxInputs.targetConversion_pct}% ($V_{\\mathrm{CSTR}}$ = ${(rx.targetDesign.requiredVolumeCSTR_m3 ?? 0).toFixed(2)} m³)`,
          accent: 'text-sky-300',
        },
      ],
      conservationNote: 'Exact Analytical First-Order Mole Balance',
      inputs: rxInputs,
      rawMetrics: {
        damkohlerNumber: rxPfr.damkohlerNumber,
        pfrConversion_pct: rxPfr.conversion_pct,
        pfrOutlet_mol_m3: rxPfr.outletConcentration_mol_m3,
        cstrConversion_pct: rxCstr.conversion_pct,
        cstrOutlet_mol_m3: rxCstr.outletConcentration_mol_m3,
        cstrToPfrVolumeRatio: rx.targetDesign.cstrToPfrVolumeRatio,
        requiredVolumeCSTR_m3: rx.targetDesign.requiredVolumeCSTR_m3,
        requiredVolumePFR_m3: rx.targetDesign.requiredVolumePFR_m3,
      },
    },
    {
      id: 'distillation',
      code: 'LAB 04',
      shortTitle: 'Distillation',
      domain: 'Binary McCabe–Thiele Equilibrium Stage Stepping',
      presetName: `Saturated Liquid Feed ($\\alpha = ${distInputs.relativeVolatility_alpha.toFixed(2)}$, $z_F = ${distInputs.feedComposition_zF.toFixed(2)}$, $x_D = ${distInputs.distillateComposition_xD.toFixed(2)}$, $x_B = ${distInputs.bottomsComposition_xB.toFixed(2)}$)`,
      equationLatex:
        'y^* = \\frac{\\alpha x}{1 + (\\alpha - 1)x}, \\quad y_{\\mathrm{ROL}} = \\frac{R}{R+1}x + \\frac{x_D}{R+1}',
      metrics: [
        {
          label: 'Theoretical Stages ($N$)',
          value: `${dist.stageCalculation.totalTheoreticalStages ?? 0} Stages`,
          sub: `${dist.stageCalculation.fractionalTheoreticalStages?.toFixed(2) ?? '—'} fractional · ${dist.stageCalculation.columnTheoreticalTrays ?? 0} trays + 1 reboiler`,
          accent: 'text-teal-300',
        },
        {
          label: 'Optimal Feed Stage ($N_F$)',
          value: `Stage ${dist.stageCalculation.feedStageNumber ?? 0}`,
          sub: `${dist.stageCalculation.rectifyingStageCount ?? 0} rectifying · ${dist.stageCalculation.strippingStageCount ?? 0} stripping/reb.`,
          accent: 'text-white',
        },
        {
          label: 'Minimum Reflux ($R_{\\min}$)',
          value: dist.minimumReflux.minimumRefluxRatio_Rmin?.toFixed(3) ?? '—',
          sub: `Operating $R$ = ${distInputs.refluxRatio_R.toFixed(2)} ($${dist.minimumReflux.operatingToMinRefluxRatio?.toFixed(2) ?? '—'}\\times R_{\\min}$)`,
          accent: 'text-amber-300',
        },
        {
          label: 'Distillate / Bottoms',
          value: `${dist.materialBalance.distillateFlow_kmol_h.toFixed(1)} / ${dist.materialBalance.bottomsFlow_kmol_h.toFixed(1)}`,
          sub: `kmol/h ($F$ = ${distInputs.feedFlow_kmol_h.toFixed(0)} kmol/h)`,
          accent: 'text-sky-300',
        },
      ],
      conservationNote: 'Component & Overall Molar Balance Verified',
      inputs: distInputs,
      rawMetrics: {
        totalTheoreticalStages: dist.stageCalculation.totalTheoreticalStages,
        fractionalTheoreticalStages:
          dist.stageCalculation.fractionalTheoreticalStages,
        feedStageNumber: dist.stageCalculation.feedStageNumber,
        minimumRefluxRatio_Rmin: dist.minimumReflux.minimumRefluxRatio_Rmin,
        operatingToMinRefluxRatio:
          dist.minimumReflux.operatingToMinRefluxRatio,
        distillateFlow_kmol_h: dist.materialBalance.distillateFlow_kmol_h,
        bottomsFlow_kmol_h: dist.materialBalance.bottomsFlow_kmol_h,
      },
    },
    {
      id: 'thermodynamics',
      code: 'LAB 05',
      shortTitle: 'Thermodynamics',
      domain: 'Peng–Robinson EOS & Binary Raoult–Dalton VLE',
      presetName: `Carbon Dioxide Compression ($T = ${pvtInputs.temperature_K.toFixed(0)}\\,\\mathrm{K}$, $P = ${(pvtInputs.pressure_Pa / 1e5).toFixed(0)}\\,\\mathrm{bar}$)`,
      equationLatex:
        'Z^3 - (1 - B)Z^2 + (A - 2B - 3B^2)Z - (AB - B^2 - B^3) = 0',
      metrics: [
        {
          label: 'PR Compressibility ($Z$)',
          value: pvt.compressibilityFactor_Z.toFixed(4),
          sub: 'Ideal $Z$ = 1.0000',
          accent: 'text-teal-300',
        },
        {
          label: 'PR Molar Volume ($v_{\\mathrm{PR}}$)',
          value: `${pvt.prMolarVolume_L_mol.toFixed(4)} L/mol`,
          sub: `$v_{\\mathrm{ideal}}$ = ${pvt.idealMolarVolume_L_mol.toFixed(4)} L/mol`,
          accent: 'text-white',
        },
        {
          label: 'Ideal-Gas Deviation',
          value: `${pvt.volumeDeviationPercent < 0 ? '−' : '+'}${Math.abs(pvt.volumeDeviationPercent).toFixed(2)}%`,
          sub:
            pvt.volumeDeviationPercent < 0
              ? 'Attractive forces dominate'
              : 'Repulsive forces dominate',
          accent: 'text-amber-300',
        },
        {
          label: 'Reduced State ($T_r, P_r$)',
          value: `${pvt.reducedTemperature_Tr.toFixed(3)}, ${pvt.reducedPressure_Pr.toFixed(3)}`,
          sub: pvt.regime,
          accent: 'text-sky-300',
        },
      ],
      conservationNote: 'NIST Reference Constants (CO₂, N₂, CH₄, C₂H₆)',
      inputs: pvtInputs,
      rawMetrics: {
        compressibilityFactor_Z: pvt.compressibilityFactor_Z,
        prMolarVolume_L_mol: pvt.prMolarVolume_L_mol,
        idealMolarVolume_L_mol: pvt.idealMolarVolume_L_mol,
        volumeDeviationPercent: pvt.volumeDeviationPercent,
        reducedTemperature_Tr: pvt.reducedTemperature_Tr,
        reducedPressure_Pr: pvt.reducedPressure_Pr,
        regime: pvt.regime,
      },
    },
    {
      id: 'process-control',
      code: 'LAB 06',
      shortTitle: 'Process Control',
      domain: 'SISO FOPDT Dynamics & PID Feedback Control',
      presetName: `Balanced PI Control ($K_p = ${pcInputs.processGain_Kp.toFixed(1)}$, $\\tau = ${pcInputs.timeConstant_tau_s.toFixed(0)}\\,\\mathrm{s}$, $\\theta = ${pcInputs.deadTime_theta_s.toFixed(0)}\\,\\mathrm{s}$, $K_c = ${pcInputs.controllerGain_Kc.toFixed(1)}$, $\\tau_I = ${pcInputs.integralTime_Ti_s.toFixed(0)}\\,\\mathrm{s}$)`,
      equationLatex:
        '\\tau \\frac{dy(t)}{dt} + y(t) = K_p u(t - \\theta), \\quad u(t) = U_0 + K_c\\!\\left[e(t) + \\frac{1}{\\tau_I}\\int_0^t e(\\tau)\\,d\\tau\\right]',
      metrics: [
        {
          label: 'Steady-State Error ($e_{\\mathrm{ss}}$)',
          value: `${formatSignedZero(pc.metrics.steadyStateError_ess, 2, { positivePrefix: true })}%`,
          sub: 'Integral action eliminates offset',
          accent: 'text-teal-300',
        },
        {
          label: '10–90% Rise Time ($t_r$)',
          value: `${(pc.metrics.riseTime_10_90_s ?? 0).toFixed(2)} s`,
          sub: `Setpoint step +${(pcInputs.setpointTarget_Ysp - pcInputs.initialOutput_Y0).toFixed(0)}% PV`,
          accent: 'text-white',
        },
        {
          label: 'Peak Overshoot',
          value: `${(pc.metrics.overshootPercent ?? 0).toFixed(1)}%`,
          sub: `Peak $Y$ = ${pc.metrics.peakOutput_Y.toFixed(2)}% @ ${pc.metrics.peakTime_s.toFixed(1)} s`,
          accent: 'text-sky-300',
        },
        {
          label: 'Controllability ($\\theta/\\tau$)',
          value: pc.controllabilityRatio_theta_over_tau.toFixed(3),
          sub: `$t_s$ = ${pc.metrics.settlingTime_2pct_s?.toFixed(1) ?? '—'} s · $\\mathrm{IAE}$ = ${pc.metrics.iae.toFixed(1)} %·s`,
          accent: 'text-amber-300',
        },
      ],
      conservationNote: 'Exact ZOH Step with Fractional Dead-Time Interpolation',
      inputs: pcInputs,
      rawMetrics: {
        steadyStateError_ess: pc.metrics.steadyStateError_ess,
        riseTime_10_90_s: pc.metrics.riseTime_10_90_s,
        overshootPercent: pc.metrics.overshootPercent,
        peakOutput_Y: pc.metrics.peakOutput_Y,
        peakTime_s: pc.metrics.peakTime_s,
        controllabilityRatio_theta_over_tau:
          pc.controllabilityRatio_theta_over_tau,
        settlingTime_2pct_s: pc.metrics.settlingTime_2pct_s,
        iae: pc.metrics.iae,
      },
    },
  ];
}

export const HERO_PREVIEW_LABS: HeroPreviewLab[] = buildHeroPreviewLabs();
