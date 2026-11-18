'use client';

import React from 'react';

interface LabMetricCardProps {
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
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div
        className={`mt-1 font-bold font-mono tabular-nums ${valueClassName}`}
        data-testid={testId}
      >
        {value}
      </div>
      <div className="mt-1.5 text-xs text-slate-600 font-mono tabular-nums">{subtext}</div>
    </div>
  );
}

interface LabChartCardProps {
  title: string;
  subtitle: string;
  rightMeta?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function LabChartCard({
  title,
  subtitle,
  rightMeta,
  footer,
  className = '',
  children,
}: LabChartCardProps) {
  return (
    <div
      className={`min-w-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {rightMeta && (
            <div className="text-xs font-mono text-slate-600 tabular-nums">{rightMeta}</div>
          )}
        </div>
        <p className="text-xs text-slate-600 mb-4">{subtitle}</p>
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
