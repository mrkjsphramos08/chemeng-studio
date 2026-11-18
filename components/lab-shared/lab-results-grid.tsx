'use client';

import React from 'react';
import { MathText } from '@/components/lab-shared/math';

export interface LabMetricCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  subtext: React.ReactNode;
  testId?: string;
  valueClassName?: string;
  className?: string;
}

export function LabMetricCard({
  label,
  value,
  subtext,
  testId,
  valueClassName = 'text-2xl text-slate-900',
  className = '',
}: LabMetricCardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between ${className}`}
      data-testid={testId}
    >
      <div className="text-xs font-medium text-slate-600">
        <MathText text={label} />
      </div>
      <div className={`mt-1.5 font-mono font-bold tabular-nums tracking-tight ${valueClassName}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[11px] font-mono text-slate-600 tabular-nums">
        <MathText text={subtext} />
      </div>
    </div>
  );
}

export interface LabChartCardProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  rightMeta?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LabChartCard({
  title,
  subtitle,
  rightMeta,
  footer,
  children,
  className = '',
}: LabChartCardProps) {
  return (
    <div
      className={`min-w-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h3 className="text-base font-semibold text-slate-900">
            <MathText text={title} />
          </h3>
          {rightMeta && (
            <span className="text-xs font-mono text-slate-600 tabular-nums">
              <MathText text={rightMeta} />
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          <MathText text={subtitle} />
        </p>
      </div>

      {children}

      {footer && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums">
          {footer}
        </div>
      )}
    </div>
  );
}
