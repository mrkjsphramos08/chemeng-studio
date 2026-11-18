'use client';

import React, { useState } from 'react';
import { LABORATORY_MODULES, LabModule } from '@/lib/labs-data';
import {
  Flame,
  Layers,
  FlaskConical,
  Gauge,
  Waves,
  Sliders,
  ArrowRight,
  Lock,
} from 'lucide-react';

export type AvailableLabId =
  | 'heat-exchanger'
  | 'fluid-mechanics'
  | 'reaction-engineering';

interface LabsDirectoryProps {
  onOpenLab: (labId: AvailableLabId) => void;
}

type FilterStatus = 'all' | 'Available' | 'Coming Soon';

function renderModuleIcon(iconName: LabModule['iconName']) {
  const className = 'w-5 h-5 text-teal-800';
  switch (iconName) {
    case 'flame':
      return <Flame className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'flask':
      return <FlaskConical className={className} />;
    case 'gauge':
      return <Gauge className={className} />;
    case 'waves':
      return <Waves className={className} />;
    case 'sliders':
      return <Sliders className={className} />;
  }
}

export function LabsDirectory({ onOpenLab }: LabsDirectoryProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const availableCount = LABORATORY_MODULES.filter(
    (m) => m.status === 'Available'
  ).length;
  const comingSoonCount = LABORATORY_MODULES.filter(
    (m) => m.status === 'Coming Soon'
  ).length;

  const filteredModules = LABORATORY_MODULES.filter((mod) =>
    statusFilter === 'all' ? true : mod.status === statusFilter
  );

  return (
    <section
      id="laboratories-directory"
      aria-label="Virtual Laboratories Directory"
      className="max-w-[1360px] mx-auto px-6 py-14"
      data-testid="laboratories-directory"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-teal-800">
            Curriculum Library · Core Chemical Engineering Sequence
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Virtual Engineering Laboratories
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Each laboratory pairs rigorous first-principles conservation equations with interactive
            parameter manipulation and guided conceptual inquiry.{' '}
            <strong className="font-semibold text-slate-800">
              Countercurrent Heat Exchanger
            </strong>{' '}
            (Phase 1 / 1.1),{' '}
            <strong className="font-semibold text-slate-800">
              Fluid Mechanics &amp; Pipe Hydraulics
            </strong>{' '}
            (Phase 1.2), and{' '}
            <strong className="font-semibold text-slate-800">
              Chemical Reaction Engineering
            </strong>{' '}
            (Phase 2.1) are now live, with three additional core modules planned in Phases 2.2–2.4.
          </p>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start md:self-auto max-w-full"
          role="group"
          aria-label="Filter laboratory modules by availability"
        >
          {(['all', 'Available', 'Coming Soon'] as FilterStatus[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                statusFilter === filter
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {filter === 'all'
                ? `All Modules (${LABORATORY_MODULES.length})`
                : filter === 'Available'
                ? `Available Now (${availableCount})`
                : `Coming Soon (${comingSoonCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {filteredModules.map((module) => {
          const isAvailable = module.status === 'Available';
          const launchLabel =
            module.id === 'fluid-mechanics'
              ? 'Launch Fluid Mechanics Laboratory'
              : module.id === 'reaction-engineering'
              ? 'Launch Reaction Engineering Lab'
              : 'Launch Heat Exchanger Laboratory';

          return (
            <article
              key={module.id}
              data-testid={`lab-card-${module.id}`}
              className={`bg-white rounded-xl p-6 flex flex-col justify-between transition-all ${
                isAvailable
                  ? 'border-2 border-teal-700/85 shadow-xs'
                  : 'border border-slate-200'
              }`}
            >
              <div>
                {/* Unboxed clean metadata header (Zero-Pill Discipline) */}
                <div className="flex items-center justify-between gap-2 text-xs mb-3">
                  <span className="text-slate-600 font-medium">{module.category}</span>
                  <span
                    className={`font-semibold shrink-0 ${
                      isAvailable ? 'text-teal-800' : 'text-slate-600'
                    }`}
                  >
                    {isAvailable ? '● Available Now' : '○ Coming Soon'}
                  </span>
                </div>

                {/* Icon + Title */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {renderModuleIcon(module.iconName)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {module.title}
                    </h3>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {module.level} · {module.duration}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {module.description}
                </p>

                {/* Governing Relation Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4">
                  <div className="text-[11px] font-medium text-slate-600">
                    Governing Engineering Model
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-800 mt-0.5">
                    {module.governingEquation}
                  </div>
                </div>

                {/* Unboxed key topics & roadmap phase */}
                <div className="text-xs text-slate-600 leading-relaxed mb-2">
                  <span className="font-semibold text-slate-800">Core Concepts: </span>
                  {module.keyTopics.join(' · ')}
                </div>
                <div className="text-xs text-slate-600 mb-5">
                  <span className="font-semibold text-slate-800">Roadmap Milestone: </span>
                  <span
                    className={
                      isAvailable ? 'text-teal-800 font-semibold' : 'text-slate-700 font-medium'
                    }
                  >
                    {module.roadmapPhase}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {isAvailable ? (
                  <button
                    type="button"
                    onClick={() => onOpenLab(module.id as AvailableLabId)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    {launchLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed whitespace-nowrap"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {module.roadmapPhase}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
