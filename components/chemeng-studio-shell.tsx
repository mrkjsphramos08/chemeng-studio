'use client';

import React, { useState } from 'react';
import { Navbar, ActiveView } from '@/components/navbar';
import {
  HeroSection,
  InteractiveLearningSection,
  PlatformRoadmapSection,
  StudentsAndEducatorsSection,
  Footer,
} from '@/components/landing-sections';
import { LabsDirectory, AvailableLabId } from '@/components/labs-directory';
import { HeatExchangerLab } from '@/components/heat-exchanger-lab';
import { FluidMechanicsLab } from '@/components/fluid-mechanics-lab';
import { ReactionEngineeringLab } from '@/components/reaction-engineering-lab';

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

  const handleOpenLab = (labId: AvailableLabId) => {
    handleSelectView(labId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar activeView={activeView} onSelectView={handleSelectView} />

      <main className="flex-1">
        {activeView === 'overview' && (
          <>
            <HeroSection
              onOpenLab={handleOpenLab}
              onExploreDirectory={() =>
                handleSelectView('overview', 'laboratories-directory')
              }
            />
            <InteractiveLearningSection />
            <div className="border-b border-slate-200">
              <LabsDirectory onOpenLab={handleOpenLab} />
            </div>
            <PlatformRoadmapSection
              onExploreDirectory={() => handleSelectView('directory')}
            />
            <StudentsAndEducatorsSection onOpenLab={handleOpenLab} />
          </>
        )}

        {activeView === 'directory' && (
          <LabsDirectory onOpenLab={handleOpenLab} />
        )}

        {activeView === 'heat-exchanger' && <HeatExchangerLab />}

        {activeView === 'fluid-mechanics' && <FluidMechanicsLab />}

        {activeView === 'reaction-engineering' && <ReactionEngineeringLab />}
      </main>

      <Footer onSelectView={handleSelectView} />
    </div>
  );
}
