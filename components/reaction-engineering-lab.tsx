'use client';

import React, { useMemo, useState } from 'react';
import {
  DEFAULT_REACTION_ENGINEERING_INPUTS,
  REACTION_ENGINEERING_PRESETS,
  ReactionEngineeringInputs,
  ReactorType,
  calculateReactionEngineering,
} from '@/lib/reaction-engineering';
import { REACTION_GUIDED_EXPLORATION_QUESTIONS } from '@/lib/labs-data';
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
import { ReactionEngineeringSchematic } from './reaction-engineering-schematic';
import {
  ReactionEngineeringCharts,
  SavedReactionScenario,
} from './reaction-engineering-charts';
import { CheckCircle2, Info } from 'lucide-react';

const REACTION_CONTROL_GROUPS: LabControlGroup[] = [
  { id: 'kinetics', title: 'Reaction Kinetics (A → B, First-Order)' },
  { id: 'batch-op', title: 'Batch Vessel & Reaction Time' },
  { id: 'continuous-op', title: 'Continuous Reactor Sizing & Flow' },
  { id: 'design-target', title: 'Target Conversion Design Goal' },
];

type ReactionNumericField = Exclude<
  Extract<keyof ReactionEngineeringInputs, string>,
  'reactorType'
>;

const ALL_REACTION_CONTROLS: LabSliderControlConfig<
  Extract<keyof ReactionEngineeringInputs, string>
>[] = [
  {
    key: 'initialConcentration_mol_m3',
    label: 'Initial Concentration',
    symbol: 'CA0',
    unit: 'mol/m³',
    min: 100,
    max: 3000,
    step: 50,
    inputMin: 1,
    inputMax: 20000,
    inputStep: 'any',
    group: 'kinetics',
  },
  {
    key: 'rateConstant_per_s',
    label: 'Rate Constant',
    symbol: 'k',
    unit: 's⁻¹',
    min: 0,
    max: 0.2,
    step: 0.002,
    inputMin: 0,
    inputMax: 10,
    inputStep: 'any',
    group: 'kinetics',
    helperText: 'Irreversible first-order kinetics: −rA = k · CA (isothermal)',
  },
  {
    key: 'batchTime_s',
    label: 'Batch Reaction Time',
    symbol: 't',
    unit: 's',
    min: 0,
    max: 300,
    step: 5,
    inputMin: 0,
    inputMax: 10000,
    inputStep: 'any',
    group: 'batch-op',
    helperText: 'Active reaction time only (excludes filling, emptying & cleaning)',
  },
  {
    key: 'reactorVolume_m3',
    label: 'Reactor Volume',
    symbol: 'V',
    unit: 'm³',
    min: 0,
    max: 10,
    step: 0.1,
    inputMin: 0,
    inputMax: 500,
    inputStep: 'any',
    group: 'continuous-op',
  },
  {
    key: 'volumetricFlowRate_m3_s',
    label: 'Volumetric Flow Rate',
    symbol: 'q',
    unit: 'm³/s',
    min: 0.002,
    max: 0.1,
    step: 0.002,
    inputMin: 0.0001,
    inputMax: 50,
    inputStep: 'any',
    group: 'continuous-op',
  },
  {
    key: 'targetConversion_pct',
    label: 'Target Conversion',
    symbol: 'X_target',
    unit: '%',
    min: 5,
    max: 100,
    step: 1,
    inputMin: 0,
    inputMax: 100,
    inputStep: 'any',
    group: 'design-target',
    helperText: '100% conversion is an asymptotic limit requiring infinite t or V',
  },
];

const REACTION_LEARNING_OBJECTIVES = [
  {
    title: '1. Kinetics & Material Balances:',
    detail: 'Connect −rA = k·CA to Batch, CSTR, and PFR design equations in consistent SI units.',
  },
  {
    title: '2. Reactor Efficiency (PFR vs. CSTR):',
    detail: 'See why PFR outperforms CSTR at equal V/q for positive-order reactions.',
  },
  {
    title: '3. Target Conversion Sizing:',
    detail: 'Quantify how required CSTR volume explodes relative to PFR as X_target approaches 100%.',
  },
  {
    title: '4. Reaction vs. Residence Time:',
    detail: 'Distinguish batch reaction time t (excluding turnaround) from continuous space time τ = V/q.',
  },
];

const REACTION_WORKFLOW_STEPS = [
  {
    title: 'Step 1 — Configure',
    detail: 'Choose Batch, Ideal CSTR, or Ideal PFR and adjust kinetics, reactor size/flow, and target X.',
  },
  {
    title: 'Step 2 — Simulate',
    detail: 'Inspect CA, conversion X, rate −rA, characteristic time (t or τ), and target sizing V_req or t_req.',
  },
  {
    title: 'Step 3 — Analyze',
    detail: 'Explore conversion vs. τ, PFR CA(V) or Batch CA(t), CSTR/PFR volume sizing, and saved runs.',
  },
  {
    title: 'Step 4 — Reflect',
    detail: 'Answer the 6 guided reaction-engineering hypotheses and verify your derivations.',
  },
];

const REACTION_MODEL_ASSUMPTIONS = [
  {
    label: '1. Single irreversible reaction',
    detail: 'A → B only; no reverse equilibrium or side reactions',
  },
  {
    label: '2. First-order kinetics',
    detail: 'Rate law −rA = k · CA with constant k at fixed T',
  },
  {
    label: '3. Isothermal & constant density',
    detail: 'No energy balance, ΔT, or volumetric expansion (ε_A = 0)',
  },
  {
    label: '4. Single liquid phase',
    detail: 'Constant-density homogeneous reaction mixture',
  },
  {
    label: '5. Ideal reactor hydrodynamics',
    detail: 'Complete CSTR backmixing; zero axial dispersion in PFR',
  },
  {
    label: '6. Batch cycle scope',
    detail: 'Batch time t excludes filling, emptying & turnaround',
  },
  {
    label: '7. Asymptotic 100% limit',
    detail: 'Exact X = 100% is unreachable in finite time or volume',
  },
];

const REACTOR_OPTIONS: { id: ReactorType; label: string; shortDesc: string }[] = [
  { id: 'batch', label: 'Batch Reactor', shortDesc: 'Closed · t' },
  { id: 'cstr', label: 'Ideal CSTR', shortDesc: 'Mixed · τ=V/q' },
  { id: 'pfr', label: 'Ideal PFR', shortDesc: 'Plug · τ=V/q' },
];

function buildInitialReactionScenario(): SavedReactionScenario {
  const res = calculateReactionEngineering(DEFAULT_REACTION_ENGINEERING_INPUTS);
  return {
    id: 'reaction-baseline-default',
    label: 'Baseline (PFR, Da=1.5)',
    inputs: { ...DEFAULT_REACTION_ENGINEERING_INPUTS },
    reactorType: DEFAULT_REACTION_ENGINEERING_INPUTS.reactorType,
    characteristicTime_s: res.activeReactor.characteristicTime_s,
    conversion_pct: res.activeReactor.conversion_pct,
    outletConcentration_mol_m3: res.activeReactor.outletConcentration_mol_m3,
    reactionRate_mol_m3_s: res.activeReactor.reactionRate_mol_m3_s,
    requiredVolumeCSTR_m3: res.targetDesign.requiredVolumeCSTR_m3,
    requiredVolumePFR_m3: res.targetDesign.requiredVolumePFR_m3,
  };
}

export function ReactionEngineeringLab() {
  const [inputs, setInputs] = useState<ReactionEngineeringInputs>({
    ...DEFAULT_REACTION_ENGINEERING_INPUTS,
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('baseline-pfr');
  const [savedScenarios, setSavedScenarios] = useState<SavedReactionScenario[]>(() => [
    buildInitialReactionScenario(),
  ]);

  const results = useMemo(() => calculateReactionEngineering(inputs), [inputs]);

  // Filter controls and groups dynamically to display ONLY parameters relevant to the selected reactor
  const { visibleGroups, visibleControls } = useMemo(() => {
    const isBatch = inputs.reactorType === 'batch';
    const filteredControls = ALL_REACTION_CONTROLS.filter((ctrl) => {
      if (isBatch) {
        // Hide continuous volumetric flow rate q when Batch is active
        return ctrl.key !== 'volumetricFlowRate_m3_s';
      }
      // Hide batch reaction time t when CSTR or PFR is active
      return ctrl.key !== 'batchTime_s';
    }).map((ctrl) => {
      // Place reactorVolume_m3 cleanly inside batch-op when Batch is active
      if (ctrl.key === 'reactorVolume_m3' && isBatch) {
        return { ...ctrl, group: 'batch-op' };
      }
      return ctrl;
    });

    const activeGroupIds = new Set(filteredControls.map((c) => c.group));
    const filteredGroups = REACTION_CONTROL_GROUPS.filter((g) => activeGroupIds.has(g.id));
    return { visibleGroups: filteredGroups, visibleControls: filteredControls };
  }, [inputs.reactorType]);

  const handleReactorTypeChange = (reactorType: ReactorType) => {
    setSelectedPresetId('custom');
    setInputs((prev) => ({
      ...prev,
      reactorType,
    }));
  };

  const handleNumericInputChange = (
    key: Extract<keyof ReactionEngineeringInputs, string>,
    rawValue: string
  ) => {
    if (key === 'reactorType') return;
    const numericKey = key as ReactionNumericField;
    const parsed = parseFloat(rawValue);
    setSelectedPresetId('custom');
    setInputs((prev) => ({
      ...prev,
      [numericKey]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleReset = () => {
    setSelectedPresetId('baseline-pfr');
    setInputs({ ...DEFAULT_REACTION_ENGINEERING_INPUTS });
  };

  const handleSelectPreset = (presetId: string) => {
    const found = REACTION_ENGINEERING_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedPresetId(found.id);
      setInputs({ ...found.inputs });
    }
  };

  const handleApplyGuidedInputs = (guidedInputs: ReactionEngineeringInputs) => {
    setSelectedPresetId('custom');
    setInputs({ ...guidedInputs });
  };

  const handleSaveCurrentScenario = (customLabel?: string) => {
    if (!results.isValid) return;
    const nextNumber = savedScenarios.length + 1;
    const trimmed = customLabel?.trim();
    const newScenario: SavedReactionScenario = {
      id: `reaction-run-${Date.now()}`,
      label: trimmed
        ? trimmed
        : `Run #${nextNumber} (${inputs.reactorType.toUpperCase()}, X=${results.activeReactor.conversion_pct.toFixed(1)}%)`,
      inputs: { ...inputs },
      reactorType: inputs.reactorType,
      characteristicTime_s: results.activeReactor.characteristicTime_s,
      conversion_pct: results.activeReactor.conversion_pct,
      outletConcentration_mol_m3: results.activeReactor.outletConcentration_mol_m3,
      reactionRate_mol_m3_s: results.activeReactor.reactionRate_mol_m3_s,
      requiredVolumeCSTR_m3: results.targetDesign.requiredVolumeCSTR_m3,
      requiredVolumePFR_m3: results.targetDesign.requiredVolumePFR_m3,
    };
    setSavedScenarios((prev) => [...prev, newScenario]);
  };

  const handleRemoveScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearScenarios = () => {
    setSavedScenarios([buildInitialReactionScenario()]);
  };

  const handleDownloadCsv = () => {
    if (!results.isValid) return;
    const active = results.activeReactor;
    downloadSimulationCsv('chemeng-reaction-engineering-run', [
      {
        title: 'Chemical Reaction Engineering — Operating Inputs (SI)',
        headers: ['Parameter', 'Symbol', 'Value', 'Unit'],
        rows: [
          ['Selected Reactor Type', 'Reactor', inputs.reactorType.toUpperCase(), 'ideal'],
          ['Initial Reactant Concentration', 'CA0', inputs.initialConcentration_mol_m3, 'mol/m^3'],
          ['First-Order Rate Constant', 'k', inputs.rateConstant_per_s, 's^-1'],
          ['Reactor Volume', 'V', inputs.reactorVolume_m3, 'm^3'],
          [
            inputs.reactorType === 'batch' ? 'Batch Reaction Time' : 'Volumetric Flow Rate',
            inputs.reactorType === 'batch' ? 't' : 'q',
            inputs.reactorType === 'batch' ? inputs.batchTime_s : inputs.volumetricFlowRate_m3_s,
            inputs.reactorType === 'batch' ? 's (reaction only)' : 'm^3/s',
          ],
          ['Target Conversion Goal', 'X_target', inputs.targetConversion_pct, '%'],
        ],
      },
      {
        title: 'Computed Reactor Performance Results',
        headers: ['Quantity', 'Symbol', 'Value', 'Unit / Note'],
        rows: [
          [
            inputs.reactorType === 'batch' ? 'Reaction Time' : 'Residence Time (V/q)',
            active.timeSymbol,
            active.characteristicTime_s.toFixed(4),
            's',
          ],
          ['Damkohler Number', 'Da', active.damkohlerNumber.toFixed(4), 'dimensionless'],
          ['Outlet / Final Concentration', 'CA', active.outletConcentration_mol_m3.toFixed(4), 'mol/m^3'],
          ['Fractional Conversion', 'X', active.conversion_pct.toFixed(4), '%'],
          ['Reaction Rate', '-rA', active.reactionRate_mol_m3_s.toFixed(5), 'mol/(m^3*s)'],
          [
            'Required Batch Time (Target X)',
            't_req',
            results.targetDesign.requiredBatchTime_s !== null
              ? results.targetDesign.requiredBatchTime_s.toFixed(4)
              : 'Unbounded / Unachievable',
            's',
          ],
          [
            'Required Ideal PFR Volume (Target X)',
            'V_req,PFR',
            results.targetDesign.requiredVolumePFR_m3 !== null
              ? results.targetDesign.requiredVolumePFR_m3.toFixed(4)
              : 'Unbounded / Unachievable',
            'm^3',
          ],
          [
            'Required Ideal CSTR Volume (Target X)',
            'V_req,CSTR',
            results.targetDesign.requiredVolumeCSTR_m3 !== null
              ? results.targetDesign.requiredVolumeCSTR_m3.toFixed(4)
              : 'Unbounded / Unachievable',
            'm^3',
          ],
        ],
      },
      {
        title: 'Saved Scenario Comparison Runs',
        headers: [
          'Label',
          'Reactor',
          'CA0 (mol/m^3)',
          'k (s^-1)',
          't or tau (s)',
          'X (%)',
          'CA (mol/m^3)',
          'V_req,CSTR (m^3)',
          'V_req,PFR (m^3)',
        ],
        rows: savedScenarios.map((s) => [
          s.label,
          s.reactorType.toUpperCase(),
          s.inputs.initialConcentration_mol_m3,
          s.inputs.rateConstant_per_s,
          s.characteristicTime_s.toFixed(2),
          s.conversion_pct.toFixed(2),
          s.outletConcentration_mol_m3.toFixed(2),
          s.requiredVolumeCSTR_m3 !== null ? s.requiredVolumeCSTR_m3.toFixed(3) : 'Unbounded',
          s.requiredVolumePFR_m3 !== null ? s.requiredVolumePFR_m3.toFixed(3) : 'Unbounded',
        ]),
      },
    ]);
  };

  const active = results.activeReactor;
  const targetDesign = results.targetDesign;

  return (
    <section
      aria-label="Chemical Reaction Engineering Virtual Laboratory"
      className="max-w-[1360px] mx-auto px-6 py-8 space-y-6"
      data-testid="reaction-engineering-lab-workspace"
    >
      {/* Shared Laboratory Workspace Header */}
      <LabWorkspaceHeader
        kickerItems={[
          'Unit Operations Laboratory 03',
          'Ideal Reactor Design & First-Order Kinetics',
          'SI Units Standard',
        ]}
        title="Chemical Reaction Engineering Virtual Laboratory"
        description="Investigate isothermal, constant-density, first-order reaction kinetics (A → B) across Batch, Ideal CSTR, and Ideal PFR systems. Compare conversion, residence time, spatial concentration, and target reactor sizing."
        presets={REACTION_ENGINEERING_PRESETS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onSaveScenario={() => handleSaveCurrentScenario()}
        savedCount={savedScenarios.length}
        canSave={results.isValid}
        onDownloadCsv={handleDownloadCsv}
        canDownload={results.isValid}
        onReset={handleReset}
        learningObjectives={REACTION_LEARNING_OBJECTIVES}
        workflowSteps={REACTION_WORKFLOW_STEPS}
      />

      {/* Shared Validation Error & Kinetic Scope Advisory Banners */}
      <LabValidationAlerts
        issues={results.validationIssues}
        warningTitle="Kinetic & Reactor Design Scope Advisory"
      />

      {/* Main 2-Zone Sandbox Layout: Controls Deck (Left 4 cols) + Stage & Dashboard (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 min-w-0 space-y-4">
          {/* Reactor Type Selector Card */}
          <div
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5"
            data-testid="reactor-type-selector"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-900">
                Select Ideal Reactor Configuration
              </h2>
              <span className="text-[11px] font-mono text-teal-800 font-semibold uppercase">
                {inputs.reactorType}
              </span>
            </div>
            <div
              className="grid grid-cols-3 gap-1.5"
              role="group"
              aria-label="Ideal Reactor Type"
            >
              {REACTOR_OPTIONS.map((opt) => {
                const isActive = inputs.reactorType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleReactorTypeChange(opt.id)}
                    aria-pressed={isActive}
                    data-testid={`select-reactor-${opt.id}`}
                    className={`px-2.5 py-2 rounded-lg border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                      isActive
                        ? 'bg-[#0F172A] border-[#0F172A] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold leading-tight">{opt.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 font-mono ${
                        isActive ? 'text-teal-300' : 'text-slate-600'
                      }`}
                    >
                      {opt.shortDesc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared Parameter Panel (filtered dynamically to selected reactor) */}
          <LabParameterPanel<ReactionEngineeringInputs>
            subtitle="Active reactor SI inputs (auto-filtered)"
            groups={visibleGroups}
            controls={visibleControls}
            values={inputs}
            onChange={handleNumericInputChange}
            onReset={handleReset}
            footerContent={
              results.isValid ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg font-mono text-[11px] tabular-nums">
                  <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-slate-900">
                    {inputs.rateConstant_per_s === 0 ? (
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    {active.label}
                  </span>
                  <span>Da = {active.damkohlerNumber.toFixed(2)}</span>
                </div>
              ) : null
            }
          />
        </div>

        {/* RIGHT COLUMN: 6 KPI Cards + Reactor Schematic + Charts */}
        <div className="lg:col-span-8 min-w-0 space-y-6">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            data-testid="reaction-results-dashboard"
          >
            <LabMetricCard
              label="Outlet / Final Concentration (CA)"
              value={
                results.isValid
                  ? `${active.outletConcentration_mol_m3.toFixed(2)} mol/m³`
                  : '—'
              }
              subtext={
                results.isValid
                  ? `Feed CA0 = ${inputs.initialConcentration_mol_m3.toFixed(1)} mol/m³`
                  : '—'
              }
              testId="metric-concentration"
            />
            <LabMetricCard
              label="Fractional Conversion (X)"
              value={results.isValid ? `${active.conversion_pct.toFixed(2)}%` : '—'}
              subtext={
                results.isValid
                  ? `CSTR(eq): ${results.cstrAtBatchTime.conversion_pct.toFixed(1)}% · PFR(eq): ${results.pfrAtBatchTime.conversion_pct.toFixed(1)}%`
                  : '—'
              }
              testId="metric-conversion"
              valueClassName="text-2xl text-teal-800"
            />
            <LabMetricCard
              label="Reaction Rate (−rA)"
              value={
                results.isValid
                  ? `${active.reactionRate_mol_m3_s.toFixed(3)} mol/(m³·s)`
                  : '—'
              }
              subtext={
                results.isValid
                  ? `−rA = k·CA (initial −rA0 = ${(inputs.rateConstant_per_s * inputs.initialConcentration_mol_m3).toFixed(2)})`
                  : '—'
              }
              testId="metric-reaction-rate"
            />
            <LabMetricCard
              label={
                inputs.reactorType === 'batch'
                  ? 'Batch Reaction Time (t)'
                  : 'Continuous Residence Time (τ)'
              }
              value={
                results.isValid
                  ? `${active.characteristicTime_s.toFixed(2)} s`
                  : '—'
              }
              subtext={
                inputs.reactorType === 'batch'
                  ? 'Reaction hold only (excludes turnaround)'
                  : `τ = V / q · Damköhler Da = ${active.damkohlerNumber.toFixed(2)}`
              }
              testId="metric-characteristic-time"
            />
            <LabMetricCard
              label="Active Reactor Volume (V)"
              value={
                results.isValid ? `${inputs.reactorVolume_m3.toFixed(2)} m³` : '—'
              }
              subtext={
                results.isValid
                  ? inputs.reactorType === 'batch' && active.molesConverted_mol !== null
                    ? `Converted batch moles: ${active.molesConverted_mol.toFixed(1)} mol`
                    : active.molarFlowConverted_mol_s !== null
                    ? `Molar conversion: ${active.molarFlowConverted_mol_s.toFixed(2)} mol/s`
                    : '—'
                  : '—'
              }
              testId="metric-reactor-volume"
            />
            <LabMetricCard
              label={`Target Sizing (${inputs.targetConversion_pct}% Goal)`}
              value={
                !results.isValid
                  ? '—'
                  : !targetDesign.isTargetAchievable
                  ? 'Unbounded'
                  : inputs.reactorType === 'batch'
                  ? `${(targetDesign.requiredBatchTime_s ?? 0).toFixed(1)} s`
                  : inputs.reactorType === 'cstr'
                  ? `${(targetDesign.requiredVolumeCSTR_m3 ?? 0).toFixed(2)} m³`
                  : `${(targetDesign.requiredVolumePFR_m3 ?? 0).toFixed(2)} m³`
              }
              subtext={
                !results.isValid
                  ? '—'
                  : !targetDesign.isTargetAchievable
                  ? inputs.targetConversion_pct === 100
                    ? 'X = 100% requires infinite t or V'
                    : 'k = 0 s⁻¹ gives zero conversion'
                  : targetDesign.requiredVolumeCSTR_m3 !== null &&
                    targetDesign.requiredVolumePFR_m3 !== null
                  ? `V_CSTR: ${targetDesign.requiredVolumeCSTR_m3.toFixed(2)} m³ vs V_PFR: ${targetDesign.requiredVolumePFR_m3.toFixed(2)} m³ (${(targetDesign.cstrToPfrVolumeRatio ?? 1).toFixed(2)}×)`
                  : `Required batch t_req = ${(targetDesign.requiredBatchTime_s ?? 0).toFixed(1)} s`
              }
              testId="metric-target-sizing"
              valueClassName={
                results.isValid && !targetDesign.isTargetAchievable
                  ? 'text-xl text-amber-800'
                  : 'text-2xl text-slate-900'
              }
            />
          </div>

          <ReactionEngineeringSchematic inputs={inputs} results={results} />

          <ReactionEngineeringCharts
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
      <div className="space-y-8" data-testid="reaction-learning-panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-medium text-teal-800 mb-1">
                Step 3 · Analyze — Live Reaction Kinetics Interpretation
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Physical Analysis of Current Reactor State
              </h3>

              {results.isValid ? (
                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  <p>
                    For the{' '}
                    <strong className="text-slate-900">{active.label}</strong> at{' '}
                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                      {active.timeSymbol} = {active.characteristicTime_s.toFixed(1)} s
                    </span>{' '}
                    and dimensionless Damköhler number{' '}
                    <strong className="font-mono text-slate-900">
                      Da = {active.damkohlerNumber.toFixed(2)}
                    </strong>
                    , conversion reaches{' '}
                    <strong className="font-mono text-teal-800">
                      X = {active.conversion_pct.toFixed(2)}%
                    </strong>{' '}
                    with reactant concentration{' '}
                    <strong className="font-mono text-slate-900">
                      CA = {active.outletConcentration_mol_m3.toFixed(2)} mol/m³
                    </strong>
                    .
                  </p>

                  <p>
                    At identical characteristic time ({active.characteristicTime_s.toFixed(1)} s),{' '}
                    <span className="font-medium text-slate-900">
                      Ideal PFR and Batch reactors achieve identical conversion (
                      {results.pfrAtBatchTime.conversion_pct.toFixed(2)}%)
                    </span>{' '}
                    because plug-flow fluid elements experience the same reaction-time history as a
                    batch vessel, whereas an{' '}
                    <span className="font-medium text-slate-900">
                      Ideal CSTR achieves {results.cstrAtBatchTime.conversion_pct.toFixed(2)}%
                    </span>{' '}
                    because immediate backmixing drops its entire interior to the lower outlet
                    concentration.
                  </p>

                  {targetDesign.isTargetAchievable &&
                  targetDesign.requiredVolumeCSTR_m3 !== null &&
                  targetDesign.requiredVolumePFR_m3 !== null ? (
                    <p>
                      To hit{' '}
                      <span className="font-mono text-xs font-semibold">
                        X_target = {inputs.targetConversion_pct}%
                      </span>
                      , an Ideal CSTR requires{' '}
                      <strong className="font-mono text-rose-700">
                        {targetDesign.requiredVolumeCSTR_m3.toFixed(2)} m³
                      </strong>{' '}
                      versus{' '}
                      <strong className="font-mono text-teal-800">
                        {targetDesign.requiredVolumePFR_m3.toFixed(2)} m³
                      </strong>{' '}
                      for an Ideal PFR (a{' '}
                      <strong className="font-mono text-slate-900">
                        {(targetDesign.cstrToPfrVolumeRatio ?? 1).toFixed(2)}×
                      </strong>{' '}
                      volume penalty). Batch operation requires{' '}
                      <span className="font-mono text-xs font-semibold">
                        t_req = {(targetDesign.requiredBatchTime_s ?? 0).toFixed(1)} s
                      </span>{' '}
                      of active reaction time (excluding filling, emptying, and turnaround).
                    </p>
                  ) : (
                    <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                      <strong>Target Sizing Notice:</strong> {targetDesign.unachievableReason}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-rose-800 font-medium">
                  Simulation paused: resolve the kinetic or operating validation errors above to
                  compute reactor conversion and sizing metrics.
                </p>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums">
              <span>First-Order Irreversible A → B (−rA = k·CA)</span>
              <span>Isothermal · Constant Density</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <LabAssumptionsCard
              eyebrow="Model Scope & Limitations · Ideal Isothermal Reactors"
              title="Documented Engineering Assumptions"
              assumptions={REACTION_MODEL_ASSUMPTIONS}
            />
          </div>
        </div>

        {/* Conceptual Reference + Progressive Equation Disclosure */}
        <LabTheoryDisclosureCard
          eyebrow="Conceptual Reference · Reactor Design Equations"
          title="Understanding Batch, CSTR, and PFR Material Balances"
          subtitle="From mole balances and rate laws to Damköhler numbers, residence time τ, and why CSTRs require larger volumes at high conversion."
          expandLabel="Expand Reactor Design Equations"
          collapseLabel="Hide Reactor Design Equations"
          concepts={[
            {
              title: 'Batch Reactor (Closed)',
              body: (
                <>
                  Unsteady uniform vessel:{' '}
                  <span className="font-mono text-slate-800">CA(t) = CA0·exp(−k·t)</span> and{' '}
                  <span className="font-mono text-slate-800">X = 1 − exp(−k·t)</span>. Time{' '}
                  <span className="font-mono">t</span> excludes turnaround.
                </>
              ),
            },
            {
              title: 'Ideal CSTR (Backmixed)',
              body: (
                <>
                  Algebraic mole balance:{' '}
                  <span className="font-mono text-slate-800">X = kτ / (1 + kτ)</span>, operating
                  everywhere at the low outlet concentration <span className="font-mono">CA,out</span>.
                </>
              ),
            },
            {
              title: 'Ideal PFR (Tubular)',
              body: (
                <>
                  Differential balance yields{' '}
                  <span className="font-mono text-slate-800">CA(V) = CA0·exp(−kV/q)</span>, matching
                  Batch performance when <span className="font-mono">τ = t</span>.
                </>
              ),
            },
            {
              title: 'Target Sizing Ratio',
              body: (
                <>
                  <span className="font-mono text-slate-800">V_CSTR = qX/[k(1−X)]</span> grows as{' '}
                  <span className="font-mono">(1−X)⁻¹</span>, diverging much faster than{' '}
                  <span className="font-mono">−ln(1−X)</span> as X → 100%.
                </>
              ),
            },
          ]}
          detailedBlocks={[
            {
              title: '01. Batch Reactor Design Equations',
              subtitle: 'Constant-volume isothermal mole balance dNA/dt = rA·V:',
              equations: [
                { text: 'dCA/dt = −k · CA   (CA(0) = CA0)' },
                { text: 'CA(t) = CA0 · exp(−k · t)', tone: 'teal' },
                { text: 'X(t) = 1 − exp(−k · t)' },
                { text: 't_req = −ln(1 − X_target) / k  [s]', tone: 'muted' },
              ],
            },
            {
              title: '02. Ideal CSTR Design Equations',
              subtitle: 'Steady backmixed algebraic balance FA0 − FA + rA·V = 0:',
              equations: [
                { text: 'τ = V / q  [s],   Da = k · τ' },
                { text: 'CA = CA0 / (1 + k · τ)', tone: 'teal' },
                { text: 'X = (k · τ) / (1 + k · τ)' },
                { text: 'V_req,CSTR = q · X / [k · (1 − X)]  [m³]', tone: 'muted' },
              ],
            },
            {
              title: '03. Ideal PFR Design Equations',
              subtitle: 'Steady plug-flow differential balance dFA/dV = rA:',
              equations: [
                { text: 'q · dCA/dV = −k · CA' },
                { text: 'CA(V) = CA0 · exp(−k · V / q)', tone: 'teal' },
                { text: 'X = 1 − exp(−k · τ)   (τ = V/q)' },
                { text: 'V_req,PFR = −(q / k) · ln(1 − X_target)  [m³]', tone: 'muted' },
              ],
            },
          ]}
        />

        {/* Step 4: Guided Engineering Inquiry (6 Questions) */}
        <LabGuidedInquiryCard<ReactionEngineeringInputs>
          questions={REACTION_GUIDED_EXPLORATION_QUESTIONS}
          onApplyInputs={handleApplyGuidedInputs}
          derivationHeading="Reaction Kinetics & Reactor Design Derivation"
        />
      </div>
    </section>
  );
}
