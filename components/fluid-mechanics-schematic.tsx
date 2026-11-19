'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  FluidMechanicsInputs,
  FluidMechanicsResults,
} from '@/lib/fluid-mechanics';
import { formatFluidMechanicsMobileLabels } from '@/lib/schematic-formatting';
import { LabModelScopeDisclosure, MathInline } from '@/components/lab-shared';

interface SchematicProps {
  inputs: FluidMechanicsInputs;
  results: FluidMechanicsResults;
}

export function FluidMechanicsSchematic({ inputs, results }: SchematicProps) {
  const [showDesktopOnMobile, setShowDesktopOnMobile] = useState(false);
  const labels = formatFluidMechanicsMobileLabels(inputs, results);
  const hasElevation = labels.hasElevation;
  const isZeroFlow = labels.isZeroFlow;

  const regimeBadgeColor =
    results.flowRegime === 'Turbulent'
      ? 'text-teal-800'
      : results.flowRegime === 'Laminar'
      ? 'text-sky-800'
      : results.flowRegime === 'Transitional'
      ? 'text-amber-800'
      : 'text-slate-600';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 sm:gap-4 mb-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            Incompressible Pipe Flow &amp; Pumping Hydraulics Schematic
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Source reservoir → pump head addition → straight pipe (major loss hf) &amp; fittings (minor loss hm) → discharge
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-700 font-mono tabular-nums">
          <span>v = {labels.velocityLabel}</span>
          <span aria-hidden="true">·</span>
          <span>Re = {labels.reynoldsLabel}</span>
          <span aria-hidden="true">·</span>
          <span className={`font-semibold ${regimeBadgeColor}`}>{labels.regimeLabel}</span>
        </div>
      </div>

      {/* Scope Clarification (Progressive Disclosure) */}
      <LabModelScopeDisclosure
        badge="Idealized Pipe Model"
        summary="Steady, incompressible single-phase flow ($P_1 = P_2$, $\Delta z \ge 0$)."
        id="fm-model-scope"
      >
        <strong className="text-slate-800">Hydraulic Model Scope:</strong> Assumes steady,
        incompressible, isothermal single-phase flow with equal inlet and outlet gauge pressures{' '}
        <span className="whitespace-nowrap">(<MathInline latex="P_1 = P_2" />)</span> and elevation
        change <MathInline latex="\Delta z \ge 0\;\mathrm{m}" />. Centrifugal pump{' '}
        <MathInline latex="H\text{–}Q" /> performance curves and NPSH cavitation margins are
        outside Phase 1.2 scope.
      </LabModelScopeDisclosure>

      {/* Mobile Piping & Pumping Schematic (< 640px) — Zero Horizontal Scrolling */}
      <div
        className="sm:hidden rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-3"
        data-testid="fluid-mechanics-mobile-schematic"
        role="region"
        aria-label={`Fluid mechanics piping schematic: flow rate ${inputs.flowRate_L_s.toFixed(1)} L/s, regime ${labels.regimeLabel}, required pump head ${labels.pumpHeadLabel}, frictional pressure loss ${labels.pressureLossLabel}, elevation rise ${labels.elevationLabel}.`}
      >
        {/* Compact Responsive Hydraulic Vector Diagram */}
        <svg
          viewBox="0 0 320 132"
          className="w-full h-auto select-none"
          role="img"
          aria-label="Piping and pumping schematic showing source tank, centrifugal pump, valve fittings, pipe run, optional elevation rise, and discharge"
        >
          <defs>
            <linearGradient id="pipeFluidGradMobile" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
            <marker
              id="flowArrowMobile"
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

          <rect x="0" y="0" width="320" height="132" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

          {/* Datum Line z1 = 0 */}
          <line x1="10" y1="104" x2="310" y2="104" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 3" />
          <text x="12" y="120" fontSize="8.5" fontFamily="monospace" fill="#64748B">
            Datum z₁ = 0 m · P₁ = P₂ (gauge)
          </text>

          {/* Source Tank */}
          <rect x="12" y="56" width="42" height="48" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.6" />
          <rect x="14" y="68" width="38" height="34" fill="#BAE6FD" opacity="0.75" />
          <text x="33" y="49" textAnchor="middle" fontSize="8" fontWeight="700" fill="#334155">
            SOURCE
          </text>
          <text x="33" y="88" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="700" fill="#0F172A">
            {inputs.flowRate_L_s.toFixed(1)} L/s
          </text>

          {/* Suction Pipe */}
          <rect x="54" y="83" width="24" height="12" fill="url(#pipeFluidGradMobile)" stroke="#0F172A" strokeWidth="1.2" />

          {/* Centrifugal Pump */}
          <circle cx="94" cy="89" r="16" fill="#0F172A" stroke="#0D9488" strokeWidth="2.4" />
          <polygon points="89,82 103,89 89,96" fill="#14B8A6" />
          <text x="94" y="67" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F172A">
            PUMP
          </text>

          {/* Main Horizontal Pipe */}
          <rect
            x="110"
            y="82"
            width={hasElevation ? 132 : 176}
            height="14"
            fill="url(#pipeFluidGradMobile)"
            stroke="#0F172A"
            strokeWidth="1.2"
          />

          {/* Flow Arrow inside Pipe */}
          {!isZeroFlow && (
            <line
              x1="120"
              y1="89"
              x2="148"
              y2="89"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              markerEnd="url(#flowArrowMobile)"
            />
          )}

          {/* Gate / Control Valve Fitting */}
          <g transform="translate(166, 77)">
            <polygon points="0,0 11,12 0,24" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.4" />
            <polygon points="22,0 11,12 22,24" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.4" />
            <line x1="11" y1="12" x2="11" y2="-7" stroke="#0F172A" strokeWidth="1.6" />
            <line x1="4" y1="-7" x2="18" y2="-7" stroke="#0F172A" strokeWidth="2" />
            <text x="11" y="-12" textAnchor="middle" fontSize="8" fontWeight="600" fill="#334155">
              ΣK={inputs.minorLossK.toFixed(1)}
            </text>
          </g>

          {/* Elevation Riser OR Horizontal Discharge */}
          {hasElevation ? (
            <>
              <rect x="230" y="34" width="14" height="62" fill="url(#pipeFluidGradMobile)" stroke="#0F172A" strokeWidth="1.2" />
              <rect x="230" y="34" width="56" height="14" fill="url(#pipeFluidGradMobile)" stroke="#0F172A" strokeWidth="1.2" />
              <rect x="231" y="83" width="12" height="12" fill="#0D9488" />
              <rect x="231" y="35" width="12" height="12" fill="#0D9488" />
              {!isZeroFlow && (
                <>
                  <line x1="237" y1="78" x2="237" y2="54" stroke="#FFFFFF" strokeWidth="1.6" markerEnd="url(#flowArrowMobile)" />
                  <line x1="248" y1="41" x2="276" y2="41" stroke="#FFFFFF" strokeWidth="1.6" markerEnd="url(#flowArrowMobile)" />
                </>
              )}
              <line x1="280" y1="48" x2="280" y2="104" stroke="#0F172A" strokeWidth="1" strokeDasharray="3 2" />
              <rect x="250" y="66" width="60" height="16" rx="3" fill="#FFFFFF" stroke="#CBD5E1" />
              <text x="280" y="77" textAnchor="middle" fontSize="8.2" fontFamily="monospace" fontWeight="700" fill="#0F172A">
                Δz={labels.elevationLabel}
              </text>
              <text x="286" y="27" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F766E">
                DISCHARGE
              </text>
            </>
          ) : (
            <>
              {!isZeroFlow && (
                <line x1="212" y1="89" x2="262" y2="89" stroke="#FFFFFF" strokeWidth="1.8" markerEnd="url(#flowArrowMobile)" />
              )}
              <text x="286" y="74" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F766E">
                DISCHARGE
              </text>
              <text x="286" y="120" textAnchor="end" fontSize="8.5" fontFamily="monospace" fill="#475569">
                Δz = 0.0 m
              </text>
            </>
          )}

          {/* Pipe Geometry Header */}
          <rect x="64" y="8" width="192" height="18" rx="4" fill="#F8FAFC" stroke="#E2E8F0" />
          <text x="160" y="20" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fontWeight="600" fill="#0F172A">
            D={inputs.diameter_m.toFixed(3)}m · L={inputs.length_m.toFixed(0)}m · ε={inputs.roughness_mm.toFixed(3)}mm
          </text>
        </svg>

        {/* Structured Hydraulic Readouts */}
        <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-2 text-xs">
          {/* 1. Required Pump Head & Power */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              1. Required Pump Head (H)
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900 tabular-nums">
              {labels.pumpHeadLabel}
            </div>
            <div className="mt-1 font-mono text-[11px] text-teal-800 tabular-nums">
              Ps = {labels.shaftPowerLabel} (η = {inputs.pumpEfficiency_pct}%)
            </div>
          </div>

          {/* 2. Frictional Pressure Loss */}
          <div className="rounded-lg border border-rose-200/80 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              2. Hydraulic Losses
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-rose-700 tabular-nums">
              ΔP = {labels.pressureLossLabel}
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-700 tabular-nums">
              hf = {labels.majorLossLabel} · hm = {labels.minorLossLabel}
            </div>
          </div>

          {/* 3. Flow Regime & Darcy Friction */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              3. Pipe-Flow Conditions
            </div>
            <div className={`mt-0.5 text-sm font-bold ${regimeBadgeColor}`}>
              {labels.regimeLabel}
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-700 tabular-nums">
              v = {labels.velocityLabel} · f_D = {labels.frictionFactorLabel}
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              Re = {labels.reynoldsLabel} · ΣK = {inputs.minorLossK.toFixed(1)}
            </div>
          </div>

          {/* 4. Fluid Properties & Elevation */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              4. Fluid &amp; Elevation
            </div>
            <div className="mt-0.5 font-mono text-[11px] font-semibold text-slate-900 tabular-nums">
              Δz = {labels.elevationLabel}
            </div>
            <div className="mt-1 font-mono text-[10px] text-slate-700 tabular-nums">
              Static ΔP_z = {labels.elevationPressureLabel}
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              ρ = {inputs.density_kg_m3.toFixed(0)} kg/m³ · μ = {inputs.viscosity_Pa_s.toFixed(4)} Pa·s
            </div>
          </div>
        </div>

        {/* Optional Toggle for Detailed Desktop Schematic */}
        <button
          type="button"
          onClick={() => setShowDesktopOnMobile((prev) => !prev)}
          aria-expanded={showDesktopOnMobile}
          aria-controls="fluid-mechanics-desktop-schematic"
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

      {/* Tablet & Desktop Full SVG Piping Schematic (>= 640px, or expanded on mobile) */}
      <div
        id="fluid-mechanics-desktop-schematic"
        className={
          showDesktopOnMobile
            ? 'mt-3 sm:mt-0 w-full overflow-x-auto'
            : 'hidden sm:block w-full overflow-x-auto'
        }
        data-testid="fluid-mechanics-schematic"
      >
        <svg
          viewBox="0 0 880 330"
          className="w-full h-auto min-w-[660px] select-none"
          role="img"
          aria-label="Fluid flow piping schematic showing supply tank, centrifugal pump, fittings, straight pipe with optional elevation rise, and pressure-loss summary"
        >
          <defs>
            <pattern id="fluid-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" strokeWidth="1" />
            </pattern>
            <linearGradient id="pipeFluidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>
            <marker
              id="flowArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FFFFFF" />
            </marker>
            <marker
              id="dimArrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
          </defs>

          <rect x="0" y="0" width="880" height="330" fill="url(#fluid-grid)" rx="8" />

          {/* Datum Line z1 = 0 m */}
          <line
            x1="28"
            y1="232"
            x2="852"
            y2="232"
            stroke="#CBD5E1"
            strokeWidth="1.2"
            strokeDasharray="5 4"
          />
          <text x="32" y="246" className="text-[10px] fill-slate-500 font-mono">
            Reference Datum z₁ = 0.0 m (P₁ = P₂ gauge)
          </text>

          {/* Source Fluid Reservoir (Left) */}
          <rect
            x="32"
            y="148"
            width="92"
            height="84"
            rx="4"
            fill="#E0F2FE"
            stroke="#0284C7"
            strokeWidth="2"
          />
          <rect x="34" y="166" width="88" height="64" fill="#BAE6FD" opacity="0.7" />
          <line x1="34" y1="166" x2="122" y2="166" stroke="#0284C7" strokeWidth="1.5" />
          <text
            x="78"
            y="138"
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-700"
          >
            FLUID SOURCE
          </text>
          <text
            x="78"
            y="192"
            textAnchor="middle"
            className="text-[11px] font-mono font-bold fill-slate-900"
          >
            Q = {inputs.flowRate_L_s.toFixed(1)} L/s
          </text>
          <text
            x="78"
            y="208"
            textAnchor="middle"
            className="text-[9px] font-mono fill-slate-700"
          >
            ρ = {inputs.density_kg_m3.toFixed(0)} kg/m³
          </text>
          <text
            x="78"
            y="221"
            textAnchor="middle"
            className="text-[9px] font-mono fill-slate-700"
          >
            μ = {inputs.viscosity_Pa_s.toFixed(4)} Pa·s
          </text>

          {/* Suction Pipe to Pump */}
          <rect
            x="124"
            y="202"
            width="66"
            height="18"
            fill="url(#pipeFluidGrad)"
            stroke="#0F172A"
            strokeWidth="1.5"
          />

          {/* Centrifugal Pump Symbol */}
          <circle
            cx="212"
            cy="206"
            r="26"
            fill="#0F172A"
            stroke="#0D9488"
            strokeWidth="3"
          />
          <polygon points="204,195 225,206 204,217" fill="#14B8A6" />
          <text
            x="212"
            y="170"
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-800"
          >
            PUMP
          </text>
          {/* Pump Power & Head Callout */}
          <rect
            x="148"
            y="256"
            width="132"
            height="58"
            rx="6"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="1.4"
          />
          <text
            x="214"
            y="273"
            textAnchor="middle"
            className="text-[9px] font-bold fill-slate-600"
          >
            REQUIRED HEAD (H)
          </text>
          <text
            x="214"
            y="291"
            textAnchor="middle"
            className="text-[13px] font-mono font-bold fill-slate-900"
          >
            {results.isValid ? `${results.requiredPumpHead_m.toFixed(2)} m` : '—'}
          </text>
          <text
            x="214"
            y="306"
            textAnchor="middle"
            className="text-[9px] font-mono fill-teal-800"
          >
            Ps = {results.isValid ? `${results.shaftPower_kW.toFixed(2)} kW` : '—'} (η=
            {inputs.pumpEfficiency_pct}%)
          </text>

          {/* Main Horizontal Pipe Run */}
          <rect
            x="238"
            y="196"
            width={hasElevation ? 348 : 482}
            height="20"
            fill="url(#pipeFluidGrad)"
            stroke="#0F172A"
            strokeWidth="1.5"
          />

          {/* Flow Direction Arrows inside Pipe */}
          {!isZeroFlow && (
            <>
              <line
                x1="268"
                y1="206"
                x2="322"
                y2="206"
                stroke="#FFFFFF"
                strokeWidth="2"
                markerEnd="url(#flowArrow)"
              />
              <line
                x1="460"
                y1="206"
                x2="516"
                y2="206"
                stroke="#FFFFFF"
                strokeWidth="2"
                markerEnd="url(#flowArrow)"
              />
            </>
          )}

          {/* Representative Fitting 1: Gate / Control Valve */}
          <g transform="translate(362, 188)">
            <polygon
              points="0,0 18,18 0,36"
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth="1.8"
            />
            <polygon
              points="36,0 18,18 36,36"
              fill="#FFFFFF"
              stroke="#0F172A"
              strokeWidth="1.8"
            />
            <line x1="18" y1="18" x2="18" y2="-10" stroke="#0F172A" strokeWidth="2" />
            <line x1="8" y1="-10" x2="28" y2="-10" stroke="#0F172A" strokeWidth="2.5" />
            <text
              x="18"
              y="-18"
              textAnchor="middle"
              className="text-[9px] font-semibold fill-slate-700"
            >
              Fittings &amp; Valves (ΣK = {inputs.minorLossK.toFixed(1)})
            </text>
          </g>

          {/* Optional Elevation Rise Segment */}
          {hasElevation ? (
            <>
              {/* Vertical Riser Pipe */}
              <rect
                x="568"
                y="96"
                width="20"
                height="120"
                fill="url(#pipeFluidGrad)"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              {/* Upper Discharge Pipe */}
              <rect
                x="568"
                y="96"
                width="152"
                height="20"
                fill="url(#pipeFluidGrad)"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              {/* Elbow junction patch */}
              <rect x="569" y="197" width="18" height="18" fill="#0D9488" />
              <rect x="569" y="97" width="18" height="18" fill="#0D9488" />
              {!isZeroFlow && (
                <>
                  <line
                    x1="578"
                    y1="176"
                    x2="578"
                    y2="134"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    markerEnd="url(#flowArrow)"
                  />
                  <line
                    x1="612"
                    y1="106"
                    x2="668"
                    y2="106"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    markerEnd="url(#flowArrow)"
                  />
                </>
              )}
              {/* Elevation Δz dimension line */}
              <line
                x1="704"
                y1="106"
                x2="704"
                y2="232"
                stroke="#0F172A"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <rect
                x="656"
                y="150"
                width="96"
                height="24"
                rx="4"
                fill="#FFFFFF"
                stroke="#CBD5E1"
              />
              <text
                x="704"
                y="166"
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-slate-900"
              >
                Δz = +{inputs.elevationDiff_m.toFixed(1)} m
              </text>
            </>
          ) : (
            !isZeroFlow && (
              <line
                x1="622"
                y1="206"
                x2="678"
                y2="206"
                stroke="#FFFFFF"
                strokeWidth="2"
                markerEnd="url(#flowArrow)"
              />
            )
          )}

          {/* Pipe Geometry & Velocity Dimension Callout */}
          <line
            x1="252"
            y1="142"
            x2="548"
            y2="142"
            stroke="#475569"
            strokeWidth="1.2"
            markerStart="url(#dimArrow)"
            markerEnd="url(#dimArrow)"
          />
          <rect
            x="284"
            y="112"
            width="232"
            height="36"
            rx="5"
            fill="#FFFFFF"
            stroke="#CBD5E1"
          />
          <text
            x="400"
            y="127"
            textAnchor="middle"
            className="text-[10px] font-mono font-semibold fill-slate-900"
          >
            D = {inputs.diameter_m.toFixed(3)} m · L = {inputs.length_m.toFixed(0)} m · ε ={' '}
            {inputs.roughness_mm.toFixed(3)} mm
          </text>
          <text
            x="400"
            y="141"
            textAnchor="middle"
            className="text-[10px] font-mono fill-teal-800 font-bold"
          >
            v = {results.isValid ? `${results.velocity_m_s.toFixed(2)} m/s` : '—'} · f_D ={' '}
            {results.isValid && !isZeroFlow ? results.darcyFrictionFactor.toFixed(4) : '—'}
          </text>

          {/* Discharge Receiver & Pressure-Loss Summary (Right) */}
          <rect
            x="720"
            y={hasElevation ? 62 : 146}
            width="140"
            height="120"
            rx="6"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="1.5"
          />
          <text
            x="790"
            y={(hasElevation ? 62 : 146) + 20}
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-700"
          >
            HYDRAULIC LOSSES
          </text>
          <text
            x="790"
            y={(hasElevation ? 62 : 146) + 41}
            textAnchor="middle"
            className="text-[13px] font-mono font-bold fill-rose-700"
          >
            ΔP = {results.isValid ? `${results.frictionalPressureLoss_kPa.toFixed(2)} kPa` : '—'}
          </text>
          <text
            x="790"
            y={(hasElevation ? 62 : 146) + 60}
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-700"
          >
            Major hf = {results.isValid ? `${results.majorHeadLoss_m.toFixed(2)} m` : '—'}
          </text>
          <text
            x="790"
            y={(hasElevation ? 62 : 146) + 77}
            textAnchor="middle"
            className="text-[10px] font-mono fill-slate-700"
          >
            Minor hm = {results.isValid ? `${results.minorHeadLoss_m.toFixed(2)} m` : '—'}
          </text>
          <text
            x="790"
            y={(hasElevation ? 62 : 146) + 95}
            textAnchor="middle"
            className="text-[9px] font-mono fill-slate-600"
          >
            Elev Δz = {inputs.elevationDiff_m.toFixed(1)} m (
            {results.isValid ? `${results.elevationPressure_kPa.toFixed(1)} kPa` : '—'})
          </text>
          <text
            x="790"
            y={(hasElevation ? 62 : 146) + 111}
            textAnchor="middle"
            className="text-[9px] font-mono font-semibold fill-teal-800"
          >
            Total H = {results.isValid ? `${results.requiredPumpHead_m.toFixed(2)} m` : '—'}
          </text>
        </svg>
      </div>
    </div>
  );
}
