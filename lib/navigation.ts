export type PlatformView =
  | 'landing'
  | 'directory'
  | 'heat-exchanger'
  | 'fluid-mechanics'
  | 'reaction-engineering'
  | 'distillation'
  | 'thermodynamics'
  | 'process-control';

export const VALID_VIEWS: readonly PlatformView[] = [
  'landing',
  'directory',
  'heat-exchanger',
  'fluid-mechanics',
  'reaction-engineering',
  'distillation',
  'thermodynamics',
  'process-control',
] as const;

export function isValidView(value: unknown): value is PlatformView {
  return (
    typeof value === 'string' &&
    (VALID_VIEWS as readonly string[]).includes(value)
  );
}

/**
 * Resolves a requested `?view=` and optional `?autostart=` query parameter
 * into a canonical `PlatformView`, supporting legacy aliases.
 */
export function parseViewFromParam(
  rawView?: string | string[] | null,
  rawAutostart?: string | string[] | null
): PlatformView {
  const viewValue = Array.isArray(rawView) ? rawView[0] : rawView;
  const autostartValue = Array.isArray(rawAutostart)
    ? rawAutostart[0]
    : rawAutostart;

  if (viewValue) {
    const normalized = viewValue.trim().toLowerCase();
    if (isValidView(normalized)) {
      return normalized;
    }
    if (normalized === 'overview' || normalized === 'home') {
      return 'landing';
    }
    if (normalized === 'lab') {
      return 'heat-exchanger';
    }
    if (normalized === 'distillation-separations') {
      return 'distillation';
    }
    if (normalized === 'labs' || normalized === 'catalog') {
      return 'directory';
    }
  }

  if (autostartValue === '1' || autostartValue === 'true') {
    return 'heat-exchanger';
  }

  return 'landing';
}

/**
 * Parses `window.location.search` (or any query string) into a canonical `PlatformView`.
 */
export function parseViewFromSearch(search: string): PlatformView {
  const trimmed = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(trimmed);
  return parseViewFromParam(params.get('view'), params.get('autostart'));
}

/**
 * Builds the canonical URL path + query string (+ optional hash) for a given `PlatformView` or `'overview'`.
 * - `'landing'` / `'overview'` -> `'/'` (or `'/#section-id'`)
 * - Any other view -> `'/?view=<view>'` (or `'/?view=<view>#section-id'`)
 */
export function buildViewUrl(
  view: PlatformView | 'overview',
  sectionHash?: string
): string {
  const cleanHash = sectionHash
    ? sectionHash.startsWith('#')
      ? sectionHash
      : `#${sectionHash}`
    : '';

  if (view === 'landing' || view === 'overview') {
    return `/${cleanHash}`;
  }

  return `/?view=${encodeURIComponent(view)}${cleanHash}`;
}

/**
 * Normalizes floating-point values near zero so that negative zero (`-0` or `-1e-15`)
 * never formats as `-0.00` or `-0.00%` in engineering KPI cards and comparison tables.
 */
export function normalizeSignedZero(
  value: number,
  decimals: number = 2
): number {
  if (!Number.isFinite(value)) return value;
  const threshold = 0.5 * Math.pow(10, -decimals);
  if (Math.abs(value) < threshold) {
    return 0;
  }
  return value;
}

/**
 * Formats a numeric value to a fixed number of decimal places while eliminating `-0.00`
 * and optionally prefixing strictly positive numbers with `'+'`.
 */
export function formatSignedZero(
  value: number,
  decimals: number = 2,
  options?: { positivePrefix?: boolean }
): string {
  const normalized = normalizeSignedZero(value, decimals);
  if (!Number.isFinite(normalized)) return 'N/A';
  if (normalized === 0) {
    return (0).toFixed(decimals);
  }
  const formatted = normalized.toFixed(decimals);
  if (options?.positivePrefix && normalized > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Truncates long scenario comparison labels cleanly for Recharts categorical X-axis ticks
 * while preserving the full label in tooltips and comparison tables.
 */
export function truncateScenarioTickLabel(
  label: string,
  maxLength: number = 18
): string {
  const trimmed = label.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}
