'use client';

import React from 'react';

export type ActiveView =
  | 'overview'
  | 'directory'
  | 'heat-exchanger'
  | 'fluid-mechanics'
  | 'reaction-engineering'
  | 'distillation'
  | 'thermodynamics'
  | 'process-control';

interface NavbarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView, sectionId?: string) => void;
}

export function Navbar({ activeView, onSelectView }: NavbarProps) {
  const isInsideLab =
    activeView === 'heat-exchanger' ||
    activeView === 'fluid-mechanics' ||
    activeView === 'reaction-engineering' ||
    activeView === 'distillation' ||
    activeView === 'thermodynamics' ||
    activeView === 'process-control';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectView('overview')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          ChemEng Studio
        </button>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-3 lg:gap-3.5 text-sm font-medium text-slate-700"
        >
          <button
            type="button"
            onClick={() => onSelectView('overview')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'overview' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Platform
          </button>
          <button
            type="button"
            onClick={() => onSelectView('directory')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'directory' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Laboratories
          </button>
          <button
            type="button"
            onClick={() => onSelectView('heat-exchanger')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'heat-exchanger'
                ? 'text-teal-800 font-semibold underline'
                : ''
            }`}
          >
            Heat Exchanger
          </button>
          <button
            type="button"
            onClick={() => onSelectView('fluid-mechanics')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'fluid-mechanics'
                ? 'text-teal-800 font-semibold underline'
                : ''
            }`}
          >
            Fluid Mechanics
          </button>
          <button
            type="button"
            onClick={() => onSelectView('reaction-engineering')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'reaction-engineering'
                ? 'text-teal-800 font-semibold underline'
                : ''
            }`}
          >
            Reaction Eng.
          </button>
          <button
            type="button"
            onClick={() => onSelectView('distillation')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'distillation'
                ? 'text-teal-800 font-semibold underline'
                : ''
            }`}
          >
            Distillation
          </button>
          <button
            type="button"
            onClick={() => onSelectView('thermodynamics')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'thermodynamics'
                ? 'text-teal-800 font-semibold underline'
                : ''
            }`}
          >
            Thermodynamics
          </button>
          <button
            type="button"
            onClick={() => onSelectView('process-control')}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
              activeView === 'process-control'
                ? 'text-teal-800 font-semibold underline'
                : ''
            }`}
          >
            Process Control
          </button>
          <button
            type="button"
            onClick={() => onSelectView('overview', 'roadmap')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Roadmap
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {isInsideLab ? (
            <button
              type="button"
              onClick={() => onSelectView('directory')}
              className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Browse All Labs
            </button>
          ) : activeView === 'directory' ? (
            <button
              type="button"
              onClick={() => onSelectView('process-control')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Open Process Control Lab
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectView('directory')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Explore Laboratories
            </button>
          )}
        </div>
      </div>

      {/* Compact Mobile Navigation Strip */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden border-t border-slate-100 px-6 py-2 flex items-center gap-5 overflow-x-auto text-xs font-medium text-slate-700"
      >
        <button
          type="button"
          onClick={() => onSelectView('overview')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'overview'
              ? 'text-slate-900 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Platform
        </button>
        <button
          type="button"
          onClick={() => onSelectView('directory')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'directory'
              ? 'text-slate-900 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Laboratories
        </button>
        <button
          type="button"
          onClick={() => onSelectView('heat-exchanger')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'heat-exchanger'
              ? 'text-teal-800 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Heat Exchanger
        </button>
        <button
          type="button"
          onClick={() => onSelectView('fluid-mechanics')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'fluid-mechanics'
              ? 'text-teal-800 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Fluid Mechanics
        </button>
        <button
          type="button"
          onClick={() => onSelectView('reaction-engineering')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'reaction-engineering'
              ? 'text-teal-800 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Reaction Eng.
        </button>
        <button
          type="button"
          onClick={() => onSelectView('distillation')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'distillation'
              ? 'text-teal-800 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Distillation
        </button>
        <button
          type="button"
          onClick={() => onSelectView('thermodynamics')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'thermodynamics'
              ? 'text-teal-800 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Thermodynamics
        </button>
        <button
          type="button"
          onClick={() => onSelectView('process-control')}
          className={`whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
            activeView === 'process-control'
              ? 'text-teal-800 font-semibold underline underline-offset-4'
              : ''
          }`}
        >
          Process Control
        </button>
        <button
          type="button"
          onClick={() => onSelectView('overview', 'roadmap')}
          className="whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          Roadmap
        </button>
      </nav>
    </header>
  );
}
