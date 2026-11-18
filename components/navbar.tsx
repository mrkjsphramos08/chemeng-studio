'use client';

import React, { useState } from 'react';
import {
  Flame,
  Waves,
  FlaskConical,
  Layers,
  Gauge,
  Sliders,
  Compass,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { EntrolumeLogo } from './entrolume-logo';

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

const LAB_SWITCHER_ITEMS: {
  id: ActiveView;
  code: string;
  label: string;
  shortLabel: string;
  testId: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'heat-exchanger',
    code: '01',
    label: 'Heat Exchanger',
    shortLabel: 'Heat Exchanger',
    testId: 'nav-heat-exchanger',
    icon: Flame,
  },
  {
    id: 'fluid-mechanics',
    code: '02',
    label: 'Fluid Mechanics',
    shortLabel: 'Fluid Mechanics',
    testId: 'nav-fluid-mechanics',
    icon: Waves,
  },
  {
    id: 'reaction-engineering',
    code: '03',
    label: 'Reaction Engineering',
    shortLabel: 'Reaction Eng.',
    testId: 'nav-reaction-engineering',
    icon: FlaskConical,
  },
  {
    id: 'distillation',
    code: '04',
    label: 'Distillation',
    shortLabel: 'Distillation',
    testId: 'nav-distillation',
    icon: Layers,
  },
  {
    id: 'thermodynamics',
    code: '05',
    label: 'Thermodynamics',
    shortLabel: 'Thermodynamics',
    testId: 'nav-thermodynamics',
    icon: Gauge,
  },
  {
    id: 'process-control',
    code: '06',
    label: 'Process Control',
    shortLabel: 'Process Control',
    testId: 'nav-process-control',
    icon: Sliders,
  },
];

export function Navbar({ activeView, onSelectView }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLabActive = LAB_SWITCHER_ITEMS.some((lab) => lab.id === activeView);

  const handleNav = (view: ActiveView, sectionId?: string) => {
    setMobileMenuOpen(false);
    onSelectView(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      {/* Primary 3-Zone Top Bar */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Identity */}
        <button
          type="button"
          onClick={() => handleNav('overview')}
          className="flex items-center gap-2.5 text-left group focus:outline-none shrink-0 cursor-pointer"
          data-testid="nav-brand"
          aria-label="Entrolume Home — Explore. Simulate. Understand."
        >
          <EntrolumeLogo variant="dark-ink" size="md" />
        </button>

        {/* Zone 2: Primary Platform Navigation (5 single-line links) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-1 lg:gap-1.5"
        >
          <button
            type="button"
            onClick={() => handleNav('overview')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'overview'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            data-testid="nav-overview"
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => handleNav('directory')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeView === 'directory'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            data-testid="nav-directory"
          >
            Laboratories (6)
          </button>

          <button
            type="button"
            onClick={() => handleNav('overview', 'how-it-works-section')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            data-testid="nav-how-it-works"
          >
            How It Works
          </button>

          <button
            type="button"
            onClick={() => handleNav('overview', 'educators-section')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            data-testid="nav-educators"
          >
            For Educators
          </button>

          <button
            type="button"
            onClick={() => handleNav('overview', 'roadmap-section')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            data-testid="nav-roadmap"
          >
            Roadmap
          </button>
        </nav>

        {/* Zone 3: Single Primary Action & Mobile Drawer Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              handleNav(isLabActive ? 'directory' : 'heat-exchanger')
            }
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap bg-teal-700 hover:bg-teal-600 text-white transition-colors shadow-2xs cursor-pointer"
            data-testid="nav-primary-cta"
          >
            {isLabActive ? (
              <>
                <Compass className="w-3.5 h-3.5" />
                Browse All Labs
              </>
            ) : (
              <>
                Explore Laboratories
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            data-testid="nav-mobile-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Secondary 6-Laboratory Quick-Switcher Strip */}
      <div className="bg-slate-50/90 border-t border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap mr-1.5 hidden lg:inline">
            Virtual Labs:
          </span>
          {LAB_SWITCHER_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                data-testid={item.testId}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? 'text-teal-200' : 'text-teal-700'
                  }`}
                />
                <span className="font-mono text-[10px] opacity-75">
                  {item.code}
                </span>
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg"
          data-testid="nav-mobile-drawer"
        >
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Entrolume Platform
            </div>
            <button
              type="button"
              onClick={() => handleNav('overview')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'overview'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Platform Overview
            </button>
            <button
              type="button"
              onClick={() => handleNav('directory')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeView === 'directory'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Virtual Laboratories Directory (6)
            </button>
            <button
              type="button"
              onClick={() => handleNav('overview', 'how-it-works-section')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              How Entrolume Works
            </button>
            <button
              type="button"
              onClick={() => handleNav('overview', 'educators-section')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              For Students & Educators
            </button>
            <button
              type="button"
              onClick={() => handleNav('overview', 'roadmap-section')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Platform Roadmap
            </button>
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-1">
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Launch Virtual Laboratory
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {LAB_SWITCHER_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                      isSelected
                        ? 'bg-teal-700 text-white font-semibold'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-teal-200' : 'text-teal-700'
                      }`}
                    />
                    <span className="font-mono text-[11px] opacity-75">
                      {item.code}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
