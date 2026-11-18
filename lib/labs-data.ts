import type { SharedGuidedQuestion } from '@/components/lab-shared';
import type { FluidMechanicsInputs } from '@/lib/fluid-mechanics';
import type { ReactionEngineeringInputs } from '@/lib/reaction-engineering';
import {
  DEFAULT_DISTILLATION_INPUTS,
  calculateDistillation,
  type DistillationInputs,
} from '@/lib/distillation';
import type { PureFluidPVTInputs, BinaryVLEInputs } from '@/lib/thermodynamics';
import type { ProcessControlInputs } from '@/lib/process-control';

export interface LabModule {
  id: string;
  title: string;
  category: string;
  status: 'Available' | 'Coming Soon';
  roadmapPhase: string;
  duration: string;
  level: string;
  description: string;
  keyTopics: string[];
  governingEquation: string;
  governingEquationLatex: string;
  iconName: 'flame' | 'layers' | 'flask' | 'gauge' | 'waves' | 'sliders';
}

export const LABORATORY_MODULES: LabModule[] = [
  {
    id: 'heat-exchanger',
    title: 'Heat Exchanger Virtual Laboratory',
    category: 'Heat Transfer & Energy Systems',
    status: 'Available',
    roadmapPhase: 'Phase 1 / 1.1 · Live Now',
    duration: '45 min lab',
    level: 'Undergraduate Core',
    description:
      'Analyze steady-state ideal countercurrent heat exchangers using the effectiveness–NTU ($\\varepsilon\\text{–}\\mathrm{NTU}$) method. Investigate capacity rate ratios, temperature approach, temperature cross, and surface area scaling.',
    keyTopics: [
      'Effectiveness–NTU Method',
      'Capacity Ratio ($C_r$)',
      'Temperature Cross',
      'Energy Conservation',
    ],
    governingEquation: 'Q = ε · Cmin · (Th,in − Tc,in)',
    governingEquationLatex: 'Q = \\varepsilon C_{\\min}\\left(T_{h,\\mathrm{in}} - T_{c,\\mathrm{in}}\\right)',
    iconName: 'flame',
  },
  {
    id: 'fluid-mechanics',
    title: 'Fluid Mechanics & Pipe Hydraulics',
    category: 'Momentum Transport & Piping',
    status: 'Available',
    roadmapPhase: 'Phase 1.2 · Live Now',
    duration: '40 min lab',
    level: 'Sophomore / Junior',
    description:
      'Simulate steady, incompressible pipe flow hydraulics using Reynolds regime classification ($\\mathrm{Re} = \\rho v D / \\mu$), the Colebrook–White friction equation, Darcy–Weisbach major and minor head losses, and required pump head.',
    keyTopics: [
      'Darcy–Weisbach Head Loss',
      'Colebrook–White & Moody Chart',
      'Major vs. Minor Losses',
      'Required Pump Head & Power',
    ],
    governingEquation: 'hf = f_D · (L / D) · (v² / 2g)',
    governingEquationLatex: 'h_f = f_D \\frac{L}{D} \\frac{v^2}{2g}',
    iconName: 'waves',
  },
  {
    id: 'reaction-engineering',
    title: 'Chemical Reaction Engineering',
    category: 'Kinetics & Reactor Design',
    status: 'Available',
    roadmapPhase: 'Phase 2.1 · Live Now',
    duration: '50 min lab',
    level: 'Undergraduate Core',
    description:
      'Simulate isothermal, constant-density, irreversible first-order reaction kinetics ($A \\rightarrow B$) across Batch, Ideal CSTR, and Ideal PFR reactors. Compare conversion, residence time, spatial profiles, and target sizing.',
    keyTopics: [
      'Batch vs. CSTR vs. PFR',
      'First-Order Kinetics ($-r_A = kC_A$)',
      'Residence Time & Damköhler',
      'Target Conversion Sizing',
    ],
    governingEquation: 'Batch/PFR: X = 1 − e^(−kτ) · CSTR: X = kτ / (1 + kτ)',
    governingEquationLatex: 'X_{\\mathrm{PFR}} = 1 - e^{-k\\tau}, \\quad X_{\\mathrm{CSTR}} = \\frac{k\\tau}{1 + k\\tau}',
    iconName: 'flask',
  },
  {
    id: 'distillation',
    title: 'Distillation & Separation Processes',
    category: 'Mass Transfer & Separations',
    status: 'Available',
    roadmapPhase: 'Phase 2.2 · Live Now',
    duration: '60 min lab',
    level: 'Junior / Senior',
    description:
      'Simulate steady-state binary fractional distillation using the McCabe–Thiele method. Explore relative volatility ($\\alpha$), reflux ratio trade-offs, feed thermal condition ($q$-line), minimum reflux pinch points, and theoretical equilibrium stage requirements.',
    keyTopics: [
      'McCabe–Thiele Stage Stepping',
      'Vapor–Liquid Equilibrium ($\\alpha$)',
      'Reflux Ratio & Minimum Reflux',
      'Feed Condition ($q$-Line) & Feed Stage',
    ],
    governingEquation: 'y* = αx / [1 + (α − 1)x] · y_ROL = [R/(R + 1)]x + xD/(R + 1)',
    governingEquationLatex: 'y^* = \\frac{\\alpha x}{1 + (\\alpha - 1)x}, \\quad y_{\\mathrm{ROL}} = \\frac{R}{R+1}x + \\frac{x_D}{R+1}',
    iconName: 'layers',
  },
  {
    id: 'thermodynamics',
    title: 'Chemical Engineering Thermodynamics',
    category: 'Phase Equilibria & Equations of State',
    status: 'Available',
    roadmapPhase: 'Phase 2.3 · Live Now',
    duration: '55 min lab',
    level: 'Sophomore / Junior',
    description:
      'Explore pure-fluid PVT non-ideality using the Peng–Robinson cubic Equation of State ($Z = Pv/RT$, critical constants $T_c, P_c, \\omega$, and subcritical 3-root analysis) alongside isothermal binary Vapor–Liquid Equilibrium ($P\\text{–}x\\text{–}y$ and Raoult–Dalton phase envelopes).',
    keyTopics: [
      'Peng–Robinson Cubic EOS',
      'Compressibility Factor ($Z$)',
      'Raoult’s & Dalton’s Laws',
      'Isothermal $P\\text{–}x\\text{–}y$ Diagrams',
    ],
    governingEquation: 'P = RT/(v − b) − aα/[v(v + b) + b(v − b)] · P_bubble = xA·PA^sat + xB·PB^sat',
    governingEquationLatex: 'P = \\frac{RT}{v - b} - \\frac{a\\alpha}{v(v + b) + b(v - b)}, \\quad P_{\\mathrm{bubble}} = x_A P_A^{\\mathrm{sat}} + x_B P_B^{\\mathrm{sat}}',
    iconName: 'gauge',
  },
  {
    id: 'process-control',
    title: 'Process Dynamics & Control',
    category: 'Dynamics & Feedback Automation',
    status: 'Available',
    roadmapPhase: 'Phase 2.4 · Live Now',
    duration: '55 min lab',
    level: 'Senior / Advanced',
    description:
      'Simulate first-order-plus-dead-time (FOPDT) process dynamics ($\\tau \\frac{dy}{dt} + y = K_p u(t - \\theta)$) and tune P, PI, and PID feedback controllers. Investigate setpoint tracking, load disturbance rejection, actuator saturation, and integral anti-windup.',
    keyTopics: [
      'FOPDT Dynamics ($K_p, \\tau, \\theta$)',
      'P, PI & Filtered PID Control',
      'Setpoint vs. Disturbance Rejection',
      'Actuator Saturation & Anti-Windup',
    ],
    governingEquation: 'τ dy/dt + y = Kp·u(t − θ) · u_cmd = U0 + Kc[e + (1/τI)∫e dt − Df]',
    governingEquationLatex: '\\tau \\frac{dy}{dt} + y = K_p u(t - \\theta), \\quad G_c(s) = K_c\\left(1 + \\frac{1}{\\tau_I s} + \\frac{\\tau_D s}{\\alpha_D \\tau_D s + 1}\\right)',
    iconName: 'sliders',
  },
];

export interface GuidedQuestion {
  id: string;
  conditionTag: string;
  number: string;
  question: string;
  experimentPrompt: string;
  presetActionLabel: string;
  suggestedInputs: {
    Th_in: number;
    Tc_in: number;
    mh: number;
    mc: number;
    Cph_kJ: number;
    Cpc_kJ: number;
    U: number;
    A: number;
  };
  selfCheckPrompt: string;
  selfCheckOptions: {
    id: string;
    label: string;
    isCorrect: boolean;
    feedback: string;
  }[];
  keyObservation: string;
  engineeringExplanation: string;
}

export const GUIDED_EXPLORATION_QUESTIONS: GuidedQuestion[] = [
  {
    id: 'q1-area-saturation',
    conditionTag: 'Exploration 01 · Asymptotic Area Scaling',
    number: '01',
    question:
      'Why does doubling the heat transfer area (A) from 12 m² to 24 m² NOT double the heat transfer rate (Q)?',
    experimentPrompt:
      '1) Observe Q and ε at the baseline (A = 12.0 m², Q = 397.59 kW, ε = 66.75%) and snapshot it. 2) Apply A = 24.0 m² below and compare the two runs in the comparison table.',
    presetActionLabel: 'Apply A = 24.0 m² Test Condition',
    suggestedInputs: {
      Th_in: 120,
      Tc_in: 25,
      mh: 2.0,
      mc: 1.5,
      Cph_kJ: 4.18,
      Cpc_kJ: 4.18,
      U: 850,
      A: 24.0,
    },
    selfCheckPrompt: 'Before revealing the derivation, check your physical conclusion:',
    selfCheckOptions: [
      {
        id: 'q1-opt-a',
        label: 'Heat duty Q doubles whenever NTU doubles, because Q = U · A · ΔTmax.',
        isCorrect: false,
        feedback:
          'Not quite. The driving force ΔT(x) is not constant at ΔTmax—as fluids exchange heat along the exchanger, Th(x) cools and Tc(x) warms, reducing the local ΔT.',
      },
      {
        id: 'q1-opt-b',
        label: 'Added area reduces the mean temperature difference (LMTD), yielding diminishing returns as ε approaches 100%.',
        isCorrect: true,
        feedback:
          'Correct! Doubling A from 12 to 24 m² doubles NTU (1.627 → 3.254), but LMTD drops from 38.98 °C to 24.35 °C, so Q increases by only +24.9% (397.59 → 496.74 kW).',
      },
      {
        id: 'q1-opt-c',
        label: 'The overall heat transfer coefficient U automatically decreases when area A increases.',
        isCorrect: false,
        feedback:
          'In this constant-property model, U is held constant at 850 W/(m²·K). The diminishing return comes strictly from shrinking thermal driving force ΔT(x) along the exchanger.',
      },
    ],
    keyObservation:
      'Doubling A from 12.0 m² to 24.0 m² doubles NTU from 1.627 to 3.254, raising effectiveness ε from 66.75% to 83.39% and heat duty Q from 397.59 kW to 496.74 kW (+24.9%, not +100%).',
    engineeringExplanation:
      'As heat transfer area increases, the hot and cold streams approach each other in temperature along the exchanger, reducing LMTD from 38.98 °C to 24.35 °C. Because countercurrent effectiveness ε = [1 − exp(−NTU(1 − Cr))] / [1 − Cr·exp(−NTU(1 − Cr))] asymptotically approaches 100% as NTU → ∞, each additional square meter transfers less heat than the previous one.',
  },
  {
    id: 'q2-balanced-capacity',
    conditionTag: 'Exploration 02 · Balanced Capacity Ratio (Cr = 1)',
    number: '02',
    question:
      'What happens to the axial temperature profile and driving force ΔT(x) when both streams have identical heat capacity rates (Ch = Cc, so Cr = 1)?',
    experimentPrompt:
      '1) Set mh = 2.0 kg/s and mc = 2.0 kg/s with Cp = 4.18 kJ/(kg·K) (or click the test button). 2) Inspect the Axial Temperature Profile chart and compare ΔT1 vs. ΔT2.',
    presetActionLabel: 'Apply Balanced Flow (Cr = 1.0)',
    suggestedInputs: {
      Th_in: 120,
      Tc_in: 25,
      mh: 2.0,
      mc: 2.0,
      Cph_kJ: 4.18,
      Cpc_kJ: 4.18,
      U: 850,
      A: 12.0,
    },
    selfCheckPrompt: 'What do you observe in the axial temperature profile when Cr = 1.000?',
    selfCheckOptions: [
      {
        id: 'q2-opt-a',
        label: 'Hot and cold profiles become parallel straight lines with a uniform local ΔT(x) across the entire length.',
        isCorrect: true,
        feedback:
          'Correct! When Ch = Cc, both streams change temperature at equal rates per unit heat transferred (dTh/dx = dTc/dx), keeping ΔT(x) = 42.79 °C constant from x/L = 0 to 1.',
      },
      {
        id: 'q2-opt-b',
        label: 'The hot and cold temperatures cross and become equal in the middle of the exchanger.',
        isCorrect: false,
        feedback:
          'Look at the axial profile chart: Th(x) remains strictly above Tc(x) everywhere by a constant 42.79 °C.',
      },
      {
        id: 'q2-opt-c',
        label: 'Effectiveness reaches 100% regardless of NTU whenever Ch = Cc.',
        isCorrect: false,
        feedback:
          'At Cr = 1, effectiveness is ε = NTU / (1 + NTU). For NTU = 1.220, ε = 54.96%—never 100% for finite area.',
      },
    ],
    keyObservation:
      'At Cr = 1.000 (NTU = 1.220, ε = 54.96%, Q = 436.46 kW), the hot and cold axial temperature curves become parallel straight lines with a constant local driving force ΔT(x) = 42.79 °C.',
    engineeringExplanation:
      'From the differential energy balances dTh/dx = −(UA/Ch)ΔT and dTc/dx = −(UA/Cc)ΔT, setting Ch = Cc forces dTh/dx = dTc/dx everywhere. Therefore d(Th − Tc)/dx = 0, meaning ΔT is uniform across the exchanger (ΔT1 = ΔT2 = LMTD) and effectiveness simplifies to ε = NTU / (1 + NTU).',
  },
  {
    id: 'q3-temperature-cross',
    conditionTag: 'Exploration 03 · Countercurrent Temperature Cross',
    number: '03',
    question:
      'Can the cold fluid outlet temperature (Tc,out) exceed the hot fluid outlet temperature (Th,out) without violating the Second Law of Thermodynamics?',
    experimentPrompt:
      '1) Apply the High-NTU scenario below (U = 1200 W/(m²·K), A = 24.0 m²). 2) Compare Tc,out against Th,out in the schematic and verify Th(x) > Tc(x) along the axial profile chart.',
    presetActionLabel: 'Apply Temperature Cross Scenario',
    suggestedInputs: {
      Th_in: 130,
      Tc_in: 20,
      mh: 1.6,
      mc: 1.5,
      Cph_kJ: 4.18,
      Cpc_kJ: 4.18,
      U: 1200,
      A: 24.0,
    },
    selfCheckPrompt: 'How do you interpret Tc,out > Th,out in the countercurrent results?',
    selfCheckOptions: [
      {
        id: 'q3-opt-a',
        label: 'It violates the Second Law of Thermodynamics because heat cannot flow from a colder outlet to a warmer outlet.',
        isCorrect: false,
        feedback:
          'Look closely at the schematic: Tc,out exits at x/L = 0 (the hot inlet end, 130 °C), whereas Th,out exits at x/L = 1 (the cold inlet end, 20 °C).',
      },
      {
        id: 'q3-opt-b',
        label: 'It is physically valid in countercurrent flow because at every axial location x/L, Th(x) remains strictly greater than Tc(x).',
        isCorrect: true,
        feedback:
          'Correct! Tc,out (112.76 °C) is heated by the entering hot stream (130 °C) at x/L = 0, while Th,out (43.04 °C) is cooled by the entering cold stream (20 °C) at x/L = 1.',
      },
    ],
    keyObservation:
      'Yes—at NTU = 4.593 (ε = 84.33%, Q = 581.61 kW), Cold Outlet Tc,out reaches 112.76 °C while Hot Outlet Th,out cools to 43.04 °C (a 69.72 °C temperature cross), while Th(x) > Tc(x) holds at every axial position.',
    engineeringExplanation:
      'In countercurrent flow, the exiting cold fluid (at x/L = 0) exchanges heat with the entering hot fluid (Th,in = 130 °C), not with the exiting hot fluid (at x/L = 1). As long as local ΔT(x) = Th(x) − Tc(x) > 0 everywhere (guaranteed for 0 < ε < 1), heat always flows down a positive thermal gradient, enabling high heat recovery impossible in cocurrent flow.',
  },
];

export const FLUID_GUIDED_EXPLORATION_QUESTIONS: SharedGuidedQuestion<FluidMechanicsInputs>[] = [
  {
    id: 'fluid-q1-reynolds-flow',
    conditionTag: 'Exploration 01 · Reynolds Scaling with Flow Rate',
    number: '01',
    question:
      'What happens to the Reynolds number (Re) and frictional pressure loss (ΔP) when volumetric flow rate doubles from 10 L/s to 20 L/s?',
    experimentPrompt:
      '1) Snapshot the 20 °C water baseline (Q = 10.0 L/s, Re = 158,551, ΔP = 57.15 kPa). 2) Apply Q = 20.0 L/s below and compare Re, f_D, and ΔP in the Scenario Comparison Table.',
    presetActionLabel: 'Apply Q = 20.0 L/s Test Condition',
    suggestedInputs: {
      flowRate_L_s: 20.0,
      diameter_m: 0.08,
      length_m: 100,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.045,
      minorLossK: 4.5,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 75,
    },
    selfCheckPrompt: 'How do Re and frictional ΔP respond when volumetric flow rate Q doubles?',
    selfCheckOptions: [
      {
        id: 'fq1-opt-a',
        label: 'Re doubles linearly (2×), while frictional ΔP nearly quadruples (~3.8×) because head loss scales with v².',
        isCorrect: true,
        feedback:
          'Correct! Doubling Q doubles average velocity v (1.99 → 3.98 m/s) and Re (158,551 → 317,103). Since Darcy–Weisbach losses scale with v², ΔP jumps from 57.15 kPa to 218.16 kPa (slightly under 4× because f_D decreases from 0.0195 to 0.0185).',
      },
      {
        id: 'fq1-opt-b',
        label: 'Both Re and frictional ΔP double by exactly 2×.',
        isCorrect: false,
        feedback:
          'Look at the Frictional Pressure Loss vs. Flow Rate chart: ΔP curves upward quadratically (57.15 kPa → 218.16 kPa), not linearly.',
      },
      {
        id: 'fq1-opt-c',
        label: 'Re stays constant because pipe diameter D and viscosity μ did not change.',
        isCorrect: false,
        feedback:
          'Reynolds number Re = ρvD/μ depends directly on velocity v = Q/A, so doubling Q doubles Re.',
      },
    ],
    keyObservation:
      'Doubling Q from 10.0 to 20.0 L/s exactly doubles Re (158,551 → 317,103) and velocity (1.99 → 3.98 m/s), while frictional pressure loss rises 3.82× (57.15 → 218.16 kPa) and required shaft power increases 7.64× (0.76 → 5.82 kW).',
    engineeringExplanation:
      'For fixed pipe cross-sectional area A = πD²/4 and constant fluid properties (ρ, μ), Re = (4ρQ)/(πDμ) is strictly proportional to Q. Meanwhile, Darcy–Weisbach head losses scale with kinetic head v²/(2g) ∝ Q², tempered only slightly in turbulent flow by a modest drop in f_D along the Colebrook–White curve.',
  },
  {
    id: 'fluid-q2-diameter-scaling',
    conditionTag: 'Exploration 02 · Diameter Sensitivity (D⁻⁵ Law)',
    number: '02',
    question:
      'Why does reducing internal pipe diameter from 0.08 m to 0.05 m dramatically increase frictional pressure losses at the same 10 L/s flow rate?',
    experimentPrompt:
      '1) Compare the baseline 0.08 m pipe (ΔP = 57.15 kPa) against D = 0.05 m at the same Q = 10.0 L/s. 2) Apply D = 0.05 m below and inspect velocity v and head losses.',
    presetActionLabel: 'Apply Narrow Pipe (D = 0.05 m)',
    suggestedInputs: {
      flowRate_L_s: 10.0,
      diameter_m: 0.05,
      length_m: 100,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.045,
      minorLossK: 4.5,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 75,
    },
    selfCheckPrompt: 'What physical mechanism explains the steep rise in ΔP when diameter shrinks?',
    selfCheckOptions: [
      {
        id: 'fq2-opt-a',
        label: 'Shrinking D raises v ∝ D⁻² (so v² ∝ D⁻⁴) and increases L/D ∝ D⁻¹, producing ~D⁻⁵ major loss scaling.',
        isCorrect: true,
        feedback:
          'Correct! Cutting D from 0.08 m to 0.05 m raises velocity from 1.99 to 5.09 m/s (2.56×) and drives frictional ΔP up more than 10× from 57.15 kPa to 585.15 kPa.',
      },
      {
        id: 'fq2-opt-b',
        label: 'Smaller pipes always force flow into the Laminar regime where f_D = 64/Re is larger.',
        isCorrect: false,
        feedback:
          'Actually, Re = 4ρQ/(πDμ) increases when D decreases at fixed Q (158,551 → 253,682), pushing the flow even deeper into turbulence!',
      },
      {
        id: 'fq2-opt-c',
        label: 'Fluid density ρ increases inside narrower pipes.',
        isCorrect: false,
        feedback:
          'This model treats the liquid as incompressible with constant density ρ = 998.2 kg/m³.',
      },
    ],
    keyObservation:
      'Reducing D from 0.080 m to 0.050 m at Q = 10.0 L/s raises velocity from 1.99 to 5.09 m/s, increases Re from 158,551 to 253,682, and increases frictional ΔP 10.2× from 57.15 kPa to 585.15 kPa.',
    engineeringExplanation:
      'Substituting v = Q / (πD²/4) into the Darcy–Weisbach equation yields hf = f_D · (8 L Q²) / (π² g D⁵). That fifth-power inverse dependence on diameter makes pipe sizing one of the strongest levers in chemical plant hydraulics.',
  },
  {
    id: 'fluid-q3-pipe-roughness',
    conditionTag: 'Exploration 03 · Wall Roughness & Moody Diagram',
    number: '03',
    question:
      'How does increasing pipe wall roughness (ε) affect turbulent friction factors compared to smooth pipes or laminar flow?',
    experimentPrompt:
      '1) Compare Smooth Drawn Tubing (ε = 0.0015 mm, f_D = 0.0159, ΔP = 65.21 kPa) against Rough Cast-Iron (ε = 0.80 mm) at Q = 12.0 L/s. 2) Apply the rough-pipe condition below and inspect the Moody-Style Diagram.',
    presetActionLabel: 'Apply Rough Pipe (ε = 0.80 mm)',
    suggestedInputs: {
      flowRate_L_s: 12.0,
      diameter_m: 0.08,
      length_m: 100,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.8,
      minorLossK: 3.0,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 75,
    },
    selfCheckPrompt: 'How does wall roughness ε influence Darcy friction factor f_D across regimes?',
    selfCheckOptions: [
      {
        id: 'fq3-opt-a',
        label: 'Roughness strongly raises f_D in turbulent flow (moving up the Moody diagram), whereas laminar flow (64/Re) is independent of ε.',
        isCorrect: true,
        feedback:
          'Correct! At Re = 190,262, raising ε from 0.0015 mm to 0.80 mm lifts f_D from 0.0159 to 0.0382 and doubles frictional ΔP (65.21 → 144.44 kPa). In contrast, laminar flow follows f_D = 64/Re regardless of ε.',
      },
      {
        id: 'fq3-opt-b',
        label: 'Roughness increases f_D by the same percentage in both laminar and turbulent flow.',
        isCorrect: false,
        feedback:
          'In laminar flow, fluid layers glide smoothly over wall micro-asperities so f_D = 64/Re depends solely on Re, not ε/D.',
      },
      {
        id: 'fq3-opt-c',
        label: 'Higher roughness lowers Re by slowing down the mass balance.',
        isCorrect: false,
        feedback:
          'For a prescribed volumetric flow rate Q = 12.0 L/s, velocity v = 2.39 m/s and Re = 190,262 stay fixed; roughness increases the pressure drop needed to sustain that flow.',
      },
    ],
    keyObservation:
      'At Q = 12.0 L/s (Re = 190,262), raising ε from 0.0015 mm (ε/D = 1.88×10⁻⁵) to 0.80 mm (ε/D = 0.010) increases f_D from 0.0159 to 0.0382 (+140%) and frictional ΔP from 65.21 to 144.44 kPa (+122%), clearly separating the active Colebrook–White curve from the dashed smooth-pipe limit.',
    engineeringExplanation:
      'In turbulent flow, eddies thin the viscous sublayer near the pipe wall. When wall roughness elements protrude through that thin sublayer, form drag dominates viscous shear and f_D rises toward the fully rough plateau governed by ε/D in the Colebrook–White equation.',
  },
  {
    id: 'fluid-q4-pumping-power',
    conditionTag: 'Exploration 04 · Pumping Head & Shaft Power Scaling',
    number: '04',
    question:
      'Why does pumping at higher flow rates demand disproportionately more shaft power (Ps), especially when lifting fluid across an elevation rise?',
    experimentPrompt:
      '1) Observe the Elevated Process Transfer Line preset or test Q = 15.0 L/s with Δz = 10.0 m below. 2) Inspect the Required Pump Head vs. Flow Rate chart and compare static Δz against friction losses.',
    presetActionLabel: 'Apply Elevated Flow (Q = 15 L/s, Δz = 10 m)',
    suggestedInputs: {
      flowRate_L_s: 15.0,
      diameter_m: 0.08,
      length_m: 120,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.045,
      minorLossK: 6.0,
      elevationDiff_m: 10.0,
      pumpEfficiency_pct: 75,
    },
    selfCheckPrompt: 'Why does pump shaft power Ps grow faster than linearly with flow rate Q?',
    selfCheckOptions: [
      {
        id: 'fq4-opt-a',
        label: 'Because Ps = (ρ g Q H) / η multiplies Q by a total head H = Δz + hf + hm that itself grows quadratically with Q.',
        isCorrect: true,
        feedback:
          'Correct! Going from Q = 8 L/s (H = 14.65 m, Ps = 1.53 kW) to Q = 15 L/s (H = 25.57 m, Ps = 5.01 kW) increases flow by 1.88× while shaft power jumps 3.27×.',
      },
      {
        id: 'fq4-opt-b',
        label: 'Because static elevation head Δz increases whenever flow rate Q increases.',
        isCorrect: false,
        feedback:
          'Static elevation Δz = 10.0 m is a fixed geometric height difference; only the frictional losses (hf + hm) rise with Q².',
      },
      {
        id: 'fq4-opt-c',
        label: 'Because pump shaft power depends only on Δz and ignores pipe friction.',
        isCorrect: false,
        feedback:
          'At Q = 15 L/s here, friction contributes 15.57 m of head (hf = 12.85 m, hm = 2.72 m), exceeding the 10.0 m static lift.',
      },
    ],
    keyObservation:
      'At Q = 15.0 L/s with Δz = 10.0 m, total required pump head reaches H = 25.57 m (10.00 m static lift + 12.85 m major loss + 2.72 m minor loss), requiring Ph = 3.76 kW hydraulic power and Ps = 5.01 kW shaft power at η = 75%.',
    engineeringExplanation:
      'From the mechanical energy balance (P1 = P2), required pump head is H = Δz + (hf + hm), where Δz is constant and (hf + hm) ∝ Q². Multiplying by mass flow ρQ gives Ph = ρgQΔz + ρgQ(hf + hm), so the friction power penalty grows roughly as Q³.',
  },
  {
    id: 'fluid-q5-major-minor-losses',
    conditionTag: 'Exploration 05 · Major Wall Friction vs. Minor Fitting Losses',
    number: '05',
    question:
      'How do major straight-pipe losses (hf) and minor fitting losses (hm) contribute to total ΔP in long pipelines versus short, fitting-dense headers?',
    experimentPrompt:
      '1) Notice in the 100 m baseline that major loss (hf = 4.93 m) dominates minor loss (hm = 0.91 m). 2) Apply the short, valve-dense header (L = 20 m, ΣK = 25) below and compare hf vs. hm.',
    presetActionLabel: 'Apply Short Header (L = 20 m, K = 25)',
    suggestedInputs: {
      flowRate_L_s: 12.0,
      diameter_m: 0.08,
      length_m: 20,
      density_kg_m3: 998.2,
      viscosity_Pa_s: 0.001002,
      roughness_mm: 0.045,
      minorLossK: 25.0,
      elevationDiff_m: 0,
      pumpEfficiency_pct: 75,
    },
    selfCheckPrompt: 'When can "minor" fitting losses exceed "major" straight-pipe friction losses?',
    selfCheckOptions: [
      {
        id: 'fq5-opt-a',
        label: 'When total fitting K exceeds f_D·(L/D)—common in short process manifolds with multiple valves, bends, and contractions.',
        isCorrect: true,
        feedback:
          'Correct! Here f_D·(L/D) = 0.0192 × (20/0.08) = 4.80, whereas ΣK = 25.0, so minor losses (hm = 7.26 m) account for 84% of total frictional ΔP (84.78 kPa) while major loss is only hf = 1.40 m.',
      },
      {
        id: 'fq5-opt-b',
        label: 'Minor losses never exceed 10% of major losses regardless of pipe length L or K.',
        isCorrect: false,
        feedback:
          'Inspect the Hydraulic Losses cards after applying L = 20 m, K = 25: hm = 7.26 m is over 5× larger than hf = 1.40 m!',
      },
      {
        id: 'fq5-opt-c',
        label: 'Minor losses depend on wall roughness ε rather than kinetic head v²/(2g).',
        isCorrect: false,
        feedback:
          'In this lumped-K model, hm = K · v²/(2g) depends on fitting geometry coefficient ΣK and velocity head, not straight-pipe ε.',
      },
    ],
    keyObservation:
      'In the short L = 20 m header with ΣK = 25.0 (Q = 12.0 L/s, D = 0.08 m), minor fitting loss hm = 7.26 m far exceeds major wall friction hf = 1.40 m, contributing 83.8% of the 84.78 kPa total frictional pressure drop.',
    engineeringExplanation:
      'Total friction head is hf + hm = [f_D(L/D) + ΣK] · (v²/2g). Comparing dimensionless terms f_D(L/D) vs. ΣK immediately shows whether straight-pipe friction (long transmission lines) or local flow separation in valves and elbows (short plant headers) dominates.',
  },
];

export const REACTION_GUIDED_EXPLORATION_QUESTIONS: SharedGuidedQuestion<ReactionEngineeringInputs>[] = [
  {
    id: 'rxn-q1-pfr-vs-cstr',
    conditionTag: 'Exploration 01 · PFR vs. CSTR Conversion at Equal Volume',
    number: '01',
    question:
      'At identical reactor volume V = 1.5 m³, feed flow rate q = 0.02 m³/s (τ = 75 s), and positive first-order rate constant k = 0.02 s⁻¹, why does an Ideal PFR achieve higher conversion than an Ideal CSTR?',
    experimentPrompt:
      '1) Apply the CSTR configuration below (X = 60.00%, CA = 400.0 mol/m³) and snapshot it. 2) Switch reactor type to Ideal PFR and inspect Conversion X and the Conversion vs. Residence Time τ chart.',
    presetActionLabel: 'Apply Equal-Volume CSTR Baseline',
    suggestedInputs: {
      reactorType: 'cstr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.02,
      reactorVolume_m3: 1.5,
      volumetricFlowRate_m3_s: 0.02,
      batchTime_s: 75,
      targetConversion_pct: 80,
    },
    selfCheckPrompt: 'Why does the PFR achieve 77.69% conversion while the equal-volume CSTR reaches only 60.00%?',
    selfCheckOptions: [
      {
        id: 'rq1-opt-a',
        label: 'A CSTR immediately dilutes entering feed down to its low outlet concentration CA,out, lowering the reaction rate everywhere inside the tank.',
        isCorrect: true,
        feedback:
          'Correct! Because −rA = k·CA increases with concentration, the PFR maintains higher average CA (and faster reaction rates) along its length before reaching CA,out = 223.1 mol/m³, whereas the CSTR operates everywhere at CA = 400.0 mol/m³.',
      },
      {
        id: 'rq1-opt-b',
        label: 'A PFR has a longer residence time τ = V/q than a CSTR of the same volume and flow rate.',
        isCorrect: false,
        feedback:
          'Both reactors share the exact same space time τ = V/q = 1.5 / 0.02 = 75.0 s. The performance difference arises strictly from mixing hydrodynamics.',
      },
      {
        id: 'rq1-opt-c',
        label: 'The rate constant k is automatically larger inside a tubular reactor.',
        isCorrect: false,
        feedback:
          'This isothermal model holds k = 0.02 s⁻¹ fixed across all three reactor configurations.',
      },
    ],
    keyObservation:
      'At Da = kτ = 1.50 (τ = 75.0 s), Ideal PFR reaches X = 77.69% (CA,out = 223.13 mol/m³), outperforming Ideal CSTR at X = 60.00% (CA = 400.00 mol/m³) by +17.69 percentage points.',
    engineeringExplanation:
      'For any reaction with positive order (n > 0), rate −rA = k·CA decreases as reactant is consumed. Instantaneous backmixing in a CSTR forces the entire volume to react at the slow outlet concentration, whereas plug flow preserves high inlet driving concentrations near V = 0.',
  },
  {
    id: 'rxn-q2-target-sizing-penalty',
    conditionTag: 'Exploration 02 · High-Conversion Sizing Penalty (CSTR vs. PFR)',
    number: '02',
    question:
      'Why does the required CSTR volume grow dramatically faster than the required PFR volume as target conversion increases from 50% to 95%?',
    experimentPrompt:
      '1) Apply X_target = 95% below and inspect the Target Sizing KPI card and Required Reactor Volume V_req vs. Target Conversion chart. 2) Compare V_CSTR / V_PFR at 50% versus 95%.',
    presetActionLabel: 'Apply X_target = 95% Sizing Test',
    suggestedInputs: {
      reactorType: 'pfr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.02,
      reactorVolume_m3: 1.5,
      volumetricFlowRate_m3_s: 0.02,
      batchTime_s: 75,
      targetConversion_pct: 95,
    },
    selfCheckPrompt: 'How does the CSTR-to-PFR volume ratio behave as target conversion rises from 50% to 95%?',
    selfCheckOptions: [
      {
        id: 'rq2-opt-a',
        label: 'V_CSTR scales with X/(1−X), exploding to 19.00 m³ (6.34× the 3.00 m³ PFR) at 95% conversion versus 1.44× at 50%.',
        isCorrect: true,
        feedback:
          'Correct! At 50% conversion, V_CSTR = 1.00 m³ vs. V_PFR = 0.69 m³ (1.44×). At 95%, remaining concentration is only 5% of feed, forcing V_CSTR = 19.00 m³ against V_PFR = 3.00 m³ (6.34×).',
      },
      {
        id: 'rq2-opt-b',
        label: 'V_CSTR is always a fixed 2.0× multiple of V_PFR at every conversion.',
        isCorrect: false,
        feedback:
          'Look at the Required Reactor Volume vs. Target Conversion curve: the red CSTR curve bends sharply upward while the teal PFR curve grows only logarithmically.',
      },
      {
        id: 'rq2-opt-c',
        label: 'At 95% conversion, a CSTR becomes smaller than a PFR.',
        isCorrect: false,
        feedback:
          'For positive-order kinetics (n > 0), an Ideal CSTR always requires strictly larger volume than an Ideal PFR for any X > 0.',
      },
    ],
    keyObservation:
      'At k = 0.02 s⁻¹ and q = 0.02 m³/s, reaching X_target = 95% requires V_PFR = 3.00 m³ versus V_CSTR = 19.00 m³ (a 6.34× volume ratio), compared to 0.69 m³ vs. 1.00 m³ (1.44×) at 50%.',
    engineeringExplanation:
      'From the design equations, V_PFR = −(q/k)·ln(1 − X) grows logarithmically as (1 − X) shrinks, while V_CSTR = q·X / [k·(1 − X)] grows inversely with (1 − X) because the entire tank reacts at the vanishingly low final concentration CA = CA0·(1 − X).',
  },
  {
    id: 'rxn-q3-rate-constant-effect',
    conditionTag: 'Exploration 03 · Kinetic Rate Constant k & Reactor Sizing',
    number: '03',
    question:
      'If catalyst optimization or a higher isothermal setpoint increases rate constant k by 5× (from 0.02 s⁻¹ to 0.10 s⁻¹), how do conversion and required reactor volume respond?',
    experimentPrompt:
      '1) Apply k = 0.10 s⁻¹ with X_target = 90% below. 2) Compare V_req,PFR and V_req,CSTR against the k = 0.02 s⁻¹ baseline.',
    presetActionLabel: 'Apply High Rate (k = 0.10 s⁻¹)',
    suggestedInputs: {
      reactorType: 'pfr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.1,
      reactorVolume_m3: 1.5,
      volumetricFlowRate_m3_s: 0.02,
      batchTime_s: 75,
      targetConversion_pct: 90,
    },
    selfCheckPrompt: 'How does increasing k by 5× affect required reactor volume for a fixed 90% conversion target?',
    selfCheckOptions: [
      {
        id: 'rq3-opt-a',
        label: 'Required PFR and CSTR volumes both shrink by exactly 5× (inverse proportionality to k), while fixed-volume PFR conversion rises to 99.94%.',
        isCorrect: true,
        feedback:
          'Correct! Both V_PFR = −(q/k)·ln(1−X) and V_CSTR = qX/[k(1−X)] scale inversely with k: at k = 0.10 s⁻¹ and 90% target, V_PFR drops to 0.46 m³ and V_CSTR drops to 1.80 m³.',
      },
      {
        id: 'rq3-opt-b',
        label: 'Required reactor volume decreases by 25× (k²) for first-order kinetics.',
        isCorrect: false,
        feedback:
          'Conversion depends on the dimensionless Damköhler group Da = k·τ = k·V/q, so V scales linearly with 1/k (5× reduction, not 25×).',
      },
      {
        id: 'rq3-opt-c',
        label: 'Increasing k changes CSTR conversion only and leaves PFR conversion unchanged.',
        isCorrect: false,
        feedback:
          'At V = 1.5 m³, q = 0.02 m³/s, raising k from 0.02 to 0.10 s⁻¹ raises Da from 1.5 to 7.5, lifting PFR conversion from 77.69% to 99.94% and CSTR from 60.00% to 88.24%.',
      },
    ],
    keyObservation:
      'Increasing k fivefold (0.02 → 0.10 s⁻¹) reduces required 90%-conversion volumes fivefold (V_PFR: 2.30 → 0.46 m³; V_CSTR: 9.00 → 1.80 m³) and lifts fixed-volume PFR conversion from 77.69% to 99.94%.',
    engineeringExplanation:
      'In both ideal continuous design equations, k and τ appear exclusively as the product Da = k·τ = k·V/q. Holding target conversion fixed fixes Da_req, so V_req ∝ 1/k.',
  },
  {
    id: 'rxn-q4-batch-vs-pfr-time',
    conditionTag: 'Exploration 04 · Batch Reaction Time t vs. Continuous Space Time τ',
    number: '04',
    question:
      'When does a Batch Reactor match an Ideal PFR mathematically, and why must reaction time t still be distinguished from continuous residence time τ in real plant scheduling?',
    experimentPrompt:
      '1) Apply the Batch configuration at t = 75.0 s below. 2) Compare Batch X(t) against PFR X(τ) in the Reactor Performance Comparison BarChart and inspect the schematic notice.',
    presetActionLabel: 'Apply Batch Run (t = 75.0 s)',
    suggestedInputs: {
      reactorType: 'batch',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.02,
      reactorVolume_m3: 1.5,
      volumetricFlowRate_m3_s: 0.02,
      batchTime_s: 75,
      targetConversion_pct: 80,
    },
    selfCheckPrompt: 'How do Batch and Ideal PFR compare at t = τ = 75.0 s?',
    selfCheckOptions: [
      {
        id: 'rq4-opt-a',
        label: 'They yield identical conversion (77.69%) and CA (223.13 mol/m³) for constant-density isothermal kinetics, though real batch cycles also require turnaround time excluded from t.',
        isCorrect: true,
        feedback:
          'Correct! Each plug-flow fluid packet acts like an isolated micro-batch reacting for time τ. However, industrial batch throughput must also add filling, emptying, cleaning, and heating/cooling turnaround time.',
      },
      {
        id: 'rq4-opt-b',
        label: 'Batch conversion always matches CSTR conversion because both vessels have mechanical agitators.',
        isCorrect: false,
        feedback:
          'A batch vessel is well-mixed spatially, but it has NO continuous fresh feed diluting the reacting charge over time—so its concentration decays with time exactly like a PFR packet moving in space.',
      },
      {
        id: 'rq4-opt-c',
        label: 'Batch reaction time t depends on volumetric flow rate q.',
        isCorrect: false,
        feedback:
          'A closed batch reactor has no continuous feed stream (q = 0); notice volumetric flow rate q is hidden when Batch is selected.',
      },
    ],
    keyObservation:
      'At t = 75.0 s (k = 0.02 s⁻¹), Batch conversion X(t) = 77.69% (CA = 223.13 mol/m³) equals Ideal PFR conversion at τ = 75.0 s, whereas Ideal CSTR at τ = 75.0 s achieves 60.00%.',
    engineeringExplanation:
      'Replacing reaction time t with axial space time τ = V/q transforms the batch mole balance dCA/dt = −kCA into the constant-density PFR balance dCA/dτ = −kCA. Mathematically identical conversion results, though batch productivity must account for non-reactive turnaround downtime.',
  },
  {
    id: 'rxn-q5-flowrate-residence-tradeoff',
    conditionTag: 'Exploration 05 · Feed Flow Rate q vs. Residence Time τ Trade-off',
    number: '05',
    question:
      'In a fixed-volume PFR (V = 1.5 m³), what happens to residence time τ, conversion X, and total molar conversion rate ΔFA = q·(CA0 − CA) when volumetric flow rate doubles from 0.02 to 0.04 m³/s?',
    experimentPrompt:
      '1) Note the baseline PFR (q = 0.02 m³/s: τ = 75.0 s, X = 77.69%, ΔFA = 15.54 mol/s). 2) Apply q = 0.04 m³/s below and check the KPI cards.',
    presetActionLabel: 'Apply Doubled Flow (q = 0.04 m³/s)',
    suggestedInputs: {
      reactorType: 'pfr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.02,
      reactorVolume_m3: 1.5,
      volumetricFlowRate_m3_s: 0.04,
      batchTime_s: 75,
      targetConversion_pct: 80,
    },
    selfCheckPrompt: 'When feed flow q doubles in a fixed reactor volume V, what happens to X and ΔFA?',
    selfCheckOptions: [
      {
        id: 'rq5-opt-a',
        label: 'Residence time halves (75 → 37.5 s) and conversion drops (77.69% → 52.76%), while total moles reacted per second actually increases (15.54 → 21.11 mol/s).',
        isCorrect: true,
        feedback:
          'Correct! Higher flow cuts contact time τ = V/q in half so each fluid element converts less (X drops to 52.76%), yet higher average CA across the reactor boosts total molar throughput from 15.54 to 21.11 mol/s.',
      },
      {
        id: 'rq5-opt-b',
        label: 'Doubling flow rate doubles conversion X because more reactant enters per second.',
        isCorrect: false,
        feedback:
          'Higher flow rate q pushes fluid through the fixed reactor volume V faster, cutting residence time τ = V/q in half and lowering fractional conversion X.',
      },
      {
        id: 'rq5-opt-c',
        label: 'Residence time τ stays constant because reactor volume V did not change.',
        isCorrect: false,
        feedback:
          'Mean residence time τ = V / q depends on both reactor volume and volumetric flow rate.',
      },
    ],
    keyObservation:
      'Doubling q from 0.02 to 0.04 m³/s at V = 1.5 m³ halves τ (75.0 → 37.5 s), lowering PFR conversion from 77.69% to 52.76% (CSTR: 60.00% → 42.86%) while raising molar conversion ΔFA from 15.54 to 21.11 mol/s.',
    engineeringExplanation:
      'Increasing throughput q trades per-pass conversion X against total production rate ΔFA = q·CA0·X. Because reaction rate −rA = k·CA is higher when conversion is lower, operating at shorter τ utilizes reactor volume more intensely per mole reacted, at the expense of larger downstream recycle/separation.',
  },
  {
    id: 'rxn-q6-asymptotic-100-limit',
    conditionTag: 'Exploration 06 · Asymptotic 100% Conversion Limit',
    number: '06',
    question:
      'Why does setting Target Conversion to 100% produce an unbounded sizing advisory rather than a finite required reaction time or reactor volume?',
    experimentPrompt:
      '1) Apply X_target = 100% below. 2) Inspect the Kinetic & Reactor Design Scope Advisory banner and the Target Sizing KPI card.',
    presetActionLabel: 'Test X_target = 100% Asymptotic Limit',
    suggestedInputs: {
      reactorType: 'pfr',
      initialConcentration_mol_m3: 1000,
      rateConstant_per_s: 0.02,
      reactorVolume_m3: 1.5,
      volumetricFlowRate_m3_s: 0.02,
      batchTime_s: 75,
      targetConversion_pct: 100,
    },
    selfCheckPrompt: 'Why can first-order kinetics never reach exact 100% conversion in finite time or volume?',
    selfCheckOptions: [
      {
        id: 'rq6-opt-a',
        label: 'Because −rA = k·CA approaches zero as CA → 0, making t_req = −ln(1−X)/k and V_CSTR = qX/[k(1−X)] diverge to infinity at X = 1.',
        isCorrect: true,
        feedback:
          'Correct! As reactant depletes, the driving concentration CA vanishes and reaction slows proportionally, so exact 100% conversion is an asymptotic mathematical limit.',
      },
      {
        id: 'rq6-opt-b',
        label: 'Only a CSTR diverges at 100%; an Ideal PFR reaches 100% at τ = 1/k.',
        isCorrect: false,
        feedback:
          'At τ = 1/k (Da = 1), an Ideal PFR reaches only X = 1 − e⁻¹ ≈ 63.21%, never 100%. Both −ln(1 − X) and X/(1 − X) diverge as X → 1.',
      },
      {
        id: 'rq6-opt-c',
        label: 'The simulator limits conversion because k must be negative above 99%.',
        isCorrect: false,
        feedback:
          'Rate constant k is strictly nonnegative. The divergence comes purely from the exponential/rational first-order design equations as 1 − X → 0.',
      },
    ],
    keyObservation:
      'At X_target = 100%, the simulator flags an explicit unbounded limit warning and reports Target Sizing as Unbounded rather than emitting Infinity or NaN.',
    engineeringExplanation:
      'In first-order irreversible kinetics (−rA = k·CA), reactant concentration decays exponentially CA(t) = CA0·exp(−kt) > 0 for all finite t, and CA,CSTR = CA0/(1 + kτ) > 0 for all finite τ. Real industrial processes specify practical conversion targets (e.g., 90%–99%) coupled with downstream separation and recycle.',
  },
];

const DISTILLATION_BASELINE_RESULT = calculateDistillation(DEFAULT_DISTILLATION_INPUTS);
const DIST_BASE_N = DISTILLATION_BASELINE_RESULT.stageCalculation.totalTheoreticalStages ?? 11;
const DIST_BASE_N_FRAC = (
  DISTILLATION_BASELINE_RESULT.stageCalculation.fractionalTheoreticalStages ?? 10.39
).toFixed(2);
const DIST_BASE_NF = DISTILLATION_BASELINE_RESULT.stageCalculation.feedStageNumber ?? 5;
const DIST_BASE_RMIN = (
  DISTILLATION_BASELINE_RESULT.minimumReflux.minimumRefluxRatio_Rmin ?? 1.1
).toFixed(3);
const DIST_BASE_NMIN = (
  DISTILLATION_BASELINE_RESULT.minimumReflux.fenskeMinimumStages_Nmin ?? 6.43
).toFixed(2);

const DIST_Q1_INPUTS: DistillationInputs = {
  ...DEFAULT_DISTILLATION_INPUTS,
  relativeVolatility_alpha: 4.0,
  refluxRatio_R: 2.0,
  feedQuality_q: 1.0,
};
const DIST_Q1_RESULT = calculateDistillation(DIST_Q1_INPUTS);
const DIST_Q1_N = DIST_Q1_RESULT.stageCalculation.totalTheoreticalStages ?? 6;
const DIST_Q1_N_FRAC = (
  DIST_Q1_RESULT.stageCalculation.fractionalTheoreticalStages ?? 5.59
).toFixed(2);
const DIST_Q1_RMIN = (DIST_Q1_RESULT.minimumReflux.minimumRefluxRatio_Rmin ?? 0.5).toFixed(3);
const DIST_Q1_NMIN = (DIST_Q1_RESULT.minimumReflux.fenskeMinimumStages_Nmin ?? 4.25).toFixed(2);

const DIST_Q2_INPUTS: DistillationInputs = {
  ...DEFAULT_DISTILLATION_INPUTS,
  relativeVolatility_alpha: 2.5,
  refluxRatio_R: 5.0,
  feedQuality_q: 1.0,
};
const DIST_Q2_RESULT = calculateDistillation(DIST_Q2_INPUTS);
const DIST_Q2_N = DIST_Q2_RESULT.stageCalculation.totalTheoreticalStages ?? 8;
const DIST_Q2_N_FRAC = (
  DIST_Q2_RESULT.stageCalculation.fractionalTheoreticalStages ?? 7.79
).toFixed(2);

const DIST_Q3_INPUTS: DistillationInputs = {
  ...DEFAULT_DISTILLATION_INPUTS,
  relativeVolatility_alpha: 2.5,
  refluxRatio_R: 1.18,
  feedQuality_q: 1.0,
};
const DIST_Q3_RESULT = calculateDistillation(DIST_Q3_INPUTS);
const DIST_Q3_N = DIST_Q3_RESULT.stageCalculation.totalTheoreticalStages ?? 19;
const DIST_Q3_N_FRAC = (
  DIST_Q3_RESULT.stageCalculation.fractionalTheoreticalStages ?? 18.45
).toFixed(2);

const DIST_Q4_INPUTS: DistillationInputs = {
  ...DEFAULT_DISTILLATION_INPUTS,
  relativeVolatility_alpha: 2.5,
  refluxRatio_R: 2.8,
  feedQuality_q: 0.0,
};
const DIST_Q4_RESULT = calculateDistillation(DIST_Q4_INPUTS);
const DIST_Q4_RMIN = (DIST_Q4_RESULT.minimumReflux.minimumRefluxRatio_Rmin ?? 2.1).toFixed(3);

const DIST_Q5_INPUTS: DistillationInputs = {
  ...DEFAULT_DISTILLATION_INPUTS,
  relativeVolatility_alpha: 2.5,
  refluxRatio_R: 2.4,
  feedQuality_q: 0.5,
};
const DIST_Q5_RESULT = calculateDistillation(DIST_Q5_INPUTS);
const DIST_Q5_N = DIST_Q5_RESULT.stageCalculation.totalTheoreticalStages ?? 11;
const DIST_Q5_N_FRAC = (
  DIST_Q5_RESULT.stageCalculation.fractionalTheoreticalStages ?? 10.52
).toFixed(2);
const DIST_Q5_NF = DIST_Q5_RESULT.stageCalculation.feedStageNumber ?? 6;
const DIST_Q5_XINT = DIST_Q5_RESULT.operatingLines.intersection_x.toFixed(3);
const DIST_Q5_FEED_XEQ = (
  DIST_Q5_RESULT.stageCalculation.stages[DIST_Q5_NF - 1]?.x_eq ?? 0.369
).toFixed(3);

const DIST_Q6_INPUTS: DistillationInputs = {
  feedFlow_kmol_h: 100.0,
  feedComposition_zF: 0.5,
  distillateComposition_xD: 0.92,
  bottomsComposition_xB: 0.08,
  relativeVolatility_alpha: 1.5,
  refluxRatio_R: 4.2,
  feedQuality_q: 1.0,
};
const DIST_Q6_RESULT = calculateDistillation(DIST_Q6_INPUTS);
const DIST_Q6_N = DIST_Q6_RESULT.stageCalculation.totalTheoreticalStages ?? 24;
const DIST_Q6_TRAYS = DIST_Q6_RESULT.stageCalculation.columnTheoreticalTrays ?? 23;
const DIST_Q6_N_FRAC = (
  DIST_Q6_RESULT.stageCalculation.fractionalTheoreticalStages ?? 23.53
).toFixed(2);

export const DISTILLATION_GUIDED_EXPLORATION_QUESTIONS: SharedGuidedQuestion<DistillationInputs>[] = [
  {
    id: 'dist-q1-relative-volatility',
    conditionTag: 'Exploration 01 · Relative Volatility (α) & Separation Difficulty',
    number: '01',
    question:
      'Why does increasing relative volatility (α) from 2.50 to 4.00 make binary distillation easier and reduce both the minimum reflux ratio (Rmin) and required theoretical stages (N)?',
    experimentPrompt: `1) Observe the baseline (α = 2.50, R = 2.00: Rmin = ${DIST_BASE_RMIN}, N = ${DIST_BASE_N} stages / ${DIST_BASE_N_FRAC} fractional, NF = ${DIST_BASE_NF}) and snapshot it. 2) Apply α = 4.00 at R = 2.00 below and inspect the McCabe–Thiele diagram.`,
    presetActionLabel: 'Apply High Volatility (α = 4.00, R = 2.00)',
    suggestedInputs: DIST_Q1_INPUTS,
    selfCheckPrompt: 'How does increasing α from 2.50 to 4.00 alter the McCabe–Thiele diagram?',
    selfCheckOptions: [
      {
        id: 'dq1-opt-a',
        label: `It bows the VLE curve y*(x) further above the y = x diagonal, widening the stage-stepping gap so N drops from ${DIST_BASE_N} (${DIST_BASE_N_FRAC}) to ${DIST_Q1_N} (${DIST_Q1_N_FRAC}) stages and Rmin drops from ${DIST_BASE_RMIN} to ${DIST_Q1_RMIN}.`,
        isCorrect: true,
        feedback: `Correct! A higher relative volatility means vapor is much richer in light component A at every liquid composition x, allowing each equilibrium stage to achieve a larger composition step (cutting N from ${DIST_BASE_N} to ${DIST_Q1_N} stages).`,
      },
      {
        id: 'dq1-opt-b',
        label: 'It changes the distillate and bottoms product molar flow rates D and B.',
        isCorrect: false,
        feedback:
          'Overall product flows D = 50.00 kmol/h and B = 50.00 kmol/h depend strictly on overall and component material balances F, zF, xD, and xB—not on α.',
      },
      {
        id: 'dq1-opt-c',
        label: 'As α approaches 1.0, separation becomes easier and requires fewer stages.',
        isCorrect: false,
        feedback:
          'When α → 1.0, y*(x) collapses onto the y = x diagonal, eliminating the vapor-liquid enrichment driving force and making distillation impossible without infinite stages.',
      },
    ],
    keyObservation: `Increasing α from 2.50 to 4.00 at fixed R = 2.00 reduces minimum reflux Rmin from ${DIST_BASE_RMIN} to ${DIST_Q1_RMIN}, Fenske minimum stages Nmin from ${DIST_BASE_NMIN} to ${DIST_Q1_NMIN}, and required theoretical stages from ${DIST_BASE_N} (${DIST_BASE_N_FRAC} fractional) to ${DIST_Q1_N} (${DIST_Q1_N_FRAC} fractional).`,
    engineeringExplanation:
      'From y* = αx / [1 + (α − 1)x], the enrichment driving force y* − x = (α − 1)x(1 − x) / [1 + (α − 1)x] is directly proportional to (α − 1). Wider vertical distance between the equilibrium curve and the operating lines lets each McCabe–Thiele staircase step span a much larger composition change.',
  },
  {
    id: 'dist-q2-reflux-ratio-increase',
    conditionTag: 'Exploration 02 · Reflux Ratio (R) vs. Theoretical Stages Trade-off',
    number: '02',
    question:
      'What happens to the operating lines, internal vapor/liquid flows (L, V), and required theoretical stages (N) when reflux ratio increases from R = 2.00 to R = 5.00?',
    experimentPrompt: `1) Compare baseline R = 2.00 (N = ${DIST_BASE_N} stages / ${DIST_BASE_N_FRAC} frac, V = 150 kmol/h) against High Reflux R = 5.00 below. 2) Inspect both the McCabe–Thiele staircase and the Theoretical Stages vs. Reflux Ratio curve.`,
    presetActionLabel: 'Apply High Reflux Ratio (R = 5.00)',
    suggestedInputs: DIST_Q2_INPUTS,
    selfCheckPrompt: 'What is the engineering trade-off when raising R from 2.00 to 5.00?',
    selfCheckOptions: [
      {
        id: 'dq2-opt-a',
        label: `Rectifying slope R/(R+1) increases toward 1.0 (pulling operating lines closer to the y = x diagonal), reducing stages from ${DIST_BASE_N} (${DIST_BASE_N_FRAC}) to ${DIST_Q2_N} (${DIST_Q2_N_FRAC}) at the cost of doubling vapor boilup V from 150 to 300 kmol/h.`,
        isCorrect: true,
        feedback: `Correct! Higher reflux widens the gap between the operating lines and the VLE curve—cutting stage count from ${DIST_BASE_N} (${DIST_BASE_N_FRAC}) to ${DIST_Q2_N} (${DIST_Q2_N_FRAC}) toward Fenske Nmin = ${DIST_BASE_NMIN}—but requires twice the overhead vapor traffic (and reboiler/condenser energy).`,
      },
      {
        id: 'dq2-opt-b',
        label: 'Raising reflux ratio reduces the number of stages to zero at total reflux.',
        isCorrect: false,
        feedback: `Even as R → ∞ (total reflux, where operating lines coincide with y = x), a nonzero minimum number of stages Nmin = ${DIST_BASE_NMIN} (Fenske limit) is still required.`,
      },
      {
        id: 'dq2-opt-c',
        label: 'Increasing R increases distillate product flow rate D.',
        isCorrect: false,
        feedback:
          'At fixed feed F = 100 kmol/h and purities xD = 0.95, xB = 0.05, distillate flow D remains 50.00 kmol/h; higher R recycles more liquid L = R·D internally.',
      },
    ],
    keyObservation: `Raising R from 2.00 to 5.00 increases rectifying slope L/V from 0.667 to 0.833, lowering required theoretical stages from ${DIST_BASE_N} (${DIST_BASE_N_FRAC} fractional) to ${DIST_Q2_N} (${DIST_Q2_N_FRAC} fractional, approaching Fenske Nmin = ${DIST_BASE_NMIN}) while doubling internal vapor traffic V from 150.0 to 300.0 kmol/h.`,
    engineeringExplanation:
      'In column design, reflux ratio R governs the fundamental capital-versus-operating-cost trade-off: higher R reduces column height (fewer trays) but increases column diameter and reboiler/condenser thermal duties because internal vapor flow V = (R + 1)D scales linearly with R.',
  },
  {
    id: 'dist-q3-minimum-reflux-pinch',
    conditionTag: 'Exploration 03 · Approaching Minimum Reflux (Rmin) & Pinch Zones',
    number: '03',
    question:
      'What happens to the McCabe–Thiele staircase as reflux ratio approaches its minimum feasible value (Rmin = 1.100), and why is separation impossible below Rmin?',
    experimentPrompt:
      '1) Apply R = 1.18 (1.07× Rmin) below and inspect the crowded staircase near x = 0.50. 2) Then select the "Infeasible Case — Below Minimum Reflux (R = 0.95)" preset to observe pinch behavior.',
    presetActionLabel: 'Apply Near-Pinch Reflux (R = 1.18)',
    suggestedInputs: DIST_Q3_INPUTS,
    selfCheckPrompt: `What occurs on the McCabe–Thiele diagram as R approaches Rmin = ${DIST_BASE_RMIN}?`,
    selfCheckOptions: [
      {
        id: 'dq3-opt-a',
        label: `The operating-line intersection approaches the VLE curve (pinch point), causing stages to crowd into tiny steps (${DIST_Q3_N} stages at R = 1.18, ∞ stages at R ≤ ${DIST_BASE_RMIN}).`,
        isCorrect: true,
        feedback: `Correct! At R = 1.18, y_int = 0.7064 is just below y*(0.50) = 0.7143, requiring ${DIST_Q3_N} stages (${DIST_Q3_N_FRAC} fractional) compared to ${DIST_BASE_N} (${DIST_BASE_N_FRAC}) at baseline R = 2.00. At R ≤ ${DIST_BASE_RMIN}, the intersection touches or crosses the VLE curve, trapping the staircase in a pinch.`,
      },
      {
        id: 'dq3-opt-b',
        label: 'The column requires fewer stages near Rmin because vapor velocity is lower.',
        isCorrect: false,
        feedback:
          'Lowering R toward Rmin shrinks the distance between the operating lines and the equilibrium curve, sharply increasing required stages.',
      },
      {
        id: 'dq3-opt-c',
        label: 'Minimum reflux Rmin depends only on column flow rate F.',
        isCorrect: false,
        feedback:
          'Rmin is an intensive thermodynamic/geometric property determined by zF, xD, α, and feed quality q—independent of total throughput F.',
      },
    ],
    keyObservation: `Lowering R from 2.00 to 1.18 (1.07× Rmin) sharply increases required theoretical stages from ${DIST_BASE_N} (${DIST_BASE_N_FRAC}) to ${DIST_Q3_N} (${DIST_Q3_N_FRAC}), with dense stage crowding around the feed intersection x_int = 0.500.`,
    engineeringExplanation:
      'At R = Rmin, the rectifying and stripping operating lines intersect directly on the vapor–liquid equilibrium curve. At that pinch point, the liquid and vapor streams are in thermodynamic equilibrium (y* = y_op), so net mass transfer driving force vanishes and stepping across the pinch requires an infinite number of equilibrium stages.',
  },
  {
    id: 'dist-q4-feed-condition-q-line',
    conditionTag: 'Exploration 04 · Feed Thermal Condition (q) & the q-Line',
    number: '04',
    question:
      'How does changing the feed condition from Saturated Liquid (q = 1.0) to Saturated Vapor (q = 0.0) rotate the q-line and change minimum reflux (Rmin)?',
    experimentPrompt: `1) Compare Saturated Liquid (q = 1.0, vertical q-line x = 0.50, Rmin = ${DIST_BASE_RMIN}) against Saturated Vapor (q = 0.0) at R = 2.80 below. 2) Inspect the purple q-line and internal stripping flows L̄ and V̄.`,
    presetActionLabel: 'Apply Saturated Vapor Feed (q = 0.00, R = 2.80)',
    suggestedInputs: DIST_Q4_INPUTS,
    selfCheckPrompt: 'How does switching from saturated liquid (q = 1) to saturated vapor (q = 0) affect the q-line and Rmin?',
    selfCheckOptions: [
      {
        id: 'dq4-opt-a',
        label: `The q-line rotates from vertical (x = zF) to horizontal (y = zF), shifting the VLE pinch point to lower x (0.286) and raising Rmin from ${DIST_BASE_RMIN} to ${DIST_Q4_RMIN}.`,
        isCorrect: true,
        feedback: `Correct! A saturated vapor feed (q = 0) enters entirely as vapor (V = V̄ + F), so the q-line is horizontal at y = zF = 0.50, intersecting the VLE curve at x_pinch = 0.286 and raising Rmin to ${DIST_Q4_RMIN}.`,
      },
      {
        id: 'dq4-opt-b',
        label: 'The q-line stays vertical for all feed conditions because zF is constant.',
        isCorrect: false,
        feedback:
          'The q-line slope is q/(q − 1): it is vertical (∞) only for saturated liquid (q = 1), sloped (−1) at q = 0.5, and horizontal (0) for saturated vapor (q = 0).',
      },
      {
        id: 'dq4-opt-c',
        label: 'Vaporizing the feed decreases Rmin to zero.',
        isCorrect: false,
        feedback: `Lowering q from 1.0 to 0.0 shifts the pinch point leftward along the VLE curve, requiring a steeper rectifying slope and thus a higher Rmin (${DIST_BASE_RMIN} → ${DIST_Q4_RMIN}).`,
      },
    ],
    keyObservation: `At q = 0.00 (saturated vapor feed), the q-line becomes horizontal at y = 0.50, shifting the pinch point to (x = 0.286, y = 0.500), increasing Rmin from ${DIST_BASE_RMIN} to ${DIST_Q4_RMIN}, and setting stripping liquid equal to rectifying liquid (L̄ = L = 140.0 kmol/h).`,
    engineeringExplanation:
      'By definition, q is the fraction of feed F that joins the downward-flowing stripping liquid (L̄ = L + qF), while (1 − q)F joins the upward-flowing rectifying vapor (V = V̄ + (1 − q)F). Eliminating flow rates between the section material balances yields the q-line locus y = [q/(q − 1)]x − zF/(q − 1) passing through (zF, zF).',
  },
  {
    id: 'dist-q5-optimal-feed-stage',
    conditionTag: 'Exploration 05 · Optimal Feed-Stage Location (NF)',
    number: '05',
    question:
      'Why is the feed-stage location (NF) important, and why does McCabe–Thiele switch from the rectifying operating line to the stripping operating line at the intersection x_int?',
    experimentPrompt: `1) Apply the partially vaporized feed condition below (q = 0.50, R = 2.40). 2) Use the "Stage 1 / Next" stepper above the McCabe–Thiele diagram to watch the transition at Stage NF = ${DIST_Q5_NF}.`,
    presetActionLabel: 'Inspect Feed Transition (q = 0.50, R = 2.40)',
    suggestedInputs: DIST_Q5_INPUTS,
    selfCheckPrompt: 'Why is the optimal feed stage located where equilibrium liquid x_n first drops below x_int?',
    selfCheckOptions: [
      {
        id: 'dq5-opt-a',
        label: 'Because for x < x_int the stripping operating line lies below the rectifying line, giving the largest vertical composition step and minimizing total required stages.',
        isCorrect: true,
        feedback:
          'Correct! To minimize total stages, each vertical step from the equilibrium curve should land on whichever operating line lies lowest (furthest from the VLE curve). That crossover occurs exactly at x = x_int.',
      },
      {
        id: 'dq5-opt-b',
        label: 'Feed must always enter at the exact geometric middle tray of the column regardless of zF, xD, or xB.',
        isCorrect: false,
        feedback:
          'If xD is very high purity or zF is skewed, the rectifying and stripping sections can have very different stage counts.',
      },
      {
        id: 'dq5-opt-c',
        label: 'The feed-stage transition adds an extra non-equilibrium stage to the column total.',
        isCorrect: false,
        feedback:
          'The feed stage itself is a normal equilibrium stage (Stage NF) where the operating-line relationship transitions from rectifying to stripping.',
      },
    ],
    keyObservation: `At q = 0.50 and R = 2.40 (x_int = ${DIST_Q5_XINT}), Stages 1–${DIST_Q5_NF - 1} have x_eq > ${DIST_Q5_XINT} (rectifying section), and Stage ${DIST_Q5_NF} is the first stage where x_eq = ${DIST_Q5_FEED_XEQ} ≤ ${DIST_Q5_XINT}—making Stage ${DIST_Q5_NF} the optimal feed stage out of ${DIST_Q5_N} total stages (${DIST_Q5_N_FRAC} fractional).`,
    engineeringExplanation:
      'If feed is introduced too high (continuing on the stripping line at x > x_int) or too low (staying on the rectifying line at x < x_int), the vertical steps terminate closer to the equilibrium curve, wasting mass-transfer driving force and requiring additional trays to achieve the same product purities.',
  },
  {
    id: 'dist-q6-theoretical-vs-actual-trays',
    conditionTag: 'Exploration 06 · Theoretical Equilibrium Stages vs. Actual Tray Counts',
    number: '06',
    question:
      'Why do the theoretical equilibrium stages calculated by the McCabe–Thiele method differ from the actual number of physical sieve or valve trays installed in an industrial column?',
    experimentPrompt:
      '1) Apply the close-boiling separation (α = 1.50, R = 4.20) below. 2) Compare Total Theoretical Stages N, Column Theoretical Trays (N − 1), and Fractional Stages in the KPI dashboard.',
    presetActionLabel: 'Apply Close-Boiling Column (α = 1.50, R = 4.20)',
    suggestedInputs: DIST_Q6_INPUTS,
    selfCheckPrompt: 'How do theoretical stages relate to actual physical column trays and reboilers?',
    selfCheckOptions: [
      {
        id: 'dq6-opt-a',
        label: 'A partial reboiler counts as 1 theoretical stage (and a total condenser as 0), while real column trays only achieve partial mass-transfer equilibrium (efficiency η < 100%) and therefore require more physical trays than theoretical stages.',
        isCorrect: true,
        feedback: `Correct! Here N_total = ${DIST_Q6_N} theoretical stages (${DIST_Q6_N_FRAC} fractional), so the partial reboiler provides 1 equilibrium stage and the column requires ${DIST_Q6_TRAYS} theoretical trays. With a 70% overall tray efficiency, the column would need ${DIST_Q6_TRAYS} / 0.70 ≈ ${Math.ceil(DIST_Q6_TRAYS / 0.7)} actual trays.`,
      },
      {
        id: 'dq6-opt-b',
        label: 'Both the total condenser and partial reboiler count as 2 equilibrium stages each.',
        isCorrect: false,
        feedback:
          'A total condenser condenses all overhead vapor without vapor-liquid phase partitioning (0 equilibrium stages), and a partial reboiler provides 1 equilibrium stage.',
      },
      {
        id: 'dq6-opt-c',
        label: 'Real industrial trays always require fewer trays than theoretical equilibrium stages.',
        isCorrect: false,
        feedback:
          'Because vapor bubbles have finite contact time passing through liquid on a tray, actual stage efficiency is less than 100%, so actual trays exceed theoretical trays.',
      },
    ],
    keyObservation: `For α = 1.50, xD = 0.92, xB = 0.08 at R = 4.20, McCabe–Thiele requires ${DIST_Q6_N} graphical stages (${DIST_Q6_N_FRAC} fractional), corresponding to ${DIST_Q6_TRAYS} theoretical column trays plus 1 partial reboiler.`,
    engineeringExplanation:
      'McCabe–Thiele assumes ideal equilibrium stages where vapor and liquid leaving stage n are in complete thermodynamic equilibrium (y_n = y*(x_n)). In practice, finite mass-transfer rates, liquid mixing gradients, and weeping/entrainment reduce tray efficiency (typically 50%–85%), and non-integer fractional stage requirements are rounded up or adjusted via reflux trim.',
  },
  {
    id: 'dist-q7-cmo-straight-operating-lines',
    conditionTag: 'Exploration 07 · Constant Molar Overflow (CMO) Assumptions',
    number: '07',
    question:
      'What physical assumptions make the rectifying and stripping operating lines straight lines on a McCabe–Thiele x–y diagram?',
    experimentPrompt:
      '1) Return to the Baseline (α = 2.50, R = 2.00, q = 1.00) below. 2) Inspect the Section Molar Flows KPI card (L = 100, V = 150; L̄ = 200, V̄ = 150 kmol/h) and Documented Assumptions.',
    presetActionLabel: 'Apply Baseline CMO Configuration',
    suggestedInputs: { ...DEFAULT_DISTILLATION_INPUTS },
    selfCheckPrompt: 'Why are the operating lines y = (L/V)x + (D/V)xD straight lines with constant slope?',
    selfCheckOptions: [
      {
        id: 'dq7-opt-a',
        label: 'Constant Molar Overflow (equal molar latent heats of vaporization, negligible sensible enthalpy differences, and an adiabatic column) keeps molar flows L and V constant from stage to stage within each section.',
        isCorrect: true,
        feedback:
          'Correct! Under CMO, condensing 1 mole of heavy component vapor vaporizes 1 mole of light component liquid, so L and V stay constant throughout the rectifying section and L̄ and V̄ stay constant throughout the stripping section.',
      },
      {
        id: 'dq7-opt-b',
        label: 'Operating lines are straight for every chemical mixture even when latent heats differ by 300%.',
        isCorrect: false,
        feedback:
          'When components have substantially different molar enthalpies of vaporization or large heat of mixing effects, L and V vary from stage to stage and curved operating lines (Ponchon–Savarit enthalpy-concentration method) are required.',
      },
      {
        id: 'dq7-opt-c',
        label: 'Constant relative volatility α is what makes the operating lines straight.',
        isCorrect: false,
        feedback:
          'Constant α shapes the curved VLE line y*(x); the operating lines come purely from component and total material balances (L/V and L̄/V̄) under Constant Molar Overflow.',
      },
    ],
    keyObservation:
      'Under Constant Molar Overflow at F = 100 kmol/h, R = 2.00, and q = 1.00, rectifying flows remain constant at L = 100.0 and V = 150.0 kmol/h (slope L/V = 0.667) and stripping flows remain constant at L̄ = 200.0 and V̄ = 150.0 kmol/h (slope L̄/V̄ = 1.333).',
    engineeringExplanation:
      'A component balance around the top of the column through stage n gives y_{n+1} = (L_n / V_{n+1}) x_n + (D / V_{n+1}) x_D. This relationship is linear in x_n if and only if the internal molar flow rates L_n = L and V_{n+1} = V are independent of stage number n—which holds when molar latent heats are nearly equal, sensible heat changes are small compared to latent heat, and heat losses are negligible.',
  },
];

export const THERMO_PVT_GUIDED_QUESTIONS: SharedGuidedQuestion<PureFluidPVTInputs>[] = [
  {
    id: 'tpvt-1-ideal-breakdown',
    conditionTag: 'PVT Inquiry 01 · High-Pressure Breakdown of PV = nRT',
    number: '01',
    question:
      'Why does the ideal gas law ($PV = nRT$) fail for $\\mathrm{CO_2}$ at $320\\,\\mathrm{K}$ and $60\\,\\mathrm{bar}$, and which molecular term dominates the deviation?',
    experimentPrompt:
      'Load the Moderate-Pressure Real Gas state ($\\mathrm{CO_2}$ at $T = 320\\,\\mathrm{K}$, $P = 60\\,\\mathrm{bar}$) below and inspect $Z$, $v_{\\mathrm{ideal}}$, and $v_{\\mathrm{PR}}$.',
    presetActionLabel: 'Apply CO₂ @ 320 K & 60 bar (Z = 0.695)',
    suggestedInputs: {
      fluidId: 'CO2',
      temperature_K: 320.0,
      pressure_Pa: 60.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
    selfCheckPrompt:
      'At $T = 320\\,\\mathrm{K}$ ($T_r = 1.052$) and $P = 60\\,\\mathrm{bar}$ ($P_r = 0.813$), why is the Peng–Robinson molar volume ($0.308\\,\\mathrm{L/mol}$) $30.5\\%$ smaller than the ideal-gas volume ($0.443\\,\\mathrm{L/mol}$)?',
    selfCheckOptions: [
      {
        id: 'tpvt1-a',
        label:
          'Long-range intermolecular attractive forces (-aα/[v(v+b)+b(v-b)]) pull CO₂ molecules closer together at moderate high pressures near T_c, lowering Z below 1.0.',
        isCorrect: true,
        feedback:
          'Correct! At T_r = 1.052 and P_r = 0.813, the attractive pressure term subtracts 41.3 bar from the kinetic/repulsive pressure (101.3 bar), yielding Z = 0.6950 (< 1).',
      },
      {
        id: 'tpvt1-b',
        label:
          'Hard-sphere excluded volume b always forces real gases to have Z < 1 at all pressures.',
        isCorrect: false,
        feedback:
          'Excluded covolume b increases the repulsive denominator RT/(v - b), which pushes Z above 1 at extreme pressures; attractive forces aα are what cause Z < 1.',
      },
      {
        id: 'tpvt1-c',
        label: 'The gas constant R decreases at high pressure.',
        isCorrect: false,
        feedback:
          'R = 8.31446 J/(mol·K) is a universal physical constant; non-ideality arises from intermolecular forces and finite molecular volume.',
      },
    ],
    keyObservation:
      'At 320 K and 60 bar, CO₂ has Z = 0.6950, v_ideal = 0.4434 L/mol, and v_PR = 0.3082 L/mol—a -30.50% volume deviation from ideal gas behavior.',
    engineeringExplanation:
      'The Peng–Robinson equation separates pressure into a repulsive hard-sphere term $P_{\\mathrm{rep}} = \\frac{RT}{v - b}$ and a cohesive attractive term $P_{\\mathrm{att}} = \\frac{a\\alpha}{v(v+b)+b(v-b)}$. At moderate reduced pressures near $T_c$, intermolecular attraction outweighs excluded volume, compressing the fluid to $Z = \\frac{Pv}{RT} < 1$.',
  },
  {
    id: 'tpvt-2-z-physical-meaning',
    conditionTag: 'PVT Inquiry 02 · Physical Meaning of Z < 1 vs. Z > 1',
    number: '02',
    question:
      'What does the compressibility factor $Z = \\frac{Pv}{RT}$ physically represent when comparing compressed $\\mathrm{N_2}$ at $300\\,\\mathrm{K}$ and $250\\,\\mathrm{bar}$ ($Z > 1$) against $\\mathrm{CO_2}$ ($Z < 1$)?',
    experimentPrompt:
      'Apply the High-Pressure Nitrogen Cylinder preset ($\\mathrm{N_2}$ at $T = 300\\,\\mathrm{K}$, $P = 250\\,\\mathrm{bar}$) and observe $Z$ and the $Z\\text{ vs. }P$ curve.',
    presetActionLabel: 'Apply N₂ @ 300 K & 250 bar (Z = 1.106)',
    suggestedInputs: {
      fluidId: 'N2',
      temperature_K: 300.0,
      pressure_Pa: 250.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
    selfCheckPrompt:
      'Why does $\\mathrm{N_2}$ at $300\\,\\mathrm{K}$ and $250\\,\\mathrm{bar}$ exhibit $Z = 1.106 > 1$ ($+10.6\\%$ larger molar volume than ideal gas)?',
    selfCheckOptions: [
      {
        id: 'tpvt2-a',
        label:
          'At T_r = 2.38 and P_r = 7.36, molecules are packed so tightly (v/b = 4.65) that finite molecular covolume repulsion RT/(v - b) exceeds weak attractive forces, making the fluid less compressible than an ideal gas.',
        isCorrect: true,
        feedback:
          'Correct! Because 300 K is more than twice Nitrogen’s critical temperature (126.19 K), thermal kinetic energy overwhelms attraction and finite covolume b drives Z = 1.106 > 1.',
      },
      {
        id: 'tpvt2-b',
        label: 'Nitrogen condenses into a subcooled liquid at 300 K and 250 bar.',
        isCorrect: false,
        feedback:
          '300 K is far above Nitrogen’s critical temperature T_c = 126.19 K, so Nitrogen is a supercritical fluid and cannot liquefy by isothermal compression at 300 K.',
      },
      {
        id: 'tpvt2-c',
        label: 'Z > 1 means intermolecular attraction is infinitely strong.',
        isCorrect: false,
        feedback:
          'Strong attraction pulls molecules together (Z < 1); Z > 1 indicates net repulsive excluded-volume behavior.',
      },
    ],
    keyObservation:
      'At 300 K and 250 bar, N₂ operates at T_r = 2.377 and P_r = 7.362 with Z = 1.1062, v_PR = 0.1104 L/mol vs. v_ideal = 0.0998 L/mol (+10.62% deviation).',
    engineeringExplanation:
      'Since $Z = \\frac{v_{\\mathrm{actual}}}{v_{\\mathrm{ideal}}}$ at fixed $(T, P)$, $Z < 1$ signifies that attractive forces make the fluid denser than an ideal gas, whereas $Z > 1$ signifies that finite hard-sphere covolume $b$ resists compression and makes the molar volume larger than $RT/P$.',
  },
  {
    id: 'tpvt-3-critical-region',
    conditionTag: 'PVT Inquiry 03 · Near-Critical Non-Ideality',
    number: '03',
    question:
      'How do temperature and pressure interact near the critical point ($T_r \\approx 1, P_r \\approx 1$) to produce extreme departures from ideal-gas behavior?',
    experimentPrompt:
      'Apply the Near-Critical Compression preset ($\\mathrm{CO_2}$ at $T = 305\\,\\mathrm{K}$, $P = 74\\,\\mathrm{bar}$) and switch to the $P\\text{–}v$ Isotherms tab.',
    presetActionLabel: 'Apply Near-Critical CO₂ @ 305 K & 74 bar',
    suggestedInputs: {
      fluidId: 'CO2',
      temperature_K: 305.0,
      pressure_Pa: 74.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
    selfCheckPrompt:
      'What happens to the slope of the $P\\text{–}v$ isotherm and the compressibility factor $Z$ as a fluid approaches $(T_c, P_c)$?',
    selfCheckOptions: [
      {
        id: 'tpvt3-a',
        label:
          'The critical isotherm develops a horizontal inflection point ((∂P/∂v)_Tc = 0, (∂²P/∂v²)_Tc = 0), causing isothermal compressibility to diverge and Z to drop sharply toward Z_c,PR ≈ 0.307.',
        isCorrect: true,
        feedback:
          'Correct! At the critical point, the repulsive and attractive terms balance to create a horizontal inflection point, producing massive density sensitivity and Z ≈ 0.305.',
      },
      {
        id: 'tpvt3-b',
        label: 'At the critical point, Z equals 1.000 for all fluids.',
        isCorrect: false,
        feedback:
          'At the critical point, real fluids are strongly non-ideal (experimental Z_c ≈ 0.27–0.29; Peng–Robinson predicts universal Z_c = 0.3074).',
      },
      {
        id: 'tpvt3-c',
        label: 'The P–v isotherm becomes a vertical line at T = T_c.',
        isCorrect: false,
        feedback:
          'The critical point is characterized by a horizontal inflection point (∂P/∂v)_T = 0, meaning small pressure changes cause large volume/density changes.',
      },
    ],
    keyObservation:
      'At T = 305.0 K (T_r = 1.003) and P = 74.0 bar (P_r = 1.003), CO₂ compressibility plunges to Z = 0.3051—nearly a -69.5% reduction in molar volume compared to an ideal gas.',
    engineeringExplanation:
      'In the Peng–Robinson EOS, the coefficients $a = 0.45724\\frac{R^2 T_c^2}{P_c}$ and $b = 0.07780\\frac{R T_c}{P_c}$ are derived directly by enforcing the critical inflection conditions $\\left(\\frac{\\partial P}{\\partial v}\\right)_{T_c} = 0$ and $\\left(\\frac{\\partial^2 P}{\\partial v^2}\\right)_{T_c} = 0$, which yield a universal critical compressibility $Z_c = 0.3074$.',
  },
  {
    id: 'tpvt-4-cubic-three-roots',
    conditionTag: 'PVT Inquiry 04 · Subcritical Three-Root Behavior',
    number: '04',
    question:
      'Why does the Peng–Robinson cubic equation in $Z$ yield three real roots at subcritical conditions ($T < T_c$), and how do we interpret the largest and smallest roots?',
    experimentPrompt:
      'Load the Subcritical Multi-Root Coexistence state ($\\mathrm{CO_2}$ at $T = 280\\,\\mathrm{K}$, $P = 42\\,\\mathrm{bar}$) and toggle the Root Branch selector between Vapor-like ($Z_{\\max}$) and Liquid-like ($Z_{\\min}$).',
    presetActionLabel: 'Apply Subcritical CO₂ @ 280 K & 42 bar (3 Roots)',
    suggestedInputs: {
      fluidId: 'CO2',
      temperature_K: 280.0,
      pressure_Pa: 42.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
    selfCheckPrompt:
      'When three valid real roots ($Z_1 < Z_2 < Z_3$, all $> B$) occur at $T < T_c$, what is the physical meaning of the three roots?',
    selfCheckOptions: [
      {
        id: 'tpvt4-a',
        label:
          'The largest root Z_3 corresponds to the low-density vapor-like phase, the smallest root Z_1 (with Z_1 > B) corresponds to the dense liquid-like phase, and the middle root Z_2 lies on the mechanically unstable spinodal branch where (∂P/∂v)_T > 0.',
        isCorrect: true,
        feedback:
          'Correct! The middle root violates mechanical stability ((∂P/∂v)_T > 0) and is never physically realized as a homogeneous phase.',
      },
      {
        id: 'tpvt4-b',
        label: 'The three roots represent solid, liquid, and gas phases simultaneously.',
        isCorrect: false,
        feedback:
          'Cubic fluid equations of state model only fluid (liquid and vapor) phases, not crystalline solids; the middle root is an unstable mathematical artifact of the van der Waals loop.',
      },
      {
        id: 'tpvt4-c',
        label: 'Any negative Z root with v < b represents the compressed liquid.',
        isCorrect: false,
        feedback:
          'Roots with Z ≤ B imply v ≤ b, violating the hard-sphere excluded volume restriction and must be rejected as nonphysical.',
      },
    ],
    keyObservation:
      'At 280 K and 42 bar, CO₂ exhibits three valid physical roots above B = 0.0484: liquid-like Z_liquid = 0.1060 (v = 0.0587 L/mol), unstable middle Z_mid = 0.2059, and vapor-like Z_vapor = 0.6594 (v = 0.3654 L/mol).',
    engineeringExplanation:
      'Because the Peng–Robinson EOS is a continuous analytic cubic polynomial in $v$ (or $Z$), below $T_c$ it connects the high-density liquid branch and low-density vapor branch via an S-shaped van der Waals loop. Any root with $Z \\le B$ ($v \\le b$) is rejected as nonphysical.',
  },
  {
    id: 'tpvt-5-acentric-fluid-comparison',
    conditionTag: 'PVT Inquiry 05 · Fluid Critical Properties & Acentric Factor ω',
    number: '05',
    question:
      'How do critical temperature $T_c$ and Pitzer acentric factor $\\omega$ explain why Methane ($\\mathrm{CH_4}$) and Ethane ($\\mathrm{C_2H_6}$) behave so differently at the same temperature and pressure ($310\\,\\mathrm{K}$, $50\\,\\mathrm{bar}$)?',
    experimentPrompt:
      'Apply Ethane ($\\mathrm{C_2H_6}$) at $T = 310\\,\\mathrm{K}$ and $P = 50\\,\\mathrm{bar}$ below, save the scenario, then switch the Fluid selector to Methane ($\\mathrm{CH_4}$) at the same $(T, P)$.',
    presetActionLabel: 'Apply Ethane (C₂H₆) @ 310 K & 50 bar',
    suggestedInputs: {
      fluidId: 'C2H6',
      temperature_K: 310.0,
      pressure_Pa: 50.0e5,
      moles_n: 1.0,
      rootPreference: 'vapor',
    },
    selfCheckPrompt:
      'At $310\\,\\mathrm{K}$ and $50\\,\\mathrm{bar}$, why does Ethane have $Z \\approx 0.340$ whereas Methane has $Z \\approx 0.935$?',
    selfCheckOptions: [
      {
        id: 'tpvt5-a',
        label:
          'Ethane has T_c = 305.32 K and P_c = 48.72 bar, so 310 K and 50 bar places Ethane right at its critical region (T_r = 1.015, P_r = 1.026), whereas Methane (T_c = 190.56 K) is deeply supercritical (T_r = 1.627).',
        isCorrect: true,
        feedback:
          'Correct! By corresponding states, PVT non-ideality depends on reduced coordinates (T_r = T/T_c, P_r = P/P_c) and acentricity ω.',
      },
      {
        id: 'tpvt5-b',
        label: 'Methane has a higher molecular weight than Ethane.',
        isCorrect: false,
        feedback:
          'Methane (16.04 g/mol) is lighter than Ethane (30.07 g/mol) and has weaker dispersion forces, yielding a much lower critical temperature (190.56 K vs. 305.32 K).',
      },
      {
        id: 'tpvt5-c',
        label: 'Acentric factor ω only affects ideal gas molar volume.',
        isCorrect: false,
        feedback:
          'Ideal gas volume v = RT/P is independent of fluid identity; ω governs the temperature-dependent attraction function α(T_r, ω) in the Peng–Robinson EOS.',
      },
    ],
    keyObservation:
      'At 310 K and 50 bar, Ethane (T_r = 1.015, P_r = 1.026, ω = 0.0995) compresses to Z = 0.3404 (-65.96% deviation), whereas Methane (T_r = 1.627, P_r = 1.087, ω = 0.01142) has Z = 0.9350 (-6.50% deviation).',
    engineeringExplanation:
      'The Principle of Corresponding States shows that fluids at the same reduced temperature $T_r = T/T_c$, reduced pressure $P_r = P/P_c$, and Pitzer acentric factor $\\omega$ exhibit similar compressibility factors $Z$. Comparing two fluids at the same absolute $(T, P)$ places them at vastly different reduced coordinates.',
  },
];

export const THERMO_VLE_GUIDED_QUESTIONS: SharedGuidedQuestion<BinaryVLEInputs>[] = [
  {
    id: 'tvle-1-vapor-enrichment',
    conditionTag: 'VLE Inquiry 01 · Selective Vapor Enrichment (y_A > x_A)',
    number: '01',
    question:
      'Why is the equilibrium vapor mole fraction $y_A$ always greater than the liquid mole fraction $x_A$ whenever $P_A^{\\mathrm{sat}} > P_B^{\\mathrm{sat}}$ ($0 < x_A < 1$)?',
    experimentPrompt:
      'Load the Equimolar Ideal Binary Mixture preset ($x_A = 0.50$, $P_A^{\\mathrm{sat}} = 125\\,\\mathrm{kPa}$, $P_B^{\\mathrm{sat}} = 50\\,\\mathrm{kPa}$) and compare $x_A$ and $y_A$.',
    presetActionLabel: 'Apply Equimolar Mixture (x_A = 0.50, α = 2.50)',
    suggestedInputs: {
      liquidMoleFraction_xA: 0.5,
      psatA_kPa: 125.0,
      psatB_kPa: 50.0,
      systemPressure_kPa: 80.0,
      systemTemperature_K: 350.0,
    },
    selfCheckPrompt:
      'At $x_A = 0.50$ with $P_A^{\\mathrm{sat}} = 125\\,\\mathrm{kPa}$ and $P_B^{\\mathrm{sat}} = 50\\,\\mathrm{kPa}$, what is the equilibrium bubble-point vapor composition $y_A$?',
    selfCheckOptions: [
      {
        id: 'tvle1-a',
        label:
          'p_A = 62.5 kPa and p_B = 25.0 kPa give P_bubble = 87.5 kPa, so y_A = p_A / P_bubble = 62.5 / 87.5 = 0.7143 (> x_A = 0.50).',
        isCorrect: true,
        feedback:
          'Correct! Because pure A has 2.5× the vapor pressure of pure B, an equimolar liquid generates a vapor that is 71.4% component A.',
      },
      {
        id: 'tvle1-b',
        label: 'An equimolar liquid (x_A = 0.50) always produces an equimolar vapor (y_A = 0.50).',
        isCorrect: false,
        feedback:
          'y_A = x_A occurs for all compositions only when P_A^sat = P_B^sat (α_AB = 1.0).',
      },
      {
        id: 'tvle1-c',
        label: 'The heavier component B enriches in the vapor phase.',
        isCorrect: false,
        feedback:
          'Component B has the lower saturation vapor pressure (50 kPa < 125 kPa), so it concentrates in the liquid phase (y_B = 0.2857 < x_B = 0.50).',
      },
    ],
    keyObservation:
      'At x_A = 0.50, P_A^sat = 125 kPa, and P_B^sat = 50 kPa (α_AB = 2.50), the bubble pressure is 87.50 kPa and the equilibrium vapor mole fraction is y_A = 0.7143.',
    engineeringExplanation:
      'Dividing Raoult’s and Dalton’s laws for species A and B gives $\\frac{y_A / x_A}{y_B / x_B} = \\frac{P_A^{\\mathrm{sat}}}{P_B^{\\mathrm{sat}}} = \\alpha_{AB}$. Rearranging yields $y_A = \\frac{\\alpha_{AB} x_A}{1 + (\\alpha_{AB} - 1)x_A}$, which strictly exceeds $x_A$ whenever $\\alpha_{AB} > 1$ and $0 < x_A < 1$.',
  },
  {
    id: 'tvle-2-bubble-vs-dew',
    conditionTag: 'VLE Inquiry 02 · Bubble-Point vs. Dew-Point Curves',
    number: '02',
    question:
      'On an isothermal $P\\text{–}x\\text{–}y$ diagram, why is the Bubble-Point line straight while the Dew-Point curve bows downward below it?',
    experimentPrompt:
      'Apply the Wide-Boiling High Volatility Contrast preset ($P_A^{\\mathrm{sat}} = 180\\,\\mathrm{kPa}$, $P_B^{\\mathrm{sat}} = 40\\,\\mathrm{kPa}$, $\\alpha_{AB} = 4.50$) and examine the $P\\text{–}x\\text{–}y$ diagram.',
    presetActionLabel: 'Apply Wide-Boiling Mixture (α_AB = 4.50)',
    suggestedInputs: {
      liquidMoleFraction_xA: 0.4,
      psatA_kPa: 180.0,
      psatB_kPa: 40.0,
      systemPressure_kPa: 85.0,
      systemTemperature_K: 350.0,
    },
    selfCheckPrompt:
      'Which physical and mathematical statement accurately distinguishes the Bubble-Point curve from the Dew-Point curve at constant temperature?',
    selfCheckOptions: [
      {
        id: 'tvle2-a',
        label:
          'P_bubble(x_A) = x_A P_A^sat + (1 - x_A) P_B^sat is linear in liquid composition x_A (upper boundary), whereas P_dew(y_A) = [y_A/P_A^sat + (1 - y_A)/P_B^sat]^(-1) is the harmonic weighted mean in vapor composition y_A (lower boundary).',
        isCorrect: true,
        feedback:
          'Correct! Because the harmonic mean is always less than or equal to the arithmetic mean for positive numbers, P_dew(z) < P_bubble(z) for all 0 < z < 1 when P_A^sat ≠ P_B^sat.',
      },
      {
        id: 'tvle2-b',
        label: 'The Dew-Point pressure is always higher than the Bubble-Point pressure at fixed T.',
        isCorrect: false,
        feedback:
          'At constant temperature, high pressure compresses the mixture into a liquid (above P_bubble), and lowering pressure below P_dew vaporizes it completely; thus P_bubble > P_dew.',
      },
      {
        id: 'tvle2-c',
        label: 'Both curves are straight lines that never meet.',
        isCorrect: false,
        feedback:
          'The two curves meet at the pure-component endpoints x_A = 0 (P = P_B^sat) and x_A = 1 (P = P_A^sat), enclosing the two-phase lens.',
      },
    ],
    keyObservation:
      'At composition 0.40 with P_A^sat = 180 kPa and P_B^sat = 40 kPa, P_bubble(0.40) = 96.00 kPa whereas P_dew(0.40) = 58.06 kPa—creating a 37.94 kPa two-phase pressure window.',
    engineeringExplanation:
      'At constant temperature, a liquid mixture begins to form its first vapor bubble when reduced to $P_{\\mathrm{bubble}}(x_A) = x_A P_A^{\\mathrm{sat}} + (1 - x_A)P_B^{\\mathrm{sat}}$. Conversely, a vapor mixture of composition $y_A$ begins to condense its first liquid droplet when compressed to $P_{\\mathrm{dew}}(y_A) = \\left(\\frac{y_A}{P_A^{\\mathrm{sat}}} + \\frac{1 - y_A}{P_B^{\\mathrm{sat}}}\\right)^{-1}$.',
  },
  {
    id: 'tvle-3-saturation-pressure-ratio',
    conditionTag: 'VLE Inquiry 03 · Volatility Ratio & Phase Envelope Width',
    number: '03',
    question:
      'What happens to the $P\\text{–}x\\text{–}y$ phase lens and the $y_A\\text{–}x_A$ curve when $P_A^{\\mathrm{sat}}$ and $P_B^{\\mathrm{sat}}$ approach each other ($\\alpha_{AB} \\to 1$)?',
    experimentPrompt:
      'Load the Equal-Volatility Limit preset ($P_A^{\\mathrm{sat}} = P_B^{\\mathrm{sat}} = 100\\,\\mathrm{kPa}$, $\\alpha_{AB} = 1.00$) and inspect both the $P\\text{–}x\\text{–}y$ and $y_A\\text{–}x_A$ tabs.',
    presetActionLabel: 'Apply Equal-Volatility Limit (P_A^sat = P_B^sat = 100 kPa)',
    suggestedInputs: {
      liquidMoleFraction_xA: 0.6,
      psatA_kPa: 100.0,
      psatB_kPa: 100.0,
      systemPressure_kPa: 100.0,
      systemTemperature_K: 350.0,
    },
    selfCheckPrompt:
      'When $P_A^{\\mathrm{sat}} = P_B^{\\mathrm{sat}} = 100\\,\\mathrm{kPa}$, what happens to $P_{\\mathrm{bubble}}$, $P_{\\mathrm{dew}}$, and $y_A$?',
    selfCheckOptions: [
      {
        id: 'tvle3-a',
        label:
          'P_bubble(x_A) and P_dew(y_A) collapse onto a single horizontal line at 100 kPa, and y_A = x_A across all compositions, resulting in zero vapor enrichment.',
        isCorrect: true,
        feedback:
          'Correct! When α_AB = P_A^sat / P_B^sat = 1, boiling produces a vapor with the exact same composition as the liquid.',
      },
      {
        id: 'tvle3-b',
        label: 'The bubble pressure drops to zero at x_A = 0.50.',
        isCorrect: false,
        feedback:
          'P_bubble = 0.6(100) + 0.4(100) = 100 kPa remains constant across all compositions.',
      },
      {
        id: 'tvle3-c',
        label: 'Separation by simple distillation becomes easiest when P_A^sat = P_B^sat.',
        isCorrect: false,
        feedback:
          'When α_AB = 1, the McCabe–Thiele equilibrium curve lies on the 45° diagonal (y = x) and simple distillation requires infinite stages.',
      },
    ],
    keyObservation:
      'At P_A^sat = P_B^sat = 100 kPa (α_AB = 1.00), P_bubble = P_dew = 100.00 kPa and y_A = x_A = 0.6000.',
    engineeringExplanation:
      'The vertical thickness of the isothermal $P\\text{–}x\\text{–}y$ lens and the upward bow of the $y_A\\text{–}x_A$ equilibrium curve are governed by the ratio $\\alpha_{AB} = P_A^{\\mathrm{sat}} / P_B^{\\mathrm{sat}}$. As $\\alpha_{AB} \\to 1$, the driving force for vapor–liquid separation vanishes.',
  },
  {
    id: 'tvle-4-tie-line-phase-split',
    conditionTag: 'VLE Inquiry 04 · Reading Constant-Pressure Tie-Lines',
    number: '04',
    question:
      'How do we determine whether a binary mixture at $(z_A, P_{\\mathrm{sys}})$ is a compressed liquid, a two-phase VLE mixture, or a superheated vapor?',
    experimentPrompt:
      'Apply the Light-Component-Rich Compressed Liquid preset ($x_A = 0.85, P_{\\mathrm{sys}} = 135\\,\\mathrm{kPa}$), then gradually lower $P_{\\mathrm{sys}}$ to $100\\,\\mathrm{kPa}$ and $60\\,\\mathrm{kPa}$.',
    presetActionLabel: 'Apply High-Pressure Compressed Liquid (P_sys = 135 kPa)',
    suggestedInputs: {
      liquidMoleFraction_xA: 0.85,
      psatA_kPa: 140.0,
      psatB_kPa: 45.0,
      systemPressure_kPa: 135.0,
      systemTemperature_K: 350.0,
    },
    selfCheckPrompt:
      'For a mixture with $z_A = 0.85$, $P_A^{\\mathrm{sat}} = 140\\,\\mathrm{kPa}$, and $P_B^{\\mathrm{sat}} = 45\\,\\mathrm{kPa}$ ($P_{\\mathrm{bubble}} = 125.75\\,\\mathrm{kPa}$, $P_{\\mathrm{dew}} = 106.32\\,\\mathrm{kPa}$), what is the phase state at $P_{\\mathrm{sys}} = 135\\,\\mathrm{kPa}$?',
    selfCheckOptions: [
      {
        id: 'tvle4-a',
        label:
          'Compressed (subcooled) liquid, because P_sys (135 kPa) exceeds the mixture bubble pressure P_bubble (125.75 kPa), preventing any vapor bubbles from forming.',
        isCorrect: true,
        feedback:
          'Correct! At constant temperature, compressing a mixture above its bubble pressure keeps it 100% liquid.',
      },
      {
        id: 'tvle4-b',
        label: 'Superheated vapor, because high pressure favors the gas phase.',
        isCorrect: false,
        feedback:
          'On a P–x–y diagram (constant T), the high-pressure region at the top of the chart is the compressed liquid phase; superheated vapor lies at low pressures below P_dew.',
      },
      {
        id: 'tvle4-c',
        label: 'Two-phase equilibrium, because 135 kPa is between 45 kPa and 140 kPa.',
        isCorrect: false,
        feedback:
          'Whether a specific composition z_A is two-phase depends on whether P_sys lies between P_dew(z_A) = 106.32 kPa and P_bubble(z_A) = 125.75 kPa at that composition.',
      },
    ],
    keyObservation:
      'At z_A = 0.85 (P_bubble = 125.75 kPa, P_dew = 106.32 kPa), operating at P_sys = 135.0 kPa places the state marker above the bubble line in the Compressed Liquid region.',
    engineeringExplanation:
      'On an isothermal $P\\text{–}x\\text{–}y$ diagram, a mixture of overall composition $z_A$ is a compressed liquid for $P_{\\mathrm{sys}} > P_{\\mathrm{bubble}}(z_A)$, splits along a horizontal tie-line into saturated liquid $x_{A,\\mathrm{eq}}$ and saturated vapor $y_{A,\\mathrm{eq}}$ for $P_{\\mathrm{dew}}(z_A) \\le P_{\\mathrm{sys}} \\le P_{\\mathrm{bubble}}(z_A)$, and is a superheated vapor for $P_{\\mathrm{sys}} < P_{\\mathrm{dew}}(z_A)$.',
  },
  {
    id: 'tvle-5-distillation-connection',
    conditionTag: 'VLE Inquiry 05 · Connecting Thermodynamics to McCabe–Thiele Distillation',
    number: '05',
    question:
      'How does Raoult’s Law in the Thermodynamics Laboratory provide the exact equilibrium curve used in the Distillation Laboratory?',
    experimentPrompt:
      'Load the Close-Boiling Mixture preset ($P_A^{\\mathrm{sat}} = 92\\,\\mathrm{kPa}$, $P_B^{\\mathrm{sat}} = 80\\,\\mathrm{kPa}$, $\\alpha_{AB} = 1.15$) and switch to Tab 2 ($y_A\\text{ vs. }x_A$ Curve).',
    presetActionLabel: 'Apply Close-Boiling Mixture (α_AB = 1.15)',
    suggestedInputs: {
      liquidMoleFraction_xA: 0.5,
      psatA_kPa: 92.0,
      psatB_kPa: 80.0,
      systemPressure_kPa: 85.8,
      systemTemperature_K: 350.0,
    },
    selfCheckPrompt:
      'How is the McCabe–Thiele relative volatility $\\alpha_{AB}$ related to Raoult’s and Dalton’s laws for an ideal binary mixture?',
    selfCheckOptions: [
      {
        id: 'tvle5-a',
        label:
          'Combining y_A P = x_A P_A^sat and y_B P = x_B P_B^sat yields α_AB = (y_A/x_A)/(y_B/x_B) = P_A^sat / P_B^sat, which directly produces y_A = α_AB x_A / [1 + (α_AB - 1)x_A].',
        isCorrect: true,
        feedback:
          'Correct! Ideal binary VLE from Raoult’s and Dalton’s laws is the thermodynamic foundation of the constant-relative-volatility McCabe–Thiele diagram.',
      },
      {
        id: 'tvle5-b',
        label: 'Relative volatility α_AB equals the sum P_A^sat + P_B^sat.',
        isCorrect: false,
        feedback:
          'Relative volatility is the dimensionless ratio P_A^sat / P_B^sat, not their sum.',
      },
      {
        id: 'tvle5-c',
        label: 'Close-boiling mixtures (α_AB = 1.15) require fewer distillation trays than wide-boiling mixtures (α_AB = 4.50).',
        isCorrect: false,
        feedback:
          'When α_AB = 1.15, y_A = 0.535 is barely above x_A = 0.500, so each equilibrium stage achieves very small enrichment and many trays (plus high reflux) are required.',
      },
    ],
    keyObservation:
      'At P_A^sat = 92 kPa and P_B^sat = 80 kPa, α_AB = 1.15 and an equimolar liquid (x_A = 0.500) enriches only to y_A = 0.5349 in a single equilibrium contact.',
    engineeringExplanation:
      'Each equilibrium stage in a distillation column acts as a vapor–liquid equilibrium contact governed by phase thermodynamics. When $\\alpha_{AB} = P_A^{\\mathrm{sat}}/P_B^{\\mathrm{sat}}$ is large, a single stage achieves substantial enrichment; when $\\alpha_{AB}$ is close to $1$, tens of trays and high reflux ratios are needed.',
  },
];

export const PROCESS_CONTROL_GUIDED_QUESTIONS: SharedGuidedQuestion<ProcessControlInputs>[] = [
  {
    id: 'pc-1-time-constant',
    conditionTag: 'Control Inquiry 01 · Process Time Constant τ & Response Speed',
    number: '01',
    question:
      'How does the first-order process time constant $\\tau$ affect open-loop response speed versus the final steady-state change $\\Delta Y_{\\mathrm{ss}} = K_p \\Delta u$?',
    experimentPrompt:
      'Apply the First-Order Open-Loop Step preset ($K_p = 1.5, \\tau = 20\\,\\mathrm{s}, \\theta = 0\\,\\mathrm{s}$), save the run, then apply the Slow Process preset ($\\tau = 50\\,\\mathrm{s}$) or double $\\tau$.',
    presetActionLabel: 'Apply Open-Loop First-Order Step (τ = 20 s)',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 0.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'open-loop',
      controllerGain_Kc: 2.0,
      integralTime_Ti_s: 20.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'For $\\tau \\frac{dy}{dt} + y = K_p \\Delta u$, what fraction of the total steady-state change $K_p \\Delta u$ is reached at $t = t_{\\mathrm{step}} + \\tau$, and does changing $\\tau$ alter the final steady-state value?',
    selfCheckOptions: [
      {
        id: 'pc1-a',
        label:
          'At t = t_step + τ, the output reaches 1 − exp(−1) = 63.2% of Kp·Δu; increasing τ slows the rise time (t_r ≈ 2.20τ) without changing the final steady-state gain Kp·Δu.',
        isCorrect: true,
        feedback:
          'Correct! For Kp = 1.5 and Δu = +10%, ΔY_ss = +15.0% (final Y = 65.0%) regardless of τ, while 63.2% of that rise (59.48%) occurs one time constant τ after the step.',
      },
      {
        id: 'pc1-b',
        label: 'Doubling τ doubles the final steady-state output change ΔY_ss.',
        isCorrect: false,
        feedback:
          'Steady-state change when dy/dt = 0 is determined solely by ΔY_ss = Kp·Δu; τ only governs how fast the system approaches that steady state.',
      },
      {
        id: 'pc1-c',
        label: 'The process reaches 100% of its final value at t = t_step + τ.',
        isCorrect: false,
        feedback:
          'The initial tangent slope hits 100% at t = t_step + τ, but the exponential curve 1 − exp(−t/τ) is at 63.2% at t = τ and ~98.2% at t = 4τ.',
      },
    ],
    keyObservation:
      'For Kp = 1.5, Δu = +10%, and τ = 20 s, Y(t) reaches 59.48% (63.2% of the +15% step) at t = 25.0 s with a 10%–90% rise time of 43.9 s (2.197τ).',
    engineeringExplanation:
      'Solving $\\tau \\frac{dy}{dt} + y = K_p \\Delta u$ from $y(0) = 0$ yields $y(t) = K_p \\Delta u \\left(1 - e^{-t/\\tau}\\right)$. At $t = \\tau$, $1 - e^{-1} = 0.6321$, and the $10\\%\\text{–}90\\%$ rise time is $\\tau \\ln(9) \\approx 2.197\\tau$.',
  },
  {
    id: 'pc-2-dead-time-challenge',
    conditionTag: 'Control Inquiry 02 · Why Dead Time θ Challenges Feedback Control',
    number: '02',
    question:
      'Why does process dead time $\\theta$ (transport delay) make closed-loop feedback control much harder to stabilize than a pure first-order lag $\\tau$?',
    experimentPrompt:
      'Load the Delay-Dominated FOPDT preset ($\\theta = 12\\,\\mathrm{s}, \\tau = 15\\,\\mathrm{s}$, $\\theta/\\tau = 0.80$) under PI control and inspect both $Y(t)$ and $U_{\\mathrm{act}}(t)$.',
    presetActionLabel: 'Apply Delay-Dominated FOPDT (θ = 12 s, τ = 15 s)',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 15.0,
      deadTime_theta_s: 12.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 160.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 0.9,
      integralTime_Ti_s: 20.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 80.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'Why does a large dead-time ratio $\\theta/\\tau$ force engineers to detune (lower) controller gain $K_c$?',
    selfCheckOptions: [
      {
        id: 'pc2-a',
        label:
          'During dead time θ, control actions u(t) have zero immediate effect on Y(t); the controller acts on delayed information (phase lag −ωθ), over-correcting before feedback arrives.',
        isCorrect: true,
        feedback:
          'Correct! Dead time introduces non-minimum-phase lag exp(−θs) whose phase angle −ωθ grows unboundedly with frequency, rapidly eroding phase margin.',
      },
      {
        id: 'pc2-b',
        label: 'Dead time increases the steady-state process gain Kp.',
        isCorrect: false,
        feedback:
          'At steady state (s → 0), exp(−θs) → 1, so dead time θ does not alter the steady-state gain Kp.',
      },
      {
        id: 'pc2-c',
        label: 'Dead time eliminates the need for integral action.',
        isCorrect: false,
        feedback:
          'Integral action is still required to eliminate steady-state offset, though Kc must be reduced and τI adjusted to accommodate the delay.',
      },
    ],
    keyObservation:
      'With θ = 12 s (t_step = 5 s), Y(t) stays flat at 50.0% until t = 17.0 s while the PI controller continues ramping U_act(t), producing overshoot and oscillatory settling.',
    engineeringExplanation:
      'In the transfer function $G_p(s) = \\frac{K_p e^{-\\theta s}}{\\tau s + 1}$, the delay factor $e^{-i\\omega\\theta}$ adds a phase lag of $-\\omega\\theta$ radians without attenuating gain $|e^{-i\\omega\\theta}| = 1$. When $\\theta/\\tau$ is large, high controller gain causes corrective actions to arrive out of phase, amplifying oscillations.',
  },
  {
    id: 'pc-3-proportional-gain-offset',
    conditionTag: 'Control Inquiry 03 · Proportional Gain Kc & Steady-State Offset',
    number: '03',
    question:
      'What happens to response speed, overshoot, and steady-state offset $e_{\\mathrm{ss}}$ when proportional gain $K_c$ increases in a P-only controller?',
    experimentPrompt:
      'Load the Conservative Proportional (P) Control preset ($K_c = 1.6$), observe $e_{\\mathrm{ss}}$, and use Tab 5 (Parameter Sensitivity for $K_c$) to compare $0.5\\times, 1.0\\times, 2.0\\times K_c$.',
    presetActionLabel: 'Apply Proportional (P) Control (K_c = 1.6)',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 3.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'P',
      controllerGain_Kc: 1.6,
      integralTime_Ti_s: 20.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'For a P-only controller $u = U_0 + K_c e(t)$ on a process with gain $K_p = 1.5$ and setpoint step $\\Delta r = +15\\%$, why can $e_{\\mathrm{ss}}$ never reach zero for finite $K_c$?',
    selfCheckOptions: [
      {
        id: 'pc3-a',
        label:
          'Because maintaining a non-zero steady-state output change Δy_ss requires a non-zero actuator change Δu_ss = Kc·e_ss, yielding e_ss = Δr / (1 + Kp·Kc) = 4.41% at Kc = 1.6.',
        isCorrect: true,
        feedback:
          'Correct! Increasing Kc shrinks the offset e_ss = Δr/(1 + Kp·Kc) and speeds up initial response, but too large a Kc on a delayed plant drives the loop into oscillation.',
      },
      {
        id: 'pc3-b',
        label: 'Proportional control always achieves zero steady-state error if given enough time.',
        isCorrect: false,
        feedback:
          'If e_ss were zero, then u = U0 + Kc(0) = U0, which would return the process output to Y0 = 50%, contradicting Y = 65%.',
      },
      {
        id: 'pc3-c',
        label: 'Increasing Kc increases the steady-state offset.',
        isCorrect: false,
        feedback:
          'Increasing Kc decreases the magnitude of steady-state offset e_ss = Δr/(1 + Kp·Kc), at the cost of reduced stability margin.',
      },
    ],
    keyObservation:
      'At Kp = 1.5 and Kc = 1.6 (loop gain Kp·Kc = 2.40), a +15% setpoint step settles at Y_ss = 60.59% with a permanent steady-state offset e_ss = 4.41%.',
    engineeringExplanation:
      'At closed-loop steady state, $y_{\\mathrm{ss}} = K_p u_{\\mathrm{ss}} = K_p K_c (\\Delta r - y_{\\mathrm{ss}})$. Solving for the closed-loop output gives $y_{\\mathrm{ss}} = \\frac{K_p K_c}{1 + K_p K_c}\\Delta r$ and steady-state error $e_{\\mathrm{ss}} = \\frac{\\Delta r}{1 + K_p K_c}$.',
  },
  {
    id: 'pc-4-integral-eliminates-offset',
    conditionTag: 'Control Inquiry 04 · How Integral Action Eliminates Offset',
    number: '04',
    question:
      'Why does adding integral action ($\\frac{K_c}{\\tau_I}\\int_0^t e(\\tau^{\\prime})\\,d\\tau^{\\prime}$) eliminate steady-state offset completely?',
    experimentPrompt:
      'Load the Balanced PI Control preset ($K_c = 1.8, \\tau_I = 18\\,\\mathrm{s}$) and inspect Tab 3 (Control Error & PID Terms) to see how the integral term provides the steady-state actuator bias.',
    presetActionLabel: 'Apply Balanced PI Control (K_c = 1.8, τ_I = 18 s)',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 3.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 1.8,
      integralTime_Ti_s: 18.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'When $e(t) \\to 0$ at steady state under PI control, what holds the actuator at $U_{\\mathrm{act}} = 60\\%$ ($+10\\%$ above baseline) so that $Y(t)$ stays at $65\\%$?',
    selfCheckOptions: [
      {
        id: 'pc4-a',
        label:
          'The accumulated historical integral term (Kc/τI)∫e(t)dt remains at +10.0% even after e(t) reaches 0, supplying the exact steady-state actuator bias needed.',
        isCorrect: true,
        feedback:
          'Correct! Because the integral state only stops changing when its time derivative e(t) = 0, any unsaturated stable steady state under PI control must have e_ss = 0.',
      },
      {
        id: 'pc4-b',
        label: 'The proportional term Kc·e(t) stays at +10% when e(t) = 0.',
        isCorrect: false,
        feedback:
          'When e(t) = 0, the proportional term Kc·e(t) is strictly 0%; the integral memory term holds the +10% actuator offset.',
      },
      {
        id: 'pc4-c',
        label: 'Integral action changes the physical time constant τ of the vessel.',
        isCorrect: false,
        feedback:
          'The physical vessel parameters (Kp, τ, θ) are hardware properties; the controller alters closed-loop dynamics via feedback.',
      },
    ],
    keyObservation:
      'Under PI control (Kc = 1.8, τI = 18 s), steady-state error drops to e_ss = 0.00%, the proportional term returns to 0.0%, and the integral term settles at +10.0% (U_act = 60.0%).',
    engineeringExplanation:
      'In a PI controller, $\\frac{dI}{dt} = e(t) = r - Y$. Therefore, a constant steady state ($\\frac{dI}{dt} = 0$) can exist (without actuator saturation) if and only if $e_{\\mathrm{ss}} = 0$.',
  },
  {
    id: 'pc-5-excessive-integral-oscillation',
    conditionTag: 'Control Inquiry 05 · Excessive Integral Action & Oscillation',
    number: '05',
    question:
      'Why does making the integral time $\\tau_I$ too small (excessive integral reset rate $1/\\tau_I$) cause severe overshoot and oscillation?',
    experimentPrompt:
      'Load the Aggressive / Poorly Tuned Oscillatory Loop preset ($K_c = 4.2, \\tau_I = 6\\,\\mathrm{s}$) or inspect Tab 5 (Parameter Sensitivity for $\\tau_I$).',
    presetActionLabel: 'Apply Oscillatory Loop (K_c = 4.2, τ_I = 6 s)',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 5.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 140.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 4.2,
      integralTime_Ti_s: 6.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 70.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'Why does a small $\\tau_I$ (fast integral action) destabilize a feedback loop?',
    selfCheckOptions: [
      {
        id: 'pc5-a',
        label:
          'Because integral action adds up to −90° of phase lag and continues driving the actuator upward until after Y(t) crosses the setpoint, forcing a reverse overshoot cycle.',
        isCorrect: true,
        feedback:
          'Correct! Smaller τI means stronger integral gain Kc/τI. Integrating error rapidly during rise builds a huge integral charge that can only be unwound after e(t) changes sign (overshoot).',
      },
      {
        id: 'pc5-b',
        label: 'Smaller τI means weaker integral action.',
        isCorrect: false,
        feedback:
          'Because τI is in the denominator of (Kc/τI)∫e dt, a smaller τI produces a higher integral reset rate and more aggressive accumulation.',
      },
      {
        id: 'pc5-c',
        label: 'Integral action adds +90° of stabilizing phase lead.',
        isCorrect: false,
        feedback:
          'Derivative action adds phase lead; integration (1/s) introduces −90° of phase lag.',
      },
    ],
    keyObservation:
      'With Kc = 4.2 and τI = 6.0 s on a delayed plant (θ = 5 s), the loop crosses the setpoint repeatedly and fails to settle within the 140 s observation window.',
    engineeringExplanation:
      'The PI transfer function $G_c(s) = K_c\\left(1 + \\frac{1}{\\tau_I s}\\right)$ has phase angle $-\\arctan\\!\\left(\\frac{1}{\\omega \\tau_I}\\right) < 0$. When $\\tau_I$ is much smaller than the process time constant $\\tau$, this phase lag combines with process lag and dead time to reach $-180^\\circ$ at a frequency where loop gain exceeds $1$.',
  },
  {
    id: 'pc-6-derivative-damping',
    conditionTag: 'Control Inquiry 06 · Role of Filtered Derivative Action (τ_D)',
    number: '06',
    question:
      'How does filtered derivative action on the measured process variable ($-K_c \\tau_D \\frac{dY}{dt}$) damp overshoot without causing a "derivative kick" on setpoint steps?',
    experimentPrompt:
      'Apply the PID Controller with Filtered Derivative preset ($K_c = 2.2, \\tau_I = 16\\,\\mathrm{s}, \\tau_D = 2.5\\,\\mathrm{s}$) and inspect Tab 3 (Control Error & PID Terms).',
    presetActionLabel: 'Apply Filtered PID Control (τ_D = 2.5 s)',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 4.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PID',
      controllerGain_Kc: 2.2,
      integralTime_Ti_s: 16.0,
      derivativeTime_Td_s: 2.5,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'Why do industrial and educational PID controllers take the derivative of $-Y(t)$ rather than $e(t) = r(t) - Y(t)$?',
    selfCheckOptions: [
      {
        id: 'pc6-a',
        label:
          'Differentiating a step change in r(t) would produce an impulse spike ("derivative kick") that saturates the actuator, whereas −dY/dt is smooth and acts as a predictive brake as Y approaches r.',
        isCorrect: true,
        feedback:
          'Correct! When r(t) is constant after the step, de/dt = −dY/dt, so differentiating −Y(t) provides identical damping without spiking at t = t_step.',
      },
      {
        id: 'pc6-b',
        label: 'Derivative action alone eliminates steady-state offset.',
        isCorrect: false,
        feedback:
          'At steady state dY/dt = 0, so the derivative term vanishes; integral action is what eliminates steady-state offset.',
      },
      {
        id: 'pc6-c',
        label: 'Derivative action should be set as large as possible on noisy processes.',
        isCorrect: false,
        feedback:
          'Excessive τD amplifies high-frequency measurement noise and can cause actuator chatter, which is why a derivative filter (α_D·τ_D) is required.',
      },
    ],
    keyObservation:
      'In Tab 3, the yellow derivative curve −Kc·Df(t) stays at 0% at t = 5.0 s (no kick) and dips negative as Y(t) rises rapidly, braking the actuator before Y(t) overshoots 65%.',
    engineeringExplanation:
      'Filtered derivative action $(\\alpha_D \\tau_D)\\frac{dD_f}{dt} + D_f = \\tau_D \\frac{dY}{dt}$ introduces phase lead that anticipates future error based on the current rate of change of $Y(t)$, while the filter time constant $\\alpha_D \\tau_D$ bounds high-frequency gain to $K_c / \\alpha_D$.',
  },
  {
    id: 'pc-7-integral-windup',
    conditionTag: 'Control Inquiry 07 · Actuator Saturation & Integral Windup',
    number: '07',
    question:
      'What causes integral windup when an actuator hits its physical limit ($U_{\\max}$ or $U_{\\min}$), and how does windup degrade closed-loop recovery?',
    experimentPrompt:
      'Load Preset 9 (Actuator Saturation & Integral Windup, Anti-Windup OFF) and inspect Tab 2 (Controller Output $u_{\\mathrm{cmd}}$ vs. $U_{\\mathrm{act}}$).',
    presetActionLabel: 'Apply Saturation with Anti-Windup OFF',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 4.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 150.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 2.4,
      integralTime_Ti_s: 8.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 75.0,
      antiWindupEnabled: false,
      setpointTarget_Ysp: 80.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 80.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'In Preset 9, why does the actuator remain stuck at $U_{\\mathrm{act}} = 75\\%$ even after $Y(t)$ exceeds the $80\\%$ setpoint?',
    selfCheckOptions: [
      {
        id: 'pc7-a',
        label:
          'Because the integral term continued accumulating error while the valve was clamped at 75%, driving u_cmd above 115%; Y(t) must overshoot above 80% (e < 0) for a long time just to unwind u_cmd back below 75%.',
        isCorrect: true,
        feedback:
          'Correct! That gap between unconstrained controller demand u_cmd and physical actuator capability U_act is classic integral windup.',
      },
      {
        id: 'pc7-b',
        label: 'The process gain Kp increases when the actuator saturates.',
        isCorrect: false,
        feedback:
          'The process gain Kp is constant; the large overshoot is caused by the controller holding the actuator at 75% too long due to wound-up integral memory.',
      },
      {
        id: 'pc7-c',
        label: 'Integral windup only happens in P-only controllers.',
        isCorrect: false,
        feedback:
          'P-only controllers have no memory state and respond instantaneously to e(t); windup is strictly a phenomenon of controllers with integral (memory) states.',
      },
    ],
    keyObservation:
      'Without anti-windup, u_cmd climbs to 118.4% while U_act is clamped at 75.0%, causing Y(t) to overshoot to 84.5% (15.0% overshoot) before the actuator finally comes off its upper stop.',
    engineeringExplanation:
      'When $u_{\\mathrm{cmd}}(t) > U_{\\max}$, the feedback loop is effectively broken because the plant receives a constant input $U_{\\max}$ regardless of further increases in $u_{\\mathrm{cmd}}$. Unchecked integration of $e(t)$ during saturation stores phantom error that delays desaturation.',
  },
  {
    id: 'pc-8-anti-windup-protection',
    conditionTag: 'Control Inquiry 08 · Anti-Windup Protection & Actuator Limits',
    number: '08',
    question:
      'How does conditional integration (clamping anti-windup) improve transient performance under the exact same actuator saturation constraint ($U_{\\max} = 75\\%$)?',
    experimentPrompt:
      'After saving Preset 9 (Anti-Windup OFF), click below to load Preset 10 (Anti-Windup ON) and compare Peak Overshoot, Saturation Duration, and IAE.',
    presetActionLabel: 'Apply Saturation with Anti-Windup ON',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 4.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 150.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PI',
      controllerGain_Kc: 2.4,
      integralTime_Ti_s: 8.0,
      derivativeTime_Td_s: 0.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 75.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 80.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 80.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'What does conditional integration anti-windup do when $u_{\\mathrm{cmd}}(t) > U_{\\max}$ and $e(t) > 0$?',
    selfCheckOptions: [
      {
        id: 'pc8-a',
        label:
          'It freezes (clamps) the integral accumulator while the actuator is saturated in the direction of the error, allowing u_cmd to drop below U_max as soon as Y(t) approaches the setpoint.',
        isCorrect: true,
        feedback:
          'Correct! Clamping the integral state during saturation cuts peak overshoot from 15.0% down to ~1.5% and dramatically lowers IAE.',
      },
      {
        id: 'pc8-b',
        label: 'It physically removes the 75% valve limit so the valve can open to 120%.',
        isCorrect: false,
        feedback:
          'A software algorithm cannot exceed physical hardware limits (U_act still never exceeds 75%); anti-windup prevents the controller’s internal integral state from winding up.',
      },
      {
        id: 'pc8-c',
        label: 'It permanently turns off integral action for the rest of the simulation.',
        isCorrect: false,
        feedback:
          'Integration resumes automatically as soon as the command re-enters the linear operating range [U_min, U_max], preserving zero steady-state offset.',
      },
    ],
    keyObservation:
      'Enabling anti-windup at U_max = 75% lowers peak u_cmd from 118.4% to 86.0%, slashes overshoot from 15.0% to 1.5%, and reduces IAE from 575 to 479 %·s.',
    engineeringExplanation:
      'Real control valves, heaters, and pumps have hard physical bounds ($0\\text{–}100\\%$ or tighter). Modeling actuator saturation alongside anti-windup is essential because linear transfer-function analysis completely misses saturation windup.',
  },
  {
    id: 'pc-9-mode-comparison',
    conditionTag: 'Control Inquiry 09 · Comparing P, PI, and PID Controllers',
    number: '09',
    question:
      'How do P, PI, and PID controllers differ when subjected to both a setpoint step and a sustained load disturbance $d(t)$?',
    experimentPrompt:
      'Load the Load Disturbance Rejection preset ($d = -8\\%$ at $t = 65\\,\\mathrm{s}$) and switch to Tab 4 (P vs. PI vs. PID Comparison).',
    presetActionLabel: 'Apply Load Disturbance Rejection (d = −8% @ 65 s)',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 18.0,
      deadTime_theta_s: 3.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 150.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PID',
      controllerGain_Kc: 2.0,
      integralTime_Ti_s: 15.0,
      derivativeTime_Td_s: 2.0,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 60.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: -8.0,
      disturbanceTime_s: 65.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'On Tab 4 (P vs. PI vs. PID), what differentiates the three curves after the $-8\\%$ load disturbance strikes at $t = 65\\,\\mathrm{s}$?',
    selfCheckOptions: [
      {
        id: 'pc9-a',
        label:
          'P control suffers a permanent offset both before and after the disturbance; PI and PID both reject the disturbance back to 60.0%, with PID achieving tighter damping and lower IAE.',
        isCorrect: true,
        feedback:
          'Correct! Only controllers containing integral action (PI and PID) can automatically shift their steady-state actuator bias by +8% to cancel a sustained −8% load disturbance.',
      },
      {
        id: 'pc9-b',
        label: 'P control rejects sustained load disturbances with zero steady-state error.',
        isCorrect: false,
        feedback:
          'Under P control, a sustained disturbance d = −8% increases the steady-state offset to e_ss = (Δr − Kp·d)/(1 + Kp·Kc) = 5.50%.',
      },
      {
        id: 'pc9-c',
        label: 'PI and PID produce identical trajectories regardless of τD.',
        isCorrect: false,
        feedback:
          'Adding derivative action τD = 2.0 s damps the transient excursion and reduces IAE compared to PI.',
      },
    ],
    keyObservation:
      'In the disturbance rejection test, P control ends with a +5.50% offset (Y = 54.50%), whereas PI and PID both restore Y(t) to 60.00% by raising steady-state U_act to 64.67%.',
    engineeringExplanation:
      'A P controller provides immediate proportional corrective action ($K_c e$) but lacks memory; PI adds integral reset ($\\frac{K_c}{\\tau_I}\\int e\\,dt$) to guarantee zero steady-state offset for step changes in $r$ or $d$; PID adds filtered derivative damping ($-K_c D_f$) to reduce overshoot and settling time.',
  },
  {
    id: 'pc-10-multi-metric-evaluation',
    conditionTag: 'Control Inquiry 10 · Multi-Metric Performance Evaluation',
    number: '10',
    question:
      'Why must control engineers evaluate multiple performance metrics (Rise Time, Overshoot, Settling Time, $e_{\\mathrm{ss}}$, IAE, ITAE, and Control Effort $\\mathrm{TV}_u$) rather than optimizing a single number?',
    experimentPrompt:
      'Compare your saved scenarios in the Comparison Table or toggle between Conservative P, Balanced PI, Filtered PID, and Oscillatory Loop presets.',
    presetActionLabel: 'Compare Filtered PID Benchmark',
    suggestedInputs: {
      processGain_Kp: 1.5,
      timeConstant_tau_s: 20.0,
      deadTime_theta_s: 4.0,
      initialOutput_Y0: 50.0,
      simulationDuration_s: 120.0,
      timeStep_dt_s: 0.2,
      controllerMode: 'PID',
      controllerGain_Kc: 2.2,
      integralTime_Ti_s: 16.0,
      derivativeTime_Td_s: 2.5,
      derivativeFilterAlpha: 0.1,
      actuatorMin_Umin: 0.0,
      actuatorMax_Umax: 100.0,
      antiWindupEnabled: true,
      setpointTarget_Ysp: 65.0,
      setpointStepTime_s: 5.0,
      disturbanceMagnitude_d: 0.0,
      disturbanceTime_s: 60.0,
      openLoopStep_du: 10.0,
    },
    selfCheckPrompt:
      'Why is minimizing Rise Time ($t_r$) alone a dangerous controller tuning objective?',
    selfCheckOptions: [
      {
        id: 'pc10-a',
        label:
          'Minimizing rise time requires high gain Kc, which increases overshoot, control valve wear (TV_u), actuator saturation, and sensitivity to dead time and model mismatch.',
        isCorrect: true,
        feedback:
          'Correct! Practical controller tuning balances speed of response (rise time, IAE) against robustness, damping (overshoot, ITAE, settling time), and actuator effort.',
      },
      {
        id: 'pc10-b',
        label: 'A shorter rise time always guarantees zero overshoot and minimum actuator wear.',
        isCorrect: false,
        feedback:
          'High gain speeds up the initial rise but typically produces larger overshoot, longer oscillatory tails (high ITAE), and aggressive actuator swings.',
      },
      {
        id: 'pc10-c',
        label: 'IAE and ITAE measure only steady-state offset and ignore transient oscillations.',
        isCorrect: false,
        feedback:
          'IAE integrates |e(t)| over the entire trajectory, and ITAE weights |e(t)| by time t, heavily penalizing persistent late-time oscillations.',
      },
    ],
    keyObservation:
      'The oscillatory preset achieves a very fast 10%–90% rise time (5.8 s) but suffers 51% overshoot, fails to settle, and expends more than 3× the actuator travel (TV_u) of the balanced PID design.',
    engineeringExplanation:
      'Every feedback loop faces fundamental trade-offs: $\\mathrm{IAE} = \\int |e(t)|\\,dt$ penalizes total error area, $\\mathrm{ITAE} = \\int t|e(t)|\\,dt$ penalizes lingering oscillations, and Total Variation $\\mathrm{TV}_u = \\sum |\\Delta U_{\\mathrm{act}}|$ quantifies mechanical actuator wear.',
  },
];

export interface RoadmapPhaseItem {
  phase: string;
  title: string;
  status: 'Implemented' | 'Current Phase' | 'Upcoming' | 'Planned';
  summary: string;
  items: string[];
}

export const DEVELOPMENT_ROADMAP: RoadmapPhaseItem[] = [
  {
    phase: 'Phase 1',
    title: 'Core Platform and Heat Exchanger',
    status: 'Implemented',
    summary:
      'Established the Next.js application foundation, laboratories directory, and initial countercurrent ε–NTU simulator.',
    items: [
      'Application foundation, landing page, and laboratories directory',
      'First functional virtual laboratory (Countercurrent Heat Exchanger)',
      'Initial numerical simulation and charting architecture',
    ],
  },
  {
    phase: 'Phase 1.1',
    title: 'Scientific Validation and UI Refinement',
    status: 'Implemented',
    summary:
      'Completed engineering validation audit, numerical edge-case verification, undergraduate 4-step workflow, and UI accessibility refinement.',
    items: [
      'Engineering model audit, assumption transparency, and aqueous (>100 °C) advisories',
      'Expanded automated test suite covering Cr → 1, tiny/large NTU, and benchmarks',
      '4-step student workflow, progressive derivations, and guided inquiry checks',
    ],
  },
  {
    phase: 'Phase 1.2',
    title: 'Shared Framework and Fluid Mechanics',
    status: 'Implemented',
    summary:
      'Extracted reusable laboratory UI primitives and launched the steady-state Fluid Flow & Pipe Hydraulics Virtual Laboratory.',
    items: [
      'Reusable laboratory controls, headers, alerts, CSV export, and educational cards',
      'Independent Fluid Mechanics engine (Reynolds, Colebrook–White, Darcy–Weisbach, pump head)',
      'Fluid Flow Virtual Laboratory with Moody-style diagram and 5 guided inquiries',
    ],
  },
  {
    phase: 'Phase 2.1',
    title: 'Chemical Reaction Engineering',
    status: 'Implemented',
    summary:
      'Launched the Ideal Reactor Design laboratory for Batch, CSTR, and PFR isothermal first-order reaction kinetics.',
    items: [
      'Pure SI kinetics & reactor sizing engine (Batch, CSTR, PFR & target conversion)',
      'Reactor-specific schematics, conversion vs. τ, PFR CA(V), and V_req sizing plots',
      'Scenario comparison table, CSV export, and 6 guided reaction-kinetics inquiries',
    ],
  },
  {
    phase: 'Phase 2.2',
    title: 'Distillation & Separations',
    status: 'Implemented',
    summary:
      'Launched the Binary Distillation Virtual Laboratory using the McCabe–Thiele equilibrium-stage method.',
    items: [
      'Constant-relative-volatility VLE, material balance, q-line, and minimum reflux solver',
      'Interactive McCabe–Thiele x–y diagram with step-through-stages inspector and column schematic',
      'Reflux-vs-stages trade-off curves, scenario comparisons, CSV export, and 7 guided inquiries',
    ],
  },
  {
    phase: 'Phase 2.2.1',
    title: 'Mathematical Typography',
    status: 'Implemented',
    summary:
      'Upgraded all laboratories, directory cards, and derivations to textbook-grade KaTeX mathematical typography with accessible HTML + MathML output.',
    items: [
      'Centralized KaTeX rendering system (MathInline, MathBlock, EngineeringEquation, EquationCard)',
      'Semantic MathML + visual HTML output (htmlAndMathml) for screen-reader accessibility',
      'Responsive display-equation formatting and automated LaTeX compilation test suite',
    ],
  },
  {
    phase: 'Phase 2.3',
    title: 'Chemical Engineering Thermodynamics',
    status: 'Implemented',
    summary:
      'Launched the dual-module Thermodynamics Virtual Laboratory covering Pure-Fluid Peng–Robinson EOS PVT behavior and Ideal Binary Raoult–Dalton Phase Equilibrium.',
    items: [
      'Peng–Robinson cubic EOS solver with NIST pure-fluid constants (CO₂, N₂, CH₄, C₂H₆) and 3-root analysis',
      'Ideal vs. real-gas compressibility Z(P), molar volume v(P), P–v isotherms, and deviation diagnostics',
      'Isothermal binary P–x–y and y–x phase diagrams, tie-line phase splits, and 10 guided inquiries',
    ],
  },
  {
    phase: 'Phase 2.4',
    title: 'Process Dynamics & Control',
    status: 'Implemented',
    summary:
      'Completed the sixth core virtual laboratory covering SISO FOPDT process dynamics, P/PI/PID feedback control, disturbance rejection, saturation, and anti-windup.',
    items: [
      'Exact ZOH FOPDT numerical simulator with fractional dead-time interpolation and analytical benchmark',
      'Open-Loop, P, PI, and filtered derivative-on-measurement PID controllers with clamping anti-windup',
      '5 interactive dynamic chart views, 10 verified presets, and 10 guided process-control inquiries',
    ],
  },
  {
    phase: 'Phase 2.5',
    title: 'Entrolume Rebranding & UI/UX Overhaul',
    status: 'Implemented',
    summary:
      'Rebranded the platform as Entrolume with a unified design system, 3-zone navigation architecture, subject-categorized directory, and standardized Configure → Simulate → Analyze → Reflect workflows across all six laboratories.',
    items: [
      'Entrolume vector brand identity, tagline ("Explore. Simulate. Understand."), and semantic design tokens',
      'Streamlined 3-zone top navigation bar paired with a 1-click 6-laboratory switcher strip',
      'Standardized student orientation guides, collapsible parameter decks, and WCAG AA accessibility across all 6 labs',
    ],
  },
  {
    phase: 'Phase 2.5.1',
    title: 'Post-Deployment QA & Responsive Refinement',
    status: 'Implemented',
    summary:
      'Resolved post-deployment staging audit findings across URL synchronization, sticky desktop parameter panels, KaTeX heading/footer typography, responsive charts/schematics, and mobile comparison layouts.',
    items: [
      'Full URL query synchronization (?view=...) with browser Back/Forward history and sticky scroll-margin offsets',
      'Restored desktop sticky parameter panels (overflow-x-clip) and KaTeX rendering in collapsible parameter group headers',
      'Responsive McCabe–Thiele & FOPDT mobile schematics, non-overlapping chart axes, and stacked mobile comparison cards',
    ],
  },
  {
    phase: 'Phase 2.5.2',
    title: 'Official Logo Integration & Brand Asset Implementation',
    status: 'Current Phase',
    summary:
      'Active milestone: reconstructed the approved Entrolume geometric E-mark and lowercase wordmark into production vector SVG assets, coordinated light/dark/icon/monochrome variants, and square favicon.',
    items: [
      'Production SVG vector suite: entrolume-logo.svg, entrolume-logo-dark.svg, entrolume-icon.svg, entrolume-monochrome.svg, and favicon.svg',
      'Centralized EntrolumeLogo component supporting primary, dark, icon-only, and monochrome variants with accessible semantics',
      'Integrated across desktop/mobile navigation, dark pedagogical section, footer, and OpenGraph/favicon browser metadata',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Gemini AI Engineering Tutor',
    status: 'Upcoming',
    summary:
      'Next milestone: introduce an AI engineering tutor grounded strictly in verified Entrolume simulation calculations.',
    items: [
      'Context-aware engineering explanations tied to live simulation state',
      'Guided reasoning and concept reinforcement without fabricating numbers',
      'Direct integration with verified engineering calculation engines',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Machine Learning Workspace',
    status: 'Planned',
    summary:
      'Introduce hands-on machine learning experiments enabling students to compare empirical regression models with physical conservation laws.',
    items: [
      'Engineering dataset upload, preprocessing, and regression modeling',
      'Model training, evaluation, and error-analysis visualizations',
      'Physics-informed comparisons against first-principles simulations',
    ],
  },
  {
    phase: 'Phase 5',
    title: 'Academic SaaS Features',
    status: 'Planned',
    summary:
      'Full institutional classroom infrastructure for university departments, faculty, and enrolled undergraduate cohorts.',
    items: [
      'Student authentication, profiles, and learning progress tracking',
      'Instructor dashboards, course management, and virtual lab assignments',
      'Experiment submissions, institutional administration, and subscriptions',
    ],
  },
];

