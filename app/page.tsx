import React from 'react';
import { ActiveView } from '@/components/navbar';
import { ChemEngStudioShell } from '@/components/chemeng-studio-shell';

interface PageProps {
  searchParams: Promise<{ view?: string; autostart?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  let initialView: ActiveView = 'overview';

  if (resolvedParams.view === 'process-control') {
    initialView = 'process-control';
  } else if (resolvedParams.view === 'thermodynamics') {
    initialView = 'thermodynamics';
  } else if (
    resolvedParams.view === 'distillation' ||
    resolvedParams.view === 'distillation-separations'
  ) {
    initialView = 'distillation';
  } else if (resolvedParams.view === 'reaction-engineering') {
    initialView = 'reaction-engineering';
  } else if (resolvedParams.view === 'fluid-mechanics') {
    initialView = 'fluid-mechanics';
  } else if (
    resolvedParams.autostart === '1' ||
    resolvedParams.view === 'lab' ||
    resolvedParams.view === 'heat-exchanger'
  ) {
    initialView = 'heat-exchanger';
  } else if (resolvedParams.view === 'directory') {
    initialView = 'directory';
  }

  return <ChemEngStudioShell initialView={initialView} />;
}
