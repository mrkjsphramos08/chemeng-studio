'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Flame,
  Layers,
  FlaskConical,
  Gauge,
  Waves,
  Sliders,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { LABORATORY_MODULES, LabModule } from '@/lib/labs-data';
import { MathInline, MathText } from '@/components/lab-shared';

export type AvailableLabId =
  | 'heat-exchanger'
  | 'fluid-mechanics'
  | 'reaction-engineering'
  | 'distillation'
  | 'thermodynamics'
  | 'process-control';

interface LabsDirectoryProps {
  onOpenLab: (labId: AvailableLabId) => void;
}

type DisciplineFilter =
  | 'all'
  | 'transport'
  | 'reaction-separation'
  | 'thermo-control';

const DISCIPLINE_TABS: {
  id: DisciplineFilter;
  label: string;
  labIds?: string[];
}[] = [
  { id: 'all', label: 'All Laboratories (6)' },
  {
    id: 'transport',
    label: 'Transport & Hydraulics (2)',
    labIds: ['heat-exchanger', 'fluid-mechanics'],
  },
  {
    id: 'reaction-separation',
    label: 'Reaction & Separations (2)',
    labIds: ['reaction-engineering', 'distillation'],
  },
  {
    id: 'thermo-control',
    label: 'Thermodynamics & Control (2)',
    labIds: ['thermodynamics', 'process-control'],
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

export function LabsDirectory({ onOpenLab }: LabsDirectoryProps) {
  const [discipline, setDiscipline] = useState<DisciplineFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = useMemo(() => {
    const activeTab = DISCIPLINE_TABS.find((t) => t.id === discipline);
    return LABORATORY_MODULES.filter((m) => {
      if (activeTab?.labIds && !activeTab.labIds.includes(m.id)) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.keyTopics.some((t) => t.toLowerCase().includes(q)) ||
        m.governingEquation.toLowerCase().includes(q)
      );
    });
  }, [discipline, searchQuery]);

  return (
    <section
      aria-label="Virtual Laboratories Directory"
      className="max-w-[1360px] mx-auto px-4 sm:px-6 py-10 space-y-8"
      data-testid="labs-directory-view"
    >
      {/* Top Directory Header */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Entrolume Virtual Laboratory Library · 6 Live Simulators
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Chemical Engineering Virtual Laboratories
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Select an interactive simulation workspace below. Every laboratory follows
              Entrolume’s standardized{' '}
              <span className="font-semibold text-slate-800">
                Configure → Simulate → Analyze → Reflect
              </span>{' '}
              workflow with real-time SI calculations, process schematics, scenario
              comparison tables, CSV export, and guided conceptual checks.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-80 shrink-0">
            <label htmlFor="directory-search" className="sr-only">
              Search laboratories by topic or equation
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="directory-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lab, method, or concept..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none"
                data-testid="directory-search-input"
              />
            </div>
          </div>
        </div>

        {/* Discipline Filter Tabs */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Filter laboratories by chemical engineering discipline"
          >
            {DISCIPLINE_TABS.map((tab) => {
              const isSelected = discipline === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setDiscipline(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                  data-testid={`directory-filter-${tab.id}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Showing {filteredModules.length} of 6 Verified Laboratories</span>
          </div>
        </div>
      </div>

      {/* Laboratories Grid */}
      {filteredModules.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900">
            No virtual laboratories match &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setDiscipline('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-600 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const labNumber =
              LABORATORY_MODULES.findIndex((item) => item.id === module.id) + 1;
            return (
              <article
                key={module.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 flex flex-col justify-between transition-all hover:border-teal-600/70 hover:shadow-md"
                data-testid={`directory-card-${module.id}`}
              >
                <div className="space-y-4">
                  {/* Top Row: Icon & Unboxed Curriculum Metadata */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-50/90 border border-teal-200/80 flex items-center justify-center shrink-0">
                      {getModuleIcon(module.iconName)}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-semibold text-teal-800 whitespace-nowrap">
                        LAB 0{labNumber} · Available Now
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 whitespace-nowrap">
                        {module.level} · {module.duration}
                      </div>
                    </div>
                  </div>

                  {/* Subject Category, Title & Description */}
                  <div>
                    <div className="text-xs font-semibold text-teal-700">
                      {module.category}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      {module.title}
                    </h2>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      <MathText text={module.description} />
                    </p>
                  </div>

                  {/* Governing Equation Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 overflow-x-auto">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Governing Mathematical Relation
                    </div>
                    <div className="text-slate-800 text-xs">
                      <MathInline latex={module.governingEquationLatex} />
                    </div>
                  </div>

                  {/* Unboxed Key Concepts */}
                  <div className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-700">Core Topics: </span>
                    {module.keyTopics.map((topic, idx) => (
                      <React.Fragment key={topic}>
                        {idx > 0 && <span className="mx-1.5 text-slate-300">·</span>}
                        <MathText text={topic} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Launch Action */}
                <div className="pt-5 mt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenLab(module.id as AvailableLabId)}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                    data-testid={`directory-launch-${module.id}`}
                  >
                    Launch Virtual Laboratory
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
