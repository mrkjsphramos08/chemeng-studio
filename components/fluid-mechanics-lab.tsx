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
  LabAssumptionsCard,
  LabControlGroup,
  LabGuidedInquiryCard,
  LabMetricCard,
  LabParameterPanel,
  LabSliderControlConfig,
  LabTheoryDisclosureCard,
  LabValidationAlerts,
  LabWorkspaceHeader,
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
    unit: 'L/s',
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
    unit: 'm',
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
    unit: 'm',
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
    unit: 'mm',
    min: 0,
    max: 2.0,
    step: 0.005,
    inputMin: 0,
    inputMax: 50,
    inputStep: 'any',
    group: 'pipe',
    helperText: 'Smooth tubing ≈ 0.0015 mm · Commercial steel ≈ 0.045 mm · Cast iron ≈ 0.26–0.8 mm',
  },
  {
    key: 'minorLossK',
    label: 'Total Minor-Loss Coeff.',
    symbol: 'ΣK',
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
    unit: 'kg/m³',
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
    unit: 'Pa·s',
    min: 0.0003,
    max: 0.1,
    step: 0.0005,
    inputMin: 0.00001,
    inputMax: 50,
    inputStep: 'any',
    group: 'fluid',
    helperText: 'Water (20 °C) ≈ 0.001002 Pa·s · Glycerin solution ≈ 0.050 Pa·s',
  },
  {
    key: 'elevationDiff_m',
    label: 'Elevation Rise',
    symbol: 'Δz',
    unit: 'm',
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
    detail: 'Classify Laminar (< 2,100), Transitional (2,100–4,000), and Turbulent (> 4,000) pipe flow.',
  },
  {
    title: '2. Friction & Moody Chart:',
    detail: 'Contrast roughness-independent 64/Re laminar flow against Colebrook–White turbulent drag.',
  },
  {
    title: '3. Major vs. Minor Losses:',
    detail: 'Evaluate D⁻⁵ diameter sensitivity and compare straight-pipe hf with fitting losses hm.',
  },
  {
    title: '4. Pump Head & Power:',
    detail: 'Distinguish frictional ΔP from static elevation lift Δz and size required shaft power Ps.',
  },
];

const FLUID_WORKFLOW_STEPS = [
  {
    title: 'Step 1 — Configure',
    detail: 'Select a hydraulic preset or tune flow rate Q, pipe diameter D, roughness ε, and fluid μ.',
  },
  {
    title: 'Step 2 — Simulate',
    detail: 'Inspect velocity, Reynolds number, Darcy/Fanning friction factors, head losses, and pump power.',
  },
  {
    title: 'Step 3 — Analyze',
    detail: 'Examine ΔP vs. Q, the log-log Moody diagram, pump head curves, and saved scenario rows.',
  },
  {
    title: 'Step 4 — Reflect',
    detail: 'Test the 5 guided fluid-mechanics hypotheses and verify your reasoning with self-checks.',
  },
];

const FLUID_MODEL_ASSUMPTIONS = [
  {
    label: '1. Steady incompressible flow',
    detail: '∂/∂t = 0; constant ρ and single-phase Newtonian fluid',
  },
  {
    label: '2. Isothermal properties',
    detail: 'Viscosity μ and density ρ remain uniform along the pipe',
  },
  {
    label: '3. Uniform circular pipe',
    detail: 'Constant internal diameter D and equivalent roughness ε',
  },
  {
    label: '4. Fully developed & lumped K',
    detail: 'Entrance effects and fitting interactions lumped into ΣK',
  },
  {
    label: '5. Equal terminal gauge P',
    detail: 'Introductory model assumes P₁ = P₂ (gauge) and Δz ≥ 0 m',
  },
  {
    label: '6. Transitional uncertainty',
    detail: 'Re ∈ [2,100, 4,000] flags Colebrook–White as reference only',
  },
  {
    label: '7. No H–Q curve / NPSH',
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
    downloadSimulationCsv('chemeng-fluid-mechanics-run', [
      {
        title: 'Fluid Flow & Pipe Hydraulics — Operating Inputs (SI)',
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
      className="max-w-[1360px] mx-auto px-6 py-8 space-y-6"
      data-testid="fluid-mechanics-lab-workspace"
    >
      {/* Shared Laboratory Workspace Header */}
      <LabWorkspaceHeader
        kickerItems={[
          'Unit Operations Laboratory 02',
          'Incompressible Pipe Flow & Pumping Hydraulics',
          'SI Units Standard',
        ]}
        title="Fluid Flow & Pipe Hydraulics Virtual Laboratory"
        description="Explore steady, incompressible internal pipe flow using Reynolds regime classification, the Colebrook–White friction equation, Darcy–Weisbach major and minor head losses, and mechanical energy balances."
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

        {/* RIGHT COLUMN: 9 KPI Cards + Piping Schematic + Charts */}
        <div className="lg:col-span-8 min-w-0 space-y-6">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            data-testid="fluid-results-dashboard"
          >
            <LabMetricCard
              label="Flow Velocity (v)"
              value={results.isValid ? `${results.velocity_m_s.toFixed(2)} m/s` : '—'}
              subtext={
                results.isValid
                  ? `A = ${(results.area_m2 * 1e4).toFixed(2)} cm² · v²/2g = ${results.velocityHead_m.toFixed(2)} m`
                  : '—'
              }
              testId="metric-velocity"
            />
            <LabMetricCard
              label="Reynolds Number (Re)"
              value={
                results.isValid
                  ? Math.round(results.reynoldsNumber).toLocaleString()
                  : '—'
              }
              subtext={
                results.isValid
                  ? `ε/D = ${results.relativeRoughness.toExponential(2)}`
                  : '—'
              }
              testId="metric-reynolds"
            />
            <LabMetricCard
              label="Flow Regime"
              value={results.isValid ? results.flowRegime : '—'}
              subtext={
                results.isValid
                  ? results.flowRegime === 'Laminar'
                    ? 'Exact Hagen–Poiseuille (< 2,100)'
                    : results.flowRegime === 'Transitional'
                    ? 'Uncertain band [2,100–4,000]'
                    : results.flowRegime === 'Turbulent'
                    ? 'Colebrook–White (> 4,000)'
                    : 'Static fluid column'
                  : '—'
              }
              testId="metric-regime"
              valueClassName={regimeColorClass}
            />
            <LabMetricCard
              label="Darcy Friction Factor (f_D)"
              value={
                results.isValid
                  ? results.flowRegime === 'Zero Flow'
                    ? '0.0000'
                    : results.darcyFrictionFactor.toFixed(4)
                  : '—'
              }
              subtext={
                results.isValid
                  ? `Fanning f_F = f_D/4 = ${results.fanningFrictionFactor.toFixed(4)}`
                  : '—'
              }
              testId="metric-friction-factor"
            />
            <LabMetricCard
              label="Major Head Loss (hf)"
              value={results.isValid ? `${results.majorHeadLoss_m.toFixed(2)} m` : '—'}
              subtext={
                results.isValid
                  ? `L/D = ${(inputs.length_m / Math.max(inputs.diameter_m, 1e-6)).toFixed(0)} · straight pipe`
                  : '—'
              }
              testId="metric-major-loss"
            />
            <LabMetricCard
              label="Minor Head Loss (hm)"
              value={results.isValid ? `${results.minorHeadLoss_m.toFixed(2)} m` : '—'}
              subtext={
                results.isValid
                  ? `ΣK = ${inputs.minorLossK.toFixed(1)} · valves & fittings`
                  : '—'
              }
              testId="metric-minor-loss"
            />
            <LabMetricCard
              label="Frictional Pressure Loss (ΔP)"
              value={
                results.isValid
                  ? `${results.frictionalPressureLoss_kPa.toFixed(2)} kPa`
                  : '—'
              }
              subtext={
                results.isValid
                  ? `Static Δz term: ${results.elevationPressure_kPa.toFixed(2)} kPa`
                  : '—'
              }
              testId="metric-pressure-loss"
              valueClassName="text-2xl text-rose-700"
            />
            <LabMetricCard
              label="Required Pump Head (H)"
              value={results.isValid ? `${results.requiredPumpHead_m.toFixed(2)} m` : '—'}
              subtext={
                results.isValid
                  ? `H = Δz (${inputs.elevationDiff_m.toFixed(1)}) + friction (${results.totalFrictionHeadLoss_m.toFixed(2)})`
                  : '—'
              }
              testId="metric-pump-head"
              valueClassName="text-2xl text-teal-800"
            />
            <LabMetricCard
              label="Estimated Shaft Power (Ps)"
              value={results.isValid ? `${results.shaftPower_kW.toFixed(2)} kW` : '—'}
              subtext={
                results.isValid
                  ? `Hydraulic Ph = ${results.hydraulicPower_kW.toFixed(2)} kW (η=${inputs.pumpEfficiency_pct}%)`
                  : '—'
              }
              testId="metric-shaft-power"
            />
          </div>

          <FluidMechanicsSchematic inputs={inputs} results={results} />

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
                      Volumetric flow rate is zero (<span className="font-mono text-xs">Q = 0 L/s</span>),
                      so fluid velocity and all viscous/turbulent friction losses vanish (
                      <span className="font-mono text-xs">hf = hm = 0 m</span>,{' '}
                      <span className="font-mono text-xs">ΔP_friction = 0.00 kPa</span>).
                    </p>
                    <p>
                      To hold the static liquid column across{' '}
                      <span className="font-mono text-xs">Δz = {inputs.elevationDiff_m.toFixed(1)} m</span>,
                      the required static head is{' '}
                      <strong className="font-mono text-slate-900">
                        H = {results.requiredPumpHead_m.toFixed(2)} m
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
                        v = {results.velocity_m_s.toFixed(2)} m/s
                      </span>{' '}
                      in a{' '}
                      <span className="font-mono text-xs">
                        D = {inputs.diameter_m.toFixed(3)} m
                      </span>{' '}
                      pipe, the Reynolds number is{' '}
                      <strong className="font-mono text-slate-900">
                        Re = {Math.round(results.reynoldsNumber).toLocaleString()}
                      </strong>{' '}
                      ({results.flowRegime} regime). Using{' '}
                      <span className="font-medium text-slate-900">
                        {results.frictionCorrelationUsed}
                      </span>
                      , Darcy friction factor is{' '}
                      <strong className="font-mono text-teal-800">
                        f_D = {results.darcyFrictionFactor.toFixed(4)}
                      </strong>{' '}
                      (Fanning{' '}
                      <span className="font-mono text-xs">
                        f_F = {results.fanningFrictionFactor.toFixed(4)}
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
                        ΔP_friction = {results.frictionalPressureLoss_kPa.toFixed(2)} kPa
                      </strong>
                      ), where major wall friction contributes{' '}
                      <span className="font-mono text-xs font-semibold">
                        {frictionSplitMajorPct.toFixed(1)}%
                      </span>{' '}
                      (hf = {results.majorHeadLoss_m.toFixed(2)} m) and minor fitting losses
                      contribute{' '}
                      <span className="font-mono text-xs font-semibold">
                        {(100 - frictionSplitMajorPct).toFixed(1)}%
                      </span>{' '}
                      (hm = {results.minorHeadLoss_m.toFixed(2)} m).
                    </p>
                    <p>
                      Including static elevation lift (
                      <span className="font-mono text-xs">
                        Δz = {inputs.elevationDiff_m.toFixed(1)} m
                      </span>
                      ), the pump must supply{' '}
                      <strong className="font-mono text-teal-800">
                        H = {results.requiredPumpHead_m.toFixed(2)} m
                      </strong>{' '}
                      and{' '}
                      <strong className="font-mono text-slate-900">
                        Ps = {results.shaftPower_kW.toFixed(2)} kW
                      </strong>{' '}
                      of shaft power at η = {inputs.pumpEfficiency_pct}%.
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
                f_D = 4 · f_F (Darcy–Weisbach vs. Fanning convention verified)
              </span>
              <span>SI Units Verified (ρ g Q H)</span>
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
          subtitle="From pipe velocity and Reynolds number to friction factor correlations, major/minor head losses, and mechanical energy balances."
          expandLabel="Expand Detailed Equations & Correlations"
          collapseLabel="Hide Detailed Equations & Correlations"
          concepts={[
            {
              title: 'Reynolds Number & Flow Regimes',
              body: (
                <>
                  <span className="font-mono text-slate-800">Re = ρvD / μ</span> compares inertial
                  to viscous forces. Flow is Laminar below 2,100, Transitional in 2,100–4,000, and
                  Turbulent above 4,000.
                </>
              ),
            },
            {
              title: 'Darcy vs. Fanning Friction Factor',
              body: (
                <>
                  This simulator uses the <strong className="text-slate-800">Darcy</strong> factor{' '}
                  <span className="font-mono">f_D = 64/Re</span> (laminar), equal to{' '}
                  <span className="font-mono">4 · f_F</span> where Fanning{' '}
                  <span className="font-mono">f_F = 16/Re</span>.
                </>
              ),
            },
            {
              title: 'Major & Minor Head Losses',
              body: (
                <>
                  Straight-pipe friction <span className="font-mono">hf = f_D(L/D)(v²/2g)</span>{' '}
                  adds with valve/elbow losses <span className="font-mono">hm = ΣK(v²/2g)</span> to
                  produce frictional ΔP.
                </>
              ),
            },
            {
              title: 'Pump Head & Shaft Power',
              body: (
                <>
                  Required head <span className="font-mono">H = Δz + hf + hm</span> separates
                  static lift from friction. Hydraulic power{' '}
                  <span className="font-mono">Ph = ρgQH</span> scales shaft power{' '}
                  <span className="font-mono">Ps = Ph / η</span>.
                </>
              ),
            },
          ]}
          detailedBlocks={[
            {
              title: '01. Kinematics & Reynolds Classification',
              subtitle: 'Convert Q from L/s to m³/s and ε from mm to m internally:',
              equations: [
                { text: 'A = π · D² / 4  [m²]' },
                { text: 'v = Q_SI / A  [m/s]' },
                { text: 'Re = (ρ · v · D) / μ' },
                { text: 'Laminar: Re < 2,100', tone: 'teal' },
                { text: 'Turbulent: Re > 4,000', tone: 'muted' },
              ],
            },
            {
              title: '02. Friction Factor Correlations',
              subtitle: 'Hagen–Poiseuille exact laminar vs. implicit Colebrook–White turbulent:',
              equations: [
                { text: 'Laminar: f_D = 64 / Re   (f_F = 16 / Re)' },
                {
                  text: 'Turbulent: 1/√f_D = −2·log10( (ε/D)/3.7 + 2.51/(Re·√f_D) )',
                  tone: 'teal',
                },
                { text: 'Solved via Haaland seed + Newton–Raphson', tone: 'muted' },
                { text: '2,100 ≤ Re ≤ 4,000 flagged as uncertain', tone: 'muted' },
              ],
            },
            {
              title: '03. Head Losses & Mechanical Energy',
              subtitle: 'Steady mechanical energy balance with P₁ = P₂ (gauge):',
              equations: [
                { text: 'hf = f_D · (L / D) · (v² / 2g)  [m]' },
                { text: 'hm = ΣK · (v² / 2g)  [m]' },
                { text: 'ΔP_friction = ρ · g · (hf + hm)  [Pa]' },
                { text: 'H = Δz + hf + hm  [m]', tone: 'teal' },
                { text: 'Ph = ρ · g · Q_SI · H  [W],  Ps = Ph / η' },
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
