import React from 'react';
import { ActiveView } from '@/components/navbar';
import { ChemEngStudioShell } from '@/components/chemeng-studio-shell';
import { parseViewFromParam } from '@/lib/navigation';

interface PageProps {
  searchParams: Promise<{ view?: string; autostart?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const parsed = parseViewFromParam(
    resolvedParams.view,
    resolvedParams.autostart
  );
  const initialView: ActiveView =
    parsed === 'landing' ? 'overview' : parsed;

  return <ChemEngStudioShell initialView={initialView} />;
}
