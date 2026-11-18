'use client';

import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  LineChart,
  Sliders,
  Users,
} from 'lucide-react';
import { DEVELOPMENT_ROADMAP, RoadmapPhaseItem } from '@/lib/labs-data';
import { MathInline } from '@/components/lab-shared/math';
import type { ActiveView } from '@/components/navbar';
import type { AvailableLabId } from '@/components/labs-directory';

interface LandingSectionsProps {
  onOpenLab: (labId: AvailableLabId) => void;
  onExploreDirectory: () => void;
}

export function HeroSection({ onOpenLab, onExploreDirectory }: LandingSectionsProps) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="max-w-[1360px] mx-auto px-6 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Editorial Headline & Primary CTA */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-teal-800">
                <span>Interactive Chemical Engineering Platform</span>
                <span aria-hidden="true">·</span>
                <span>First-Principles Simulation</span>
                <span aria-hidden="true">·</span>
                <span>SI Units Standard</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] text-balance max-w-2xl">
                Master Transport Phenomena and Process Engineering Through Live Simulation
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl">
                ChemEng Studio helps chemical engineering students understand engineering principles
                through interactive virtual laboratories and scientifically grounded simulations.
                Explore heat transfer, pipe hydraulics, ideal reactor kinetics, McCabe–Thiele
                binary distillation, Peng–Robinson / Raoult–Dalton thermodynamics, and FOPDT
                process dynamics &amp; PID control in real time.
              </p>
            </div>

            <div className="space-y-5 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenLab('process-control')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  Open Process Control Lab
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLab('thermodynamics')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-teal-950 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  Open Thermodynamics Lab
                </button>
                <button
                  type="button"
                  onClick={onExploreDirectory}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  Explore All Laboratories
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span>6 Active Simulators (Heat Transfer, Fluid Mechanics, Reaction Eng., Distillation, Thermodynamics &amp; Process Control)</span>
                <span aria-hidden="true">·</span>
                <span>Zero Fabricated Data</span>
                <span aria-hidden="true">·</span>
                <span>Built for Students &amp; University Faculty</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Scientific Preview Card */}
          <div className="lg:col-span-5 bg-[#0F172A] text-white rounded-xl p-6 flex flex-col justify-between border border-slate-800">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 pb-4 border-b border-slate-800">
                <span>Featured New Module · Phase 2.4</span>
                <span className="font-mono text-teal-400">6 Live Laboratories</span>
              </div>

              <h2 className="text-lg font-semibold text-white mt-4">
                Process Dynamics &amp; Control: FOPDT Dynamics &amp; PID Feedback Loops
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Analyze first-order-plus-dead-time (<MathInline latex="\tau \frac{dy}{dt} + y = K_p u(t - \theta)" />
                ) responses, <MathInline latex="\mathrm{P/PI/PID}" /> tuning, actuator saturation{' '}
                <MathInline latex="[U_{\min}, U_{\max}]" />, and anti-windup protection.
              </p>

              {/* Compact SVG Preview */}
              <div className="mt-5 bg-slate-900/90 border border-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                  <span>
                    FOPDT Closed-Loop <MathInline latex="Y(t)" /> vs. Setpoint <MathInline latex="r(t)" />
                  </span>
                  <span>
                    <MathInline latex="K_p = 1.5, \; \tau = 20\,\mathrm{s}, \; \theta = 4\,\mathrm{s}" />
                  </span>
                </div>
                <svg
                  viewBox="0 0 360 110"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Preview of closed-loop PID process response tracking a setpoint step with dead time"
                >
                  <line x1="30" y1="25" x2="330" y2="25" stroke="#1E293B" strokeWidth="1" />
                  <line x1="30" y1="60" x2="330" y2="60" stroke="#1E293B" strokeWidth="1" />
                  <line x1="30" y1="95" x2="330" y2="95" stroke="#1E293B" strokeWidth="1" />
                  {/* Setpoint Step r(t) */}
                  <polyline
                    points="30,85 75,85 75,32 330,32"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="1.6"
                    strokeDasharray="4 3"
                  />
                  {/* PID Response Y(t) */}
                  <path
                    d="M 30 85 L 95 85 C 125 85, 145 18, 175 24 C 200 29, 220 35, 250 32 L 330 32"
                    fill="none"
                    stroke="#14B8A6"
                    strokeWidth="2.4"
                  />
                  <circle cx="170" cy="23" r="3.5" fill="#14B8A6" stroke="#FFFFFF" strokeWidth="1.3" />
                  <text x="180" y="21" className="text-[9px] fill-teal-300 font-mono">
                    Zero Steady-State Offset (e_ss = 0)
                  </text>
                </svg>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                  <span>
                    <MathInline latex="u(t) = u_{\mathrm{bias}} + K_c\left[e + \frac{1}{\tau_I}\int e\,dt - \tau_D\frac{dY_f}{dt}\right]" />
                  </span>
                  <span className="text-teal-400">
                    <MathInline latex="e_{\mathrm{ss}} \to 0" />
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-300">
                All 6 core chemical engineering laboratories live
              </div>
              <button
                type="button"
                onClick={() => onOpenLab('process-control')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-teal-400 rounded-lg hover:bg-teal-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              >
                Launch Process Control Lab →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function InteractiveLearningSection() {
  return (
    <section className="max-w-[1360px] mx-auto px-6 py-14 border-b border-slate-200">
      <div className="max-w-3xl mb-10">
        <div className="text-xs font-medium text-teal-800 mb-1">
          Pedagogical Methodology · Active Engineering Inquiry
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          How Interactive Engineering Learning Works
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Traditional problem sets often obscure physical trends behind tedious algebra. ChemEng
          Studio connects mathematical conservation laws directly to visual system response across
          every laboratory module.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-teal-800">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            01. Perturb Process Variables in SI Units
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Adjust flow rates, pipe diameters, roughness, fluid properties, heat transfer areas, and
            conductances with immediate validation of physical bounds.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-teal-800">
            <LineChart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            02. Observe Coupled Profiles &amp; Diagrams
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Inspect axial temperature gradients, Moody-style friction factor trajectories, pressure
            losses, and pump head curves in real time alongside engineering schematics.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-teal-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            03. Test Hypotheses &amp; Export Runs
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Answer structured engineering inquiry questions, compare snapshots side-by-side, verify
            self-check conclusions, and export simulation data to CSV for lab reports.
          </p>
        </div>
      </div>
    </section>
  );
}

function renderPhaseStatusIcon(status: RoadmapPhaseItem['status']) {
  if (status === 'Implemented') {
    return <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />;
  }
  if (status === 'Current Phase') {
    return <Layers className="w-4 h-4 text-teal-700 shrink-0" />;
  }
  return <Clock className="w-4 h-4 text-slate-500 shrink-0" />;
}

export function PlatformRoadmapSection({
  onExploreDirectory,
}: {
  onExploreDirectory: () => void;
}) {
  return (
    <section
      id="roadmap"
      className="max-w-[1360px] mx-auto px-6 py-14 border-b border-slate-200"
      data-testid="platform-roadmap-section"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="max-w-3xl">
          <div className="text-xs font-medium text-teal-800 mb-1">
            Simulation-First Development Roadmap
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Platform Milestones: Core Laboratories Before AI &amp; ML
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            ChemEng Studio prioritizes verified chemical engineering solvers and clean instructional
            workflows before introducing AI tutoring or machine learning sandboxes. Every planned
            milestone is explicitly distinguished from currently implemented capabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreDirectory}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Browse Active Laboratories →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {DEVELOPMENT_ROADMAP.map((item) => {
          const isCurrent = item.status === 'Current Phase';
          const isImplemented = item.status === 'Implemented';
          return (
            <article
              key={item.phase}
              data-testid={`roadmap-card-${item.phase.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              className={`bg-white rounded-xl p-5 flex flex-col justify-between ${
                isCurrent
                  ? 'border-2 border-teal-700 shadow-xs'
                  : isImplemented
                  ? 'border border-emerald-300'
                  : 'border border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs pb-3 mb-3 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-900">{item.phase}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 font-semibold ${
                      isCurrent
                        ? 'text-teal-800'
                        : isImplemented
                        ? 'text-emerald-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {renderPhaseStatusIcon(item.status)}
                    {item.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.summary}
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-700 pt-3 border-t border-slate-100">
                {item.items.map((bullet, idx) => (
                  <li key={idx} className="leading-relaxed">
                    · {bullet}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function StudentsAndEducatorsSection({
  onOpenLab,
}: {
  onOpenLab: (labId: AvailableLabId) => void;
}) {
  return (
    <section id="educators" className="max-w-[1360px] mx-auto px-6 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* For Undergraduate Students */}
        <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
              <GraduationCap className="w-4 h-4" />
              <span>For Undergraduate Chemical Engineering Students</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Visualize the Physics Behind Every Design Equation
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Stop memorizing formulas in isolation. Use ChemEng Studio to verify homework
              calculations, explore limiting cases (such as balanced capacity rates Cr = 1, laminar
              64/Re vs. turbulent Colebrook–White friction, or D⁻⁵ pipe sizing), and prepare for
              unit operations reports.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              <li>· Instant SI unit conversions and dimensional consistency checks</li>
              <li>· Transparent governing equations alongside live numerical values</li>
              <li>· Side-by-side scenario tables and downloadable CSV run exports</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-5">
            <button
              type="button"
              onClick={() => onOpenLab('heat-exchanger')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-4"
            >
              Heat Exchanger Lab →
            </button>
            <button
              type="button"
              onClick={() => onOpenLab('fluid-mechanics')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-4"
            >
              Fluid Mechanics Lab →
            </button>
            <button
              type="button"
              onClick={() => onOpenLab('reaction-engineering')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-4"
            >
              Reaction Engineering Lab →
            </button>
            <button
              type="button"
              onClick={() => onOpenLab('distillation')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-4"
            >
              Distillation Lab →
            </button>
            <button
              type="button"
              onClick={() => onOpenLab('thermodynamics')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-4"
            >
              Thermodynamics Lab →
            </button>
            <button
              type="button"
              onClick={() => onOpenLab('process-control')}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-4"
            >
              Process Control Lab →
            </button>
          </div>
        </div>

        {/* For Professors & Universities */}
        <div className="bg-white border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Users className="w-4 h-4" />
              <span>For Chemical Engineering Professors &amp; Departments</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Turn Lectures and Recitations into Live Design Studios
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Project interactive schematics directly in the classroom to demonstrate countercurrent
              temperature crosses, laminar-to-turbulent friction transitions, CSTR vs. PFR sizing,
              McCabe–Thiele pinch points, and PID integral windup in seconds. Assign the built-in
              Guided Inquiry Questions for pre-lab preparation.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              <li>· Explicitly documented physical assumptions across every simulator</li>
              <li>· Ready-to-use industrial presets across all 6 active core laboratories</li>
              <li>· Planned Phase 5 milestone: Instructor dashboards, course cohorts, and lab assignments</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
            Designed for Fluid Mechanics, Heat &amp; Mass Transfer, Reaction Engineering, Separations, Thermodynamics, and Process Control curricula
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({
  onSelectView,
}: {
  onSelectView: (view: ActiveView, sectionId?: string) => void;
}) {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-[1360px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-slate-600">
        <div className="space-y-1">
          <div className="font-bold text-slate-900 text-sm">ChemEng Studio</div>
          <p>
            Interactive Chemical Engineering Learning &amp; Virtual Laboratory Platform · Phase 2.4
            Process Dynamics &amp; Control Virtual Laboratory Release
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => onSelectView('overview')}
            className="hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Platform Overview
          </button>
          <button
            type="button"
            onClick={() => onSelectView('directory')}
            className="hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Laboratories Directory
          </button>
          <button
            type="button"
            onClick={() => onSelectView('heat-exchanger')}
            className="hover:text-slate-900 transition-colors font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Heat Exchanger Lab
          </button>
          <button
            type="button"
            onClick={() => onSelectView('fluid-mechanics')}
            className="hover:text-slate-900 transition-colors font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Fluid Mechanics Lab
          </button>
          <button
            type="button"
            onClick={() => onSelectView('reaction-engineering')}
            className="hover:text-slate-900 transition-colors font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Reaction Eng. Lab
          </button>
          <button
            type="button"
            onClick={() => onSelectView('distillation')}
            className="hover:text-slate-900 transition-colors font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Distillation Lab
          </button>
          <button
            type="button"
            onClick={() => onSelectView('thermodynamics')}
            className="hover:text-slate-900 transition-colors font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Thermodynamics Lab
          </button>
          <button
            type="button"
            onClick={() => onSelectView('process-control')}
            className="hover:text-slate-900 transition-colors font-semibold text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Process Control Lab
          </button>
          <button
            type="button"
            onClick={() => onSelectView('overview', 'roadmap')}
            className="hover:text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Product Roadmap
          </button>
        </div>
      </div>
    </footer>
  );
}
