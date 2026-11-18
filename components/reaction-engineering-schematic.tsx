'use client';

import React from 'react';
import {
  ReactionEngineeringInputs,
  ReactionEngineeringResults,
} from '@/lib/reaction-engineering';

interface ReactionSchematicProps {
  inputs: ReactionEngineeringInputs;
  results: ReactionEngineeringResults;
}

export function ReactionEngineeringSchematic({
  inputs,
  results,
}: ReactionSchematicProps) {
  const active = results.activeReactor;
  const isValid = results.isValid;
  const reactorType = inputs.reactorType;

  const titleByReactor =
    reactorType === 'batch'
      ? 'Closed Isothermal Batch Reactor Schematic'
      : reactorType === 'cstr'
      ? 'Ideal Continuous Stirred-Tank Reactor (CSTR) Schematic'
      : 'Ideal Plug Flow Reactor (PFR) Schematic';

  const subtitleByReactor =
    reactorType === 'batch'
      ? 'Closed agitated vessel · No continuous inlet/outlet flow · Uniform concentration CA(t) evolves with reaction time t'
      : reactorType === 'cstr'
      ? 'Steady continuous feed & effluent · Instantaneous backmixing · Uniform vessel concentration equals outlet CA'
      : 'Steady continuous tubular flow · No axial mixing · Axial concentration CA(V) decays exponentially along reactor volume';

  const conversionFraction = isValid ? Math.min(1, Math.max(0, active.conversion)) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{titleByReactor}</h3>
          <p className="text-xs text-slate-600 mt-0.5">{subtitleByReactor}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 font-mono tabular-nums">
          <span>
            {active.timeSymbol} ={' '}
            {isValid ? `${active.characteristicTime_s.toFixed(1)} s` : '—'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Da = {isValid ? active.damkohlerNumber.toFixed(2) : '—'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-teal-800">
            X = {isValid ? `${active.conversion_pct.toFixed(2)}%` : '—'}
          </span>
        </div>
      </div>

      {/* Scope Clarification */}
      <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-800">Reaction Model Scope:</strong> Isothermal,
        constant-density, single-phase irreversible first-order reaction{' '}
        <span className="font-mono font-semibold text-slate-800">A → B</span> with{' '}
        <span className="font-mono font-semibold text-slate-800">−rA = k·CA</span>.{' '}
        {reactorType === 'batch'
          ? 'Reported batch time t represents active reaction duration only (excluding filling, emptying, cleaning, and turnaround).'
          : reactorType === 'cstr'
          ? 'Perfect mixing assumes vessel interior concentration everywhere equals outlet CA (no axial concentration profile).'
          : 'Ideal plug flow assumes flat radial velocity and zero axial dispersion across volume V.'}
      </div>

      {/* Dynamic SVG Schematic */}
      <div
        className="w-full overflow-x-auto"
        data-testid="reaction-engineering-schematic"
      >
        <svg
          viewBox="0 0 880 300"
          className="w-full h-auto min-w-[640px] select-none"
          role="img"
          aria-label={titleByReactor}
        >
          <defs>
            <pattern id="rxn-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F1F5F9" strokeWidth="1" />
            </pattern>
            <linearGradient id="pfrAxialGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0.92" />
            </linearGradient>
            <marker
              id="rxnFlowArrow"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0F172A" />
            </marker>
            <marker
              id="rxnWhiteArrow"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FFFFFF" />
            </marker>
          </defs>

          <rect x="0" y="0" width="880" height="300" fill="url(#rxn-grid)" rx="8" />

          {reactorType === 'batch' && (
            <>
              {/* Closed Batch Vessel */}
              <rect
                x="235"
                y="62"
                width="260"
                height="190"
                rx="18"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="2.5"
              />
              {/* Liquid Volume Fill inside Closed Vessel */}
              <rect
                x="239"
                y="108"
                width="252"
                height="140"
                rx="14"
                fill={conversionFraction > 0.5 ? '#CCFBF1' : '#E0F2FE'}
                stroke={conversionFraction > 0.5 ? '#0D9488' : '#0284C7'}
                strokeWidth="1.5"
              />
              {/* Top Closure Cap (No continuous streams) */}
              <rect
                x="325"
                y="46"
                width="80"
                height="16"
                rx="4"
                fill="#0F172A"
              />
              {/* Impeller Shaft & Blades */}
              <line
                x1="365"
                y1="46"
                x2="365"
                y2="210"
                stroke="#334155"
                strokeWidth="3"
              />
              <rect x="315" y="198" width="100" height="10" rx="4" fill="#0F172A" />
              <rect x="330" y="156" width="70" height="8" rx="3" fill="#334155" />

              {/* Left Initial Charge Box */}
              <rect
                x="28"
                y="88"
                width="172"
                height="112"
                rx="8"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <text
                x="44"
                y="112"
                className="text-[10px] font-bold fill-slate-600"
              >
                INITIAL CHARGE (t = 0 s)
              </text>
              <text
                x="44"
                y="136"
                className="text-[12px] font-mono font-bold fill-sky-800"
              >
                CA0 = {inputs.initialConcentration_mol_m3.toFixed(1)} mol/m³
              </text>
              <text
                x="44"
                y="156"
                className="text-[11px] font-mono fill-slate-700"
              >
                V = {inputs.reactorVolume_m3.toFixed(2)} m³
              </text>
              <text
                x="44"
                y="175"
                className="text-[11px] font-mono fill-slate-700"
              >
                k = {inputs.rateConstant_per_s.toFixed(4)} s⁻¹
              </text>
              <text
                x="44"
                y="191"
                className="text-[10px] fill-slate-500"
              >
                Closed vessel (q = 0)
              </text>

              {/* Vessel Interior Labels */}
              <text
                x="365"
                y="86"
                textAnchor="middle"
                className="text-[11px] font-bold fill-slate-800"
              >
                BATCH VESSEL · A → B
              </text>
              <text
                x="365"
                y="136"
                textAnchor="middle"
                className="text-[12px] font-mono font-bold fill-slate-900"
              >
                Reaction Time t = {inputs.batchTime_s.toFixed(1)} s
              </text>

              {/* Right State Readout Box */}
              <rect
                x="536"
                y="72"
                width="312"
                height="168"
                rx="8"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.6"
              />
              <text
                x="554"
                y="96"
                className="text-[10px] font-bold fill-slate-600"
              >
                BATCH STATE AT REACTION TIME t
              </text>
              <text
                x="554"
                y="122"
                className="text-[14px] font-mono font-bold fill-teal-800"
              >
                X(t) = {isValid ? `${active.conversion_pct.toFixed(2)} %` : '—'}
              </text>
              <text
                x="554"
                y="146"
                className="text-[12px] font-mono font-semibold fill-slate-900"
              >
                CA(t) ={' '}
                {isValid ? `${active.outletConcentration_mol_m3.toFixed(2)} mol/m³` : '—'}
              </text>
              <text
                x="554"
                y="168"
                className="text-[11px] font-mono fill-slate-700"
              >
                −rA(t) ={' '}
                {isValid ? `${active.reactionRate_mol_m3_s.toFixed(3)} mol/(m³·s)` : '—'}
              </text>
              <text
                x="554"
                y="190"
                className="text-[11px] font-mono fill-slate-700"
              >
                Moles Converted ={' '}
                {isValid && active.molesConverted_mol !== null
                  ? `${active.molesConverted_mol.toFixed(1)} mol`
                  : '—'}
              </text>
              <text
                x="554"
                y="214"
                className="text-[10px] fill-slate-500"
              >
                Excludes filling, emptying &amp; cleaning turnaround
              </text>
            </>
          )}

          {reactorType === 'cstr' && (
            <>
              {/* Feed Pipe */}
              <rect
                x="44"
                y="132"
                width="210"
                height="16"
                fill="#BAE6FD"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line
                x1="78"
                y1="140"
                x2="214"
                y2="140"
                stroke="#0F172A"
                strokeWidth="2"
                markerEnd="url(#rxnFlowArrow)"
              />

              {/* Feed Callout */}
              <rect
                x="32"
                y="56"
                width="196"
                height="62"
                rx="6"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <text x="44" y="76" className="text-[10px] font-bold fill-slate-600">
                CONTINUOUS FEED INLET
              </text>
              <text x="44" y="95" className="text-[11px] font-mono font-bold fill-sky-800">
                CA0 = {inputs.initialConcentration_mol_m3.toFixed(1)} mol/m³
              </text>
              <text x="44" y="110" className="text-[11px] font-mono fill-slate-700">
                q = {inputs.volumetricFlowRate_m3_s.toFixed(4)} m³/s
              </text>

              {/* CSTR Tank */}
              <rect
                x="254"
                y="62"
                width="250"
                height="190"
                rx="14"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="2.5"
              />
              {/* Uniform Mixed Liquid (matches outlet CA) */}
              <rect
                x="258"
                y="100"
                width="242"
                height="148"
                rx="10"
                fill="#CCFBF1"
                stroke="#0D9488"
                strokeWidth="1.5"
              />
              {/* Agitator */}
              <rect x="348" y="46" width="62" height="16" rx="4" fill="#0F172A" />
              <line
                x1="379"
                y1="46"
                x2="379"
                y2="212"
                stroke="#334155"
                strokeWidth="3"
              />
              <rect x="328" y="196" width="102" height="10" rx="4" fill="#0F172A" />
              <rect x="342" y="154" width="74" height="8" rx="3" fill="#334155" />

              {/* Uniform Interior Labels */}
              <text
                x="379"
                y="84"
                textAnchor="middle"
                className="text-[11px] font-bold fill-slate-900"
              >
                IDEAL CSTR (UNIFORM MIXING)
              </text>
              <text
                x="379"
                y="124"
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-teal-900"
              >
                V = {inputs.reactorVolume_m3.toFixed(2)} m³ · τ ={' '}
                {isValid ? `${active.characteristicTime_s.toFixed(1)} s` : '—'}
              </text>
              <text
                x="379"
                y="144"
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-700"
              >
                Uniform CA = CA,out everywhere
              </text>

              {/* Outlet Pipe */}
              <rect
                x="504"
                y="186"
                width="126"
                height="16"
                fill="#99F6E4"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line
                x1="528"
                y1="194"
                x2="608"
                y2="194"
                stroke="#0F172A"
                strokeWidth="2"
                markerEnd="url(#rxnFlowArrow)"
              />

              {/* Outlet Readout Box */}
              <rect
                x="630"
                y="72"
                width="224"
                height="168"
                rx="8"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.6"
              />
              <text x="646" y="96" className="text-[10px] font-bold fill-slate-600">
                STEADY CSTR EFFLUENT
              </text>
              <text x="646" y="122" className="text-[14px] font-mono font-bold fill-teal-800">
                X = {isValid ? `${active.conversion_pct.toFixed(2)} %` : '—'}
              </text>
              <text x="646" y="146" className="text-[12px] font-mono font-semibold fill-slate-900">
                CA = {isValid ? `${active.outletConcentration_mol_m3.toFixed(2)} mol/m³` : '—'}
              </text>
              <text x="646" y="168" className="text-[11px] font-mono fill-slate-700">
                −rA = {isValid ? `${active.reactionRate_mol_m3_s.toFixed(3)} mol/(m³·s)` : '—'}
              </text>
              <text x="646" y="190" className="text-[11px] font-mono fill-slate-700">
                ΔFA ={' '}
                {isValid && active.molarFlowConverted_mol_s !== null
                  ? `${active.molarFlowConverted_mol_s.toFixed(2)} mol/s`
                  : '—'}
              </text>
              <text x="646" y="214" className="text-[10px] fill-slate-500">
                Operating at outlet rate −rA(CA,out)
              </text>
            </>
          )}

          {reactorType === 'pfr' && (
            <>
              {/* Feed Pipe */}
              <rect
                x="28"
                y="142"
                width="180"
                height="16"
                fill="#BAE6FD"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line
                x1="54"
                y1="150"
                x2="188"
                y2="150"
                stroke="#0F172A"
                strokeWidth="2"
                markerEnd="url(#rxnFlowArrow)"
              />

              {/* Feed Callout */}
              <rect
                x="24"
                y="54"
                width="170"
                height="70"
                rx="6"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <text x="36" y="74" className="text-[10px] font-bold fill-slate-600">
                PFR INLET (V = 0 m³)
              </text>
              <text x="36" y="94" className="text-[11px] font-mono font-bold fill-sky-800">
                CA0 = {inputs.initialConcentration_mol_m3.toFixed(1)} mol/m³
              </text>
              <text x="36" y="112" className="text-[11px] font-mono fill-slate-700">
                q = {inputs.volumetricFlowRate_m3_s.toFixed(4)} m³/s
              </text>

              {/* Tubular PFR Body with Axial Gradient */}
              <rect
                x="208"
                y="102"
                width="362"
                height="96"
                rx="12"
                fill="url(#pfrAxialGrad)"
                stroke="#0F172A"
                strokeWidth="2.5"
              />
              {/* Plug-Flow Velocity Fronts */}
              <line
                x1="286"
                y1="106"
                x2="286"
                y2="194"
                stroke="#FFFFFF"
                strokeOpacity="0.4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="389"
                y1="106"
                x2="389"
                y2="194"
                stroke="#FFFFFF"
                strokeOpacity="0.4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1="492"
                y1="106"
                x2="492"
                y2="194"
                stroke="#FFFFFF"
                strokeOpacity="0.4"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Plug Flow Arrows */}
              <line
                x1="230"
                y1="150"
                x2="312"
                y2="150"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                markerEnd="url(#rxnWhiteArrow)"
              />
              <line
                x1="348"
                y1="150"
                x2="430"
                y2="150"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                markerEnd="url(#rxnWhiteArrow)"
              />
              <line
                x1="464"
                y1="150"
                x2="546"
                y2="150"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                markerEnd="url(#rxnWhiteArrow)"
              />

              {/* Tube Title & Volume Axis Callout */}
              <text
                x="389"
                y="84"
                textAnchor="middle"
                className="text-[11px] font-bold fill-slate-900"
              >
                IDEAL PLUG FLOW REACTOR (CA0 → CA(V) AXIAL GRADIENT)
              </text>
              <rect
                x="249"
                y="214"
                width="280"
                height="48"
                rx="6"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.3"
              />
              <text
                x="389"
                y="234"
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-slate-900"
              >
                V = {inputs.reactorVolume_m3.toFixed(2)} m³ · τ ={' '}
                {isValid ? `${active.characteristicTime_s.toFixed(1)} s` : '—'}
              </text>
              <text
                x="389"
                y="251"
                textAnchor="middle"
                className="text-[10px] font-mono fill-teal-800"
              >
                CA(V) = CA0·exp(−k·V/q) · k = {inputs.rateConstant_per_s.toFixed(4)} s⁻¹
              </text>

              {/* Outlet Pipe */}
              <rect
                x="570"
                y="142"
                width="62"
                height="16"
                fill="#99F6E4"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <line
                x1="582"
                y1="150"
                x2="622"
                y2="150"
                stroke="#0F172A"
                strokeWidth="2"
                markerEnd="url(#rxnFlowArrow)"
              />

              {/* Outlet Readout Box */}
              <rect
                x="632"
                y="64"
                width="222"
                height="168"
                rx="8"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.6"
              />
              <text x="648" y="88" className="text-[10px] font-bold fill-slate-600">
                PFR OUTLET (V = {inputs.reactorVolume_m3.toFixed(2)} m³)
              </text>
              <text x="648" y="114" className="text-[14px] font-mono font-bold fill-teal-800">
                X = {isValid ? `${active.conversion_pct.toFixed(2)} %` : '—'}
              </text>
              <text x="648" y="138" className="text-[12px] font-mono font-semibold fill-slate-900">
                CA,out ={' '}
                {isValid ? `${active.outletConcentration_mol_m3.toFixed(2)} mol/m³` : '—'}
              </text>
              <text x="648" y="160" className="text-[11px] font-mono fill-slate-700">
                −rA,out ={' '}
                {isValid ? `${active.reactionRate_mol_m3_s.toFixed(3)} mol/(m³·s)` : '—'}
              </text>
              <text x="648" y="182" className="text-[11px] font-mono fill-slate-700">
                ΔFA ={' '}
                {isValid && active.molarFlowConverted_mol_s !== null
                  ? `${active.molarFlowConverted_mol_s.toFixed(2)} mol/s`
                  : '—'}
              </text>
              <text x="648" y="206" className="text-[10px] fill-slate-500">
                Continuous axial conversion profile
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
