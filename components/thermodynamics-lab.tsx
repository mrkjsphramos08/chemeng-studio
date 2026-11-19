'use client';

import React, { useMemo, useState } from 'react';
import {
  GAS_CONSTANT_R,
  ReferenceFluidId,
  RootSelectionPreference,
  THERMO_REFERENCE_FLUIDS,
  THERMO_PVT_PRESETS,
  THERMO_VLE_PRESETS,
  PureFluidPVTInputs,
  BinaryVLEInputs,
  calculatePureFluidPVT,
  generatePressureSweepSeries,
  generatePVIsothermSeries,
  calculateBinaryVLE,
  generateBinaryPxySeries,
} from '@/lib/thermodynamics';
import {
  THERMO_PVT_GUIDED_QUESTIONS,
  THERMO_VLE_GUIDED_QUESTIONS,
} from '@/lib/labs-data';
import { downloadSimulationCsv } from '@/lib/lab-download';
import {
  LabAdditionalMetricsDisclosure,
  LabAssumptionsCard,
  LabGuidedInquiryCard,
  LabMetricCard,
  LabTheoryDisclosureCard,
  LabValidationAlerts,
  LabWorkspaceHeader,
  MathInline,
} from '@/components/lab-shared';
import {
  PureFluidPVTSchematic,
  BinaryVLESchematic,
} from './thermodynamics-schematic';
import {
  PureFluidPVTCharts,
  BinaryVLECharts,
  SavedPVTScenario,
  SavedVLEScenario,
} from './thermodynamics-charts';
import { Gauge, Layers, SlidersHorizontal } from 'lucide-react';

type ThermoActiveModule = 'real-gas-pvt' | 'binary-vle';

const DEFAULT_PVT_INPUTS: PureFluidPVTInputs = {
  fluidId: 'CO2',
  temperature_K: 320.0,
  pressure_Pa: 60.0e5, // 60 bar
  moles_n: 1.0,
  rootPreference: 'vapor',
};

const DEFAULT_VLE_INPUTS: BinaryVLEInputs = {
  liquidMoleFraction_xA: 0.5,
  psatA_kPa: 125.0,
  psatB_kPa: 50.0,
  systemPressure_kPa: 80.0,
  systemTemperature_K: 350.0,
};

const PVT_MODEL_ASSUMPTIONS = [
  {
    label: 'Pure Equilibrium State',
    detail:
      'Pure-component fluid phase at uniform absolute temperature $T$ and pressure $P$ ($R = 8.31446\\,\\mathrm{J/(mol\\cdot K)}$).',
  },
  {
    label: 'Peng–Robinson (1976) EOS',
    detail:
      'Two-parameter cubic equation of state with critical constants $a = 0.45724\\frac{R^2 T_c^2}{P_c}$, $b = 0.07780\\frac{R T_c}{P_c}$, and Pitzer acentric factor correlation $\\kappa(\\omega)$.',
  },
  {
    label: 'NIST Reference Constants',
    detail:
      'Critical properties ($T_c, P_c, \\omega$) sourced from NIST Chemistry WebBook & Poling, Prausnitz & O’Connell.',
  },
  {
    label: 'Subcritical Root Scope',
    detail:
      'For $T < T_c$ with 3 real roots ($Z > B$), $Z_{\\max}$ approximates the vapor branch and $Z_{\\min}$ approximates the liquid branch (equal-fugacity $f^V = f^L$ solver is outside Phase 2.3 scope).',
  },
];

const VLE_MODEL_ASSUMPTIONS = [
  {
    label: 'Hypothetical Binary Pair',
    detail:
      'Two chemically similar volatile components $A$ and $B$ at constant temperature with specified $P_A^{\\mathrm{sat}}$ and $P_B^{\\mathrm{sat}}$.',
  },
  {
    label: 'Ideal Liquid Solution',
    detail:
      'Activity coefficients $\\gamma_A = \\gamma_B = 1$ ($G^E = 0$, zero heat/volume of mixing) so Raoult’s Law $p_i = x_i P_i^{\\mathrm{sat}}$ holds across $0 \\le x_A \\le 1$.',
  },
  {
    label: 'Ideal Vapor Phase',
    detail:
      'Low-to-moderate pressure ideal gas behavior ($\\hat{\\phi}_i^V = 1$, Poynting factor $\\approx 1$) so Dalton’s Law $p_i = y_i P$ applies.',
  },
  {
    label: 'No Azeotropes (Phase 2.3 Scope)',
    detail:
      'Non-ideal excess Gibbs activity models (Margules, Wilson, NRTL, UNIQUAC) and azeotropic pinch points are outside Phase 2.3 scope.',
  },
];

export function ThermodynamicsLab() {
  const [activeModule, setActiveModule] = useState<ThermoActiveModule>('real-gas-pvt');

  // Module A State (Real-Gas PVT)
  const [pvtInputs, setPvtInputs] = useState<PureFluidPVTInputs>(DEFAULT_PVT_INPUTS);
  const [activePvtPresetId, setActivePvtPresetId] = useState<string>('moderate-pressure-real-gas');
  const [savedPvtScenarios, setSavedPvtScenarios] = useState<SavedPVTScenario[]>([]);

  // Module B State (Binary VLE)
  const [vleInputs, setVleInputs] = useState<BinaryVLEInputs>(DEFAULT_VLE_INPUTS);
  const [activeVlePresetId, setActiveVlePresetId] = useState<string>('equimolar-ideal-mixture');
  const [savedVleScenarios, setSavedVleScenarios] = useState<SavedVLEScenario[]>([]);

  // Module A Calculations
  const pvtResults = useMemo(() => calculatePureFluidPVT(pvtInputs), [pvtInputs]);

  const pressureSweepSeries = useMemo(
    () =>
      generatePressureSweepSeries(
        pvtInputs.fluidId,
        pvtResults.temperature_K,
        pvtResults.pressure_Pa,
        pvtInputs.rootPreference ?? 'vapor',
        60
      ),
    [
      pvtInputs.fluidId,
      pvtResults.temperature_K,
      pvtResults.pressure_Pa,
      pvtInputs.rootPreference,
    ]
  );

  const isothermData = useMemo(
    () => generatePVIsothermSeries(pvtInputs.fluidId, pvtResults.temperature_K, 65),
    [pvtInputs.fluidId, pvtResults.temperature_K]
  );

  // Module B Calculations
  const vleResults = useMemo(() => calculateBinaryVLE(vleInputs), [vleInputs]);

  const pxySeries = useMemo(
    () => generateBinaryPxySeries(vleResults.psatA_kPa, vleResults.psatB_kPa, 51),
    [vleResults.psatA_kPa, vleResults.psatB_kPa]
  );

  // Module A Handlers
  const handleSelectFluid = (fluidId: ReferenceFluidId) => {
    setPvtInputs((prev) => ({ ...prev, fluidId }));
    setActivePvtPresetId('custom');
  };

  const handleSelectRootPreference = (rootPreference: RootSelectionPreference) => {
    setPvtInputs((prev) => ({ ...prev, rootPreference }));
  };

  const handleApplyPvtPreset = (presetId: string) => {
    const preset = THERMO_PVT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setPvtInputs({ ...preset.inputs });
    setActivePvtPresetId(preset.id);
  };

  const handleSavePvtScenario = () => {
    if (!pvtResults.isValid) return;
    const newScenario: SavedPVTScenario = {
      id: `pvt-${Date.now()}`,
      label: `${pvtResults.fluid.formula} @ ${pvtResults.temperature_K.toFixed(0)} K, ${pvtResults.pressure_bar.toFixed(1)} bar`,
      fluidCode: pvtResults.fluid.formula,
      temperature_K: pvtResults.temperature_K,
      pressure_bar: pvtResults.pressure_bar,
      Z_PR: pvtResults.compressibilityFactor_Z,
      v_ideal_L_mol: pvtResults.idealMolarVolume_L_mol,
      v_PR_L_mol: pvtResults.prMolarVolume_L_mol,
      deviationPercent: pvtResults.volumeDeviationPercent,
      regime: pvtResults.regime,
    };
    setSavedPvtScenarios((prev) => [newScenario, ...prev.slice(0, 9)]);
  };

  // Module B Handlers
  const handleApplyVlePreset = (presetId: string) => {
    const preset = THERMO_VLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setVleInputs({ ...preset.inputs });
    setActiveVlePresetId(preset.id);
  };

  const handleSaveVleScenario = () => {
    if (!vleResults.isValid) return;
    const newScenario: SavedVLEScenario = {
      id: `vle-${Date.now()}`,
      label: `x_A = ${vleResults.xA.toFixed(2)} (α = ${vleResults.relativeVolatility_alphaAB.toFixed(2)})`,
      xA: vleResults.xA,
      psatA_kPa: vleResults.psatA_kPa,
      psatB_kPa: vleResults.psatB_kPa,
      alphaAB: vleResults.relativeVolatility_alphaAB,
      bubbleP_kPa: vleResults.bubblePressure_kPa,
      dewP_kPa: vleResults.dewPressureAtComposition_kPa,
      yA_eq: vleResults.equilibriumVapor_yA,
      phaseState: vleResults.phaseStateAtSystemPressure,
    };
    setSavedVleScenarios((prev) => [newScenario, ...prev.slice(0, 9)]);
  };

  // CSV Export Handler (exports active module state + curve series)
  const handleExportCsv = () => {
    if (activeModule === 'real-gas-pvt') {
      downloadSimulationCsv(
        `entrolume-thermo-pvt-${pvtResults.fluid.id.toLowerCase()}`,
        [
          {
            title: 'Entrolume — Pure-Fluid PVT & Peng-Robinson EOS Operating State',
            headers: ['Parameter', 'Value', 'Units'],
            rows: [
              ['Fluid Name & Formula', `${pvtResults.fluid.name} (${pvtResults.fluid.id})`, '-'],
              ['Critical Temperature Tc', pvtResults.fluid.Tc_K.toFixed(3), 'K'],
              ['Critical Pressure Pc', pvtResults.fluid.Pc_bar.toFixed(3), 'bar'],
              ['Acentric Factor omega', pvtResults.fluid.omega.toFixed(5), '-'],
              ['Temperature T', pvtResults.temperature_K.toFixed(2), 'K'],
              ['Pressure P', pvtResults.pressure_bar.toFixed(3), 'bar'],
              ['Compressibility Factor Z_PR', pvtResults.compressibilityFactor_Z.toFixed(5), '-'],
              ['Ideal Molar Volume v_ideal', pvtResults.idealMolarVolume_L_mol.toFixed(5), 'L/mol'],
              ['Peng-Robinson Molar Volume v_PR', pvtResults.prMolarVolume_L_mol.toFixed(5), 'L/mol'],
              ['Relative Ideal-Gas Volume Deviation', pvtResults.volumeDeviationPercent.toFixed(3), '%'],
            ],
          },
          {
            title: 'Isothermal Z vs. P Curve Sample',
            headers: ['Pressure (bar)', 'Z_ideal (-)', 'Z_PR (-)', 'v_ideal (L/mol)', 'v_PR (L/mol)', 'Deviation (%)'],
            rows: pressureSweepSeries.map((pt) => [
              pt.pressure_bar,
              pt.Z_ideal,
              pt.Z_PR_selected,
              pt.v_ideal_L_mol,
              pt.v_PR_L_mol,
              pt.deviationPercent,
            ]),
          },
        ]
      );
    } else {
      downloadSimulationCsv('entrolume-thermo-binary-vle', [
        {
          title: 'Entrolume — Ideal Binary VLE (Raoult & Dalton) Operating State',
          headers: ['Parameter', 'Value', 'Units'],
          rows: [
            ['Liquid Mole Fraction x_A', vleResults.xA.toFixed(4), 'mol/mol'],
            ['Pure A Saturation Pressure P_A^sat', vleResults.psatA_kPa.toFixed(2), 'kPa'],
            ['Pure B Saturation Pressure P_B^sat', vleResults.psatB_kPa.toFixed(2), 'kPa'],
            ['Relative Volatility alpha_AB', vleResults.relativeVolatility_alphaAB.toFixed(4), '-'],
            ['Partial Pressure p_A', vleResults.partialPressureA_kPa.toFixed(3), 'kPa'],
            ['Partial Pressure p_B', vleResults.partialPressureB_kPa.toFixed(3), 'kPa'],
            ['Bubble-Point Pressure P_bubble(x_A)', vleResults.bubblePressure_kPa.toFixed(3), 'kPa'],
            ['Equilibrium Vapor Mole Fraction y_A', vleResults.equilibriumVapor_yA.toFixed(4), 'mol/mol'],
            ['Dew-Point Pressure P_dew(y_A = x_A)', vleResults.dewPressureAtComposition_kPa.toFixed(3), 'kPa'],
            ['Cell Operating Pressure P_sys', vleResults.systemPressure_kPa.toFixed(2), 'kPa'],
            ['Phase State at P_sys', vleResults.phaseStateAtSystemPressure, '-'],
          ],
        },
        {
          title: 'Isothermal P-x-y Curve Data',
          headers: ['Mole Fraction', 'P_bubble (kPa)', 'P_dew (kPa)', 'p_A (kPa)', 'p_B (kPa)', 'y_A* (eq)'],
          rows: pxySeries.map((pt) => [
            pt.moleFraction,
            pt.bubblePressure_kPa,
            pt.dewPressure_kPa,
            pt.partialPressureA_kPa,
            pt.partialPressureB_kPa,
            pt.equilibriumVapor_yA,
          ]),
        },
      ]);
    }
  };

  return (
    <section
      className="py-5 lg:py-6"
      aria-label="Chemical Engineering Thermodynamics Virtual Laboratory"
    >
      <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
        {/* Shared Workspace Header with Compact Module Switcher Slot */}
        <LabWorkspaceHeader
          kickerItems={['Lab 05', 'Thermodynamics', 'SI Units']}
          title="Chemical Engineering Thermodynamics Virtual Laboratory"
          description="Explore Peng–Robinson real-gas compressibility ($Z$) and isothermal Raoult's Law binary $P\\text{–}x\\text{–}y$ phase envelopes."
          headerSlot={
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                Active Module
              </span>
              <div
                className="inline-flex w-full sm:w-auto rounded-xl bg-slate-100 p-1 gap-1"
                role="tablist"
                aria-label="Thermodynamics Laboratory Modules"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-real-gas-pvt"
                  aria-selected={activeModule === 'real-gas-pvt'}
                  onClick={() => setActiveModule('real-gas-pvt')}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeModule === 'real-gas-pvt'
                      ? 'bg-white text-teal-800 shadow-2xs ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Gauge className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span>Module A · Real-Gas PVT (PR EOS)</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-binary-vle"
                  aria-selected={activeModule === 'binary-vle'}
                  onClick={() => setActiveModule('binary-vle')}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeModule === 'binary-vle'
                      ? 'bg-white text-teal-800 shadow-2xs ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span>Module B · Binary VLE (Raoult–Dalton)</span>
                </button>
              </div>
            </div>
          }
          presets={
            activeModule === 'real-gas-pvt'
              ? THERMO_PVT_PRESETS.map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  expectedObservation: p.expectedObservation,
                }))
              : THERMO_VLE_PRESETS.map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  expectedObservation: p.expectedObservation,
                }))
          }
          selectedPresetId={
            activeModule === 'real-gas-pvt' ? activePvtPresetId : activeVlePresetId
          }
          onSelectPreset={(id) => {
            if (activeModule === 'real-gas-pvt') {
              handleApplyPvtPreset(id);
            } else {
              handleApplyVlePreset(id);
            }
          }}
          onSaveScenario={
            activeModule === 'real-gas-pvt' ? handleSavePvtScenario : handleSaveVleScenario
          }
          savedCount={
            activeModule === 'real-gas-pvt'
              ? savedPvtScenarios.length
              : savedVleScenarios.length
          }
          canSave={
            activeModule === 'real-gas-pvt' ? pvtResults.isValid : vleResults.isValid
          }
          onDownloadCsv={handleExportCsv}
          canDownload={
            activeModule === 'real-gas-pvt' ? pvtResults.isValid : vleResults.isValid
          }
          onReset={() => {
            if (activeModule === 'real-gas-pvt') {
              setPvtInputs(DEFAULT_PVT_INPUTS);
              setActivePvtPresetId('moderate-pressure-real-gas');
            } else {
              setVleInputs(DEFAULT_VLE_INPUTS);
              setActiveVlePresetId('equimolar-ideal-mixture');
            }
          }}
          learningObjectives={
            activeModule === 'real-gas-pvt'
              ? [
                  {
                    title: 'Real-Gas Departure ($Z = Pv/RT$):',
                    detail:
                      'Explain why elevated pressure and near-critical temperatures cause $PV = nRT$ to fail.',
                  },
                  {
                    title: 'Peng–Robinson EOS ($a\\alpha, b$):',
                    detail:
                      'Relate critical properties ($T_c, P_c, \\omega$) to attractive cohesion and hard-sphere covolume.',
                  },
                  {
                    title: 'Subcritical Cubic Roots ($Z > B$):',
                    detail:
                      'Distinguish single-phase states from subcritical three-root behavior ($Z_{\\max}$ vapor vs. $Z_{\\min}$ liquid).',
                  },
                  {
                    title: 'Volumetric Error Assessment:',
                    detail:
                      'Quantify percentage molar-volume deviation $\\Delta v / v_{\\mathrm{ideal}}$ for high-pressure sizing.',
                  },
                ]
              : [
                  {
                    title: "Raoult's & Dalton's Laws:",
                    detail:
                      'Compute partial pressures $p_i = x_i P_i^{\\mathrm{sat}} = y_i P$ for ideal liquid-vapor mixtures.',
                  },
                  {
                    title: 'Bubble & Dew Curves:',
                    detail:
                      'Determine bubble-point $P_{\\mathrm{bubble}}(x_A)$ and dew-point $P_{\\mathrm{dew}}(y_A)$ phase boundaries.',
                  },
                  {
                    title: '$P\\text{–}x\\text{–}y$ Envelopes & Tie-Lines:',
                    detail:
                      'Identify compressed liquid, superheated vapor, and two-phase tie-line lever splits at cell pressure $P_{\\mathrm{sys}}$.',
                  },
                  {
                    title: 'Bridge to Distillation:',
                    detail:
                      'Connect thermodynamic relative volatility $\\alpha_{AB} = P_A^{\\mathrm{sat}}/P_B^{\\mathrm{sat}}$ to McCabe–Thiele stage enrichment.',
                  },
                ]
          }
          workflowSteps={
            activeModule === 'real-gas-pvt'
              ? [
                  {
                    title: 'Step 1 · Select Pure Fluid',
                    detail: 'Pick CO2, N2, CH4, or C2H6 or load a benchmark PVT scenario above.',
                  },
                  {
                    title: 'Step 2 · Vary T, P, n & Root',
                    detail: 'Inspect Z(P), P–v isotherms, and subcritical vapor/liquid root branches.',
                  },
                  {
                    title: 'Step 3 · Save Run & Export',
                    detail: 'Use Save Run in the header to build the PVT comparison table or export CSV.',
                  },
                  {
                    title: 'Step 4 · Guided Inquiry',
                    detail: 'Work through the 5 Real-Gas PVT conceptual checks below.',
                  },
                ]
              : [
                  {
                    title: 'Step 1 · Load Mixture Preset',
                    detail: 'Choose a binary volatility scenario or adjust liquid mole fraction x_A.',
                  },
                  {
                    title: 'Step 2 · Perturb Vapor Pressures',
                    detail: 'Modify P_A^sat, P_B^sat, and cell pressure P_sys to inspect two-phase tie-lines.',
                  },
                  {
                    title: 'Step 3 · Save Run & Export',
                    detail: 'Use Save Run in the header to compare alpha_AB and P_bubble across states.',
                  },
                  {
                    title: 'Step 4 · Guided Inquiry',
                    detail: 'Work through the 5 Binary VLE conceptual checks below.',
                  },
                ]
          }
        />

        {/* =====================================================================
            MODULE A: PURE-FLUID PVT BEHAVIOR & PENG–ROBINSON EOS
           ===================================================================== */}
        {activeModule === 'real-gas-pvt' && (
          <div className="space-y-6" role="tabpanel" aria-labelledby="tab-real-gas-pvt">
            <LabValidationAlerts
              issues={[
                ...pvtResults.validationErrors.map((message) => ({
                  severity: 'error' as const,
                  message,
                })),
                ...pvtResults.advisories.map((message) => ({
                  severity: 'warning' as const,
                  message,
                })),
              ]}
              warningTitle="Thermodynamic State & Cubic Root Advisory (Peng–Robinson EOS)"
            />

            {/* Main Grid: Left Controls (4 cols) + Right Visualizations, KPIs & Schematic (8 cols) */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {/* Left Column: Cohesive Fluid Selector & SI State Parameter Panel */}
              <div
                className="lg:col-span-4 min-w-0 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 lg:sticky lg:top-28 lg:self-start"
                data-testid="thermo-pvt-left-col"
              >
                <div className="border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>01. Configure · User Inputs</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    Pure Species &amp; Thermodynamic State
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NIST critical constants &amp; Peng–Robinson state controls
                  </p>
                </div>

                {/* Group 1: Pure Reference Fluid Selector */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5">
                  <div className="text-xs font-bold tracking-wide text-slate-700">
                    1. Reference Chemical Species (NIST)
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(THERMO_REFERENCE_FLUIDS) as ReferenceFluidId[]).map((fid) => {
                      const fl = THERMO_REFERENCE_FLUIDS[fid];
                      const isSelected = pvtInputs.fluidId === fid;
                      return (
                        <button
                          key={fid}
                          type="button"
                          onClick={() => handleSelectFluid(fid)}
                          className={`rounded-lg border p-2 text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/80 text-teal-950 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              <MathInline latex={fl.formulaLatex} />
                            </span>
                            <span className="text-[10px] font-semibold text-teal-700">
                              ω = {fl.omega.toFixed(3)}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-slate-800 truncate">
                            {fl.name}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                            {fl.Tc_K.toFixed(1)} K · {fl.Pc_bar.toFixed(1)} bar
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Fluid Critical Constants Summary */}
                  <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 text-xs space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 font-mono text-[11px]">
                      <span className="font-sans font-semibold text-slate-800">
                        {pvtResults.fluid.name}:
                      </span>
                      <span className="text-slate-700">
                        <MathInline latex={`T_c = ${pvtResults.fluid.Tc_K.toFixed(2)}\\,\\mathrm{K}`} /> ·{' '}
                        <MathInline latex={`P_c = ${pvtResults.fluid.Pc_bar.toFixed(2)}\\,\\mathrm{bar}`} /> ·{' '}
                        <MathInline latex={`\\omega = ${pvtResults.fluid.omega.toFixed(4)}`} />
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-slate-500">
                      {pvtResults.fluid.engineeringContext}
                    </p>
                  </div>
                </div>

                {/* Group 2: Thermodynamic State Controls (T, P, n) */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
                  <div className="text-xs font-bold tracking-wide text-slate-700">
                    2. Operating State Variables
                  </div>

                  {/* Temperature T [K] */}
                  <div className="bg-white rounded-lg border border-slate-200/70 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="pvt-temp-input" className="text-xs font-semibold text-slate-800 leading-snug">
                        Temperature <span className="text-slate-500 font-normal">(<MathInline latex="T" />)</span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id="pvt-temp-input"
                          type="number"
                          aria-label="Absolute Temperature (T, K) numeric input"
                          min={80}
                          max={1000}
                          step={1}
                          value={pvtInputs.temperature_K}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isFinite(val)) return;
                            setPvtInputs((prev) => ({ ...prev, temperature_K: val }));
                            setActivePvtPresetId('custom');
                          }}
                          className="w-24 min-w-[6rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                          data-testid="number-thermo-temperature"
                        />
                        <span className="text-[11px] font-mono text-slate-500">K</span>
                      </div>
                    </div>
                    <input
                      id="pvt-temp-slider"
                      type="range"
                      aria-label="Absolute Temperature (T, K) slider"
                      min={120}
                      max={600}
                      step={1}
                      value={Math.min(Math.max(pvtInputs.temperature_K, 120), 600)}
                      onChange={(e) => {
                        setPvtInputs((prev) => ({
                          ...prev,
                          temperature_K: Number(e.target.value),
                        }));
                        setActivePvtPresetId('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                      data-testid="slider-thermo-temperature"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>Min: 120 K</span>
                      <span className="text-slate-500">
                        {(pvtInputs.temperature_K - 273.15).toFixed(1)} °C · T_c={pvtResults.fluid.Tc_K.toFixed(1)} K
                      </span>
                      <span>Max: 600 K</span>
                    </div>
                  </div>

                  {/* Pressure P [bar] */}
                  <div className="bg-white rounded-lg border border-slate-200/70 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="pvt-pressure-input" className="text-xs font-semibold text-slate-800 leading-snug">
                        Pressure <span className="text-slate-500 font-normal">(<MathInline latex="P" />)</span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id="pvt-pressure-input"
                          type="number"
                          aria-label="Absolute Pressure (P, bar) numeric input"
                          min={0.5}
                          max={500}
                          step={0.5}
                          value={Number((pvtInputs.pressure_Pa / 1e5).toFixed(2))}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isFinite(val)) return;
                            setPvtInputs((prev) => ({ ...prev, pressure_Pa: val * 1e5 }));
                            setActivePvtPresetId('custom');
                          }}
                          className="w-24 min-w-[6rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                          data-testid="number-thermo-pressure"
                        />
                        <span className="text-[11px] font-mono text-slate-500">bar</span>
                      </div>
                    </div>
                    <input
                      id="pvt-pressure-slider"
                      type="range"
                      aria-label="Absolute Pressure (P, bar) slider"
                      min={1}
                      max={300}
                      step={0.5}
                      value={Math.min(Math.max(pvtInputs.pressure_Pa / 1e5, 1), 300)}
                      onChange={(e) => {
                        setPvtInputs((prev) => ({
                          ...prev,
                          pressure_Pa: Number(e.target.value) * 1e5,
                        }));
                        setActivePvtPresetId('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                      data-testid="slider-thermo-pressure"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>Min: 1 bar</span>
                      <span className="text-slate-500">
                        {(pvtInputs.pressure_Pa / 1e6).toFixed(2)} MPa · P_c={pvtResults.fluid.Pc_bar.toFixed(1)} bar
                      </span>
                      <span>Max: 300 bar</span>
                    </div>
                  </div>

                  {/* Moles n [mol] */}
                  <div className="bg-white rounded-lg border border-slate-200/70 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="pvt-moles-input" className="text-xs font-semibold text-slate-800 leading-snug">
                        Molar Amount <span className="text-slate-500 font-normal">(<MathInline latex="n" />)</span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id="pvt-moles-input"
                          type="number"
                          aria-label="Molar Amount (n, mol) numeric input"
                          min={0.1}
                          max={50}
                          step={0.5}
                          value={pvtInputs.moles_n ?? 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isFinite(val)) return;
                            setPvtInputs((prev) => ({ ...prev, moles_n: val }));
                          }}
                          className="w-24 min-w-[6rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                          data-testid="number-thermo-moles"
                        />
                        <span className="text-[11px] font-mono text-slate-500">mol</span>
                      </div>
                    </div>
                    <input
                      id="pvt-moles-slider"
                      type="range"
                      aria-label="Molar Amount (n, mol) slider"
                      min={0.5}
                      max={10}
                      step={0.5}
                      value={Math.min(Math.max(pvtInputs.moles_n ?? 1.0, 0.5), 10)}
                      onChange={(e) =>
                        setPvtInputs((prev) => ({
                          ...prev,
                          moles_n: Number(e.target.value),
                        }))
                      }
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                      data-testid="slider-thermo-moles"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>Min: 0.5</span>
                      <span>Max: 10</span>
                    </div>
                  </div>
                </div>

                {/* Group 3: Multi-Root Branch Selector */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      3. Cubic Root Branch (<MathInline latex="Z > B" />)
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 border border-slate-200">
                      {pvtResults.rootDiagnosis.hasMultipleValidRoots
                        ? '3 Real Roots Active'
                        : '1 Unique Root'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectRootPreference('vapor')}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        pvtInputs.rootPreference !== 'liquid'
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Vapor Root (<MathInline latex="Z_{\max}" />)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRootPreference('liquid')}
                      disabled={!pvtResults.rootDiagnosis.hasMultipleValidRoots}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed ${
                        pvtInputs.rootPreference === 'liquid' &&
                        pvtResults.rootDiagnosis.hasMultipleValidRoots
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-45'
                      }`}
                    >
                      Liquid Root (<MathInline latex="Z_{\min}" />)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Simulation-First Hierarchy (Charts -> 4 Primary KPIs -> 3-Root -> Additional Metrics -> Schematic -> Saved Table) */}
              <div className="space-y-5 lg:col-span-8" data-testid="thermo-pvt-right-col">
                {/* 1. Primary PVT Visualization First */}
                <PureFluidPVTCharts
                  results={pvtResults}
                  pressureSweepSeries={pressureSweepSeries}
                  isothermData={isothermData}
                  savedScenarios={savedPvtScenarios}
                  onRemoveScenario={(id) =>
                    setSavedPvtScenarios((prev) => prev.filter((s) => s.id !== id))
                  }
                  onClearScenarios={() => setSavedPvtScenarios([])}
                  renderSection="charts"
                />

                {/* 2. 4 Primary KPI Cards Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <LabMetricCard
                    label="Compressibility ($Z = Pv/RT$)"
                    value={pvtResults.compressibilityFactor_Z.toFixed(4)}
                    subtext={`Ideal Z = 1.000 (${pvtResults.regime})`}
                    valueClassName="text-2xl text-teal-800"
                    testId="kpi-pvt-z"
                  />
                  <LabMetricCard
                    label="PR Molar Volume ($v_{\mathrm{PR}}$)"
                    value={`${pvtResults.prMolarVolume_L_mol.toFixed(4)} L/mol`}
                    subtext={`Total V = ${pvtResults.totalVolumePR_L.toFixed(3)} L (${pvtResults.moles_n.toFixed(1)} mol)`}
                    testId="kpi-pvt-vpr"
                  />
                  <LabMetricCard
                    label="Ideal Volume ($v_{\mathrm{ideal}} = RT/P$)"
                    value={`${pvtResults.idealMolarVolume_L_mol.toFixed(4)} L/mol`}
                    subtext={`Total V_ideal = ${pvtResults.totalVolumeIdeal_L.toFixed(3)} L`}
                    testId="kpi-pvt-videal"
                  />
                  <LabMetricCard
                    label="Volume Deviation ($\Delta v / v_{\mathrm{ideal}}$)"
                    value={`${pvtResults.volumeDeviationPercent >= 0 ? '+' : ''}${pvtResults.volumeDeviationPercent.toFixed(2)}%`}
                    subtext={
                      pvtResults.volumeDeviationPercent < 0
                        ? 'Attraction-dominated (Z < 1)'
                        : 'Repulsion-dominated (Z > 1)'
                    }
                    valueClassName={
                      Math.abs(pvtResults.volumeDeviationPercent) > 15
                        ? 'text-2xl text-amber-800'
                        : 'text-2xl text-slate-900'
                    }
                    testId="kpi-pvt-deviation"
                  />
                </div>

                {/* 3. Multi-Root Diagnostic Strip when 3 roots exist */}
                {pvtResults.rootDiagnosis.hasMultipleValidRoots && (
                  <div
                    className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 text-xs text-purple-950"
                    data-testid="pvt-multi-root-diagnostic"
                  >
                    <div className="font-bold">
                      Subcritical Three-Root Diagnostic (<MathInline latex="T < T_c" />):
                    </div>
                    <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3 font-mono">
                      <div className="rounded bg-white/90 px-2.5 py-1.5 border border-purple-200">
                        <strong>Vapor-like (<MathInline latex="Z_{\max}" />):</strong>{' '}
                        {pvtResults.rootDiagnosis.vaporLikeRoot_Z.toFixed(4)} (
                        {pvtResults.vaporLikeMolarVolume_L_mol.toFixed(4)} L/mol)
                      </div>
                      <div className="rounded bg-white/90 px-2.5 py-1.5 border border-purple-200">
                        <strong>Liquid-like (<MathInline latex="Z_{\min}" />):</strong>{' '}
                        {pvtResults.rootDiagnosis.liquidLikeRoot_Z?.toFixed(4) ?? '—'} (
                        {pvtResults.liquidLikeMolarVolume_L_mol?.toFixed(4) ?? '—'} L/mol)
                      </div>
                      <div className="rounded bg-white/90 px-2.5 py-1.5 border border-purple-200">
                        <strong>Unstable Spinodal (<MathInline latex="Z_{\mathrm{mid}}" />):</strong>{' '}
                        {pvtResults.rootDiagnosis.unstableMiddleRoot_Z?.toFixed(4) ?? '—'}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Additional Metrics Disclosure (2 secondary metrics) */}
                <LabAdditionalMetricsDisclosure
                  count={2}
                  summary="Reduced coordinates ($T_r, P_r$) & dimensionless PR groups ($A, B$)"
                  testId="thermo-pvt-additional-metrics"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                    <LabMetricCard
                      label="Reduced Coordinates ($T_r, P_r$)"
                      value={`${pvtResults.reducedTemperature_Tr.toFixed(3)} / ${pvtResults.reducedPressure_Pr.toFixed(3)}`}
                      subtext={`α(T_r, ω) = ${pvtResults.alpha.toFixed(4)}, κ = ${pvtResults.kappa.toFixed(4)}`}
                    />
                    <LabMetricCard
                      label="Dimensionless PR Groups ($A, B$)"
                      value={`${pvtResults.dimensionless_A.toFixed(4)} / ${pvtResults.dimensionless_B.toFixed(4)}`}
                      subtext={`Max cubic residual |f(Z)| = ${pvtResults.rootDiagnosis.maxResidual.toExponential(1)}`}
                    />
                  </div>
                </LabAdditionalMetricsDisclosure>

                {/* 5. Interactive Piston-Cylinder State Schematic */}
                <PureFluidPVTSchematic results={pvtResults} />

                {/* 6. Saved PVT Scenarios Comparison Table */}
                <PureFluidPVTCharts
                  results={pvtResults}
                  pressureSweepSeries={pressureSweepSeries}
                  isothermData={isothermData}
                  savedScenarios={savedPvtScenarios}
                  onRemoveScenario={(id) =>
                    setSavedPvtScenarios((prev) => prev.filter((s) => s.id !== id))
                  }
                  onClearScenarios={() => setSavedPvtScenarios([])}
                  renderSection="saved"
                />
              </div>
            </div>

            {/* Assumptions & Theory Disclosure for Module A */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <LabAssumptionsCard
                  eyebrow="Model Scope & Limitations · Peng–Robinson EOS"
                  title="Documented Engineering Assumptions"
                  assumptions={PVT_MODEL_ASSUMPTIONS}
                />
              </div>
              <div className="lg:col-span-7">
                <LabTheoryDisclosureCard
                  eyebrow="Mathematical Formulation · Peng–Robinson Equation of State"
                  title="Ideal Gas, Compressibility Factor $Z$, and Cubic Equations of State"
                  subtitle="How Peng and Robinson (1976) modified the van der Waals attractive and repulsive terms to accurately predict real-fluid PVT behavior from critical constants $T_c, P_c, \omega$."
                  expandLabel="Expand Peng–Robinson Equations & Nomenclature"
                  collapseLabel="Hide Peng–Robinson Equations"
                  concepts={[
                    {
                      title: 'Compressibility Factor Z',
                      body: (
                        <>
                          Defined as <MathInline latex="Z = \frac{Pv}{RT}" />. For an ideal gas,{' '}
                          <MathInline latex="Z = 1" /> at all states. For real fluids,{' '}
                          <MathInline latex="Z < 1" /> when cohesive attraction dominates and{' '}
                          <MathInline latex="Z > 1" /> when hard-sphere repulsion dominates.
                        </>
                      ),
                    },
                    {
                      title: 'Peng–Robinson Pressure Form',
                      body: (
                        <>
                          Expresses pressure as{' '}
                          <MathInline latex="P = \frac{RT}{v - b} - \frac{a\alpha(T_r,\omega)}{v(v + b) + b(v - b)}" />,
                          requiring physical molar volume <MathInline latex="v > b" />.
                        </>
                      ),
                    },
                    {
                      title: 'Critical Parameters & α(T_r, ω)',
                      body: (
                        <>
                          At the critical inflection point,{' '}
                          <MathInline latex="a = 0.45724\frac{R^2T_c^2}{P_c}" /> and{' '}
                          <MathInline latex="b = 0.07780\frac{RT_c}{P_c}" />, scaled by{' '}
                          <MathInline latex="\alpha = \left[1 + \kappa(1 - \sqrt{T_r})\right]^2" />.
                        </>
                      ),
                    },
                    {
                      title: 'Dimensionless Cubic in Z',
                      body: (
                        <>
                          Substituting <MathInline latex="v = \frac{ZRT}{P}" /> gives{' '}
                          <MathInline latex="Z^3 - (1-B)Z^2 + (A - 3B^2 - 2B)Z - (AB - B^2 - B^3) = 0" />.
                        </>
                      ),
                    },
                  ]}
                  detailedBlocks={[
                    {
                      title: '01. Ideal Gas Law & Compressibility Factor Definition',
                      subtitle: 'Molar volume and dimensionless departure from ideal-gas behavior:',
                      equations: [
                        {
                          latex: 'PV = nRT, \\qquad Pv_{\\mathrm{ideal}} = RT',
                          equationNumber: '5.1',
                        },
                        {
                          latex:
                            'Z = \\frac{Pv}{RT} = \\frac{v_{\\mathrm{actual}}}{v_{\\mathrm{ideal}}}',
                          equationNumber: '5.2',
                          tone: 'teal',
                        },
                      ],
                      definitions: [
                        {
                          symbolLatex: 'P,\\, T',
                          description: 'Absolute pressure and absolute temperature',
                          unitLatex: '\\mathrm{Pa,\\; K}',
                        },
                        {
                          symbolLatex: 'v',
                          description: 'Molar volume ($V / n$)',
                          unitLatex: '\\mathrm{m^3/mol}',
                        },
                        {
                          symbolLatex: 'R',
                          description: `Universal gas constant (${GAS_CONSTANT_R.toFixed(5)})`,
                          unitLatex: '\\mathrm{J/(mol\\cdot K)}',
                        },
                      ],
                    },
                    {
                      title: '02. Peng–Robinson Equation of State & Critical Constants',
                      subtitle: 'Explicit pressure equation and temperature-dependent attraction parameter:',
                      equations: [
                        {
                          latex:
                            'P = \\frac{RT}{v - b} - \\frac{a\\alpha}{v(v + b) + b(v - b)}',
                          equationNumber: '5.3',
                          tone: 'teal',
                        },
                        {
                          latex:
                            'a = 0.45724 \\frac{R^2 T_c^2}{P_c}, \\qquad b = 0.07780 \\frac{R T_c}{P_c}',
                          equationNumber: '5.4',
                        },
                        {
                          latex:
                            '\\alpha(T_r, \\omega) = \\left[1 + \\kappa\\left(1 - \\sqrt{T_r}\\right)\\right]^2, \\quad \\kappa = 0.37464 + 1.54226\\omega - 0.26992\\omega^2',
                          equationNumber: '5.5',
                          tone: 'muted',
                        },
                      ],
                      definitions: [
                        {
                          symbolLatex: 'T_c,\\, P_c,\\, \\omega',
                          description: 'Critical temperature, critical pressure, and Pitzer acentric factor',
                          unitLatex: '\\mathrm{K,\\; Pa,\\; -}',
                        },
                        {
                          symbolLatex: 'a,\\, b',
                          description: 'Peng–Robinson cohesive attraction and hard-sphere covolume parameters',
                          unitLatex: '\\mathrm{Pa\\cdot m^6/mol^2,\\; m^3/mol}',
                        },
                      ],
                    },
                    {
                      title: '03. Polynomial Cubic Form in Compressibility Factor Z',
                      subtitle: 'Dimensionless polynomial solved analytically for real roots $Z > B$:',
                      equations: [
                        {
                          latex:
                            'Z^3 - (1 - B)Z^2 + (A - 3B^2 - 2B)Z - (AB - B^2 - B^3) = 0',
                          equationNumber: '5.6',
                          tone: 'teal',
                        },
                        {
                          latex:
                            'A = \\frac{a\\alpha P}{R^2 T^2}, \\qquad B = \\frac{bP}{RT}',
                          equationNumber: '5.7',
                        },
                      ],
                      definitions: [
                        {
                          symbolLatex: 'A,\\, B',
                          description: 'Dimensionless Peng–Robinson attraction and covolume groups',
                          unitLatex: '\\text{dimensionless}',
                        },
                      ],
                    },
                  ]}
                />
              </div>
            </div>

            {/* Step 4: Guided Engineering Inquiry for Module A (5 Questions) */}
            <LabGuidedInquiryCard<PureFluidPVTInputs>
              questions={THERMO_PVT_GUIDED_QUESTIONS}
              onApplyInputs={(suggested) => {
                setPvtInputs({ ...suggested });
                setActivePvtPresetId('guided');
              }}
              derivationHeading="Peng–Robinson & Real-Gas PVT Explanation"
            />
          </div>
        )}

        {/* =====================================================================
            MODULE B: IDEAL BINARY VAPOR–LIQUID EQUILIBRIUM (RAOULT & DALTON)
           ===================================================================== */}
        {activeModule === 'binary-vle' && (
          <div className="space-y-6" role="tabpanel" aria-labelledby="tab-binary-vle">
            <LabValidationAlerts
              issues={[
                ...vleResults.validationErrors.map((message) => ({
                  severity: 'error' as const,
                  message,
                })),
                ...vleResults.advisories.map((message) => ({
                  severity: 'warning' as const,
                  message,
                })),
              ]}
              warningTitle="Phase Equilibrium & Tie-Line State Advisory (Raoult–Dalton VLE)"
            />

            {/* Main Grid: Left Controls (4 cols) + Right Visualizations, KPIs & Schematic (8 cols) */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              {/* Left Column: Cohesive VLE Mixture & Saturation Controls */}
              <div
                className="lg:col-span-4 min-w-0 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 lg:sticky lg:top-28 lg:self-start"
                data-testid="thermo-vle-left-col"
              >
                <div className="border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>01. Configure · User Inputs</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    Binary Mixture &amp; Cell Pressure
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hypothetical ideal components A &amp; B (Raoult&apos;s Law)
                  </p>
                </div>

                {/* Group 1: Mixture Composition & Vapor Pressures */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
                  <div className="text-xs font-bold tracking-wide text-slate-700">
                    1. Composition &amp; Pure Vapor Pressures
                  </div>

                  {/* Liquid Mole Fraction x_A */}
                  <div className="bg-white rounded-lg border border-slate-200/70 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="vle-xa-input" className="text-xs font-semibold text-slate-800 leading-snug">
                        Liquid Mole Fraction <span className="text-slate-500 font-normal">(<MathInline latex="x_A" />)</span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id="vle-xa-input"
                          type="number"
                          aria-label="Liquid Mole Fraction (x_A, mol/mol) numeric input"
                          min={0}
                          max={1}
                          step={0.01}
                          value={vleInputs.liquidMoleFraction_xA}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isFinite(val)) return;
                            setVleInputs((prev) => ({ ...prev, liquidMoleFraction_xA: val }));
                            setActiveVlePresetId('custom');
                          }}
                          className="w-20 min-w-[5rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                          data-testid="number-vle-xa"
                        />
                        <span className="text-[11px] font-mono text-slate-500">frac</span>
                      </div>
                    </div>
                    <input
                      id="vle-xa-slider"
                      type="range"
                      aria-label="Liquid Mole Fraction (x_A, mol/mol) slider"
                      min={0}
                      max={1}
                      step={0.01}
                      value={Math.min(Math.max(vleInputs.liquidMoleFraction_xA, 0), 1)}
                      onChange={(e) => {
                        setVleInputs((prev) => ({
                          ...prev,
                          liquidMoleFraction_xA: Number(e.target.value),
                        }));
                        setActiveVlePresetId('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                      data-testid="slider-vle-xa"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>Min: 0.00</span>
                      <span className="text-slate-500">
                        x_B = {(1 - vleInputs.liquidMoleFraction_xA).toFixed(2)}
                      </span>
                      <span>Max: 1.00</span>
                    </div>
                  </div>

                  {/* Saturation Vapor Pressure P_A^sat [kPa] */}
                  <div className="bg-white rounded-lg border border-slate-200/70 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="vle-psata-input" className="text-xs font-semibold text-slate-800 leading-snug">
                        Pure A Saturation <span className="text-slate-500 font-normal">(<MathInline latex="P_A^{\mathrm{sat}}" />)</span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id="vle-psata-input"
                          type="number"
                          aria-label="Pure A Saturation Pressure (P_A^sat, kPa) numeric input"
                          min={5}
                          max={500}
                          step={1}
                          value={vleInputs.psatA_kPa}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isFinite(val)) return;
                            setVleInputs((prev) => ({ ...prev, psatA_kPa: val }));
                            setActiveVlePresetId('custom');
                          }}
                          className="w-20 min-w-[5rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                          data-testid="number-vle-psata"
                        />
                        <span className="text-[11px] font-mono text-slate-500">kPa</span>
                      </div>
                    </div>
                    <input
                      id="vle-psata-slider"
                      type="range"
                      aria-label="Pure A Saturation Pressure (P_A^sat, kPa) slider"
                      min={20}
                      max={250}
                      step={1}
                      value={Math.min(Math.max(vleInputs.psatA_kPa, 20), 250)}
                      onChange={(e) => {
                        setVleInputs((prev) => ({
                          ...prev,
                          psatA_kPa: Number(e.target.value),
                        }));
                        setActiveVlePresetId('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                      data-testid="slider-vle-psata"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>Min: 20</span>
                      <span>Max: 250</span>
                    </div>
                  </div>

                  {/* Saturation Vapor Pressure P_B^sat [kPa] */}
                  <div className="bg-white rounded-lg border border-slate-200/70 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="vle-psatb-input" className="text-xs font-semibold text-slate-800 leading-snug">
                        Pure B Saturation <span className="text-slate-500 font-normal">(<MathInline latex="P_B^{\mathrm{sat}}" />)</span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id="vle-psatb-input"
                          type="number"
                          aria-label="Pure B Saturation Pressure (P_B^sat, kPa) numeric input"
                          min={5}
                          max={500}
                          step={1}
                          value={vleInputs.psatB_kPa}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isFinite(val)) return;
                            setVleInputs((prev) => ({ ...prev, psatB_kPa: val }));
                            setActiveVlePresetId('custom');
                          }}
                          className="w-20 min-w-[5rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                          data-testid="number-vle-psatb"
                        />
                        <span className="text-[11px] font-mono text-slate-500">kPa</span>
                      </div>
                    </div>
                    <input
                      id="vle-psatb-slider"
                      type="range"
                      aria-label="Pure B Saturation Pressure (P_B^sat, kPa) slider"
                      min={15}
                      max={200}
                      step={1}
                      value={Math.min(Math.max(vleInputs.psatB_kPa, 15), 200)}
                      onChange={(e) => {
                        setVleInputs((prev) => ({
                          ...prev,
                          psatB_kPa: Number(e.target.value),
                        }));
                        setActiveVlePresetId('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                      data-testid="slider-vle-psatb"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>Min: 15</span>
                      <span>Max: 200</span>
                    </div>
                  </div>
                </div>

                {/* Group 2: Operating Cell Pressure P_sys [kPa] */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5">
                  <div className="text-xs font-bold tracking-wide text-slate-700">
                    2. Flash Cell Pressure
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200/70 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="vle-psys-input" className="text-xs font-semibold text-slate-800 leading-snug">
                        Cell Pressure <span className="text-slate-500 font-normal">(<MathInline latex="P_{\mathrm{sys}}" />)</span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id="vle-psys-input"
                          type="number"
                          aria-label="Cell Operating Pressure (P_sys, kPa) numeric input"
                          min={5}
                          max={500}
                          step={0.5}
                          value={vleInputs.systemPressure_kPa}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isFinite(val)) return;
                            setVleInputs((prev) => ({ ...prev, systemPressure_kPa: val }));
                            setActiveVlePresetId('custom');
                          }}
                          className="w-20 min-w-[5rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                          data-testid="number-vle-psys"
                        />
                        <span className="text-[11px] font-mono text-slate-500">kPa</span>
                      </div>
                    </div>
                    <input
                      id="vle-psys-slider"
                      type="range"
                      aria-label="Cell Operating Pressure (P_sys, kPa) slider"
                      min={15}
                      max={250}
                      step={0.5}
                      value={Math.min(Math.max(vleInputs.systemPressure_kPa, 15), 250)}
                      onChange={(e) => {
                        setVleInputs((prev) => ({
                          ...prev,
                          systemPressure_kPa: Number(e.target.value),
                        }));
                        setActiveVlePresetId('custom');
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                      data-testid="slider-vle-psys"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tabular-nums">
                      <span>Min: 15</span>
                      <span>Max: 250</span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-500 leading-snug pt-0.5 border-t border-slate-100">
                      Two-phase window: <MathInline latex="P_{\mathrm{dew}} \le P_{\mathrm{sys}} \le P_{\mathrm{bubble}}" />{' '}
                      ({vleResults.dewPressureAtComposition_kPa.toFixed(1)}–{vleResults.bubblePressure_kPa.toFixed(1)} kPa).
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Simulation-First Hierarchy (Charts -> 4 Primary KPIs -> Additional Metrics -> Schematic -> Saved Table) */}
              <div className="space-y-5 lg:col-span-8" data-testid="thermo-vle-right-col">
                {/* 1. Primary P-x-y, y-x, and Partial Pressure Charts First */}
                <BinaryVLECharts
                  results={vleResults}
                  pxySeries={pxySeries}
                  savedScenarios={savedVleScenarios}
                  onRemoveScenario={(id) =>
                    setSavedVleScenarios((prev) => prev.filter((s) => s.id !== id))
                  }
                  onClearScenarios={() => setSavedVleScenarios([])}
                  renderSection="charts"
                />

                {/* 2. 4 Primary KPI Cards Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <LabMetricCard
                    label="Bubble Pressure ($P_{\mathrm{bubble}}$)"
                    value={`${vleResults.bubblePressure_kPa.toFixed(2)} kPa`}
                    subtext={`First bubble at y_A = ${vleResults.equilibriumVapor_yA.toFixed(4)}`}
                    valueClassName="text-2xl text-teal-800"
                    testId="kpi-vle-pbubble"
                  />
                  <LabMetricCard
                    label="Vapor Composition ($y_A$)"
                    value={vleResults.equilibriumVapor_yA.toFixed(4)}
                    subtext={`y_B = ${vleResults.equilibriumVapor_yB.toFixed(4)} (x_A = ${vleResults.xA.toFixed(2)})`}
                    valueClassName="text-2xl text-teal-800"
                    testId="kpi-vle-ya"
                  />
                  <LabMetricCard
                    label="Dew Pressure ($P_{\mathrm{dew}}$)"
                    value={`${vleResults.dewPressureAtComposition_kPa.toFixed(2)} kPa`}
                    subtext={`First drop at x_A,dew = ${vleResults.equilibriumLiquidAtDew_xA.toFixed(4)}`}
                    testId="kpi-vle-pdew"
                  />
                  <LabMetricCard
                    label={`Cell State @ $P_{\\mathrm{sys}} = ${vleResults.systemPressure_kPa.toFixed(1)}\\,\\mathrm{kPa}$`}
                    value={
                      vleResults.phaseStateAtSystemPressure ===
                      'Two-Phase Vapor–Liquid Equilibrium'
                        ? `2-Phase (V/F = ${(vleResults.vaporMoleFraction_betaV * 100).toFixed(0)}%)`
                        : vleResults.phaseStateAtSystemPressure ===
                            'Compressed (Subcooled) Liquid'
                          ? 'Subcooled Liquid'
                          : 'Superheated Vapor'
                    }
                    subtext={
                      vleResults.tieLineLiquid_xA !== null &&
                      vleResults.tieLineVapor_yA !== null
                        ? `Tie-line: x_A = ${vleResults.tieLineLiquid_xA.toFixed(3)}, y_A = ${vleResults.tieLineVapor_yA.toFixed(3)}`
                        : 'Single-phase region'
                    }
                    valueClassName="text-xl text-amber-900"
                    testId="kpi-vle-cell-state"
                  />
                </div>

                {/* 3. Additional Metrics Disclosure (2 secondary metrics) */}
                <LabAdditionalMetricsDisclosure
                  count={2}
                  summary="Partial pressures ($p_A / p_B$) & relative volatility ($\alpha_{AB}$)"
                  testId="thermo-vle-additional-metrics"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
                    <LabMetricCard
                      label="Partial Pressures ($p_A / p_B$)"
                      value={`${vleResults.partialPressureA_kPa.toFixed(1)} / ${vleResults.partialPressureB_kPa.toFixed(1)} kPa`}
                      subtext={`Sum p_A + p_B = ${vleResults.bubblePressure_kPa.toFixed(2)} kPa`}
                    />
                    <LabMetricCard
                      label="Relative Volatility ($\alpha_{AB} = P_A^{\mathrm{sat}}/P_B^{\mathrm{sat}}$)"
                      value={vleResults.relativeVolatility_alphaAB.toFixed(3)}
                      subtext={`More volatile: ${vleResults.moreVolatileComponent}`}
                    />
                  </div>
                </LabAdditionalMetricsDisclosure>

                {/* 4. Interactive Binary VLE Cell Schematic */}
                <BinaryVLESchematic results={vleResults} />

                {/* 5. Saved Binary VLE States Comparison Table */}
                <BinaryVLECharts
                  results={vleResults}
                  pxySeries={pxySeries}
                  savedScenarios={savedVleScenarios}
                  onRemoveScenario={(id) =>
                    setSavedVleScenarios((prev) => prev.filter((s) => s.id !== id))
                  }
                  onClearScenarios={() => setSavedVleScenarios([])}
                  renderSection="saved"
                />
              </div>
            </div>

            {/* Assumptions & Theory Disclosure for Module B */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <LabAssumptionsCard
                  eyebrow="Model Scope & Limitations · Ideal Binary VLE"
                  title="Documented Engineering Assumptions"
                  assumptions={VLE_MODEL_ASSUMPTIONS}
                />
              </div>
              <div className="lg:col-span-7">
                <LabTheoryDisclosureCard
                  eyebrow="Mathematical Formulation · Raoult's Law & Dalton's Law"
                  title="Ideal Binary Vapor–Liquid Equilibrium & $P\text{–}x\text{–}y$ Phase Diagrams"
                  subtitle="Deriving bubble-point pressure, dew-point pressure, equilibrium vapor enrichment, and constant relative volatility $\alpha_{AB}$ from fundamental phase equilibrium."
                  expandLabel="Expand Binary VLE Equations & Nomenclature"
                  collapseLabel="Hide Binary VLE Equations"
                  concepts={[
                    {
                      title: "Raoult's Law (Liquid Phase)",
                      body: (
                        <>
                          In an ideal liquid mixture, the partial vapor pressure exerted by species{' '}
                          <MathInline latex="i" /> is proportional to its liquid mole fraction:{' '}
                          <MathInline latex="p_i = x_i P_i^{\mathrm{sat}}(T)" />.
                        </>
                      ),
                    },
                    {
                      title: "Dalton's Law (Vapor Phase)",
                      body: (
                        <>
                          In an ideal gas mixture at total pressure <MathInline latex="P" />, each
                          species&apos; partial pressure equals{' '}
                          <MathInline latex="p_i = y_i P" />, where{' '}
                          <MathInline latex="y_A + y_B = 1" />.
                        </>
                      ),
                    },
                    {
                      title: 'Bubble-Point & Dew-Point Curves',
                      body: (
                        <>
                          Summing partial pressures gives{' '}
                          <MathInline latex="P_{\mathrm{bubble}}(x_A) = x_A P_A^{\mathrm{sat}} + (1 - x_A) P_B^{\mathrm{sat}}" />,
                          while summing liquid mole fractions gives{' '}
                          <MathInline latex="\frac{1}{P_{\mathrm{dew}}(y_A)} = \frac{y_A}{P_A^{\mathrm{sat}}} + \frac{1 - y_A}{P_B^{\mathrm{sat}}}" />.
                        </>
                      ),
                    },
                    {
                      title: 'Connection to Distillation',
                      body: (
                        <>
                          The ratio of K-values{' '}
                          <MathInline latex="\alpha_{AB} = \frac{y_A/x_A}{y_B/x_B} = \frac{P_A^{\mathrm{sat}}}{P_B^{\mathrm{sat}}}" />{' '}
                          directly generates the McCabe–Thiele equilibrium curve{' '}
                          <MathInline latex="y_A = \frac{\alpha_{AB} x_A}{1 + (\alpha_{AB} - 1)x_A}" />.
                        </>
                      ),
                    },
                  ]}
                  detailedBlocks={[
                    {
                      title: "01. Raoult's Law, Dalton's Law & Mole-Fraction Normalization",
                      subtitle: 'Equating chemical potentials across an ideal liquid and ideal gas phase:',
                      equations: [
                        {
                          latex:
                            'p_A = y_A P = x_A P_A^{\\mathrm{sat}}, \\qquad p_B = y_B P = (1 - x_A) P_B^{\\mathrm{sat}}',
                          equationNumber: '5.8',
                          tone: 'teal',
                        },
                        {
                          latex: 'x_A + x_B = 1, \\qquad y_A + y_B = 1',
                          equationNumber: '5.9',
                        },
                      ],
                      definitions: [
                        {
                          symbolLatex: 'x_A,\\, x_B',
                          description: 'Liquid-phase mole fractions of components A and B',
                          unitLatex: '\\mathrm{mol/mol}',
                        },
                        {
                          symbolLatex: 'y_A,\\, y_B',
                          description: 'Vapor-phase mole fractions of components A and B',
                          unitLatex: '\\mathrm{mol/mol}',
                        },
                        {
                          symbolLatex: 'P_A^{\\mathrm{sat}},\\, P_B^{\\mathrm{sat}}',
                          description: 'Pure-component saturation vapor pressures at system temperature $T$',
                          unitLatex: '\\mathrm{kPa}',
                        },
                      ],
                    },
                    {
                      title: '02. Bubble-Point Pressure, Dew-Point Pressure & Relative Volatility',
                      subtitle: 'Phase boundaries enclosing the two-phase isothermal VLE lens:',
                      equations: [
                        {
                          latex:
                            'P_{\\mathrm{bubble}}(x_A) = x_A P_A^{\\mathrm{sat}} + (1 - x_A) P_B^{\\mathrm{sat}}, \\qquad y_A = \\frac{x_A P_A^{\\mathrm{sat}}}{P_{\\mathrm{bubble}}}',
                          equationNumber: '5.10',
                          tone: 'teal',
                        },
                        {
                          latex:
                            '\\frac{1}{P_{\\mathrm{dew}}(y_A)} = \\frac{y_A}{P_A^{\\mathrm{sat}}} + \\frac{1 - y_A}{P_B^{\\mathrm{sat}}}',
                          equationNumber: '5.11',
                        },
                        {
                          latex:
                            '\\alpha_{AB} = \\frac{P_A^{\\mathrm{sat}}}{P_B^{\\mathrm{sat}}}, \\qquad y_A = \\frac{\\alpha_{AB} x_A}{1 + (\\alpha_{AB} - 1)x_A}',
                          equationNumber: '5.12',
                          tone: 'muted',
                        },
                      ],
                      definitions: [
                        {
                          symbolLatex: 'P_{\\mathrm{bubble}},\\, P_{\\mathrm{dew}}',
                          description: 'Isothermal bubble-point and dew-point boundary pressures',
                          unitLatex: '\\mathrm{kPa}',
                        },
                        {
                          symbolLatex: '\\alpha_{AB}',
                          description: 'Intrinsic relative volatility of component A with respect to B',
                          unitLatex: '\\text{dimensionless}',
                        },
                      ],
                    },
                  ]}
                />
              </div>
            </div>

            {/* Step 4: Guided Engineering Inquiry for Module B (5 Questions) */}
            <LabGuidedInquiryCard<BinaryVLEInputs>
              questions={THERMO_VLE_GUIDED_QUESTIONS}
              onApplyInputs={(suggested) => {
                setVleInputs({ ...suggested });
                setActiveVlePresetId('guided');
              }}
              derivationHeading="Raoult–Dalton Binary VLE Explanation"
            />
          </div>
        )}
      </div>
    </section>
  );
}
