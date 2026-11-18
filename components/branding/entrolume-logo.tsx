import React from 'react';

export type EntrolumeLogoVariant =
  | 'primary'
  | 'dark'
  | 'icon-only'
  | 'monochrome'
  | 'monochrome-light'
  | 'dark-ink'
  | 'light-ink';

export type EntrolumeLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface EntrolumeLogoProps {
  /**
   * Visual brand variant:
   * - 'primary' ('dark-ink'): Midnight Navy (#0F172A) & Teal (#0D9488) symbol + Navy wordmark for light surfaces
   * - 'dark' ('light-ink'): White (#FFFFFF) & Teal (#0D9488) symbol + White wordmark for dark surfaces
   * - 'icon-only': Approved geometric E-mark symbol without wordmark
   * - 'monochrome': Single-color (#0F172A) symbol + wordmark
   * - 'monochrome-light': Single-color (#FFFFFF) symbol + wordmark
   */
  variant?: EntrolumeLogoVariant;
  /** Preset display size */
  size?: EntrolumeLogoSize;
  /** Optional shorthand to render only the geometric E-shaped icon mark */
  iconOnly?: boolean;
  /**
   * If true, marks the SVG as decorative (`aria-hidden="true"`) to prevent duplicate spoken labels
   * when placed inside an already-labeled parent button or link. Defaults to false.
   */
  decorative?: boolean;
  /** Accessible label when `decorative` is false */
  ariaLabel?: string;
  /** Optional className for outer wrapper */
  className?: string;
}

/**
 * Approved Entrolume Vector Geometry (ViewBox 0 0 1236 242 for horizontal lockup; 0 0 262 242 for icon)
 */
export const ENTROLUME_ICON_PATHS = {
  upper:
    'M 1 103.5 V 74 C 1 31 36 0 82 0 H 261 V 25 C 261 36.9 251.4 46.5 239.5 46.5 H 130 C 96 46.5 64 103.5 25 103.5 H 1 Z',
  middle:
    'M 1 118 H 25 C 66 118 96 91 130 91 H 261 V 126.5 C 261 138.4 251.4 148 239.5 148 H 130 C 96 148 66 131.5 25 131.5 H 1 Z',
  lower:
    'M 1 146 H 25 C 64 146 96 192 130 192 H 247 C 254.7 192 261 198.3 261 206 V 220 C 261 231.9 251.4 241.5 239.5 241.5 H 82 C 36 241.5 1 210.5 1 168 V 146 Z',
} as const;

export const ENTROLUME_WORDMARK_PATHS = {
  e1: 'M 419 131 H 337.5 C 340.5 145.5 352 154 367 154 C 378.5 154 387.5 149.5 393.5 142 L 413 152.5 C 403 167.5 387 176.5 366.5 176.5 C 336 176.5 313 153.5 313 123.5 C 313 93.5 336 70.5 366.5 70.5 C 397 70.5 419 93.5 419 123.5 V 131 Z M 338 113 H 394.5 C 391 99.5 380.5 92 366.5 92 C 352.5 92 341.5 99.5 338 113 Z',
  n: 'M 431 173 V 118.5 C 431 90.5 452 70 479.5 70 C 507 70 528 90.5 528 118.5 V 173 H 504 V 119.5 C 504 104 493.5 93 479.5 93 C 465.5 93 455 104 455 119.5 V 173 H 431 Z',
  t: 'M 553 43 H 577 V 73 H 602 V 94 H 577 V 140.5 C 577 148.5 581.5 152 590 152 H 602 V 173 H 587 C 565 173 553 161.5 553 141 V 94 H 537 V 73 H 553 V 43 Z',
  r: 'M 618 173 V 73 H 641.5 V 87.5 C 647.5 76.5 658.5 71 672 71 H 676 V 95 H 670.5 C 653 95 642 104.5 642 122 V 173 H 618 Z',
  o: 'M 735 70 C 765.5 70 789 93.5 789 123.25 C 789 153 765.5 176.5 735 176.5 C 704.5 176.5 681 153 681 123.25 C 681 93.5 704.5 70 735 70 Z M 735 92.5 C 718 92.5 705 106 705 123.25 C 705 140.5 718 154 735 154 C 752 154 765 140.5 765 123.25 C 765 106 752 92.5 735 92.5 Z',
  l: 'M 804 28 H 828 V 173 H 804 V 28 Z',
  u: 'M 845 73 H 869 V 127 C 869 142.5 879.5 153.5 893.5 153.5 C 907.5 153.5 918 142.5 918 127 V 73 H 942 V 128 C 942 156 921 176.5 893.5 176.5 C 866 176.5 845 156 845 128 V 73 Z',
  m: 'M 957 173 V 115.5 C 957 89 976.5 70 1002.5 70 C 1017.5 70 1029.5 75.5 1035 85.5 C 1040.5 75.5 1052.5 70 1067.5 70 C 1093.5 70 1113 89 1113 115.5 V 173 H 1089 V 116.5 C 1089 102.5 1079.5 93 1067 93 C 1054.5 93 1046.5 102.5 1046.5 116.5 V 173 H 1023.5 V 116.5 C 1023.5 102.5 1015.5 93 1003 93 C 990.5 93 981 102.5 981 116.5 V 173 H 957 Z',
  e2: 'M 1232.5 131 H 1151 C 1154 145.5 1165.5 154 1180.5 154 C 1192 154 1201 149.5 1207 142 L 1226.5 152.5 C 1216.5 167.5 1200.5 176.5 1180 176.5 C 1149.5 176.5 1126.5 153.5 1126.5 123.5 C 1126.5 93.5 1149.5 70.5 1180 70.5 C 1210.5 70.5 1232.5 93.5 1232.5 123.5 V 131 Z M 1151.5 113 H 1208 C 1204.5 99.5 1194 92 1180 92 C 1166 92 1155 99.5 1151.5 113 Z',
} as const;

export const ENTROLUME_BRAND_COLORS = {
  midnightNavy: '#0F172A',
  teal: '#0D9488',
  white: '#FFFFFF',
  lightNeutral: '#F8FAFC',
} as const;

const HORIZONTAL_DIMENSIONS: Record<EntrolumeLogoSize, { width: number; height: number }> = {
  xs: { width: 112, height: 22 },
  sm: { width: 133, height: 26 },
  md: { width: 153, height: 30 },
  lg: { width: 184, height: 36 },
  xl: { width: 225, height: 44 },
};

const ICON_DIMENSIONS: Record<EntrolumeLogoSize, { width: number; height: number }> = {
  xs: { width: 22, height: 20 },
  sm: { width: 26, height: 24 },
  md: { width: 30, height: 28 },
  lg: { width: 37, height: 34 },
  xl: { width: 45, height: 42 },
};

export function EntrolumeLogo({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  decorative = false,
  ariaLabel = 'entrolume',
  className = '',
}: EntrolumeLogoProps) {
  const isIconOnly = iconOnly || variant === 'icon-only';

  const isDarkSurface = variant === 'dark' || variant === 'light-ink';
  const isMonoDark = variant === 'monochrome';
  const isMonoLight = variant === 'monochrome-light';

  const outerBarsFill =
    isDarkSurface || isMonoLight
      ? ENTROLUME_BRAND_COLORS.white
      : ENTROLUME_BRAND_COLORS.midnightNavy;

  const middleBarFill = isMonoDark
    ? ENTROLUME_BRAND_COLORS.midnightNavy
    : isMonoLight
    ? ENTROLUME_BRAND_COLORS.white
    : ENTROLUME_BRAND_COLORS.teal;

  const wordmarkFill =
    isDarkSurface || isMonoLight
      ? ENTROLUME_BRAND_COLORS.white
      : ENTROLUME_BRAND_COLORS.midnightNavy;

  const dims = isIconOnly ? ICON_DIMENSIONS[size] : HORIZONTAL_DIMENSIONS[size];
  const displayClass = /\bhidden\b/.test(className) ? '' : 'inline-flex';

  return (
    <span
      className={`${displayClass} items-center select-none shrink-0 ${className}`.trim()}
      data-testid="entrolume-brand-logo"
      data-variant={isIconOnly ? 'icon-only' : variant}
    >
      <svg
        width={dims.width}
        height={dims.height}
        viewBox={isIconOnly ? '0 0 262 242' : '0 0 1236 242'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : ariaLabel}
        aria-hidden={decorative ? 'true' : undefined}
        className="shrink-0 block"
      >
        <g data-testid="entrolume-symbol-paths">
          <path d={ENTROLUME_ICON_PATHS.upper} fill={outerBarsFill} />
          <path d={ENTROLUME_ICON_PATHS.middle} fill={middleBarFill} />
          <path d={ENTROLUME_ICON_PATHS.lower} fill={outerBarsFill} />
        </g>

        {!isIconOnly && (
          <g
            fill={wordmarkFill}
            fillRule="evenodd"
            data-testid="entrolume-wordmark-paths"
          >
            <path d={ENTROLUME_WORDMARK_PATHS.e1} />
            <path d={ENTROLUME_WORDMARK_PATHS.n} />
            <path d={ENTROLUME_WORDMARK_PATHS.t} />
            <path d={ENTROLUME_WORDMARK_PATHS.r} />
            <path d={ENTROLUME_WORDMARK_PATHS.o} />
            <path d={ENTROLUME_WORDMARK_PATHS.l} />
            <path d={ENTROLUME_WORDMARK_PATHS.u} />
            <path d={ENTROLUME_WORDMARK_PATHS.m} />
            <path d={ENTROLUME_WORDMARK_PATHS.e2} />
          </g>
        )}
      </svg>
      {!decorative && !isIconOnly && <span className="sr-only">entrolume</span>}
    </span>
  );
}
