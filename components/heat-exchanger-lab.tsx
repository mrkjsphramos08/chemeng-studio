'use client';

import React, { useState, useMemo } from 'react';
import {
  HeatExchangerInputs,
  DEFAULT_HEAT_EXCHANGER_INPUTS,
  OPERATING_PRESETS,
  calculateHeatExchanger,
} from '@/lib/heat-exchanger';
import { downloadSimulationCsv } from '@/lib/lab-download';
import {
  LabControlGroup,
  LabMetricCard,
  LabParameterPanel,
  LabSliderControlConfig,
  LabValidationAlerts,
  LabWorkspaceHeader,
} from '@/components/lab-shared';
import { HeatExchangerSchematic } from './heat-exchanger-schematic';
import { HeatExchangerCharts, SavedScenario } from './heat-exchanger-charts';
import { LearningPanel } from './learning-panel';
import { CheckCircle2 } from 'lucide-react';

const CONTROL_GROUPS: LabControlGroup[] = [
  { id: 'temperatures', title: 'Inlet Stream Temperatures' },
  { id: 'streams', title: 'Flow Rates & Heat Capacities' },
  { id: 'equipment', title: 'Exchanger Conductance & Geometry' },
];

const PARAMETER_CONTROLS: LabSliderControlConfig<
  Extract<keyof HeatExchangerInputs, string>
>[] = [
  {
    key: 'Th_in',
    label: 'Hot Inlet Temperature',
    symbol: 'Th,in',
    unit: '°C',
    min: 30,
    max: 220,
    step: 1,
    inputStep: 'any',
    group: 'temperatures',
  },
  {
    key: 'Tc_in',
    label: 'Cold Inlet Temperature',
    symbol: 'Tc,in',
    unit: '°C',
    min: 5,
    max: 120,
    step: 1,
    inputStep: 'any',
    group: 'temperatures',
  },
  {
    key: 'mh',
    label: 'Hot Stream Mass Flow Rate',
    symbol: 'mh',
    unit: 'kg/s',
    min: 0.2,
    max: 8.0,
    step: 0.1,
    inputStep: 'any',
    group: 'streams',
  },
  {
    key: 'mc',
    label: 'Cold Stream Mass Flow Rate',
    symbol: 'mc',
    unit: 'kg/s',
    min: 0.2,
    max: 8.0,
    step: 0.1,
    inputStep: 'any',
    group: 'streams',
  },
  {
    key: 'Cph_kJ',
    label: 'Hot Specific Heat Capacity',
    symbol: 'Cp,h',
    unit: 'kJ/(kg·K)',
    min: 1.0,
    max: 5.0,
    step: 0.02,
    inputStep: 'any',
    group: 'streams',
  },
  {
    key: 'Cpc_kJ',
    label: 'Cold Specific Heat Capacity',
    symbol: 'Cp,c',
    unit: 'kJ/(kg·K)',
    min: 1.0,
    max: 5.0,
    step: 0.02,
    inputStep: 'any',
    group: 'streams',
  },
  {
    key: 'U',
    label: 'Overall Heat Transfer Coeff.',
    symbol: 'U',
    unit: 'W/(m²·K)',
    min: 50,
    max: 2500,
    step: 10,
    inputStep: 'any',
    group: 'equipment',
  },
  {
    key: 'A',
    label: 'Heat Transfer Surface Area',
    symbol: 'A',
    unit: 'm²',
    min: 0.5,
    max: 50.0,
    step: 0.5,
    inputStep: 'any',
    group: 'equipment',
  },
];

const HEAT_LEARNING_OBJECTIVES = [
  {
    title: '1. Capacity Rates:',
    detail: 'Calculate Ch, Cc, Cmin, and capacity ratio Cr from mass flows and specific heats in SI units.',
  },
  {
    title: '2. NTU & Area Scaling:',
    detail: 'Explain why effectiveness ε approaches 100% asymptotically as surface area A grows.',
  },
  {
    title: '3. Temperature Cross:',
    detail: 'Observe when Tc,out exceeds Th,out without violating the Second Law of Thermodynamics.',
  },
  {
    title: '4. Model Scope:',
    detail: 'Verify First Law energy conservation and recognize constant-property, ideal-flow assumptions.',
  },
];

const HEAT_WORKFLOW_STEPS = [
  {
    title: 'Step 1 — Configure',
    detail: 'Select an operating preset or adjust inlet temperatures, flows, and area A.',
  },
  {
    title: 'Step 2 — Simulate',
    detail: 'Observe real-time updates to heat duty Q, effectiveness ε, NTU, and outlet temperatures.',
  },
  {
    title: 'Step 3 — Analyze',
    detail: 'Interpret the schematic, axial profile, energy balance, and saved scenario comparisons.',
  },
  {
    title: 'Step 4 — Reflect',
    detail: 'Complete the guided inquiry questions and check your conclusions in the Learning Panel.',
  },
];

function buildInitialScenario(): SavedScenario {
  const res = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  return {
    id: 'baseline-default',
    label: 'Baseline (A=12m²)',
    inputs: { ...DEFAULT_HEAT_EXCHANGER_INPUTS },
    Q_kW: res.Q_kW,
    effectiveness_pct: res.effectiveness_pct,
    NTU: res.NTU,
    Cr: res.Cr,
    Th_out: res.Th_out,
    Tc_out: res.Tc_out,
  };
}

export function HeatExchangerLab() {
  const [inputs, setInputs] = useState<HeatExchangerInputs>({
    ...DEFAULT_HEAT_EXCHANGER_INPUTS,
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('baseline-water');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => [
    buildInitialScenario(),
  ]);

  const results = useMemo(() => calculateHeatExchanger(inputs), [inputs]);

  const handleInputChange = (
    key: Extract<keyof HeatExchangerInputs, string>,
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
    setSelectedPresetId('baseline-water');
    setInputs({ ...DEFAULT_HEAT_EXCHANGER_INPUTS });
  };

  const handleSelectPreset = (presetId: string) => {
    const found = OPERATING_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedPresetId(found.id);
      setInputs({ ...found.inputs });
    }
  };

  const handleApplyGuidedInputs = (guidedInputs: HeatExchangerInputs) => {
    setSelectedPresetId('custom');
    setInputs({ ...guidedInputs });
  };

  const handleSaveCurrentScenario = (customLabel?: string) => {
    if (!results.isValid) return;
    const nextNumber = savedScenarios.length + 1;
    const trimmed = customLabel?.trim();
    const newScenario: SavedScenario = {
      id: `run-${Date.now()}`,
      label: trimmed ? trimmed : `Run #${nextNumber} (A=${inputs.A.toFixed(1)}m²)`,
      inputs: { ...inputs },
      Q_kW: results.Q_kW,
      effectiveness_pct: results.effectiveness_pct,
      NTU: results.NTU,
      Cr: results.Cr,
      Th_out: results.Th_out,
      Tc_out: results.Tc_out,
    };
    setSavedScenarios((prev) => [...prev, newScenario]);
  };

  const handleRemoveScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearScenarios = () => {
    setSavedScenarios([buildInitialScenario()]);
  };

  const handleDownloadCsv = () => {
    if (!results.isValid) return;
    downloadSimulationCsv('chemeng-heat-exchanger-run', [
      {
        title: 'Countercurrent Heat Exchanger — Operating Inputs (SI)',
        headers: ['Parameter', 'Symbol', 'Value', 'Unit'],
        rows: [
          ['Hot Inlet Temperature', 'Th,in', inputs.Th_in, 'degC'],
          ['Cold Inlet Temperature', 'Tc,in', inputs.Tc_in, 'degC'],
          ['Hot Mass Flow Rate', 'mh', inputs.mh, 'kg/s'],
          ['Cold Mass Flow Rate', 'mc', inputs.mc, 'kg/s'],
          ['Hot Specific Heat', 'Cp,h', inputs.Cph_kJ, 'kJ/(kg*K)'],
          ['Cold Specific Heat', 'Cp,c', inputs.Cpc_kJ, 'kJ/(kg*K)'],
          ['Overall Heat Transfer Coeff.', 'U', inputs.U, 'W/(m^2*K)'],
          ['Heat Transfer Area', 'A', inputs.A, 'm^2'],
        ],
      },
      {
        title: 'Computed ε–NTU Results',
        headers: ['Quantity', 'Symbol', 'Value', 'Unit'],
        rows: [
          ['Heat Transfer Rate', 'Q', results.Q_kW.toFixed(4), 'kW'],
          ['Maximum Possible Heat Duty', 'Qmax', results.Qmax_kW.toFixed(4), 'kW'],
          ['Hot Outlet Temperature', 'Th,out', results.Th_out.toFixed(4), 'degC'],
          ['Cold Outlet Temperature', 'Tc,out', results.Tc_out.toFixed(4), 'degC'],
          ['Effectiveness', 'epsilon', results.effectiveness_pct.toFixed(4), '%'],
          ['Number of Transfer Units', 'NTU', results.NTU.toFixed(4), 'dimensionless'],
          ['Capacity Rate Ratio', 'Cr', results.Cr.toFixed(4), 'dimensionless'],
          ['Hot Capacity Rate', 'Ch', results.Ch_kW_K.toFixed(4), 'kW/K'],
          ['Cold Capacity Rate', 'Cc', results.Cc_kW_K.toFixed(4), 'kW/K'],
          ['Log-Mean Temp Difference', 'LMTD', results.LMTD.toFixed(4), 'degC'],
          ['First Law Residual', '|Qh-Qc|', results.energyBalanceResidual_W.toExponential(3), 'W'],
        ],
      },
      {
        title: 'Saved Scenario Comparison Runs',
        headers: ['Label', 'A (m^2)', 'U (W/m^2K)', 'Q (kW)', 'eps (%)', 'NTU', 'Cr', 'Th,out (C)', 'Tc,out (C)'],
        rows: savedScenarios.map((s) => [
          s.label,
          s.inputs.A,
          s.inputs.U,
          s.Q_kW.toFixed(2),
          s.effectiveness_pct.toFixed(2),
          s.NTU.toFixed(3),
          s.Cr.toFixed(3),
          s.Th_out.toFixed(2),
          s.Tc_out.toFixed(2),
        ]),
      },
    ]);
  };

  return (
    <section
      aria-label="Heat Exchanger Virtual Laboratory"
      className="max-w-[1360px] mx-auto px-6 py-8 space-y-6"
      data-testid="heat-exchanger-lab-workspace"
    >
      {/* Top Laboratory Header, Learning Objectives & 4-Step Student Workflow */}
      <LabWorkspaceHeader
        kickerItems={[
          'Unit Operations Laboratory 01',
          'Ideal Countercurrent Heat Transfer',
          'SI Units Standard',
        ]}
        title="Countercurrent Heat Exchanger Virtual Laboratory"
        description="Investigate how stream heat capacity rates (Ch, Cc), overall conductance (UA), and Number of Transfer Units (NTU) govern thermal effectiveness (ε) and outlet temperatures using the steady-state, constant-property ε–NTU method."
        presets={OPERATING_PRESETS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onSaveScenario={() => handleSaveCurrentScenario()}
        savedCount={savedScenarios.length}
        canSave={results.isValid}
        onDownloadCsv={handleDownloadCsv}
        canDownload={results.isValid}
        onReset={handleReset}
        learningObjectives={HEAT_LEARNING_OBJECTIVES}
        workflowSteps={HEAT_WORKFLOW_STEPS}
      />

      {/* Validation Error & Scientific Advisory Banners */}
      <LabValidationAlerts
        issues={results.validationIssues}
        warningTitle="Educational Model Advisory (Simplified Constant-Property Calculation)"
      />

      {/* Main 2-Zone Sandbox Layout: Controls Deck (Left 4 cols) + Stage & Dashboard (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <LabParameterPanel<HeatExchangerInputs>
          subtitle="Consistent SI inputs (instant ε–NTU update)"
          groups={CONTROL_GROUPS}
          controls={PARAMETER_CONTROLS}
          values={inputs}
          onChange={handleInputChange}
          onReset={handleReset}
          footerContent={
            results.isValid ? (
              <div className="flex items-center justify-between text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg font-mono text-[11px] tabular-nums">
                <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  First Law Verified
                </span>
                <span>|Qh − Qc| = {results.energyBalanceResidual_W.toExponential(1)} W</span>
              </div>
            ) : null
          }
        />

        {/* RIGHT COLUMN: Results Dashboard + Schematic + Interactive Charts */}
        <div className="lg:col-span-8 min-w-0 space-y-6">
          {/* D. Results Dashboard — 6 KPI Cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            data-testid="results-dashboard"
          >
            <LabMetricCard
              label="Heat Transfer Rate (Q)"
              value={results.isValid ? `${results.Q_kW.toFixed(2)} kW` : '—'}
              subtext={`Qmax = ${results.isValid ? `${results.Qmax_kW.toFixed(1)} kW` : '—'} · UA = ${results.isValid ? `${(results.UA_W_K / 1000).toFixed(2)} kW/K` : '—'}`}
              testId="metric-heat-duty"
            />
            <LabMetricCard
              label="Hot Outlet Temperature (Th,out)"
              value={results.isValid ? `${results.Th_out.toFixed(2)} °C` : '—'}
              subtext={`Inlet: ${inputs.Th_in.toFixed(1)} °C · ΔTh = −${results.isValid ? results.deltaTh.toFixed(2) : '0.00'} °C`}
              testId="metric-hot-outlet"
              valueClassName="text-2xl text-rose-700"
            />
            <LabMetricCard
              label="Cold Outlet Temperature (Tc,out)"
              value={results.isValid ? `${results.Tc_out.toFixed(2)} °C` : '—'}
              subtext={`Inlet: ${inputs.Tc_in.toFixed(1)} °C · ΔTc = +${results.isValid ? results.deltaTc.toFixed(2) : '0.00'} °C`}
              testId="metric-cold-outlet"
              valueClassName="text-2xl text-sky-800"
            />
            <LabMetricCard
              label="Exchanger Effectiveness (ε)"
              value={results.isValid ? `${results.effectiveness_pct.toFixed(2)}%` : '—'}
              subtext={`ε = Q / Qmax = ${results.isValid ? results.effectiveness.toFixed(4) : '—'}`}
              testId="metric-effectiveness"
              valueClassName="text-2xl text-teal-800"
            />
            <LabMetricCard
              label="Number of Transfer Units (NTU)"
              value={results.isValid ? results.NTU.toFixed(3) : '—'}
              subtext={`Capacity Ratio Cr = ${results.isValid ? results.Cr.toFixed(3) : '—'}`}
              testId="metric-ntu"
            />
            <LabMetricCard
              label="Heat Capacity Rates (Ch / Cc)"
              value={
                results.isValid
                  ? `${results.Ch_kW_K.toFixed(2)} / ${results.Cc_kW_K.toFixed(2)} kW/K`
                  : '—'
              }
              subtext={`Cmin = ${results.isValid ? `${results.Cmin_kW_K.toFixed(2)} kW/K` : '—'} (${results.limitingStream})`}
              testId="metric-capacity-rates"
              valueClassName="text-lg text-slate-900"
            />
          </div>

          {/* B. Interactive Process Schematic */}
          <HeatExchangerSchematic inputs={inputs} results={results} />

          {/* E. Interactive Visualizations */}
          <HeatExchangerCharts
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

      {/* F. Educational Learning Panel & Guided Exploration */}
      <LearningPanel
        inputs={inputs}
        results={results}
        onApplyInputs={handleApplyGuidedInputs}
      />
    </section>
  );
}
