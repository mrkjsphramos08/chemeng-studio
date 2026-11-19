'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ReactionEngineeringInputs,
  ReactionEngineeringResults,
} from '@/lib/reaction-engineering';
import { formatReactionMobileLabels } from '@/lib/schematic-formatting';

interface ReactionSchematicProps {
  inputs: ReactionEngineeringInputs;
  results: ReactionEngineeringResults;
}

export function ReactionEngineeringSchematic({
  inputs,
  results,
}: ReactionSchematicProps) {
  const [showDesktopOnMobile, setShowDesktopOnMobile] = useState(false);
  const active = results.activeReactor;
  const isValid = results.isValid;
  const reactorType = inputs.reactorType;
  const labels = formatReactionMobileLabels(inputs, results);

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
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 sm:gap-4 mb-3 pb-3 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{titleByReactor}</h3>
          <p className="text-xs text-slate-600 mt-0.5">{subtitleByReactor}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-700 font-mono tabular-nums">
          <span>{labels.characteristicTimeLabel}</span>
          <span aria-hidden="true">·</span>
          <span>Da = {labels.damkohlerLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold text-teal-800">X = {labels.conversionLabel}</span>
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

      {/* Mobile Reactor-Specific Schematic (< 640px) — Dynamically Switches Between Batch, CSTR, and PFR */}
      <div
        className="sm:hidden rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-3"
        data-testid="reaction-engineering-mobile-schematic"
        data-reactor-type={reactorType}
        role="region"
        aria-label={`${titleByReactor}: ${labels.modeTag}, conversion X = ${labels.conversionLabel}, ${labels.characteristicTimeLabel}, Damkohler number Da = ${labels.damkohlerLabel}.`}
      >
        {/* Compact Responsive Vector Diagram per Reactor Mode */}
        <svg
          viewBox="0 0 320 134"
          className="w-full h-auto select-none"
          role="img"
          aria-label={titleByReactor}
        >
          <defs>
            <linearGradient id="pfrAxialGradMobile" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0.94" />
            </linearGradient>
            <marker
              id="rxnFlowArrowMobile"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0F172A" />
            </marker>
            <marker
              id="rxnWhiteArrowMobile"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FFFFFF" />
            </marker>
          </defs>

          <rect x="0" y="0" width="320" height="134" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

          {reactorType === 'batch' && (
            <>
              {/* Closed Batch Vessel — Explicitly NO Inlet/Outlet Pipes */}
              <rect x="108" y="24" width="104" height="88" rx="12" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
              <rect
                x="111"
                y="48"
                width="98"
                height="61"
                rx="9"
                fill={conversionFraction > 0.5 ? '#CCFBF1' : '#E0F2FE'}
                stroke={conversionFraction > 0.5 ? '#0D9488' : '#0284C7'}
                strokeWidth="1.2"
              />
              {/* Sealed Closure Cap */}
              <rect x="142" y="15" width="36" height="9" rx="3" fill="#0F172A" />
              {/* Impeller Shaft & Blades */}
              <line x1="160" y1="15" x2="160" y2="92" stroke="#334155" strokeWidth="2.2" />
              <rect x="138" y="86" width="44" height="6" rx="2.5" fill="#0F172A" />
              <rect x="144" y="68" width="32" height="5" rx="2" fill="#334155" />
              <rect x="120" y="29" width="80" height="13" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
              <text x="160" y="39" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0F172A">
                CLOSED BATCH
              </text>
              <rect
                x="122"
                y="51"
                width="76"
                height="13"
                rx="3"
                fill={conversionFraction > 0.5 ? '#CCFBF1' : '#E0F2FE'}
                fillOpacity="0.96"
              />
              <text x="160" y="61" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fontWeight="700" fill="#0F172A">
                t = {inputs.batchTime_s.toFixed(1)} s
              </text>

              {/* Left Sealed-System Callout */}
              <text x="54" y="54" textAnchor="middle" fontSize="8.2" fontWeight="700" fill="#475569">
                NO FLOW
              </text>
              <text x="54" y="68" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill="#0F766E">
                q = 0 m³/s
              </text>
              <text x="54" y="82" textAnchor="middle" fontSize="8" fill="#64748B">
                Closed Charge
              </text>

              {/* Right Conversion Readout */}
              <text x="266" y="54" textAnchor="middle" fontSize="8.2" fontWeight="700" fill="#475569">
                REACTION A → B
              </text>
              <text x="266" y="70" textAnchor="middle" fontSize="10.5" fontFamily="monospace" fontWeight="700" fill="#0F766E">
                X = {labels.conversionLabel}
              </text>
              <text x="266" y="84" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#334155">
                Da = {labels.damkohlerLabel}
              </text>

              <text x="160" y="125" textAnchor="middle" fontSize="8.2" fill="#64748B">
                Uniform agitated batch · CA(t) = CA0·exp(−k·t)
              </text>
            </>
          )}

          {reactorType === 'cstr' && (
            <>
              {/* Feed Pipe Entering Left */}
              <rect x="14" y="54" width="88" height="12" fill="#BAE6FD" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="24" y1="60" x2="90" y2="60" stroke="#0F172A" strokeWidth="1.6" markerEnd="url(#rxnFlowArrowMobile)" />
              <text x="54" y="46" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0369A1">
                FEED CA0, q
              </text>

              {/* Mixed Tank */}
              <rect x="102" y="24" width="116" height="86" rx="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
              <rect x="105" y="44" width="110" height="63" rx="7" fill="#CCFBF1" stroke="#0D9488" strokeWidth="1.2" />
              {/* Agitator */}
              <rect x="144" y="15" width="32" height="9" rx="3" fill="#0F172A" />
              <line x1="160" y1="15" x2="160" y2="92" stroke="#334155" strokeWidth="2.2" />
              <rect x="136" y="86" width="48" height="6" rx="2.5" fill="#0F172A" />
              <rect x="142" y="67" width="36" height="5" rx="2" fill="#334155" />

              <rect x="124" y="28" width="72" height="13" rx="3" fill="#FFFFFF" fillOpacity="0.95" />
              <text x="160" y="38" textAnchor="middle" fontSize="8.2" fontWeight="700" fill="#0F172A">
                IDEAL CSTR
              </text>
              <rect x="122" y="48" width="76" height="13" rx="3" fill="#CCFBF1" fillOpacity="0.96" />
              <text x="160" y="58" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="700" fill="#0F766E">
                CA = CA,out
              </text>

              {/* Effluent Pipe Exiting Right */}
              <rect x="218" y="82" width="88" height="12" fill="#99F6E4" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="228" y1="88" x2="296" y2="88" stroke="#0F172A" strokeWidth="1.6" markerEnd="url(#rxnFlowArrowMobile)" />
              <text x="266" y="74" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F766E">
                EFFLUENT
              </text>
              <text x="266" y="106" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fontWeight="700" fill="#0F766E">
                X = {labels.conversionLabel}
              </text>

              <text x="160" y="125" textAnchor="middle" fontSize="8.2" fontFamily="monospace" fill="#334155">
                V = {inputs.reactorVolume_m3.toFixed(2)} m³ · {labels.characteristicTimeLabel} · Instant Backmixing
              </text>
            </>
          )}

          {reactorType === 'pfr' && (
            <>
              {/* Feed Pipe */}
              <rect x="12" y="61" width="54" height="12" fill="#BAE6FD" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="18" y1="67" x2="58" y2="67" stroke="#0F172A" strokeWidth="1.6" markerEnd="url(#rxnFlowArrowMobile)" />
              <text x="38" y="53" textAnchor="middle" fontSize="7.6" fontWeight="700" fill="#0369A1">
                INLET (V=0)
              </text>

              {/* Tubular PFR Body */}
              <rect x="66" y="42" width="188" height="50" rx="8" fill="url(#pfrAxialGradMobile)" stroke="#0F172A" strokeWidth="2" />
              {[112, 160, 208].map((xPos) => (
                <line
                  key={xPos}
                  x1={xPos}
                  y1="45"
                  x2={xPos}
                  y2="89"
                  stroke="#FFFFFF"
                  strokeOpacity="0.45"
                  strokeWidth="1.3"
                  strokeDasharray="3 3"
                />
              ))}
              <line x1="78" y1="67" x2="122" y2="67" stroke="#FFFFFF" strokeWidth="1.8" markerEnd="url(#rxnWhiteArrowMobile)" />
              <line x1="138" y1="67" x2="182" y2="67" stroke="#FFFFFF" strokeWidth="1.8" markerEnd="url(#rxnWhiteArrowMobile)" />
              <line x1="198" y1="67" x2="242" y2="67" stroke="#FFFFFF" strokeWidth="1.8" markerEnd="url(#rxnWhiteArrowMobile)" />

              <text x="160" y="33" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0F172A">
                PLUG FLOW TUBE · CA0 → CA(V) AXIAL DECAY
              </text>

              {/* Outlet Pipe */}
              <rect x="254" y="61" width="54" height="12" fill="#99F6E4" stroke="#0F172A" strokeWidth="1.2" />
              <line x1="260" y1="67" x2="300" y2="67" stroke="#0F172A" strokeWidth="1.6" markerEnd="url(#rxnFlowArrowMobile)" />
              <text x="282" y="53" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F766E">
                OUTLET
              </text>
              <text x="282" y="86" textAnchor="middle" fontSize="8.5" fontFamily="monospace" fontWeight="700" fill="#0F766E">
                X={labels.conversionLabel}
              </text>

              <text x="160" y="114" textAnchor="middle" fontSize="8.2" fontFamily="monospace" fill="#334155">
                V = {inputs.reactorVolume_m3.toFixed(2)} m³ · {labels.characteristicTimeLabel} · k = {inputs.rateConstant_per_s.toFixed(4)} s⁻¹
              </text>
              <text x="160" y="126" textAnchor="middle" fontSize="8" fill="#64748B">
                Zero axial dispersion · CA(V) = CA0·exp(−k·V/q)
              </text>
            </>
          )}
        </svg>

        {/* Reactor State Readout Cards */}
        <div className="grid grid-cols-1 min-[350px]:grid-cols-2 gap-2 text-xs">
          {/* Card 1: Feed / Initial Charge */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {reactorType === 'batch'
                ? 'Initial Charge (t = 0 s)'
                : reactorType === 'cstr'
                  ? 'Continuous Feed Inlet'
                  : 'PFR Inlet (V = 0 m³)'}
            </div>
            <div className="mt-1 font-mono text-[11px] font-bold text-sky-800 tabular-nums">
              CA0 = {inputs.initialConcentration_mol_m3.toFixed(1)} mol/m³
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-slate-700 tabular-nums">
              {reactorType === 'batch'
                ? `V = ${inputs.reactorVolume_m3.toFixed(2)} m³ · q = 0`
                : `q = ${inputs.volumetricFlowRate_m3_s.toFixed(4)} m³/s · V = ${inputs.reactorVolume_m3.toFixed(2)} m³`}
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              k = {inputs.rateConstant_per_s.toFixed(4)} s⁻¹ · {labels.characteristicTimeLabel}
            </div>
          </div>

          {/* Card 2: Reaction Output / State */}
          <div className="rounded-lg border border-teal-200 bg-white p-2.5 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {reactorType === 'batch'
                ? `Batch State (t = ${inputs.batchTime_s.toFixed(1)} s)`
                : reactorType === 'cstr'
                  ? 'Steady CSTR Effluent'
                  : `PFR Outlet (V = ${inputs.reactorVolume_m3.toFixed(2)} m³)`}
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-teal-800 tabular-nums">
              X = {labels.conversionLabel}
            </div>
            <div className="mt-0.5 font-mono text-[11px] font-semibold text-slate-900 tabular-nums">
              CA = {labels.outletConcLabel}
            </div>
            <div className="font-mono text-[10px] text-slate-700 tabular-nums">
              −rA = {labels.rateLabel}
            </div>
            <div className="font-mono text-[10px] text-slate-600 tabular-nums">
              {reactorType === 'batch' ? 'Moles Conv.' : 'ΔFA'} = {labels.convertedAmountLabel}
            </div>
          </div>
        </div>

        {/* Optional Detailed Desktop Blueprint Toggle */}
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

      {/* Tablet & Desktop Full SVG Schematic (>= 640px, or expanded on mobile) */}
      <div
        className={
          showDesktopOnMobile
            ? 'mt-3 sm:mt-0 w-full overflow-x-auto'
            : 'hidden sm:block w-full overflow-x-auto'
        }
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
