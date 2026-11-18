'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  Cell,
} from 'recharts';
import {
  HeatExchangerInputs,
  HeatExchangerResults,
  generateSensitivitySeries,
} from '@/lib/heat-exchanger';
import { MathInline } from '@/components/lab-shared';
import { truncateScenarioTickLabel } from '@/lib/navigation';
import { Plus, Trash2, RotateCcw } from 'lucide-react';

export interface SavedScenario {
  id: string;
  label: string;
  inputs: HeatExchangerInputs;
  Q_kW: number;
  effectiveness_pct: number;
  NTU: number;
  Cr: number;
  Th_out: number;
  Tc_out: number;
}

interface ChartsProps {
  inputs: HeatExchangerInputs;
  results: HeatExchangerResults;
  savedScenarios: SavedScenario[];
  onSaveCurrentScenario: (customLabel?: string) => void;
  onRemoveScenario: (id: string) => void;
  onLoadScenario: (inputs: HeatExchangerInputs) => void;
  onClearScenarios: () => void;
}

type SensitivityParam = 'A' | 'mh' | 'mc' | 'U';

const PARAM_META: Record<
  SensitivityParam,
  { label: string; unit: string; shortLabel: string }
> = {
  A: { label: 'Heat Transfer Area (A)', unit: 'm²', shortLabel: 'Area A (m²)' },
  mh: { label: 'Hot Stream Flow Rate (mh)', unit: 'kg/s', shortLabel: 'Hot Flow mh (kg/s)' },
  mc: { label: 'Cold Stream Flow Rate (mc)', unit: 'kg/s', shortLabel: 'Cold Flow mc (kg/s)' },
  U: {
    label: 'Overall Heat Transfer Coeff. (U)',
    unit: 'W/(m²·K)',
    shortLabel: 'Coeff. U (W/m²·K)',
  },
};

export function HeatExchangerCharts({
  inputs,
  results,
  savedScenarios,
  onSaveCurrentScenario,
  onRemoveScenario,
  onLoadScenario,
  onClearScenarios,
}: ChartsProps) {
  const [sensitivityParam, setSensitivityParam] = useState<SensitivityParam>('A');
  const [customScenarioLabel, setCustomScenarioLabel] = useState<string>('');

  const sensitivityData = useMemo(
    () => generateSensitivitySeries(inputs, sensitivityParam, 24),
    [inputs, sensitivityParam]
  );

  const inletOutletBarData = useMemo(() => {
    if (!results.isValid) return [];
    return [
      {
        name: 'Hot Stream (Th)',
        Inlet: Number(inputs.Th_in.toFixed(2)),
        Outlet: Number(results.Th_out.toFixed(2)),
        delta: -Number(results.deltaTh.toFixed(2)),
      },
      {
        name: 'Cold Stream (Tc)',
        Inlet: Number(inputs.Tc_in.toFixed(2)),
        Outlet: Number(results.Tc_out.toFixed(2)),
        delta: Number(results.deltaTc.toFixed(2)),
      },
    ];
  }, [inputs.Th_in, inputs.Tc_in, results]);

  const currentParamValue = inputs[sensitivityParam];

  // Build comparison dataset including saved scenarios + live active state
  const comparisonChartData = useMemo(() => {
    const items = savedScenarios.map((s) => ({
      name: s.label,
      shortName: truncateScenarioTickLabel(s.label, 16),
      fullName: s.label,
      Q_kW: Number(s.Q_kW.toFixed(1)),
      effectiveness_pct: Number(s.effectiveness_pct.toFixed(1)),
      Th_out: Number(s.Th_out.toFixed(1)),
      Tc_out: Number(s.Tc_out.toFixed(1)),
      isLive: false,
    }));

    if (results.isValid) {
      items.push({
        name: 'Current Live Run',
        shortName: 'Current Live',
        fullName: 'Current Live Run',
        Q_kW: Number(results.Q_kW.toFixed(1)),
        effectiveness_pct: Number(results.effectiveness_pct.toFixed(1)),
        Th_out: Number(results.Th_out.toFixed(1)),
        Tc_out: Number(results.Tc_out.toFixed(1)),
        isLive: true,
      });
    }
    return items;
  }, [savedScenarios, results]);

  if (!results.isValid) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          Resolve input validation errors to render scientific temperature profiles and sensitivity charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Inlet vs Outlet Bar Chart + Countercurrent Axial Temperature Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 1A: Inlet vs Outlet Temperature Chart */}
        <div className="lg:col-span-5 min-w-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900">
                Inlet vs. Outlet Temperatures (<MathInline latex="T_h, T_c" />)
              </h3>
              <span className="text-xs font-mono text-slate-600 tabular-nums">
                <MathInline latex="\Delta T_{\max}" /> = {(inputs.Th_in - inputs.Tc_in).toFixed(1)}{' '}
                °C
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Terminal stream temperatures showing hot fluid cooling (−{results.deltaTh.toFixed(1)}{' '}
              °C) and cold fluid heating (+{results.deltaTc.toFixed(1)} °C).
            </p>
          </div>

          <div className="h-[250px] w-full" data-testid="inlet-outlet-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={inletOutletBarData}
                margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  unit=" °C"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  domain={[0, Math.ceil(Math.max(inputs.Th_in, results.Tc_out) * 1.1)]}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0).toFixed(2)} °C`, '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                <Bar dataKey="Inlet" name="Inlet Temp (°C)" fill="#0F172A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outlet" name="Outlet Temp (°C)" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono tabular-nums">
            <span>Hot Drop: {inputs.Th_in.toFixed(1)} → {results.Th_out.toFixed(1)} °C</span>
            <span>Cold Rise: {inputs.Tc_in.toFixed(1)} → {results.Tc_out.toFixed(1)} °C</span>
          </div>
        </div>

        {/* Chart 1B: Exact Analytical Axial Temperature Profile */}
        <div className="lg:col-span-7 min-w-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold text-slate-900">
                Countercurrent Axial Temperature Profile <MathInline latex="T(x/L)" />
              </h3>
              <span className="text-xs font-mono text-slate-600 tabular-nums">
                <MathInline latex="x/L = 0" /> (Hot In / Cold Out) → <MathInline latex="x/L = 1" />{' '}
                (Hot Out / Cold In)
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Analytical solution of coupled steady-state differential energy balances along
              dimensionless position <MathInline latex="x/L" />.
            </p>
          </div>

          <div className="h-[250px] w-full" data-testid="axial-profile-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={results.axialProfile}
                margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="normalizedPosition"
                  type="number"
                  domain={[0, 1]}
                  tickCount={6}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Dimensionless Axial Position (x / L)',
                    position: 'insideBottom',
                    offset: -4,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  unit=" °C"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  domain={[
                    Math.max(0, Math.floor(inputs.Tc_in - 10)),
                    Math.ceil(inputs.Th_in + 10),
                  ]}
                />
                <Tooltip
                  labelFormatter={(val) =>
                    `Position x/L = ${val} (Area ≈ ${(Number(val) * inputs.A).toFixed(1)} m²)`
                  }
                  formatter={(value, name) => [`${Number(value ?? 0).toFixed(2)} °C`, String(name)]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="Th"
                  name="Hot Stream Th(x) [→]"
                  stroke="#DC2626"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#DC2626' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Tc"
                  name="Cold Stream Tc(x) [←]"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#0284C7' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono tabular-nums">
            <span>
              Hot-End Approach (<MathInline latex="x/L=0" />): <MathInline latex="\Delta T_1" /> ={' '}
              {results.approachTempHotEnd.toFixed(2)} °C
            </span>
            <span>
              Cold-End Approach (<MathInline latex="x/L=1" />): <MathInline latex="\Delta T_2" /> ={' '}
              {results.approachTempColdEnd.toFixed(2)} °C
            </span>
            <span>
              Log-Mean <MathInline latex="\Delta T_{\mathrm{lm}}" />: {results.LMTD.toFixed(2)} °C
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Heat Duty Response to Changing Parameters (Parametric Sensitivity) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Heat Duty (<MathInline latex="Q" />) &amp; Effectiveness (<MathInline latex="\varepsilon" />) Response to Parameter Variation
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Explore how Heat Transfer Rate <MathInline latex="Q" /> (<MathInline latex="\mathrm{kW}" />) and Effectiveness <MathInline latex="\varepsilon" /> (%) respond under the ideal steady-state model while holding all other inputs constant.
            </p>
          </div>

          {/* Interactive segmented parameter selector */}
          <div
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
            role="group"
            aria-label="Select sensitivity parameter"
          >
            {(['A', 'mh', 'mc', 'U'] as SensitivityParam[]).map((param) => (
              <button
                key={param}
                type="button"
                onClick={() => setSensitivityParam(param)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                  sensitivityParam === param
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {PARAM_META[param].shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[260px] w-full" data-testid="sensitivity-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sensitivityData}
              margin={{ top: 12, right: 20, left: 12, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="parameterValue"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 11, fill: '#475569' }}
                label={{
                  value: `${PARAM_META[sensitivityParam].label} [${PARAM_META[sensitivityParam].unit}]`,
                  position: 'insideBottom',
                  offset: -6,
                  fontSize: 11,
                  fill: '#475569',
                }}
              />
              <YAxis
                yAxisId="left"
                width={54}
                tick={{ fontSize: 11, fill: '#0F172A' }}
                label={{
                  value: 'Heat Duty Q (kW)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 4,
                  fontSize: 11,
                  fill: '#0F172A',
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={50}
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#0D9488' }}
                label={{
                  value: 'Effectiveness ε (%)',
                  angle: 90,
                  position: 'insideRight',
                  offset: 4,
                  fontSize: 11,
                  fill: '#0D9488',
                }}
              />
              <Tooltip
                labelFormatter={(val) =>
                  `${PARAM_META[sensitivityParam].shortLabel}: ${val} ${PARAM_META[sensitivityParam].unit}`
                }
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Q_kW"
                name="Heat Duty Q (kW)"
                stroke="#0F172A"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="effectiveness_pct"
                name="Effectiveness ε (%)"
                stroke="#0D9488"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
              <ReferenceDot
                yAxisId="left"
                x={currentParamValue}
                y={Number(results.Q_kW.toFixed(2))}
                r={6}
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Red marker indicates your active operating point:{' '}
            <strong className="font-mono text-slate-900">
              {sensitivityParam} = {currentParamValue} {PARAM_META[sensitivityParam].unit}
            </strong>{' '}
            →{' '}
            <strong className="font-mono text-teal-800">
              Q = {results.Q_kW.toFixed(2)} kW (ε = {results.effectiveness_pct.toFixed(1)}%)
            </strong>
          </span>
          <span className="font-mono text-slate-600">
            Thermodynamic Limit Qmax = {results.Qmax_kW.toFixed(1)} kW
          </span>
        </div>
      </div>

      {/* Row 3: Multi-Scenario Comparison Workspace */}
      <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="scenario-comparison-section">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Operating Scenario Comparison Table &amp; Chart
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Snapshot different operating conditions to compare Heat Duty (Q), Effectiveness (ε), NTU, and outlet temperatures side by side.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={customScenarioLabel}
              onChange={(e) => setCustomScenarioLabel(e.target.value)}
              placeholder="Optional run label..."
              aria-label="Optional scenario label"
              maxLength={32}
              className="px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg w-44 focus-visible:outline-2 focus-visible:outline-teal-700"
            />
            <button
              type="button"
              onClick={() => {
                onSaveCurrentScenario(customScenarioLabel);
                setCustomScenarioLabel('');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Snapshot Current Scenario
            </button>
            {savedScenarios.length > 1 && (
              <button
                type="button"
                onClick={onClearScenarios}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Snapshots
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Bar Chart Comparison */}
          <div className="lg:col-span-5 min-w-0 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 10, right: 12, left: 0, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#334155' }}
                />
                <YAxis
                  unit=" kW"
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName ?? String(label)
                  }
                  formatter={(value, name) => [
                    name === 'Q_kW' ? `${Number(value ?? 0)} kW` : `${Number(value ?? 0)}%`,
                    name === 'Q_kW' ? 'Heat Transfer Rate (Q)' : 'Effectiveness (ε)',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Q_kW" name="Heat Transfer Rate (kW)" radius={[4, 4, 0, 0]}>
                  {comparisonChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isLive ? '#0D9488' : '#334155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison Data Table */}
          <div
            className="lg:col-span-7 min-w-0 overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-teal-700"
            role="region"
            aria-label="Heat Exchanger Scenario Comparison Table"
            tabIndex={0}
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2 pr-3 whitespace-nowrap">Scenario</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">A (m²)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">mh / mc (kg/s)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">NTU</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">ε (%)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">Q (kW)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">Th,out / Tc,out (°C)</th>
                  <th className="py-2 pl-2 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {savedScenarios.map((scenario) => (
                  <tr key={scenario.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 whitespace-nowrap">
                      {scenario.label}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.inputs.A.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.inputs.mh.toFixed(1)} / {scenario.inputs.mc.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.NTU.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.effectiveness_pct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {scenario.Q_kW.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.Th_out.toFixed(1)} / {scenario.Tc_out.toFixed(1)}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-sans">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onLoadScenario(scenario.inputs)}
                          className="text-teal-800 hover:text-teal-950 font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveScenario(scenario.id)}
                          aria-label={`Remove ${scenario.label}`}
                          className="text-slate-500 hover:text-rose-700 p-1 rounded focus-visible:outline-2 focus-visible:outline-teal-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Active Live Row */}
                <tr className="bg-teal-50/60 font-semibold text-teal-950">
                  <td className="py-2.5 pr-3 font-sans font-semibold text-teal-900">
                    Current Live Run
                  </td>
                  <td className="py-2.5 px-2 text-right">{inputs.A.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-right">
                    {inputs.mh.toFixed(1)} / {inputs.mc.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-right">{results.NTU.toFixed(2)}</td>
                  <td className="py-2.5 px-2 text-right">
                    {results.effectiveness_pct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-2 text-right text-teal-800">
                    {results.Q_kW.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {results.Th_out.toFixed(1)} / {results.Tc_out.toFixed(1)}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-sans text-xs text-teal-700">
                    Active
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
