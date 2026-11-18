'use client';

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { MathText } from '@/components/lab-shared/math';

export interface LabValidationMessage {
  severity: 'error' | 'warning';
  message: string;
}

interface LabValidationAlertsProps {
  issues: LabValidationMessage[];
  warningTitle?: string;
}

export function LabValidationAlerts({
  issues,
  warningTitle = 'Educational Model Advisory (Simplified Constant-Property Calculation)',
}: LabValidationAlertsProps) {
  const errorIssues = issues.filter((i) => i.severity === 'error');
  const warningIssues = issues.filter((i) => i.severity === 'warning');

  if (errorIssues.length === 0 && warningIssues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {errorIssues.length > 0 && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start gap-3 text-rose-950"
          data-testid="validation-error-banner"
        >
          <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-sm">Validation Error — Simulation Paused</div>
            <ul className="list-disc list-inside space-y-0.5">
              {errorIssues.map((issue, idx) => (
                <li key={idx}>
                  <MathText text={issue.message} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {warningIssues.length > 0 && (
        <div
          role="status"
          className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-amber-950"
          data-testid="scientific-advisory-banner"
        >
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <div className="font-semibold text-sm">
              <MathText text={warningTitle} />
            </div>
            {warningIssues.map((warn, idx) => (
              <p key={idx}>
                <MathText text={warn.message} />
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
