'use client';

import React, { useMemo, useState } from 'react';
import {
  DEFAULT_FLUID_MECHANICS_INPUTS,
  FLUID_MECHANICS_PRESETS,
  FluidMechanicsInputs,
  calculateFluidMechanics,
} from '@/lib/fluid-mechanics';
import { FLUID_GUIDED_EXPLORATION_QUESTIONS } from '@/lib/labs-data';
import { downloadSimulationCsv } from '@/lib/lab-download';
import {
  LabAdditionalMetricsDisclosure,
  LabAssumptionsCard,
  LabControlGroup,
  LabGuidedInquiryCard,
  LabMetricCard,
  LabParameterPanel,
  LabSliderControlConfig,
  LabTheoryDisclosureCard,
  LabValidationAlerts,
  LabWorkspaceHeader,
  MathInline,
} from '@/components/lab-shared';
import { FluidMechanicsSchematic } from './fluid-mechanics-schematic';
import {
  FluidMechanicsCharts,
  SavedFluidScenario,
} from './fluid-mechanics-charts';
import { CheckCircle2, Info } from 'lucide-react';

type FluidControlGroup = 'flow' | 'pipe' | 'fluid' | 'pumping';

const FLUID_CONTROL_GROUPS: LabControlGroup[] = [
  { id: 'flow', title: 'Flow Condition' },
  { id: 'pipe', title: 'Pipe Geometry & Roughness' },
  { id: 'fluid', title: 'Fluid Physical Properties' },
  { id: 'pumping', title: 'Elevation & Pump Efficiency' },
];

const FLUID_PARAMETER_CONTROLS: LabSliderControlConfig<
  Extract<keyof FluidMechanicsInputs, string>
>[] = [
  {
    key: 'flowRate_L_s',
    label: 'Volumetric Flow Rate',
    symbol: 'Q',
    symbolLatex: 'Q',
    unit: 'L/s',
    unitLatex: '\\mathrm{L/s}',
    min: 0,
    max: 40,
    step: 0.5,
    inputMin: 0,
    inputMax: 500,
    inputStep: 'any',
    group: 'flow',
  },
  {
    key: 'diameter_m',
    label: 'Pipe Internal Diameter',
    symbol: 'D',
    symbolLatex: 'D',
    unit: 'm',
    unitLatex: '\\mathrm{m}',
    min: 0.015,
    max: 0.3,
    step: 0.005,
    inputMin: 0.002,
    inputMax: 2.0,
    inputStep: 'any',
    group: 'pipe',
  },
  {
    key: 'length_m',
    label: 'Straight Pipe Length',
    symbol: 'L',
    symbolLatex: 'L',
    unit: 'm',
    unitLatex: '\\mathrm{m}',
    min: 1,
    max: 500,
    step: 5,
    inputMin: 0,
    inputMax: 10000,
    inputStep: 'any',
    group: 'pipe',
  },
  {
    key: 'roughness_mm',
    label: 'Absolute Roughness',
    symbol: 'ε',
    symbolLatex: '\\varepsilon',
    unit: 'mm',
    unitLatex: '\\mathrm{mm}',
    min: 0,
    max: 2.0,
    step: 0.005,
    inputMin: 0,
    inputMax: 50,
    inputStep: 'any',
    group: 'pipe',
    helperText: 'Smooth tubing $\\approx 0.0015\\text{ mm}$ · Commercial steel $\\approx 0.045\\text{ mm}$ · Cast iron $\\approx 0.26\\text{–}0.8\\text{ mm}$',
  },
  {
    key: 'minorLossK',
    label: 'Total Minor-Loss Coeff.',
    symbol: 'ΣK',
    symbolLatex: '\\sum K',
    unit: '—',
    min: 0,
    max: 35,
    step: 0.5,
    inputMin: 0,
    inputMax: 500,
    inputStep: 'any',
    group: 'pipe',
  },
  {
    key: 'density_kg_m3',
    label: 'Fluid Density',
    symbol: 'ρ',
    symbolLatex: '\\rho',
    unit: 'kg/m³',
    unitLatex: '\\mathrm{kg/m^3}',
    min: 500,
    max: 1600,
    step: 5,
    inputMin: 0.1,
    inputMax: 5000,
    inputStep: 'any',
    group: 'fluid',
  },
  {
    key: 'viscosity_Pa_s',
    label: 'Dynamic Viscosity',
    symbol: 'μ',
    symbolLatex: '\\mu',
    unit: 'Pa·s',
    unitLatex: '\\mathrm{Pa\\cdot s}',
    min: 0.0003,
    max: 0.1,
    step: 0.0005,
    inputMin: 0.00001,
    inputMax: 50,
    inputStep: 'any',
    group: 'fluid',
    helperText: 'Water ($20\\,^\\circ\\mathrm{C}$) $\\approx 0.001002\\text{ Pa}\\cdot\\text{s}$ · Glycerin solution $\\approx 0.050\\text{ Pa}\\cdot\\text{s}$',
  },
  {
    key: 'elevationDiff_m',
    label: 'Elevation Rise',
    symbol: 'Δz',
    symbolLatex: '\\Delta z',
    unit: 'm',
    unitLatex: '\\mathrm{m}',
    min: 0,
    max: 50,
    step: 1,
    inputMin: 0,
    inputMax: 500,
    inputStep: 'any',
    group: 'pumping',
  },
  {
    key: 'pumpEfficiency_pct',
    label: 'Pump Efficiency',
    symbol: 'η',
    symbolLatex: '\\eta',
    unit: '%',
    min: 20,
    max: 95,
    step: 1,
    inputMin: 1,
    inputMax: 100,
    inputStep: 'any',
    group: 'pumping',
  },
];

const FLUID_LEARNING_OBJECTIVES = [
  {
    title: '1. Reynolds & Regimes:',
    detail: 'Classify Laminar ($\\mathrm{Re} < 2,100$), Transitional ($2,100\\text{–}4,000$), and Turbulent ($\\mathrm{Re} > 4,000$) pipe flow.',
  },
  {
    title: '2. Friction & Moody Chart:',
    detail: 'Contrast roughness-independent $64/\\mathrm{Re}$ laminar flow against Colebrook–White turbulent drag.',
  },
  {
    title: '3. Major vs. Minor Losses:',
    detail: 'Evaluate $D^{-5}$ diameter sensitivity and compare straight-pipe $h_f$ with fitting losses $h_m$.',
  },
  {
    title: '4. Pump Head & Power:',
    detail: 'Distinguish frictional $\\Delta P_{\\mathrm{f}}$ from static elevation lift $\\Delta z$ and size required shaft power $P_s$.',
  },
];

const FLUID_WORKFLOW_STEPS = [
  {
    title: 'Step 1 — Configure',
    detail: 'Select a hydraulic preset or tune flow rate $Q$, pipe diameter $D$, roughness $\\varepsilon$, and fluid $\\mu$.',
  },
  {
    title: 'Step 2 — Simulate',
    detail: 'Inspect velocity $v$, Reynolds number $\\mathrm{Re}$, Darcy/Fanning friction factors, head losses, and pump power.',
  },
  {
    title: 'Step 3 — Analyze',
    detail: 'Examine $\\Delta P$ vs. $Q$, the log-log Moody diagram, pump head curves, and saved scenario rows.',
  },
  {
    title: 'Step 4 — Reflect',
    detail: 'Test the 5 guided fluid-mechanics hypotheses and verify your reasoning with self-checks.',
  },
];

const FLUID_MODEL_ASSUMPTIONS = [
  {
    label: '1. Steady incompressible flow',
    detail: '$\\partial/\\partial t = 0$; constant $\\rho$ and single-phase Newtonian fluid',
  },
  {
    label: '2. Isothermal properties',
    detail: 'Viscosity $\\mu$ and density $\\rho$ remain uniform along the pipe',
  },
  {
    label: '3. Uniform circular pipe',
    detail: 'Constant internal diameter $D$ and equivalent roughness $\\varepsilon$',
  },
  {
    label: '4. Fully developed & lumped $K$',
    detail: 'Entrance effects and fitting interactions lumped into $\\sum K$',
  },
  {
    label: '5. Equal terminal gauge $P$',
    detail: 'Introductory model assumes $P_1 = P_2$ (gauge) and $\\Delta z \\ge 0\\text{ m}$',
  },
  {
    label: '6. Transitional uncertainty',
    detail: '$\\mathrm{Re} \\in [2100, 4000]$ flags Colebrook–White as reference only',
  },
  {
    label: '7. No $H\\text{–}Q$ curve / NPSH',
    detail: 'Pump curves and cavitation margins planned for later modules',
  },
];

function buildInitialFluidScenario(): SavedFluidScenario {
  const res = calculateFluidMechanics(DEFAULT_FLUID_MECHANICS_INPUTS);
  return {
    id: 'fluid-baseline-default',
    label: 'Baseline (20 °C Water, D=80mm)',
    inputs: { ...DEFAULT_FLUID_MECHANICS_INPUTS },
    velocity_m_s: res.velocity_m_s,
    reynoldsNumber: res.reynoldsNumber,
    flowRegime: res.flowRegime,
    darcyFrictionFactor: res.darcyFrictionFactor,
    frictionalPressureLoss_kPa: res.frictionalPressureLoss_kPa,
    requiredPumpHead_m: res.requiredPumpHead_m,
    shaftPower_kW: res.shaftPower_kW,
  };
}

export function FluidMechanicsLab() {
  const [inputs, setInputs] = useState<FluidMechanicsInputs>({
    ...DEFAULT_FLUID_MECHANICS_INPUTS,
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('water-baseline');
  const [savedScenarios, setSavedScenarios] = useState<SavedFluidScenario[]>(() => [
    buildInitialFluidScenario(),
  ]);

  const results = useMemo(() => calculateFluidMechanics(inputs), [inputs]);

  const handleInputChange = (
    key: Extract<keyof FluidMechanicsInputs, string>,
    rawValue: string
  ) => {
    const parsed = parseFloat(rawValue);
    setSelectedPresetId('custom');
    setInputs((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleReset = () => {
    setSelectedPresetId('water-baseline');
    setInputs({ ...DEFAULT_FLUID_MECHANICS_INPUTS });
  };

  const handleSelectPreset = (presetId: string) => {
    const found = FLUID_MECHANICS_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedPresetId(found.id);
      setInputs({ ...found.inputs });
    }
  };

  const handleApplyGuidedInputs = (guidedInputs: FluidMechanicsInputs) => {
    setSelectedPresetId('custom');
    setInputs({ ...guidedInputs });
  };

  const handleSaveCurrentScenario = (customLabel?: string) => {
    if (!results.isValid) return;
    const nextNumber = savedScenarios.length + 1;
    const trimmed = customLabel?.trim();
    const newScenario: SavedFluidScenario = {
      id: `fluid-run-${Date.now()}`,
      label: trimmed
        ? trimmed
        : `Run #${nextNumber} (Q=${inputs.flowRate_L_s.toFixed(1)} L/s)`,
      inputs: { ...inputs },
      velocity_m_s: results.velocity_m_s,
      reynoldsNumber: results.reynoldsNumber,
      flowRegime: results.flowRegime,
      darcyFrictionFactor: results.darcyFrictionFactor,
      frictionalPressureLoss_kPa: results.frictionalPressureLoss_kPa,
      requiredPumpHead_m: results.requiredPumpHead_m,
      shaftPower_kW: results.shaftPower_kW,
    };
    setSavedScenarios((prev) => [...prev, newScenario]);
  };

  const handleRemoveScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearScenarios = () => {
    setSavedScenarios([buildInitialFluidScenario()]);
  };

  const handleDownloadCsv = () => {
    if (!results.isValid) return;
    downloadSimulationCsv('entrolume-fluid-mechanics-run', [
      {
        title: 'Entrolume — Fluid Flow & Pipe Hydraulics Operating Inputs (SI)',
        headers: ['Parameter', 'Symbol', 'Value', 'Unit'],
        rows: [
          ['Volumetric Flow Rate', 'Q', inputs.flowRate_L_s, 'L/s'],
          ['Volumetric Flow Rate (SI)', 'Q_SI', results.flowRate_m3_s.toFixed(6), 'm^3/s'],
          ['Pipe Internal Diameter', 'D', inputs.diameter_m, 'm'],
          ['Straight Pipe Length', 'L', inputs.length_m, 'm'],
          ['Fluid Density', 'rho', inputs.density_kg_m3, 'kg/m^3'],
          ['Dynamic Viscosity', 'mu', inputs.viscosity_Pa_s, 'Pa*s'],
          ['Absolute Roughness', 'epsilon', inputs.roughness_mm, 'mm'],
          ['Total Minor-Loss Coefficient', 'K', inputs.minorLossK, 'dimensionless'],
          ['Elevation Rise', 'Delta_z', inputs.elevationDiff_m, 'm'],
          ['Pump Efficiency', 'eta', inputs.pumpEfficiency_pct, '%'],
        ],
      },
      {
        title: 'Computed Hydraulic Results',
        headers: ['Quantity', 'Symbol', 'Value', 'Unit / Note'],
        rows: [
          ['Cross-Sectional Area', 'A', results.area_m2.toFixed(6), 'm^2'],
          ['Average Velocity', 'v', results.velocity_m_s.toFixed(4), 'm/s'],
          ['Reynolds Number', 'Re', results.reynoldsNumber.toFixed(1), 'dimensionless'],
          ['Flow Regime', 'Regime', results.flowRegime, results.frictionCorrelationUsed],
          ['Relative Roughness', 'epsilon/D', results.relativeRoughness.toExponential(4), 'dimensionless'],
          ['Darcy Friction Factor', 'f_D', results.darcyFrictionFactor.toFixed(6), 'dimensionless'],
          ['Fanning Friction Factor', 'f_F', results.fanningFrictionFactor.toFixed(6), 'f_D / 4'],
          ['Major Straight-Pipe Head Loss', 'hf', results.majorHeadLoss_m.toFixed(4), 'm'],
          ['Minor Fittings Head Loss', 'hm', results.minorHeadLoss_m.toFixed(4), 'm'],
          ['Total Frictional Head Loss', 'hf + hm', results.totalFrictionHeadLoss_m.toFixed(4), 'm'],
          ['Frictional Pressure Loss', 'DeltaP_friction', results.frictionalPressureLoss_kPa.toFixed(3), 'kPa'],
          ['Static Elevation Pressure Term', 'rho*g*Delta_z', results.elevationPressure_kPa.toFixed(3), 'kPa'],
          ['Total Required Pump Head', 'H', results.requiredPumpHead_m.toFixed(4), 'm'],
          ['Total Pump Pressure Rise', 'rho*g*H', results.totalPumpPressureRise_kPa.toFixed(3), 'kPa'],
          ['Hydraulic Power', 'Ph', results.hydraulicPower_kW.toFixed(4), 'kW'],
          ['Estimated Shaft Power', 'Ps', results.shaftPower_kW.toFixed(4), 'kW'],
        ],
      },
      {
        title: 'Saved Scenario Comparison Runs',
        headers: [
          'Label',
          'Q (L/s)',
          'D (m)',
          'L (m)',
          'eps (mm)',
          'K',
          'dz (m)',
          'Re',
          'Regime',
          'f_D',
          'DeltaP_friction (kPa)',
          'H (m)',
          'Ps (kW)',
        ],
        rows: savedScenarios.map((s) => [
          s.label,
          s.inputs.flowRate_L_s,
          s.inputs.diameter_m,
          s.inputs.length_m,
          s.inputs.roughness_mm,
          s.inputs.minorLossK,
          s.inputs.elevationDiff_m,
          Math.round(s.reynoldsNumber),
          s.flowRegime,
          s.darcyFrictionFactor.toFixed(5),
          s.frictionalPressureLoss_kPa.toFixed(2),
          s.requiredPumpHead_m.toFixed(2),
          s.shaftPower_kW.toFixed(3),
        ]),
      },
    ]);
  };

  const regimeColorClass =
    results.flowRegime === 'Turbulent'
      ? 'text-2xl text-teal-800'
      : results.flowRegime === 'Laminar'
      ? 'text-2xl text-sky-800'
      : results.flowRegime === 'Transitional'
      ? 'text-2xl text-amber-800'
      : 'text-2xl text-slate-600';

  const frictionSplitMajorPct =
    results.totalFrictionHeadLoss_m > 0
      ? (results.majorHeadLoss_m / results.totalFrictionHeadLoss_m) * 100
      : 0;

  return (
    <section
      aria-label="Fluid Mechanics Virtual Laboratory"
      className="max-w-[1360px] mx-auto px-4 sm:px-6 py-5 lg:py-6 space-y-5"
      data-testid="fluid-mechanics-lab-workspace"
    >
      {/* Shared Laboratory Workspace Header */}
      <LabWorkspaceHeader
        kickerItems={['Lab 02', 'Fluid Mechanics', 'SI Units']}
        title="Fluid Flow & Pipe Hydraulics Virtual Laboratory"
        description="Analyze incompressible pipe flow regimes, Darcy–Weisbach friction losses, and pumping head requirements."
        presets={FLUID_MECHANICS_PRESETS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onSaveScenario={() => handleSaveCurrentScenario()}
        savedCount={savedScenarios.length}
        canSave={results.isValid}
        onDownloadCsv={handleDownloadCsv}
        canDownload={results.isValid}
        onReset={handleReset}
        learningObjectives={FLUID_LEARNING_OBJECTIVES}
        workflowSteps={FLUID_WORKFLOW_STEPS}
      />

      {/* Shared Validation Error & Regime / Scope Advisory Banners */}
      <LabValidationAlerts
        issues={results.validationIssues}
        warningTitle="Hydraulic Regime & Model Scope Advisory"
      />

      {/* Main 2-Zone Sandbox Layout: Controls Deck (Left 4 cols) + Stage & Dashboard (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <LabParameterPanel<FluidMechanicsInputs>
          subtitle="Consistent SI & metric inputs (instant hydraulic solver)"
          groups={FLUID_CONTROL_GROUPS}
          controls={FLUID_PARAMETER_CONTROLS}
          values={inputs}
          onChange={handleInputChange}
          onReset={handleReset}
          footerContent={
            results.isValid ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg font-mono text-[11px] tabular-nums">
                <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-slate-900">
                  {results.flowRegime === 'Transitional' ? (
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  )}
                  Regime: {results.flowRegime}
                </span>
                <span>
                  {results.flowRegime === 'Zero Flow'
                    ? 'A = ' + (results.area_m2 * 1e4).toFixed(2) + ' cm²'
                    : `f_D = ${results.darcyFrictionFactor.toFixed(4)}`}
                </span>
              </div>
            ) : null
          }
        />

        {/* RIGHT COLUMN: Piping Schematic -> Primary 4 KPIs -> Additional Metrics -> Charts */}
        <div className="lg:col-span-8 min-w-0 space-y-5">
          {/* 1. Primary Piping Schematic */}
          <FluidMechanicsSchematic inputs={inputs} results={results} />

          {/* 2. Primary 4 KPI Summary */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
            data-testid="fluid-results-dashboard"
          >
            <LabMetricCard
              label="Reynolds Number ($\mathrm{Re}$)"
              value={
                results.isValid
                  ? Math.round(results.reynoldsNumber).toLocaleString()
                  : '—'
              }
              subtext={
                results.isValid
                  ? `${results.flowRegime} · $\\varepsilon/D$ = ${results.relativeRoughness.toExponential(2)}`
                  : '—'
              }
              testId="metric-reynolds"
            />
            <LabMetricCard
              label="Darcy Friction Factor ($f_D$)"
              value={
                results.isValid
                  ? results.flowRegime === 'Zero Flow'
                    ? '0.0000'
                    : results.darcyFrictionFactor.toFixed(4)
                  : '—'
              }
              subtext={
                results.isValid
                  ? `Fanning $f_F = f_D/4$ = ${results.fanningFrictionFactor.toFixed(4)}`
                  : '—'
              }
              testId="metric-friction-factor"
            />
            <LabMetricCard
              label="Frictional Pressure Loss ($\Delta P_{\mathrm{f}}$)"
              value={
                results.isValid
                  ? `${results.frictionalPressureLoss_kPa.toFixed(2)} kPa`
                  : '—'
              }
              subtext={
                results.isValid
                  ? `Static $\\Delta z$ term: ${results.elevationPressure_kPa.toFixed(2)} kPa`
                  : '—'
              }
              testId="metric-pressure-loss"
              valueClassName="text-xl sm:text-2xl text-rose-700"
            />
            <LabMetricCard
              label="Required Pump Head ($H$)"
              value={results.isValid ? `${results.requiredPumpHead_m.toFixed(2)} m` : '—'}
              subtext={
                results.isValid
                  ? `$H = \\Delta z$ (${inputs.elevationDiff_m.toFixed(1)}) + friction (${results.totalFrictionHeadLoss_m.toFixed(2)})`
                  : '—'
              }
              testId="metric-pump-head"
              valueClassName="text-xl sm:text-2xl text-teal-800"
            />
          </div>

          {/* 3. Secondary KPIs (Collapsible Additional Metrics) */}
          <LabAdditionalMetricsDisclosure
            count={5}
            summary="Flow Velocity ($v$), Flow Regime, Major/Minor Head Losses ($h_f, h_m$), and Shaft Power ($P_s$)"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pt-2">
              <LabMetricCard
                label="Flow Velocity ($v$)"
                value={results.isValid ? `${results.velocity_m_s.toFixed(2)} m/s` : '—'}
                subtext={
                  results.isValid
                    ? `$A$ = ${(results.area_m2 * 1e4).toFixed(2)} cm² · $v^2/(2g)$ = ${results.velocityHead_m.toFixed(2)} m`
                    : '—'
                }
                testId="metric-velocity"
              />
              <LabMetricCard
                label="Flow Regime"
                value={results.isValid ? results.flowRegime : '—'}
                subtext={
                  results.isValid
                    ? results.flowRegime === 'Laminar'
                      ? 'Exact Hagen–Poiseuille ($< 2,100$)'
                      : results.flowRegime === 'Transitional'
                      ? 'Uncertain band [$2,100\\text{–}4,000$]'
                      : results.flowRegime === 'Turbulent'
                      ? 'Colebrook–White ($> 4,000$)'
                      : 'Static fluid column'
                    : '—'
                }
                testId="metric-regime"
                valueClassName={regimeColorClass}
              />
              <LabMetricCard
                label="Major Head Loss ($h_f$)"
                value={results.isValid ? `${results.majorHeadLoss_m.toFixed(2)} m` : '—'}
                subtext={
                  results.isValid
                    ? `$L/D$ = ${(inputs.length_m / Math.max(inputs.diameter_m, 1e-6)).toFixed(0)} · straight pipe`
                    : '—'
                }
                testId="metric-major-loss"
              />
              <LabMetricCard
                label="Minor Head Loss ($h_m$)"
                value={results.isValid ? `${results.minorHeadLoss_m.toFixed(2)} m` : '—'}
                subtext={
                  results.isValid
                    ? `$\\sum K$ = ${inputs.minorLossK.toFixed(1)} · valves & fittings`
                    : '—'
                }
                testId="metric-minor-loss"
              />
              <LabMetricCard
                label="Estimated Shaft Power ($P_s$)"
                value={results.isValid ? `${results.shaftPower_kW.toFixed(2)} kW` : '—'}
                subtext={
                  results.isValid
                    ? `Hydraulic $P_h$ = ${results.hydraulicPower_kW.toFixed(2)} kW ($\\eta$=${inputs.pumpEfficiency_pct}%)`
                    : '—'
                }
                testId="metric-shaft-power"
              />
            </div>
          </LabAdditionalMetricsDisclosure>

          {/* 4. Secondary Hydraulic & Moody Charts */}
          <FluidMechanicsCharts
            inputs={inputs}
            results={results}
            savedScenarios={savedScenarios}
            onSaveCurrentScenario={handleSaveCurrentScenario}
            onRemoveScenario={handleRemoveScenario}
            onLoadScenario={handleApplyGuidedInputs}
            onClearScenarios={handleClearScenarios}
          />
        </div>
      </div>

      {/* Step 3 Physical Analysis & Documented Assumptions */}
      <div className="space-y-8" data-testid="fluid-learning-panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-medium text-teal-800 mb-1">
                Step 3 · Analyze — Live Hydraulic Interpretation
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Physical Analysis of Current Hydraulic State
              </h3>

              {results.isValid ? (
                results.flowRegime === 'Zero Flow' ? (
                  <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                    <p>
                      Volumetric flow rate is zero (<MathInline latex="Q = 0\text{ L/s}" />), so
                      fluid velocity and all viscous/turbulent friction losses vanish (
                      <MathInline latex="h_f = h_m = 0\text{ m}" />,{' '}
                      <MathInline latex="\Delta P_{\mathrm{f}} = 0.00\text{ kPa}" />).
                    </p>
                    <p>
                      To hold the static liquid column across{' '}
                      <span className="font-mono text-xs">
                        <MathInline latex="\Delta z" /> = {inputs.elevationDiff_m.toFixed(1)} m
                      </span>
                      , the required static head is{' '}
                      <strong className="font-mono text-slate-900">
                        <MathInline latex="H" /> = {results.requiredPumpHead_m.toFixed(2)} m
                      </strong>{' '}
                      (<span className="font-mono text-xs">{results.elevationPressure_kPa.toFixed(2)} kPa</span>),
                      with zero hydraulic or shaft power delivered to a flowing stream.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                    <p>
                      At{' '}
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        <MathInline latex="v" /> = {results.velocity_m_s.toFixed(2)} m/s
                      </span>{' '}
                      in a{' '}
                      <span className="font-mono text-xs">
                        <MathInline latex="D" /> = {inputs.diameter_m.toFixed(3)} m
                      </span>{' '}
                      pipe, the Reynolds number is{' '}
                      <strong className="font-mono text-slate-900">
                        <MathInline latex="\mathrm{Re}" /> ={' '}
                        {Math.round(results.reynoldsNumber).toLocaleString()}
                      </strong>{' '}
                      ({results.flowRegime} regime). Using{' '}
                      <span className="font-medium text-slate-900">
                        {results.frictionCorrelationUsed}
                      </span>
                      , Darcy friction factor is{' '}
                      <strong className="font-mono text-teal-800">
                        <MathInline latex="f_D" /> = {results.darcyFrictionFactor.toFixed(4)}
                      </strong>{' '}
                      (Fanning{' '}
                      <span className="font-mono text-xs">
                        <MathInline latex="f_F" /> = {results.fanningFrictionFactor.toFixed(4)}
                      </span>
                      ).
                    </p>
                    <p>
                      Total frictional head loss is{' '}
                      <strong className="font-mono text-slate-900">
                        {(results.majorHeadLoss_m + results.minorHeadLoss_m).toFixed(2)} m
                      </strong>{' '}
                      (yielding{' '}
                      <strong className="font-mono text-rose-700">
                        <MathInline latex="\Delta P_{\mathrm{f}}" /> ={' '}
                        {results.frictionalPressureLoss_kPa.toFixed(2)} kPa
                      </strong>
                      ), where major wall friction contributes{' '}
                      <span className="font-mono text-xs font-semibold">
                        {frictionSplitMajorPct.toFixed(1)}%
                      </span>{' '}
                      (<MathInline latex="h_f" /> = {results.majorHeadLoss_m.toFixed(2)} m) and
                      minor fitting losses contribute{' '}
                      <span className="font-mono text-xs font-semibold">
                        {(100 - frictionSplitMajorPct).toFixed(1)}%
                      </span>{' '}
                      (<MathInline latex="h_m" /> = {results.minorHeadLoss_m.toFixed(2)} m).
                    </p>
                    <p>
                      Including static elevation lift (
                      <span className="font-mono text-xs">
                        <MathInline latex="\Delta z" /> = {inputs.elevationDiff_m.toFixed(1)} m
                      </span>
                      ), the pump must supply{' '}
                      <strong className="font-mono text-teal-800">
                        <MathInline latex="H" /> = {results.requiredPumpHead_m.toFixed(2)} m
                      </strong>{' '}
                      and{' '}
                      <strong className="font-mono text-slate-900">
                        <MathInline latex="P_s" /> = {results.shaftPower_kW.toFixed(2)} kW
                      </strong>{' '}
                      of shaft power at <MathInline latex="\eta" /> = {inputs.pumpEfficiency_pct}%.
                    </p>
                  </div>
                )
              ) : (
                <p className="text-sm text-rose-800 font-medium">
                  Simulation paused: resolve the physical input validation errors above to compute
                  Reynolds numbers, friction factors, and pumping requirements.
                </p>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums">
              <span>
                <MathInline latex="f_D = 4 f_F" /> (Darcy–Weisbach vs. Fanning convention verified)
              </span>
              <span>
                SI Units Verified (<MathInline latex="\rho g Q H" />)
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <LabAssumptionsCard
              eyebrow="Model Scope & Limitations · Steady Pipe Hydraulics"
              title="Documented Engineering Assumptions"
              assumptions={FLUID_MODEL_ASSUMPTIONS}
            />
          </div>
        </div>

        {/* Conceptual Reference + Progressive Equation Disclosure */}
        <LabTheoryDisclosureCard
          eyebrow="Conceptual Reference · Core Variables & Physical Meaning"
          title="Understanding Darcy–Weisbach & Colebrook–White Hydraulics"
          subtitle="From pipe velocity and Reynolds number ($\mathrm{Re}$) to friction factor correlations, major/minor head losses, and mechanical energy balances."
          expandLabel="Expand Detailed Equations & Correlations"
          collapseLabel="Hide Detailed Equations & Correlations"
          concepts={[
            {
              title: 'Reynolds Number & Flow Regimes',
              body: (
                <>
                  <MathInline latex="\mathrm{Re} = \frac{\rho v D}{\mu}" /> compares inertial to
                  viscous forces. Flow is Laminar below <MathInline latex="2,100" />, Transitional
                  in <MathInline latex="2,100\text{–}4,000" />, and Turbulent above{' '}
                  <MathInline latex="4,000" />.
                </>
              ),
            },
            {
              title: 'Darcy vs. Fanning Friction Factor',
              body: (
                <>
                  This simulator uses the <strong className="text-slate-800">Darcy</strong> factor{' '}
                  <MathInline latex="f_D = \frac{64}{\mathrm{Re}}" /> (laminar), equal to{' '}
                  <MathInline latex="4 f_F" /> where Fanning{' '}
                  <MathInline latex="f_F = \frac{16}{\mathrm{Re}}" />.
                </>
              ),
            },
            {
              title: 'Major & Minor Head Losses',
              body: (
                <>
                  Straight-pipe friction <MathInline latex="h_f = f_D \frac{L}{D}\frac{v^2}{2g}" />{' '}
                  adds with valve/elbow losses <MathInline latex="h_m = \sum K \frac{v^2}{2g}" />{' '}
                  to produce frictional <MathInline latex="\Delta P_{\mathrm{f}}" />.
                </>
              ),
            },
            {
              title: 'Pump Head & Shaft Power',
              body: (
                <>
                  Required head <MathInline latex="H = \Delta z + h_f + h_m" /> separates static
                  lift from friction. Hydraulic power <MathInline latex="P_h = \rho g Q H" />{' '}
                  scales shaft power <MathInline latex="P_s = \frac{P_h}{\eta}" />.
                </>
              ),
            },
          ]}
          detailedBlocks={[
            {
              title: '01. Kinematics & Reynolds Classification',
              subtitle:
                'Convert $Q$ from $\\mathrm{L/s}$ to $\\mathrm{m^3/s}$ and $\\varepsilon$ from $\\mathrm{mm}$ to $\\mathrm{m}$ internally:',
              equations: [
                {
                  label: 'Pipe Cross-Sectional Area & Mean Velocity',
                  latex: 'A = \\frac{\\pi D^2}{4}, \\quad v = \\frac{Q}{A}',
                  equationNumber: '1',
                },
                {
                  label: 'Reynolds Number & Relative Roughness',
                  latex: '\\mathrm{Re} = \\frac{\\rho v D}{\\mu}, \\quad \\text{Rel. Roughness} = \\frac{\\varepsilon}{D}',
                  equationNumber: '2',
                  tone: 'teal',
                },
                {
                  label: 'Regime Thresholds (Laminar / Turbulent)',
                  latex: '\\mathrm{Re} < 2100 \\; (\\text{Lam.}), \\quad \\mathrm{Re} > 4000 \\; (\\text{Turb.})',
                  equationNumber: '3',
                },
              ],
              definitions: [
                {
                  symbolLatex: '\\rho',
                  description: 'Fluid mass density',
                  unitLatex: '\\mathrm{kg/m^3}',
                },
                {
                  symbolLatex: 'v',
                  description: 'Cross-sectional average fluid velocity',
                  unitLatex: '\\mathrm{m/s}',
                },
                {
                  symbolLatex: 'D',
                  description: 'Internal circular pipe diameter',
                  unitLatex: '\\mathrm{m}',
                },
                {
                  symbolLatex: '\\mu',
                  description: 'Dynamic viscosity',
                  unitLatex: '\\mathrm{Pa\\cdot s}',
                },
              ],
            },
            {
              title: '02. Friction Factor Correlations',
              subtitle: 'Hagen–Poiseuille exact laminar vs. implicit Colebrook–White turbulent:',
              equations: [
                {
                  label: 'Laminar Flow (Hagen–Poiseuille)',
                  latex: 'f_D = \\frac{64}{\\mathrm{Re}}, \\quad f_F = \\frac{f_D}{4} = \\frac{16}{\\mathrm{Re}}',
                  equationNumber: '4',
                },
                {
                  label: 'Turbulent Flow (Implicit Colebrook–White)',
                  latex: '\\frac{1}{\\sqrt{f_D}} = -2 \\log_{10}\\!\\left( \\frac{\\varepsilon / D}{3.7} + \\frac{2.51}{\\mathrm{Re}\\sqrt{f_D}} \\right)',
                  equationNumber: '5',
                  tone: 'teal',
                },
                {
                  label: 'Explicit Haaland Seed for Newton–Raphson',
                  latex: '\\frac{1}{\\sqrt{f_{D,0}}} = -1.8 \\log_{10}\\!\\left[ \\left(\\frac{\\varepsilon/D}{3.7}\\right)^{1.11} + \\frac{6.9}{\\mathrm{Re}} \\right]',
                  equationNumber: '6',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'f_D',
                  description: 'Darcy–Weisbach friction factor',
                  unit: '—',
                },
                {
                  symbolLatex: 'f_F',
                  description: 'Fanning friction factor ($f_D / 4$)',
                  unit: '—',
                },
                {
                  symbolLatex: '\\varepsilon / D',
                  description: 'Dimensionless relative wall roughness',
                  unit: '—',
                },
              ],
            },
            {
              title: '03. Head Losses & Mechanical Energy',
              subtitle: 'Steady mechanical energy balance with $P_1 = P_2$ (gauge):',
              equations: [
                {
                  label: 'Darcy–Weisbach Major & Minor Head Losses',
                  latex: 'h_f = f_D \\frac{L}{D} \\frac{v^2}{2g}, \\quad h_m = \\sum K \\frac{v^2}{2g}',
                  equationNumber: '7',
                },
                {
                  label: 'Frictional Pressure Loss & Required Pump Head',
                  latex: '\\Delta P_{\\mathrm{f}} = \\rho g (h_f + h_m), \\; H = \\Delta z + h_f + h_m',
                  equationNumber: '8',
                  tone: 'teal',
                },
                {
                  label: 'Hydraulic Power & Pump Shaft Power',
                  latex: 'P_h = \\rho g Q H, \\quad P_s = \\frac{P_h}{\\eta}',
                  equationNumber: '9',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'h_f, h_m',
                  description: 'Major pipe and minor fitting head losses',
                  unitLatex: '\\mathrm{m}',
                },
                {
                  symbolLatex: 'g',
                  description: 'Gravitational acceleration ($9.80665$)',
                  unitLatex: '\\mathrm{m/s^2}',
                },
                {
                  symbolLatex: 'H',
                  description: 'Total required pump head',
                  unitLatex: '\\mathrm{m}',
                },
                {
                  symbolLatex: 'P_h, P_s',
                  description: 'Hydraulic and shaft pumping power',
                  unitLatex: '\\mathrm{W}',
                },
              ],
            },
          ]}
        />

        {/* Step 4: Guided Engineering Inquiry (5 Questions) */}
        <LabGuidedInquiryCard<FluidMechanicsInputs>
          questions={FLUID_GUIDED_EXPLORATION_QUESTIONS}
          onApplyInputs={handleApplyGuidedInputs}
          derivationHeading="Hydraulic & Mechanical Energy Derivation"
        />
      </div>
    </section>
  );
}
