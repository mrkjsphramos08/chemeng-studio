'use client';

import React from 'react';
import { HeatExchangerInputs, HeatExchangerResults } from '@/lib/heat-exchanger';

interface SchematicProps {
  inputs: HeatExchangerInputs;
  results: HeatExchangerResults;
}

export function HeatExchangerSchematic({ inputs, results }: SchematicProps) {
  const isTemperatureCross = results.isValid && results.Tc_out > results.Th_out;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Ideal Countercurrent Heat Exchanger Process Schematic
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Hot stream (left → right) exchanges sensible heat across area A with cold stream (right → left)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 font-mono tabular-nums">
          <span>UA = {(results.UA_W_K / 1000).toFixed(2)} kW/K</span>
          <span aria-hidden="true">·</span>
          <span>LMTD = {results.isValid ? `${results.LMTD.toFixed(1)} °C` : '—'}</span>
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

      {/* Idealized Flow Scope Clarification */}
      <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-800">Model Idealization Note:</strong> This conceptual tubular
        diagram illustrates <strong className="text-slate-800">ideal 1D pure countercurrent flow</strong>{' '}
        (such as a concentric double-pipe or ideal single-pass countercurrent unit). Real multi-pass
        shell-and-tube exchangers with baffle cross-flow require LMTD correction factors (F_T) or
        multi-pass ε–NTU correlations not modeled in Phase 1.1.
      </div>

      {/* Interactive Engineering Schematic SVG */}
      <div className="w-full overflow-x-auto" data-testid="heat-exchanger-schematic">
        <svg
          viewBox="0 0 860 320"
          className="w-full h-auto min-w-[640px] select-none"
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
          <g transform="translate(14, 114)">
            <rect width="144" height="92" rx="8" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1.5" />
            <text x="12" y="20" className="text-[11px] font-bold fill-rose-950">
              HOT INLET (Th,in)
            </text>
            <text x="12" y="44" className="text-[20px] font-mono font-bold fill-rose-800">
              {inputs.Th_in.toFixed(1)} °C
            </text>
            <text x="12" y="64" className="text-[11px] font-mono fill-rose-900">
              mh = {inputs.mh.toFixed(2)} kg/s
            </text>
            <text x="12" y="80" className="text-[11px] font-mono fill-rose-900">
              Cp,h = {inputs.Cph_kJ.toFixed(2)} kJ/kg·K
            </text>
          </g>

          {/* 2. HOT OUTLET CALLOUT (RIGHT) */}
          <g transform="translate(702, 114)">
            <rect width="144" height="92" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
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
          <g transform="translate(652, 228)">
            <rect width="194" height="78" rx="8" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1.5" />
            <text x="12" y="19" className="text-[11px] font-bold fill-sky-950">
              COLD INLET (Tc,in)
            </text>
            <text x="12" y="42" className="text-[18px] font-mono font-bold fill-sky-800">
              {inputs.Tc_in.toFixed(1)} °C
            </text>
            <text x="100" y="41" className="text-[11px] font-mono fill-sky-900">
              mc = {inputs.mc.toFixed(2)} kg/s
            </text>
            <text x="12" y="60" className="text-[11px] font-mono fill-sky-900">
              Cc = {results.isValid ? results.Cc_kW_K.toFixed(2) : '0.00'} kW/K · ΔT2 ={' '}
              {results.isValid ? `${results.approachTempColdEnd.toFixed(1)} °C` : '—'}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
