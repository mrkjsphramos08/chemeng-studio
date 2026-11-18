'use client';

import React from 'react';
import { HeatExchangerInputs, HeatExchangerResults } from '@/lib/heat-exchanger';
import { GUIDED_EXPLORATION_QUESTIONS } from '@/lib/labs-data';
import {
  LabAssumptionsCard,
  LabGuidedInquiryCard,
  LabTheoryDisclosureCard,
} from '@/components/lab-shared';

interface LearningPanelProps {
  inputs: HeatExchangerInputs;
  results: HeatExchangerResults;
  onApplyInputs: (inputs: HeatExchangerInputs) => void;
}

const HEAT_EXCHANGER_ASSUMPTIONS = [
  { label: '1. Steady-state operation', detail: '∂T/∂t = 0, constant mass flows' },
  { label: '2. Ideal countercurrent flow', detail: 'Pure 1D; no cross-flow F_T penalty' },
  { label: '3. Single-phase fluids', detail: 'Liquid or gas only throughout' },
  { label: '4. Constant specific heats', detail: 'Cp,h and Cp,c independent of T' },
  { label: '5. Constant overall U', detail: 'Uniform conductance over area A' },
  { label: '6. No ambient heat losses', detail: 'Adiabatic outer wall (Q_h = Q_c)' },
  { label: '7. Negligible axial conduction', detail: 'Advection dominates (Pe ≫ 1)' },
  { label: '8. No pressure-drop model', detail: 'ΔP and pumping power omitted' },
  { label: '9. No phase-change model', detail: 'No boiling/condensation latent heat' },
];

export function LearningPanel({ results, onApplyInputs }: LearningPanelProps) {
  return (
    <div className="space-y-8" data-testid="learning-panel">
      {/* Section 1: Dynamic Live Engineering Interpretation & Complete Assumptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Live Diagnostic Interpretation */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-teal-800 mb-1">
              Step 3 · Analyze — Live Engineering Interpretation
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">
              Physical Analysis of Current Operating State
            </h3>

            {results.isValid ? (
              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <p>
                  Under current conditions, the{' '}
                  <strong className="text-slate-900">{results.limitingStream}</strong> sets the
                  minimum heat capacity rate (
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    Cmin = {results.Cmin_kW_K.toFixed(2)} kW/K
                  </span>
                  ), so it undergoes the larger temperature change (
                  <span className="font-mono text-xs">
                    {results.Ch_W_K < results.Cc_W_K
                      ? `ΔTh = ${results.deltaTh.toFixed(1)} °C vs. ΔTc = ${results.deltaTc.toFixed(1)} °C`
                      : `ΔTc = ${results.deltaTc.toFixed(1)} °C vs. ΔTh = ${results.deltaTh.toFixed(1)} °C`}
                  </span>
                  ) and bounds the maximum possible duty (
                  <span className="font-mono text-xs">
                    Qmax = {results.Qmax_kW.toFixed(1)} kW
                  </span>
                  ).
                </p>
                <p>
                  At{' '}
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    NTU = {results.NTU.toFixed(2)}
                  </span>{' '}
                  and capacity ratio{' '}
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    Cr = {results.Cr.toFixed(3)}
                  </span>
                  , ideal countercurrent flow achieves{' '}
                  <strong className="font-mono text-teal-800">
                    ε = {results.effectiveness_pct.toFixed(1)}%
                  </strong>
                  , transferring{' '}
                  <strong className="font-mono text-slate-900">
                    Q = {results.Q_kW.toFixed(1)} kW
                  </strong>{' '}
                  with an LMTD of{' '}
                  <span className="font-mono text-xs">{results.LMTD.toFixed(2)} °C</span>.
                </p>

                {results.Tc_out > results.Th_out ? (
                  <div className="text-teal-950 bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs leading-relaxed">
                    <strong>Temperature Cross Observed (Tc,out &gt; Th,out):</strong> Cold outlet (
                    <span className="font-mono">{results.Tc_out.toFixed(1)} °C</span>) exceeds hot
                    outlet (<span className="font-mono">{results.Th_out.toFixed(1)} °C</span>) by{' '}
                    <span className="font-mono">
                      {(results.Tc_out - results.Th_out).toFixed(1)} °C
                    </span>
                    . This is physically valid in countercurrent flow because Th(x) &gt; Tc(x) holds at
                    every axial position.
                  </div>
                ) : (
                  <div className="text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs leading-relaxed">
                    <strong>No Temperature Cross:</strong> Hot outlet (
                    <span className="font-mono">{results.Th_out.toFixed(1)} °C</span>) exits warmer
                    than cold outlet (<span className="font-mono">{results.Tc_out.toFixed(1)} °C</span>
                    ). Increasing area A or coefficient U raises NTU and drives the streams closer to a
                    temperature cross.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-rose-800 font-medium">
                Simulation paused: resolve the physical input validation errors above to compute
                outlet temperatures and energy balances.
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums">
            <span>
              Energy Balance Residual |Q_hot − Q_cold| ={' '}
              {results.energyBalanceResidual_W.toExponential(2)} W
            </span>
            <span>First Law Verified (Adiabatic Steady-State)</span>
          </div>
        </div>

        {/* Complete 9 Engineering Model Assumptions */}
        <div className="lg:col-span-5">
          <LabAssumptionsCard
            eyebrow="Model Scope & Limitations · Ideal Countercurrent ε–NTU"
            title="Documented Engineering Assumptions"
            assumptions={HEAT_EXCHANGER_ASSUMPTIONS}
          />
        </div>
      </div>

      {/* Section 2: Essential Variable Guide + Progressive Disclosure for Derivations */}
      <LabTheoryDisclosureCard
        eyebrow="Conceptual Reference · Core Variables & Physical Meaning"
        title="Understanding the Effectiveness–NTU (ε–NTU) Method"
        subtitle="When only inlet temperatures and exchanger size (UA) are given, the ε–NTU method solves for outlet temperatures directly without trial-and-error iteration."
        expandLabel="Expand Detailed Equations & Limiting Cases"
        collapseLabel="Hide Detailed Equations & Limiting Cases"
        concepts={[
          {
            title: 'Heat Capacity Rates (Ch, Cc, Cr)',
            body: (
              <>
                <span className="font-mono text-slate-800">C = m · Cp</span> measures energy required
                per kelvin of stream temperature change.{' '}
                <span className="font-mono">Cr = Cmin/Cmax</span> ranges from 0 (e.g.,
                constant-temperature phase change) to 1 (balanced streams).
              </>
            ),
          },
          {
            title: 'Transfer Units (NTU) & Effectiveness (ε)',
            body: (
              <>
                <span className="font-mono text-slate-800">NTU = UA / Cmin</span> measures
                dimensionless thermal size. Effectiveness <span className="font-mono">ε = Q / Qmax</span>{' '}
                is the fraction of thermodynamically maximum heat actually transferred.
              </>
            ),
          },
          {
            title: 'Diminishing Returns of Area (A)',
            body: (
              <>
                Adding area raises NTU, but as fluid temperatures converge along the exchanger, the
                local driving force ΔT shrinks—causing Q to level off asymptotically toward Qmax.
              </>
            ),
          },
          {
            title: 'Approach ΔT & Temperature Cross',
            body: (
              <>
                Terminal approaches <span className="font-mono">ΔT1 = Th,in − Tc,out</span> and{' '}
                <span className="font-mono">ΔT2 = Th,out − Tc,in</span> govern LMTD. Countercurrent
                flow permits <span className="font-mono">Tc,out &gt; Th,out</span> while preserving{' '}
                <span className="font-mono">Th(x) &gt; Tc(x)</span> locally.
              </>
            ),
          },
        ]}
        detailedBlocks={[
          {
            title: '01. Capacity Rates & Maximum Duty',
            subtitle:
              'Convert specific heat from kJ/(kg·K) to J/(kg·K) internally for strict SI consistency:',
            equations: [
              { text: 'Ch = mh · Cp,h [W/K]' },
              { text: 'Cc = mc · Cp,c [W/K]' },
              { text: 'Cmin = min(Ch, Cc), Cmax = max(Ch, Cc)' },
              { text: 'Cr = Cmin / Cmax ∈ [0, 1]' },
              { text: 'Qmax = Cmin · (Th,in − Tc,in) [W]' },
            ],
          },
          {
            title: '02. Ideal Countercurrent ε–NTU Relations',
            subtitle:
              'Analytical solution of steady-state 1D enthalpy balances along normalized position ξ = x/L ∈ [0, 1]:',
            equations: [
              { text: 'NTU = (U · A) / Cmin' },
              {
                text: 'Cr < 1: ε = [1 − exp(−NTU(1 − Cr))] / [1 − Cr·exp(−NTU(1 − Cr))]',
                tone: 'teal',
              },
              { text: 'Cr = 1: ε = NTU / (1 + NTU)', tone: 'muted' },
              { text: 'Limiting case Cr → 0: ε = 1 − exp(−NTU)', tone: 'muted' },
            ],
          },
          {
            title: '03. Terminal Outlets & Axial Profiles',
            subtitle:
              'First Law energy conservation guarantees Q_hot = Q_cold = Q and matches Q = U·A·LMTD:',
            equations: [
              { text: 'Q = ε · Qmax' },
              { text: 'Th,out = Th,in − Q / Ch' },
              { text: 'Tc,out = Tc,in + Q / Cc' },
              { text: 'LMTD = (ΔT1 − ΔT2) / ln(ΔT1 / ΔT2)' },
            ],
          },
        ]}
      />

      {/* Section 3: Step 4 — Reflect (Interactive Guided Inquiry) */}
      <LabGuidedInquiryCard<HeatExchangerInputs>
        questions={GUIDED_EXPLORATION_QUESTIONS}
        onApplyInputs={onApplyInputs}
        derivationHeading="Thermodynamic & Transport Derivation"
      />
    </div>
  );
}
