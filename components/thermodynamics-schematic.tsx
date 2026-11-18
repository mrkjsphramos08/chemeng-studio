'use client';

import React from 'react';
import { PureFluidPVTResults, BinaryVLEResults } from '@/lib/thermodynamics';
import { MathInline } from '@/components/lab-shared/math';

interface PureFluidPVTSchematicProps {
  results: PureFluidPVTResults;
}

export function PureFluidPVTSchematic({ results }: PureFluidPVTSchematicProps) {
  const z = results.compressibilityFactor_Z;
  // Normalize piston height visual ratio based on Z around 1.0 (clamped between 0.22 and 1.35)
  const idealFillRatio = 0.62;
  const prFillRatio = Math.max(0.2, Math.min(0.88, idealFillRatio * Math.min(1.4, Math.max(0.32, z))));

  const idealPistonY = 175 - idealFillRatio * 115;
  const prPistonY = 175 - prFillRatio * 115;

  const isAttractive = z < 0.985;
  const isRepulsive = z > 1.015;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
            Interactive State Schematic · Module A
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Ideal Gas vs. Peng–Robinson Real-Fluid Compression Cell ({results.fluid.name})
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
            <MathInline latex={`T_r = ${results.reducedTemperature_Tr.toFixed(3)}`} />
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
            <MathInline latex={`P_r = ${results.reducedPressure_Pr.toFixed(3)}`} />
          </span>
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
              results.isNearCritical
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : results.rootDiagnosis.hasMultipleValidRoots
                  ? 'border-purple-300 bg-purple-50 text-purple-900'
                  : isAttractive
                    ? 'border-teal-300 bg-teal-50 text-teal-900'
                    : isRepulsive
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-900'
            }`}
          >
            {results.regime}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-950 p-3">
        <svg
          viewBox="0 0 760 235"
          className="h-auto w-full min-w-[580px]"
          role="img"
          aria-label={`Comparison of Ideal Gas molar volume (${results.idealMolarVolume_L_mol.toFixed(3)} L/mol, Z = 1.000) and Peng-Robinson real fluid molar volume (${results.prMolarVolume_L_mol.toFixed(3)} L/mol, Z = ${results.compressibilityFactor_Z.toFixed(4)}) for ${results.fluid.name} at ${results.temperature_K.toFixed(1)} K and ${results.pressure_bar.toFixed(1)} bar.`}
        >
          <defs>
            <linearGradient id="idealGasGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="prGasGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Left Cylinder: Ideal Gas Reference (Z = 1) */}
          <g transform="translate(32, 16)">
            <text x="110" y="14" textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="700">
              IDEAL GAS MODEL (Z = 1.0000)
            </text>
            <text x="110" y="29" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Point-mass molecules · Zero attraction (a = 0, b = 0)
            </text>

            {/* Cylinder walls */}
            <rect
              x="40"
              y="42"
              width="140"
              height="135"
              rx="6"
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Gas chamber fill */}
            <rect
              x="42"
              y={idealPistonY}
              width="136"
              height={Math.max(12, 175 - idealPistonY)}
              fill="url(#idealGasGrad)"
            />
            {/* Piston head & rod */}
            <rect
              x="42"
              y={idealPistonY - 10}
              width="136"
              height="10"
              rx="2"
              fill="#64748b"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <rect x="105" y="34" width="10" height={Math.max(4, idealPistonY - 44)} fill="#94a3b8" />

            {/* Ideal gas particles */}
            {[
              [68, idealPistonY + 20],
              [110, idealPistonY + 34],
              [148, idealPistonY + 22],
              [82, idealPistonY + 55],
              [136, idealPistonY + 58],
              [105, Math.min(166, idealPistonY + 76)],
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={Math.min(168, cy)}
                r="3.2"
                fill="#38bdf8"
                opacity="0.9"
              />
            ))}

            <text
              x="110"
              y="194"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="11.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              v_ideal = {results.idealMolarVolume_L_mol.toFixed(3)} L/mol
            </text>
          </g>

          {/* Center State & Force Balance Diagnostic */}
          <g transform="translate(275, 34)">
            <rect
              x="0"
              y="4"
              width="210"
              height="164"
              rx="10"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            <text x="105" y="23" textAnchor="middle" fill="#5eead4" fontSize="10" fontWeight="700">
              MOLECULAR INTERACTION BALANCE
            </text>
            <text
              x="105"
              y="40"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="11"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.fluid.formula} @ {results.temperature_K.toFixed(1)} K, {results.pressure_bar.toFixed(1)} bar
            </text>

            {/* Repulsive vs Attractive Pressure bars */}
            <text x="14" y="64" fill="#cbd5e1" fontSize="10" fontWeight="600">
              Repulsive P_rep:
            </text>
            <text
              x="196"
              y="64"
              textAnchor="end"
              fill="#38bdf8"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {(results.repulsivePressureTerm_Pa / 1e5).toFixed(1)} bar
            </text>

            <text x="14" y="84" fill="#cbd5e1" fontSize="10" fontWeight="600">
              Attractive P_att:
            </text>
            <text
              x="196"
              y="84"
              textAnchor="end"
              fill="#f43f5e"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              -{(results.attractivePressureTerm_Pa / 1e5).toFixed(1)} bar
            </text>

            <line x1="14" y1="95" x2="196" y2="95" stroke="#334155" strokeWidth="1" />

            <text x="14" y="113" fill="#94a3b8" fontSize="10">
              Covolume (v / b):
            </text>
            <text
              x="196"
              y="113"
              textAnchor="end"
              fill="#e2e8f0"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.covolumeRatio_v_over_b.toFixed(2)}×
            </text>

            <text x="14" y="133" fill="#94a3b8" fontSize="10">
              Volume Deviation:
            </text>
            <text
              x="196"
              y="133"
              textAnchor="end"
              fill={results.volumeDeviationPercent < 0 ? '#2dd4bf' : '#fbbf24'}
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.volumeDeviationPercent >= 0 ? '+' : ''}
              {results.volumeDeviationPercent.toFixed(2)}%
            </text>

            <text x="14" y="153" fill="#94a3b8" fontSize="10">
              Cubic Z Roots:
            </text>
            <text
              x="196"
              y="153"
              textAnchor="end"
              fill={results.rootDiagnosis.hasMultipleValidRoots ? '#c084fc' : '#34d399'}
              fontSize="10"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.rootDiagnosis.hasMultipleValidRoots
                ? `3 roots (${results.activeRootPreference})`
                : '1 physical root'}
            </text>
          </g>

          {/* Right Cylinder: Peng-Robinson Real Fluid */}
          <g transform="translate(508, 16)">
            <text x="110" y="14" textAnchor="middle" fill="#5eead4" fontSize="12" fontWeight="700">
              PENG–ROBINSON EOS (Z = {results.compressibilityFactor_Z.toFixed(4)})
            </text>
            <text x="110" y="29" textAnchor="middle" fill="#94a3b8" fontSize="10">
              Finite covolume b = {results.b_cm3_mol.toFixed(1)} cm³/mol &amp; attraction aα
            </text>

            {/* Cylinder walls */}
            <rect
              x="40"
              y="42"
              width="140"
              height="135"
              rx="6"
              fill="#0f172a"
              stroke="#14b8a6"
              strokeWidth="2"
            />
            {/* Excluded covolume b band at bottom */}
            <rect
              x="42"
              y="165"
              width="136"
              height="10"
              fill="#334155"
              opacity="0.7"
            />
            {/* PR gas chamber fill */}
            <rect
              x="42"
              y={prPistonY}
              width="136"
              height={Math.max(12, 175 - prPistonY)}
              fill="url(#prGasGrad)"
            />
            {/* Piston head & rod */}
            <rect
              x="42"
              y={prPistonY - 10}
              width="136"
              height="10"
              rx="2"
              fill="#0d9488"
              stroke="#99f6e4"
              strokeWidth="1"
            />
            <rect x="105" y="34" width="10" height={Math.max(4, prPistonY - 44)} fill="#2dd4bf" />

            {/* Real fluid molecules with finite covolume halo */}
            {[
              [72, prPistonY + 18],
              [112, prPistonY + 28],
              [145, prPistonY + 19],
              [86, prPistonY + 46],
              [134, prPistonY + 48],
              [108, Math.min(158, prPistonY + 64)],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={Math.min(160, cy)}
                  r="8"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeOpacity="0.35"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={cx}
                  cy={Math.min(160, cy)}
                  r="4.2"
                  fill="#2dd4bf"
                />
              </g>
            ))}

            <text
              x="110"
              y="194"
              textAnchor="middle"
              fill="#5eead4"
              fontSize="11.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              v_PR = {results.prMolarVolume_L_mol.toFixed(3)} L/mol
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

interface BinaryVLESchematicProps {
  results: BinaryVLEResults;
}

export function BinaryVLESchematic({ results }: BinaryVLESchematicProps) {
  const isTwoPhase =
    results.phaseStateAtSystemPressure === 'Two-Phase Vapor–Liquid Equilibrium';
  const isLiquidOnly =
    results.phaseStateAtSystemPressure === 'Compressed (Subcooled) Liquid';

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
            Interactive Equilibrium Cell · Module B
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Isothermal Binary Raoult–Dalton Equilibrium Cell (Hypothetical Components A &amp; B)
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
            <MathInline
              latex={`\\alpha_{AB} = P_A^{\\mathrm{sat}} / P_B^{\\mathrm{sat}} = ${results.relativeVolatility_alphaAB.toFixed(2)}`}
            />
          </span>
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
              isTwoPhase
                ? 'border-teal-300 bg-teal-50 text-teal-900'
                : isLiquidOnly
                  ? 'border-sky-300 bg-sky-50 text-sky-900'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
            }`}
          >
            {results.phaseStateAtSystemPressure}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-950 p-3">
        <svg
          viewBox="0 0 760 225"
          className="h-auto w-full min-w-[580px]"
          role="img"
          aria-label={`Isothermal Binary VLE Cell at ${results.systemPressure_kPa.toFixed(1)} kPa with liquid composition x_A = ${results.xA.toFixed(3)}, bubble pressure ${results.bubblePressure_kPa.toFixed(1)} kPa, dew pressure ${results.dewPressureAtComposition_kPa.toFixed(1)} kPa, and equilibrium vapor composition y_A = ${results.equilibriumVapor_yA.toFixed(3)}.`}
        >
          {/* Left Panel: Pure Saturation Pressures & Raoult Partial Pressures */}
          <g transform="translate(22, 18)">
            <rect
              x="0"
              y="0"
              width="225"
              height="186"
              rx="10"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            <text x="112" y="24" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="700">
              RAOULT&apos;S LAW PARTIAL PRESSURES
            </text>
            <text x="14" y="48" fill="#cbd5e1" fontSize="10">
              Pure A (P_A^sat):
            </text>
            <text
              x="210"
              y="48"
              textAnchor="end"
              fill="#f8fafc"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.psatA_kPa.toFixed(1)} kPa
            </text>

            <text x="14" y="68" fill="#cbd5e1" fontSize="10">
              Pure B (P_B^sat):
            </text>
            <text
              x="210"
              y="68"
              textAnchor="end"
              fill="#f8fafc"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.psatB_kPa.toFixed(1)} kPa
            </text>

            <line x1="14" y1="80" x2="210" y2="80" stroke="#334155" strokeWidth="1" />

            <text x="14" y="102" fill="#5eead4" fontSize="10" fontWeight="600">
              Partial p_A (Raoult):
            </text>
            <text
              x="210"
              y="102"
              textAnchor="end"
              fill="#5eead4"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.partialPressureA_kPa.toFixed(2)} kPa
            </text>

            <text x="14" y="122" fill="#93c5fd" fontSize="10" fontWeight="600">
              Partial p_B (Raoult):
            </text>
            <text
              x="210"
              y="122"
              textAnchor="end"
              fill="#93c5fd"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.partialPressureB_kPa.toFixed(2)} kPa
            </text>

            <line x1="14" y1="134" x2="210" y2="134" stroke="#334155" strokeWidth="1" />

            <text x="14" y="154" fill="#f8fafc" fontSize="10" fontWeight="700">
              Bubble Point P_bub:
            </text>
            <text
              x="210"
              y="154"
              textAnchor="end"
              fill="#38bdf8"
              fontSize="11"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.bubblePressure_kPa.toFixed(2)} kPa
            </text>

            <text x="14" y="174" fill="#f8fafc" fontSize="10" fontWeight="700">
              Dew Point P_dew:
            </text>
            <text
              x="210"
              y="174"
              textAnchor="end"
              fill="#f59e0b"
              fontSize="11"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.dewPressureAtComposition_kPa.toFixed(2)} kPa
            </text>
          </g>

          {/* Center Equilibrium Vessel */}
          <g transform="translate(272, 14)">
            <text x="108" y="14" textAnchor="middle" fill="#e2e8f0" fontSize="11.5" fontWeight="700">
              ISOTHERMAL VLE CELL (P_sys = {results.systemPressure_kPa.toFixed(1)} kPa)
            </text>

            {/* Vessel Shell */}
            <rect
              x="33"
              y="26"
              width="150"
              height="152"
              rx="24"
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="2.5"
            />

            {/* Vapor headspace */}
            <path
              d="M 35 50 Q 35 28 57 28 L 159 28 Q 181 28 181 50 L 181 104 L 35 104 Z"
              fill={isLiquidOnly ? '#0284c7' : '#f59e0b'}
              fillOpacity={isLiquidOnly ? '0.28' : '0.18'}
            />

            {/* Liquid pool */}
            <path
              d="M 35 104 L 181 104 L 181 154 Q 181 176 159 176 L 57 176 Q 35 176 35 154 Z"
              fill={
                results.phaseStateAtSystemPressure === 'Superheated Vapor'
                  ? '#f59e0b'
                  : '#0d9488'
              }
              fillOpacity={
                results.phaseStateAtSystemPressure === 'Superheated Vapor'
                  ? '0.16'
                  : '0.38'
              }
            />

            {/* Meniscus interface line */}
            <line
              x1="35"
              y1="104"
              x2="181"
              y2="104"
              stroke={isTwoPhase ? '#2dd4bf' : '#64748b'}
              strokeWidth="2"
              strokeDasharray={isTwoPhase ? 'none' : '4 4'}
            />

            {/* Vapor Phase label inside vessel */}
            <text x="108" y="60" textAnchor="middle" fill="#fde68a" fontSize="10.5" fontWeight="700">
              {isLiquidOnly
                ? 'Subcooled Liquid'
                : isTwoPhase
                  ? `Vapor: y_A = ${(results.tieLineVapor_yA ?? results.equilibriumVapor_yA).toFixed(3)}`
                  : `Vapor: y_A = ${results.xA.toFixed(3)}`}
            </text>
            <text x="108" y="78" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
              y_A* (bubble) = {results.equilibriumVapor_yA.toFixed(3)}
            </text>

            {/* Liquid Phase label inside vessel */}
            <text x="108" y="135" textAnchor="middle" fill="#99f6e4" fontSize="10.5" fontWeight="700">
              {results.phaseStateAtSystemPressure === 'Superheated Vapor'
                ? 'All Vapor (P < P_dew)'
                : isTwoPhase
                  ? `Liquid: x_A = ${(results.tieLineLiquid_xA ?? results.xA).toFixed(3)}`
                  : `Liquid: x_A = ${results.xA.toFixed(3)}`}
            </text>
            <text x="108" y="153" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">
              x_A = {results.xA.toFixed(3)}, x_B = {results.xB.toFixed(3)}
            </text>

            <text x="108" y="196" textAnchor="middle" fill="#5eead4" fontSize="10.5" fontWeight="700">
              {isTwoPhase
                ? `Two-Phase Coexistence · V/F = ${(results.vaporMoleFraction_betaV * 100).toFixed(1)}%`
                : results.phaseStateAtSystemPressure}
            </text>
          </g>

          {/* Right Panel: Dalton's Law & Equilibrium Enrichment */}
          <g transform="translate(510, 18)">
            <rect
              x="0"
              y="0"
              width="228"
              height="186"
              rx="10"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            <text x="114" y="24" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="700">
              DALTON&apos;S LAW &amp; VAPOR ENRICHMENT
            </text>

            <text x="14" y="48" fill="#cbd5e1" fontSize="10">
              Liquid (x_A / x_B):
            </text>
            <text
              x="214"
              y="48"
              textAnchor="end"
              fill="#f8fafc"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.xA.toFixed(3)} / {results.xB.toFixed(3)}
            </text>

            <text x="14" y="70" fill="#5eead4" fontSize="10" fontWeight="600">
              Vapor (y_A / y_B):
            </text>
            <text
              x="214"
              y="70"
              textAnchor="end"
              fill="#5eead4"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.equilibriumVapor_yA.toFixed(3)} / {results.equilibriumVapor_yB.toFixed(3)}
            </text>

            <text x="14" y="92" fill="#fde68a" fontSize="10" fontWeight="600">
              Dew Liq (x_A / x_B):
            </text>
            <text
              x="214"
              y="92"
              textAnchor="end"
              fill="#fde68a"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.equilibriumLiquidAtDew_xA.toFixed(3)} / {results.equilibriumLiquidAtDew_xB.toFixed(3)}
            </text>

            <line x1="14" y1="106" x2="214" y2="106" stroke="#334155" strokeWidth="1" />

            <text x="14" y="128" fill="#cbd5e1" fontSize="10">
              More Volatile:
            </text>
            <text
              x="214"
              y="128"
              textAnchor="end"
              fill="#38bdf8"
              fontSize="10.5"
              fontWeight="700"
            >
              {results.moreVolatileComponent}
            </text>

            <text x="14" y="150" fill="#cbd5e1" fontSize="10">
              Enrichment (y_A / x_A):
            </text>
            <text
              x="214"
              y="150"
              textAnchor="end"
              fill="#34d399"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {results.xA > 0
                ? `${(results.equilibriumVapor_yA / results.xA).toFixed(2)}×`
                : '—'}
            </text>

            <text x="14" y="172" fill="#94a3b8" fontSize="10">
              Mole Sum (Σx / Σy):
            </text>
            <text
              x="214"
              y="172"
              textAnchor="end"
              fill="#e2e8f0"
              fontSize="10.5"
              fontWeight="700"
              fontFamily="monospace"
            >
              {(results.xA + results.xB).toFixed(2)} / {(results.equilibriumVapor_yA + results.equilibriumVapor_yB).toFixed(2)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
