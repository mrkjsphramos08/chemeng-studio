'use client';

import React, { useMemo, useState } from 'react';
import {
  DEFAULT_DISTILLATION_INPUTS,
  DISTILLATION_PRESETS,
  DistillationInputs,
  calculateDistillation,
} from '@/lib/distillation';
import { DISTILLATION_GUIDED_EXPLORATION_QUESTIONS } from '@/lib/labs-data';
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
  MathInline,
} from '@/components/lab-shared';
import { DistillationSchematic } from './distillation-schematic';
import {
  DistillationCharts,
  SavedDistillationScenario,
} from './distillation-charts';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const DISTILLATION_CONTROL_GROUPS: LabControlGroup[] = [
  { id: 'feed-compositions', title: 'Feed & Product Compositions (Component A)' },
  { id: 'vle-reflux', title: 'VLE Volatility ($\\alpha$) & Operating Reflux ($R$)' },
  { id: 'feed-quality', title: 'Feed Thermal Condition ($q$-Line)' },
];

const DISTILLATION_CONTROLS: LabSliderControlConfig<
  Extract<keyof DistillationInputs, string>
>[] = [
  {
    key: 'feedFlow_kmol_h',
    label: 'Feed Molar Flow Rate',
    symbol: 'F',
    symbolLatex: 'F',
    unit: 'kmol/h',
    unitLatex: '\\mathrm{kmol/h}',
    min: 10,
    max: 500,
    step: 5,
    inputMin: 1,
    inputMax: 10000,
    inputStep: 'any',
    group: 'feed-compositions',
  },
  {
    key: 'feedComposition_zF',
    label: 'Feed Composition',
    symbol: 'zF',
    symbolLatex: 'z_F',
    unit: 'mol/mol',
    unitLatex: '\\mathrm{mol/mol}',
    min: 0.1,
    max: 0.9,
    step: 0.01,
    inputMin: 0.01,
    inputMax: 0.99,
    inputStep: 'any',
    group: 'feed-compositions',
    helperText: 'Must satisfy normal ordering: $0 < x_B < z_F < x_D < 1$',
  },
  {
    key: 'distillateComposition_xD',
    label: 'Distillate Purity',
    symbol: 'xD',
    symbolLatex: 'x_D',
    unit: 'mol/mol',
    unitLatex: '\\mathrm{mol/mol}',
    min: 0.6,
    max: 0.99,
    step: 0.01,
    inputMin: 0.02,
    inputMax: 0.999,
    inputStep: 'any',
    group: 'feed-compositions',
  },
  {
    key: 'bottomsComposition_xB',
    label: 'Bottoms Composition',
    symbol: 'xB',
    symbolLatex: 'x_B',
    unit: 'mol/mol',
    unitLatex: '\\mathrm{mol/mol}',
    min: 0.01,
    max: 0.4,
    step: 0.01,
    inputMin: 0.001,
    inputMax: 0.98,
    inputStep: 'any',
    group: 'feed-compositions',
  },
  {
    key: 'relativeVolatility_alpha',
    label: 'Relative Volatility',
    symbol: 'α',
    symbolLatex: '\\alpha',
    unit: 'dimensionless',
    min: 1.15,
    max: 6.0,
    step: 0.05,
    inputMin: 1.01,
    inputMax: 20,
    inputStep: 'any',
    group: 'vle-reflux',
    helperText: 'Constant VLE: $y^* = \\frac{\\alpha x}{1 + (\\alpha - 1)x}$ ($\\alpha > 1$)',
  },
  {
    key: 'refluxRatio_R',
    label: 'Operating Reflux Ratio',
    symbol: 'R',
    symbolLatex: 'R',
    unit: 'L / D',
    unitLatex: 'L/D',
    min: 0.5,
    max: 8.0,
    step: 0.05,
    inputMin: 0.05,
    inputMax: 50,
    inputStep: 'any',
    group: 'vle-reflux',
    helperText: 'Rectifying slope $L/V = R / (R + 1)$',
  },
  {
    key: 'feedQuality_q',
    label: 'Feed Thermal Quality',
    symbol: 'q',
    symbolLatex: 'q',
    unit: 'liquid frac.',
    min: 0.0,
    max: 1.0,
    step: 0.05,
    inputMin: 0.0,
    inputMax: 1.0,
    inputStep: 'any',
    group: 'feed-quality',
    helperText: '$q = 1.0$ sat. liquid · $0 < q < 1$ two-phase · $q = 0.0$ sat. vapor',
  },
];

const DISTILLATION_LEARNING_OBJECTIVES = [
  {
    title: '1. Vapor–Liquid Equilibrium (VLE):',
    detail: 'See how relative volatility $\\alpha$ shapes $y^*(x)$ and sets separation difficulty.',
  },
  {
    title: '2. Operating Lines & Feed $q$-Line:',
    detail: 'Connect Constant Molar Overflow material balances to rectifying, stripping, and $q$-line slopes.',
  },
  {
    title: '3. McCabe–Thiele Stage Stepping:',
    detail: 'Step between equilibrium and operating lines to determine theoretical stages $N$ and optimal feed stage $N_F$.',
  },
  {
    title: '4. Minimum Reflux & Pinch Limits:',
    detail: 'Identify $R_{\\min}$, Fenske $N_{\\min}$, and why reflux below $R_{\\min}$ causes an unresolvable pinch.',
  },
];

const DISTILLATION_WORKFLOW_STEPS = [
  {
    title: 'Step 1 — Configure',
    detail: 'Select feed flow $F$, compositions ($z_F, x_D, x_B$), relative volatility $\\alpha$, reflux $R$, and feed quality $q$.',
  },
  {
    title: 'Step 2 — Simulate',
    detail: 'Construct the interactive McCabe–Thiele diagram, step through stages, and inspect column flows.',
  },
  {
    title: 'Step 3 — Analyze',
    detail: 'Explore VLE sensitivity, Theoretical Stages vs. Reflux Ratio, and saved scenario comparisons.',
  },
  {
    title: 'Step 4 — Reflect',
    detail: 'Complete the 7 guided binary distillation inquiries and verify your conceptual conclusions.',
  },
];

const DISTILLATION_MODEL_ASSUMPTIONS = [
  {
    label: '1. Hypothetical binary mixture ($A$ & $B$)',
    detail: 'Light component $A$ more volatile than heavy component $B$; no multicomponent effects',
  },
  {
    label: '2. Constant relative volatility ($\\alpha > 1$)',
    detail: 'Ideal/near-ideal VLE $y^* = \\frac{\\alpha x}{1+(\\alpha-1)x}$; no azeotropes or strong nonidealities',
  },
  {
    label: '3. Constant Molar Overflow (CMO)',
    detail: 'Equal molar latent heats and negligible sensible/wall heat losses keep $L, V$ and $\\bar{L}, \\bar{V}$ constant',
  },
  {
    label: '4. Steady-state single-feed column',
    detail: 'One feed $F$ ($0 \\le q \\le 1$), one overhead distillate $D$, and one bottoms product $B$',
  },
  {
    label: '5. Ideal equilibrium stages',
    detail: 'Vapor and liquid leaving each stage are in complete thermodynamic equilibrium ($\\eta = 100\\%$)',
  },
  {
    label: '6. Condenser & reboiler convention',
    detail: 'Total condenser = $0$ equilibrium stages; Partial reboiler = $1$ equilibrium stage',
  },
  {
    label: '7. No tray hydraulics or $T$–$P$ profiles',
    detail: 'Flooding, weeping, entrainment, pressure drop, and stage temperatures are not modeled',
  },
];

const FEED_QUALITY_QUICK_OPTIONS = [
  { label: 'Sat. Liquid', shortDesc: 'q = 1.00 (Vertical)', qValue: 1.0 },
  { label: 'Two-Phase', shortDesc: 'q = 0.50 (Slope −1)', qValue: 0.5 },
  { label: 'Sat. Vapor', shortDesc: 'q = 0.00 (Horizontal)', qValue: 0.0 },
];

function buildInitialDistillationScenario(): SavedDistillationScenario {
  const res = calculateDistillation(DEFAULT_DISTILLATION_INPUTS);
  return {
    id: 'distillation-baseline-default',
    label: 'Baseline (α=2.5, R=2.0, q=1.0)',
    inputs: { ...DEFAULT_DISTILLATION_INPUTS },
    distillateFlow_kmol_h: res.materialBalance.distillateFlow_kmol_h,
    bottomsFlow_kmol_h: res.materialBalance.bottomsFlow_kmol_h,
    minimumReflux_Rmin: res.minimumReflux.minimumRefluxRatio_Rmin,
    totalTheoreticalStages: res.stageCalculation.totalTheoreticalStages,
    fractionalTheoreticalStages: res.stageCalculation.fractionalTheoreticalStages,
    feedStageNumber: res.stageCalculation.feedStageNumber,
    feasibilityLabel: res.feasibilityLabel,
  };
}

export function DistillationLab() {
  const [inputs, setInputs] = useState<DistillationInputs>({
    ...DEFAULT_DISTILLATION_INPUTS,
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('baseline-moderate-alpha');
  const [savedScenarios, setSavedScenarios] = useState<SavedDistillationScenario[]>(() => [
    buildInitialDistillationScenario(),
  ]);

  const results = useMemo(() => calculateDistillation(inputs), [inputs]);

  const handleInputChange = (
    key: Extract<keyof DistillationInputs, string>,
    rawValue: string
  ) => {
    const parsed = parseFloat(rawValue);
    setSelectedPresetId('custom');
    setInputs((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleQuickFeedQuality = (qVal: number) => {
    setSelectedPresetId('custom');
    setInputs((prev) => ({
      ...prev,
      feedQuality_q: qVal,
    }));
  };

  const handleReset = () => {
    setSelectedPresetId('baseline-moderate-alpha');
    setInputs({ ...DEFAULT_DISTILLATION_INPUTS });
  };

  const handleSelectPreset = (presetId: string) => {
    const found = DISTILLATION_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedPresetId(found.id);
      setInputs({ ...found.inputs });
    }
  };

  const handleApplyGuidedInputs = (guidedInputs: DistillationInputs) => {
    setSelectedPresetId('custom');
    setInputs({ ...guidedInputs });
  };

  const handleSaveCurrentScenario = (customLabel?: string) => {
    if (!results.isValid) return;
    const nextNumber = savedScenarios.length + 1;
    const trimmed = customLabel?.trim();
    const newScenario: SavedDistillationScenario = {
      id: `distillation-run-${Date.now()}`,
      label: trimmed
        ? trimmed
        : `Run #${nextNumber} (α=${inputs.relativeVolatility_alpha.toFixed(1)}, R=${inputs.refluxRatio_R.toFixed(2)}, q=${inputs.feedQuality_q.toFixed(1)})`,
      inputs: { ...inputs },
      distillateFlow_kmol_h: results.materialBalance.distillateFlow_kmol_h,
      bottomsFlow_kmol_h: results.materialBalance.bottomsFlow_kmol_h,
      minimumReflux_Rmin: results.minimumReflux.minimumRefluxRatio_Rmin,
      totalTheoreticalStages: results.stageCalculation.totalTheoreticalStages,
      fractionalTheoreticalStages: results.stageCalculation.fractionalTheoreticalStages,
      feedStageNumber: results.stageCalculation.feedStageNumber,
      feasibilityLabel: results.feasibilityLabel,
    };
    setSavedScenarios((prev) => [...prev, newScenario]);
  };

  const handleRemoveScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearScenarios = () => {
    setSavedScenarios([buildInitialDistillationScenario()]);
  };

  const handleDownloadCsv = () => {
    if (!results.isValid) return;
    const { materialBalance, internalFlows, operatingLines, minimumReflux, stageCalculation } =
      results;

    downloadSimulationCsv('chemeng-binary-distillation-mccabe-thiele', [
      {
        title: 'ChemEng Studio — Binary Distillation Simulation Report (Generated Simulation Data, Not Experimental Measurements)',
        headers: ['Assumption / Convention', 'Specification'],
        rows: [
          ['Thermodynamic Model', 'Hypothetical binary mixture (A more volatile than B), Constant Relative Volatility alpha'],
          ['Column Flow Model', 'Steady-State Constant Molar Overflow (CMO), Adiabatic Column Sections'],
          ['Stage Convention', 'Total Condenser = 0 Equilibrium Stages; Partial Reboiler = 1 Equilibrium Stage'],
          ['Feasibility Status', results.feasibilityLabel],
        ],
      },
      {
        title: 'Operating Input Specifications',
        headers: ['Parameter', 'Symbol', 'Value', 'Unit'],
        rows: [
          ['Feed Molar Flow Rate', 'F', inputs.feedFlow_kmol_h, 'kmol/h'],
          ['Feed Light-Component Mole Fraction', 'zF', inputs.feedComposition_zF, 'mol/mol'],
          ['Distillate Light-Component Mole Fraction', 'xD', inputs.distillateComposition_xD, 'mol/mol'],
          ['Bottoms Light-Component Mole Fraction', 'xB', inputs.bottomsComposition_xB, 'mol/mol'],
          ['Relative Volatility', 'alpha', inputs.relativeVolatility_alpha, 'dimensionless'],
          ['Operating Reflux Ratio', 'R', inputs.refluxRatio_R, 'mol/mol (L/D)'],
          ['Feed Thermal Quality', 'q', inputs.feedQuality_q, 'dimensionless (0 <= q <= 1)'],
        ],
      },
      {
        title: 'Computed Material Balances, Operating Lines & Stage Requirements',
        headers: ['Quantity', 'Symbol', 'Value', 'Unit / Note'],
        rows: [
          ['Distillate Molar Flow Rate', 'D', materialBalance.distillateFlow_kmol_h.toFixed(4), 'kmol/h'],
          ['Bottoms Molar Flow Rate', 'B', materialBalance.bottomsFlow_kmol_h.toFixed(4), 'kmol/h'],
          ['Light Component Recovery in Distillate', 'Recovery_A', materialBalance.lightRecoveryInDistillate_pct.toFixed(2), '%'],
          ['Rectifying Liquid Flow', 'L', internalFlows.rectifyingLiquid_L_kmol_h.toFixed(4), 'kmol/h'],
          ['Rectifying Vapor Flow', 'V', internalFlows.rectifyingVapor_V_kmol_h.toFixed(4), 'kmol/h'],
          ['Stripping Liquid Flow', 'L_bar', internalFlows.strippingLiquid_Lbar_kmol_h.toFixed(4), 'kmol/h'],
          ['Stripping Vapor Flow', 'V_bar', internalFlows.strippingVapor_Vbar_kmol_h.toFixed(4), 'kmol/h'],
          ['Minimum Reflux Ratio', 'R_min', minimumReflux.minimumRefluxRatio_Rmin !== null ? minimumReflux.minimumRefluxRatio_Rmin.toFixed(4) : 'N/A', 'L_min / D'],
          ['Operating-to-Minimum Reflux Ratio', 'R / R_min', minimumReflux.operatingToMinRefluxRatio !== null ? minimumReflux.operatingToMinRefluxRatio.toFixed(4) : 'N/A', 'dimensionless'],
          ['Fenske Minimum Stages (Total Reflux)', 'N_min', minimumReflux.fenskeMinimumStages_Nmin !== null ? minimumReflux.fenskeMinimumStages_Nmin.toFixed(4) : 'N/A', 'stages'],
          ['Operating-Line Feed Intersection', '(x_int, y_int)', `(${operatingLines.intersection_x.toFixed(4)}, ${operatingLines.intersection_y.toFixed(4)})`, 'mol/mol'],
          ['Total Theoretical Equilibrium Stages (Integer)', 'N_total', stageCalculation.totalTheoreticalStages !== null ? stageCalculation.totalTheoreticalStages : 'Unresolved / Pinched', 'includes partial reboiler'],
          ['Column Theoretical Trays', 'N_trays', stageCalculation.columnTheoreticalTrays !== null ? stageCalculation.columnTheoreticalTrays : 'Unresolved / Pinched', 'excludes partial reboiler'],
          ['Fractional Theoretical Stage Requirement', 'N_frac', stageCalculation.fractionalTheoreticalStages !== null ? stageCalculation.fractionalTheoreticalStages.toFixed(4) : 'Unresolved / Pinched', 'stages'],
          ['Optimal Feed Stage Location', 'N_F', stageCalculation.feedStageNumber !== null ? stageCalculation.feedStageNumber : 'Unresolved / Pinched', 'counted from top = 1'],
        ],
      },
      {
        title: 'McCabe-Thiele Equilibrium Stage Stepping Coordinates',
        headers: ['Stage Number', 'Column Section', 'Entering Vapor y_n', 'Equilibrium Liquid x_n*', 'Next Operating Vapor y_{n+1}', 'Stage Fraction'],
        rows: stageCalculation.stages.map((st) => [
          st.stageNumber,
          st.section.toUpperCase(),
          st.y_in.toFixed(4),
          st.x_eq.toFixed(4),
          st.y_next.toFixed(4),
          st.stageEfficiencyFraction.toFixed(4),
        ]),
      },
      {
        title: 'Saved Scenario Comparison Runs',
        headers: ['Scenario Label', 'alpha', 'q', 'R', 'R_min', 'zF', 'xD', 'xB', 'D (kmol/h)', 'B (kmol/h)', 'N_total', 'N_frac', 'Feed Stage NF'],
        rows: savedScenarios.map((s) => [
          s.label,
          s.inputs.relativeVolatility_alpha.toFixed(2),
          s.inputs.feedQuality_q.toFixed(2),
          s.inputs.refluxRatio_R.toFixed(2),
          s.minimumReflux_Rmin !== null ? s.minimumReflux_Rmin.toFixed(3) : 'N/A',
          s.inputs.feedComposition_zF.toFixed(2),
          s.inputs.distillateComposition_xD.toFixed(2),
          s.inputs.bottomsComposition_xB.toFixed(2),
          s.distillateFlow_kmol_h.toFixed(2),
          s.bottomsFlow_kmol_h.toFixed(2),
          s.totalTheoreticalStages ?? 'Pinched',
          s.fractionalTheoreticalStages !== null ? s.fractionalTheoreticalStages.toFixed(2) : 'Pinched',
          s.feedStageNumber ?? 'N/A',
        ]),
      },
    ]);
  };

  const { materialBalance, internalFlows, operatingLines, minimumReflux, stageCalculation } =
    results;

  return (
    <section
      aria-label="Binary Distillation Virtual Laboratory"
      className="max-w-[1360px] mx-auto px-6 py-8 space-y-6"
      data-testid="distillation-lab-workspace"
    >
      {/* Shared Laboratory Workspace Header */}
      <LabWorkspaceHeader
        kickerItems={[
          'Unit Operations Laboratory 04',
          'Binary Fractional Distillation · McCabe–Thiele Method',
          'Molar Flow & Mole Fraction Basis',
        ]}
        title="Distillation & Separation Processes Virtual Laboratory"
        description="Investigate steady-state binary fractional distillation using the McCabe–Thiele graphical equilibrium-stage method. Explore vapor–liquid equilibrium ($\alpha$), reflux ratio trade-offs ($R$ vs. $N$), feed thermal quality ($q$-line), minimum reflux pinch points ($R_{\min}$), and theoretical stage counts."
        presets={DISTILLATION_PRESETS.map((p) => ({
          id: p.id,
          name: p.label,
          description: p.description,
        }))}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onSaveScenario={() => handleSaveCurrentScenario()}
        savedCount={savedScenarios.length}
        canSave={results.isValid}
        onDownloadCsv={handleDownloadCsv}
        canDownload={results.isValid}
        onReset={handleReset}
        learningObjectives={DISTILLATION_LEARNING_OBJECTIVES}
        workflowSteps={DISTILLATION_WORKFLOW_STEPS}
      />

      {/* Shared Validation Error & Pinch/Reflux Advisory Banners */}
      <LabValidationAlerts
        issues={results.validationIssues}
        warningTitle="Distillation Feasibility & Pinch Advisory"
      />

      {/* Main 2-Zone Sandbox Layout: Controls Deck (Left 4 cols) + Stage & Dashboard (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 min-w-0 space-y-4">
          {/* Quick-Select Feed Thermal Condition (q) Card */}
          <div
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5"
            data-testid="feed-quality-quick-selector"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-900">
                Feed Thermal Condition (<MathInline latex="q" />-Line Quick Select)
              </h2>
              <span className="text-[11px] font-mono text-teal-800 font-semibold">
                <MathInline latex="q" /> = {inputs.feedQuality_q.toFixed(2)}
              </span>
            </div>
            <div
              className="grid grid-cols-3 gap-1.5"
              role="group"
              aria-label="Feed Thermal Quality Preset"
            >
              {FEED_QUALITY_QUICK_OPTIONS.map((opt) => {
                const isActive = Math.abs(inputs.feedQuality_q - opt.qValue) < 1e-4;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    data-testid={`quick-q-btn-${Math.round(opt.qValue * 100)}`}
                    onClick={() => handleQuickFeedQuality(opt.qValue)}
                    aria-pressed={isActive}
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

          {/* Shared Parameter Panel */}
          <LabParameterPanel<DistillationInputs>
            subtitle="Molar flow ($\mathrm{kmol/h}$) & mole fraction inputs"
            groups={DISTILLATION_CONTROL_GROUPS}
            controls={DISTILLATION_CONTROLS}
            values={inputs}
            onChange={handleInputChange}
            onReset={handleReset}
            footerContent={
              results.isValid ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg font-mono text-[11px] tabular-nums">
                  <span className="inline-flex items-center gap-1.5 font-sans font-semibold text-slate-900">
                    {stageCalculation.converged ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                    {results.feasibilityLabel}
                  </span>
                  <span>
                    <MathInline latex="R_{\min}" /> ={' '}
                    {minimumReflux.minimumRefluxRatio_Rmin !== null
                      ? minimumReflux.minimumRefluxRatio_Rmin.toFixed(3)
                      : '—'}
                  </span>
                </div>
              ) : null
            }
          />
        </div>

        {/* RIGHT COLUMN: 9 KPI Cards + Interactive McCabe-Thiele Diagram + Column Schematic + Charts */}
        <div className="lg:col-span-8 min-w-0 space-y-6">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            data-testid="distillation-results-dashboard"
          >
            <LabMetricCard
              label="Distillate Molar Flow ($D$)"
              value={
                results.isValid
                  ? `${materialBalance.distillateFlow_kmol_h.toFixed(2)} kmol/h`
                  : '—'
              }
              subtext={
                results.isValid
                  ? `$x_D = ${inputs.distillateComposition_xD.toFixed(3)}$ · $A$ Recovery: ${materialBalance.lightRecoveryInDistillate_pct.toFixed(1)}%`
                  : '—'
              }
              testId="metric-distillate-flow"
            />
            <LabMetricCard
              label="Bottoms Molar Flow ($B$)"
              value={
                results.isValid
                  ? `${materialBalance.bottomsFlow_kmol_h.toFixed(2)} kmol/h`
                  : '—'
              }
              subtext={
                results.isValid
                  ? `$x_B = ${inputs.bottomsComposition_xB.toFixed(3)}$ · Feed $F = ${inputs.feedFlow_kmol_h.toFixed(1)}\\,\\mathrm{kmol/h}$`
                  : '—'
              }
              testId="metric-bottoms-flow"
            />
            <LabMetricCard
              label="Theoretical Equilibrium Stages ($N$)"
              value={
                !results.isValid
                  ? '—'
                  : stageCalculation.converged &&
                    stageCalculation.totalTheoreticalStages !== null &&
                    stageCalculation.fractionalTheoreticalStages !== null
                  ? `${stageCalculation.totalTheoreticalStages} (${stageCalculation.fractionalTheoreticalStages.toFixed(2)})`
                  : 'Pinched / Unresolved'
              }
              subtext={
                !results.isValid
                  ? '—'
                  : stageCalculation.converged &&
                    stageCalculation.columnTheoreticalTrays !== null
                  ? `${stageCalculation.columnTheoreticalTrays} column trays + 1 partial reboiler`
                  : 'Increase reflux ratio $R$ above $R_{\\min}$'
              }
              testId="metric-theoretical-stages"
              valueClassName={
                results.isValid && !stageCalculation.converged
                  ? 'text-xl text-amber-800'
                  : 'text-2xl text-teal-800'
              }
            />
            <LabMetricCard
              label="Optimal Feed-Stage Location ($N_F$)"
              value={
                !results.isValid
                  ? '—'
                  : stageCalculation.converged && stageCalculation.feedStageNumber !== null
                  ? `Stage ${stageCalculation.feedStageNumber}`
                  : 'Unresolved'
              }
              subtext={
                !results.isValid
                  ? '—'
                  : stageCalculation.converged &&
                    stageCalculation.rectifyingStageCount !== null &&
                    stageCalculation.strippingStageCount !== null
                  ? `${stageCalculation.rectifyingStageCount} rectifying above · ${stageCalculation.strippingStageCount} stripping/reboiler`
                  : 'Requires feasible staircase'
              }
              testId="metric-feed-stage"
            />
            <LabMetricCard
              label="Operating Reflux Ratio ($R = L/D$)"
              value={results.isValid ? `${inputs.refluxRatio_R.toFixed(2)}` : '—'}
              subtext={
                results.isValid && minimumReflux.operatingToMinRefluxRatio !== null
                  ? `${minimumReflux.operatingToMinRefluxRatio.toFixed(2)}× $R_{\\min}$ · Slope $L/V = ${operatingLines.rectifyingSlope.toFixed(3)}$`
                  : '—'
              }
              testId="metric-operating-reflux"
            />
            <LabMetricCard
              label="Minimum Reflux Ratio ($R_{\min}$)"
              value={
                results.isValid && minimumReflux.minimumRefluxRatio_Rmin !== null
                  ? `${minimumReflux.minimumRefluxRatio_Rmin.toFixed(3)}`
                  : '—'
              }
              subtext={
                results.isValid &&
                minimumReflux.pinch_x !== null &&
                minimumReflux.pinch_y !== null
                  ? `Pinch $(x_p, y_p) = (${minimumReflux.pinch_x.toFixed(3)}, ${minimumReflux.pinch_y.toFixed(3)})$`
                  : '—'
              }
              testId="metric-minimum-reflux"
            />
            <LabMetricCard
              label="Relative Volatility ($\alpha$) & Fenske $N_{\min}$"
              value={
                results.isValid ? `α = ${inputs.relativeVolatility_alpha.toFixed(2)}` : '—'
              }
              subtext={
                results.isValid && minimumReflux.fenskeMinimumStages_Nmin !== null
                  ? `Fenske $N_{\\min}$ ($R \\to \\infty$) = ${minimumReflux.fenskeMinimumStages_Nmin.toFixed(2)} stages`
                  : '—'
              }
              testId="metric-volatility-fenske"
            />
            <LabMetricCard
              label="Internal Column Section Flows"
              value={
                results.isValid
                  ? `V = ${internalFlows.rectifyingVapor_V_kmol_h.toFixed(1)} kmol/h`
                  : '—'
              }
              subtext={
                results.isValid
                  ? `$L = ${internalFlows.rectifyingLiquid_L_kmol_h.toFixed(1)}$ · $\\bar{L} = ${internalFlows.strippingLiquid_Lbar_kmol_h.toFixed(1)}$ · $\\bar{V} = ${internalFlows.strippingVapor_Vbar_kmol_h.toFixed(1)}$`
                  : '—'
              }
              testId="metric-internal-flows"
            />
            <LabMetricCard
              label="Material Balance & Feasibility"
              value={
                !results.isValid
                  ? 'Invalid'
                  : materialBalance.isBalanced
                  ? 'Balanced (0.00 Δ)'
                  : 'Check Balance'
              }
              subtext={
                results.isValid
                  ? `$F = D + B$ (${materialBalance.feedFlow_kmol_h.toFixed(1)} kmol/h) · ${operatingLines.feedRegimeLabel}`
                  : '—'
              }
              testId="metric-material-balance"
            />
          </div>

          {/* Centerpiece Interactive McCabe–Thiele Diagram + Secondary Charts + Scenario Comparison */}
          <DistillationCharts
            inputs={inputs}
            results={results}
            savedScenarios={savedScenarios}
            onSaveCurrentScenario={handleSaveCurrentScenario}
            onRemoveScenario={handleRemoveScenario}
            onLoadScenario={handleApplyGuidedInputs}
            onClearScenarios={handleClearScenarios}
          />

          {/* Dynamic Distillation Column SVG Schematic */}
          <DistillationSchematic inputs={inputs} results={results} />
        </div>
      </div>

      {/* Step 3 Physical Analysis & Documented Assumptions */}
      <div className="space-y-8" data-testid="distillation-learning-panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-medium text-teal-800 mb-1">
                Step 3 · Analyze — Live McCabe–Thiele Column Interpretation
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Physical Analysis of Current Binary Separation State
              </h3>

              {results.isValid ? (
                <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                  <p>
                    Separating{' '}
                    <strong className="font-mono text-slate-900">
                      <MathInline latex="F" /> = {inputs.feedFlow_kmol_h.toFixed(1)} kmol/h
                    </strong>{' '}
                    of feed (<MathInline latex="z_F" /> ={' '}
                    <span className="font-mono">{inputs.feedComposition_zF.toFixed(2)}</span>)
                    into distillate (<MathInline latex="x_D" /> ={' '}
                    <span className="font-mono">{inputs.distillateComposition_xD.toFixed(2)}</span>)
                    and bottoms (<MathInline latex="x_B" /> ={' '}
                    <span className="font-mono">{inputs.bottomsComposition_xB.toFixed(2)}</span>)
                    yields{' '}
                    <strong className="font-mono text-teal-800">
                      <MathInline latex="D" /> = {materialBalance.distillateFlow_kmol_h.toFixed(2)}{' '}
                      kmol/h
                    </strong>{' '}
                    and{' '}
                    <strong className="font-mono text-slate-900">
                      <MathInline latex="B" /> = {materialBalance.bottomsFlow_kmol_h.toFixed(2)}{' '}
                      kmol/h
                    </strong>
                    , recovering{' '}
                    <strong className="font-mono text-slate-900">
                      {materialBalance.lightRecoveryInDistillate_pct.toFixed(1)}%
                    </strong>{' '}
                    of Component A in the overhead distillate.
                  </p>

                  <p>
                    At relative volatility{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      <MathInline latex="\alpha" /> = {inputs.relativeVolatility_alpha.toFixed(2)}
                    </span>{' '}
                    and feed quality{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      <MathInline latex="q" /> = {inputs.feedQuality_q.toFixed(2)}
                    </span>
                    , the minimum reflux ratio is{' '}
                    <strong className="font-mono text-slate-900">
                      <MathInline latex="R_{\min}" /> ={' '}
                      {minimumReflux.minimumRefluxRatio_Rmin !== null
                        ? minimumReflux.minimumRefluxRatio_Rmin.toFixed(3)
                        : '—'}
                    </strong>{' '}
                    and the Fenske total-reflux minimum stage limit is{' '}
                    <strong className="font-mono text-slate-900">
                      <MathInline latex="N_{\min}" /> ={' '}
                      {minimumReflux.fenskeMinimumStages_Nmin !== null
                        ? minimumReflux.fenskeMinimumStages_Nmin.toFixed(2)
                        : '—'}
                    </strong>
                    .
                  </p>

                  {stageCalculation.converged &&
                  stageCalculation.totalTheoreticalStages !== null &&
                  stageCalculation.fractionalTheoreticalStages !== null ? (
                    <p>
                      Operating at{' '}
                      <span className="font-mono font-semibold text-slate-900">
                        <MathInline latex="R" /> = {inputs.refluxRatio_R.toFixed(2)} (
                        {(minimumReflux.operatingToMinRefluxRatio ?? 1).toFixed(2)}×{' '}
                        <MathInline latex="R_{\min}" />)
                      </span>{' '}
                      requires{' '}
                      <strong className="font-mono text-teal-800">
                        {stageCalculation.totalTheoreticalStages} graphical equilibrium stages (
                        {stageCalculation.fractionalTheoreticalStages.toFixed(2)} fractional stages)
                      </strong>{' '}
                      with optimal feed entry at{' '}
                      <strong className="font-mono text-slate-900">
                        Stage <MathInline latex="N_F" /> = {stageCalculation.feedStageNumber}
                      </strong>{' '}
                      ({stageCalculation.columnTheoreticalTrays} theoretical column trays plus 1
                      partial reboiler).
                    </p>
                  ) : (
                    <p className="text-amber-950 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                      <strong>Pinch / Non-Convergence Notice:</strong>{' '}
                      {stageCalculation.terminationReason}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-rose-800 font-medium">
                  Simulation paused: resolve the composition ordering or parameter validation errors
                  above to compute column material balances and McCabe–Thiele stages.
                </p>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums">
              <span>Constant Relative Volatility · Constant Molar Overflow</span>
              <span>Total Condenser (0) · Partial Reboiler (1)</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <LabAssumptionsCard
              eyebrow="Model Scope & Limitations · Ideal Binary Distillation"
              title="Documented Engineering Assumptions"
              assumptions={DISTILLATION_MODEL_ASSUMPTIONS}
            />
          </div>
        </div>

        {/* Conceptual Reference + Progressive Equation Disclosure */}
        <LabTheoryDisclosureCard
          eyebrow="Conceptual Reference · McCabe–Thiele Equations"
          title="Understanding VLE, Operating Lines, $q$-Line, and Stage Stepping"
          subtitle="From constant-relative-volatility phase equilibrium and Constant Molar Overflow balances to minimum reflux pinch points $R_{\min}$ and Fenske limits $N_{\min}$."
          expandLabel="Expand McCabe–Thiele Equations"
          collapseLabel="Hide McCabe–Thiele Equations"
          concepts={[
            {
              title: 'Vapor–Liquid Equilibrium (VLE)',
              body: (
                <>
                  Constant relative volatility <MathInline latex="\alpha > 1" /> gives{' '}
                  <MathInline latex="y^* = \frac{\alpha x}{1 + (\alpha - 1)x}" />. As{' '}
                  <MathInline latex="\alpha \to 1" />, <MathInline latex="y^* \to x" /> and
                  separation becomes increasingly difficult.
                </>
              ),
            },
            {
              title: 'Rectifying & Stripping Lines',
              body: (
                <>
                  Under Constant Molar Overflow, rectifying slope is{' '}
                  <MathInline latex="\frac{L}{V} = \frac{R}{R + 1}" /> through{' '}
                  <MathInline latex="(x_D, x_D)" /> and stripping slope is{' '}
                  <MathInline latex="\frac{\bar{L}}{\bar{V}}" /> through{' '}
                  <MathInline latex="(x_B, x_B)" />.
                </>
              ),
            },
            {
              title: 'Feed Quality & q-Line',
              body: (
                <>
                  Feed thermal quality <MathInline latex="q" /> sets the <MathInline latex="q" />
                  -line slope <MathInline latex="\frac{q}{q - 1}" /> through{' '}
                  <MathInline latex="(z_F, z_F)" />, governing where the two operating lines
                  intersect.
                </>
              ),
            },
            {
              title: 'Minimum Reflux & Fenske Limit',
              body: (
                <>
                  At <MathInline latex="R = R_{\min}" />, the operating lines touch the VLE curve
                  (pinch, <MathInline latex="N \to \infty" />). At total reflux (
                  <MathInline latex="R \to \infty" />), stages reach Fenske{' '}
                  <MathInline latex="N_{\min}" />.
                </>
              ),
            },
          ]}
          detailedBlocks={[
            {
              title: '01. Vapor–Liquid Equilibrium & Fenske Equation',
              subtitle: 'Constant relative volatility $\\alpha = \\frac{y_A / x_A}{y_B / x_B}$ across column stages:',
              equations: [
                {
                  latex: 'y^*(x) = \\frac{\\alpha x}{1 + (\\alpha - 1)x}',
                  equationNumber: '4.1',
                  tone: 'teal',
                },
                {
                  latex: 'x^*(y) = \\frac{y}{\\alpha - (\\alpha - 1)y}',
                  equationNumber: '4.2',
                },
                {
                  latex:
                    'N_{\\min} = \\frac{\\ln\\left[\\left(\\frac{x_D}{1 - x_D}\\right)\\left(\\frac{1 - x_B}{x_B}\\right)\\right]}{\\ln(\\alpha)}',
                  equationNumber: '4.3',
                  tone: 'muted',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'x,\\, y^*(x)',
                  description: 'Liquid and equilibrium vapor mole fractions of light component A',
                  unitLatex: '\\mathrm{mol/mol}',
                },
                {
                  symbolLatex: '\\alpha',
                  description: 'Relative volatility of light component A to heavy component B',
                  unitLatex: '\\text{dimensionless}',
                },
                {
                  symbolLatex: 'N_{\\min}',
                  description: 'Fenske minimum theoretical equilibrium stages at total reflux ($R \\to \\infty$)',
                  unitLatex: '\\text{stages}',
                },
              ],
            },
            {
              title: '02. Overall Material Balances & Rectifying Line',
              subtitle: 'Steady-state total and light-component balances around column and condenser:',
              equations: [
                {
                  latex: 'F = D + B, \\qquad F z_F = D x_D + B x_B',
                  equationNumber: '4.4',
                },
                {
                  latex: 'D = F \\frac{z_F - x_B}{x_D - x_B}, \\qquad B = F - D',
                  equationNumber: '4.5',
                  tone: 'teal',
                },
                {
                  latex:
                    'y_{\\mathrm{ROL}}(x) = \\frac{R}{R + 1} x + \\frac{x_D}{R + 1}',
                  equationNumber: '4.6',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'F,\\, D,\\, B',
                  description: 'Feed, distillate, and bottoms molar flow rates',
                  unitLatex: '\\mathrm{kmol/h}',
                },
                {
                  symbolLatex: 'z_F,\\, x_D,\\, x_B',
                  description: 'Feed, distillate, and bottoms mole fractions of component A',
                  unitLatex: '\\mathrm{mol/mol}',
                },
                {
                  symbolLatex: 'R = L/D',
                  description: 'External operating reflux ratio returned to top tray',
                  unitLatex: '\\mathrm{mol/mol}',
                },
              ],
            },
            {
              title: '03. Feed $q$-Line & Stripping Operating Line',
              subtitle: 'Transition across the feed stage under Constant Molar Overflow ($0 \\le q \\le 1$):',
              equations: [
                {
                  latex:
                    '\\bar{L} = L + qF, \\quad \\bar{V} = V - (1 - q)F',
                  equationNumber: '4.7',
                },
                {
                  latex:
                    'y_q(x) = \\frac{q}{q - 1} x - \\frac{z_F}{q - 1} \\quad (q \\ne 1)',
                  equationNumber: '4.8',
                  tone: 'teal',
                },
                {
                  latex:
                    'y_{\\mathrm{SOL}}(x) = \\frac{\\bar{L}}{\\bar{V}} x - \\frac{B}{\\bar{V}} x_B',
                  equationNumber: '4.9',
                  tone: 'muted',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'q',
                  description: 'Feed thermal quality (moles of saturated liquid formed on feed tray per mole of feed)',
                  unitLatex: '\\text{dimensionless}',
                },
                {
                  symbolLatex: 'L,\\, V,\\, \\bar{L},\\, \\bar{V}',
                  description: 'Rectifying and stripping internal liquid and vapor molar flow rates',
                  unitLatex: '\\mathrm{kmol/h}',
                },
              ],
            },
          ]}
        />

        {/* Step 4: Guided Engineering Inquiry (7 Questions) */}
        <LabGuidedInquiryCard<DistillationInputs>
          questions={DISTILLATION_GUIDED_EXPLORATION_QUESTIONS}
          onApplyInputs={handleApplyGuidedInputs}
          derivationHeading="McCabe–Thiele & Binary Distillation Derivation"
        />
      </div>
    </section>
  );
}
