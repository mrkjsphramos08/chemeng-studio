import type { SharedGuidedQuestion } from '@/components/lab-shared';
import type { FluidMechanicsInputs } from '@/lib/fluid-mechanics';
import type { ReactionEngineeringInputs } from '@/lib/reaction-engineering';

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
      'Analyze steady-state ideal countercurrent heat exchangers using the effectiveness–NTU (ε–NTU) method. Investigate capacity rate ratios, temperature approach, temperature cross, and surface area scaling.',
    keyTopics: [
      'Effectiveness–NTU Method',
      'Capacity Ratio (Cr)',
      'Temperature Cross',
      'Energy Conservation',
    ],
    governingEquation: 'Q = ε · Cmin · (Th,in − Tc,in)',
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
      'Simulate steady, incompressible pipe flow hydraulics using Reynolds regime classification, the Colebrook–White friction equation, Darcy–Weisbach major and minor head losses, and required pump head.',
    keyTopics: [
      'Darcy–Weisbach Head Loss',
      'Colebrook–White & Moody Chart',
      'Major vs. Minor Losses',
      'Required Pump Head & Power',
    ],
    governingEquation: 'hf = f_D · (L / D) · (v² / 2g)',
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
      'Simulate isothermal, constant-density, irreversible first-order reaction kinetics (A → B) across Batch, Ideal CSTR, and Ideal PFR reactors. Compare conversion, residence time, spatial profiles, and target sizing.',
    keyTopics: [
      'Batch vs. CSTR vs. PFR',
      'First-Order Kinetics (−rA = kCA)',
      'Residence Time & Damköhler',
      'Target Conversion Sizing',
    ],
    governingEquation: 'Batch/PFR: X = 1 − e^(−kτ) · CSTR: X = kτ / (1 + kτ)',
    iconName: 'flask',
  },
  {
    id: 'distillation-separations',
    title: 'Distillation and Separation Processes',
    category: 'Mass Transfer & Separations',
    status: 'Coming Soon',
    roadmapPhase: 'Phase 2.2 · Planned',
    duration: '60 min lab',
    level: 'Junior / Senior',
    description:
      'Interactive McCabe–Thiele binary distillation column simulator. Explore reflux ratio trade-offs, feed thermal condition (q-line), minimum stages, and Murphree tray efficiency.',
    keyTopics: [
      'McCabe–Thiele Stepping',
      'Reflux Ratio Optimization',
      'Vapor–Liquid Equilibrium',
      'Feed Stage Location',
    ],
    governingEquation: 'y = (R / (R + 1)) · x + xD / (R + 1)',
    iconName: 'layers',
  },
  {
    id: 'thermodynamics',
    title: 'Thermodynamics',
    category: 'Phase Equilibria & Equations of State',
    status: 'Coming Soon',
    roadmapPhase: 'Phase 2.3 · Planned',
    duration: '45 min lab',
    level: 'Sophomore / Junior',
    description:
      'Investigate Peng–Robinson and Soave–Redlich–Kwong cubic equations of state, P–v and T–s phase envelopes, fugacity coefficients, and non-ideal activity models.',
    keyTopics: [
      'Cubic Equations of State',
      'Fugacity & Departure',
      'VLE Phase Envelopes',
      'Excess Gibbs Energy',
    ],
    governingEquation: 'P = RT / (v − b) − a(T) / [v(v + b) + b(v − b)]',
    iconName: 'gauge',
  },
  {
    id: 'process-control',
    title: 'Process Control',
    category: 'Dynamics & Automation',
    status: 'Coming Soon',
    roadmapPhase: 'Phase 2.4 · Planned',
    duration: '55 min lab',
    level: 'Senior / Advanced',
    description:
      'Tune PID feedback controllers on first-order-plus-dead-time (FOPDT) chemical processes. Evaluate setpoint tracking, disturbance rejection, IMC tuning rules, and Bode stability.',
    keyTopics: [
      'FOPDT Process Dynamics',
      'PID Controller Tuning',
      'Setpoint vs. Disturbance',
      'Closed-Loop Stability',
    ],
    governingEquation: 'Gc(s) = Kc · [1 + 1/(τI·s) + τD·s]',
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
    title: 'Platform Foundation and Heat Exchanger Laboratory',
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
    title: 'Shared Laboratory Framework and Fluid Mechanics',
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
    title: 'Chemical Reaction Engineering Virtual Laboratory',
    status: 'Current Phase',
    summary:
      'Active milestone: launched the Ideal Reactor Design laboratory for Batch, CSTR, and PFR isothermal first-order kinetics.',
    items: [
      'Pure SI kinetics & reactor sizing engine (Batch, CSTR, PFR & target conversion)',
      'Reactor-specific schematics, conversion vs. τ, PFR CA(V), and V_req sizing plots',
      'Scenario comparison table, CSV export, and 6 guided reaction-kinetics inquiries',
    ],
  },
  {
    phase: 'Phase 2.2',
    title: 'Distillation and Separation Processes',
    status: 'Planned',
    summary:
      'Planned McCabe–Thiele binary distillation simulator covering VLE stage stepping, reflux optimization, and feed thermal condition.',
    items: [
      'Vapor–liquid equilibrium curves and q-line feed condition modeling',
      'Interactive McCabe–Thiele stage-by-stage graphical stepping',
      'Minimum reflux, total reflux, and Murphree tray efficiency analysis',
    ],
  },
  {
    phase: 'Phase 2.3',
    title: 'Thermodynamics Virtual Laboratory',
    status: 'Planned',
    summary:
      'Planned cubic equations of state (Peng–Robinson / SRK), P–v and T–s phase envelopes, fugacity, and non-ideal VLE simulator.',
    items: [
      'Cubic EOS compressibility roots and departure functions',
      'Vapor–liquid phase envelopes and fugacity coefficient solvers',
      'Ideal vs. excess Gibbs activity model comparisons',
    ],
  },
  {
    phase: 'Phase 2.4',
    title: 'Process Control Virtual Laboratory',
    status: 'Planned',
    summary:
      'Planned dynamic closed-loop FOPDT process simulation and PID controller tuning laboratory.',
    items: [
      'First-order-plus-dead-time (FOPDT) step response dynamics',
      'PID tuning rules, setpoint tracking, and load disturbance rejection',
      'Closed-loop stability margins and oscillatory behavior analysis',
    ],
  },
  {
    phase: 'Phase 2.5',
    title: 'Platform-wide UI/UX Overhaul',
    status: 'Planned',
    summary:
      'Planned comprehensive visual design, navigation ergonomics, and interactive learning refinement across all six core laboratories prior to AI integration.',
    items: [
      'Unified multi-laboratory navigation and streamlined workspace density',
      'Enhanced interactive process diagrams and visual hierarchy polish',
      'Accessibility, mobile responsiveness, and cross-lab consistency audit',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Gemini AI Engineering Tutor',
    status: 'Planned',
    summary:
      'After completing all six core virtual laboratories and Phase 2.5 UI refinement, introduce an AI tutor grounded in verified calculations.',
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
