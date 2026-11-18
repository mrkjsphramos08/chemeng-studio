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
import { MathBlock, MathInline, MathText } from '@/components/lab-shared';
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-14 lg:pt-14 lg:pb-20 border-b border-slate-200/80 bg-gradient-to-b from-white via-white to-[#F8FAFC] overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_55%,transparent_100%)] opacity-45"
        />

        <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Entrolume Brand Positioning & Primary Actions */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                Entrolume · Explore. Simulate. Understand.
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                Explore Chemical Engineering Through Interactive Simulations.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Learn complex engineering principles through virtual laboratories,
                real-time scientific calculations, and guided experiments. Built for
                undergraduate chemical engineering students, instructors, and academic
                programs.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={onOpenDirectory}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold bg-teal-700 hover:bg-teal-600 text-white transition-all shadow-sm cursor-pointer"
                  data-testid="hero-browse-directory"
                >
                  Explore Laboratories
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenLab('heat-exchanger')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                  data-testid="hero-launch-heat-exchanger"
                >
                  Launch Heat Exchanger Lab
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works-section')}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                  data-testid="hero-how-it-works"
                >
                  How It Works
                </button>
              </div>

              {/* Unboxed Curriculum Summary Metadata */}
              <div className="pt-5 border-t border-slate-200/90 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="text-xs font-medium text-slate-500">Live Simulators</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                    6 Core Labs
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Calculation Basis</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    First-Principles SI
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">Pedagogy</div>
                  <div className="text-lg font-bold font-mono text-teal-800 mt-0.5">
                    44 Guided Checks
                  </div>
                </div>
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
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
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
                <div className="p-5 sm:p-6 space-y-5">
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
                  <div className="rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 overflow-x-auto [&_.katex]:!text-slate-100 [&_.katex-display]:!text-slate-100">
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
                        className="rounded-xl bg-slate-800/60 border border-slate-700/70 p-3.5"
                      >
                        <div className="text-[11px] text-slate-400">{metric.label}</div>
                        <div
                          className={`text-lg font-mono font-semibold mt-0.5 tabular-nums ${metric.accent}`}
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
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-colors cursor-pointer shrink-0"
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

      {/* 2. FEATURED VIRTUAL LABORATORIES SECTION (All 6 Core Labs) */}
      <section
        id="featured-labs-section"
        className="scroll-mt-32 max-w-[1360px] mx-auto px-4 sm:px-6 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Complete Core Curriculum · 6 Interactive Simulators
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Virtual Chemical Engineering Laboratories
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Every Entrolume laboratory pairs a deterministic numerical calculation engine
              with interactive process schematics, parametric sensitivity charts, scenario
              comparison tables, and guided student inquiry.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDirectory}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 cursor-pointer shrink-0"
          >
            Open Filterable Directory
            <Compass className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LABORATORY_MODULES.map((module, idx) => (
            <article
              key={module.id}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 flex flex-col justify-between transition-all hover:border-teal-600/60 hover:shadow-md"
              data-testid={`landing-lab-card-${module.id}`}
            >
              <div className="space-y-4">
                {/* Top Icon & Unboxed Subject Metadata */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50/80 border border-teal-200/70 flex items-center justify-center shrink-0">
                    {getModuleIcon(module.iconName)}
                  </div>
                  <div className="text-right text-xs font-mono text-slate-500">
                    Lab 0{idx + 1} · {module.level} · {module.duration}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-teal-700">
                    {module.category}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    <MathText text={module.description} />
                  </p>
                </div>

                {/* Governing Equation Preview */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 overflow-x-auto">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Governing Relation
                  </div>
                  <div className="text-slate-800 text-xs">
                    <MathInline latex={module.governingEquationLatex} />
                  </div>
                </div>

                {/* Unboxed Key Concepts */}
                <div className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">Core Concepts: </span>
                  {module.keyTopics.map((topic, topicIdx) => (
                    <React.Fragment key={topic}>
                      {topicIdx > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                      <MathText text={topic} />
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenLab(module.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  data-testid={`launch-lab-${module.id}`}
                >
                  Launch Laboratory
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. HOW ENTROLUME WORKS (4-STEP WORKFLOW) */}
      <section
        id="how-it-works-section"
        className="scroll-mt-32 bg-slate-900 text-white py-16 lg:py-20 border-y border-slate-800"
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-3">
              <EntrolumeLogo variant="dark" size="xs" decorative />
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">
                · Pedagogical Framework
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              A Structured Four-Stage Engineering Inquiry Workflow
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Every virtual laboratory in Entrolume follows the same consistent four-step
              structure so students spend zero time learning new interfaces and 100% of
              their focus on physical intuition and mathematical relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/80 p-6 space-y-3">
              <div className="text-xs font-mono font-bold text-teal-400">
                STEP 01 · CONFIGURE
              </div>
              <h3 className="text-lg font-bold text-white">
                Set Operating Conditions
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Select a curated engineering scenario preset or adjust process parameters
                with synchronized SI sliders and direct numerical inputs.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/80 p-6 space-y-3">
              <div className="text-xs font-mono font-bold text-teal-400">
                STEP 02 · SIMULATE
              </div>
              <h3 className="text-lg font-bold text-white">
                Execute Verified Solvers
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Real-time first-principles solvers compute outlet states, regime
                classifications, and conservation residuals with explicit physical bounds
                checking.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/80 p-6 space-y-3">
              <div className="text-xs font-mono font-bold text-teal-400">
                STEP 03 · ANALYZE
              </div>
              <h3 className="text-lg font-bold text-white">
                Inspect Schematics & Curves
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Examine annotated process flow diagrams, parametric sensitivity sweeps,
                and side-by-side saved scenario comparison tables, or export CSV datasets.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/80 p-6 space-y-3">
              <div className="text-xs font-mono font-bold text-teal-400">
                STEP 04 · REFLECT
              </div>
              <h3 className="text-lg font-bold text-white">
                Verify Conceptual Mastery
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Test physical hypotheses through guided laboratory prompts, multiple-choice
                conceptual checks, and textbook-grade KaTeX mathematical derivations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOR STUDENTS & FOR EDUCATORS SECTION */}
      <section
        id="educators-section"
        className="scroll-mt-32 max-w-[1360px] mx-auto px-4 sm:px-6 space-y-10"
      >
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
            Academic Utility · Built for University Curricula
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Designed for Undergraduate Students and Engineering Faculty
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Entrolume bridges the gap between static textbook derivations and physical
            unit-operations laboratories.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Students Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-7 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  For Students
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Build Physical Intuition Beyond Plug-and-Chug Algebra
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of treating equations as isolated formulas to memorize, manipulate
              operating variables directly and watch how physical driving forces, pinch
              points, and non-linear regimes respond in real time.
            </p>

            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Parameter Experimentation:
                  </strong>{' '}
                  Test extreme operating limits (e.g., <MathInline latex="C_r = 1" />,
                  minimum reflux <MathInline latex="R \to R_{\min}" />, or dead-time
                  instability) safely and instantaneously.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Homework & Design Verification:
                  </strong>{' '}
                  Cross-check hand calculations against verified SI unit solvers with
                  transparent intermediate variables.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Lab Report CSV Exports:
                  </strong>{' '}
                  Save multiple simulation runs to comparison tables and export complete
                  CSV datasets for external plotting or lab reports.
                </span>
              </li>
            </ul>
          </div>

          {/* For Educators Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-7 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  For Educators & Departments
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Interactive Classroom Demonstrations & Pre-Lab Preparation
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Project Entrolume during lectures to demonstrate why doubling heat exchanger
              area does not double heat transfer, how feed thermal quality rotates the
              McCabe–Thiele <MathInline latex="q" />-line, or why integral windup occurs.
            </p>

            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Available Today — Ready-to-Use Curated Presets:
                  </strong>{' '}
                  Each laboratory includes 5 to 10 pre-configured engineering scenarios
                  and guided inquiry questions with one-click condition loading.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Available Today — Explicit Model Scope & Assumptions:
                  </strong>{' '}
                  Every simulator documents its exact governing equations, numerical
                  method, and simplifying assumptions so students learn model limitations.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold text-slate-900">
                    Planned (Phase 5) — Cohort & Assignment Management:
                  </strong>{' '}
                  Instructor course dashboards, custom assignment links, and automated
                  student submission grading are scheduled on the Phase 5 roadmap.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. FUTURE CAPABILITIES & PHASED ROADMAP */}
      <section
        id="roadmap-section"
        className="scroll-mt-32 max-w-[1360px] mx-auto px-4 sm:px-6 space-y-12"
      >
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
            Simulation-First Architecture · Platform Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Future Capabilities & Phased Development Roadmap
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Entrolume follows a strict simulation-first engineering philosophy: all six
            core chemical engineering virtual laboratories and the unified design system
            are established and unit-tested before layering AI tutoring, machine learning
            workspaces, and institutional SaaS management.
          </p>
        </div>

        {/* 3 Future Capability Pillars (Explicitly Labeled as Planned) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-teal-800">
                <Sparkles className="w-4 h-4 text-teal-700" />
                Phase 3 · Upcoming
              </span>
              <span>Planned Capability</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              AI Engineering Tutor
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Context-aware Socratic tutoring grounded strictly in the live numerical
              outputs of Entrolume’s verified solvers—helping students diagnose pinch
              points, regime transitions, and design trade-offs without hallucinated
              math.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Cpu className="w-4 h-4 text-slate-700" />
                Phase 4 · Planned
              </span>
              <span>Planned Capability</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Machine Learning Workspace
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Hands-on surrogate modeling and regression workspace where students compare
              data-driven predictions against first-principles conservation laws using
              exported laboratory datasets.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Building2 className="w-4 h-4 text-slate-700" />
                Phase 5 · Planned
              </span>
              <span>Planned Capability</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Academic SaaS & Classroom Tools
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              University department accounts, student authentication, saved cloud
              experiment portfolios, and instructor assignment dashboards for undergraduate
              courses.
            </p>
          </div>
        </div>

        {/* Full Chronological Engineering Milestones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DEVELOPMENT_ROADMAP.map((stage) => {
            const isImplemented = stage.status === 'Implemented';
            const isCurrent = stage.status === 'Current Phase';
            return (
              <div
                key={stage.phase}
                className={`rounded-2xl p-5 border flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-teal-950 text-white border-teal-700 shadow-md'
                    : isImplemented
                    ? 'bg-white border-slate-200/90'
                    : 'bg-slate-50/70 border-slate-200/70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span
                      className={
                        isCurrent
                          ? 'text-teal-300 font-bold'
                          : isImplemented
                          ? 'text-teal-700 font-semibold'
                          : 'text-slate-500'
                      }
                    >
                      {stage.phase}
                    </span>
                    <span
                      className={
                        isCurrent
                          ? 'text-teal-200 font-semibold'
                          : isImplemented
                          ? 'text-emerald-700 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      {stage.status}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold ${
                      isCurrent ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {stage.title}
                  </h3>

                  <p
                    className={`text-xs leading-relaxed ${
                      isCurrent ? 'text-slate-200' : 'text-slate-600'
                    }`}
                  >
                    {stage.summary}
                  </p>
                </div>

                <ul className="space-y-1.5 pt-4 mt-4 border-t border-slate-200/20">
                  {stage.items.map((item) => (
                    <li
                      key={item}
                      className={`text-xs flex items-start gap-2 ${
                        isCurrent ? 'text-slate-200' : 'text-slate-600'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          isCurrent
                            ? 'text-teal-400'
                            : isImplemented
                            ? 'text-teal-700'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="max-w-[1360px] mx-auto px-4 sm:px-6 pt-12 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10">
          <div className="md:col-span-5 space-y-3">
            <EntrolumeLogo
              variant="primary"
              size="md"
              ariaLabel="entrolume — Explore. Simulate. Understand."
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Explore. Simulate. Understand.
            </p>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Interactive chemical engineering learning platform and virtual laboratory
              suite powered by deterministic first-principles SI calculation engines.
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
                  0{idx + 1}. {lab.title.replace(' Virtual Laboratory', '')}
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
                Development Roadmap
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Entrolume · Chemical Engineering Virtual
            Laboratories (Phase 2.5.2 Release)
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            6 Verified Simulators · 85 Automated Tests · SI Standard
          </div>
        </div>
      </footer>
    </div>
  );
}
