'use client';

import React from 'react';
import {
  FluidMechanicsInputs,
  FluidMechanicsResults,
} from '@/lib/fluid-mechanics';

interface SchematicProps {
  inputs: FluidMechanicsInputs;
  results: FluidMechanicsResults;
}

export function FluidMechanicsSchematic({ inputs, results }: SchematicProps) {
  const hasElevation = inputs.elevationDiff_m > 0;
  const isZeroFlow = results.isValid && results.flowRegime === 'Zero Flow';

  const regimeBadgeColor =
    results.flowRegime === 'Turbulent'
      ? 'text-teal-800'
      : results.flowRegime === 'Laminar'
      ? 'text-sky-800'
      : results.flowRegime === 'Transitional'
      ? 'text-amber-800'
      : 'text-slate-600';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Incompressible Pipe Flow &amp; Pumping Hydraulics Schematic
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Source reservoir → pump head addition → straight pipe (major loss hf) &amp; fittings (minor loss hm) → discharge
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 font-mono tabular-nums">
          <span>
            v = {results.isValid ? `${results.velocity_m_s.toFixed(2)} m/s` : '—'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Re = {results.isValid ? Math.round(results.reynoldsNumber).toLocaleString() : '—'}
          </span>
          <span aria-hidden="true">·</span>
          <span className={`font-semibold ${regimeBadgeColor}`}>
            {results.isValid ? results.flowRegime : 'Invalid'}
          </span>
        </div>
      </div>

      {/* Scope Clarification */}
      <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-800">Hydraulic Model Scope:</strong> Assumes steady,
        incompressible, isothermal single-phase flow with equal inlet and outlet gauge pressures
        (P₁ = P₂) and elevation change Δz ≥ 0 m. Centrifugal pump H–Q performance curves and
        NPSH cavitation margins are outside Phase 1.2 scope.
      </div>

      {/* SVG Piping Schematic */}
      <div className="w-full overflow-x-auto" data-testid="fluid-mechanics-schematic">
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
