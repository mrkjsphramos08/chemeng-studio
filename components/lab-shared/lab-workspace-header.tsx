'use client';

import React, { useState } from 'react';
import {
  BookmarkPlus,
  Download,
  RotateCcw,
  BookOpen,
  Sliders,
  Compass,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Calculator,
  Scale,
} from 'lucide-react';
import { MathText } from './math';

export interface LabPresetItem {
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

export interface LabWorkspaceHeaderProps {
  kickerItems: string[];
  title: string;
  description: string;
  presets: LabPresetItem[];
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  onSaveScenario: () => void;
  savedCount: number;
  canSave?: boolean;
  onDownloadCsv: () => void;
  canDownload?: boolean;
  onReset: () => void;
  learningObjectives: LabObjectiveItem[];
  workflowSteps: LabWorkflowStep[];
  presetTestIdPrefix?: string;
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
  canSave = true,
  onDownloadCsv,
  canDownload = true,
  onReset,
  learningObjectives,
  workflowSteps,
  presetTestIdPrefix = 'preset-btn',
}: LabWorkspaceHeaderProps) {
  const [showOrientation, setShowOrientation] = useState(false);
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Top Row: Kicker, Title, Description & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <span className="font-mono text-slate-900">ENTROLUME</span>
            {kickerItems.map((item) => (
              <React.Fragment key={item}>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="text-teal-700">{item}</span>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            <MathText text={description} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSaveScenario}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white transition-colors cursor-pointer shadow-2xs"
            data-testid="header-save-scenario"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save Run ({savedCount})
          </button>

          <button
            type="button"
            onClick={onDownloadCsv}
            disabled={!canDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            data-testid="header-download-csv"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            data-testid="reset-defaults-button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Operating Scenario Preset Selector Bar */}
      <div className="pt-4 border-t border-slate-100 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Sliders className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span>Curated Engineering Scenario Presets:</span>
          </div>
          {selectedPreset && (
            <span className="text-xs text-slate-500">
              Active Preset:{' '}
              <strong className="font-semibold text-slate-700">
                {selectedPreset.name}
              </strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
                title={preset.description}
                data-testid={`${presetTestIdPrefix}-${preset.id}`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {selectedPreset && (
          <p className="text-xs text-slate-600 bg-slate-50/90 border border-slate-200/70 rounded-lg px-3 py-2">
            <span className="font-semibold text-slate-800">Scenario Focus: </span>
            <MathText text={selectedPreset.description} />
          </p>
        )}
      </div>

      {/* Collapsible Student Orientation, Learning Objectives & 4-Step Entrolume Workflow */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Distinction Legend: User Inputs vs. Calculated Simulation Outputs vs. Model Assumptions */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
              <strong className="font-semibold text-slate-800">Left Panel:</strong> User
              Operating Inputs
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-sky-700" />
              <strong className="font-semibold text-slate-800">Right Stage:</strong>{' '}
              Calculated Simulation Outputs
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-600" />
              <strong className="font-semibold text-slate-800">Bottom Deck:</strong>{' '}
              Assumptions & Guided Inquiry
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowOrientation((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            aria-expanded={showOrientation}
          >
            <span>
              {showOrientation
                ? 'Hide Objectives & Workflow Guide'
                : 'Show Objectives & Workflow Guide'}
            </span>
            {showOrientation ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {showOrientation && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
            <div className="lg:col-span-7 bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <BookOpen className="w-4 h-4 text-teal-700 shrink-0" />
                Learning Objectives
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
                {learningObjectives.map((obj) => (
                  <li key={obj.title} className="leading-relaxed">
                    <strong className="text-slate-800 font-semibold">
                      <MathText text={obj.title} />
                    </strong>{' '}
                    <MathText text={obj.detail} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 bg-teal-950 text-white rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <Compass className="w-4 h-4 text-teal-400 shrink-0" />
                Entrolume 4-Step Inquiry Workflow
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {workflowSteps.map((step) => (
                  <li key={step.title} className="leading-relaxed">
                    <span className="text-white font-semibold block">
                      <MathText text={step.title} />
                    </span>
                    <MathText text={step.detail} />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
