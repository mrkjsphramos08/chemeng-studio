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
  Cell,
} from 'recharts';
import {
  ReactionEngineeringInputs,
  ReactionEngineeringResults,
  ReactorType,
  generateBatchTimeSeries,
  generatePfrVolumeSeries,
  generateResidenceTimeComparisonSeries,
  generateTargetConversionSizingSeries,
} from '@/lib/reaction-engineering';
import { LabChartCard } from '@/components/lab-shared';
import { Info, Plus, RotateCcw, Trash2 } from 'lucide-react';

export interface SavedReactionScenario {
  id: string;
  label: string;
  inputs: ReactionEngineeringInputs;
  reactorType: ReactorType;
  characteristicTime_s: number;
  conversion_pct: number;
  outletConcentration_mol_m3: number;
  reactionRate_mol_m3_s: number;
  requiredVolumeCSTR_m3: number | null;
  requiredVolumePFR_m3: number | null;
}

interface ReactionChartsProps {
  inputs: ReactionEngineeringInputs;
  results: ReactionEngineeringResults;
  savedScenarios: SavedReactionScenario[];
  onSaveCurrentScenario: (customLabel?: string) => void;
  onRemoveScenario: (id: string) => void;
  onLoadScenario: (inputs: ReactionEngineeringInputs) => void;
  onClearScenarios: () => void;
}

export function ReactionEngineeringCharts({
  inputs,
  results,
  savedScenarios,
  onSaveCurrentScenario,
  onRemoveScenario,
  onLoadScenario,
  onClearScenarios,
}: ReactionChartsProps) {
  const [customScenarioLabel, setCustomScenarioLabel] = useState('');

  const batchTimeSeries = useMemo(
    () => generateBatchTimeSeries(inputs, 41),
    [inputs]
  );

  const residenceTimeSeries = useMemo(
    () => generateResidenceTimeComparisonSeries(inputs, 41),
    [inputs]
  );

  const pfrVolumeSeries = useMemo(
    () => generatePfrVolumeSeries(inputs, 41),
    [inputs]
  );

  const targetSizingSeries = useMemo(
    () => generateTargetConversionSizingSeries(inputs),
    [inputs]
  );

  const reactorComparisonBars = useMemo(() => {
    if (!results.isValid) return [];
    const eqTime = results.equivalentCharacteristicTime_s;
    return [
      {
        reactor: `Batch (t=${eqTime.toFixed(1)}s)`,
        conversion_pct: Number(results.pfrAtBatchTime.conversion_pct.toFixed(2)),
        concentration_mol_m3: Number(
          results.pfrAtBatchTime.outletConcentration_mol_m3.toFixed(2)
        ),
        isSelected: inputs.reactorType === 'batch',
      },
      {
        reactor: `CSTR (τ=${eqTime.toFixed(1)}s)`,
        conversion_pct: Number(results.cstrAtBatchTime.conversion_pct.toFixed(2)),
        concentration_mol_m3: Number(
          results.cstrAtBatchTime.outletConcentration_mol_m3.toFixed(2)
        ),
        isSelected: inputs.reactorType === 'cstr',
      },
      {
        reactor: `PFR (τ=${eqTime.toFixed(1)}s)`,
        conversion_pct: Number(results.pfrAtBatchTime.conversion_pct.toFixed(2)),
        concentration_mol_m3: Number(
          results.pfrAtBatchTime.outletConcentration_mol_m3.toFixed(2)
        ),
        isSelected: inputs.reactorType === 'pfr',
      },
    ];
  }, [inputs.reactorType, results]);

  const savedComparisonBarData = useMemo(() => {
    const rows = savedScenarios.map((s) => ({
      name: s.label,
      conversion_pct: Number(s.conversion_pct.toFixed(2)),
      isLive: false,
    }));
    if (results.isValid) {
      rows.push({
        name: 'Current Live Run',
        conversion_pct: Number(results.activeReactor.conversion_pct.toFixed(2)),
        isLive: true,
      });
    }
    return rows;
  }, [savedScenarios, results]);

  if (!results.isValid) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          Resolve kinetic or operating validation errors above to render reactor conversion curves and sizing charts.
        </p>
      </div>
    );
  }

  const active = results.activeReactor;
  const maxBatchTime =
    batchTimeSeries.length > 0 ? batchTimeSeries[batchTimeSeries.length - 1].time_s : 100;
  const maxTau =
    residenceTimeSeries.length > 0
      ? residenceTimeSeries[residenceTimeSeries.length - 1].tau_s
      : 100;

  return (
    <div className="space-y-6">
      {/* BATCH-SPECIFIC CHARTS (1 & 2) */}
      {inputs.reactorType === 'batch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Chart 1: Batch CA(t) vs Time */}
          <LabChartCard
            className="lg:col-span-6"
            title="Batch Reactor: Reactant Concentration CA(t) vs. Time"
            subtitle="Exponential first-order decay CA(t) = CA0·exp(−k·t) in a closed, isothermal, constant-density vessel."
            rightMeta={`CA(${inputs.batchTime_s.toFixed(1)}s) = ${active.outletConcentration_mol_m3.toFixed(1)} mol/m³`}
            footer={
              <>
                <span>Initial CA0: {inputs.initialConcentration_mol_m3.toFixed(1)} mol/m³</span>
                <span>Rate k: {inputs.rateConstant_per_s.toFixed(4)} s⁻¹</span>
              </>
            }
          >
            <div className="h-[250px] w-full" data-testid="batch-concentration-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={batchTimeSeries}
                  margin={{ top: 12, right: 18, left: 4, bottom: 14 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="time_s"
                    type="number"
                    domain={[0, maxBatchTime]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Reaction Time t (s)',
                      position: 'insideBottom',
                      offset: -8,
                      fontSize: 11,
                      fill: '#475569',
                    }}
                  />
                  <YAxis
                    domain={[0, inputs.initialConcentration_mol_m3]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'CA (mol/m³)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                      fill: '#475569',
                    }}
                  />
                  <Tooltip
                    labelFormatter={(val) => `Reaction Time t = ${Number(val).toFixed(1)} s`}
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(2)} mol/m³`,
                      'Reactant CA(t)',
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
                    dataKey="concentration_mol_m3"
                    name="Concentration CA(t) (mol/m³)"
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  {inputs.batchTime_s <= maxBatchTime && (
                    <ReferenceDot
                      x={Number(inputs.batchTime_s.toFixed(3))}
                      y={Number(active.outletConcentration_mol_m3.toFixed(3))}
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

          {/* Chart 2: Batch Conversion X(t) vs Time */}
          <LabChartCard
            className="lg:col-span-6"
            title="Batch Reactor: Conversion X(t) vs. Time"
            subtitle="First-order batch conversion X(t) = 1 − exp(−k·t) rises steeply early and approaches 100% asymptotically."
            rightMeta={`X(${inputs.batchTime_s.toFixed(1)}s) = ${active.conversion_pct.toFixed(2)}%`}
            footer={
              <>
                <span>
                  Target t_req ({inputs.targetConversion_pct}%):{' '}
                  {results.targetDesign.isTargetAchievable &&
                  results.targetDesign.requiredBatchTime_s !== null
                    ? `${results.targetDesign.requiredBatchTime_s.toFixed(1)} s`
                    : 'Unbounded'}
                </span>
                <span>Excludes turnaround time</span>
              </>
            }
          >
            <div className="h-[250px] w-full" data-testid="batch-conversion-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={batchTimeSeries}
                  margin={{ top: 12, right: 18, left: 4, bottom: 14 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="time_s"
                    type="number"
                    domain={[0, maxBatchTime]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Reaction Time t (s)',
                      position: 'insideBottom',
                      offset: -8,
                      fontSize: 11,
                      fill: '#475569',
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <Tooltip
                    labelFormatter={(val) => `Reaction Time t = ${Number(val).toFixed(1)} s`}
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(2)} %`,
                      'Batch Conversion X(t)',
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
                    dataKey="conversion_pct"
                    name="Batch Conversion X(t) (%)"
                    stroke="#0D9488"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  {inputs.batchTime_s <= maxBatchTime && (
                    <ReferenceDot
                      x={Number(inputs.batchTime_s.toFixed(3))}
                      y={Number(active.conversion_pct.toFixed(3))}
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
        </div>
      )}

      {/* CONTINUOUS COMPARISON & SPATIAL PROFILE ROW (Charts 3 & 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Chart 3: Continuous Reactors — Conversion X vs Residence Time tau (CSTR vs PFR) */}
        <LabChartCard
          className="lg:col-span-6"
          title="Continuous Reactors: Conversion X vs. Residence Time τ"
          subtitle="Compares Ideal PFR (X = 1 − exp(−k·τ)) against Ideal CSTR (X = k·τ / (1 + k·τ)) across space time τ = V/q."
          rightMeta={
            results.residenceTime_s !== null
              ? `τ = ${results.residenceTime_s.toFixed(1)} s`
              : `t_eq = ${results.equivalentCharacteristicTime_s.toFixed(1)} s`
          }
          footer={
            <>
              <span>PFR(τ): {results.pfrAtBatchTime.conversion_pct.toFixed(2)}%</span>
              <span>CSTR(τ): {results.cstrAtBatchTime.conversion_pct.toFixed(2)}%</span>
            </>
          }
        >
          <div className="h-[255px] w-full" data-testid="residence-time-comparison-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={residenceTimeSeries}
                margin={{ top: 12, right: 18, left: 4, bottom: 14 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="tau_s"
                  type="number"
                  domain={[0, maxTau]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Continuous Residence Time τ = V/q (s)',
                    position: 'insideBottom',
                    offset: -8,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  labelFormatter={(val) => `Residence Time τ = ${Number(val).toFixed(1)} s`}
                  formatter={(value, name) => [
                    `${Number(value ?? 0).toFixed(2)} %`,
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="pfrConversion_pct"
                  name="Ideal PFR Conversion (%)"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cstrConversion_pct"
                  name="Ideal CSTR Conversion (%)"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={false}
                />
                {inputs.reactorType !== 'batch' &&
                  results.residenceTime_s !== null &&
                  results.residenceTime_s <= maxTau && (
                    <ReferenceDot
                      x={Number(results.residenceTime_s.toFixed(3))}
                      y={Number(active.conversion_pct.toFixed(3))}
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

        {/* Chart 4: PFR Axial Concentration CA(V) vs Reactor Volume (ONLY for PFR; CSTR has NO axial profile) */}
        {inputs.reactorType === 'pfr' ? (
          <LabChartCard
            className="lg:col-span-6"
            title="Plug Flow Reactor (PFR): Concentration CA(V) vs. Volume"
            subtitle="Spatial depletion profile CA(V) = CA0·exp(−k·V/q) along an Ideal PFR from inlet (V = 0) to outlet."
            rightMeta={`CA,out = ${active.outletConcentration_mol_m3.toFixed(1)} mol/m³`}
            footer={
              <>
                <span>Inlet CA0: {inputs.initialConcentration_mol_m3.toFixed(1)} mol/m³</span>
                <span>Total V: {inputs.reactorVolume_m3.toFixed(2)} m³</span>
              </>
            }
          >
            <div className="h-[255px] w-full" data-testid="pfr-volume-profile-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={pfrVolumeSeries}
                  margin={{ top: 12, right: 18, left: 4, bottom: 14 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="volume_m3"
                    type="number"
                    domain={[0, Math.max(inputs.reactorVolume_m3, 0.01)]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Axial Reactor Volume V (m³)',
                      position: 'insideBottom',
                      offset: -8,
                      fontSize: 11,
                      fill: '#475569',
                    }}
                  />
                  <YAxis
                    domain={[0, inputs.initialConcentration_mol_m3]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'CA (mol/m³)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                      fill: '#475569',
                    }}
                  />
                  <Tooltip
                    labelFormatter={(val) => `Reactor Position V = ${Number(val).toFixed(3)} m³`}
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(2)} mol/m³`,
                      'PFR Concentration CA(V)',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="concentration_mol_m3"
                    name="PFR Concentration CA(V) (mol/m³)"
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <ReferenceDot
                    x={Number(inputs.reactorVolume_m3.toFixed(4))}
                    y={Number(active.outletConcentration_mol_m3.toFixed(3))}
                    r={6}
                    fill="#DC2626"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </LabChartCard>
        ) : inputs.reactorType === 'cstr' ? (
          <div
            className="lg:col-span-6 min-w-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            data-testid="cstr-uniform-mixing-note"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
                <Info className="w-4 h-4 shrink-0" />
                <span>Ideal CSTR Mixing Assumption · No Axial Concentration Profile</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Why Ideal CSTRs Have No Spatial Concentration Profile
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unlike a Plug Flow Reactor where concentration drops continuously along reactor volume{' '}
                <span className="font-mono text-slate-800">CA(V)</span>, an Ideal CSTR assumes{' '}
                <strong className="text-slate-800">instantaneous, complete mixing</strong>. As soon
                as feed <span className="font-mono text-slate-800">CA0</span> enters the tank, it
                drops immediately to the uniform outlet concentration{' '}
                <span className="font-mono font-semibold text-teal-900">
                  CA = {active.outletConcentration_mol_m3.toFixed(2)} mol/m³
                </span>{' '}
                everywhere inside the vessel.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 text-xs font-mono text-slate-800 tabular-nums">
                <div>
                  Uniform Vessel &amp; Outlet CA = {active.outletConcentration_mol_m3.toFixed(2)} mol/m³
                </div>
                <div>
                  Uniform Reaction Rate −rA = {active.reactionRate_mol_m3_s.toFixed(3)} mol/(m³·s)
                </div>
                <div className="text-slate-600">
                  Design Balance: V = q·(CA0 − CA) / (−rA) = {inputs.reactorVolume_m3.toFixed(2)} m³
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
              Switch to <strong className="text-slate-800">Ideal PFR</strong> in Step 1 to inspect the continuous spatial <span className="font-mono">CA(V)</span> profile.
            </div>
          </div>
        ) : (
          /* When Batch is selected, also show CSTR vs PFR Reactor Performance BarChart right alongside Chart 3! */
          <LabChartCard
            className="lg:col-span-6"
            title="Reactor Performance Comparison at Equivalent Time"
            subtitle={`Compares Batch conversion at reaction time t = ${results.equivalentCharacteristicTime_s.toFixed(1)} s against steady CSTR and PFR at residence time τ = ${results.equivalentCharacteristicTime_s.toFixed(1)} s.`}
            rightMeta={`k = ${inputs.rateConstant_per_s.toFixed(4)} s⁻¹`}
            footer={
              <>
                <span>Batch t excludes turnaround</span>
                <span>Continuous τ = V / q</span>
              </>
            }
          >
            <div className="h-[255px] w-full" data-testid="reactor-performance-comparison-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reactorComparisonBars}
                  margin={{ top: 12, right: 16, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="reactor" interval={0} tick={{ fontSize: 10, fill: '#334155' }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(2)} %`,
                      'Conversion X',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="conversion_pct" name="Conversion X (%)" radius={[4, 4, 0, 0]}>
                    {reactorComparisonBars.map((entry, idx) => (
                      <Cell
                        key={`rxn-bar-${idx}`}
                        fill={entry.isSelected ? '#0D9488' : '#334155'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </LabChartCard>
        )}
      </div>

      {/* ROW: PERFORMANCE COMPARISON (for CSTR/PFR) & TARGET CONVERSION SIZING (Chart 5 & Chart 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {inputs.reactorType !== 'batch' && (
          <LabChartCard
            className="lg:col-span-5"
            title="Reactor Performance Comparison (t = τ)"
            subtitle={`Conversion at identical characteristic time (Batch reaction time t = ${results.equivalentCharacteristicTime_s.toFixed(1)} s vs. continuous residence time τ = ${results.equivalentCharacteristicTime_s.toFixed(1)} s).`}
            rightMeta={`Da = ${active.damkohlerNumber.toFixed(2)}`}
            footer={
              <>
                <span>Batch t excludes turnaround</span>
                <span>PFR = Batch at t = τ</span>
              </>
            }
          >
            <div className="h-[255px] w-full" data-testid="reactor-performance-comparison-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reactorComparisonBars}
                  margin={{ top: 12, right: 14, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="reactor" interval={0} tick={{ fontSize: 10, fill: '#334155' }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(2)} %`,
                      'Conversion X',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="conversion_pct" name="Conversion X (%)" radius={[4, 4, 0, 0]}>
                    {reactorComparisonBars.map((entry, idx) => (
                      <Cell
                        key={`rxn-bar-cont-${idx}`}
                        fill={entry.isSelected ? '#0D9488' : '#334155'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </LabChartCard>
        )}

        {/* Chart 6: Required Reactor Volume V_req vs Target Conversion X_target */}
        <LabChartCard
          className={inputs.reactorType === 'batch' ? 'lg:col-span-12' : 'lg:col-span-7'}
          title="Required Reactor Volume V_req vs. Target Conversion (CSTR vs. PFR)"
          subtitle="Demonstrates the steep CSTR sizing penalty V_CSTR = q·X / [k·(1 − X)] vs. PFR V_PFR = −(q/k)·ln(1 − X) as X → 95%."
          rightMeta={
            results.targetDesign.isTargetAchievable &&
            results.targetDesign.cstrToPfrVolumeRatio !== null
              ? `V_CSTR / V_PFR = ${results.targetDesign.cstrToPfrVolumeRatio.toFixed(2)}× at ${inputs.targetConversion_pct}%`
              : 'Target unbounded at X = 100% or k = 0'
          }
          footer={
            <>
              <span>
                V_req,PFR:{' '}
                {results.targetDesign.requiredVolumePFR_m3 !== null
                  ? `${results.targetDesign.requiredVolumePFR_m3.toFixed(2)} m³`
                  : 'Unbounded'}
              </span>
              <span>
                V_req,CSTR:{' '}
                {results.targetDesign.requiredVolumeCSTR_m3 !== null
                  ? `${results.targetDesign.requiredVolumeCSTR_m3.toFixed(2)} m³`
                  : 'Unbounded'}
              </span>
            </>
          }
        >
          {targetSizingSeries.length > 0 ? (
            <div className="h-[255px] w-full" data-testid="required-volume-sizing-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={targetSizingSeries}
                  margin={{ top: 12, right: 18, left: 4, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="targetConversion_pct"
                    type="number"
                    domain={[5, 95]}
                    unit="%"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    label={{
                      value: 'Target Conversion X_target (%) [Plotted up to 95%]',
                      position: 'insideBottom',
                      offset: -10,
                      fontSize: 11,
                      fill: '#475569',
                    }}
                  />
                  <YAxis
                    unit=" m³"
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <Tooltip
                    labelFormatter={(val) => `Target Conversion = ${val}%`}
                    formatter={(value, name) => [
                      `${Number(value ?? 0).toFixed(3)} m³`,
                      String(name),
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
                  <Line
                    type="monotone"
                    dataKey="cstrRequiredVolume_m3"
                    name="Required CSTR Volume (m³)"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pfrRequiredVolume_m3"
                    name="Required PFR Volume (m³)"
                    stroke="#0D9488"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  {results.targetDesign.isTargetAchievable &&
                    inputs.targetConversion_pct >= 5 &&
                    inputs.targetConversion_pct <= 95 &&
                    results.targetDesign.requiredVolumeCSTR_m3 !== null && (
                      <ReferenceDot
                        x={inputs.targetConversion_pct}
                        y={Number(results.targetDesign.requiredVolumeCSTR_m3.toFixed(4))}
                        r={5}
                        fill="#DC2626"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    )}
                  {results.targetDesign.isTargetAchievable &&
                    inputs.targetConversion_pct >= 5 &&
                    inputs.targetConversion_pct <= 95 &&
                    results.targetDesign.requiredVolumePFR_m3 !== null && (
                      <ReferenceDot
                        x={inputs.targetConversion_pct}
                        y={Number(results.targetDesign.requiredVolumePFR_m3.toFixed(4))}
                        r={5}
                        fill="#0D9488"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
              Required reactor volume diverges when rate constant k = 0 s⁻¹ or flow rate q = 0 m³/s. Set k &gt; 0 and q &gt; 0 to plot continuous sizing curves.
            </div>
          )}
        </LabChartCard>
      </div>

      {/* OPERATING SCENARIO COMPARISON TABLE & CHART */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-5"
        data-testid="reaction-scenario-comparison"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Operating Scenario Comparison Table &amp; Chart
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Snapshot Batch, CSTR, and PFR operating runs to compare conversion, outlet concentration, reaction rate, and target reactor sizing side by side.
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
          {/* Bar Chart */}
          <div className="lg:col-span-4 min-w-0 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={savedComparisonBarData}
                margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toFixed(2)} %`,
                    'Conversion X',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="conversion_pct" name="Conversion X (%)" radius={[4, 4, 0, 0]}>
                  {savedComparisonBarData.map((entry, index) => (
                    <Cell
                      key={`rxn-saved-cell-${index}`}
                      fill={entry.isLive ? '#0D9488' : '#334155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison Table */}
          <div className="lg:col-span-8 min-w-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2 pr-3">Scenario</th>
                  <th className="py-2 px-2">Reactor</th>
                  <th className="py-2 px-2 text-right">k (s⁻¹)</th>
                  <th className="py-2 px-2 text-right">t or τ (s)</th>
                  <th className="py-2 px-2 text-right">X (%)</th>
                  <th className="py-2 px-2 text-right">CA (mol/m³)</th>
                  <th className="py-2 px-2 text-right">V_CSTR / V_PFR</th>
                  <th className="py-2 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {savedScenarios.map((scenario) => (
                  <tr key={scenario.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-3 font-sans font-medium text-slate-900">
                      {scenario.label}
                    </td>
                    <td className="py-2.5 px-2 font-sans font-semibold text-slate-700 uppercase">
                      {scenario.reactorType}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700">
                      {scenario.inputs.rateConstant_per_s.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700">
                      {scenario.characteristicTime_s.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-900">
                      {scenario.conversion_pct.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700">
                      {scenario.outletConcentration_mol_m3.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-700">
                      {scenario.requiredVolumeCSTR_m3 !== null &&
                      scenario.requiredVolumePFR_m3 !== null
                        ? `${scenario.requiredVolumeCSTR_m3.toFixed(2)} / ${scenario.requiredVolumePFR_m3.toFixed(2)}`
                        : '—'}
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

                {/* Live Row */}
                <tr className="bg-teal-50/60 font-semibold text-teal-950">
                  <td className="py-2.5 pr-3 font-sans font-semibold text-teal-900">
                    Current Live Run
                  </td>
                  <td className="py-2.5 px-2 font-sans uppercase">{inputs.reactorType}</td>
                  <td className="py-2.5 px-2 text-right">
                    {inputs.rateConstant_per_s.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {active.characteristicTime_s.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-teal-800">
                    {active.conversion_pct.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {active.outletConcentration_mol_m3.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {results.targetDesign.requiredVolumeCSTR_m3 !== null &&
                    results.targetDesign.requiredVolumePFR_m3 !== null
                      ? `${results.targetDesign.requiredVolumeCSTR_m3.toFixed(2)} / ${results.targetDesign.requiredVolumePFR_m3.toFixed(2)}`
                      : 'Unbounded'}
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
