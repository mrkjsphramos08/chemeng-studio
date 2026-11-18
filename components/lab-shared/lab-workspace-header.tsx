'use client';

import React from 'react';
import { BookmarkPlus, Download, RotateCcw, Target } from 'lucide-react';

export interface LabPresetOption {
  id: string;
  name: string;
  description: string;
}

export interface LabObjectiveItem {
  title: string;
  detail: string;
}

export interface LabWorkflowStep {
  title: string;
  detail: string;
}

interface LabWorkspaceHeaderProps {
  kickerItems: string[];
  title: string;
  description: string;
  presets: LabPresetOption[];
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  onSaveScenario: () => void;
  savedCount: number;
  canSave: boolean;
  onDownloadCsv?: () => void;
  canDownload?: boolean;
  onReset: () => void;
  learningObjectives: LabObjectiveItem[];
  workflowSteps: LabWorkflowStep[];
}

export function LabWorkspaceHeader({
  kickerItems,
  title,
  description,
  presets,
  selectedPresetId,
  onSelectPreset,
  onSaveScenario,
  savedCount,
  canSave,
  onDownloadCsv,
  canDownload = true,
  onReset,
  learningObjectives,
  workflowSteps,
}: LabWorkspaceHeaderProps) {
  const activePreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-5 border-b border-slate-100">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-teal-800 font-medium">
            {kickerItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>

        {/* Preset Operating Scenarios, Snapshot, Export & Reset Toolbar */}
        <div className="flex flex-col gap-2 min-w-0 max-w-full lg:shrink-0">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col min-w-0 max-w-full w-full sm:w-auto">
              <label
                htmlFor="preset-selector"
                className="text-xs font-medium text-slate-700 mb-1"
              >
                Operating Scenario Preset
              </label>
              <select
                id="preset-selector"
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="w-full sm:w-auto max-w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
                {selectedPresetId === 'custom' && (
                  <option value="custom">Custom Operating Conditions</option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={onSaveScenario}
              disabled={!canSave}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Snapshot Run ({savedCount})
            </button>

            {onDownloadCsv && (
              <button
                type="button"
                onClick={onDownloadCsv}
                disabled={!canDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>

          {activePreset && (
            <p className="text-[11px] text-slate-600 max-w-xl">{activePreset.description}</p>
          )}
        </div>
      </div>

      {/* Learning Objectives Panel */}
      <div
        className="bg-slate-50 border border-slate-200/80 rounded-lg p-4"
        data-testid="learning-objectives"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-2">
          <Target className="w-4 h-4 text-teal-800 shrink-0" />
          <span>Laboratory Learning Objectives — What You Will Learn</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700">
          {learningObjectives.map((obj, idx) => (
            <div key={idx}>
              <span className="font-semibold text-slate-900">{obj.title}</span> {obj.detail}
            </div>
          ))}
        </div>
      </div>

      {/* 4-Step Guided Laboratory Workflow */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-700 pt-1"
        data-testid="guided-workflow"
      >
        {workflowSteps.map((step, idx) => (
          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
            <div className="font-bold text-teal-900 mb-0.5">{step.title}</div>
            <p className="text-slate-600">{step.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
