'use client';

import React, { useState } from 'react';
import {
  parseEditableNumericDraft,
  resolveNumericDraftOnBlur,
} from '@/lib/numeric-input';

export interface NumericDraftInputProps {
  id?: string;
  value: number;
  onCommit: (nextValue: number, rawString: string) => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
  /** Optional display formatter when the input is not actively focused (e.g., fixed decimals). */
  formatValue?: (val: number) => string;
}

/**
 * Controlled numeric input that preserves temporary user editing states
 * (empty string, trailing decimal point, leading minus sign, incomplete exponent)
 * while focused, commits valid finite numbers promptly for live recalculation,
 * and safely restores the last valid numeric state on blur if left empty/invalid.
 */
export function NumericDraftInput({
  id,
  value,
  onCommit,
  min,
  max,
  step,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  formatValue,
}: NumericDraftInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue =
    draft !== null ? draft : formatValue ? formatValue(value) : String(value);

  const handleFocus = () => {
    setDraft(formatValue ? formatValue(value) : String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextRaw = e.target.value;
    setDraft(nextRaw);

    const parsed = parseEditableNumericDraft(nextRaw);
    if (parsed.isComplete && parsed.value !== undefined) {
      onCommit(parsed.value, nextRaw);
    }
  };

  const handleBlur = () => {
    if (draft !== null) {
      const resolved = resolveNumericDraftOnBlur(draft, value);
      if (resolved !== value) {
        onCommit(resolved, String(resolved));
      }
      setDraft(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setDraft(null);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      id={id}
      type="number"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      data-testid={dataTestId}
    />
  );
}
