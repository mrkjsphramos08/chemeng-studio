'use client';

import React, { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { MathInline, MathText } from './math';
import { NumericDraftInput } from './numeric-draft-input';

export interface LabSliderControlConfig<K extends string = string> {
  key: K;
  label: string;
  symbol: string;
  /** Optional LaTeX string for the parameter symbol (e.g. "T_{h,\\mathrm{in}}") */
  symbolLatex?: string;
  unit: string;
  /** Optional LaTeX string for the engineering unit (e.g. "\\mathrm{kJ/(kg\\cdot K)}") */
  unitLatex?: string;
  min: number;
  max: number;
  step: number;
  inputMin?: number;
  inputMax?: number;
  inputStep?: number | 'any';
  group: string;
  helpText?: string;
  helperText?: string;
}

export interface LabControlGroup {
  id: string;
  title: string;
}

export interface LabParameterPanelProps<T extends object> {
  title?: string;
  subtitle?: string;
  groups: LabControlGroup[];
  controls: LabSliderControlConfig<Extract<keyof T, string>>[];
  values: T;
  onChange: (key: Extract<keyof T, string>, rawValue: string) => void;
  onReset: () => void;
  topSlot?: React.ReactNode;
  headerSlot?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function LabParameterPanel<T extends object>({
  title = 'Operating Parameters',
  subtitle = 'User-configurable SI inputs (real-time recalculation)',
  groups,
  controls,
  values,
  onChange,
  onReset,
  topSlot,
  headerSlot,
  footerContent,
}: LabParameterPanelProps<T>) {
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>(
    {}
  );

  const toggleGroup = (groupId: string) => {
    setCollapsedGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div
      className="lg:col-span-4 min-w-0 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 lg:sticky lg:top-28 lg:self-start"
      data-testid="lab-parameter-panel"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>01. Configure · User Inputs</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">{title}</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            <MathText text={subtitle} />
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 rounded-md px-1.5 py-1"
          data-testid="panel-reset-button"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>

      {(topSlot || headerSlot) && <div className="pb-1">{topSlot ?? headerSlot}</div>}

      <div className="divide-y divide-slate-200/80">
        {groups.map((group) => {
          const groupControls = controls.filter((c) => c.group === group.id);
          if (groupControls.length === 0) return null;
          const isCollapsed = Boolean(collapsedGroupIds[group.id]);
          const groupBodyId = `param-group-${group.id}`;

          return (
            <div key={group.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between text-left gap-2 rounded-lg bg-slate-50/90 px-2.5 py-1.5 hover:bg-slate-100/80 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
                aria-expanded={!isCollapsed}
                aria-controls={groupBodyId}
              >
                <span className="text-xs font-bold tracking-wide text-slate-800">
                  <MathText text={group.title} />
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 shrink-0 whitespace-nowrap">
                  <span>{groupControls.length} params</span>
                  {isCollapsed ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                  )}
                </span>
              </button>

              {!isCollapsed && (
                <div id={groupBodyId} className="divide-y divide-slate-100 px-0.5">
                  {groupControls.map((ctrl) => {
                    const currentVal = Number(
                      (values as Record<string, unknown>)[ctrl.key] ?? 0
                    );
                    const effectiveHelp = ctrl.helpText ?? ctrl.helperText;
                    const plainLabel = ctrl.label.replace(/\$[^$]*\$/g, '').trim();
                    return (
                      <div key={ctrl.key} className="py-2.5 first:pt-1 last:pb-0.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor={`input-${ctrl.key}`}
                            className="text-xs font-semibold text-slate-800 leading-snug"
                          >
                            <MathText text={ctrl.label} />{' '}
                            <span className="text-slate-600 font-normal whitespace-nowrap inline-flex items-baseline">
                              (
                              {ctrl.symbolLatex ? (
                                <MathInline latex={ctrl.symbolLatex} />
                              ) : (
                                <span className="font-mono">{ctrl.symbol}</span>
                              )}
                              )
                            </span>
                          </label>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <NumericDraftInput
                              id={`input-${ctrl.key}`}
                              aria-label={`${plainLabel} (${ctrl.symbol}, ${ctrl.unit}) numeric input`}
                              min={ctrl.inputMin}
                              max={ctrl.inputMax}
                              step={ctrl.inputStep ?? ctrl.step}
                              value={currentVal}
                              onCommit={(_num, rawStr) => onChange(ctrl.key, rawStr)}
                              className="w-24 min-w-[6rem] px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white tabular-nums"
                              data-testid={`number-${ctrl.key}`}
                            />
                            <span className="text-[11px] text-slate-600 shrink-0 whitespace-nowrap">
                              {ctrl.unitLatex ? (
                                <MathInline latex={ctrl.unitLatex} />
                              ) : (
                                <span className="font-mono">{ctrl.unit}</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <input
                          type="range"
                          aria-label={`${plainLabel} (${ctrl.symbol}, ${ctrl.unit}) slider`}
                          min={ctrl.min}
                          max={ctrl.max}
                          step={ctrl.step}
                          value={Math.min(Math.max(currentVal, ctrl.min), ctrl.max)}
                          onChange={(e) => onChange(ctrl.key, e.target.value)}
                          className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer accent-teal-700"
                          data-testid={`slider-${ctrl.key}`}
                        />

                        <div className="flex justify-between items-center text-[11px] font-mono text-slate-600 tabular-nums">
                          <span>Min: {ctrl.min}</span>
                          <span>Max: {ctrl.max}</span>
                        </div>
                        {effectiveHelp && (
                          <div className="text-[11px] font-sans text-slate-600 leading-snug pt-0.5">
                            <MathText text={effectiveHelp} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {footerContent && (
        <div className="pt-3 border-t border-slate-100 text-xs">{footerContent}</div>
      )}
    </div>
  );
}
