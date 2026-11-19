/**
 * Pure helpers for controlled numeric input editing (Batch 5B Task 5)
 * and ARIA tablist keyboard navigation (Batch 5B Task 2).
 */

export interface NumericDraftParseResult {
  /** True when the draft string represents a complete, finite numeric value ready to commit. */
  isComplete: boolean;
  /** Parsed finite number when `isComplete` is true. */
  value?: number;
}

const INCOMPLETE_NUMERIC_DRAFT = /^[+-]?$|^[+-]?\.$|^[+-]?\d+\.$|^[+-]?(?:\d+\.?\d*|\.\d+)[eE][+-]?$/;

/**
 * Evaluates a user-typed numeric input draft without coercing temporary
 * empty or in-progress states (`""`, `"-"`, `"0."`, `"1e-"`) to zero.
 */
export function parseEditableNumericDraft(raw: string): NumericDraftParseResult {
  const trimmed = raw.trim();
  if (trimmed === '' || INCOMPLETE_NUMERIC_DRAFT.test(trimmed)) {
    return { isComplete: false };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { isComplete: false };
  }

  return { isComplete: true, value: parsed };
}

/**
 * Resolves a numeric draft when the input loses focus.
 * Empty or invalid final input safely restores `fallbackValue` (the last valid state).
 * A trailing decimal point like `"42."` is normalized to `42`.
 */
export function resolveNumericDraftOnBlur(raw: string, fallbackValue: number): number {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return fallbackValue;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  return parsed;
}

/**
 * Computes the next tab index for standard WAI-ARIA tablist keyboard navigation.
 * Supports ArrowRight, ArrowLeft, Home, and End with wrapping.
 * Returns `null` when the pressed key is not a tab-navigation key.
 */
export function getNextTabIndex(
  currentIndex: number,
  tabCount: number,
  key: string
): number | null {
  if (tabCount <= 0) return null;

  switch (key) {
    case 'ArrowRight':
      return (currentIndex + 1) % tabCount;
    case 'ArrowLeft':
      return (currentIndex - 1 + tabCount) % tabCount;
    case 'Home':
      return 0;
    case 'End':
      return tabCount - 1;
    default:
      return null;
  }
}
