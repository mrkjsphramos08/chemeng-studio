'use client';

import React from 'react';
import { ProcessControlResults } from '@/lib/process-control';
import { MathInline } from '@/components/lab-shared/math';
import { formatSignedZero } from '@/lib/navigation';

interface ProcessControlSchematicProps {
  results: ProcessControlResults;
}

export function ProcessControlSchematic({ results }: ProcessControlSchematicProps) {
  const { inputs, metrics, timeSeries } = results;
  const isOpenLoop = inputs.controllerMode === 'open-loop';
  const lastPt = timeSeries[timeSeries.length - 1];

  const controllerFormulaLabel =
    inputs.controllerMode === 'open-loop'
      ? `Manual Step: Δu = ${inputs.openLoopStep_du >= 0 ? '+' : ''}${inputs.openLoopStep_du.toFixed(1)}%`
      : inputs.controllerMode === 'P'
        ? `Kc = ${inputs.controllerGain_Kc.toFixed(2)}`
        : inputs.controllerMode === 'PI'
          ? `Kc = ${inputs.controllerGain_Kc.toFixed(2)}, τI = ${inputs.integralTime_Ti_s.toFixed(1)} s`
          : `Kc = ${inputs.controllerGain_Kc.toFixed(2)}, τI = ${inputs.integralTime_Ti_s.toFixed(0)}s, τD = ${inputs.derivativeTime_Td_s.toFixed(1)}s`;

  const stabilityBadgeClass =
    metrics.stabilityStatus === 'Sustained / Growing Oscillation (Unstable)'
      ? 'border-rose-300 bg-rose-50 text-rose-900'
      : metrics.stabilityStatus === 'Underdamped Oscillatory'
        ? 'border-amber-300 bg-amber-50 text-amber-900'
        : metrics.stabilityStatus === 'Actuator Saturated / Offset Limited'
          ? 'border-purple-300 bg-purple-50 text-purple-900'
          : 'border-teal-300 bg-teal-50 text-teal-900';

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
            Interactive Block Diagram · SISO Feedback Loop
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {isOpenLoop
              ? 'Open-Loop FOPDT Process Architecture (Feedback Disconnected)'
              : `Closed-Loop ${inputs.controllerMode} Feedback Control Architecture`}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
            <MathInline
              latex={`\\theta / \\tau = ${results.controllabilityRatio_theta_over_tau.toFixed(2)}`}
            />
          </span>
          {!isOpenLoop && (
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
              <MathInline latex={`K_p K_c = ${results.loopGain_KpKc.toFixed(2)}`} />
            </span>
          )}
          <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${stabilityBadgeClass}`}>
            {metrics.stabilityStatus}
          </span>
        </div>
      </div>

      {/* Mobile Signal-Flow Architecture (< 640px) — 100% Visible Without Horizontal Clipping */}
      <div
        className="sm:hidden rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-slate-100 space-y-2.5"
        data-testid="process-control-mobile-schematic"
      >
        {/* Step 1: Setpoint & Comparator */}
        <div className="rounded-lg border border-sky-500/40 bg-slate-900/90 p-2.5 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              1. {isOpenLoop ? 'Baseline Reference' : 'Setpoint & Comparator'}
            </div>
            <div className="font-mono text-[11px] text-slate-200 mt-0.5">
              {isOpenLoop
                ? `Y0 = ${inputs.initialOutput_Y0.toFixed(1)}% (Open Loop)`
                : `r(t): ${inputs.initialOutput_Y0.toFixed(0)}% → ${inputs.setpointTarget_Ysp.toFixed(0)}%`}
            </div>
          </div>
          <div className="text-right font-mono text-[11px] shrink-0">
            <div className="text-teal-300 font-semibold">e(t) = r − Y</div>
            <div className="text-slate-300">
              {isOpenLoop ? 'Open' : `${formatSignedZero(lastPt.error_e, 2)}%`}
            </div>
          </div>
        </div>

        {/* Step 2: Controller Block Gc(s) */}
        <div className="rounded-lg border border-teal-500/50 bg-slate-900/90 p-2.5 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
              2. {isOpenLoop ? 'Manual Step Generator' : `Controller Gc(s) (${inputs.controllerMode})`}
            </div>
            <div className="font-mono text-[11px] font-semibold text-white mt-0.5">
              {controllerFormulaLabel}
            </div>
          </div>
          <div className="text-right font-mono text-[11px] shrink-0">
            <div className="text-slate-400">u_cmd</div>
            <div className="text-sky-300 font-semibold">
              {lastPt.unconstrainedCommand_Ucmd.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Step 3: Actuator Saturation + Load Disturbance */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              3A. Actuator Limits
            </div>
            <div className="font-mono text-[11px] text-white mt-0.5">
              [{inputs.actuatorMin_Umin.toFixed(0)}%, {inputs.actuatorMax_Umax.toFixed(0)}%]
            </div>
            <div className="font-mono text-[10px] text-emerald-300 mt-0.5">
              {metrics.saturationDuration_s > 0
                ? `Sat: ${metrics.saturationDuration_s.toFixed(1)} s`
                : 'Linear Range'}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              3B. Load Disturbance d(t)
            </div>
            <div className="font-mono text-[11px] text-white mt-0.5">
              {Math.abs(inputs.disturbanceMagnitude_d) > 1e-4
                ? `Δd = ${inputs.disturbanceMagnitude_d >= 0 ? '+' : ''}${inputs.disturbanceMagnitude_d.toFixed(1)}%`
                : 'd(t) = 0.0% (None)'}
            </div>
            <div className="font-mono text-[10px] text-slate-400 mt-0.5">
              @ t = {inputs.disturbanceTime_s.toFixed(0)} s
            </div>
          </div>
        </div>

        {/* Step 4: FOPDT Process Plant Gp(s) & Controlled Output Y(t) */}
        <div className="rounded-lg border border-sky-500/50 bg-slate-900/90 p-2.5 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
              4. FOPDT Process Gp(s) = Kp·exp(−θs)/(τs+1)
            </div>
            <div className="font-mono text-[11px] text-slate-200 mt-0.5">
              Kp={inputs.processGain_Kp.toFixed(2)}, τ={inputs.timeConstant_tau_s.toFixed(1)}s, θ=
              {inputs.deadTime_theta_s.toFixed(1)}s
            </div>
          </div>
          <div className="text-right font-mono shrink-0">
            <div className="text-[10px] text-sky-300 font-bold">Output Y(t)</div>
            <div className="text-sm font-bold text-white">{metrics.finalOutput_Y.toFixed(2)}%</div>
          </div>
        </div>

        {/* Step 5: Feedback Loop Return Path */}
        <div className="rounded-lg border border-teal-500/30 bg-slate-900/60 px-3 py-2 flex items-center justify-between gap-2 font-mono text-[11px]">
          <span className="text-teal-300 font-semibold">
            {isOpenLoop ? 'Feedback Switch: OPEN' : '↺ Unity Feedback: Ym(t) = Y(t) → Comparator'}
          </span>
          <span className="text-slate-300 shrink-0">
            Peak {metrics.peakOutput_Y.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Tablet & Desktop Full SVG Block Diagram (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-950 p-3">
        <svg
          viewBox="0 0 820 250"
          className="h-auto w-full min-w-[660px]"
          role="img"
          aria-label={`Process control block diagram showing ${inputs.controllerMode} mode, process gain Kp = ${inputs.processGain_Kp}, time constant tau = ${inputs.timeConstant_tau_s} s, dead time theta = ${inputs.deadTime_theta_s} s, and final output Y = ${metrics.finalOutput_Y.toFixed(2)}%.`}
        >
          <defs>
            <marker
              id="ctrlArrowTeal"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2dd4bf" />
            </marker>
            <marker
              id="ctrlArrowSky"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker
              id="ctrlArrowAmber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
            </marker>
            <marker
              id="ctrlArrowMuted"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Top Disturbance Input Path d(t) */}
          <g>
            <rect
              x="472"
              y="10"
              width="126"
              height="38"
              rx="6"
              fill="#0f172a"
              stroke={Math.abs(inputs.disturbanceMagnitude_d) > 1e-4 ? '#f59e0b' : '#334155'}
              strokeWidth="1.5"
            />
            <text x="535" y="25" textAnchor="middle" fill="#fde68a" fontSize="9.5" fontWeight="700">
              LOAD DISTURBANCE d(t)
            </text>
            <text
              x="535"
              y="39"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="9.5"
              fontFamily="monospace"
            >
              {Math.abs(inputs.disturbanceMagnitude_d) > 1e-4
                ? `Δd = ${inputs.disturbanceMagnitude_d >= 0 ? '+' : ''}${inputs.disturbanceMagnitude_d.toFixed(1)}% @ ${inputs.disturbanceTime_s.toFixed(0)}s`
                : 'd(t) = 0.0% (None)'}
            </text>
            <line
              x1="535"
              y1="48"
              x2="535"
              y2="92"
              stroke={Math.abs(inputs.disturbanceMagnitude_d) > 1e-4 ? '#fbbf24' : '#475569'}
              strokeWidth="1.8"
              markerEnd="url(#ctrlArrowAmber)"
            />
          </g>

          {/* 1. Setpoint Input r(t) */}
          <g>
            <text x="16" y="88" fill="#38bdf8" fontSize="10" fontWeight="700">
              {isOpenLoop ? 'Baseline Ref' : 'Setpoint r(t)'}
            </text>
            <text x="16" y="102" fill="#e2e8f0" fontSize="10" fontFamily="monospace">
              {isOpenLoop
                ? `Y0 = ${inputs.initialOutput_Y0.toFixed(1)}%`
                : `${inputs.initialOutput_Y0.toFixed(0)}% → ${inputs.setpointTarget_Ysp.toFixed(0)}%`}
            </text>
            <line
              x1="16"
              y1="112"
              x2="104"
              y2="112"
              stroke="#38bdf8"
              strokeWidth="2"
              markerEnd="url(#ctrlArrowSky)"
            />
          </g>

          {/* 2. Comparator Summing Junction */}
          <g>
            <circle
              cx="122"
              cy="112"
              r="16"
              fill="#0f172a"
              stroke={isOpenLoop ? '#475569' : '#38bdf8'}
              strokeWidth="2"
            />
            <text x="114" y="111" fill="#38bdf8" fontSize="11" fontWeight="700">
              +
            </text>
            <text x="122" y="124" textAnchor="middle" fill={isOpenLoop ? '#64748b' : '#f43f5e'} fontSize="12" fontWeight="700">
              −
            </text>
            <text x="122" y="88" textAnchor="middle" fill="#94a3b8" fontSize="9">
              Comparator
            </text>
          </g>

          {/* Error Signal e(t) */}
          <g>
            <line
              x1="138"
              y1="112"
              x2="195"
              y2="112"
              stroke={isOpenLoop ? '#475569' : '#2dd4bf'}
              strokeWidth="2"
              strokeDasharray={isOpenLoop ? '4 3' : 'none'}
              markerEnd={isOpenLoop ? 'url(#ctrlArrowMuted)' : 'url(#ctrlArrowTeal)'}
            />
            <text x="166" y="103" textAnchor="middle" fill="#5eead4" fontSize="9.5" fontWeight="700">
              e(t) = r − Y
            </text>
            <text x="166" y="128" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              {isOpenLoop ? 'Open' : `${formatSignedZero(lastPt.error_e, 2)}%`}
            </text>
          </g>

          {/* 3. Controller Block Gc(s) */}
          <g transform="translate(198, 78)">
            <rect
              x="0"
              y="0"
              width="148"
              height="68"
              rx="8"
              fill="#0f172a"
              stroke="#14b8a6"
              strokeWidth="2"
            />
            <text x="74" y="18" textAnchor="middle" fill="#5eead4" fontSize="10" fontWeight="700">
              {isOpenLoop ? 'MANUAL GENERATOR' : `CONTROLLER (${inputs.controllerMode})`}
            </text>
            <text
              x="74"
              y="36"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="9.2"
              fontWeight="700"
              fontFamily="monospace"
            >
              {controllerFormulaLabel}
            </text>
            <text x="74" y="54" textAnchor="middle" fill="#94a3b8" fontSize="9">
              {isOpenLoop
                ? `Steps at t = ${inputs.setpointStepTime_s.toFixed(1)} s`
                : inputs.controllerMode === 'PID'
                  ? `Deriv. on PV (αD = ${inputs.derivativeFilterAlpha.toFixed(2)})`
                  : inputs.antiWindupEnabled
                    ? 'Anti-Windup: ACTIVE'
                    : 'Anti-Windup: OFF'}
            </text>
          </g>

          {/* Command Signal u(cmd) */}
          <g>
            <line
              x1="346"
              y1="112"
              x2="394"
              y2="112"
              stroke="#2dd4bf"
              strokeWidth="2"
              markerEnd="url(#ctrlArrowTeal)"
            />
            <text x="370" y="103" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="600">
              u(cmd)
            </text>
            <text x="370" y="128" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
              {lastPt.unconstrainedCommand_Ucmd.toFixed(1)}%
            </text>
          </g>

          {/* 4. Actuator & Saturation Limiter Block */}
          <g transform="translate(396, 82)">
            <rect
              x="0"
              y="0"
              width="90"
              height="60"
              rx="8"
              fill="#0f172a"
              stroke={metrics.saturationDuration_s > 0 ? '#f59e0b' : '#64748b'}
              strokeWidth="1.8"
            />
            <text x="45" y="17" textAnchor="middle" fill="#fde68a" fontSize="9.5" fontWeight="700">
              ACTUATOR
            </text>
            <text
              x="45"
              y="33"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="9"
              fontFamily="monospace"
            >
              [{inputs.actuatorMin_Umin.toFixed(0)}%, {inputs.actuatorMax_Umax.toFixed(0)}%]
            </text>
            <text
              x="45"
              y="48"
              textAnchor="middle"
              fill={metrics.saturationDuration_s > 0 ? '#fbbf24' : '#34d399'}
              fontSize="8.5"
              fontWeight="700"
            >
              {metrics.saturationDuration_s > 0
                ? `Sat: ${metrics.saturationDuration_s.toFixed(1)} s`
                : 'Linear Range'}
            </text>
          </g>

          {/* Manipulated Variable U(act) to Disturbance Summing Junction */}
          <g>
            <line
              x1="486"
              y1="112"
              x2="518"
              y2="112"
              stroke="#2dd4bf"
              strokeWidth="2"
              markerEnd="url(#ctrlArrowTeal)"
            />
            <text x="502" y="103" textAnchor="middle" fill="#5eead4" fontSize="9" fontWeight="700">
              U(act)
            </text>
          </g>

          {/* Process Input Disturbance Junction */}
          <g>
            <circle
              cx="535"
              cy="112"
              r="14"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="1.8"
            />
            <text x="535" y="116" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">
              +
            </text>
            <line
              x1="549"
              y1="112"
              x2="578"
              y2="112"
              stroke="#2dd4bf"
              strokeWidth="2"
              markerEnd="url(#ctrlArrowTeal)"
            />
          </g>

          {/* 5. FOPDT Process Block Gp(s) */}
          <g transform="translate(580, 74)">
            <rect
              x="0"
              y="0"
              width="154"
              height="76"
              rx="8"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <text x="77" y="18" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
              FOPDT PROCESS Gp(s)
            </text>
            <text
              x="77"
              y="36"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="10"
              fontWeight="700"
              fontFamily="monospace"
            >
              Kp·exp(−θs) / (τs + 1)
            </text>
            <text
              x="77"
              y="53"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="9"
              fontFamily="monospace"
            >
              Kp={inputs.processGain_Kp.toFixed(2)}, τ={inputs.timeConstant_tau_s.toFixed(1)}s
            </text>
            <text
              x="77"
              y="67"
              textAnchor="middle"
              fill="#5eead4"
              fontSize="9"
              fontFamily="monospace"
            >
              Dead Time θ = {inputs.deadTime_theta_s.toFixed(1)} s
            </text>
          </g>

          {/* 6. Controlled Output Y(t) */}
          <g>
            <line
              x1="734"
              y1="112"
              x2="804"
              y2="112"
              stroke="#38bdf8"
              strokeWidth="2.2"
              markerEnd="url(#ctrlArrowSky)"
            />
            <text x="770" y="92" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
              Output Y(t)
            </text>
            <text x="770" y="105" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700" fontFamily="monospace">
              {metrics.finalOutput_Y.toFixed(2)}%
            </text>
          </g>

          {/* 7. Feedback Measurement Path */}
          <g>
            {/* Tap point at x = 762, y = 112 */}
            <circle cx="762" cy="112" r="3.5" fill="#38bdf8" />
            <path
              d="M 762 112 L 762 208 L 122 208 L 122 132"
              fill="none"
              stroke={isOpenLoop ? '#475569' : '#2dd4bf'}
              strokeWidth="1.8"
              strokeDasharray={isOpenLoop ? '6 5' : 'none'}
              markerEnd={isOpenLoop ? 'url(#ctrlArrowMuted)' : 'url(#ctrlArrowTeal)'}
            />

            {/* Sensor / Transmitter Badge on Feedback Loop */}
            <rect
              x="355"
              y="190"
              width="190"
              height="34"
              rx="6"
              fill="#0f172a"
              stroke={isOpenLoop ? '#475569' : '#14b8a6'}
              strokeWidth="1.5"
            />
            <text
              x="450"
              y="204"
              textAnchor="middle"
              fill={isOpenLoop ? '#94a3b8' : '#5eead4'}
              fontSize="9.5"
              fontWeight="700"
            >
              {isOpenLoop
                ? 'FEEDBACK SWITCH: OPEN (MANUAL)'
                : 'UNITY FEEDBACK SENSOR Ym(t) = Y(t)'}
            </text>
            <text
              x="450"
              y="217"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="9"
              fontFamily="monospace"
            >
              {isOpenLoop
                ? 'Controller disconnected from process'
                : `Peak Y = ${metrics.peakOutput_Y.toFixed(2)}% · IAE = ${metrics.iae.toFixed(1)}`}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
