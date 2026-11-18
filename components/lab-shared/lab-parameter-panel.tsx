'use client';

import React from 'react';

export interface LabControlGroup {
  id: string;
  title: string;
}

export interface LabSliderControlConfig<K extends string> {
  key: K;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  inputMin?: number;
  inputMax?: number;
  inputStep?: number | string;
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
  footerContent?: React.ReactNode;
}

export function LabParameterPanel<T extends object>({
  title = 'Step 1 · Operating Parameters',
  subtitle,
  groups,
  controls,
  values,
  onChange,
  onReset,
  footerContent,
}: LabParameterPanelProps<T>) {
  return (
    <aside className="lg:col-span-4 min-w-0 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-600">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.id} className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-700 border-b border-slate-100 pb-1">
              {group.title}
            </h3>
            {controls
              .filter((c) => c.group === group.id)
              .map((ctrl) => {
                const value = Number(values[ctrl.key]);
                const sliderId = `slider-${ctrl.key}`;
                const numberId = `number-${ctrl.key}`;
                return (
                  <div
                    key={ctrl.key}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={numberId} className="text-xs font-semibold text-slate-800">
                        {ctrl.label}{' '}
                        <span className="font-mono text-slate-600 font-normal">
                          ({ctrl.symbol})
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id={numberId}
                          type="number"
                          min={ctrl.inputMin ?? ctrl.min}
                          max={ctrl.inputMax ?? ctrl.max}
                          step={ctrl.inputStep ?? ctrl.step}
                          value={value}
                          onChange={(e) => onChange(ctrl.key, e.target.value)}
                          aria-label={`${ctrl.label} in ${ctrl.unit}`}
                          className="w-20 px-2 py-1 text-right text-xs font-mono font-semibold text-slate-900 bg-white border border-slate-300 rounded focus-visible:outline-2 focus-visible:outline-teal-700 tabular-nums"
                        />
                        <span className="text-[11px] font-mono text-slate-600 w-16 shrink-0">
                          {ctrl.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {ctrl.min}
                      </span>
                      <input
                        id={sliderId}
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step}
                        value={Math.min(ctrl.max, Math.max(ctrl.min, value))}
                        onChange={(e) => onChange(ctrl.key, e.target.value)}
                        aria-label={`${ctrl.label} slider`}
                        className="w-full accent-teal-700 cursor-pointer h-1.5 bg-slate-200 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                      />
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {ctrl.max}
                      </span>
                    </div>

                    {ctrl.helperText && (
                      <p className="text-[11px] text-slate-600 leading-snug">{ctrl.helperText}</p>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {footerContent && <div className="pt-3 border-t border-slate-100 text-xs">{footerContent}</div>}
    </aside>
  );
}
