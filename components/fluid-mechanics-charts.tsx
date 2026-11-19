'use client';

import React, { useMemo, useState } from 'react';
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
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';
import {
  FluidMechanicsInputs,
  FluidMechanicsResults,
  generateFlowSweepSeries,
  generateMoodySeries,
} from '@/lib/fluid-mechanics';
import { LabChartCard, MathInline } from '@/components/lab-shared';
import { truncateScenarioTickLabel } from '@/lib/navigation';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

export interface SavedFluidScenario {
  id: string;
  label: string;
  inputs: FluidMechanicsInputs;
  velocity_m_s: number;
  reynoldsNumber: number;
  flowRegime: string;
  darcyFrictionFactor: number;
  frictionalPressureLoss_kPa: number;
  requiredPumpHead_m: number;
  shaftPower_kW: number;
}

interface FluidChartsProps {
  inputs: FluidMechanicsInputs;
  results: FluidMechanicsResults;
  savedScenarios: SavedFluidScenario[];
  onSaveCurrentScenario: (customLabel?: string) => void;
  onRemoveScenario: (id: string) => void;
  onLoadScenario: (inputs: FluidMechanicsInputs) => void;
  onClearScenarios: () => void;
}

export function FluidMechanicsCharts({
  inputs,
  results,
  savedScenarios,
  onSaveCurrentScenario,
  onRemoveScenario,
  onLoadScenario,
  onClearScenarios,
}: FluidChartsProps) {
  const [customScenarioLabel, setCustomScenarioLabel] = useState('');

  const flowSweepData = useMemo(
    () => generateFlowSweepSeries(inputs, 25),
    [inputs]
  );

  const moodyData = useMemo(
    () => generateMoodySeries(results.relativeRoughness),
    [results.relativeRoughness]
  );

  const comparisonChartData = useMemo(() => {
    const items = savedScenarios.map((s) => ({
      name: s.label,
      shortName: truncateScenarioTickLabel(s.label, 16),
      fullName: s.label,
      deltaP_kPa: Number(s.frictionalPressureLoss_kPa.toFixed(2)),
      head_m: Number(s.requiredPumpHead_m.toFixed(2)),
      isLive: false,
    }));

    if (results.isValid) {
      items.push({
        name: 'Current Live Run',
        shortName: 'Current Live',
        fullName: 'Current Live Run',
        deltaP_kPa: Number(results.frictionalPressureLoss_kPa.toFixed(2)),
        head_m: Number(results.requiredPumpHead_m.toFixed(2)),
        isLive: true,
      });
    }
    return items;
  }, [savedScenarios, results]);

  if (!results.isValid) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          Resolve input validation errors to render fluid hydraulic profiles and Moody friction curves.
        </p>
      </div>
    );
  }

  const maxFlowSweep =
    flowSweepData.length > 0
      ? flowSweepData[flowSweepData.length - 1].flowRate_L_s
      : Math.max(25, inputs.flowRate_L_s);

  return (
    <div className="space-y-6">
      {/* Row 1: Pressure Loss vs Flow Rate & Reynolds Number vs Flow Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 1: Frictional Pressure Loss vs Volumetric Flow Rate */}
        <LabChartCard
          className="lg:col-span-6"
          title="Frictional Pressure Loss vs. Flow Rate"
          subtitle="$\Delta P_{\mathrm{f}} = \rho g(h_f + h_m)$ grows roughly quadratically with volumetric flow rate $Q$ while geometry and fluid properties stay fixed."
          rightMeta={`Active $\\Delta P_{\\mathrm{f}}$ = ${results.frictionalPressureLoss_kPa.toFixed(2)} kPa`}
          footer={
            <>
              <span>Major Loss hf: {results.majorHeadLoss_m.toFixed(2)} m</span>
              <span>Minor Loss hm: {results.minorHeadLoss_m.toFixed(2)} m</span>
            </>
          }
        >
          <div className="h-[250px] w-full" data-testid="pressure-loss-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={flowSweepData}
                margin={{ top: 12, right: 18, left: 4, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="flowRate_L_s"
                  type="number"
                  domain={[0, maxFlowSweep]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Volumetric Flow Rate Q (L/s)',
                    position: 'insideBottom',
                    offset: -6,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  unit=" kPa"
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  labelFormatter={(val) => `Flow Rate Q = ${Number(val).toFixed(2)} L/s`}
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(2)} kPa`,
                    'Frictional ΔP',
                  ]}
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
                  dataKey="frictionalPressureLoss_kPa"
                  name="Frictional ΔP (kPa)"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  dot={false}
                />
                <ReferenceDot
                  x={Number(inputs.flowRate_L_s.toFixed(3))}
                  y={Number(results.frictionalPressureLoss_kPa.toFixed(3))}
                  r={6}
                  fill="#DC2626"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>

        {/* Chart 2: Reynolds Number vs Volumetric Flow Rate */}
        <LabChartCard
          className="lg:col-span-6"
          title="Reynolds Number vs. Flow Rate"
          subtitle="$\mathrm{Re} = \frac{\rho v D}{\mu}$ scales linearly with $Q$. Shaded band marks transitional uncertainty ($2,100 \le \mathrm{Re} \le 4,000$)."
          rightMeta={`Active $\\mathrm{Re}$ = ${Math.round(results.reynoldsNumber).toLocaleString()}`}
          footer={
            <>
              <span>Laminar &lt; 2,100 · Turbulent &gt; 4,000</span>
              <span>Active Regime: {results.flowRegime}</span>
            </>
          }
        >
          <div className="h-[250px] w-full" data-testid="reynolds-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={flowSweepData}
                margin={{ top: 12, right: 18, left: 6, bottom: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="flowRate_L_s"
                  type="number"
                  domain={[0, maxFlowSweep]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Volumetric Flow Rate Q (L/s)',
                    position: 'insideBottom',
                    offset: -6,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  tickFormatter={(v) =>
                    Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : `${v}`
                  }
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  labelFormatter={(val) => `Flow Rate Q = ${Number(val).toFixed(2)} L/s`}
                  formatter={(value) => [
                    Math.round(Number(value ?? 0)).toLocaleString(),
                    'Reynolds Number (Re)',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <ReferenceArea
                  y1={2100}
                  y2={4000}
                  fill="#F59E0B"
                  fillOpacity={0.18}
                  ifOverflow="hidden"
                />
                <ReferenceLine
                  y={2100}
                  stroke="#D97706"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={4000}
                  stroke="#B45309"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="reynoldsNumber"
                  name="Reynolds Number (Re)"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={false}
                />
                <ReferenceDot
                  x={Number(inputs.flowRate_L_s.toFixed(3))}
                  y={Number(results.reynoldsNumber.toFixed(1))}
                  r={6}
                  fill="#DC2626"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>
      </div>

      {/* Row 2: Moody-Style Diagram (f_D vs Re) & Required Pump Head vs Flow Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 3: Moody-Style Darcy Friction Factor vs Reynolds Number */}
        <LabChartCard
          className="lg:col-span-7"
          title="Moody-Style Diagram: Darcy Friction Factor ($f_D$) vs. $\mathrm{Re}$"
          subtitle="Log-log chart showing Hagen–Poiseuille laminar flow ($f_D = 64/\mathrm{Re}$) and Colebrook–White turbulent friction at your $\varepsilon/D$ vs. smooth pipe. Transitional band [$2,100\text{–}4,000$] is shaded."
          rightMeta={`$\\varepsilon/D$ = ${results.relativeRoughness.toExponential(2)}`}
          footer={
            <>
              <span>
                Darcy <MathInline latex="f_D" /> ={' '}
                {results.flowRegime === 'Zero Flow'
                  ? '—'
                  : results.darcyFrictionFactor.toFixed(5)}
              </span>
              <span>
                Fanning <MathInline latex="f_F = f_D/4" /> ={' '}
                {results.flowRegime === 'Zero Flow'
                  ? '—'
                  : results.fanningFrictionFactor.toFixed(5)}
              </span>
            </>
          }
        >
          <div className="h-[270px] w-full" data-testid="moody-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={moodyData}
                margin={{ top: 12, right: 20, left: 4, bottom: 14 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="reynoldsNumber"
                  type="number"
                  scale="log"
                  domain={[300, 10000000]}
                  ticks={[300, 1000, 2100, 4000, 10000, 100000, 1000000, 10000000]}
                  tickFormatter={(v) =>
                    Number(v) >= 1000000
                      ? `${Number(v) / 1000000}M`
                      : Number(v) >= 1000
                      ? `${Number(v) / 1000}k`
                      : `${v}`
                  }
                  tick={{ fontSize: 10, fill: '#475569' }}
                  label={{
                    value: 'Reynolds Number Re (Log Scale)',
                    position: 'insideBottom',
                    offset: -8,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  scale="log"
                  domain={[0.008, 0.25]}
                  ticks={[0.01, 0.02, 0.04, 0.06, 0.1, 0.2]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  labelFormatter={(val) => `Re = ${Math.round(Number(val)).toLocaleString()}`}
                  formatter={(value, name) => [
                    value === null || value === undefined
                      ? '—'
                      : Number(value).toFixed(5),
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceArea
                  x1={2100}
                  x2={4000}
                  fill="#F59E0B"
                  fillOpacity={0.18}
                />
                <Line
                  type="monotone"
                  dataKey="laminarFriction"
                  name="Laminar (64 / Re)"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="turbulentCurrentRoughness"
                  name={`Turbulent (ε/D = ${results.relativeRoughness.toFixed(5)})`}
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="turbulentSmoothPipe"
                  name="Smooth Pipe Limit (ε/D = 0)"
                  stroke="#0D9488"
                  strokeWidth={1.8}
                  strokeDasharray="5 3"
                  dot={false}
                  connectNulls={false}
                />
                {results.reynoldsNumber >= 300 &&
                  results.reynoldsNumber <= 10000000 &&
                  results.darcyFrictionFactor >= 0.008 &&
                  results.darcyFrictionFactor <= 0.25 && (
                    <ReferenceDot
                      x={Number(results.reynoldsNumber.toFixed(1))}
                      y={Number(results.darcyFrictionFactor.toFixed(5))}
                      r={6}
                      fill="#DC2626"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>

        {/* Chart 4: Required Pump Head vs Flow Rate */}
        <LabChartCard
          className="lg:col-span-5"
          title="Required Pump Head ($H$) vs. Flow Rate"
          subtitle="Static lift plus flow-dependent friction losses ($H = \Delta z + h_f + h_m$)."
          rightMeta={`Active $H$ = ${results.requiredPumpHead_m.toFixed(2)} m`}
          footer={
            <>
              <span>
                Static Elevation <MathInline latex="\Delta z" />: {inputs.elevationDiff_m.toFixed(1)} m
              </span>
              <span>
                Shaft Power <MathInline latex="P_s" />: {results.shaftPower_kW.toFixed(2)} kW
              </span>
            </>
          }
        >
          <div className="h-[270px] w-full" data-testid="pump-head-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={flowSweepData}
                margin={{ top: 12, right: 16, left: 2, bottom: 14 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="flowRate_L_s"
                  type="number"
                  domain={[0, maxFlowSweep]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Volumetric Flow Rate Q (L/s)',
                    position: 'insideBottom',
                    offset: -8,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  unit=" m"
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  labelFormatter={(val) => `Flow Rate Q = ${Number(val).toFixed(2)} L/s`}
                  formatter={(value, name) => [`${Number(value ?? 0).toFixed(2)} m`, String(name)]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="requiredPumpHead_m"
                  name="Required Pump Head H (m)"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="majorHeadLoss_m"
                  name="Major Loss hf (m)"
                  stroke="#334155"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="minorHeadLoss_m"
                  name="Minor Loss hm (m)"
                  stroke="#0284C7"
                  strokeWidth={1.5}
                  strokeDasharray="2 3"
                  dot={false}
                />
                <ReferenceDot
                  x={Number(inputs.flowRate_L_s.toFixed(3))}
                  y={Number(results.requiredPumpHead_m.toFixed(3))}
                  r={6}
                  fill="#DC2626"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>
      </div>

      {/* Row 3: Operating Scenario Comparison Workspace */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-5"
        data-testid="fluid-scenario-comparison"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Operating Scenario Comparison Table &amp; Chart
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Snapshot different piping diameters, roughnesses, fluids, and flow rates to compare ΔP, Reynolds regime, pump head, and shaft power.
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
          <div className="lg:col-span-4 min-w-0 h-[220px] w-full">
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
                <YAxis unit=" kPa" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName ?? String(label)
                  }
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(2)} kPa`,
                    'Frictional ΔP',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="deltaP_kPa" name="Frictional ΔP (kPa)" radius={[4, 4, 0, 0]}>
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
            className="lg:col-span-8 min-w-0 overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-teal-700"
            role="region"
            aria-label="Fluid Mechanics Scenario Comparison Table"
            tabIndex={0}
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2 pr-3 whitespace-nowrap">Scenario</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">Q (L/s)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">D (m)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">Re</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">f_D</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">ΔP (kPa)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">H (m)</th>
                  <th className="py-2 px-2 text-right whitespace-nowrap">Ps (kW)</th>
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
                      {scenario.inputs.flowRate_L_s.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.inputs.diameter_m.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {Math.round(scenario.reynoldsNumber).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.flowRegime === 'Zero Flow'
                        ? '—'
                        : scenario.darcyFrictionFactor.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {scenario.frictionalPressureLoss_kPa.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.requiredPumpHead_m.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700 whitespace-nowrap">
                      {scenario.shaftPower_kW.toFixed(2)}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-sans whitespace-nowrap">
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
                  <td className="py-2.5 px-2 text-right">{inputs.flowRate_L_s.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-right">{inputs.diameter_m.toFixed(3)}</td>
                  <td className="py-2.5 px-2 text-right">
                    {Math.round(results.reynoldsNumber).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {results.flowRegime === 'Zero Flow'
                      ? '—'
                      : results.darcyFrictionFactor.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-teal-800">
                    {results.frictionalPressureLoss_kPa.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {results.requiredPumpHead_m.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right">{results.shaftPower_kW.toFixed(2)}</td>
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
