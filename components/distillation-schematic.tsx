'use client';

import React from 'react';
import { DistillationInputs, DistillationResults } from '@/lib/distillation';

interface DistillationSchematicProps {
  inputs: DistillationInputs;
  results: DistillationResults;
}

export function DistillationSchematic({ inputs, results }: DistillationSchematicProps) {
  const { isValid, materialBalance, internalFlows, operatingLines, minimumReflux, stageCalculation } =
    results;

  const F = inputs.feedFlow_kmol_h;
  const zF = inputs.feedComposition_zF;
  const xD = inputs.distillateComposition_xD;
  const xB = inputs.bottomsComposition_xB;
  const R = inputs.refluxRatio_R;
  const alpha = inputs.relativeVolatility_alpha;
  const q = inputs.feedQuality_q;

  const D = isValid ? materialBalance.distillateFlow_kmol_h : 0;
  const B = isValid ? materialBalance.bottomsFlow_kmol_h : 0;
  const L = isValid ? internalFlows.rectifyingLiquid_L_kmol_h : 0;
  const V = isValid ? internalFlows.rectifyingVapor_V_kmol_h : 0;
  const Lbar = isValid ? internalFlows.strippingLiquid_Lbar_kmol_h : 0;
  const Vbar = isValid ? internalFlows.strippingVapor_Vbar_kmol_h : 0;

  const totalStages = stageCalculation.totalTheoreticalStages;
  const columnTrays = stageCalculation.columnTheoreticalTrays;
  const fracStages = stageCalculation.fractionalTheoreticalStages;
  const feedStage = stageCalculation.feedStageNumber;
  const rMin = minimumReflux.minimumRefluxRatio_Rmin;

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      data-testid="distillation-schematic"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Binary Fractional Distillation Column Schematic
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Continuous rectifying &amp; stripping sections · Total condenser (not an equilibrium stage) · Partial reboiler (1 equilibrium stage)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-700">
          <span>α = {alpha.toFixed(2)}</span>
          <span aria-hidden="true">·</span>
          <span>R = {R.toFixed(2)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-teal-800">
            {stageCalculation.converged && totalStages !== null
              ? `N = ${totalStages} stages (NF = ${feedStage})`
              : results.feasibilityStatus === 'below_minimum_reflux'
              ? 'Pinched (R ≤ Rmin)'
              : 'Unconverged'}
          </span>
        </div>
      </div>

      {/* Scope Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-700 leading-relaxed">
        <strong className="text-slate-900">Column Model Scope:</strong> Hypothetical binary mixture
        (Light Component A, Heavy Component B) under Constant Molar Overflow (CMO) and constant
        relative volatility α = {alpha.toFixed(2)}. Stage temperatures, column pressures, and tray
        hydraulics are not modeled in this McCabe–Thiele solver.
      </div>

      {/* SVG Process Flow Diagram */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 820 410"
          className="w-full h-auto min-w-[640px]"
          role="img"
          aria-label="Binary Distillation Column Schematic showing feed, rectifying section, stripping section, total condenser, reflux, distillate, partial reboiler, and bottoms"
        >
          <defs>
            <linearGradient id="columnGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CCFBF1" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
            <marker
              id="arrowTeal"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0F766E" />
            </marker>
            <marker
              id="arrowSlate"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
            </marker>
            <marker
              id="arrowBlue"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7" />
            </marker>
          </defs>

          {/* Subtle Blueprint Grid */}
          <rect x="0" y="0" width="820" height="410" fill="#F8FAFC" rx="10" />

          {/* ==================== FEED STREAM (LEFT) ==================== */}
          <rect
            x="22"
            y="144"
            width="195"
            height="108"
            rx="8"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <text x="34" y="164" className="text-[11px] font-bold fill-slate-900">
            FEED STREAM (F)
          </text>
          <text x="34" y="182" className="text-[11px] font-mono fill-teal-800 font-semibold">
            F = {F.toFixed(1)} kmol/h
          </text>
          <text x="34" y="198" className="text-[11px] font-mono fill-slate-800">
            zF = {zF.toFixed(3)} mol/mol A
          </text>
          <text x="34" y="214" className="text-[11px] font-mono fill-slate-700">
            q = {q.toFixed(2)} ({q === 1 ? 'Sat. Liquid' : q === 0 ? 'Sat. Vapor' : 'Two-Phase'})
          </text>
          <text x="34" y="234" className="text-[10px] font-mono fill-slate-600">
            {feedStage !== null
              ? `Enters at Optimal Stage NF = ${feedStage}`
              : 'Feed stage unresolved (pinched)'}
          </text>

          {/* Feed Pipe into Column */}
          <line
            x1="217"
            y1="198"
            x2="298"
            y2="198"
            stroke="#0F766E"
            strokeWidth="3"
            markerEnd="url(#arrowTeal)"
          />
          <text x="234" y="190" className="text-[10px] font-mono font-semibold fill-teal-800">
            Feed
          </text>

          {/* ==================== DISTILLATION COLUMN SHELL ==================== */}
          <rect
            x="302"
            y="46"
            width="136"
            height="312"
            rx="28"
            fill="url(#columnGradient)"
            stroke="#0F172A"
            strokeWidth="2.5"
          />

          {/* Section Titles inside Column */}
          <text
            x="370"
            y="74"
            textAnchor="middle"
            className="text-[10px] font-bold fill-teal-950 tracking-tight"
          >
            RECTIFYING SECTION
          </text>
          <text
            x="370"
            y="90"
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-700"
          >
            L = {L.toFixed(1)} · V = {V.toFixed(1)}
          </text>

          {/* Internal Sieve Tray Lines (Rectifying) */}
          <line
            x1="312"
            y1="110"
            x2="428"
            y2="110"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="312"
            y1="140"
            x2="428"
            y2="140"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="312"
            y1="170"
            x2="428"
            y2="170"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Highlighted Feed Stage Plate */}
          <rect
            x="306"
            y="188"
            width="128"
            height="22"
            rx="4"
            fill="#0F766E"
            fillOpacity="0.16"
            stroke="#0F766E"
            strokeWidth="1.5"
          />
          <text
            x="370"
            y="203"
            textAnchor="middle"
            className="text-[10px] font-mono font-bold fill-teal-950"
          >
            {feedStage !== null ? `FEED STAGE NF = ${feedStage}` : 'FEED ZONE'}
          </text>

          {/* Internal Sieve Tray Lines (Stripping) */}
          <line
            x1="312"
            y1="232"
            x2="428"
            y2="232"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="312"
            y1="262"
            x2="428"
            y2="262"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="312"
            y1="292"
            x2="428"
            y2="292"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          <text
            x="370"
            y="318"
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-900 tracking-tight"
          >
            STRIPPING SECTION
          </text>
          <text
            x="370"
            y="334"
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-700"
          >
            L̄ = {Lbar.toFixed(1)} · V̄ = {Vbar.toFixed(1)}
          </text>

          {/* Column Stage Summary Badge below Column */}
          <rect
            x="248"
            y="366"
            width="244"
            height="34"
            rx="6"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          <text
            x="370"
            y="381"
            textAnchor="middle"
            className="text-[10px] font-mono font-semibold fill-slate-900"
          >
            {totalStages !== null && columnTrays !== null && fracStages !== null
              ? `Total Stages N = ${totalStages} (${columnTrays} Trays + 1 Reboiler)`
              : 'Theoretical Stages: Unresolved / Pinched'}
          </text>
          <text
            x="370"
            y="394"
            textAnchor="middle"
            className="text-[10px] font-mono fill-teal-800"
          >
            {fracStages !== null
              ? `Exact Fractional Requirement = ${fracStages.toFixed(2)} stages`
              : rMin !== null
              ? `Minimum Reflux Rmin = ${rMin.toFixed(3)}`
              : 'Check composition bounds'}
          </text>

          {/* ==================== OVERHEAD VAPOR & TOTAL CONDENSER ==================== */}
          {/* Overhead Vapor Line from Top of Column */}
          <polyline
            points="370,46 370,24 532,24 532,48"
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            markerEnd="url(#arrowBlue)"
          />
          <text x="450" y="18" textAnchor="middle" className="text-[10px] font-mono fill-sky-800">
            Overhead Vapor V = {V.toFixed(1)} kmol/h
          </text>

          {/* Total Condenser Unit */}
          <rect
            x="484"
            y="52"
            width="98"
            height="48"
            rx="8"
            fill="#F0FDFA"
            stroke="#0F766E"
            strokeWidth="2"
          />
          <text
            x="533"
            y="73"
            textAnchor="middle"
            className="text-[10px] font-bold fill-teal-950"
          >
            TOTAL CONDENSER
          </text>
          <text
            x="533"
            y="88"
            textAnchor="middle"
            className="text-[9px] font-mono fill-teal-800"
          >
            0 Eq. Stages
          </text>

          {/* Reflux Stream returning to Column Top */}
          <polyline
            points="484,76 442,76"
            fill="none"
            stroke="#0F766E"
            strokeWidth="2.5"
            markerEnd="url(#arrowTeal)"
          />
          <text x="464" y="69" textAnchor="middle" className="text-[9px] font-mono fill-teal-900">
            L = {L.toFixed(1)}
          </text>

          {/* Distillate Product Stream */}
          <line
            x1="582"
            y1="76"
            x2="612"
            y2="76"
            stroke="#0F766E"
            strokeWidth="2.5"
            markerEnd="url(#arrowTeal)"
          />

          {/* Distillate Callout Card */}
          <rect
            x="616"
            y="34"
            width="184"
            height="104"
            rx="8"
            fill="#FFFFFF"
            stroke="#0F766E"
            strokeWidth="2"
          />
          <text x="628" y="54" className="text-[11px] font-bold fill-teal-950">
            DISTILLATE PRODUCT (D)
          </text>
          <text x="628" y="72" className="text-[12px] font-mono font-bold fill-teal-800">
            D = {D.toFixed(2)} kmol/h
          </text>
          <text x="628" y="89" className="text-[11px] font-mono font-semibold fill-slate-900">
            xD = {xD.toFixed(3)} mol/mol A
          </text>
          <text x="628" y="105" className="text-[10px] font-mono fill-slate-700">
            Reflux L/D = {R.toFixed(2)}
          </text>
          <text x="628" y="121" className="text-[10px] font-mono fill-slate-600">
            A Recovery: {materialBalance.lightRecoveryInDistillate_pct.toFixed(1)}%
          </text>

          {/* ==================== PARTIAL REBOILER & BOTTOMS (BOTTOM RIGHT) ==================== */}
          {/* Liquid from Column Base to Partial Reboiler */}
          <polyline
            points="438,334 484,334"
            fill="none"
            stroke="#334155"
            strokeWidth="2.5"
            markerEnd="url(#arrowSlate)"
          />

          {/* Partial Reboiler Unit */}
          <rect
            x="484"
            y="302"
            width="98"
            height="52"
            rx="8"
            fill="#FFFBEB"
            stroke="#B45309"
            strokeWidth="2"
          />
          <text
            x="533"
            y="323"
            textAnchor="middle"
            className="text-[10px] font-bold fill-amber-950"
          >
            PARTIAL REBOILER
          </text>
          <text
            x="533"
            y="339"
            textAnchor="middle"
            className="text-[9px] font-mono fill-amber-900"
          >
            Stage N (1 Eq. Stage)
          </text>

          {/* Boilup Vapor Returning from Reboiler to Column */}
          <polyline
            points="533,302 533,276 442,276"
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            markerEnd="url(#arrowBlue)"
          />
          <text x="488" y="269" textAnchor="middle" className="text-[9px] font-mono fill-sky-900">
            Boilup V̄ = {Vbar.toFixed(1)}
          </text>

          {/* Bottoms Product Stream */}
          <line
            x1="582"
            y1="328"
            x2="612"
            y2="328"
            stroke="#334155"
            strokeWidth="2.5"
            markerEnd="url(#arrowSlate)"
          />

          {/* Bottoms Callout Card */}
          <rect
            x="616"
            y="278"
            width="184"
            height="104"
            rx="8"
            fill="#FFFFFF"
            stroke="#334155"
            strokeWidth="2"
          />
          <text x="628" y="298" className="text-[11px] font-bold fill-slate-900">
            BOTTOMS PRODUCT (B)
          </text>
          <text x="628" y="316" className="text-[12px] font-mono font-bold fill-slate-900">
            B = {B.toFixed(2)} kmol/h
          </text>
          <text x="628" y="333" className="text-[11px] font-mono font-semibold fill-slate-800">
            xB = {xB.toFixed(3)} mol/mol A
          </text>
          <text x="628" y="349" className="text-[10px] font-mono fill-slate-700">
            Boilup V̄/B = {internalFlows.boilupRatio_Vb.toFixed(2)}
          </text>
          <text x="628" y="365" className="text-[10px] font-mono fill-slate-600">
            Heavy (1−xB) = {(1 - xB).toFixed(3)}
          </text>

          {/* Operating & Minimum Reflux Summary Box (Middle Right) */}
          <rect
            x="616"
            y="158"
            width="184"
            height="98"
            rx="8"
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <text x="628" y="177" className="text-[10px] font-bold fill-slate-800">
            OPERATING ENVELOPE
          </text>
          <text x="628" y="194" className="text-[11px] font-mono fill-slate-800">
            Rmin = {rMin !== null ? rMin.toFixed(3) : '—'}
          </text>
          <text x="628" y="210" className="text-[11px] font-mono fill-teal-800 font-semibold">
            R / Rmin ={' '}
            {minimumReflux.operatingToMinRefluxRatio !== null
              ? `${minimumReflux.operatingToMinRefluxRatio.toFixed(2)}×`
              : '—'}
          </text>
          <text x="628" y="226" className="text-[10px] font-mono fill-slate-700">
            Fenske Nmin ={' '}
            {minimumReflux.fenskeMinimumStages_Nmin !== null
              ? minimumReflux.fenskeMinimumStages_Nmin.toFixed(2)
              : '—'}
          </text>
          <text x="628" y="242" className="text-[10px] font-mono fill-slate-600">
            x_int = {operatingLines.intersection_x.toFixed(3)}, y_int ={' '}
            {operatingLines.intersection_y.toFixed(3)}
          </text>
        </svg>
      </div>
    </div>
  );
}
