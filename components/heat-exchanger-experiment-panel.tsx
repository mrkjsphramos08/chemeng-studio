'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Target,
  XCircle,
  Info,
} from 'lucide-react';
import { HeatExchangerInputs, HeatExchangerResults } from '@/lib/heat-exchanger';
import {
  HeatExchangerTargetEvaluation,
  HeatExchangerTargetSpec,
  HeatExchangerTargetVariable,
  NOMINAL_MAX_AREA_M2,
} from '@/lib/heat-exchanger-experiment';
import { MathInline, NumericDraftInput } from '@/components/lab-shared';

interface HeatExchangerExperimentPanelProps {
  inputs: HeatExchangerInputs;
  results: HeatExchangerResults;
  targetSpec: HeatExchangerTargetSpec;
  evaluation: HeatExchangerTargetEvaluation;
  onChangeTargetVariable: (variable: HeatExchangerTargetVariable) => void;
  onChangeTargetTemp: (nextTemp_C: number) => void;
}

export function HeatExchangerExperimentPanel({
  inputs,
  results,
  targetSpec,
  evaluation,
  onChangeTargetVariable,
  onChangeTargetTemp,
}: HeatExchangerExperimentPanelProps) {
  const isCold = targetSpec.variable === 'Tc_out';

  const statusStyles = (() => {
    switch (evaluation.status) {
      case 'achieved':
        return {
          badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />,
          borderAccent: 'border-emerald-200',
        };
      case 'not_achieved':
        return {
          badge: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />,
          borderAccent: 'border-amber-200',
        };
      case 'unreachable':
        return {
          badge: 'bg-rose-50 text-rose-900 border-rose-300',
          icon: <XCircle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />,
          borderAccent: 'border-rose-200',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <Info className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />,
          borderAccent: 'border-slate-200',
        };
    }
  })();

  const formattedDiff = (() => {
    if (!results.isValid) return '—';
    const sign = evaluation.difference_C >= 0 ? '+' : '−';
    return `${sign}${Math.abs(evaluation.difference_C).toFixed(2)} °C`;
  })();

  const diffSubtext = (() => {
    if (!results.isValid) return 'Resolve invalid inputs';
    if (evaluation.status === 'unreachable') {
      return isCold
        ? `Exceeds max ${evaluation.thermodynamicLimit_C.toFixed(1)} °C`
        : `Below min ${evaluation.thermodynamicLimit_C.toFixed(1)} °C`;
    }
    if (evaluation.status === 'achieved') {
      return evaluation.margin_C >= 0
        ? `Meets spec (±${evaluation.tolerance_C.toFixed(1)} °C tol.)`
        : `Within ±${evaluation.tolerance_C.toFixed(1)} °C tolerance`;
    }
    return `Short by ${Math.abs(evaluation.margin_C).toFixed(2)} °C (±${evaluation.tolerance_C.toFixed(1)} °C tol.)`;
  })();

  const requiredAreaDisplay = (() => {
    if (!results.isValid) return { primary: '—', secondary: 'Invalid inputs' };
    if (evaluation.requiredArea_m2 === null) {
      return {
        primary: 'Unreachable',
        secondary:
          evaluation.unreachableReason === 'zero_conductance'
            ? 'Requires U > 0 W/(m²·K)'
            : 'Infinite area / Cmin capped',
      };
    }
    const req = evaluation.requiredArea_m2;
    const delta = evaluation.areaDelta_m2 ?? 0;
    const deltaText =
      Math.abs(delta) < 0.05
        ? 'Matches active area'
        : delta > 0
          ? `+${delta.toFixed(2)} m² needed`
          : `${Math.abs(delta).toFixed(2)} m² surplus`;

    return {
      primary:
        req > NOMINAL_MAX_AREA_M2
          ? `${req.toFixed(1)} m² (>50 m²)`
          : `${req.toFixed(2)} m²`,
      secondary: `${deltaText} (at fixed U, ṁ)`,
    };
  })();

  return (
    <div
      className={`bg-white border ${statusStyles.borderAccent} rounded-xl p-3.5 sm:p-4 space-y-3`}
      data-testid="hx-experiment-panel"
    >
      {/* Top Row: Objective Statement + Variable Selector + Live Evaluation Status */}
      <div className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Engineering Experiment Objective
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            {isCold ? (
              <>
                Determine whether this exchanger can heat the cold stream to{' '}
                <strong className="text-slate-900 font-mono tabular-nums">
                  <MathInline latex="T_{c,\mathrm{out}}" /> ≥ {targetSpec.targetTemp_C.toFixed(1)} °C
                </strong>{' '}
                and evaluate the area, flow, and duty trade-offs.
              </>
            ) : (
              <>
                Determine whether this exchanger can cool the hot stream to{' '}
                <strong className="text-slate-900 font-mono tabular-nums">
                  <MathInline latex="T_{h,\mathrm{out}}" /> ≤ {targetSpec.targetTemp_C.toFixed(1)} °C
                </strong>{' '}
                and evaluate the area, flow, and duty trade-offs.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Objective Mode Switch */}
          <div
            className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200"
            role="group"
            aria-label="Select target outlet temperature variable"
          >
            <button
              type="button"
              onClick={() => onChangeTargetVariable('Tc_out')}
              aria-pressed={isCold}
              data-testid="hx-target-mode-cold"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                isCold
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cold Outlet (Tc,out)
            </button>
            <button
              type="button"
              onClick={() => onChangeTargetVariable('Th_out')}
              aria-pressed={!isCold}
              data-testid="hx-target-mode-hot"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                !isCold
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hot Outlet (Th,out)
            </button>
          </div>

          {/* Live Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-md whitespace-nowrap ${statusStyles.badge}`}
            data-testid="hx-target-status"
            role="status"
            aria-live="polite"
          >
            {statusStyles.icon}
            {evaluation.statusLabel}
          </span>
        </div>
      </div>

      {/* Middle Row: Compact 4-Cell Quantitative Evaluation Strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        {/* Target Input */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <label
            htmlFor="hx-target-temp"
            className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1"
          >
            {isCold ? 'Target Tc,out (°C)' : 'Target Th,out (°C)'}
          </label>
          <div className="flex items-center gap-1.5">
            <NumericDraftInput
              id="hx-target-temp"
              value={targetSpec.targetTemp_C}
              onCommit={(val) => onChangeTargetTemp(val)}
              min={-50}
              max={300}
              step={0.5}
              aria-label={
                isCold
                  ? 'Target cold outlet temperature in degrees Celsius'
                  : 'Target hot outlet temperature in degrees Celsius'
              }
              data-testid="hx-target-temp-input"
              className="w-20 sm:w-24 px-2 py-1 text-sm font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded-md tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <span className="text-xs font-mono text-slate-600">°C</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-mono tabular-nums">
            {results.isValid
              ? isCold
                ? `Limit < ${evaluation.thermodynamicLimit_C.toFixed(1)} °C`
                : `Limit > ${evaluation.thermodynamicLimit_C.toFixed(1)} °C`
              : 'Fix inputs for limit'}
          </p>
        </div>

        {/* Calculated Output */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
            Calculated {isCold ? 'Tc,out' : 'Th,out'}
          </div>
          <div
            className={`text-base sm:text-lg font-mono font-bold tabular-nums ${
              isCold ? 'text-sky-800' : 'text-rose-700'
            }`}
            data-testid="hx-target-calculated"
          >
            {results.isValid ? `${evaluation.calculatedTemp_C.toFixed(2)} °C` : '—'}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono tabular-nums">
            A = {inputs.A.toFixed(1)} m² · ε ={' '}
            {results.isValid ? `${results.effectiveness_pct.toFixed(1)}%` : '—'}
          </p>
        </div>

        {/* Difference from Target */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
            Difference (Calc − Target)
          </div>
          <div
            className={`text-base sm:text-lg font-mono font-bold tabular-nums ${
              evaluation.status === 'achieved'
                ? 'text-emerald-800'
                : evaluation.status === 'unreachable'
                  ? 'text-rose-800'
                  : 'text-amber-800'
            }`}
            data-testid="hx-target-diff"
          >
            {formattedDiff}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">{diffSubtext}</p>
        </div>

        {/* Required Area */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
            Required Area (<MathInline latex="A_{\mathrm{req}}" />)
          </div>
          <div
            className="text-base sm:text-lg font-mono font-bold text-slate-900 tabular-nums"
            data-testid="hx-target-required-area"
          >
            {requiredAreaDisplay.primary}
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono tabular-nums">
            {requiredAreaDisplay.secondary}
          </p>
        </div>
      </div>

      {/* Bottom Row: Solver-Derived Engineering Interpretation */}
      <div
        className="bg-slate-50/80 border border-slate-200/80 rounded-lg px-3 py-2 space-y-1"
        data-testid="hx-engineering-interpretation"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            Engineering Interpretation
          </span>
          <span className="text-[11px] text-slate-500">
            Scope: 1D steady-state constant-Cp single-phase countercurrent model (no pressure drop, fouling, or boiling)
          </span>
        </div>
        <ul className="space-y-0.5 text-xs text-slate-700 list-disc pl-4">
          {evaluation.interpretations.map((line, idx) => (
            <li key={idx} className="leading-snug">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
