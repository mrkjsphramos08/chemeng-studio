'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HeatExchangerInputs, HeatExchangerResults } from '@/lib/heat-exchanger';
import { formatHeatExchangerMobileLabels } from '@/lib/schematic-formatting';
import { LabModelScopeDisclosure, MathInline } from '@/components/lab-shared';

interface SchematicProps {
  inputs: HeatExchangerInputs;
  results: HeatExchangerResults;
}

export function HeatExchangerSchematic({ inputs, results }: SchematicProps) {
  const [showDesktopOnMobile, setShowDesktopOnMobile] = useState(false);
  const labels = formatHeatExchangerMobileLabels(inputs, results);
  const isTemperatureCross = labels.isTemperatureCross;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 sm:gap-4 mb-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            Ideal Countercurrent Heat Exchanger Process Schematic
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Hot stream (left → right) exchanges sensible heat across area A with cold stream (right → left)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-700 font-mono tabular-nums">
          <span>UA = {labels.uaLabel}</span>
          <span aria-hidden="true">·</span>
          <span>LMTD = {labels.lmtdLabel}</span>
          {isTemperatureCross && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-teal-800 font-semibold">
                ▲ Temperature Cross Active (Tc,out &gt; Th,out)
              </span>
            </>
          )}
        </div>
      </div>

      {/* Idealized Flow Scope Clarification (Progressive Disclosure) */}
      <LabModelScopeDisclosure
        badge="Idealized 1D Model"
        summary="Pure countercurrent flow (no multi-pass $F_T$ correction)."
        id="hx-model-scope"
      >
        <strong className="text-slate-800">Model Idealization Note:</strong> This conceptual tubular
        diagram illustrates <strong className="text-slate-800">ideal 1D pure countercurrent flow</strong>{' '}
        (such as a concentric double-pipe or ideal single-pass countercurrent unit). Real multi-pass
        shell-and-tube exchangers with baffle cross-flow require LMTD correction factors{' '}
        <span className="whitespace-nowrap">(<MathInline latex="F_T" />)</span> or
        multi-pass <MathInline latex="\varepsilon\text{–}\mathrm{NTU}" /> correlations not modeled in Phase 1.1.
      </LabModelScopeDisclosure>

      {/* Mobile Countercurrent Schematic (< 640px) — Full Visibility Without Horizontal Scrolling */}
      <div
        className="sm:hidden rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-3"
        data-testid="heat-exchanger-mobile-schematic"
        role="region"
        aria-label={`Countercurrent heat exchanger mobile schematic: Hot stream enters at ${labels.hotInLabel} and exits at ${labels.hotOutLabel}; cold stream enters countercurrently at ${labels.coldInLabel} and exits at ${labels.coldOutLabel}; heat duty Q = ${labels.dutyLabel}.`}
      >
        {/* Compact Responsive Countercurrent Vector Diagram */}
        <svg
          viewBox="0 0 320 142"
          className="w-full h-auto select-none"
          role="img"
          aria-label="Countercurrent flow diagram showing hot stream flowing left to right, heat transferring downward, and cold stream flowing right to left"
        >
          <defs>
            <linearGradient id="hotStreamGradMobile" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="50%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="coldStreamGradMobile" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
            <marker
              id="arrowHotMobile"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FFFFFF" />
            </marker>
            <marker
              id="arrowColdMobile"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FFFFFF" />
            </marker>
          </defs>

          <rect x="0" y="0" width="320" height="142" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

          {/* Axial Reference Labels */}
          <text x="12" y="15" textAnchor="start" fontSize="9" fontFamily="monospace" fill="#475569">
            x/L = 0 (Hot End)
          </text>
          <text x="308" y="15" textAnchor="end" fontSize="9" fontFamily="monospace" fill="#475569">
            x/L = 1 (Cold End)
          </text>

          {/* Hot Stream Channel (Left -> Right) */}
          <rect x="12" y="23" width="296" height="28" rx="6" fill="url(#hotStreamGradMobile)" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="22" y1="37" x2="62" y2="37" stroke="#FFFFFF" strokeWidth="2" markerEnd="url(#arrowHotMobile)" />
          <text x="160" y="40.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
            Hot Stream (Left → Right)
          </text>
          <line x1="258" y1="37" x2="296" y2="37" stroke="#FFFFFF" strokeWidth="2" markerEnd="url(#arrowHotMobile)" />

          {/* Heat Transfer Flux Arrows (Hot -> Cold) & Central Duty Pill */}
          {[42, 82, 238, 278].map((xPos) => (
            <g key={xPos}>
              <line x1={xPos} y1="53" x2={xPos} y2="79" stroke="#EA580C" strokeWidth="1.6" />
              <polygon points={`${xPos - 3.5},77 ${xPos + 3.5},77 ${xPos},83`} fill="#EA580C" />
            </g>
          ))}
          <rect x="102" y="55" width="116" height="28" rx="6" fill="#0F172A" />
          <text x="160" y="66" textAnchor="middle" fontSize="7.8" fontWeight="600" fill="#CBD5E1">
            HEAT TRANSFER (Q)
          </text>
          <text x="160" y="78" textAnchor="middle" fontSize="10.5" fontFamily="monospace" fontWeight="700" fill="#5EEAD4">
            {labels.dutyLabel}
          </text>

          {/* Cold Stream Channel (Right -> Left) */}
          <rect x="12" y="87" width="296" height="28" rx="6" fill="url(#coldStreamGradMobile)" stroke="#1E293B" strokeWidth="1.5" />
          <line x1="62" y1="101" x2="22" y2="101" stroke="#FFFFFF" strokeWidth="2" markerEnd="url(#arrowColdMobile)" />
          <text x="160" y="104.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FFFFFF">
            ← Cold Stream (Countercurrent)
          </text>
          <line x1="296" y1="101" x2="258" y2="101" stroke="#FFFFFF" strokeWidth="2" markerEnd="url(#arrowColdMobile)" />

          {/* Exchanger Geometry Line */}
          <text x="160" y="131" textAnchor="middle" fontSize="9.2" fontFamily="monospace" fill="#334155">
            A = {inputs.A.toFixed(1)} m² · U = {inputs.U.toFixed(0)} W/(m²·K) · LMTD = {labels.lmtdLabel}
          </text>
        </svg>

        {/* Temperature Cross Status Banner (when active) */}
        {isTemperatureCross && (
          <div className="rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-[11px] text-teal-950 leading-snug">
            <strong className="font-semibold">▲ Temperature Cross Active:</strong> Cold outlet ({labels.coldOutLabel}) exceeds hot outlet ({labels.hotOutLabel}) while local{' '}
            <span className="font-mono">Th(x) &gt; Tc(x)</span> along the countercurrent exchanger.
          </div>
        )}

        {/* Terminal Stream Readouts — Spatially Aligned (Left = Hot End x/L=0, Right = Cold End x/L=1) */}
        <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-2 text-xs">
          {/* 1. Hot Inlet (Hot End, Left) */}
          <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-rose-950">
              Hot Inlet (Th,in) →
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-rose-800 tabular-nums">
              {labels.hotInLabel}
            </div>
            <div className="mt-1 font-mono text-[11px] text-rose-900 tabular-nums">
              mh = {inputs.mh.toFixed(2)} kg/s
            </div>
            <div className="font-mono text-[10px] text-rose-900/90 tabular-nums">
              Cp,h = {inputs.Cph_kJ.toFixed(2)} kJ/kg·K
            </div>
          </div>

          {/* 2. Hot Outlet (Cold End, Right) */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-950">
              → Hot Outlet (Th,out)
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-amber-800 tabular-nums">
              {labels.hotOutLabel}
            </div>
            <div className="mt-1 font-mono text-[11px] text-amber-900 tabular-nums">
              ΔTh = {labels.deltaThLabel}
            </div>
            <div className="font-mono text-[10px] text-amber-900/90 tabular-nums">
              Ch = {labels.chLabel}
            </div>
          </div>

          {/* 3. Cold Outlet (Hot End, Left) */}
          <div className="rounded-lg border border-teal-200 bg-teal-50/90 p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-teal-950">
              ← Cold Outlet (Tc,out)
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-teal-800 tabular-nums">
              {labels.coldOutLabel}
            </div>
            <div className="mt-1 font-mono text-[11px] text-teal-900 tabular-nums">
              ΔTc = {labels.deltaTcLabel}
            </div>
            <div className="font-mono text-[10px] text-teal-900/90 tabular-nums">
              Hot-End ΔT1 = {labels.approachHotLabel}
            </div>
          </div>

          {/* 4. Cold Inlet (Cold End, Right) */}
          <div className="rounded-lg border border-sky-200 bg-sky-50/90 p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-sky-950">
              Cold Inlet (Tc,in) ←
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-sky-800 tabular-nums">
              {labels.coldInLabel}
            </div>
            <div className="mt-1 font-mono text-[11px] text-sky-900 tabular-nums">
              mc = {inputs.mc.toFixed(2)} kg/s · Cc = {labels.ccLabel}
            </div>
            <div className="font-mono text-[10px] text-sky-900/90 tabular-nums">
              Cold-End ΔT2 = {labels.approachColdLabel}
            </div>
          </div>
        </div>

        {/* Optional Toggle to Inspect Full Desktop Blueprint on Mobile */}
        <button
          type="button"
          onClick={() => setShowDesktopOnMobile((prev) => !prev)}
          aria-expanded={showDesktopOnMobile}
          aria-controls="heat-exchanger-desktop-schematic"
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          <span>
            {showDesktopOnMobile
              ? 'Hide Detailed Desktop Blueprint'
              : 'Inspect Detailed Desktop Blueprint (Scrollable)'}
          </span>
          {showDesktopOnMobile ? (
            <ChevronUp className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Tablet & Desktop Full Engineering Schematic SVG (>= 640px, or expanded on mobile) */}
      <div
        id="heat-exchanger-desktop-schematic"
        className={
          showDesktopOnMobile
            ? 'mt-3 sm:mt-0 w-full overflow-x-auto'
            : 'hidden sm:block w-full overflow-x-auto'
        }
        data-testid="heat-exchanger-schematic"
      >
        <svg
          viewBox="0 0 860 320"
          className={
            showDesktopOnMobile
              ? 'w-full h-auto min-w-[640px] sm:min-w-0 select-none'
              : 'w-full h-auto select-none'
          }
          role="img"
          aria-label="Ideal countercurrent heat exchanger process schematic showing hot stream entering left and exiting right, and cold stream entering bottom right and exiting top left"
        >
          <defs>
            {/* Subtle technical grid */}
            <pattern id="eng-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="1"
              />
            </pattern>

            {/* Thermal gradient for hot tube */}
            <linearGradient id="hotStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="50%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Thermal gradient for cold shell */}
            <linearGradient id="coldStreamGrad" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>

            {/* Arrow markers */}
            <marker
              id="arrowHot"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
            </marker>
            <marker
              id="arrowWarm"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
            </marker>
            <marker
              id="arrowCold"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7" />
            </marker>
            <marker
              id="arrowTeal"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0D9488" />
            </marker>
          </defs>

          {/* Background technical canvas */}
          <rect x="0" y="0" width="860" height="320" rx="8" fill="url(#eng-grid)" />

          {/* Axial coordinate indicator top */}
          <line x1="220" y1="26" x2="640" y2="26" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="220" cy="26" r="3" fill="#475569" />
          <circle cx="640" cy="26" r="3" fill="#475569" />
          <text x="220" y="15" textAnchor="start" className="text-[10px] fill-slate-600 font-mono">
            x/L = 0 (Hot End)
          </text>
          <text x="430" y="15" textAnchor="middle" className="text-[10px] fill-slate-700 font-mono font-medium">
            A = {inputs.A.toFixed(1)} m² · U = {inputs.U.toFixed(0)} W/(m²·K)
          </text>
          <text x="640" y="15" textAnchor="end" className="text-[10px] fill-slate-600 font-mono">
            x/L = 1 (Cold End)
          </text>

          {/* Outer Annular / Jacket Body (Concentric Ideal Countercurrent Representation) */}
          <rect
            x="220"
            y="88"
            width="420"
            height="144"
            rx="16"
            fill="#F8FAFC"
            stroke="#334155"
            strokeWidth="2.5"
          />

          {/* Cold Annulus Subtle Thermal Wash */}
          <rect
            x="224"
            y="92"
            width="412"
            height="136"
            rx="13"
            fill="url(#coldStreamGrad)"
            fillOpacity="0.12"
          />

          {/* Cold Fluid Inlet Nozzle (Bottom Right, x=605) */}
          <rect x="592" y="232" width="26" height="40" fill="#E0F2FE" stroke="#334155" strokeWidth="2" />
          <line
            x1="605"
            y1="286"
            x2="605"
            y2="242"
            stroke="#0284C7"
            strokeWidth="3"
            markerEnd="url(#arrowCold)"
          />

          {/* Cold Fluid Outlet Nozzle (Top Left, x=255) */}
          <rect x="242" y="48" width="26" height="40" fill="#CCFBF1" stroke="#334155" strokeWidth="2" />
          <line
            x1="255"
            y1="82"
            x2="255"
            y2="36"
            stroke="#0D9488"
            strokeWidth="3"
            markerEnd="url(#arrowTeal)"
          />

          {/* Countercurrent Cold Flow Direction Arrows Inside Outer Channel */}
          <path
            d="M 590 212 L 480 212"
            stroke="#0284C7"
            strokeWidth="2"
            strokeDasharray="5 3"
            markerEnd="url(#arrowCold)"
          />
          <path
            d="M 465 108 L 325 108"
            stroke="#0D9488"
            strokeWidth="2"
            strokeDasharray="5 3"
            markerEnd="url(#arrowTeal)"
          />
          <text x="430" y="103" textAnchor="middle" className="text-[10px] fill-teal-900 font-semibold">
            ← Cold Stream Flow (Countercurrent Annulus)
          </text>

          {/* Hot Stream Core Tube */}
          <rect
            x="170"
            y="142"
            width="520"
            height="36"
            rx="4"
            fill="url(#hotStreamGrad)"
            stroke="#1E293B"
            strokeWidth="2"
          />

          {/* Hot Stream Direction Arrows Inside Tube */}
          <line
            x1="130"
            y1="160"
            x2="205"
            y2="160"
            stroke="#DC2626"
            strokeWidth="3"
            markerEnd="url(#arrowHot)"
          />
          <line
            x1="340"
            y1="160"
            x2="510"
            y2="160"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            markerEnd="url(#arrowWarm)"
          />
          <line
            x1="655"
            y1="160"
            x2="725"
            y2="160"
            stroke="#D97706"
            strokeWidth="3"
            markerEnd="url(#arrowWarm)"
          />
          <text x="430" y="164" textAnchor="middle" className="text-[11px] fill-white font-semibold">
            Hot Stream Flow (Inner Channel) →
          </text>

          {/* Vertical Heat Flux Indicators (Hot Stream -> Cold Stream) */}
          {[280, 360, 430, 500, 575].map((xPos) => (
            <g key={xPos}>
              <line x1={xPos} y1="140" x2={xPos} y2="122" stroke="#EA580C" strokeWidth="1.5" />
              <polygon points={`${xPos - 3},124 ${xPos + 3},124 ${xPos},118`} fill="#EA580C" />
              <line x1={xPos} y1="180" x2={xPos} y2="198" stroke="#EA580C" strokeWidth="1.5" />
              <polygon points={`${xPos - 3},196 ${xPos + 3},196 ${xPos},202`} fill="#EA580C" />
            </g>
          ))}

          {/* Central Heat Transfer Duty Readout Box on Exchanger */}
          <rect
            x="344"
            y="246"
            width="172"
            height="48"
            rx="8"
            fill="#0F172A"
          />
          <text x="430" y="265" textAnchor="middle" className="text-[10px] fill-slate-300 font-medium">
            HEAT TRANSFER RATE (Q)
          </text>
          <text x="430" y="284" textAnchor="middle" className="text-[15px] fill-teal-300 font-mono font-semibold">
            {results.isValid ? `${results.Q_kW.toFixed(1)} kW` : 'Invalid Input'}
          </text>

          {/* 1. HOT INLET CALLOUT (LEFT) */}
          <g transform="translate(8, 114)" data-testid="hx-svg-hot-inlet-callout">
            <rect width="154" height="92" rx="8" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1.5" />
            <text x="10" y="20" className="text-[11px] font-bold fill-rose-950">
              HOT INLET (Th,in)
            </text>
            <text x="10" y="44" className="text-[20px] font-mono font-bold fill-rose-800">
              {inputs.Th_in.toFixed(1)} °C
            </text>
            <text x="10" y="64" className="text-[11px] font-mono fill-rose-900">
              mh = {inputs.mh.toFixed(2)} kg/s
            </text>
            <text x="10" y="80" className="text-[11px] font-mono fill-rose-900">
              Cp,h = {inputs.Cph_kJ.toFixed(2)} kJ/kg·K
            </text>
          </g>

          {/* 2. HOT OUTLET CALLOUT (RIGHT) */}
          <g transform="translate(698, 114)" data-testid="hx-svg-hot-outlet-callout">
            <rect width="148" height="92" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
            <text x="12" y="20" className="text-[11px] font-bold fill-amber-950">
              HOT OUTLET (Th,out)
            </text>
            <text x="12" y="44" className="text-[20px] font-mono font-bold fill-amber-800">
              {results.isValid ? `${results.Th_out.toFixed(1)} °C` : '—'}
            </text>
            <text x="12" y="64" className="text-[11px] font-mono fill-amber-900">
              ΔTh = −{results.isValid ? results.deltaTh.toFixed(1) : '0.0'} °C
            </text>
            <text x="12" y="80" className="text-[11px] font-mono fill-amber-900">
              Ch = {results.isValid ? results.Ch_kW_K.toFixed(2) : '0.00'} kW/K
            </text>
          </g>

          {/* 3. COLD OUTLET CALLOUT (TOP LEFT) */}
          <g transform="translate(14, 16)">
            <rect width="192" height="72" rx="8" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1.5" />
            <text x="12" y="19" className="text-[11px] font-bold fill-teal-950">
              COLD OUTLET (Tc,out)
            </text>
            <text x="12" y="42" className="text-[18px] font-mono font-bold fill-teal-800">
              {results.isValid ? `${results.Tc_out.toFixed(1)} °C` : '—'}
            </text>
            <text x="108" y="41" className="text-[11px] font-mono fill-teal-900">
              (+{results.isValid ? results.deltaTc.toFixed(1) : '0.0'} °C)
            </text>
            <text x="12" y="60" className="text-[11px] font-mono fill-teal-900">
              Hot-End ΔT1 = {results.isValid ? `${results.approachTempHotEnd.toFixed(1)} °C` : '—'}
            </text>
          </g>

          {/* 4. COLD INLET CALLOUT (BOTTOM RIGHT) */}
          <g transform="translate(624, 222)" data-testid="hx-svg-cold-inlet-callout">
            <rect width="222" height="90" rx="8" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
            <text x="12" y="18" className="text-[11px] font-bold fill-sky-950">
              COLD INLET (Tc,in)
            </text>
            <text x="12" y="40" className="text-[18px] font-mono font-bold fill-sky-800">
              {inputs.Tc_in.toFixed(1)} °C
            </text>
            <text x="100" y="39" className="text-[11px] font-mono fill-sky-900">
              mc = {inputs.mc.toFixed(2)} kg/s
            </text>
            <text x="12" y="59" className="text-[11px] font-mono fill-sky-900">
              Cc = {results.isValid ? results.Cc_kW_K.toFixed(2) : '0.00'} kW/K
            </text>
            <text x="12" y="76" className="text-[11px] font-mono fill-sky-900">
              Cold-End ΔT2 = {results.isValid ? `${results.approachTempColdEnd.toFixed(1)} °C` : '—'}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
