'use client';

import React from 'react';
import { RotateCcw, Sliders } from 'lucide-react';
import { MathInline, MathText } from '@/components/lab-shared/math';

export interface LabControlGroup {
  id: string;
  title: string;
}

export interface LabSliderControlConfig<K extends string = string> {
  key: K;
  label: string;
  symbol: string;
  symbolLatex?: string;
  unit: string;
  unitLatex?: string;
  min: number;
  max: number;
  step: number;
  inputMin?: number;
  inputMax?: number;
  inputStep?: number | 'any';
  group: string;
  helperText?: string;
}

interface LabParameterPanelProps<T extends object> {
  title?: string;
  subtitle: string;
  groups: LabControlGroup[];
  controls: LabSliderControlConfig<Extract<keyof T, string>>[];
  values: T;
  onChange: (key: Extract<keyof T, string>, rawValue: string) => void;
  onReset: () => void;
  topSlot?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function LabParameterPanel<T extends object>({
  title = 'Step 1 · Configure Parameters',
  subtitle,
  groups,
  controls,
  values,
  onChange,
  onReset,
  topSlot,
  footerContent,
}: LabParameterPanelProps<T>) {
  return (
    <div
      className="lg:col-span-4 min-w-0 bg-white border border-slate-200 rounded-xl p-5 space-y-5"
      data-testid="parameter-controls-panel"
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-800 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">
              <MathText text={title} />
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            <MathText text={subtitle} />
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {topSlot && <div className="pb-2 border-b border-slate-100">{topSlot}</div>}

      <div className="space-y-6">
        {groups.map((group, gIdx) => {
          const groupControls = controls.filter((c) => c.group === group.id);
          if (groupControls.length === 0) return null;

          return (
            <div
              key={group.id}
              className={`space-y-4 ${gIdx > 0 ? 'pt-4 border-t border-slate-100' : ''}`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-teal-900">
                <MathText text={group.title} />
              </div>

              <div className="space-y-4">
                {groupControls.map((ctrl) => {
                  const rawVal = values[ctrl.key as keyof T];
                  const numValue = typeof rawVal === 'number' ? rawVal : Number(rawVal ?? 0);
                  const sliderVal = Number.isFinite(numValue)
                    ? Math.min(ctrl.max, Math.max(ctrl.min, numValue))
                    : ctrl.min;

                  return (
                    <div key={ctrl.key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`input-${ctrl.key}`}
                          className="text-xs font-medium text-slate-800 flex items-baseline gap-1.5"
                        >
                          <span>
                            <MathText text={ctrl.label} />
                          </span>
                          <span className="text-slate-600 font-medium">
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
                          <input
                            id={`input-${ctrl.key}`}
                            type="number"
                            min={ctrl.inputMin ?? ctrl.min}
                            max={ctrl.inputMax ?? ctrl.max}
                            step={ctrl.inputStep ?? ctrl.step}
                            value={Number.isNaN(numValue) ? '' : numValue}
                            onChange={(e) => onChange(ctrl.key, e.target.value)}
                            className="w-24 px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus-visible:outline-2 focus-visible:outline-teal-700 tabular-nums"
                          />
                          <span className="text-[11px] font-mono text-slate-600 w-16 truncate">
                            {ctrl.unitLatex ? (
                              <MathInline latex={ctrl.unitLatex} />
                            ) : (
                              ctrl.unit
                            )}
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        aria-label={`${ctrl.label} (${ctrl.symbol}) slider`}
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step}
                        value={sliderVal}
                        onChange={(e) => onChange(ctrl.key, e.target.value)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-700"
                      />

                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>
                          {ctrl.min} {ctrl.unit}
                        </span>
                        <span>
                          {ctrl.max} {ctrl.unit}
                        </span>
                      </div>

                      {ctrl.helperText && (
                        <p className="text-[11px] text-slate-600 leading-snug pt-0.5">
                          <MathText text={ctrl.helperText} />
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {footerContent && <div className="pt-3 border-t border-slate-100">{footerContent}</div>}
    </div>
  );
}
