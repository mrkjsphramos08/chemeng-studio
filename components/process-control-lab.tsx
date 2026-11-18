'use client';

import React, { useMemo, useState } from 'react';
import {
  ControllerMode,
  ProcessControlInputs,
  PROCESS_CONTROL_PRESETS,
  SensitivityParameterKey,
  simulateProcessControl,
  generateControllerModeComparison,
  generateControlSensitivitySeries,
} from '@/lib/process-control';
import { PROCESS_CONTROL_GUIDED_QUESTIONS } from '@/lib/labs-data';
import { downloadSimulationCsv } from '@/lib/lab-download';
import { formatSignedZero } from '@/lib/navigation';
import {
  LabAssumptionsCard,
  LabGuidedInquiryCard,
  LabMetricCard,
  LabTheoryDisclosureCard,
  LabValidationAlerts,
  LabWorkspaceHeader,
  MathInline,
  MathText,
} from '@/components/lab-shared';
import { ProcessControlSchematic } from './process-control-schematic';
import {
  ProcessControlCharts,
  SavedControlScenario,
} from './process-control-charts';
import { Activity, Sliders, ShieldAlert } from 'lucide-react';

const DEFAULT_CONTROL_INPUTS: ProcessControlInputs =
  PROCESS_CONTROL_PRESETS[4].inputs; // Balanced PI Control (Zero Offset)

const PROCESS_CONTROL_ASSUMPTIONS = [
  {
    label: 'Linear SISO FOPDT Plant',
    detail:
      'Single-input, single-output linear time-invariant process $\\tau \\frac{dy}{dt} + y = K_p [u(t - \\theta) + d(t)]$ around baseline $(U_0 = 50\\%, Y_0)$.',
  },
  {
    label: 'Exact ZOH Exponential Step',
    detail:
      'Process state updates via exact zero-order-hold factor $e^{-\\Delta t / \\tau}$ with linear fractional dead-time interpolation for $\\theta / \\Delta t \\notin \\mathbb{Z}$.',
  },
  {
    label: 'Derivative-on-Measurement PID',
    detail:
      'Proportional and integral terms act on $e(t) = r(t) - Y(t)$, while filtered derivative acts on $-dY/dt$ ($\\alpha_D \\tau_D$) to eliminate setpoint derivative kick.',
  },
  {
    label: 'Educational Scope & Safety',
    detail:
      'Normalized $\\%\\,\\mathrm{PV}$ and $\\%\\,\\mathrm{MV}$ units for instructional clarity; not certified for industrial DCS or safety-instrumented plant operation.',
  },
];

export function ProcessControlLab() {
  const [inputs, setInputs] = useState<ProcessControlInputs>(
    DEFAULT_CONTROL_INPUTS
  );
  const [activePresetId, setActivePresetId] = useState<string>(
    'pi-integral-action'
  );
  const [savedScenarios, setSavedScenarios] = useState<SavedControlScenario[]>(
    []
  );
  const [sensitivityParameter, setSensitivityParameter] =
    useState<SensitivityParameterKey>('controllerGain_Kc');
  const [showAnalyticalReference, setShowAnalyticalReference] =
    useState<boolean>(true);

  const results = useMemo(() => simulateProcessControl(inputs), [inputs]);

  const modeComparison = useMemo(
    () => generateControllerModeComparison(inputs),
    [inputs]
  );

  const sensitivitySweep = useMemo(
    () => generateControlSensitivitySeries(inputs, sensitivityParameter),
    [inputs, sensitivityParameter]
  );

  const updateInput = <K extends keyof ProcessControlInputs>(
    key: K,
    value: ProcessControlInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setActivePresetId('custom');
  };

  const handleApplyPreset = (presetId: string) => {
    const found = PROCESS_CONTROL_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setInputs({ ...found.inputs });
      setActivePresetId(found.id);
    }
  };

  const handleSaveScenario = () => {
    if (!results.isValid) return;
    const presetObj = PROCESS_CONTROL_PRESETS.find(
      (p) => p.id === activePresetId
    );
    const label = presetObj
      ? `${presetObj.name.replace(/^\d+\.\s*/, '')}`
      : `${inputs.controllerMode} (K_c=${inputs.controllerGain_Kc.toFixed(1)}, θ=${inputs.deadTime_theta_s.toFixed(1)}s)`;

    const newScenario: SavedControlScenario = {
      id: `ctrl-${Date.now()}-${savedScenarios.length + 1}`,
      label,
      inputs: { ...inputs },
      results,
    };

    setSavedScenarios((prev) => [newScenario, ...prev.slice(0, 7)]);
  };

  const handleExportCsv = () => {
    if (!results.isValid) return;
    const { metrics } = results;
    downloadSimulationCsv('entrolume-process-control-fopdt-pid', [
      {
        title:
          'Entrolume — Simulated Process Dynamics & Control Model Configuration & Assumptions (Educational Simulation Only)',
        headers: ['Parameter', 'Value', 'Units / Notes'],
        rows: [
          ['Simulation Data Type', 'Numerically Simulated SISO FOPDT Trajectory', 'Not physical plant telemetry'],
          ['Controller Mode', inputs.controllerMode, 'open-loop / P / PI / PID'],
          ['Process Gain K_p', inputs.processGain_Kp.toFixed(4), '% PV / % MV'],
          ['Process Time Constant tau', inputs.timeConstant_tau_s.toFixed(3), 's'],
          ['Process Dead Time theta', inputs.deadTime_theta_s.toFixed(3), 's'],
          ['Controllability Ratio theta/tau', results.controllabilityRatio_theta_over_tau.toFixed(4), 'dimensionless'],
          ['Initial Process Output Y_0', inputs.initialOutput_Y0.toFixed(2), '% PV'],
          ['Baseline Actuator Bias U_0', results.baselineActuator_U0.toFixed(2), '% MV'],
          ['Controller Proportional Gain K_c', inputs.controllerGain_Kc.toFixed(4), '% MV / % PV'],
          ['Integral Time tau_I', inputs.integralTime_Ti_s.toFixed(3), 's'],
          ['Derivative Time tau_D', inputs.derivativeTime_Td_s.toFixed(3), 's'],
          ['Derivative Filter Factor alpha_D', inputs.derivativeFilterAlpha.toFixed(3), 'dimensionless'],
          ['Actuator Lower Limit U_min', inputs.actuatorMin_Umin.toFixed(2), '% MV'],
          ['Actuator Upper Limit U_max', inputs.actuatorMax_Umax.toFixed(2), '% MV'],
          ['Anti-Windup Protection', inputs.antiWindupEnabled ? 'Enabled (Conditional Integration)' : 'Disabled', '-'],
          ['Setpoint Target Y_sp', inputs.setpointTarget_Ysp.toFixed(2), '% PV'],
          ['Setpoint Step Time t_step', inputs.setpointStepTime_s.toFixed(2), 's'],
          ['Load Disturbance Magnitude d', inputs.disturbanceMagnitude_d.toFixed(2), '% MV equivalent'],
          ['Disturbance Time t_dist', inputs.disturbanceTime_s.toFixed(2), 's'],
          ['Open-Loop Step Magnitude delta_u', inputs.openLoopStep_du.toFixed(2), '% MV'],
          ['Simulation Duration t_sim', inputs.simulationDuration_s.toFixed(2), 's'],
          ['Simulation Time Step dt', inputs.timeStep_dt_s.toFixed(4), 's'],
        ],
      },
      {
        title: 'Simulated Closed-Loop / Open-Loop Performance Metrics',
        headers: ['Metric', 'Value', 'Units / Status'],
        rows: [
          ['Stability Classification', metrics.stabilityStatus, '-'],
          [
            '10%-90% Rise Time t_r',
            metrics.riseTime_10_90_s !== null ? metrics.riseTime_10_90_s.toFixed(3) : 'N/A',
            metrics.riseTimeStatus,
          ],
          ['Peak Process Output Y_peak', metrics.peakOutput_Y.toFixed(3), `% PV at t = ${metrics.peakTime_s.toFixed(2)} s`],
          [
            'Peak Overshoot',
            metrics.overshootPercent !== null ? metrics.overshootPercent.toFixed(2) : 'N/A',
            metrics.overshootStatus,
          ],
          [
            '2% Settling Time t_s',
            metrics.settlingTime_2pct_s !== null ? metrics.settlingTime_2pct_s.toFixed(3) : 'Unsettled',
            metrics.settlingStatus,
          ],
          ['Final Process Output Y(t_end)', metrics.finalOutput_Y.toFixed(4), '% PV'],
          ['Steady-State / Terminal Error e_ss', metrics.steadyStateError_ess.toFixed(4), '% PV'],
          ['Integral Absolute Error (IAE)', metrics.iae.toFixed(3), '% PV * s'],
          ['Integral Time-Weighted Absolute Error (ITAE)', metrics.itae.toFixed(3), '% PV * s^2'],
          ['Actuator Total Variation (TV_u)', metrics.controlEffort_TV.toFixed(3), '% MV'],
          ['Actuator Saturation Duration', metrics.saturationDuration_s.toFixed(2), `s (${metrics.saturationPercent.toFixed(1)}%)`],
        ],
      },
      {
        title: 'Simulated Time-Series Trajectory Data',
        headers: [
          'Time t (s)',
          'Setpoint r (% PV)',
          'Process Output Y (% PV)',
          'Analytical Open-Loop Ref (% PV)',
          'Error e (% PV)',
          'Unconstrained Command u_cmd (% MV)',
          'Actual Actuator U_act (% MV)',
          'Delayed Input U(t-theta) (% MV)',
          'Disturbance d (% MV)',
          'P Term (%)',
          'I Term (%)',
          'D Term (%)',
          'Saturated',
        ],
        rows: results.timeSeries.map((pt) => [
          pt.time_s,
          pt.setpoint_r,
          pt.processOutput_Y,
          pt.analyticalOpenLoop_Y,
          pt.error_e,
          pt.unconstrainedCommand_Ucmd,
          pt.actuatorOutput_Uact,
          pt.delayedActuator_Udel,
          pt.disturbance_d,
          pt.proportionalTerm_P,
          pt.integralTerm_I,
          pt.derivativeTerm_D,
          pt.isSaturated ? 'YES' : 'NO',
        ]),
      },
    ]);
  };

  const isOpenLoop = inputs.controllerMode === 'open-loop';
  const isPIorPID =
    inputs.controllerMode === 'PI' || inputs.controllerMode === 'PID';
  const isPID = inputs.controllerMode === 'PID';

  return (
    <section
      className="py-8 lg:py-10"
      aria-label="Process Dynamics and Control Virtual Laboratory"
    >
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Shared Workspace Header */}
        <LabWorkspaceHeader
          kickerItems={[
            'Laboratory 06 · Phase 2.4',
            'Process Dynamics & Feedback Control',
            'SISO FOPDT & PID Simulation',
          ]}
          title="Process Dynamics & Control Virtual Laboratory"
          description="Investigate first-order-plus-dead-time ($\tau \frac{dy}{dt} + y = K_p u(t - \theta)$) process dynamics, compare Open-Loop, P, PI, and filtered PID feedback controllers, and analyze setpoint tracking, load disturbance rejection, actuator saturation, and integral windup."
          presets={PROCESS_CONTROL_PRESETS.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
          }))}
          selectedPresetId={activePresetId}
          onSelectPreset={handleApplyPreset}
          onSaveScenario={handleSaveScenario}
          savedCount={savedScenarios.length}
          canSave={results.isValid}
          onDownloadCsv={handleExportCsv}
          canDownload={results.isValid}
          onReset={() => {
            setInputs(DEFAULT_CONTROL_INPUTS);
            setActivePresetId('pi-integral-action');
          }}
          learningObjectives={[
            {
              title: 'FOPDT Dynamics ($K_p, \\tau, \\theta$):',
              detail:
                'Relate process gain, time constant, and dead time to open-loop rise speed and phase lag.',
            },
            {
              title: 'P vs. PI vs. PID Control:',
              detail:
                'Explain why P control leaves offset $e_{\\mathrm{ss}}$, PI eliminates offset, and derivative action damps overshoot.',
            },
            {
              title: 'Setpoint & Disturbance Rejection:',
              detail:
                'Simulate servo (setpoint step) and regulatory (load disturbance $d$) responses.',
            },
            {
              title: 'Saturation & Anti-Windup:',
              detail:
                'Observe integral windup when $u_{\\mathrm{cmd}}$ exceeds $[U_{\\min}, U_{\\max}]$ and verify clamping anti-windup.',
            },
          ]}
          workflowSteps={[
            {
              title: 'Step 1 · Configure',
              detail:
                'Choose FOPDT plant parameters ($K_p, \\tau, \\theta$), controller mode (Open-Loop, P, PI, PID), and actuator limits.',
            },
            {
              title: 'Step 2 · Simulate',
              detail:
                'Apply a setpoint step $r(t)$ or unmeasured load disturbance $d(t)$ and observe the dynamic trajectory.',
            },
            {
              title: 'Step 3 · Analyze',
              detail:
                'Inspect rise time, overshoot, $\\pm 2\\%$ settling time, IAE, ITAE, control effort, and P/PI/PID comparisons.',
            },
            {
              title: 'Step 4 · Reflect',
              detail:
                'Complete 10 guided conceptual inquiries on tuning trade-offs, dead time, and integral windup.',
            },
          ]}
        />

        {/* Validation Errors & Engineering Advisories */}
        <LabValidationAlerts
          issues={[
            ...results.validationErrors.map((message) => ({
              severity: 'error' as const,
              message,
            })),
            ...results.advisories.map((message) => ({
              severity: 'warning' as const,
              message,
            })),
          ]}
          warningTitle="Process Control & Closed-Loop Stability Advisories"
        />

        {/* Main Two-Column Workspace: Left Controls (4 cols) + Right Dashboard, Schematic & Charts (8 cols) */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Controls & Educational Presets */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
            {/* Panel 1: Controller Mode & Tuning Parameters */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-teal-700" />
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
                    01. Configure · User Inputs — Step 1A · Controller Architecture
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Controller Mode &amp; PID Tuning
                  </h2>
                </div>
              </div>

              {/* 4-Mode Segmented Selector */}
              <div
                className="mb-4 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-1"
                role="group"
                aria-label="Select Controller Mode"
              >
                {(
                  [
                    { id: 'open-loop', label: 'Open-Loop' },
                    { id: 'P', label: 'P Only' },
                    { id: 'PI', label: 'PI' },
                    { id: 'PID', label: 'PID' },
                  ] as { id: ControllerMode; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateInput('controllerMode', m.id)}
                    className={`rounded-lg px-2 py-2 text-xs font-bold transition ${
                      inputs.controllerMode === m.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-white/70'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Controller Gain Kc */}
              <div className="space-y-4">
                <div className={isOpenLoop ? 'opacity-45' : ''}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="ctrl-kc"
                      className="font-semibold text-slate-800"
                    >
                      Controller Gain (<MathInline latex="K_c" />)
                    </label>
                    <span className="font-mono font-bold text-teal-800">
                      {inputs.controllerGain_Kc.toFixed(2)} %/%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="ctrl-kc"
                      type="range"
                      aria-label="Controller Gain (Kc, %MV/%PV) slider"
                      min={0.1}
                      max={8.0}
                      step={0.1}
                      disabled={isOpenLoop}
                      value={inputs.controllerGain_Kc}
                      onChange={(e) =>
                        updateInput('controllerGain_Kc', Number(e.target.value))
                      }
                      className="w-full accent-teal-600"
                    />
                    <input
                      type="number"
                      aria-label="Controller Gain (Kc, %MV/%PV) numeric input"
                      min={0.05}
                      max={20}
                      step={0.1}
                      disabled={isOpenLoop}
                      value={inputs.controllerGain_Kc}
                      onChange={(e) =>
                        updateInput('controllerGain_Kc', Number(e.target.value))
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Integral Time Ti */}
                <div className={!isPIorPID ? 'opacity-45' : ''}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="ctrl-ti"
                      className="font-semibold text-slate-800"
                    >
                      Integral Time (<MathInline latex="\tau_I" />)
                    </label>
                    <span className="font-mono font-bold text-teal-800">
                      {isPIorPID
                        ? `${inputs.integralTime_Ti_s.toFixed(1)} s`
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="ctrl-ti"
                      type="range"
                      aria-label="Integral Time (tau_I, s) slider"
                      min={1.0}
                      max={80.0}
                      step={0.5}
                      disabled={!isPIorPID}
                      value={inputs.integralTime_Ti_s}
                      onChange={(e) =>
                        updateInput('integralTime_Ti_s', Number(e.target.value))
                      }
                      className="w-full accent-teal-600"
                    />
                    <input
                      type="number"
                      aria-label="Integral Time (tau_I, s) numeric input"
                      min={0.5}
                      max={200}
                      step={0.5}
                      disabled={!isPIorPID}
                      value={inputs.integralTime_Ti_s}
                      onChange={(e) =>
                        updateInput('integralTime_Ti_s', Number(e.target.value))
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Derivative Time Td */}
                <div className={!isPID ? 'opacity-45' : ''}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="ctrl-td"
                      className="font-semibold text-slate-800"
                    >
                      Derivative Time (<MathInline latex="\tau_D" />)
                    </label>
                    <span className="font-mono font-bold text-teal-800">
                      {isPID
                        ? `${inputs.derivativeTime_Td_s.toFixed(1)} s`
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="ctrl-td"
                      type="range"
                      aria-label="Derivative Time (tau_D, s) slider"
                      min={0.0}
                      max={20.0}
                      step={0.25}
                      disabled={!isPID}
                      value={inputs.derivativeTime_Td_s}
                      onChange={(e) =>
                        updateInput(
                          'derivativeTime_Td_s',
                          Number(e.target.value)
                        )
                      }
                      className="w-full accent-teal-600"
                    />
                    <input
                      type="number"
                      aria-label="Derivative Time (tau_D, s) numeric input"
                      min={0}
                      max={60}
                      step={0.25}
                      disabled={!isPID}
                      value={inputs.derivativeTime_Td_s}
                      onChange={(e) =>
                        updateInput(
                          'derivativeTime_Td_s',
                          Number(e.target.value)
                        )
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Derivative Filter Factor alpha_D */}
                <div className={!isPID ? 'opacity-45' : ''}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="ctrl-alpha"
                      className="font-semibold text-slate-800"
                    >
                      Derivative Filter (<MathInline latex="\alpha_D" />)
                    </label>
                    <span className="font-mono text-xs text-slate-700">
                      {inputs.derivativeFilterAlpha.toFixed(2)}
                    </span>
                  </div>
                  <input
                    id="ctrl-alpha"
                    type="range"
                    aria-label="Derivative Filter Factor (alpha_D, dimensionless) slider"
                    min={0.05}
                    max={0.5}
                    step={0.05}
                    disabled={!isPID}
                    value={inputs.derivativeFilterAlpha}
                    onChange={(e) =>
                      updateInput(
                        'derivativeFilterAlpha',
                        Number(e.target.value)
                      )
                    }
                    className="w-full accent-teal-600"
                  />
                </div>

                {/* Actuator Saturation Limits & Anti-Windup */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>
                      Actuator Limits (
                      <MathInline latex="[U_{\min}, U_{\max}]" />)
                    </span>
                    <span className="font-mono text-teal-800">
                      [{inputs.actuatorMin_Umin}%, {inputs.actuatorMax_Umax}%]
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="ctrl-umin"
                        className="block text-[11px] text-slate-600"
                      >
                        Min Signal <MathInline latex="U_{\min}" /> (%)
                      </label>
                      <input
                        id="ctrl-umin"
                        type="number"
                        aria-label="Minimum Actuator Signal (U_min, %MV)"
                        min={-50}
                        max={90}
                        step={5}
                        value={inputs.actuatorMin_Umin}
                        onChange={(e) =>
                          updateInput(
                            'actuatorMin_Umin',
                            Number(e.target.value)
                          )
                        }
                        className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ctrl-umax"
                        className="block text-[11px] text-slate-600"
                      >
                        Max Signal <MathInline latex="U_{\max}" /> (%)
                      </label>
                      <input
                        id="ctrl-umax"
                        type="number"
                        aria-label="Maximum Actuator Signal (U_max, %MV)"
                        min={10}
                        max={150}
                        step={5}
                        value={inputs.actuatorMax_Umax}
                        onChange={(e) =>
                          updateInput(
                            'actuatorMax_Umax',
                            Number(e.target.value)
                          )
                        }
                        className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-800">
                      Anti-Windup (Integral Clamping)
                    </span>
                    <input
                      type="checkbox"
                      checked={inputs.antiWindupEnabled}
                      disabled={!isPIorPID}
                      onChange={(e) =>
                        updateInput('antiWindupEnabled', e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Panel 2: FOPDT Process Dynamics */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-700" />
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
                    Step 1B · Process Model (FOPDT)
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Process Gain, Time Constant &amp; Dead Time
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {/* Process Gain Kp */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="proc-kp"
                      className="font-semibold text-slate-800"
                    >
                      Process Gain (<MathInline latex="K_p" />)
                    </label>
                    <span className="font-mono font-bold text-slate-900">
                      {inputs.processGain_Kp.toFixed(2)} %PV/%MV
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="proc-kp"
                      type="range"
                      aria-label="Process Gain (Kp, %PV/%MV) slider"
                      min={0.2}
                      max={5.0}
                      step={0.1}
                      value={inputs.processGain_Kp}
                      onChange={(e) =>
                        updateInput('processGain_Kp', Number(e.target.value))
                      }
                      className="w-full accent-teal-600"
                    />
                    <input
                      type="number"
                      aria-label="Process Gain (Kp, %PV/%MV) numeric input"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={inputs.processGain_Kp}
                      onChange={(e) =>
                        updateInput('processGain_Kp', Number(e.target.value))
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Time Constant tau */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="proc-tau"
                      className="font-semibold text-slate-800"
                    >
                      Time Constant (<MathInline latex="\tau" />)
                    </label>
                    <span className="font-mono font-bold text-slate-900">
                      {inputs.timeConstant_tau_s.toFixed(1)} s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="proc-tau"
                      type="range"
                      aria-label="Process Time Constant (tau, s) slider"
                      min={2.0}
                      max={80.0}
                      step={1.0}
                      value={inputs.timeConstant_tau_s}
                      onChange={(e) =>
                        updateInput(
                          'timeConstant_tau_s',
                          Number(e.target.value)
                        )
                      }
                      className="w-full accent-teal-600"
                    />
                    <input
                      type="number"
                      aria-label="Process Time Constant (tau, s) numeric input"
                      min={1}
                      max={200}
                      step={1}
                      value={inputs.timeConstant_tau_s}
                      onChange={(e) =>
                        updateInput(
                          'timeConstant_tau_s',
                          Number(e.target.value)
                        )
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Dead Time theta */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="proc-theta"
                      className="font-semibold text-slate-800"
                    >
                      Dead Time / Delay (<MathInline latex="\theta" />)
                    </label>
                    <span className="font-mono font-bold text-slate-900">
                      {inputs.deadTime_theta_s.toFixed(1)} s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="proc-theta"
                      type="range"
                      aria-label="Process Dead Time (theta, s) slider"
                      min={0.0}
                      max={30.0}
                      step={0.5}
                      value={inputs.deadTime_theta_s}
                      onChange={(e) =>
                        updateInput('deadTime_theta_s', Number(e.target.value))
                      }
                      className="w-full accent-teal-600"
                    />
                    <input
                      type="number"
                      aria-label="Process Dead Time (theta, s) numeric input"
                      min={0}
                      max={100}
                      step={0.5}
                      value={inputs.deadTime_theta_s}
                      onChange={(e) =>
                        updateInput('deadTime_theta_s', Number(e.target.value))
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Initial Output, Duration & Time Step */}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <label
                      htmlFor="proc-y0"
                      className="block text-[11px] text-slate-600"
                    >
                      Initial <MathInline latex="Y_0" /> (%)
                    </label>
                    <input
                      id="proc-y0"
                      type="number"
                      aria-label="Initial Process Output (Y_0, %PV)"
                      min={0}
                      max={100}
                      step={5}
                      value={inputs.initialOutput_Y0}
                      onChange={(e) =>
                        updateInput('initialOutput_Y0', Number(e.target.value))
                      }
                      className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="proc-dur"
                      className="block text-[11px] text-slate-600"
                    >
                      Horizon <MathInline latex="t_{\mathrm{sim}}" /> (s)
                    </label>
                    <input
                      id="proc-dur"
                      type="number"
                      aria-label="Simulation Horizon (t_sim, s)"
                      min={20}
                      max={600}
                      step={10}
                      value={inputs.simulationDuration_s}
                      onChange={(e) =>
                        updateInput(
                          'simulationDuration_s',
                          Number(e.target.value)
                        )
                      }
                      className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="proc-dt"
                      className="block text-[11px] text-slate-600"
                    >
                      Step <MathInline latex="\Delta t" /> (s)
                    </label>
                    <input
                      id="proc-dt"
                      type="number"
                      aria-label="Simulation Time Step (dt, s)"
                      min={0.05}
                      max={1.0}
                      step={0.05}
                      value={inputs.timeStep_dt_s}
                      onChange={(e) =>
                        updateInput('timeStep_dt_s', Number(e.target.value))
                      }
                      className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Setpoint, Disturbance & Open-Loop Step Inputs */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-teal-700" />
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
                    Step 2 · Experiment Forcing
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Setpoint, Load Disturbance &amp; Manual Step
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {!isOpenLoop ? (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <label
                        htmlFor="exp-ysp"
                        className="font-semibold text-slate-800"
                      >
                        Setpoint Target (<MathInline latex="Y_{\mathrm{sp}}" />)
                      </label>
                      <span className="font-mono font-bold text-teal-800">
                        {inputs.setpointTarget_Ysp.toFixed(1)} % PV
                      </span>
                    </div>
                    <input
                      id="exp-ysp"
                      type="range"
                      aria-label="Setpoint Target (Y_sp, %PV) slider"
                      min={10}
                      max={95}
                      step={1}
                      value={inputs.setpointTarget_Ysp}
                      onChange={(e) =>
                        updateInput(
                          'setpointTarget_Ysp',
                          Number(e.target.value)
                        )
                      }
                      className="w-full accent-teal-600"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <label
                        htmlFor="exp-du"
                        className="font-semibold text-slate-800"
                      >
                        Open-Loop Input Step (
                        <MathInline latex="\Delta u_{\mathrm{OL}}" />)
                      </label>
                      <span className="font-mono font-bold text-teal-800">
                        {inputs.openLoopStep_du >= 0 ? '+' : ''}
                        {inputs.openLoopStep_du.toFixed(1)} % MV
                      </span>
                    </div>
                    <input
                      id="exp-du"
                      type="range"
                      aria-label="Open-Loop Input Step (delta u_OL, %MV) slider"
                      min={-30}
                      max={30}
                      step={1}
                      value={inputs.openLoopStep_du}
                      onChange={(e) =>
                        updateInput('openLoopStep_du', Number(e.target.value))
                      }
                      className="w-full accent-teal-600"
                    />
                  </div>
                )}

                {/* Load Disturbance d(t) */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <label
                      htmlFor="exp-dist"
                      className="font-semibold text-slate-800"
                    >
                      Load Disturbance Step (<MathInline latex="d" />)
                    </label>
                    <span className="font-mono font-bold text-amber-800">
                      {inputs.disturbanceMagnitude_d >= 0 ? '+' : ''}
                      {inputs.disturbanceMagnitude_d.toFixed(1)} % MV
                    </span>
                  </div>
                  <input
                    id="exp-dist"
                    type="range"
                    aria-label="Load Disturbance Step (d, %MV) slider"
                    min={-25}
                    max={25}
                    step={1}
                    value={inputs.disturbanceMagnitude_d}
                    onChange={(e) =>
                      updateInput(
                        'disturbanceMagnitude_d',
                        Number(e.target.value)
                      )
                    }
                    className="w-full accent-amber-600"
                  />
                </div>

                {/* Step Times */}
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <label
                      htmlFor="exp-tstep"
                      className="block text-[11px] text-slate-600"
                    >
                      Setpoint Step <MathInline latex="t_{\mathrm{step}}" /> (s)
                    </label>
                    <input
                      id="exp-tstep"
                      type="number"
                      aria-label="Setpoint Step Time (t_step, s)"
                      min={0}
                      max={200}
                      step={1}
                      value={inputs.setpointStepTime_s}
                      onChange={(e) =>
                        updateInput(
                          'setpointStepTime_s',
                          Number(e.target.value)
                        )
                      }
                      className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="exp-tdist"
                      className="block text-[11px] text-slate-600"
                    >
                      Disturbance <MathInline latex="t_{\mathrm{dist}}" /> (s)
                    </label>
                    <input
                      id="exp-tdist"
                      type="number"
                      aria-label="Load Disturbance Step Time (t_dist, s)"
                      min={0}
                      max={400}
                      step={5}
                      value={inputs.disturbanceTime_s}
                      onChange={(e) =>
                        updateInput('disturbanceTime_s', Number(e.target.value))
                      }
                      className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 4: 10 Verified Educational Presets */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-3">
                <span className="text-[11px] font-bold tracking-wider text-teal-700 uppercase">
                  Benchmark Control Scenarios
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Load Verified Tuning &amp; Dynamic Preset
                </h2>
              </div>

              <div className="space-y-2">
                {PROCESS_CONTROL_PRESETS.map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/70 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">
                          {preset.name}
                        </span>
                        <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                          {preset.tag}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                        <MathText text={preset.expectedObservation} />
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: KPI Dashboard, Block Schematic, and Interactive Charts */}
          <div className="space-y-6 lg:col-span-8">
            {/* 8 KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <LabMetricCard
                label="Controller & Loop Status"
                value={
                  inputs.controllerMode === 'open-loop'
                    ? 'Open-Loop'
                    : `${inputs.controllerMode} Control`
                }
                subtext={results.metrics.stabilityStatus}
                valueClassName="text-xl text-teal-800"
              />

              <LabMetricCard
                label="Peak Output & Overshoot"
                value={
                  results.metrics.overshootPercent !== null
                    ? `${results.metrics.overshootPercent.toFixed(1)}% OS`
                    : `${results.metrics.peakOutput_Y.toFixed(1)}% PV`
                }
                subtext={`Peak Y = ${results.metrics.peakOutput_Y.toFixed(2)}% @ ${results.metrics.peakTime_s.toFixed(1)} s`}
              />

              <LabMetricCard
                label="10%–90% Rise Time ($t_r$)"
                value={
                  results.metrics.riseTime_10_90_s !== null
                    ? `${results.metrics.riseTime_10_90_s.toFixed(2)} s`
                    : 'Not Reached'
                }
                subtext={results.metrics.riseTimeStatus}
              />

              <LabMetricCard
                label="Settling Time ($\pm 2\%$ Band)"
                value={
                  results.metrics.settlingTime_2pct_s !== null
                    ? `${results.metrics.settlingTime_2pct_s.toFixed(1)} s`
                    : 'Unsettled'
                }
                subtext={results.metrics.settlingStatus}
                valueClassName={
                  results.metrics.isSettledWithinWindow
                    ? 'text-2xl text-slate-900'
                    : 'text-xl text-amber-800'
                }
              />

              <LabMetricCard
                label="Steady-State Error ($e_{\mathrm{ss}}$)"
                value={`${formatSignedZero(results.metrics.steadyStateError_ess, 2, { positivePrefix: true })}%`}
                subtext={
                  results.metrics.theoreticalProportionalOffset_ess !== null
                    ? `Theoretical P offset: ${formatSignedZero(results.metrics.theoreticalProportionalOffset_ess, 2)}%`
                    : `Final Y = ${results.metrics.finalOutput_Y.toFixed(2)}% (Target ${results.metrics.finalTarget_Y.toFixed(1)}%)`
                }
              />

              <LabMetricCard
                label="Integral Error ($\mathrm{IAE} / \mathrm{ITAE}$)"
                value={`${results.metrics.iae.toFixed(1)} %·s`}
                subtext={`ITAE = ${results.metrics.itae.toFixed(0)} %·s²`}
              />

              <LabMetricCard
                label="Actuator Effort & Saturation"
                value={
                  results.metrics.saturationDuration_s > 0
                    ? `Sat ${results.metrics.saturationDuration_s.toFixed(1)} s`
                    : 'Unsaturated'
                }
                subtext={`Total travel $\\mathrm{TV}_u = ${results.metrics.controlEffort_TV.toFixed(1)}\\%$ MV`}
              />

              <LabMetricCard
                label="Delay Ratio & Loop Gain"
                value={`$\\theta / \\tau$ = ${results.controllabilityRatio_theta_over_tau.toFixed(2)}`}
                subtext={`Loop gain $K_p K_c = ${results.loopGain_KpKc.toFixed(2)}$`}
              />
            </div>

            {/* Interactive Feedback Block Diagram Schematic */}
            <ProcessControlSchematic results={results} />

            {/* 5-Tab Dynamic Charts & Scenario Comparison Table */}
            <ProcessControlCharts
              results={results}
              modeComparison={modeComparison}
              sensitivityParameter={sensitivityParameter}
              onSelectSensitivityParameter={setSensitivityParameter}
              sensitivitySweep={sensitivitySweep}
              showAnalyticalReference={showAnalyticalReference}
              onToggleAnalyticalReference={setShowAnalyticalReference}
              savedScenarios={savedScenarios}
              onLoadScenario={(sc) => {
                setInputs({ ...sc.inputs });
                setActivePresetId('custom');
              }}
              onRemoveScenario={(id) =>
                setSavedScenarios((prev) => prev.filter((s) => s.id !== id))
              }
              onClearScenarios={() => setSavedScenarios([])}
            />
          </div>
        </div>

        {/* Model Assumptions & Scope */}
        <LabAssumptionsCard
          eyebrow="Process Control Model Scope & Numerical Discretization"
          title="First-Order-Plus-Dead-Time (FOPDT) & Discrete PID Assumptions"
          assumptions={PROCESS_CONTROL_ASSUMPTIONS}
        />

        {/* Expandable Theory & Governing Equations */}
        <LabTheoryDisclosureCard
          eyebrow="Process Dynamics & Control Theory Reference"
          title="FOPDT Differential Equations, Laplace Transfer Functions & PID Algorithms"
          subtitle="Complete mathematical formulation for open-loop first-order-plus-dead-time dynamics, P/PI/PID feedback laws, actuator saturation anti-windup, and time-integral performance indices."
          expandLabel="Show Full Control Derivations & Equations"
          collapseLabel="Hide Full Control Derivations"
          defaultExpanded={true}
          concepts={[
            {
              title: '1. First-Order & FOPDT Dynamics',
              body: 'A first-order process ($\\tau \\frac{dy}{dt} + y = K_p u(t - \\theta)$) combines steady-state sensitivity $K_p$, exponential holdup lag $\\tau$, and transport delay $\\theta$.',
            },
            {
              title: '2. P vs. PI Offset Elimination',
              body: 'Proportional control ($u = U_0 + K_c e$) leaves permanent steady-state offset $e_{\\mathrm{ss}} = \\frac{\\Delta r}{1 + K_p K_c}$. Integral reset ($\\frac{1}{\\tau_I}\\int e\\,dt$) drives $e_{\\mathrm{ss}} \\to 0$.',
            },
            {
              title: '3. Derivative on Measurement',
              body: 'Applying filtered derivative action to $-dY/dt$ rather than $de/dt$ provides predictive phase lead without spiking on step changes in $r(t)$.',
            },
            {
              title: '4. Saturation & Anti-Windup',
              body: 'Physical valves clamp at $[U_{\\min}, U_{\\max}]$. Conditional integration freezes $\\int e\\,dt$ during saturation to prevent windup overshoot.',
            },
          ]}
          detailedBlocks={[
            {
              title: 'Block 1 · FOPDT Process Dynamics',
              subtitle:
                'Deviation-variable differential equation, analytical step response, and Laplace transfer function.',
              equations: [
                {
                  label: 'FOPDT Differential Equation (with Load Disturbance)',
                  equationNumber: '6.1',
                  latex: '\\tau \\frac{dy(t)}{dt} + y(t) = K_p \\left[ u(t - \\theta) + d(t) \\right]',
                  tone: 'teal',
                },
                {
                  label: 'Laplace-Domain Process Transfer Function',
                  equationNumber: '6.2',
                  latex: 'G_p(s) = \\frac{Y(s)}{U(s)} = \\frac{K_p e^{-\\theta s}}{\\tau s + 1}',
                },
                {
                  label: 'Analytical Open-Loop Step Response (t > t_step + θ)',
                  equationNumber: '6.3',
                  latex: 'Y(t) = Y_0 + K_p \\Delta u \\left[ 1 - \\exp\\!\\left(-\\frac{t - t_{\\mathrm{step}} - \\theta}{\\tau}\\right) \\right]',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'K_p',
                  description: 'Steady-state process gain',
                  unitLatex: '\\%\\,\\mathrm{PV} / \\%\\,\\mathrm{MV}',
                },
                {
                  symbolLatex: '\\tau',
                  description: 'First-order process time constant (63.2% response time)',
                  unitLatex: '\\mathrm{s}',
                },
                {
                  symbolLatex: '\\theta',
                  description: 'Process dead time / transport lag',
                  unitLatex: '\\mathrm{s}',
                },
              ],
            },
            {
              title: 'Block 2 · P, PI & Filtered PID Control Laws',
              subtitle:
                'Feedback error definition, ISA parallel PID law with derivative-on-measurement, and P-only offset.',
              equations: [
                {
                  label: 'Feedback Tracking Error & P-Only Steady-State Offset',
                  equationNumber: '6.4',
                  latex: 'e(t) = r(t) - Y(t), \\qquad e_{\\mathrm{ss,P}} = \\frac{\\Delta r - K_p d}{1 + K_p K_c}',
                },
                {
                  label: 'ISA Standard PID Law (Derivative on Measurement)',
                  equationNumber: '6.5',
                  latex: 'u_{\\mathrm{cmd}}(t) = U_0 + K_c \\left[ e(t) + \\frac{1}{\\tau_I}\\int_0^t e(\\tau^{\\prime})\\,d\\tau^{\\prime} - D_f(t) \\right]',
                  tone: 'teal',
                },
                {
                  label: 'First-Order Filtered Derivative State',
                  equationNumber: '6.6',
                  latex: '(\\alpha_D \\tau_D)\\frac{dD_f(t)}{dt} + D_f(t) = \\tau_D \\frac{dY(t)}{dt}',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'K_c',
                  description: 'Controller proportional gain',
                  unitLatex: '\\%\\,\\mathrm{MV} / \\%\\,\\mathrm{PV}',
                },
                {
                  symbolLatex: '\\tau_I, \\tau_D',
                  description: 'Integral reset time and derivative time',
                  unitLatex: '\\mathrm{s}',
                },
                {
                  symbolLatex: '\\alpha_D',
                  description: 'Derivative filter factor (0.05 to 0.50)',
                  unitLatex: '\\text{dimensionless}',
                },
              ],
            },
            {
              title: 'Block 3 · Saturation & Performance Integrals',
              subtitle:
                'Actuator clamping, conditional anti-windup, IAE, ITAE, and Total Variation control effort.',
              equations: [
                {
                  label: 'Actuator Saturation Nonlinearity',
                  equationNumber: '6.7',
                  latex: 'U_{\\mathrm{act}}(t) = \\min\\!\\left(U_{\\max},\\; \\max\\!\\left(U_{\\min},\\; u_{\\mathrm{cmd}}(t)\\right)\\right)',
                },
                {
                  label: 'Integral Error Indices (IAE & ITAE)',
                  equationNumber: '6.8',
                  latex: '\\mathrm{IAE} = \\int_0^{t_{\\mathrm{sim}}} |e(t)|\\,dt, \\qquad \\mathrm{ITAE} = \\int_0^{t_{\\mathrm{sim}}} (t - t_0)\\,|e(t)|\\,dt',
                  tone: 'teal',
                },
                {
                  label: 'Total Variation Actuator Control Effort',
                  equationNumber: '6.9',
                  latex: '\\mathrm{TV}_u = \\sum_{k=1}^{N} \\left| U_{\\mathrm{act}}(t_k) - U_{\\mathrm{act}}(t_{k-1}) \\right|',
                },
              ],
              definitions: [
                {
                  symbolLatex: 'u_{\\mathrm{cmd}}, U_{\\mathrm{act}}',
                  description: 'Unconstrained controller demand vs. physical saturated actuator signal',
                  unitLatex: '\\%\\,\\mathrm{MV}',
                },
                {
                  symbolLatex: '\\mathrm{IAE}, \\mathrm{ITAE}',
                  description: 'Integral Absolute Error and Time-Weighted Absolute Error',
                  unitLatex: '\\%\\cdot\\mathrm{s}, \\%\\cdot\\mathrm{s}^2',
                },
              ],
            },
          ]}
        />

        {/* Step 4: 10 Guided Inquiry Exercises */}
        <LabGuidedInquiryCard
          questions={PROCESS_CONTROL_GUIDED_QUESTIONS}
          onApplyInputs={(suggested) => {
            setInputs({ ...suggested });
            setActivePresetId('custom');
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }
          }}
          derivationHeading="Process Dynamics & Feedback Control Derivation"
        />
      </div>
    </section>
  );
}
