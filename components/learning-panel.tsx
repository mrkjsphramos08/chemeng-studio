'use client';

import React from 'react';
import { HeatExchangerInputs, HeatExchangerResults } from '@/lib/heat-exchanger';
import { GUIDED_EXPLORATION_QUESTIONS } from '@/lib/labs-data';
import {
  LabAssumptionsCard,
  LabGuidedInquiryCard,
  LabTheoryDisclosureCard,
  MathInline,
} from '@/components/lab-shared';

interface LearningPanelProps {
  inputs: HeatExchangerInputs;
  results: HeatExchangerResults;
  onApplyInputs: (inputs: HeatExchangerInputs) => void;
}

const HEAT_EXCHANGER_ASSUMPTIONS = [
  { label: '1. Steady-state operation', detail: '$\\partial T/\\partial t = 0$, constant mass flows' },
  { label: '2. Ideal countercurrent flow', detail: 'Pure 1D; no cross-flow $F_T$ penalty' },
  { label: '3. Single-phase fluids', detail: 'Liquid or gas only throughout' },
  { label: '4. Constant specific heats', detail: '$C_{p,h}$ and $C_{p,c}$ independent of $T$' },
  { label: '5. Constant overall $U$', detail: 'Uniform conductance over area $A$' },
  { label: '6. No ambient heat losses', detail: 'Adiabatic outer wall ($Q_h = Q_c$)' },
  { label: '7. Negligible axial conduction', detail: 'Advection dominates ($\\mathrm{Pe} \\gg 1$)' },
  { label: '8. No pressure-drop model', detail: '$\\Delta P$ and pumping power omitted' },
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
                    <MathInline latex="C_{\min}" /> = {results.Cmin_kW_K.toFixed(2)} kW/K
                  </span>
                  ), so it undergoes the larger temperature change (
                  <span className="font-mono text-xs">
                    {results.Ch_W_K < results.Cc_W_K
                      ? `ΔTh = ${results.deltaTh.toFixed(1)} °C vs. ΔTc = ${results.deltaTc.toFixed(1)} °C`
                      : `ΔTc = ${results.deltaTc.toFixed(1)} °C vs. ΔTh = ${results.deltaTh.toFixed(1)} °C`}
                  </span>
                  ) and bounds the maximum possible duty (
                  <span className="font-mono text-xs">
                    <MathInline latex="Q_{\max}" /> = {results.Qmax_kW.toFixed(1)} kW
                  </span>
                  ).
                </p>
                <p>
                  At{' '}
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    <MathInline latex="\mathrm{NTU}" /> = {results.NTU.toFixed(2)}
                  </span>{' '}
                  and capacity ratio{' '}
                  <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                    <MathInline latex="C_r" /> = {results.Cr.toFixed(3)}
                  </span>
                  , ideal countercurrent flow achieves{' '}
                  <strong className="font-mono text-teal-800">
                    <MathInline latex="\varepsilon" /> = {results.effectiveness_pct.toFixed(1)}%
                  </strong>
                  , transferring{' '}
                  <strong className="font-mono text-slate-900">
                    <MathInline latex="Q" /> = {results.Q_kW.toFixed(1)} kW
                  </strong>{' '}
                  with an <MathInline latex="\mathrm{LMTD}" /> of{' '}
                  <span className="font-mono text-xs">{results.LMTD.toFixed(2)} °C</span>.
                </p>

                {results.Tc_out > results.Th_out ? (
                  <div className="text-teal-950 bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs leading-relaxed">
                    <strong>
                      Temperature Cross Observed (<MathInline latex="T_{c,\mathrm{out}} > T_{h,\mathrm{out}}" />
                      ):
                    </strong>{' '}
                    Cold outlet (
                    <span className="font-mono">{results.Tc_out.toFixed(1)} °C</span>) exceeds hot
                    outlet (<span className="font-mono">{results.Th_out.toFixed(1)} °C</span>) by{' '}
                    <span className="font-mono">
                      {(results.Tc_out - results.Th_out).toFixed(1)} °C
                    </span>
                    . This is physically valid in countercurrent flow because{' '}
                    <MathInline latex="T_h(x) > T_c(x)" /> holds at every axial position.
                  </div>
                ) : (
                  <div className="text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs leading-relaxed">
                    <strong>No Temperature Cross:</strong> Hot outlet (
                    <span className="font-mono">{results.Th_out.toFixed(1)} °C</span>) exits warmer
                    than cold outlet (<span className="font-mono">{results.Tc_out.toFixed(1)} °C</span>
                    ). Increasing area <MathInline latex="A" /> or coefficient{' '}
                    <MathInline latex="U" /> raises <MathInline latex="\mathrm{NTU}" /> and drives
                    the streams closer to a temperature cross.
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
              Energy Balance Residual <MathInline latex="|Q_h - Q_c|" /> ={' '}
              <span className="whitespace-nowrap">
                {results.energyBalanceResidual_W.toExponential(2)} W
              </span>
            </span>
            <span>First Law Verified (Adiabatic Steady-State)</span>
          </div>
        </div>

        {/* Complete 9 Engineering Model Assumptions */}
        <div className="lg:col-span-5">
          <LabAssumptionsCard
            eyebrow="Model Scope & Limitations · Ideal Countercurrent $\varepsilon\text{–}\mathrm{NTU}$"
            title="Documented Engineering Assumptions"
            assumptions={HEAT_EXCHANGER_ASSUMPTIONS}
          />
        </div>
      </div>

      {/* Section 2: Essential Variable Guide + Progressive Disclosure for Derivations */}
      <LabTheoryDisclosureCard
        eyebrow="Conceptual Reference · Core Variables & Physical Meaning"
        title="Understanding the Effectiveness–NTU ($\varepsilon\text{–}\mathrm{NTU}$) Method"
        subtitle="When only inlet temperatures and exchanger size ($UA$) are given, the $\varepsilon\text{–}\mathrm{NTU}$ method solves for outlet temperatures directly without trial-and-error iteration."
        expandLabel="Expand Detailed Equations & Limiting Cases"
        collapseLabel="Hide Detailed Equations & Limiting Cases"
        concepts={[
          {
            title: 'Heat Capacity Rates ($C_h, C_c, C_r$)',
            body: (
              <>
                <MathInline latex="C = \dot{m} C_p" /> measures energy required per kelvin of
                stream temperature change. <MathInline latex="C_r = C_{\min}/C_{\max}" /> ranges
                from <MathInline latex="0" /> (constant-temperature phase change) to{' '}
                <MathInline latex="1" /> (balanced streams).
              </>
            ),
          },
          {
            title: 'Transfer Units ($\\mathrm{NTU}$) & Effectiveness ($\\varepsilon$)',
            body: (
              <>
                <MathInline latex="\mathrm{NTU} = UA / C_{\min}" /> measures dimensionless thermal
                size. Effectiveness <MathInline latex="\varepsilon = Q / Q_{\max}" /> is the
                fraction of thermodynamically maximum heat actually transferred.
              </>
            ),
          },
          {
            title: 'Diminishing Returns of Area ($A$)',
            body: (
              <>
                Adding area raises <MathInline latex="\mathrm{NTU}" />, but as fluid temperatures
                converge along the exchanger, the local driving force <MathInline latex="\Delta T" />{' '}
                shrinks—causing <MathInline latex="Q" /> to level off asymptotically toward{' '}
                <MathInline latex="Q_{\max}" />.
              </>
            ),
          },
          {
            title: 'Approach $\\Delta T$ & Temperature Cross',
            body: (
              <>
                Terminal approaches <MathInline latex="\Delta T_1 = T_{h,\mathrm{in}} - T_{c,\mathrm{out}}" />{' '}
                and <MathInline latex="\Delta T_2 = T_{h,\mathrm{out}} - T_{c,\mathrm{in}}" /> govern{' '}
                <MathInline latex="\mathrm{LMTD}" />. Countercurrent flow permits{' '}
                <MathInline latex="T_{c,\mathrm{out}} > T_{h,\mathrm{out}}" /> while preserving{' '}
                <MathInline latex="T_h(x) > T_c(x)" /> locally.
              </>
            ),
          },
        ]}
        detailedBlocks={[
          {
            title: '01. Capacity Rates & Maximum Duty',
            subtitle:
              'Convert specific heat from $\\mathrm{kJ/(kg\\cdot K)}$ to $\\mathrm{J/(kg\\cdot K)}$ internally for strict SI consistency:',
            equations: [
              {
                label: 'Stream Heat Capacity Rates',
                latex: 'C_h = \\dot{m}_h C_{p,h}, \\quad C_c = \\dot{m}_c C_{p,c}',
                equationNumber: '1',
              },
              {
                label: 'Minimum & Maximum Capacity Rate Ratio',
                latex: 'C_{\\min} = \\min(C_h, C_c), \\quad C_r = \\frac{C_{\\min}}{C_{\\max}} \\in [0, 1]',
                equationNumber: '2',
              },
              {
                label: 'Thermodynamic Maximum Heat Transfer Rate',
                latex: 'Q_{\\max} = C_{\\min}\\left(T_{h,\\mathrm{in}} - T_{c,\\mathrm{in}}\\right)',
                equationNumber: '3',
                tone: 'teal',
              },
            ],
            definitions: [
              {
                symbolLatex: '\\dot{m}_h, \\dot{m}_c',
                description: 'Hot and cold mass flow rates',
                unitLatex: '\\mathrm{kg/s}',
              },
              {
                symbolLatex: 'C_{p,h}, C_{p,c}',
                description: 'Isobaric specific heat capacities',
                unitLatex: '\\mathrm{J/(kg\\cdot K)}',
              },
              {
                symbolLatex: 'C_{\\min}, C_{\\max}',
                description: 'Smaller and larger stream capacity rates',
                unitLatex: '\\mathrm{W/K}',
              },
              {
                symbolLatex: 'C_r',
                description: 'Dimensionless heat capacity ratio',
                unit: '—',
              },
            ],
          },
          {
            title: '02. Ideal Countercurrent $\\varepsilon\\text{–}\\mathrm{NTU}$ Relations',
            subtitle:
              'Analytical solution of steady-state 1D enthalpy balances along normalized position $\\xi = x/L \\in [0, 1]$:',
            equations: [
              {
                label: 'Number of Transfer Units',
                latex: '\\mathrm{NTU} = \\frac{UA}{C_{\\min}}',
                equationNumber: '4',
              },
              {
                label: 'Countercurrent Effectiveness (Unbalanced, $C_r < 1$)',
                latex: '\\varepsilon = \\frac{1 - \\exp\\!\\left[-\\mathrm{NTU}(1 - C_r)\\right]}{1 - C_r \\exp\\!\\left[-\\mathrm{NTU}(1 - C_r)\\right]}',
                equationNumber: '5',
                tone: 'teal',
              },
              {
                label: 'Balanced & Phase-Change Limiting Cases',
                latex: '\\varepsilon\\big|_{C_r = 1} = \\frac{\\mathrm{NTU}}{1 + \\mathrm{NTU}}, \\quad \\varepsilon\\big|_{C_r \\to 0} = 1 - e^{-\\mathrm{NTU}}',
                equationNumber: '6',
              },
            ],
            definitions: [
              {
                symbolLatex: 'U',
                description: 'Overall heat transfer coefficient',
                unitLatex: '\\mathrm{W/(m^2\\cdot K)}',
              },
              {
                symbolLatex: 'A',
                description: 'Heat transfer surface area',
                unitLatex: '\\mathrm{m^2}',
              },
              {
                symbolLatex: '\\mathrm{NTU}',
                description: 'Number of Transfer Units',
                unit: '—',
              },
              {
                symbolLatex: '\\varepsilon',
                description: 'Thermal effectiveness ($Q/Q_{\\max}$)',
                unit: '—',
              },
            ],
          },
          {
            title: '03. Terminal Outlets & Log-Mean $\\Delta T$',
            subtitle:
              'First Law energy conservation guarantees $Q_h = Q_c = Q$ and matches $Q = UA\\,\\mathrm{LMTD}$:',
            equations: [
              {
                label: 'Actual Heat Transfer Rate',
                latex: 'Q = \\varepsilon Q_{\\max} = \\varepsilon C_{\\min}\\left(T_{h,\\mathrm{in}} - T_{c,\\mathrm{in}}\\right)',
                equationNumber: '7',
                tone: 'teal',
              },
              {
                label: 'Terminal Stream Outlet Temperatures',
                latex: 'T_{h,\\mathrm{out}} = T_{h,\\mathrm{in}} - \\frac{Q}{C_h}, \\quad T_{c,\\mathrm{out}} = T_{c,\\mathrm{in}} + \\frac{Q}{C_c}',
                equationNumber: '8',
              },
              {
                label: 'Log-Mean Temperature Difference',
                latex: '\\mathrm{LMTD} = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1 / \\Delta T_2)}',
                equationNumber: '9',
              },
            ],
            definitions: [
              {
                symbolLatex: 'Q',
                description: 'Actual heat transfer duty',
                unitLatex: '\\mathrm{W}',
              },
              {
                symbolLatex: '\\Delta T_1',
                description: 'Hot-end approach ($T_{h,\\mathrm{in}} - T_{c,\\mathrm{out}}$)',
                unitLatex: '^\\circ\\mathrm{C}',
              },
              {
                symbolLatex: '\\Delta T_2',
                description: 'Cold-end approach ($T_{h,\\mathrm{out}} - T_{c,\\mathrm{in}}$)',
                unitLatex: '^\\circ\\mathrm{C}',
              },
              {
                symbolLatex: '\\mathrm{LMTD}',
                description: 'Log-mean temperature difference',
                unitLatex: '^\\circ\\mathrm{C}',
              },
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
