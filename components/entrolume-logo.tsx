import React from 'react';

export interface EntrolumeLogoProps {
  /** Render color scheme for light backgrounds ('dark-ink') or dark navy backgrounds ('light-ink') */
  variant?: 'dark-ink' | 'light-ink';
  /** Size of the mark and wordmark */
  size?: 'sm' | 'md' | 'lg';
  /** Show only the geometric icon mark without the wordmark */
  iconOnly?: boolean;
  /** Optional className for outer wrapper */
  className?: string;
}

/**
 * Entrolume Vector Brand Identity & Wordmark
 *
 * Geometric Meaning:
 * - Outer precision hexagonal prism: represents unit operations, equilibrium stages, and structured engineering systems.
 * - Inner counter-flowing state curves (entropy/energy stream paths) converging at an illuminated focal node ("lume"):
 *   symbolizes thermodynamic driving forces, transport phenomena, and conceptual illumination through simulation.
 */
export function EntrolumeLogo({
  variant = 'dark-ink',
  size = 'md',
  iconOnly = false,
  className = '',
}: EntrolumeLogoProps) {
  const dimensions = {
    sm: { box: 28, text: 'text-base', tracking: 'tracking-tight' },
    md: { box: 32, text: 'text-[17px]', tracking: 'tracking-tight' },
    lg: { box: 40, text: 'text-xl', tracking: 'tracking-tight' },
  }[size];

  const isLightInk = variant === 'light-ink';

  return (
    <span
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      data-testid="entrolume-brand-logo"
    >
      <svg
        width={dimensions.box}
        height={dimensions.box}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Deep Navy Rounded Technical Frame */}
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          rx="9"
          fill={isLightInk ? '#1E293B' : '#0F172A'}
          stroke={isLightInk ? '#334155' : '#0F766E'}
          strokeWidth="1.5"
        />

        {/* Subtle Internal Precision Grid / Equilibrium Axis */}
        <path
          d="M20 7V33M7 20H33"
          stroke="#334155"
          strokeWidth="0.85"
          strokeDasharray="2 2"
        />

        {/* Outer Hexagonal Process Envelope */}
        <path
          d="M20 6.5L31.7 13.25V26.75L20 33.5L8.3 26.75V13.25L20 6.5Z"
          stroke="#14B8A6"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />

        {/* Lower Transport / Equilibrium Trajectory Curve (Warm Amber/Cyan Contrast) */}
        <path
          d="M9.5 25.5C13.5 25.5 16.2 14.5 20 14.5C23.8 14.5 26.5 25.5 30.5 25.5"
          stroke="#38BDF8"
          strokeWidth="2.1"
          strokeLinecap="round"
        />

        {/* Upper Thermodynamic Driving Curve (Vibrant Teal) */}
        <path
          d="M9.5 15C14 15 16 25 20 25C24 25 26 15 30.5 15"
          stroke="#2DD4BF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Central Illuminated Equilibrium Node ("Lume") */}
        <circle
          cx="20"
          cy="20"
          r="3.2"
          fill="#F8FAFC"
          stroke="#0D9488"
          strokeWidth="1.6"
        />
      </svg>

      {!iconOnly && (
        <span
          className={`font-bold ${dimensions.text} ${dimensions.tracking} leading-none whitespace-nowrap ${
            isLightInk ? 'text-white' : 'text-slate-900'
          }`}
        >
          Entro
          <span className={isLightInk ? 'text-teal-400' : 'text-teal-700'}>
            lume
          </span>
        </span>
      )}
    </span>
  );
}
