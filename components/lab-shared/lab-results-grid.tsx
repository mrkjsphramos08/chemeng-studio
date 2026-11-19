'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  valueClassName = 'text-xl sm:text-2xl text-slate-900',
}: LabMetricCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between transition-colors hover:border-slate-300"
      data-testid={testId}
    >
      <div className="text-xs font-medium text-slate-600 leading-snug">
        <MathText text={label} />
      </div>
      <div
        className={`font-mono font-bold tracking-tight mt-1.5 tabular-nums ${valueClassName}`}
      >
        <MathText text={value} />
      </div>
      <div className="text-[11px] font-mono text-slate-600 mt-1 leading-normal">
        <MathText text={subtext} />
      </div>
    </div>
  );
}

export interface LabAdditionalMetricsDisclosureProps {
  count: number;
  summary: string;
  children: React.ReactNode;
  testId?: string;
}

export function LabAdditionalMetricsDisclosure({
  count,
  summary,
  children,
  testId = 'additional-metrics-disclosure',
}: LabAdditionalMetricsDisclosureProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-slate-50/70 border border-slate-200/90 rounded-xl"
      data-testid={testId}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        data-testid="additional-metrics-toggle"
        className="w-full px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100/70 rounded-xl transition-colors cursor-pointer"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-slate-900">Additional Metrics ({count})</span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="font-normal text-slate-600 truncate">
            <MathText text={summary} />
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-teal-700 shrink-0">
          <span>{expanded ? 'Hide' : 'Show'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/70">
          {children}
        </div>
      )}
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
      <div className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {kicker && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 block mb-0.5">
                <MathText text={kicker} />
              </span>
            )}
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              <MathText text={title} />
            </h3>
          </div>
          {effectiveRight && (
            <div className="shrink-0 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
              {typeof effectiveRight === 'string' ? (
                <MathText text={effectiveRight} />
              ) : (
                effectiveRight
              )}
            </div>
          )}
        </div>
        {effectiveSub && (
          <p className="text-xs text-slate-600 leading-relaxed">
            <MathText text={effectiveSub} />
          </p>
        )}
      </div>

      {children}

      {footer && (
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs text-slate-600 font-mono tabular-nums">
          {footer}
        </div>
      )}
    </div>
  );
}
