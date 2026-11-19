'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DistillationInputs, DistillationResults } from '@/lib/distillation';
import { formatDistillationMobileLabels } from '@/lib/schematic-formatting';

interface DistillationSchematicProps {
  inputs: DistillationInputs;
  results: DistillationResults;
}

export function DistillationSchematic({ inputs, results }: DistillationSchematicProps) {
  const [showDesktopOnMobile, setShowDesktopOnMobile] = useState(false);
  const { isValid, materialBalance, internalFlows, operatingLines, minimumReflux, stageCalculation } =
    results;
  const labels = formatDistillationMobileLabels(inputs, results);

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
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4"
      data-testid="distillation-schematic"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900">
            Binary Fractional Distillation Column Schematic
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Continuous rectifying &amp; stripping sections · Total condenser (not an equilibrium stage) · Partial reboiler (1 equilibrium stage)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums text-slate-700">
          <span>α = {alpha.toFixed(2)}</span>
          <span aria-hidden="true">·</span>
          <span>R = {R.toFixed(2)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-teal-800">
            {stageCalculation.converged && totalStages !== null
              ? `N = ${totalStages} stages (NF = ${feedStage})`
              : labels.isPinched
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

      {/* Mobile Compact Vertical Column Schematic (< 640px) — Zero Horizontal Scrolling */}
      <div
        className="sm:hidden rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-3"
        data-testid="distillation-mobile-schematic"
        role="region"
        aria-label={`Binary distillation column mobile schematic: Feed F = ${F.toFixed(1)} kmol/h at zF = ${zF.toFixed(3)}, Distillate D = ${D.toFixed(2)} kmol/h at xD = ${xD.toFixed(3)}, Bottoms B = ${B.toFixed(2)} kmol/h at xB = ${xB.toFixed(3)}, ${labels.stageHeadline}.`}
      >
        {/* Compact Vertical Column SVG Diagram */}
        <svg
          viewBox="0 0 320 264"
          className="w-full h-auto select-none"
          role="img"
          aria-label="Vertical distillation column schematic showing feed entry, rectifying and stripping sections, total condenser with reflux and distillate, and partial reboiler with boilup and bottoms"
        >
          <defs>
            <linearGradient id="columnGradientMobile" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CCFBF1" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
            <marker
              id="arrowTealMobile"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0F766E" />
            </marker>
            <marker
              id="arrowSlateMobile"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
            </marker>
            <marker
              id="arrowBlueMobile"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7" />
            </marker>
          </defs>

          <rect x="0" y="0" width="320" height="264" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

          {/* FEED STREAM ENTRY (LEFT) */}
          <rect x="8" y="102" width="76" height="58" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
          <text x="14" y="116" fontSize="8" fontWeight="700" fill="#0F172A">
            FEED (F)
          </text>
          <text x="14" y="129" fontSize="8.2" fontFamily="monospace" fontWeight="700" fill="#0F766E">
            {F.toFixed(1)} kmol/h
          </text>
          <text x="14" y="142" fontSize="8" fontFamily="monospace" fill="#334155">
            zF = {zF.toFixed(3)}
          </text>
          <text x="14" y="153" fontSize="7.6" fontFamily="monospace" fill="#475569">
            q = {q.toFixed(2)}
          </text>
          <line x1="84" y1="132" x2="108" y2="132" stroke="#0F766E" strokeWidth="2.2" markerEnd="url(#arrowTealMobile)" />

          {/* DISTILLATION COLUMN SHELL (CENTER) */}
          <rect
            x="110"
            y="26"
            width="86"
            height="214"
            rx="18"
            fill="url(#columnGradientMobile)"
            stroke="#0F172A"
            strokeWidth="2"
          />

          {/* Rectifying Section */}
          <text x="153" y="45" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#134E4A">
            RECTIFYING
          </text>
          <text x="153" y="56" textAnchor="middle" fontSize="7.2" fontFamily="monospace" fill="#334155">
            L={L.toFixed(0)} · V={V.toFixed(0)}
          </text>
          <line x1="118" y1="70" x2="188" y2="70" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 3" />
          <line x1="118" y1="92" x2="188" y2="92" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 3" />

          {/* Feed Stage Plate */}
          <rect x="113" y="121" width="80" height="20" rx="4" fill="#0F766E" fillOpacity="0.16" stroke="#0F766E" strokeWidth="1.2" />
          <text x="153" y="134" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fontWeight="700" fill="#134E4A">
            {feedStage !== null ? `FEED NF = ${feedStage}` : 'FEED ZONE'}
          </text>

          {/* Stripping Section */}
          <line x1="118" y1="162" x2="188" y2="162" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 3" />
          <line x1="118" y1="184" x2="188" y2="184" stroke="#475569" strokeWidth="1.2" strokeDasharray="4 3" />
          <text x="153" y="206" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#0F172A">
            STRIPPING
          </text>
          <text x="153" y="218" textAnchor="middle" fontSize="7.2" fontFamily="monospace" fill="#334155">
            L̄={Lbar.toFixed(0)} · V̄={Vbar.toFixed(0)}
          </text>

          {/* OVERHEAD VAPOR & TOTAL CONDENSER (TOP RIGHT) */}
          <polyline
            points="153,26 153,12 260,12 260,28"
            fill="none"
            stroke="#0284C7"
            strokeWidth="2"
            markerEnd="url(#arrowBlueMobile)"
          />
          <text x="208" y="9" textAnchor="middle" fontSize="7.2" fontFamily="monospace" fill="#0369A1">
            Vapor V = {V.toFixed(1)}
          </text>

          <rect x="220" y="30" width="84" height="36" rx="6" fill="#F0FDFA" stroke="#0F766E" strokeWidth="1.6" />
          <text x="262" y="45" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#134E4A">
            CONDENSER
          </text>
          <text x="262" y="57" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#0F766E">
            Total · 0 Stages
          </text>

          {/* Reflux Line back to Column */}
          <line x1="220" y1="48" x2="198" y2="48" stroke="#0F766E" strokeWidth="2" markerEnd="url(#arrowTealMobile)" />
          <text x="209" y="42" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#0F766E">
            L
          </text>

          {/* Distillate Tag below Condenser */}
          <line x1="262" y1="66" x2="262" y2="82" stroke="#0F766E" strokeWidth="2" markerEnd="url(#arrowTealMobile)" />
          <rect x="212" y="84" width="100" height="38" rx="6" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.4" />
          <text x="262" y="96" textAnchor="middle" fontSize="7.4" fontWeight="700" fill="#134E4A">
            DISTILLATE (D)
          </text>
          <text x="262" y="107" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="700" fill="#0F766E">
            D={D.toFixed(1)} · xD={xD.toFixed(3)}
          </text>
          <text x="262" y="117" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#475569">
            L/D = {R.toFixed(2)}
          </text>

          {/* PARTIAL REBOILER & BOTTOMS (BOTTOM RIGHT) */}
          <line x1="196" y1="222" x2="218" y2="222" stroke="#334155" strokeWidth="2" markerEnd="url(#arrowSlateMobile)" />
          <rect x="220" y="202" width="84" height="38" rx="6" fill="#FFFBEB" stroke="#B45309" strokeWidth="1.6" />
          <text x="262" y="217" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#78350F">
            REBOILER
          </text>
          <text x="262" y="229" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#92400E">
            Partial · Stage N
          </text>

          {/* Boilup Vapor returning to Column */}
          <polyline
            points="262,202 262,188 198,188"
            fill="none"
            stroke="#0284C7"
            strokeWidth="2"
            markerEnd="url(#arrowBlueMobile)"
          />
          <text x="234" y="183" textAnchor="middle" fontSize="7.2" fontFamily="monospace" fill="#0369A1">
            Boilup V̄ = {Vbar.toFixed(1)}
          </text>

          {/* Bottoms Summary Box */}
          <rect x="212" y="138" width="100" height="36" rx="6" fill="#FFFFFF" stroke="#334155" strokeWidth="1.4" />
          <text x="262" y="150" textAnchor="middle" fontSize="7.4" fontWeight="700" fill="#0F172A">
            BOTTOMS (B)
          </text>
          <text x="262" y="161" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="700" fill="#0F172A">
            B={B.toFixed(1)} · xB={xB.toFixed(3)}
          </text>
          <text x="262" y="170" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#475569">
            V̄/B = {internalFlows.boilupRatio_Vb.toFixed(2)}
          </text>

          {/* Bottom Caption inside SVG */}
          <text x="160" y="255" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="600" fill="#334155">
            {labels.stageHeadline}
          </text>
        </svg>

        {/* Solver-Linked Stage Summary Strip */}
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            labels.isPinched
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-teal-200 bg-teal-50/70 text-slate-900'
          }`}
        >
          <div className="font-mono font-bold text-[11px]">{labels.stageHeadline}</div>
          <div className="font-mono text-[11px] text-teal-900 mt-0.5">{labels.fractionalDetail}</div>
        </div>

        {/* Stream & Operating Envelope Readout Grid */}
        <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-teal-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-teal-950">
              Distillate Product (D)
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold text-teal-800 tabular-nums">
              {D.toFixed(2)} kmol/h
            </div>
            <div className="font-mono text-[11px] text-slate-800 tabular-nums">
              xD = {xD.toFixed(3)} mol/mol A
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              L/D = {R.toFixed(2)} · Rec: {materialBalance.lightRecoveryInDistillate_pct.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
              Feed Stream (F)
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
              {F.toFixed(1)} kmol/h
            </div>
            <div className="font-mono text-[11px] text-slate-800 tabular-nums">
              zF = {zF.toFixed(3)} · q = {q.toFixed(2)}
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              {labels.feedQualityLabel} · {feedStage !== null ? `NF = ${feedStage}` : 'Pinched'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
              Bottoms Product (B)
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 tabular-nums">
              {B.toFixed(2)} kmol/h
            </div>
            <div className="font-mono text-[11px] text-slate-800 tabular-nums">
              xB = {xB.toFixed(3)} mol/mol A
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              V̄/B = {internalFlows.boilupRatio_Vb.toFixed(2)} · 1−xB = {(1 - xB).toFixed(3)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
              Operating Envelope
            </div>
            <div className="mt-0.5 font-mono text-[11px] font-semibold text-teal-800 tabular-nums">
              R / Rmin = {labels.refluxRatioMultipleLabel}
            </div>
            <div className="font-mono text-[10px] text-slate-700 tabular-nums">
              Rmin = {labels.rMinLabel} · Nmin = {labels.fenskeLabel}
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              Int: ({operatingLines.intersection_x.toFixed(3)}, {operatingLines.intersection_y.toFixed(3)})
            </div>
          </div>
        </div>

        {/* Optional Toggle for Full Desktop Schematic */}
        <button
          type="button"
          onClick={() => setShowDesktopOnMobile((prev) => !prev)}
          aria-expanded={showDesktopOnMobile}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span>
            {showDesktopOnMobile
              ? 'Hide Detailed Desktop Blueprint'
              : 'Inspect Detailed Desktop Blueprint (Scrollable)'}
          </span>
          {showDesktopOnMobile ? (
            <ChevronUp className="w-3.5 h-3.5 text-teal-700" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-teal-700" />
          )}
        </button>
      </div>

      {/* Tablet & Desktop Full SVG Process Flow Diagram (>= 640px, or expanded on mobile) */}
      <div
        className={
          showDesktopOnMobile
            ? 'mt-3 sm:mt-0 w-full overflow-x-auto'
            : 'hidden sm:block w-full overflow-x-auto'
        }
      >
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
