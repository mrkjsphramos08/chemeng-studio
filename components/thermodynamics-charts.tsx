'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import {
  PureFluidPVTResults,
  ZvsPressurePoint,
  PVIsothermPoint,
  BinaryVLEResults,
  BinaryPxyPoint,
} from '@/lib/thermodynamics';
import { MathInline } from '@/components/lab-shared/math';
import { Trash2 } from 'lucide-react';

export interface SavedPVTScenario {
  id: string;
  label: string;
  fluidCode: string;
  temperature_K: number;
  pressure_bar: number;
  Z_PR: number;
  v_ideal_L_mol: number;
  v_PR_L_mol: number;
  deviationPercent: number;
  regime: string;
}

interface PureFluidPVTChartsProps {
  results: PureFluidPVTResults;
  pressureSweepSeries: ZvsPressurePoint[];
  isothermData: {
    points: PVIsothermPoint[];
    labels: {
      activeT_K: number;
      criticalT_K: number;
      highT_K: number;
    };
  };
  savedScenarios: SavedPVTScenario[];
  onRemoveScenario: (id: string) => void;
  onClearScenarios: () => void;
}

type PVTChartTab = 'z-vs-p' | 'volume-comparison' | 'pv-isotherms' | 'deviation';

export function PureFluidPVTCharts({
  results,
  pressureSweepSeries,
  isothermData,
  savedScenarios,
  onRemoveScenario,
  onClearScenarios,
}: PureFluidPVTChartsProps) {
  const [activeTab, setActiveTab] = useState<PVTChartTab>('z-vs-p');

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
              Real-Gas PVT Diagnostics · {results.fluid.name} ({results.fluid.formula})
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'z-vs-p' &&
                `Compressibility Factor Z vs. Pressure at T = ${results.temperature_K.toFixed(1)} K`}
              {activeTab === 'volume-comparison' &&
                `Ideal-Gas vs. Peng–Robinson Molar Volume v vs. Pressure (T = ${results.temperature_K.toFixed(1)} K)`}
              {activeTab === 'pv-isotherms' &&
                `Peng–Robinson Pressure–Volume (P–v) Isotherms for ${results.fluid.name}`}
              {activeTab === 'deviation' &&
                `Relative Ideal-Gas Molar Volume Deviation (%) vs. Pressure`}
            </h3>
          </div>

          <div
            className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1"
            role="tablist"
            aria-label="Real-Gas PVT Visualization Tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'z-vs-p'}
              onClick={() => setActiveTab('z-vs-p')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'z-vs-p'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Z vs. P
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'volume-comparison'}
              onClick={() => setActiveTab('volume-comparison')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'volume-comparison'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Molar Volume v(P)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pv-isotherms'}
              onClick={() => setActiveTab('pv-isotherms')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'pv-isotherms'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. P–v Isotherms
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'deviation'}
              onClick={() => setActiveTab('deviation')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'deviation'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Ideal Deviation (%)
            </button>
          </div>
        </div>

        {/* Chart 1: Z vs Pressure */}
        {activeTab === 'z-vs-p' && (
          <div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pressureSweepSeries}
                  margin={{ top: 12, right: 24, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="pressure_bar"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Absolute Pressure P (bar)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Compressibility Factor Z (-)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      Number(val ?? 0).toFixed(4),
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Pressure P = ${label} bar`}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Line
                    type="monotone"
                    dataKey="Z_ideal"
                    name="Ideal Gas Reference (Z = 1.000)"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Z_PR_selected"
                    name={`Peng–Robinson Z (${results.fluid.formula}, T = ${results.temperature_K.toFixed(0)} K)`}
                    stroke="#0d9488"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    x={Number(results.pressure_bar.toFixed(2))}
                    stroke="#0f766e"
                    strokeDasharray="3 3"
                  />
                  <ReferenceDot
                    x={Number(results.pressure_bar.toFixed(2))}
                    y={Number(results.compressibilityFactor_Z.toFixed(4))}
                    r={6}
                    fill="#0d9488"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Engineering Interpretation:</strong> When <MathInline latex="Z < 1" />,
              long-range intermolecular attraction (<MathInline latex="a\alpha" />) pulls molecules
              together so the real fluid occupies less volume than an ideal gas. At very high
              pressures, finite molecular size (<MathInline latex="b" />) drives{' '}
              <MathInline latex="Z > 1" />.
            </p>
          </div>
        )}

        {/* Chart 2: Ideal vs PR Molar Volume vs Pressure */}
        {activeTab === 'volume-comparison' && (
          <div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pressureSweepSeries.filter((pt) => pt.pressure_bar >= 5)}
                  margin={{ top: 12, right: 24, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="pressure_bar"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Absolute Pressure P (bar)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Molar Volume v (L/mol)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val ?? 0).toFixed(4)} L/mol`,
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Pressure P = ${label} bar`}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Line
                    type="monotone"
                    dataKey="v_ideal_L_mol"
                    name="Ideal Gas Molar Volume v_ideal = RT/P (L/mol)"
                    stroke="#0284c7"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="v_PR_L_mol"
                    name="Peng–Robinson Molar Volume v_PR = ZRT/P (L/mol)"
                    stroke="#0d9488"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    x={Number(results.pressure_bar.toFixed(2))}
                    stroke="#0f766e"
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Engineering Interpretation:</strong> At operating state{' '}
              <MathInline latex={`P = ${results.pressure_bar.toFixed(1)}\\,\\mathrm{bar}`} />, the
              ideal gas law predicts{' '}
              <MathInline
                latex={`v_{\\mathrm{ideal}} = ${results.idealMolarVolume_L_mol.toFixed(4)}\\,\\mathrm{L/mol}`}
              />{' '}
              whereas Peng–Robinson predicts{' '}
              <MathInline
                latex={`v_{\\mathrm{PR}} = ${results.prMolarVolume_L_mol.toFixed(4)}\\,\\mathrm{L/mol}`}
              />
              .
            </p>
          </div>
        )}

        {/* Chart 3: P-v Isotherms */}
        {activeTab === 'pv-isotherms' && (
          <div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={isothermData.points}
                  margin={{ top: 12, right: 24, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="molarVolume_L_mol"
                    type="number"
                    scale="log"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(v) => Number(v).toFixed(2)}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Molar Volume v (L/mol, logarithmic scale)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    domain={[-25, 250]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Pressure P (bar)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val ?? 0).toFixed(2)} bar`,
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Molar Volume v = ${label} L/mol`}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Line
                    type="monotone"
                    dataKey="P_ideal_activeT_bar"
                    name={`Ideal Gas @ T = ${isothermData.labels.activeT_K.toFixed(1)} K`}
                    stroke="#64748b"
                    strokeWidth={1.75}
                    strokeDasharray="5 5"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="P_PR_activeT_bar"
                    name={`PR Active Isotherm (T = ${isothermData.labels.activeT_K.toFixed(1)} K)`}
                    stroke="#0d9488"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="P_PR_criticalT_bar"
                    name={`PR Critical Isotherm (T_c = ${isothermData.labels.criticalT_K.toFixed(2)} K)`}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="P_PR_highT_bar"
                    name={`PR Supercritical Isotherm (1.2 T_c = ${isothermData.labels.highT_K.toFixed(1)} K)`}
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    y={Number(results.fluid.Pc_bar.toFixed(2))}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Engineering Interpretation:</strong> At temperatures below{' '}
              <MathInline latex={`T_c = ${results.fluid.Tc_K.toFixed(2)}\\,\\mathrm{K}`} />, the
              Peng–Robinson isotherm exhibits a van der Waals loop where three molar volumes share
              the same pressure. At <MathInline latex="T = T_c" />, the curve displays a horizontal
              inflection point at <MathInline latex={`P_c = ${results.fluid.Pc_bar.toFixed(2)}\\,\\mathrm{bar}`} />.
            </p>
          </div>
        )}

        {/* Chart 4: Relative Volume Deviation (%) */}
        {activeTab === 'deviation' && (
          <div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pressureSweepSeries}
                  margin={{ top: 12, right: 24, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="pressure_bar"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Absolute Pressure P (bar)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Volume Deviation (v_PR - v_ideal)/v_ideal (%)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val ?? 0).toFixed(2)}%`,
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Pressure P = ${label} bar`}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="deviationPercent"
                    name={`Volume Error vs. Ideal Gas (%) = (Z - 1) × 100%`}
                    stroke="#e11d48"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceDot
                    x={Number(results.pressure_bar.toFixed(2))}
                    y={Number(results.volumeDeviationPercent.toFixed(2))}
                    r={6}
                    fill="#e11d48"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Engineering Design Consequence:</strong> Sizing a high-pressure storage
              vessel or compressor using <MathInline latex="PV = nRT" /> when{' '}
              <MathInline latex={`Z = ${results.compressibilityFactor_Z.toFixed(3)}`} /> introduces
              a{' '}
              <strong>
                {results.volumeDeviationPercent >= 0 ? '+' : ''}
                {results.volumeDeviationPercent.toFixed(2)}%
              </strong>{' '}
              volumetric error.
            </p>
          </div>
        )}
      </div>

      {/* Saved PVT Scenarios Comparison Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Scenario Comparison Workspace
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Saved Pure-Fluid PVT States ({savedScenarios.length})
            </h4>
          </div>
          {savedScenarios.length > 0 && (
            <button
              type="button"
              onClick={onClearScenarios}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Saved States
            </button>
          )}
        </div>

        {savedScenarios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
            Click <strong>Save Current PVT State</strong> in the parameter toolbar to compare
            compressibility factors <MathInline latex="Z" />, ideal vs. Peng–Robinson molar volumes,
            and percent deviations across fluids, temperatures, and pressures.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  <th className="px-3 py-2">Scenario</th>
                  <th className="px-3 py-2">Fluid</th>
                  <th className="px-3 py-2">T (K)</th>
                  <th className="px-3 py-2">P (bar)</th>
                  <th className="px-3 py-2">Z_PR (-)</th>
                  <th className="px-3 py-2">v_ideal (L/mol)</th>
                  <th className="px-3 py-2">v_PR (L/mol)</th>
                  <th className="px-3 py-2">Deviation (%)</th>
                  <th className="px-3 py-2">Regime</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedScenarios.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 font-semibold text-slate-900">{sc.label}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{sc.fluidCode}</td>
                    <td className="px-3 py-2 font-mono">{sc.temperature_K.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono">{sc.pressure_bar.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono font-bold text-teal-700">
                      {sc.Z_PR.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 font-mono">{sc.v_ideal_L_mol.toFixed(4)}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-900">
                      {sc.v_PR_L_mol.toFixed(4)}
                    </td>
                    <td
                      className={`px-3 py-2 font-mono font-semibold ${
                        sc.deviationPercent < 0 ? 'text-teal-700' : 'text-amber-700'
                      }`}
                    >
                      {sc.deviationPercent >= 0 ? '+' : ''}
                      {sc.deviationPercent.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2 text-slate-600">{sc.regime}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveScenario(sc.id)}
                        className="text-slate-400 hover:text-rose-600"
                        aria-label={`Remove scenario ${sc.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MODULE B CHARTS: IDEAL BINARY VAPOR–LIQUID EQUILIBRIUM (P-x-y, y-x, PARTIAL P)
// ============================================================================

export interface SavedVLEScenario {
  id: string;
  label: string;
  xA: number;
  psatA_kPa: number;
  psatB_kPa: number;
  alphaAB: number;
  bubbleP_kPa: number;
  dewP_kPa: number;
  yA_eq: number;
  phaseState: string;
}

interface BinaryVLEChartsProps {
  results: BinaryVLEResults;
  pxySeries: BinaryPxyPoint[];
  savedScenarios: SavedVLEScenario[];
  onRemoveScenario: (id: string) => void;
  onClearScenarios: () => void;
}

type VLEChartTab = 'pxy-diagram' | 'yx-diagram' | 'partial-pressures';

export function BinaryVLECharts({
  results,
  pxySeries,
  savedScenarios,
  onRemoveScenario,
  onClearScenarios,
}: BinaryVLEChartsProps) {
  const [activeTab, setActiveTab] = useState<VLEChartTab>('pxy-diagram');

  const isTwoPhase =
    results.phaseStateAtSystemPressure === 'Two-Phase Vapor–Liquid Equilibrium';

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
              Ideal Binary Phase Equilibrium · Raoult&apos;s &amp; Dalton&apos;s Laws
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'pxy-diagram' &&
                `Isothermal P–x–y Phase Equilibrium Diagram (α_AB = ${results.relativeVolatility_alphaAB.toFixed(2)})`}
              {activeTab === 'yx-diagram' &&
                `Vapor vs. Liquid Equilibrium Composition (y_A vs. x_A)`}
              {activeTab === 'partial-pressures' &&
                `Raoult's Law Partial Pressures (p_A, p_B) & Total Bubble Pressure vs. x_A`}
            </h3>
          </div>

          <div
            className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1"
            role="tablist"
            aria-label="Binary VLE Visualization Tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pxy-diagram'}
              onClick={() => setActiveTab('pxy-diagram')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'pxy-diagram'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. P–x–y Phase Diagram
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'yx-diagram'}
              onClick={() => setActiveTab('yx-diagram')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'yx-diagram'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. y_A vs. x_A Curve
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'partial-pressures'}
              onClick={() => setActiveTab('partial-pressures')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'partial-pressures'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Partial Pressures (p_A, p_B)
            </button>
          </div>
        </div>

        {/* Tab 1: Centerpiece P-x-y Diagram */}
        {activeTab === 'pxy-diagram' && (
          <div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pxySeries}
                  margin={{ top: 12, right: 24, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="moleFraction"
                    type="number"
                    domain={[0, 1]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Mole Fraction of Component A (x_A liquid / y_A vapor)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Pressure P (kPa)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val ?? 0).toFixed(2)} kPa`,
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Mole Fraction = ${Number(label).toFixed(2)}`}
                  />
                  <Legend verticalAlign="top" height={32} />

                  {/* Bubble-Point Line P_bubble(x_A) */}
                  <Line
                    type="monotone"
                    dataKey="bubblePressure_kPa"
                    name="Bubble-Point Curve P_bubble(x_A) [Saturated Liquid]"
                    stroke="#0284c7"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {/* Dew-Point Curve P_dew(y_A) */}
                  <Line
                    type="monotone"
                    dataKey="dewPressure_kPa"
                    name="Dew-Point Curve P_dew(y_A) [Saturated Vapor]"
                    stroke="#f59e0b"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {/* Vertical composition line at x_A */}
                  <ReferenceLine
                    x={Number(results.xA.toFixed(4))}
                    stroke="#64748b"
                    strokeDasharray="3 3"
                  />

                  {/* Horizontal system pressure line P_sys */}
                  <ReferenceLine
                    y={Number(results.systemPressure_kPa.toFixed(3))}
                    stroke="#0d9488"
                    strokeDasharray="5 3"
                  />

                  {/* Bubble point marker at x_A */}
                  <ReferenceDot
                    x={Number(results.xA.toFixed(4))}
                    y={Number(results.bubblePressure_kPa.toFixed(3))}
                    r={5}
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />

                  {/* Dew point marker at y_A = x_A */}
                  <ReferenceDot
                    x={Number(results.xA.toFixed(4))}
                    y={Number(results.dewPressureAtComposition_kPa.toFixed(3))}
                    r={5}
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />

                  {/* Operating state marker (z_A, P_sys) */}
                  <ReferenceDot
                    x={Number(results.xA.toFixed(4))}
                    y={Number(results.systemPressure_kPa.toFixed(3))}
                    r={6}
                    fill="#0f766e"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />

                  {/* Two-phase tie-line endpoints when inside phase envelope */}
                  {isTwoPhase &&
                    results.tieLineLiquid_xA !== null &&
                    results.tieLineVapor_yA !== null && (
                      <>
                        <ReferenceDot
                          x={Number(results.tieLineLiquid_xA.toFixed(4))}
                          y={Number(results.systemPressure_kPa.toFixed(3))}
                          r={5}
                          fill="#0284c7"
                          stroke="#0f172a"
                          strokeWidth={1.5}
                        />
                        <ReferenceDot
                          x={Number(results.tieLineVapor_yA.toFixed(4))}
                          y={Number(results.systemPressure_kPa.toFixed(3))}
                          r={5}
                          fill="#f59e0b"
                          stroke="#0f172a"
                          strokeWidth={1.5}
                        />
                      </>
                    )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Reading the Isothermal P–x–y Diagram:</strong> Pressures above the straight{' '}
              <strong>Bubble-Point Line</strong> (<MathInline latex="P > P_{\mathrm{bubble}}" />)
              correspond to compressed liquid; pressures below the curved{' '}
              <strong>Dew-Point Curve</strong> (<MathInline latex="P < P_{\mathrm{dew}}" />)
              correspond to superheated vapor. Between them lies the two-phase VLE lens where a
              horizontal tie-line connects equilibrium liquid{' '}
              <MathInline latex="x_A" /> on the bubble curve to equilibrium vapor{' '}
              <MathInline latex="y_A" /> on the dew curve.
            </p>
          </div>
        )}

        {/* Tab 2: y_A vs x_A Diagram */}
        {activeTab === 'yx-diagram' && (
          <div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pxySeries}
                  margin={{ top: 12, right: 24, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="moleFraction"
                    type="number"
                    domain={[0, 1]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Liquid Mole Fraction x_A (-)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Equilibrium Vapor Mole Fraction y_A (-)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      Number(val ?? 0).toFixed(4),
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Liquid x_A = ${Number(label).toFixed(2)}`}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Line
                    type="monotone"
                    dataKey="diagonal_x"
                    name="45° Diagonal Reference (y_A = x_A)"
                    stroke="#64748b"
                    strokeWidth={1.75}
                    strokeDasharray="5 5"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="equilibriumVapor_yA"
                    name={`Raoult–Dalton VLE Curve y_A(x_A) [α_AB = ${results.relativeVolatility_alphaAB.toFixed(2)}]`}
                    stroke="#0d9488"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceDot
                    x={Number(results.xA.toFixed(4))}
                    y={Number(results.equilibriumVapor_yA.toFixed(4))}
                    r={6}
                    fill="#0d9488"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Direct Bridge to Distillation (Phase 2.2):</strong> Combining Raoult&apos;s
              and Dalton&apos;s laws yields{' '}
              <MathInline latex="y_A = \frac{\alpha_{AB} x_A}{1 + (\alpha_{AB} - 1)x_A}" /> where{' '}
              <MathInline latex="\alpha_{AB} = P_A^{\mathrm{sat}}/P_B^{\mathrm{sat}}" />—the exact
              equilibrium curve used to step off stages in the McCabe–Thiele Binary Distillation
              laboratory!
            </p>
          </div>
        )}

        {/* Tab 3: Partial Pressures vs x_A */}
        {activeTab === 'partial-pressures' && (
          <div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pxySeries}
                  margin={{ top: 12, right: 24, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="moleFraction"
                    type="number"
                    domain={[0, 1]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Liquid Mole Fraction x_A (-)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Pressure Contribution (kPa)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val ?? 0).toFixed(2)} kPa`,
                      String(name ?? ''),
                    ]}
                    labelFormatter={(label) => `Liquid x_A = ${Number(label).toFixed(2)}`}
                  />
                  <Legend verticalAlign="top" height={32} />
                  <Line
                    type="monotone"
                    dataKey="bubblePressure_kPa"
                    name="Total Bubble Pressure P_total = p_A + p_B"
                    stroke="#0f172a"
                    strokeWidth={2.75}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="partialPressureA_kPa"
                    name="Partial Pressure p_A = x_A · P_A^sat"
                    stroke="#0d9488"
                    strokeWidth={2.25}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="partialPressureB_kPa"
                    name="Partial Pressure p_B = (1 - x_A) · P_B^sat"
                    stroke="#6366f1"
                    strokeWidth={2.25}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <ReferenceLine
                    x={Number(results.xA.toFixed(4))}
                    stroke="#64748b"
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              <strong>Linearity of Raoult&apos;s Law:</strong> In an ideal liquid solution, each
              component&apos;s partial vapor pressure is strictly proportional to its liquid mole
              fraction (<MathInline latex="p_i = x_i P_i^{\mathrm{sat}}" />), so their sum{' '}
              <MathInline latex="P_{\mathrm{bubble}} = p_A + p_B" /> forms a straight line between{' '}
              <MathInline latex="P_B^{\mathrm{sat}}" /> at <MathInline latex="x_A = 0" /> and{' '}
              <MathInline latex="P_A^{\mathrm{sat}}" /> at <MathInline latex="x_A = 1" />.
            </p>
          </div>
        )}
      </div>

      {/* Saved VLE Scenarios Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Scenario Comparison Workspace
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              Saved Binary VLE States ({savedScenarios.length})
            </h4>
          </div>
          {savedScenarios.length > 0 && (
            <button
              type="button"
              onClick={onClearScenarios}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Saved States
            </button>
          )}
        </div>

        {savedScenarios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
            Click <strong>Save Current VLE State</strong> in the parameter toolbar to compare
            relative volatility <MathInline latex="\alpha_{AB}" />, bubble/dew pressures, and vapor
            enrichment across mixtures.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  <th className="px-3 py-2">Scenario</th>
                  <th className="px-3 py-2">x_A</th>
                  <th className="px-3 py-2">P_A^sat (kPa)</th>
                  <th className="px-3 py-2">P_B^sat (kPa)</th>
                  <th className="px-3 py-2">α_AB</th>
                  <th className="px-3 py-2">P_bubble (kPa)</th>
                  <th className="px-3 py-2">P_dew (kPa)</th>
                  <th className="px-3 py-2">y_A* (bubble)</th>
                  <th className="px-3 py-2">Phase State @ P_sys</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedScenarios.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 font-semibold text-slate-900">{sc.label}</td>
                    <td className="px-3 py-2 font-mono">{sc.xA.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono">{sc.psatA_kPa.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono">{sc.psatB_kPa.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono font-bold text-teal-700">
                      {sc.alphaAB.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 font-mono">{sc.bubbleP_kPa.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">{sc.dewP_kPa.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono font-bold text-slate-900">
                      {sc.yA_eq.toFixed(4)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{sc.phaseState}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveScenario(sc.id)}
                        className="text-slate-400 hover:text-rose-600"
                        aria-label={`Remove scenario ${sc.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
