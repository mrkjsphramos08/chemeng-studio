'use client';

import React, { useState } from 'react';
import { Navbar, ActiveView } from '@/components/navbar';
import { LandingSections } from '@/components/landing-sections';
import { LabsDirectory, AvailableLabId } from '@/components/labs-directory';
import { HeatExchangerLab } from '@/components/heat-exchanger-lab';
import { FluidMechanicsLab } from '@/components/fluid-mechanics-lab';
import { ReactionEngineeringLab } from '@/components/reaction-engineering-lab';
import { DistillationLab } from '@/components/distillation-lab';
import { ThermodynamicsLab } from '@/components/thermodynamics-lab';
import { ProcessControlLab } from '@/components/process-control-lab';

interface ChemEngStudioShellProps {
  initialView: ActiveView;
}

export function ChemEngStudioShell({ initialView }: ChemEngStudioShellProps) {
  const [activeView, setActiveView] = useState<ActiveView>(initialView);

  const handleSelectView = (view: ActiveView, sectionId?: string) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      if (sectionId) {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-x-hidden">
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
