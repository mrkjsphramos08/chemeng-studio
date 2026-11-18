'use client';

import React from 'react';
import { MathText } from './math';

export interface LabMetricCardProps {
  label: string;
  value: string;
  subtext: string;
  testId?: string;
  valueClassName?: string;
}

export function LabMetricCard({
  label,
  value,
  subtext,
  testId,
  valueClassName = 'text-2xl text-slate-900',
}: LabMetricCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between transition-colors hover:border-slate-300"
      data-testid={testId}
    >
      <div className="text-xs font-medium text-slate-600 leading-snug">
        <MathText text={label} />
      </div>
      <div
        className={`font-mono font-bold tracking-tight mt-1.5 tabular-nums ${valueClassName}`}
      >
        {value}
      </div>
      <div className="text-[11px] font-mono text-slate-500 mt-1 leading-normal">
        <MathText text={subtext} />
      </div>
    </div>
  );
}

export interface LabChartCardProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  description?: string;
  rightMeta?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  testId?: string;
}

export function LabChartCard({
  kicker,
  title,
  subtitle,
  description,
  rightMeta,
  headerRight,
  children,
  footer,
  className = '',
  testId,
}: LabChartCardProps) {
  const effectiveSub = subtitle ?? description;
  const effectiveRight = rightMeta ?? headerRight;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4 ${className}`}
      data-testid={testId}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          {kicker && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 block mb-0.5">
              <MathText text={kicker} />
            </span>
          )}
          <h3 className="text-base font-bold text-slate-900">
            <MathText text={title} />
          </h3>
          {effectiveSub && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              <MathText text={effectiveSub} />
            </p>
          )}
        </div>
        {effectiveRight && (
          <div className="shrink-0 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            {typeof effectiveRight === 'string' ? (
              <MathText text={effectiveRight} />
            ) : (
              effectiveRight
            )}
          </div>
        )}
      </div>

      {children}

      {footer && <div className="pt-2 border-t border-slate-100">{footer}</div>}
    </div>
  );
}
