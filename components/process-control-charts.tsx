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
} from 'recharts';
import {
  ProcessControlInputs,
  ProcessControlResults,
  ControllerComparisonSummary,
  SensitivityParameterKey,
  SensitivitySweepResult,
} from '@/lib/process-control';
import { MathInline } from '@/components/lab-shared/math';
import { formatSignedZero } from '@/lib/navigation';
import { RotateCcw, Trash2 } from 'lucide-react';

export interface SavedControlScenario {
  id: string;
  label: string;
  inputs: ProcessControlInputs;
  results: ProcessControlResults;
}

interface ProcessControlChartsProps {
  results: ProcessControlResults;
  modeComparison: ControllerComparisonSummary;
  sensitivityParameter: SensitivityParameterKey;
  onSelectSensitivityParameter: (key: SensitivityParameterKey) => void;
  sensitivitySweep: SensitivitySweepResult;
  showAnalyticalReference: boolean;
  onToggleAnalyticalReference: (show: boolean) => void;
  savedScenarios: SavedControlScenario[];
  onLoadScenario: (scenario: SavedControlScenario) => void;
  onRemoveScenario: (id: string) => void;
  onClearScenarios: () => void;
}

type ControlChartTab =
  | 'response'
  | 'actuator'
  | 'error'
  | 'comparison'
  | 'sensitivity';

export function ProcessControlCharts({
  results,
  modeComparison,
  sensitivityParameter,
  onSelectSensitivityParameter,
  sensitivitySweep,
  showAnalyticalReference,
  onToggleAnalyticalReference,
  savedScenarios,
  onLoadScenario,
  onRemoveScenario,
  onClearScenarios,
}: ProcessControlChartsProps) {
  const [activeTab, setActiveTab] = useState<ControlChartTab>('response');
  const { inputs, timeSeries, metrics } = results;

  const tabs: { id: ControlChartTab; label: string; subtitle: string }[] = [
    {
      id: 'response',
      label: '1. Process Response Y(t)',
      subtitle: 'Setpoint vs. Controlled Variable',
    },
    {
      id: 'actuator',
      label: '2. Controller Output U(t)',
      subtitle: 'Command u_cmd vs. Saturated U_act',
    },
    {
      id: 'error',
      label: '3. Control Error e(t)',
      subtitle: 'Tracking Error & PID Components',
    },
    {
      id: 'comparison',
      label: '4. P vs. PI vs. PID',
      subtitle: 'Mode Comparison on Current Plant',
    },
    {
      id: 'sensitivity',
      label: '5. Parameter Sensitivity',
      subtitle: '0.5× / 1.0× / 2.0× Tuning Sweep',
    },
  ];

  const sensitivityOptions: {
    key: SensitivityParameterKey;
    label: string;
    latex: string;
  }[] = [
    { key: 'controllerGain_Kc', label: 'Controller Gain', latex: 'K_c' },
    { key: 'integralTime_Ti_s', label: 'Integral Time', latex: '\\tau_I' },
    { key: 'derivativeTime_Td_s', label: 'Derivative Time', latex: '\\tau_D' },
    { key: 'timeConstant_tau_s', label: 'Process Time Constant', latex: '\\tau' },
    { key: 'deadTime_theta_s', label: 'Process Dead Time', latex: '\\theta' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Chart Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
              Dynamic Time-Domain Diagnostics
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Closed-Loop &amp; Open-Loop Trajectory Analysis
            </h3>
          </div>

          {/* Chart Tab Selector */}
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            aria-label="Process Control Chart Tabs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-teal-600 bg-teal-600 text-white shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Process Response Y(t) vs Time */}
        {activeTab === 'response' && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Tracks controlled process variable <MathInline latex="Y(t)" /> against
                setpoint <MathInline latex="r(t)" /> over{' '}
                <MathInline latex={`0 \\le t \\le ${inputs.simulationDuration_s}\\,\\mathrm{s}`} />.
                {Math.abs(inputs.disturbanceMagnitude_d) > 1e-4 && (
                  <>
                    {' '}
                    Load disturbance{' '}
                    <MathInline
                      latex={`d = ${inputs.disturbanceMagnitude_d.toFixed(1)}\\%`}
                    />{' '}
                    activates at{' '}
                    <MathInline
                      latex={`t = ${inputs.disturbanceTime_s.toFixed(1)}\\,\\mathrm{s}`}
                    />
                    .
                  </>
                )}
              </p>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={showAnalyticalReference}
                  onChange={(e) => onToggleAnalyticalReference(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                />
                <span>Overlay Open-Loop Analytical Reference</span>
              </label>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeries}
                  margin={{ top: 10, right: 24, left: 8, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time_s"
                    type="number"
                    domain={[0, inputs.simulationDuration_s]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Time t (s)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    domain={['auto', 'auto']}
                    label={{
                      value: 'Process Variable Y / Setpoint r (% PV)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: 12, fill: '#334155' },
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val).toFixed(2)} % PV`,
                      String(name),
                    ]}
                    labelFormatter={(label) => `t = ${Number(label).toFixed(2)} s`}
                  />
                  <Legend verticalAlign="top" height={32} />

                  {inputs.controllerMode !== 'open-loop' && (
                    <Line
                      type="stepAfter"
                      dataKey="setpoint_r"
                      name="Setpoint r(t)"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="processOutput_Y"
                    name={`Process Output Y(t) [${inputs.controllerMode}]`}
                    stroke="#0d9488"
                    strokeWidth={2.6}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {showAnalyticalReference && (
                    <Line
                      type="monotone"
                      dataKey="analyticalOpenLoop_Y"
                      name="Analytical Open-Loop FOPDT Reference"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {Math.abs(inputs.disturbanceMagnitude_d) > 1e-4 && (
                    <ReferenceLine
                      x={inputs.disturbanceTime_s}
                      stroke="#e11d48"
                      strokeDasharray="4 4"
                      label={{
                        value: `Disturbance d=${inputs.disturbanceMagnitude_d}%`,
                        position: 'insideTopRight',
                        fill: '#be123c',
                        fontSize: 11,
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Controller Output U_cmd(t) & Saturated Actuator U_act(t) */}
        {activeTab === 'actuator' && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Compares unconstrained controller command{' '}
                <MathInline latex="u_{\mathrm{cmd}}(t)" /> against actual saturated valve/actuator
                signal <MathInline latex="U_{\mathrm{act}}(t)" /> bounded by{' '}
                <MathInline
                  latex={`[${inputs.actuatorMin_Umin.toFixed(0)}\\%,\\; ${inputs.actuatorMax_Umax.toFixed(0)}\\%]`}
                />
                .
              </p>
              <span className="font-mono text-xs font-semibold text-slate-700">
                Saturation Duration: {metrics.saturationDuration_s.toFixed(1)} s (
                {metrics.saturationPercent.toFixed(1)}%)
              </span>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeries}
                  margin={{ top: 10, right: 24, left: 8, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time_s"
                    type="number"
                    domain={[0, inputs.simulationDuration_s]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Time t (s)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    domain={['auto', 'auto']}
                    label={{
                      value: 'Manipulated Variable (% MV)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: 12, fill: '#334155' },
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val).toFixed(2)} % MV`,
                      String(name),
                    ]}
                    labelFormatter={(label) => `t = ${Number(label).toFixed(2)} s`}
                  />
                  <Legend verticalAlign="top" height={32} />

                  <ReferenceLine
                    y={inputs.actuatorMax_Umax}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `U(max) = ${inputs.actuatorMax_Umax}%`,
                      position: 'insideTopRight',
                      fill: '#b91c1c',
                      fontSize: 11,
                    }}
                  />
                  <ReferenceLine
                    y={inputs.actuatorMin_Umin}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `U(min) = ${inputs.actuatorMin_Umin}%`,
                      position: 'insideBottomRight',
                      fill: '#b91c1c',
                      fontSize: 11,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="unconstrainedCommand_Ucmd"
                    name="Unconstrained Controller Demand u(cmd)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actuatorOutput_Uact"
                    name="Actual Saturated Actuator U(act)"
                    stroke="#0d9488"
                    strokeWidth={2.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {inputs.deadTime_theta_s > 0 && (
                    <Line
                      type="monotone"
                      dataKey="delayedActuator_Udel"
                      name={`Delayed Process Input U(t − θ)`}
                      stroke="#f59e0b"
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: Control Error e(t) & PID Action Breakdown */}
        {activeTab === 'error' && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Displays feedback tracking error <MathInline latex="e(t) = r(t) - Y(t)" /> and individual
                Proportional (<MathInline latex="P" />
                ), Integral (<MathInline latex="I" />
                ), and Filtered Derivative (<MathInline latex="D" />) contributions.
              </p>
              <span className="font-mono text-xs font-semibold text-slate-700">
                IAE = {metrics.iae.toFixed(1)} %·s · ITAE = {metrics.itae.toFixed(0)} %·s²
              </span>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeries}
                  margin={{ top: 10, right: 24, left: 8, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time_s"
                    type="number"
                    domain={[0, inputs.simulationDuration_s]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Time t (s)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    domain={['auto', 'auto']}
                    label={{
                      value: 'Error e(t) & Controller Terms (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: 12, fill: '#334155' },
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val).toFixed(2)} %`,
                      String(name),
                    ]}
                    labelFormatter={(label) => `t = ${Number(label).toFixed(2)} s`}
                  />
                  <Legend verticalAlign="top" height={32} />

                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />

                  <Line
                    type="monotone"
                    dataKey="error_e"
                    name="Tracking Error e(t) = r(t) − Y(t)"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="proportionalTerm_P"
                    name="Proportional Term K_c·e(t)"
                    stroke="#0284c7"
                    strokeWidth={1.8}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {(inputs.controllerMode === 'PI' ||
                    inputs.controllerMode === 'PID') && (
                    <Line
                      type="monotone"
                      dataKey="integralTerm_I"
                      name="Integral Term (K_c/τ_I)∫e dt"
                      stroke="#0d9488"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {inputs.controllerMode === 'PID' && (
                    <Line
                      type="monotone"
                      dataKey="derivativeTerm_D"
                      name="Filtered Derivative Term −K_c·D_f(t)"
                      stroke="#f59e0b"
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 4: P vs. PI vs. PID Controller Mode Comparison */}
        {activeTab === 'comparison' && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Directly compares <strong>P</strong>, <strong>PI</strong>, and{' '}
                <strong>PID</strong> controllers on the current FOPDT plant (
                <MathInline
                  latex={`K_p = ${inputs.processGain_Kp.toFixed(2)}, \\; \\tau = ${inputs.timeConstant_tau_s.toFixed(1)}\\,\\mathrm{s}, \\; \\theta = ${inputs.deadTime_theta_s.toFixed(1)}\\,\\mathrm{s}`}
                />
                ) under identical setpoint and disturbance inputs.
              </p>
              <div className="flex flex-wrap gap-3 font-mono text-xs text-slate-700">
                <span>
                  P Offset:{' '}
                  <strong>{formatSignedZero(modeComparison.pMetrics.steadyStateError_ess, 2)}%</strong>
                </span>
                <span>
                  PI IAE: <strong>{modeComparison.piMetrics.iae.toFixed(1)}</strong>
                </span>
                <span>
                  PID IAE: <strong>{modeComparison.pidMetrics.iae.toFixed(1)}</strong>
                </span>
              </div>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={modeComparison.series}
                  margin={{ top: 10, right: 24, left: 8, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time_s"
                    type="number"
                    domain={[0, inputs.simulationDuration_s]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Time t (s)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    domain={['auto', 'auto']}
                    label={{
                      value: 'Process Output Y(t) (% PV)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: 12, fill: '#334155' },
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val).toFixed(2)} % PV`,
                      String(name),
                    ]}
                    labelFormatter={(label) => `t = ${Number(label).toFixed(2)} s`}
                  />
                  <Legend verticalAlign="top" height={32} />

                  <Line
                    type="stepAfter"
                    dataKey="setpoint_r"
                    name="Setpoint r(t)"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pControl_Y"
                    name="P Controller (Proportional Only)"
                    stroke="#0284c7"
                    strokeWidth={2.2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="piControl_Y"
                    name="PI Controller (Proportional-Integral)"
                    stroke="#f59e0b"
                    strokeWidth={2.2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pidControl_Y"
                    name="PID Controller (Filtered Derivative)"
                    stroke="#0d9488"
                    strokeWidth={2.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 5: Parameter Sensitivity Explorer */}
        {activeTab === 'sensitivity' && (
          <div>
            <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-600">
                Explore how halving (<MathInline latex="0.5\times" />) or doubling (
                <MathInline latex="2.0\times" />) a process or tuning parameter alters closed-loop
                damping, speed, and stability.
              </p>

              <div className="flex flex-wrap gap-1.5">
                {sensitivityOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onSelectSensitivityParameter(opt.key)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                      sensitivityParameter === opt.key
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label} (<MathInline latex={opt.latex} />)
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sensitivitySweep.series}
                  margin={{ top: 10, right: 24, left: 8, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time_s"
                    type="number"
                    domain={[0, inputs.simulationDuration_s]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Time t (s)',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 12,
                      fill: '#334155',
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    domain={['auto', 'auto']}
                    label={{
                      value: 'Process Output Y(t) (% PV)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: 12, fill: '#334155' },
                    }}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      `${Number(val).toFixed(2)} % PV`,
                      String(name),
                    ]}
                    labelFormatter={(label) => `t = ${Number(label).toFixed(2)} s`}
                  />
                  <Legend verticalAlign="top" height={32} />

                  <Line
                    type="stepAfter"
                    dataKey="setpoint_r"
                    name="Setpoint r(t)"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lowCase_Y"
                    name={sensitivitySweep.lowLabel}
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="nominalCase_Y"
                    name={sensitivitySweep.nominalLabel}
                    stroke="#0d9488"
                    strokeWidth={2.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="highCase_Y"
                    name={sensitivitySweep.highLabel}
                    stroke="#e11d48"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Saved Scenarios Comparison Table */}
      {savedScenarios.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
                Saved Tuning &amp; Process Comparison Table
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Compare Saved Controller Scenarios ({savedScenarios.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onClearScenarios}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Saved Runs
            </button>
          </div>

          <div
            className="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-teal-700"
            role="region"
            aria-label="Process Control Scenario Comparison Table"
            tabIndex={0}
          >
            <table className="w-full min-w-[780px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Scenario</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Mode</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    Plant (<MathInline latex="K_p, \tau, \theta" />)
                  </th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    Tuning (<MathInline latex="K_c, \tau_I, \tau_D" />)
                  </th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Overshoot</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Settling (2%)</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    Offset <MathInline latex="e_{\mathrm{ss}}" />
                  </th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">IAE</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {savedScenarios.map((sc) => {
                  const m = sc.results.metrics;
                  const inp = sc.inputs;
                  return (
                    <tr key={sc.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                        {sc.label}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-teal-800 whitespace-nowrap">
                        {inp.controllerMode}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        {inp.processGain_Kp.toFixed(2)} / {inp.timeConstant_tau_s.toFixed(0)}s /{' '}
                        {inp.deadTime_theta_s.toFixed(1)}s
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        {inp.controllerMode === 'open-loop'
                          ? `Δu = ${inp.openLoopStep_du.toFixed(1)}%`
                          : `${inp.controllerGain_Kc.toFixed(2)} / ${
                              inp.controllerMode === 'P'
                                ? '—'
                                : `${inp.integralTime_Ti_s.toFixed(1)}s`
                            } / ${
                              inp.controllerMode === 'PID'
                                ? `${inp.derivativeTime_Td_s.toFixed(1)}s`
                                : '—'
                            }`}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        {m.overshootPercent !== null
                          ? `${m.overshootPercent.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        {m.settlingTime_2pct_s !== null
                          ? `${m.settlingTime_2pct_s.toFixed(1)} s`
                          : 'Unsettled'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        {formatSignedZero(m.steadyStateError_ess, 2)}%
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">
                        {m.iae.toFixed(1)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onLoadScenario(sc)}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveScenario(sc.id)}
                            aria-label={`Remove ${sc.label}`}
                            className="rounded border border-slate-200 bg-white p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
