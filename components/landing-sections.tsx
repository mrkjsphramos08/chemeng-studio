'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Layers,
  FlaskConical,
  Gauge,
  Waves,
  Sliders,
  Compass,
  GraduationCap,
  BookOpen,
  Sparkles,
  Cpu,
  Building2,
} from 'lucide-react';
import { LABORATORY_MODULES, DEVELOPMENT_ROADMAP, LabModule } from '@/lib/labs-data';
import { ActiveView } from './navbar';
import { MathBlock, MathInline } from '@/components/lab-shared';
import { EntrolumeLogo } from './entrolume-logo';

interface LandingSectionsProps {
  onOpenLab: (labId?: string) => void;
  onOpenDirectory: () => void;
}

const HERO_PREVIEW_LABS: {
  id: ActiveView;
  code: string;
  shortTitle: string;
  domain: string;
  presetName: string;
  equationLatex: string;
  metrics: { label: string; value: string; sub: string; accent: string }[];
  conservationNote: string;
}[] = [
  {
    id: 'heat-exchanger',
    code: 'LAB 01',
    shortTitle: 'Heat Exchanger',
    domain: 'Countercurrent ε–NTU Thermal Analysis',
    presetName: 'Baseline Water–Water (A = 12.0 m², U = 850 W/m²·K)',
    equationLatex:
      '\\varepsilon = \\frac{1 - \\exp\\left[-\\mathrm{NTU}(1 - C_r)\\right]}{1 - C_r \\exp\\left[-\\mathrm{NTU}(1 - C_r)\\right]}',
    metrics: [
      { label: 'Heat Duty (Q)', value: '397.59 kW', sub: 'Q_max = 595.65 kW', accent: 'text-white' },
      { label: 'Effectiveness (ε)', value: '66.75%', sub: 'NTU = 1.627 · C_r = 0.750', accent: 'text-teal-300' },
      { label: 'Hot Outlet (T_h,out)', value: '72.44 °C', sub: 'Inlet: 120.0 °C', accent: 'text-rose-300' },
      { label: 'Cold Outlet (T_c,out)', value: '88.41 °C', sub: 'Temperature Cross Active', accent: 'text-sky-300' },
    ],
    conservationNote: 'First Law Verified: |Q_h − Q_c| < 10⁻¹² W',
  },
  {
    id: 'fluid-mechanics',
    code: 'LAB 02',
    shortTitle: 'Fluid Mechanics',
    domain: 'Darcy–Weisbach & Colebrook–White Hydraulics',
    presetName: 'Commercial Steel Pipe (Q = 25.0 L/s, D = 0.10 m, L = 120 m)',
    equationLatex:
      'h_f = f_D \\frac{L}{D} \\frac{v^2}{2g}, \\quad \\frac{1}{\\sqrt{f_D}} = -2.0\\log_{10}\\!\\left(\\frac{\\varepsilon/D}{3.7} + \\frac{2.51}{\\mathrm{Re}\\sqrt{f_D}}\\right)',
    metrics: [
      { label: 'Reynolds Number (Re)', value: '317,831', sub: 'Turbulent Flow Regime', accent: 'text-teal-300' },
      { label: 'Darcy Friction (f_D)', value: '0.01800', sub: 'ε/D = 0.00045', accent: 'text-white' },
      { label: 'Total Friction Loss', value: '14.51 m', sub: 'ΔP_f = 142.1 kPa', accent: 'text-amber-300' },
      { label: 'Required Pump Head', value: '29.51 m', sub: 'P_shaft = 9.63 kW (η = 75%)', accent: 'text-sky-300' },
    ],
    conservationNote: 'Colebrook–White Residual: < 10⁻¹²',
  },
  {
    id: 'reaction-engineering',
    code: 'LAB 03',
    shortTitle: 'Reaction Eng.',
    domain: 'Isothermal First-Order Reactor Design (A → B)',
    presetName: 'CSTR vs. PFR Comparison (k = 0.15 s⁻¹, τ = 10.0 s)',
    equationLatex:
      'X_{\\mathrm{PFR}} = 1 - e^{-\\mathrm{Da}}, \\quad X_{\\mathrm{CSTR}} = \\frac{\\mathrm{Da}}{1 + \\mathrm{Da}}, \\quad \\mathrm{Da} = k\\tau',
    metrics: [
      { label: 'Damköhler Number (Da)', value: '1.500', sub: 'k = 0.15 s⁻¹ · τ = 10.0 s', accent: 'text-white' },
      { label: 'PFR Conversion (X_PFR)', value: '77.69%', sub: 'C_A,out = 22.31 mol/m³', accent: 'text-teal-300' },
      { label: 'CSTR Conversion (X_CSTR)', value: '60.00%', sub: 'C_A,out = 40.00 mol/m³', accent: 'text-amber-300' },
      { label: 'Volume Ratio (V_CSTR/V_PFR)', value: '2.26×', sub: 'At X_target = 80%', accent: 'text-sky-300' },
    ],
    conservationNote: 'Exact Analytical Mole Balance Solution',
  },
  {
    id: 'distillation',
    code: 'LAB 04',
    shortTitle: 'Distillation',
    domain: 'Binary McCabe–Thiele Equilibrium Stage Stepping',
    presetName: 'Saturated Liquid Feed (α = 2.50, z_F = 0.50, x_D = 0.95, x_B = 0.05)',
    equationLatex:
      'y^* = \\frac{\\alpha x}{1 + (\\alpha - 1)x}, \\quad y_{\\mathrm{ROL}} = \\frac{R}{R+1}x + \\frac{x_D}{R+1}',
    metrics: [
      { label: 'Theoretical Stages (N)', value: '12 Stages', sub: '11 Trays + Partial Reboiler', accent: 'text-teal-300' },
      { label: 'Optimal Feed Stage', value: 'Stage 6', sub: 'From top condenser', accent: 'text-white' },
      { label: 'Minimum Reflux (R_min)', value: '1.169', sub: 'Operating R = 1.80 (1.54× R_min)', accent: 'text-amber-300' },
      { label: 'Distillate / Bottoms', value: '50.0 / 50.0', sub: 'kmol/h (F = 100 kmol/h)', accent: 'text-sky-300' },
    ],
    conservationNote: 'Component & Overall Molar Balance Verified',
  },
  {
    id: 'thermodynamics',
    code: 'LAB 05',
    shortTitle: 'Thermodynamics',
    domain: 'Peng–Robinson EOS & Binary Raoult–Dalton VLE',
    presetName: 'Carbon Dioxide Near-Critical Compression (T = 320 K, P = 60 bar)',
    equationLatex:
      'Z^3 - (1 - B)Z^2 + (A - 2B - 3B^2)Z - (AB - B^2 - B^3) = 0',
    metrics: [
      { label: 'PR Compressibility (Z)', value: '0.7016', sub: 'Ideal Z = 1.0000', accent: 'text-teal-300' },
      { label: 'PR Molar Volume (v_PR)', value: '0.3111 L/mol', sub: 'v_ideal = 0.4434 L/mol', accent: 'text-white' },
      { label: 'Ideal-Gas Deviation', value: '−29.84%', sub: 'Attractive forces dominate', accent: 'text-amber-300' },
      { label: 'Reduced State (T_r, P_r)', value: '1.052, 0.813', sub: 'Supercritical Fluid Regime', accent: 'text-sky-300' },
    ],
    conservationNote: 'NIST Reference Constants (CO₂, N₂, CH₄, C₂H₆)',
  },
  {
    id: 'process-control',
    code: 'LAB 06',
    shortTitle: 'Process Control',
    domain: 'SISO FOPDT Dynamics & PID Feedback Control',
    presetName: 'Balanced PI Control (K_p = 1.2, τ = 20 s, θ = 4 s, K_c = 1.8, τ_I = 18 s)',
    equationLatex:
      '\\tau \\frac{dy(t)}{dt} + y(t) = K_p u(t - \\theta), \\quad u(t) = U_0 + K_c\\!\\left[e(t) + \\frac{1}{\\tau_I}\\int_0^t e(\\tau)\\,d\\tau\\right]',
    metrics: [
      { label: 'Steady-State Error (e_ss)', value: '0.00 % PV', sub: 'Integral action eliminates offset', accent: 'text-teal-300' },
      { label: '10–90% Rise Time (t_r)', value: '12.40 s', sub: 'Setpoint step +15% PV', accent: 'text-white' },
      { label: 'Peak Overshoot', value: '8.25%', sub: 'Well-damped closed-loop response', accent: 'text-sky-300' },
      { label: 'Controllability (θ/τ)', value: '0.200', sub: 'Anti-windup clamping active', accent: 'text-amber-300' },
    ],
    conservationNote: 'Exact ZOH Step with Fractional Dead-Time Interpolation',
  },
];

function getModuleIcon(iconName: LabModule['iconName']) {
  switch (iconName) {
    case 'flame':
      return <Flame className="w-5 h-5 text-teal-700" />;
    case 'layers':
      return <Layers className="w-5 h-5 text-teal-700" />;
    case 'flask':
      return <FlaskConical className="w-5 h-5 text-teal-700" />;
    case 'gauge':
      return <Gauge className="w-5 h-5 text-teal-700" />;
    case 'waves':
      return <Waves className="w-5 h-5 text-teal-700" />;
    case 'sliders':
      return <Sliders className="w-5 h-5 text-teal-700" />;
  }
}

export function LandingSections({ onOpenLab, onOpenDirectory }: LandingSectionsProps) {
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const activePreview = HERO_PREVIEW_LABS[selectedPreviewIndex];

  const historicalMilestones = DEVELOPMENT_ROADMAP.filter(
    (stage) => stage.status === 'Implemented' || stage.status === 'Current Phase'
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 lg:space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-12 lg:pt-12 lg:pb-16 border-b border-slate-200/80 bg-gradient-to-b from-white via-white to-[#F8FAFC] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_55%,transparent_100%)] opacity-45"
        />

        <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Entrolume Brand Positioning & Primary Actions */}
            <div className="lg:col-span-6 space-y-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                Entrolume · Explore. Simulate. Understand.
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] text-balance">
                Explore Chemical Engineering Through Interactive Simulations.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Manipulate operating variables, observe real-time engineering responses,
                and explore six core chemical engineering disciplines.
              </p>

              {/* Simplified Primary & Secondary Hero CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenDirectory}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-teal-700 hover:bg-teal-600 text-white transition-colors shadow-2xs cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  data-testid="hero-browse-directory"
                >
                  Explore Laboratories
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works-section')}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  data-testid="hero-how-it-works"
                >
                  How It Works
                </button>
              </div>

              {/* Clean, Unboxed Single-Line-Friendly Metadata Strip */}
              <div className="pt-4 border-t border-slate-200/90 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-600">
                <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                  6 Core Labs
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                  First-Principles SI
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="font-mono font-semibold text-teal-800 whitespace-nowrap">
                  Guided Inquiry
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Multi-Lab Scientific Preview Card */}
            <div className="lg:col-span-6">
              <div
                className="rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl overflow-hidden"
                data-testid="hero-interactive-preview"
              >
                {/* Top Header & Interactive 6-Lab Preview Selector */}
                <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400">
                      Interactive Simulation Preview · Verified Solver Output
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                      {activePreview.code} / 06
                    </span>
                  </div>

                  {/* Interactive Segmented Selector for the 6 Core Laboratories (2x3 Grid — Zero Truncation) */}
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 gap-1.5"
                    role="tablist"
                    aria-label="Preview Virtual Laboratories"
                  >
                    {HERO_PREVIEW_LABS.map((lab, idx) => {
                      const isSelected = idx === selectedPreviewIndex;
                      return (
                        <button
                          key={lab.id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setSelectedPreviewIndex(idx)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-400 ${
                            isSelected
                              ? 'bg-teal-600 text-white font-semibold shadow-2xs'
                              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <span className="font-mono text-[10px] opacity-75">
                            0{idx + 1}
                          </span>
                          <span className="truncate">{lab.shortTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Lab Preview Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-teal-300">
                        {activePreview.domain}
                      </div>
                      <h2 className="text-base font-bold text-white mt-0.5">
                        {activePreview.presetName}
                      </h2>
                    </div>
                  </div>

                  {/* Governing Equation Box */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 overflow-x-auto [&_.katex]:!text-slate-100 [&_.katex-display]:!text-slate-100">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-teal-400/90 mb-1">
                      Governing Mathematical Relation
                    </div>
                    <MathBlock
                      latex={activePreview.equationLatex}
                      className="!text-slate-100 text-xs sm:text-sm my-0"
                    />
                  </div>

                  {/* 4 Verified Numerical Readouts */}
                  <div className="grid grid-cols-2 gap-3">
                    {activePreview.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-xl bg-slate-800/60 border border-slate-700/70 p-3"
                      >
                        <div className="text-[11px] text-slate-400">{metric.label}</div>
                        <div
                          className={`text-base sm:text-lg font-mono font-semibold mt-0.5 tabular-nums ${metric.accent}`}
                        >
                          {metric.value}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {metric.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Verification & Direct Launch Action */}
                  <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{activePreview.conservationNote}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenLab(activePreview.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                      data-testid="hero-preview-launch"
                    >
                      Open {activePreview.shortTitle} Lab
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPACT LABORATORY LAUNCHER (All 6 Core Labs) */}
      <section
        id="featured-labs-section"
        className="scroll-mt-32 max-w-[1360px] mx-auto px-4 sm:px-6 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Virtual Laboratories
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Interactive Simulation Suite
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Six interactive laboratories spanning heat transfer, fluid flow, reactions,
              separations, thermodynamics, and process control.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDirectory}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Open Filterable Directory
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Compact 6-Lab Launcher Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {LABORATORY_MODULES.map((module, idx) => (
            <article
              key={module.id}
              data-testid={`landing-lab-card-${module.id}`}
              className="rounded-xl border border-slate-200/90 bg-white transition-colors hover:border-teal-600/70 hover:bg-slate-50/60"
            >
              <button
                type="button"
                onClick={() => onOpenLab(module.id)}
                data-testid={`launch-lab-${module.id}`}
                className="w-full p-4 flex items-center justify-between gap-3.5 text-left cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50/80 border border-teal-200/70 flex items-center justify-center shrink-0 group-hover:bg-teal-100/70 transition-colors">
                    {getModuleIcon(module.iconName)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                      <span className="font-semibold text-teal-800">0{idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{module.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors truncate mt-0.5">
                      {module.shortTitle}
                    </h3>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span className="hidden sm:inline">Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* 3. HOW ENTROLUME WORKS (4-STEP WORKFLOW) */}
      <section
        id="how-it-works-section"
        className="scroll-mt-32 bg-slate-900 text-white py-12 lg:py-16 border-y border-slate-800"
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2.5">
              <EntrolumeLogo variant="dark" size="xs" decorative />
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">
                · Four-Step Learning Workflow
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How Each Virtual Laboratory Works
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Every simulation follows a consistent four-stage inquiry loop designed around
              physical intuition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/80 p-5 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-400">
                01 · CONFIGURE
              </div>
              <h3 className="text-base font-bold text-white">
                Set Operating Conditions
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Load a curated engineering preset or adjust process variables using
                synchronized SI sliders and numeric inputs.
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/60 border border-slate-700/80 p-5 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-400">
                02 · SIMULATE
              </div>
              <h3 className="text-base font-bold text-white">
                Observe Real-Time Outputs
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Deterministic solvers immediately compute outlet states, regime transitions,
                and conservation checks.
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/60 border border-slate-700/80 p-5 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-400">
                03 · ANALYZE
              </div>
              <h3 className="text-base font-bold text-white">
                Compare Schematics & Curves
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Inspect interactive diagrams, sensitivity plots, and side-by-side scenario
                tables, or export CSV data.
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/60 border border-slate-700/80 p-5 space-y-2">
              <div className="text-xs font-mono font-bold text-teal-400">
                04 · REFLECT
              </div>
              <h3 className="text-base font-bold text-white">
                Test Conceptual Mastery
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Answer guided engineering questions, verify predictions, and expand
                textbook-grade derivations on demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOR STUDENTS & FOR EDUCATORS SECTION */}
      <section
        id="educators-section"
        className="scroll-mt-32 max-w-[1360px] mx-auto px-4 sm:px-6 space-y-6"
      >
        <div className="max-w-2xl space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
            Academic Utility
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Built for Students and Engineering Faculty
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Connect classroom derivations to interactive unit-operations behavior.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* For Students Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  For Students
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Visual Intuition & Self-Study Verification
                </h3>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Safe Limit Testing:
                  </strong>{' '}
                  Explore pinch points, minimum reflux (<MathInline latex="R_{\min}" />),
                  and controller instability interactively.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Calculation Checks:
                  </strong>{' '}
                  Verify homework and design problems against transparent SI unit outputs.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Lab Report Data:
                  </strong>{' '}
                  Save scenario comparisons and download CSV results for external analysis.
                </span>
              </li>
            </ul>
          </div>

          {/* For Educators Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  For Educators & Departments
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Lecture Demonstrations & Pre-Lab Preparation
                </h3>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Available Today — Curated Scenarios:
                  </strong>{' '}
                  One-click engineering presets and guided conceptual checks ready for live
                  classroom projection.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Available Today — Documented Scope:
                  </strong>{' '}
                  Explicit model assumptions and progressive derivations inside each
                  workspace.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Planned (Phase 5) — Classroom Management:
                  </strong>{' '}
                  Instructor course dashboards, assignment links, and cohort submissions.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. FUTURE CAPABILITIES & PHASED ROADMAP */}
      <section
        id="roadmap-section"
        className="scroll-mt-32 max-w-[1360px] mx-auto px-4 sm:px-6 space-y-6"
      >
        <div className="max-w-2xl space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
            Platform Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Upcoming Capabilities
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Future capabilities layered onto Entrolume’s six core simulation engines.
          </p>
        </div>

        {/* 3 Future Capability Cards (Phases 3, 4, 5 — Explicitly Labeled as Planned/Upcoming) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-2.5"
            data-testid="roadmap-card-phase-3"
          >
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-teal-800">
                <Sparkles className="w-4 h-4 text-teal-700" />
                Phase 3
              </span>
              <span className="text-teal-700 font-medium">Upcoming · Planned</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Phase 3 — Gemini AI Engineering Tutor
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Context-aware Socratic tutoring grounded strictly in live solver outputs to
              help students diagnose pinch points, regime transitions, and design
              trade-offs.
            </p>
          </div>

          <div
            className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-2.5"
            data-testid="roadmap-card-phase-4"
          >
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Cpu className="w-4 h-4 text-slate-700" />
                Phase 4
              </span>
              <span>Planned</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Phase 4 — Machine Learning Workspace
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Interactive regression and surrogate-modeling workspace comparing empirical
              predictions against first-principles conservation laws.
            </p>
          </div>

          <div
            className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-2.5"
            data-testid="roadmap-card-phase-5"
          >
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Building2 className="w-4 h-4 text-slate-700" />
                Phase 5
              </span>
              <span>Planned</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Phase 5 — Academic SaaS Features
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Department accounts, student authentication, saved cloud experiment
              portfolios, and instructor assignment dashboards.
            </p>
          </div>
        </div>

        {/* Collapsible Historical Engineering Milestones (Phases 1 through 2.5.2 + 2.5.3 In Progress) */}
        <details
          className="group rounded-xl border border-slate-200/90 bg-slate-50/70 overflow-hidden"
          data-testid="roadmap-release-history"
        >
          <summary className="px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer list-none select-none text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-700">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              <span>Engineering Release History</span>
              <span className="text-xs font-mono font-normal text-slate-500">
                (Phases 1 – 2.5.2 Completed · Phase 2.5.3 In Progress)
              </span>
            </div>
            <span className="text-xs font-mono text-teal-700 group-open:rotate-180 transition-transform shrink-0">
              ▼
            </span>
          </summary>

          <div className="p-5 pt-3 border-t border-slate-200/80 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historicalMilestones.map((stage) => {
              const isInProgress = stage.status === 'Current Phase';
              return (
                <div
                  key={stage.phase}
                  className={`rounded-xl p-4 border space-y-2 ${
                    isInProgress
                      ? 'bg-teal-950 text-white border-teal-800'
                      : 'bg-slate-50/60 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span
                      className={
                        isInProgress
                          ? 'text-teal-300 font-bold'
                          : 'text-teal-700 font-semibold'
                      }
                    >
                      {stage.phase}
                    </span>
                    <span
                      className={
                        isInProgress ? 'text-teal-200 font-medium' : 'text-emerald-700'
                      }
                    >
                      {isInProgress ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                  <h4
                    className={`text-sm font-bold ${
                      isInProgress ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {stage.title}
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${
                      isInProgress ? 'text-slate-200' : 'text-slate-600'
                    }`}
                  >
                    {stage.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </details>
      </section>

      {/* 6. FOOTER */}
      <footer className="max-w-[1360px] mx-auto px-4 sm:px-6 pt-10 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8">
          <div className="md:col-span-5 space-y-2.5">
            <EntrolumeLogo
              variant="primary"
              size="md"
              ariaLabel="entrolume — Explore. Simulate. Understand."
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Explore. Simulate. Understand.
            </p>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Interactive chemical engineering learning and simulation platform for
              undergraduate students and faculty.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Virtual Laboratories
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
              {LABORATORY_MODULES.map((lab, idx) => (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => onOpenLab(lab.id)}
                  className="text-left hover:text-teal-700 transition-colors py-0.5 cursor-pointer"
                >
                  0{idx + 1}. {lab.shortTitle}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Platform Navigation
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-slate-600">
              <button
                type="button"
                onClick={onOpenDirectory}
                className="text-left hover:text-teal-700 transition-colors cursor-pointer"
              >
                All Laboratories Directory (6)
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works-section')}
                className="text-left hover:text-teal-700 transition-colors cursor-pointer"
              >
                How Entrolume Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('educators-section')}
                className="text-left hover:text-teal-700 transition-colors cursor-pointer"
              >
                For Students & Educators
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('roadmap-section')}
                className="text-left hover:text-teal-700 transition-colors cursor-pointer"
              >
                Platform Roadmap
              </button>
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Entrolume · Interactive Chemical Engineering
            Virtual Laboratories
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Explore. Simulate. Understand. · SI Units Standard
          </div>
        </div>
      </footer>
    </div>
  );
}
