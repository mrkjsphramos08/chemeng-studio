'use client';

import React, { useId, useState } from 'react';
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
  Info,
} from 'lucide-react';
import { MathText } from './math';

export interface LabPresetItem {
  id: string;
  name: string;
  description: string;
  expectedObservation?: string;
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
  /** Optional compact control row rendered cleanly between the title row and Scenario row (e.g., module switcher). */
  headerSlot?: React.ReactNode;
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
  headerSlot,
}: LabWorkspaceHeaderProps) {
  const [showOrientation, setShowOrientation] = useState(false);
  const [showScenarioNotes, setShowScenarioNotes] = useState(false);
  const scenarioSelectId = useId();

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const selectValue = selectedPreset ? selectedPreset.id : 'custom';

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3"
      data-testid="lab-workspace-header"
    >
      {/* Top Row: Lab Identifier, Title, 1-Sentence Purpose & Essential Actions */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            {kickerItems.map((item, idx) => (
              <React.Fragment key={item}>
                {idx > 0 && (
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                )}
                <span>{item}</span>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-snug">
            <MathText text={description} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSaveScenario}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white transition-colors cursor-pointer shadow-2xs"
            data-testid="header-save-scenario"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save Run ({savedCount})
          </button>

          <button
            type="button"
            onClick={onDownloadCsv}
            disabled={!canDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            data-testid="header-download-csv"
          >
            <Download className="w-3.5 h-3.5 text-teal-700" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            data-testid="reset-defaults-button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {headerSlot && (
        <div className="pt-2.5 border-t border-slate-100">{headerSlot}</div>
      )}

      {/* Compact Single-Row Scenario Selector & Progressive Guide Controls */}
      <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <label
              htmlFor={scenarioSelectId}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 shrink-0"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span>Scenario</span>
            </label>

            <div className="relative min-w-0 flex-1 sm:flex-initial">
              <select
                id={scenarioSelectId}
                value={selectValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'custom') {
                    onSelectPreset(val);
                  }
                }}
                data-testid="scenario-preset-select"
                className="w-full sm:w-auto sm:min-w-[240px] max-w-full appearance-none rounded-lg border border-slate-300 bg-slate-50/70 hover:bg-white pl-3 pr-8 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors cursor-pointer"
              >
                {!selectedPreset && (
                  <option value="custom" disabled>
                    Custom (Modified Parameters)
                  </option>
                )}
                {presets.map((preset) => (
                  <option
                    key={preset.id}
                    value={preset.id}
                    data-testid={`${presetTestIdPrefix}-${preset.id}`}
                  >
                    {preset.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
                aria-hidden="true"
              />
            </div>
          </div>

          {selectedPreset && (
            <button
              type="button"
              onClick={() => setShowScenarioNotes((prev) => !prev)}
              aria-expanded={showScenarioNotes}
              data-testid="toggle-scenario-notes"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <Info className="w-3.5 h-3.5 text-teal-700" />
              <span>Scenario Focus</span>
              {showScenarioNotes ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowOrientation((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer ml-auto shrink-0"
            aria-expanded={showOrientation}
            data-testid="toggle-objectives-guide"
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

        {showScenarioNotes && selectedPreset && (
          <div
            className="text-xs text-slate-600 bg-slate-50/90 border border-slate-200/70 rounded-lg px-3 py-2 leading-relaxed space-y-1"
            data-testid="scenario-notes-panel"
          >
            <p>
              <span className="font-semibold text-slate-800">{selectedPreset.name}: </span>
              <MathText text={selectedPreset.description} />
            </p>
            {selectedPreset.expectedObservation && (
              <p className="text-[11px] text-slate-600 border-t border-slate-200/70 pt-1">
                <span className="font-semibold text-teal-800">Expected Observation: </span>
                <MathText text={selectedPreset.expectedObservation} />
              </p>
            )}
          </div>
        )}

        {showOrientation && (
          <div className="space-y-3 pt-1" data-testid="objectives-workflow-guide">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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

            {/* Workspace Layout Orientation Legend (inside disclosure to preserve simulation-first stage) */}
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600"
              data-testid="workspace-orientation-legend"
            >
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
                Assumptions &amp; Guided Inquiry
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
