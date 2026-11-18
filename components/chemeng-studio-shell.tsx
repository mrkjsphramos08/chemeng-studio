'use client';

import React, { useEffect, useState } from 'react';
import { Navbar, ActiveView } from '@/components/navbar';
import { LandingSections } from '@/components/landing-sections';
import { LabsDirectory, AvailableLabId } from '@/components/labs-directory';
import { HeatExchangerLab } from '@/components/heat-exchanger-lab';
import { FluidMechanicsLab } from '@/components/fluid-mechanics-lab';
import { ReactionEngineeringLab } from '@/components/reaction-engineering-lab';
import { DistillationLab } from '@/components/distillation-lab';
import { ThermodynamicsLab } from '@/components/thermodynamics-lab';
import { ProcessControlLab } from '@/components/process-control-lab';
import { buildViewUrl, parseViewFromSearch } from '@/lib/navigation';

interface ChemEngStudioShellProps {
  initialView: ActiveView;
}

export function ChemEngStudioShell({ initialView }: ChemEngStudioShellProps) {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);

  // Sync with browser URL on mount and browser Back / Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromLocation = () => {
      const parsed = parseViewFromSearch(window.location.search);
      const mapped: ActiveView = parsed === 'landing' ? 'overview' : parsed;
      setActiveView((prev) => (prev === mapped ? prev : mapped));
    };

    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  const handleSelectView = (view: ActiveView, sectionId?: string) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      const nextUrl = buildViewUrl(view, sectionId);
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl !== currentUrl) {
        window.history.pushState({ view, sectionId }, '', nextUrl);
      }

      if (sectionId) {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleOpenLab = (labId?: string) => {
    const validLabId = (labId ?? 'heat-exchanger') as AvailableLabId;
    handleSelectView(validLabId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-x-clip">
      <Navbar activeView={activeView} onSelectView={handleSelectView} />

      <main className="flex-1 min-w-0">
        {activeView === 'overview' && (
          <LandingSections
            onOpenLab={handleOpenLab}
            onOpenDirectory={() => handleSelectView('directory')}
          />
        )}

        {activeView === 'directory' && (
          <LabsDirectory onOpenLab={handleOpenLab} />
        )}

        {activeView === 'heat-exchanger' && <HeatExchangerLab />}

        {activeView === 'fluid-mechanics' && <FluidMechanicsLab />}

        {activeView === 'reaction-engineering' && <ReactionEngineeringLab />}

        {activeView === 'distillation' && <DistillationLab />}

        {activeView === 'thermodynamics' && <ThermodynamicsLab />}

        {activeView === 'process-control' && <ProcessControlLab />}
      </main>
    </div>
  );
}
