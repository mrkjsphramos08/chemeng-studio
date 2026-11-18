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
  DistillationInputs,
  DistillationResults,
  equilibriumVaporY,
  generateProductFlowsVsFeedSeries,
  generateRefluxVsStagesSeries,
  generateRelativeVolatilityComparisonSeries,
} from '@/lib/distillation';
import { LabChartCard, MathInline } from '@/components/lab-shared';
import { truncateScenarioTickLabel } from '@/lib/navigation';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';

export interface SavedDistillationScenario {
  id: string;
  label: string;
  inputs: DistillationInputs;
  distillateFlow_kmol_h: number;
  bottomsFlow_kmol_h: number;
  minimumReflux_Rmin: number | null;
  totalTheoreticalStages: number | null;
  fractionalTheoreticalStages: number | null;
  feedStageNumber: number | null;
  feasibilityLabel: string;
}

interface DistillationChartsProps {
  inputs: DistillationInputs;
  results: DistillationResults;
  savedScenarios: SavedDistillationScenario[];
  onSaveCurrentScenario: (customLabel?: string) => void;
  onRemoveScenario: (id: string) => void;
  onLoadScenario: (inputs: DistillationInputs) => void;
  onClearScenarios: () => void;
}

export function DistillationCharts({
  inputs,
  results,
  savedScenarios,
  onSaveCurrentScenario,
  onRemoveScenario,
  onLoadScenario,
  onClearScenarios,
}: DistillationChartsProps) {
  const [customScenarioLabel, setCustomScenarioLabel] = useState('');
  // null means "Show All Stages"; a positive number (1..N) steps up to that stage
  const [visibleStageLimit, setVisibleStageLimit] = useState<number | null>(null);
  const [inspectedStageNumber, setInspectedStageNumber] = useState<number | null>(null);

  const stages = results.stageCalculation.stages;
  const totalStages = stages.length;

  // Clamp stage limit and inspected stage when totalStages changes
  const activeStageLimit =
    visibleStageLimit === null
      ? totalStages
      : Math.max(1, Math.min(totalStages, visibleStageLimit));

  const effectiveInspectedStageNum =
    inspectedStageNumber !== null && inspectedStageNumber <= totalStages
      ? inspectedStageNumber
      : visibleStageLimit !== null && visibleStageLimit <= totalStages
      ? visibleStageLimit
      : results.stageCalculation.feedStageNumber ?? (totalStages > 0 ? 1 : null);

  const inspectedStage =
    effectiveInspectedStageNum !== null
      ? stages.find((s) => s.stageNumber === effectiveInspectedStageNum) ?? null
      : null;

  const volatilitySeries = useMemo(
    () => generateRelativeVolatilityComparisonSeries(inputs.relativeVolatility_alpha, 51),
    [inputs.relativeVolatility_alpha]
  );

  const refluxVsStagesSeries = useMemo(
    () => generateRefluxVsStagesSeries(inputs, 26),
    [inputs]
  );

  const productFlowSeries = useMemo(
    () => generateProductFlowsVsFeedSeries(inputs, 25),
    [inputs]
  );

  const scenarioComparisonBars = useMemo(() => {
    const rows = savedScenarios
      .filter((s) => s.fractionalTheoreticalStages !== null)
      .map((s) => ({
        name: s.label,
        shortName: truncateScenarioTickLabel(s.label, 16),
        fullName: s.label,
        fractionalStages: Number((s.fractionalTheoreticalStages ?? 0).toFixed(2)),
        refluxRatio: Number(s.inputs.refluxRatio_R.toFixed(2)),
        isLive: false,
      }));
    if (
      results.isValid &&
      results.stageCalculation.converged &&
      results.stageCalculation.fractionalTheoreticalStages !== null
    ) {
      rows.push({
        name: 'Current Live Run',
        shortName: 'Current Live',
        fullName: 'Current Live Run',
        fractionalStages: Number(
          results.stageCalculation.fractionalTheoreticalStages.toFixed(2)
        ),
        refluxRatio: Number(inputs.refluxRatio_R.toFixed(2)),
        isLive: true,
      });
    }
    return rows;
  }, [savedScenarios, results, inputs.refluxRatio_R]);

  if (!results.isValid) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-slate-700">
          Resolve composition or operating parameter validation errors above to render the
          McCabe–Thiele diagram and engineering charts.
        </p>
      </div>
    );
  }

  // Coordinate mapping for the precision SVG McCabe-Thiele diagram:
  // Plot box inside viewBox="0 0 680 560":
  // Plot area: left=74, right=634 (width=560), top=28, bottom=498 (height=470)
  const plotLeft = 74;
  const plotTop = 28;
  const plotWidth = 540;
  const plotHeight = 460;
  const toSvgX = (xVal: number) => plotLeft + Math.max(0, Math.min(1, xVal)) * plotWidth;
  const toSvgY = (yVal: number) => plotTop + (1 - Math.max(0, Math.min(1, yVal))) * plotHeight;

  // Build smooth VLE SVG path (100 segments)
  const vlePathPoints: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    const y = equilibriumVaporY(x, inputs.relativeVolatility_alpha);
    vlePathPoints.push(`${i === 0 ? 'M' : 'L'} ${toSvgX(x).toFixed(2)} ${toSvgY(y).toFixed(2)}`);
  }
  const vleSvgPath = vlePathPoints.join(' ');

  const {
    intersection_x,
    intersection_y,
    qLineIsVertical,
    qLineIsHorizontal,
    qLineSlope,
    qLineIntercept,
  } = results.operatingLines;

  const xB = inputs.bottomsComposition_xB;
  const zF = inputs.feedComposition_zF;
  const xD = inputs.distillateComposition_xD;

  // Compute q-line segment endpoints from (zF, zF) through intersection & pinch
  let qEndX = intersection_x;
  let qEndY = intersection_y;
  const pinchX = results.minimumReflux.pinch_x;
  const pinchY = results.minimumReflux.pinch_y;

  if (qLineIsVertical) {
    qEndX = zF;
    qEndY = Math.max(intersection_y, pinchY ?? zF);
  } else if (qLineIsHorizontal) {
    qEndX = Math.min(intersection_x, pinchX ?? zF);
    qEndY = zF;
  } else if (qLineSlope !== null && qLineIntercept !== null) {
    qEndX = Math.max(0, Math.min(intersection_x, pinchX ?? zF));
    qEndY = Math.max(0, Math.min(1, qLineSlope * qEndX + qLineIntercept));
  }

  // Filter staircase segments up to activeStageLimit
  const visibleStaircasePoints = results.stageCalculation.staircasePath.filter(
    (pt) => pt.stageNumber <= activeStageLimit
  );
  const staircaseSvgPath = visibleStaircasePoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(pt.x).toFixed(2)} ${toSvgY(pt.y).toFixed(2)}`)
    .join(' ');

  const visibleStages = stages.slice(0, activeStageLimit);
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="space-y-6">
      {/* ==================== CENTERPIECE: INTERACTIVE McCABE-THIELE DIAGRAM ==================== */}
      <div
        className="bg-white border-2 border-teal-700/80 rounded-xl p-6 space-y-4 shadow-xs"
        data-testid="mccabe-thiele-diagram-card"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-teal-800">
              Centerpiece Graphical Analysis · Binary Vapor–Liquid Equilibrium &amp; Stage Stepping
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Interactive McCabe–Thiele <MathInline latex="x\text{–}y" /> Diagram (Component A Mole
              Fraction)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Equilibrium curve <MathInline latex="y^*(x)" />, rectifying &amp; stripping operating
              lines, feed <MathInline latex="q" />-line, and stage-by-stage equilibrium staircase.
              Click any stage badge or use the stepper below.
            </p>
          </div>

          {/* Interactive Step-Through-Stages Controls */}
          {results.stageCalculation.converged && totalStages > 0 && (
            <div
              className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg self-start lg:self-auto"
              role="group"
              aria-label="Step through McCabe-Thiele equilibrium stages"
              data-testid="stage-stepper-controls"
            >
              <button
                type="button"
                data-testid="stage-step-1-btn"
                onClick={() => {
                  setVisibleStageLimit(1);
                  setInspectedStageNumber(1);
                }}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                  visibleStageLimit === 1
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Stage 1
              </button>

              {/* Indivisible Prev / Counter / Next sub-group so buttons never split across rows on mobile */}
              <div className="inline-flex items-center gap-1 shrink-0 bg-white/70 rounded-md px-0.5">
                <button
                  type="button"
                  data-testid="stage-step-prev-btn"
                  onClick={() => {
                    const next = Math.max(1, activeStageLimit - 1);
                    setVisibleStageLimit(next);
                    setInspectedStageNumber(next);
                  }}
                  disabled={activeStageLimit <= 1}
                  aria-label="Previous equilibrium stage"
                  className="inline-flex items-center gap-0.5 px-2 py-1.5 text-xs font-semibold bg-white text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <span className="px-2 py-1 text-xs font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                  {visibleStageLimit === null
                    ? `All ${totalStages}`
                    : `${activeStageLimit} / ${totalStages}`}
                </span>
                <button
                  type="button"
                  data-testid="stage-step-next-btn"
                  onClick={() => {
                    const next = Math.min(totalStages, activeStageLimit + 1);
                    setVisibleStageLimit(next);
                    setInspectedStageNumber(next);
                  }}
                  disabled={activeStageLimit >= totalStages && visibleStageLimit !== null}
                  aria-label="Next equilibrium stage"
                  className="inline-flex items-center gap-0.5 px-2 py-1.5 text-xs font-semibold bg-white text-slate-800 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                data-testid="stage-step-all-btn"
                onClick={() => {
                  setVisibleStageLimit(null);
                  setInspectedStageNumber(null);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                  visibleStageLimit === null
                    ? 'bg-teal-800 text-white'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Show All ({totalStages})
              </button>
            </div>
          )}
        </div>

        {/* Pinched / Infeasible Warning Callout inside Diagram Card when R <= Rmin */}
        {!results.stageCalculation.converged && (
          <div
            className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-start gap-3 text-xs text-amber-950"
            data-testid="mccabe-thiele-pinch-banner"
          >
            <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                Staircase Suppressed — {results.feasibilityLabel}
              </div>
              <p className="mt-0.5 leading-relaxed">{results.stageCalculation.terminationReason}</p>
            </div>
          </div>
        )}

        {/* Precision Interactive SVG McCabe-Thiele x-y Plot */}
        <div className="w-full" data-testid="mccabe-thiele-svg-container">
          <svg
            viewBox="0 0 680 545"
            className="w-full h-auto"
            role="img"
            aria-label="McCabe-Thiele x-y equilibrium diagram showing VLE curve, y=x diagonal, rectifying operating line, stripping operating line, feed q-line, and equilibrium stages"
          >
            {/* Plot Background */}
            <rect
              x={plotLeft}
              y={plotTop}
              width={plotWidth}
              height={plotHeight}
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />

            {/* Coordinate Grid Lines & Axis Ticks (0.0 to 1.0) */}
            {ticks.map((t) => {
              const gx = toSvgX(t);
              const gy = toSvgY(t);
              return (
                <g key={t}>
                  <line
                    x1={gx}
                    y1={plotTop}
                    x2={gx}
                    y2={plotTop + plotHeight}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <line
                    x1={plotLeft}
                    y1={gy}
                    x2={plotLeft + plotWidth}
                    y2={gy}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  {/* X-axis tick label */}
                  <text
                    x={gx}
                    y={plotTop + plotHeight + 18}
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-slate-700"
                  >
                    {t.toFixed(1)}
                  </text>
                  {/* Y-axis tick label */}
                  <text
                    x={plotLeft - 10}
                    y={gy + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono fill-slate-700"
                  >
                    {t.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Axis Titles */}
            <text
              x={plotLeft + plotWidth / 2}
              y={plotTop + plotHeight + 42}
              textAnchor="middle"
              className="text-xs font-semibold fill-slate-800"
            >
              Liquid Mole Fraction of More Volatile Component A, x (mol/mol)
            </text>
            <text
              x={22}
              y={plotTop + plotHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 22, ${plotTop + plotHeight / 2})`}
              className="text-xs font-semibold fill-slate-800"
            >
              Vapor Mole Fraction of Component A, y (mol/mol)
            </text>

            {/* 1. Diagonal y = x Reference Line */}
            <line
              x1={toSvgX(0)}
              y1={toSvgY(0)}
              x2={toSvgX(1)}
              y2={toSvgY(1)}
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />

            {/* Vertical Drop Lines for xB, zF, and xD to X-axis */}
            <line
              x1={toSvgX(xB)}
              y1={toSvgY(xB)}
              x2={toSvgX(xB)}
              y2={toSvgY(0)}
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <text
              x={toSvgX(xB) + 4}
              y={toSvgY(0.02)}
              className="text-[10px] font-mono font-bold fill-slate-700"
            >
              xB={xB.toFixed(2)}
            </text>

            <line
              x1={toSvgX(zF)}
              y1={toSvgY(zF)}
              x2={toSvgX(zF)}
              y2={toSvgY(0)}
              stroke="#0284C7"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <text
              x={toSvgX(zF) + 4}
              y={toSvgY(0.02)}
              className="text-[10px] font-mono font-bold fill-sky-800"
            >
              zF={zF.toFixed(2)}
            </text>

            <line
              x1={toSvgX(xD)}
              y1={toSvgY(xD)}
              x2={toSvgX(xD)}
              y2={toSvgY(0)}
              stroke="#0F766E"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            <text
              x={toSvgX(xD) - 4}
              y={toSvgY(0.02)}
              textAnchor="end"
              className="text-[10px] font-mono font-bold fill-teal-900"
            >
              xD={xD.toFixed(2)}
            </text>

            {/* 2. Feed q-Line Segment */}
            <line
              x1={toSvgX(zF)}
              y1={toSvgY(zF)}
              x2={toSvgX(qEndX)}
              y2={toSvgY(qEndY)}
              stroke="#7C3AED"
              strokeWidth="2.2"
              strokeDasharray="6 3"
            />

            {/* 3. Rectifying Operating Line (ROL) from (intersection_x, intersection_y) to (xD, xD) */}
            {intersection_x >= 0 && intersection_x <= 1 && (
              <line
                x1={toSvgX(intersection_x)}
                y1={toSvgY(intersection_y)}
                x2={toSvgX(xD)}
                y2={toSvgY(xD)}
                stroke="#0284C7"
                strokeWidth="2.5"
              />
            )}

            {/* 4. Stripping Operating Line (SOL) from (xB, xB) to (intersection_x, intersection_y) */}
            {intersection_x > xB && intersection_x <= 1 && (
              <line
                x1={toSvgX(xB)}
                y1={toSvgY(xB)}
                x2={toSvgX(intersection_x)}
                y2={toSvgY(intersection_y)}
                stroke="#D97706"
                strokeWidth="2.5"
              />
            )}

            {/* 5. Vapor-Liquid Equilibrium Curve y*(x) */}
            <path
              d={vleSvgPath}
              fill="none"
              stroke="#0F766E"
              strokeWidth="3"
            />

            {/* 6. McCabe-Thiele Equilibrium Staircase Path */}
            {results.stageCalculation.converged && staircaseSvgPath && (
              <path
                d={staircaseSvgPath}
                fill="none"
                stroke="#0F172A"
                strokeWidth="2"
              />
            )}

            {/* 7. Minimum-Reflux Pinch Point Marker on VLE Curve */}
            {pinchX !== null && pinchY !== null && (
              <g>
                <circle
                  cx={toSvgX(pinchX)}
                  cy={toSvgY(pinchY)}
                  r="4.5"
                  fill="#F43F5E"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* 8. Operating-Line Feed Intersection Point (x_int, y_int) */}
            {intersection_x >= 0 &&
              intersection_x <= 1 &&
              intersection_y >= 0 &&
              intersection_y <= 1 && (
                <circle
                  cx={toSvgX(intersection_x)}
                  cy={toSvgY(intersection_y)}
                  r="5"
                  fill="#7C3AED"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              )}

            {/* Composition Anchor Dots on Diagonal (xB, zF, xD) */}
            <circle
              cx={toSvgX(xB)}
              cy={toSvgY(xB)}
              r="4.5"
              fill="#334155"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle
              cx={toSvgX(zF)}
              cy={toSvgY(zF)}
              r="4.5"
              fill="#7C3AED"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle
              cx={toSvgX(xD)}
              cy={toSvgY(xD)}
              r="4.5"
              fill="#0F766E"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />

            {/* 9. Equilibrium Stage Number Badges along VLE Curve */}
            {visibleStages.map((st) => {
              const cx = toSvgX(st.x_eq);
              const cy = toSvgY(st.y_in);
              const isFeed = st.section === 'feed';
              const isSelected = st.stageNumber === effectiveInspectedStageNum;
              // If totalStages > 18, label every 2nd stage plus stage 1, feed stage, and final stage
              const showNumberBadge =
                totalStages <= 18 ||
                st.stageNumber === 1 ||
                st.stageNumber === totalStages ||
                isFeed ||
                isSelected ||
                st.stageNumber % 2 === 0;

              return (
                <g
                  key={st.stageNumber}
                  onClick={() => setInspectedStageNumber(st.stageNumber)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6.5 : isFeed ? 5.5 : 4}
                    fill={isSelected ? '#0F172A' : isFeed ? '#0F766E' : '#FFFFFF'}
                    stroke={isSelected ? '#14B8A6' : isFeed ? '#0F172A' : '#0F172A'}
                    strokeWidth="2"
                  />
                  {showNumberBadge && (
                    <g transform={`translate(${cx - 10}, ${cy - 12})`}>
                      <rect
                        x="-9"
                        y="-9"
                        width="18"
                        height="14"
                        rx="3"
                        fill={isSelected ? '#0F172A' : isFeed ? '#0F766E' : '#FFFFFF'}
                        stroke={isFeed ? '#0F766E' : '#CBD5E1'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        className={`text-[9px] font-mono font-bold ${
                          isSelected || isFeed ? 'fill-white' : 'fill-slate-900'
                        }`}
                      >
                        {st.stageNumber}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Diagram Legend & Interactive Stage Readout Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-100">
          {/* Legend */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-700">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-4 h-0.5 bg-teal-700 inline-block" />
              VLE Curve (<MathInline latex="\alpha" /> = {inputs.relativeVolatility_alpha.toFixed(2)})
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-4 h-0.5 bg-sky-600 inline-block" />
              Rectifying Line (<MathInline latex="L/V" /> = {results.operatingLines.rectifyingSlope.toFixed(3)})
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-4 h-0.5 bg-amber-600 inline-block" />
              Stripping Line (<MathInline latex="\bar{L}/\bar{V}" /> = {results.operatingLines.strippingSlope.toFixed(3)})
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-4 h-0.5 bg-violet-600 inline-block" />
              Feed <MathInline latex="q" />-Line (<MathInline latex="q" /> = {inputs.feedQuality_q.toFixed(2)})
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-4 h-0.5 bg-slate-900 inline-block" />
              Equilibrium Staircase
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Pinch Point (<MathInline latex="R_{\min}" /> ={' '}
              {results.minimumReflux.minimumRefluxRatio_Rmin !== null
                ? results.minimumReflux.minimumRefluxRatio_Rmin.toFixed(3)
                : '—'}
              )
            </span>
          </div>

          {/* Active Stage Inspector Readout */}
          <div
            className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-mono tabular-nums text-slate-800"
            data-testid="mccabe-thiele-stage-inspector"
          >
            {inspectedStage ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between font-sans font-semibold text-slate-900">
                  <span>
                    Stage {inspectedStage.stageNumber} of {totalStages} ·{' '}
                    {inspectedStage.section === 'feed'
                      ? 'Optimal Feed Stage (NF)'
                      : inspectedStage.stageNumber === totalStages
                      ? 'Partial Reboiler (Final Stage)'
                      : inspectedStage.section === 'rectifying'
                      ? 'Rectifying Section'
                      : 'Stripping Section'}
                  </span>
                  <span className="text-teal-800 font-mono">
                    eff = {(inspectedStage.stageEfficiencyFraction * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-700">
                  <MathInline
                    latex={`y_{${inspectedStage.stageNumber}} = ${inspectedStage.y_in.toFixed(3)} \\rightarrow x^*_{${inspectedStage.stageNumber}} = ${inspectedStage.x_eq.toFixed(3)} \\rightarrow y_{${inspectedStage.stageNumber + 1}} = ${inspectedStage.y_next.toFixed(3)}`}
                  />
                </div>
              </div>
            ) : (
              <div className="text-slate-600 font-sans">
                Increase reflux ratio <MathInline latex="R" /> above{' '}
                <MathInline latex="R_{\min}" /> to inspect individual equilibrium stages.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== SECONDARY CHARTS ROW 1: VLE & REFLUX vs STAGES ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Secondary Chart 1: VLE Curves for Different Relative Volatilities */}
        <LabChartCard
          className="lg:col-span-6"
          title="Vapor–Liquid Equilibrium Curves Across Relative Volatilities ($\alpha$)"
          subtitle="Compares $y^*(x) = \frac{\alpha x}{1 + (\alpha - 1)x}$ for close-boiling ($\alpha = 1.5$), moderate ($\alpha = 2.5$), high ($\alpha = 4.0$), and active $\alpha$."
          rightMeta={`Active $\\alpha = ${inputs.relativeVolatility_alpha.toFixed(2)}$`}
          footer={
            <>
              <span>
                <MathInline latex="\alpha \to 1" /> collapses onto <MathInline latex="y = x" />{' '}
                (unseparable)
              </span>
              <span>
                Larger <MathInline latex="\alpha" /> widens VLE driving force
              </span>
            </>
          }
        >
          <div className="h-[260px] w-full" data-testid="vle-volatility-comparison-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={volatilitySeries}
                margin={{ top: 10, right: 16, left: 8, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Liquid Mole Fraction x (mol/mol)',
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  width={52}
                  domain={[0, 1]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Vapor Mole Fraction y*',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 4,
                    style: { textAnchor: 'middle', fontSize: 11, fill: '#475569' },
                  }}
                />
                <Tooltip
                  formatter={(val, name) => [Number(val ?? 0).toFixed(3), String(name ?? '')]}
                  labelFormatter={(label) => `Liquid x = ${Number(label ?? 0).toFixed(2)}`}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
                />
                <Line
                  type="monotone"
                  dataKey="diagonal_y"
                  name="Diagonal y = x (α = 1.0)"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="alpha_1_5"
                  name="α = 1.5 (Close-Boiling)"
                  stroke="#D97706"
                  strokeWidth={1.8}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="alpha_2_5"
                  name="α = 2.5 (Moderate)"
                  stroke="#0284C7"
                  strokeWidth={1.8}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="alpha_4_0"
                  name="α = 4.0 (Easy)"
                  stroke="#64748B"
                  strokeWidth={1.8}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="active_alpha_y"
                  name={`Active (α = ${inputs.relativeVolatility_alpha.toFixed(2)})`}
                  stroke="#0F766E"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>

        {/* Secondary Chart 2: Theoretical Stages vs Reflux Ratio */}
        <LabChartCard
          className="lg:col-span-6"
          title="Theoretical Stages ($N$) vs. Operating Reflux Ratio ($R$)"
          subtitle="Illustrates the capital-vs-energy trade-off: stages diverge as $R \to R_{\min}$ and approach Fenske $N_{\min}$ at high $R$."
          rightMeta={
            results.minimumReflux.minimumRefluxRatio_Rmin !== null
              ? `$R_{\\min} = ${results.minimumReflux.minimumRefluxRatio_Rmin.toFixed(3)}$`
              : '—'
          }
          footer={
            <>
              <span>
                Fenske <MathInline latex="N_{\min}" />:{' '}
                {results.minimumReflux.fenskeMinimumStages_Nmin !== null
                  ? results.minimumReflux.fenskeMinimumStages_Nmin.toFixed(2)
                  : '—'}
              </span>
              <span>
                Active <MathInline latex="N" />:{' '}
                {results.stageCalculation.fractionalTheoreticalStages !== null
                  ? `${results.stageCalculation.fractionalTheoreticalStages.toFixed(2)} stages`
                  : 'Pinched'}
              </span>
            </>
          }
        >
          <div className="h-[260px] w-full" data-testid="reflux-vs-stages-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={refluxVsStagesSeries}
                margin={{ top: 10, right: 16, left: 8, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="refluxRatio_R"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Reflux Ratio R = L / D',
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  width={50}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Theoretical Stages N',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 4,
                    style: { textAnchor: 'middle', fontSize: 11, fill: '#475569' },
                  }}
                />
                <Tooltip
                  formatter={(val, name) => [Number(val ?? 0).toFixed(2), String(name ?? '')]}
                  labelFormatter={(label) => `Reflux Ratio R = ${Number(label ?? 0).toFixed(3)}`}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
                />
                <Line
                  type="monotone"
                  dataKey="fractionalStages_N"
                  name="Required Fractional Stages N(R)"
                  stroke="#0F766E"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="fenskeMinimum_Nmin"
                  name="Fenske Minimum Stages (Nmin at R → ∞)"
                  stroke="#64748B"
                  strokeWidth={1.8}
                  strokeDasharray="5 4"
                  dot={false}
                />
                {results.stageCalculation.converged &&
                  results.stageCalculation.fractionalTheoreticalStages !== null && (
                    <ReferenceDot
                      x={Number(inputs.refluxRatio_R.toFixed(3))}
                      y={Number(
                        results.stageCalculation.fractionalTheoreticalStages.toFixed(2)
                      )}
                      r={5}
                      fill="#E11D48"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />
                  )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>
      </div>

      {/* ==================== SECONDARY CHARTS ROW 2: PRODUCT FLOWS & SCENARIO COMPARISON ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Secondary Chart 3: Product Flow Rates vs Feed Composition */}
        <LabChartCard
          className="lg:col-span-6"
          title="Product Molar Flow Rates ($D$ & $B$) vs. Feed Composition ($z_F$)"
          subtitle={`Material balance lever rule $D = F\\frac{z_F - x_B}{x_D - x_B}$ for fixed $F = ${inputs.feedFlow_kmol_h.toFixed(0)}\\,\\mathrm{kmol/h}$, $x_D = ${inputs.distillateComposition_xD.toFixed(2)}$, $x_B = ${inputs.bottomsComposition_xB.toFixed(2)}$.`}
          rightMeta={`$D = ${results.materialBalance.distillateFlow_kmol_h.toFixed(1)},\\; B = ${results.materialBalance.bottomsFlow_kmol_h.toFixed(1)}\\,\\mathrm{kmol/h}$`}
          footer={
            <>
              <span>
                Valid window: <MathInline latex="x_B < z_F < x_D" />
              </span>
              <span>
                Total <MathInline latex="F = D + B" /> = {inputs.feedFlow_kmol_h.toFixed(1)} kmol/h
              </span>
            </>
          }
        >
          <div className="h-[250px] w-full" data-testid="product-flows-vs-feed-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={productFlowSeries}
                margin={{ top: 10, right: 16, left: 8, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="feedComposition_zF"
                  type="number"
                  domain={[inputs.bottomsComposition_xB, inputs.distillateComposition_xD]}
                  tickFormatter={(v: number) => v.toFixed(2)}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Feed Mole Fraction zF (mol/mol)',
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 11,
                    fill: '#475569',
                  }}
                />
                <YAxis
                  width={52}
                  domain={[0, inputs.feedFlow_kmol_h]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Flow Rate (kmol/h)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 4,
                    style: { textAnchor: 'middle', fontSize: 11, fill: '#475569' },
                  }}
                />
                <Tooltip
                  formatter={(val, name) => [`${Number(val ?? 0).toFixed(2)} kmol/h`, String(name ?? '')]}
                  labelFormatter={(label) => `Feed zF = ${Number(label ?? 0).toFixed(3)}`}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, paddingTop: 14 }}
                />
                <Line
                  type="monotone"
                  dataKey="distillateFlow_D_kmol_h"
                  name="Distillate Flow D (kmol/h)"
                  stroke="#0F766E"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bottomsFlow_B_kmol_h"
                  name="Bottoms Flow B (kmol/h)"
                  stroke="#334155"
                  strokeWidth={2.2}
                  strokeDasharray="5 3"
                  dot={false}
                />
                <ReferenceDot
                  x={Number(inputs.feedComposition_zF.toFixed(4))}
                  y={Number(results.materialBalance.distillateFlow_kmol_h.toFixed(2))}
                  r={5}
                  fill="#0F766E"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>

        {/* Secondary Chart 4: Scenario Comparison Bar Chart */}
        <LabChartCard
          className="lg:col-span-6"
          title="Scenario Comparison: Required Theoretical Stages ($N$)"
          subtitle="Compares fractional equilibrium stage requirements across saved distillation runs and the current live configuration."
          rightMeta={`${savedScenarios.length} Saved Run${savedScenarios.length === 1 ? '' : 's'}`}
          footer={
            <>
              <span>Teal bar = Current live operating point</span>
              <span>Includes partial reboiler (1 stage)</span>
            </>
          }
        >
          <div className="h-[250px] w-full" data-testid="distillation-scenario-barchart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scenarioComparisonBars}
                margin={{ top: 10, right: 16, left: 8, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="shortName"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#475569' }}
                />
                <YAxis
                  width={50}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Fractional Stages N',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 4,
                    style: { textAnchor: 'middle', fontSize: 11, fill: '#475569' },
                  }}
                />
                <Tooltip
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName ?? String(label)
                  }
                  formatter={(val) => [`${Number(val ?? 0).toFixed(2)} stages`, 'Theoretical Stages']}
                />
                <Bar dataKey="fractionalStages" radius={[6, 6, 0, 0]} maxBarSize={54}>
                  {scenarioComparisonBars.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.isLive ? '#0F766E' : '#334155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </LabChartCard>
      </div>

      {/* ==================== OPERATING SCENARIO COMPARISON TABLE ==================== */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        data-testid="distillation-scenario-comparison-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Distillation Scenario Comparison Table
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Snapshot distillation operating configurations to compare reflux ratio{' '}
              <MathInline latex="R" />, minimum reflux <MathInline latex="R_{\min}" />, stage
              requirements <MathInline latex="N" />, feed stage <MathInline latex="N_F" />, and
              distillate/bottoms splits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={customScenarioLabel}
              onChange={(e) => setCustomScenarioLabel(e.target.value)}
              placeholder="Optional run label..."
              aria-label="Optional scenario label"
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-teal-700 w-44"
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
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Table
              </button>
            )}
          </div>
        </div>

        {/* Mobile Stacked Scenario Cards (< 640px) — Zero Cramped Multi-Line Cells */}
        <div className="sm:hidden space-y-3" data-testid="distillation-scenario-mobile-cards">
          {savedScenarios.map((s) => (
            <div
              key={`mob-${s.id}`}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{s.label}</span>
                <div className="inline-flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadScenario(s.inputs)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveScenario(s.id)}
                    aria-label={`Remove ${s.label}`}
                    className="p-1 text-slate-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
                <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                  <div className="text-[10px] font-sans text-slate-500">α &amp; Feed q</div>
                  <div className="font-semibold text-slate-900 whitespace-nowrap">
                    α = {s.inputs.relativeVolatility_alpha.toFixed(2)} · q ={' '}
                    {s.inputs.feedQuality_q.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                  <div className="text-[10px] font-sans text-slate-500">Reflux R (Rmin)</div>
                  <div className="font-semibold text-slate-900 whitespace-nowrap">
                    {s.inputs.refluxRatio_R.toFixed(2)} (
                    {s.minimumReflux_Rmin !== null ? s.minimumReflux_Rmin.toFixed(2) : '—'})
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                  <div className="text-[10px] font-sans text-slate-500">zF → xD / xB</div>
                  <div className="font-semibold text-slate-900 whitespace-nowrap">
                    {s.inputs.feedComposition_zF.toFixed(2)} →{' '}
                    {s.inputs.distillateComposition_xD.toFixed(2)} /{' '}
                    {s.inputs.bottomsComposition_xB.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200/80">
                  <div className="text-[10px] font-sans text-slate-500">Stages N (Feed NF)</div>
                  <div className="font-semibold text-teal-800 whitespace-nowrap">
                    {s.totalTheoreticalStages !== null && s.fractionalTheoreticalStages !== null
                      ? `${s.totalTheoreticalStages} (${s.fractionalTheoreticalStages.toFixed(2)}) · NF=${s.feedStageNumber ?? '—'}`
                      : 'Pinched'}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Current Live Run Mobile Card */}
          <div className="rounded-xl border-2 border-teal-600/70 bg-teal-50/40 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-teal-950">Current Live Run</span>
              <span className="px-2 py-0.5 rounded bg-teal-700 text-white text-[10px] font-semibold">
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums">
              <div className="bg-white rounded-lg p-2 border border-teal-200/80">
                <div className="text-[10px] font-sans text-slate-500">α &amp; Feed q</div>
                <div className="font-semibold text-slate-900 whitespace-nowrap">
                  α = {inputs.relativeVolatility_alpha.toFixed(2)} · q ={' '}
                  {inputs.feedQuality_q.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-teal-200/80">
                <div className="text-[10px] font-sans text-slate-500">Reflux R (Rmin)</div>
                <div className="font-semibold text-slate-900 whitespace-nowrap">
                  {inputs.refluxRatio_R.toFixed(2)} (
                  {results.minimumReflux.minimumRefluxRatio_Rmin !== null
                    ? results.minimumReflux.minimumRefluxRatio_Rmin.toFixed(2)
                    : '—'}
                  )
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-teal-200/80">
                <div className="text-[10px] font-sans text-slate-500">zF → xD / xB</div>
                <div className="font-semibold text-slate-900 whitespace-nowrap">
                  {inputs.feedComposition_zF.toFixed(2)} →{' '}
                  {inputs.distillateComposition_xD.toFixed(2)} /{' '}
                  {inputs.bottomsComposition_xB.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-teal-200/80">
                <div className="text-[10px] font-sans text-slate-500">Stages N (Feed NF)</div>
                <div className="font-semibold text-teal-900 whitespace-nowrap">
                  {results.stageCalculation.totalTheoreticalStages !== null &&
                  results.stageCalculation.fractionalTheoreticalStages !== null
                    ? `${results.stageCalculation.totalTheoreticalStages} (${results.stageCalculation.fractionalTheoreticalStages.toFixed(2)}) · NF=${results.stageCalculation.feedStageNumber ?? '—'}`
                    : 'Pinched'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet & Desktop Full Comparison Table */}
        <div
          className="hidden sm:block overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-teal-700"
          role="region"
          aria-label="Distillation Scenario Comparison Table"
          tabIndex={0}
        >
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-sans">
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Scenario</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">α</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">q</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">R (Rmin)</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">zF → xD / xB</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">D / B (kmol/h)</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Stages N (Frac)</th>
                <th className="py-2.5 px-2 font-semibold whitespace-nowrap">Feed NF</th>
                <th className="py-2.5 px-2 font-semibold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {savedScenarios.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900 whitespace-nowrap">
                    {s.label}
                  </td>
                  <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                    {s.inputs.relativeVolatility_alpha.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                    {s.inputs.feedQuality_q.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">
                    {s.inputs.refluxRatio_R.toFixed(2)}{' '}
                    <span className="text-slate-500">
                      ({s.minimumReflux_Rmin !== null ? s.minimumReflux_Rmin.toFixed(2) : '—'})
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                    {s.inputs.feedComposition_zF.toFixed(2)} →{' '}
                    {s.inputs.distillateComposition_xD.toFixed(2)} /{' '}
                    {s.inputs.bottomsComposition_xB.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                    {s.distillateFlow_kmol_h.toFixed(1)} / {s.bottomsFlow_kmol_h.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 font-semibold text-teal-800 whitespace-nowrap">
                    {s.totalTheoreticalStages !== null && s.fractionalTheoreticalStages !== null
                      ? `${s.totalTheoreticalStages} (${s.fractionalTheoreticalStages.toFixed(2)})`
                      : 'Pinched'}
                  </td>
                  <td className="py-2.5 px-2 text-slate-800 whitespace-nowrap">
                    {s.feedStageNumber !== null ? `Stage ${s.feedStageNumber}` : '—'}
                  </td>
                  <td className="py-2.5 px-2 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 font-sans">
                      <button
                        type="button"
                        onClick={() => onLoadScenario(s.inputs)}
                        className="px-2 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveScenario(s.id)}
                        aria-label={`Remove ${s.label}`}
                        className="p-1 text-slate-500 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Current Live Run Row */}
              <tr className="bg-teal-50/40 font-semibold">
                <td className="py-2.5 px-3 font-sans text-teal-950 whitespace-nowrap">
                  Current Live Run
                </td>
                <td className="py-2.5 px-2 text-slate-900 whitespace-nowrap">
                  {inputs.relativeVolatility_alpha.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-slate-900 whitespace-nowrap">
                  {inputs.feedQuality_q.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-slate-900 whitespace-nowrap">
                  {inputs.refluxRatio_R.toFixed(2)}{' '}
                  <span className="text-slate-600 font-normal">
                    (
                    {results.minimumReflux.minimumRefluxRatio_Rmin !== null
                      ? results.minimumReflux.minimumRefluxRatio_Rmin.toFixed(2)
                      : '—'}
                    )
                  </span>
                </td>
                <td className="py-2.5 px-2 text-slate-900 whitespace-nowrap">
                  {inputs.feedComposition_zF.toFixed(2)} →{' '}
                  {inputs.distillateComposition_xD.toFixed(2)} /{' '}
                  {inputs.bottomsComposition_xB.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 text-slate-900 whitespace-nowrap">
                  {results.materialBalance.distillateFlow_kmol_h.toFixed(1)} /{' '}
                  {results.materialBalance.bottomsFlow_kmol_h.toFixed(1)}
                </td>
                <td className="py-2.5 px-2 text-teal-900 whitespace-nowrap">
                  {results.stageCalculation.totalTheoreticalStages !== null &&
                  results.stageCalculation.fractionalTheoreticalStages !== null
                    ? `${results.stageCalculation.totalTheoreticalStages} (${results.stageCalculation.fractionalTheoreticalStages.toFixed(2)})`
                    : 'Pinched'}
                </td>
                <td className="py-2.5 px-2 text-slate-900 whitespace-nowrap">
                  {results.stageCalculation.feedStageNumber !== null
                    ? `Stage ${results.stageCalculation.feedStageNumber}`
                    : '—'}
                </td>
                <td className="py-2.5 px-2 text-right font-sans text-[11px] text-teal-800 whitespace-nowrap">
                  Active
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
