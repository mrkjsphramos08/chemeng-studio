# ChemEng Studio

ChemEng Studio helps chemical engineering students understand engineering principles through interactive virtual laboratories and scientifically grounded simulations.

Designed for undergraduate chemical engineering students, professors, and university departments, the platform follows a **simulation-first architecture**: verifying conservation laws, numerical stability, and pedagogical workflows before layering AI tutoring and machine learning tools on top.

---

## Implemented Capabilities (Phases 1, 1.1, 1.2, 2.1, 2.2, 2.2.1, 2.3 & 2.4)

- **Platform Landing & Directory (`/` & `/?view=directory`)**: Overview of ChemEng Studio's learning workflow, target academic audiences, and the complete 6-module core chemical engineering directory (all 6 laboratories live).
- **Centralized KaTeX Mathematical Typography & Accessibility (`lib/katex-render.ts` & `components/lab-shared/math/*`)**:
  - Textbook-quality mathematical equation rendering across all laboratories, directory cards, and guided derivations using KaTeX `output: 'htmlAndMathml'` (`trust: false`, `throwOnError: false`), providing both semantic `<math>` MathML for assistive technologies and `.katex-html` (`aria-hidden="true"`) for visual typography.
- **Shared Virtual Laboratory Framework (`components/lab-shared/*` & `lib/lab-download.ts`)**:
  - Reusable workspace header (`LabWorkspaceHeader`) with scenario presets, snapshot button, **Export CSV** download, learning objectives, and 4-step workflow strip.
  - Typed parameter slider/number control deck (`LabParameterPanel<T>`), validation/advisory alert banners (`LabValidationAlerts`), metric/chart cards (`LabMetricCard`, `LabChartCard`), and educational cards (`LabAssumptionsCard`, `LabTheoryDisclosureCard`, `LabGuidedInquiryCard`).
- **Countercurrent Heat Exchanger Virtual Laboratory (`/?view=heat-exchanger` or `/?view=lab`)**:
  - **Independent SI Calculation Engine (`lib/heat-exchanger.ts`)**: Pure TypeScript $\varepsilon\text{–NTU}$ solver decoupled from React UI components.
  - **4-Step Student Workflow**: Presets, live schematic, axial profiles, sensitivity curves, multi-scenario comparisons, CSV export, 3 guided inquiry questions with self-checks, and progressive derivation disclosure.
- **Fluid Flow & Pipe Hydraulics Virtual Laboratory (`/?view=fluid-mechanics`)**:
  - **Independent SI Calculation Engine (`lib/fluid-mechanics.ts`)**: Pure TypeScript solver for pipe cross-sectional area, average velocity, Reynolds number, Darcy/Fanning friction factors, major and minor head losses, frictional $\Delta P$, required pump head $H = \Delta z + h_f + h_m$, hydraulic power, and shaft power.
  - **Visualizations & Workflow**: Dynamic SVG piping & pump schematic, 9-card results dashboard, 4 real charts (Frictional $\Delta P$ vs. $Q$, $Re$ vs. $Q$, log-log Moody-style $f_D(Re, \varepsilon/D)$ diagram, Pump Head vs. $Q$), 6 presets, multi-scenario comparison table, CSV export, and 5 guided inquiry questions with conceptual self-checks.
- **Chemical Reaction Engineering Virtual Laboratory (`/?view=reaction-engineering`)**:
  - **Independent SI Calculation Engine (`lib/reaction-engineering.ts`)**: Pure TypeScript solver for an irreversible first-order isothermal constant-density reaction ($A \to B$, $-r_A = k C_A$) across **Batch Reactor**, **Ideal CSTR**, and **Ideal PFR**, plus target-conversion reactor sizing ($t_{\text{req}}$, $V_{\text{req,PFR}}$, $V_{\text{req,CSTR}}$).
  - **Visualizations & Workflow**: Reactor-specific SVG schematics, reactor-filtered SI parameter controls, 6-card results dashboard, Batch $C_A(t)$ & $X(t)$ curves, CSTR vs. PFR $X(\tau)$, PFR $C_A(V)$, reactor performance BarChart, $V_{\text{req}}$ vs. $X_{\text{target}}$ sizing curves, 7 presets, scenario comparison table, CSV export, and 6 guided inquiry questions.
- **Distillation & Separation Processes Virtual Laboratory (`/?view=distillation`)**:
  - **Independent Calculation Engine (`lib/distillation.ts`)**: Pure TypeScript binary fractional distillation solver using the McCabe–Thiele method under Constant Molar Overflow (CMO) and constant relative volatility ($\alpha > 1$).
  - **Visualizations & Workflow**: Centerpiece interactive McCabe–Thiele $x\text{–}y$ diagram with a **Step Through Stages** controller and stage inspector, dynamic SVG distillation column schematic, 9-card results dashboard, VLE relative-volatility comparison chart, Theoretical Stages vs. Reflux Ratio curve, Product Flows vs. Feed Composition chart, 8 presets, scenario comparison table, CSV export, and 7 guided inquiry questions.
- **Chemical Engineering Thermodynamics Virtual Laboratory (`/?view=thermodynamics`)**:
  - **Independent Calculation Engine (`lib/thermodynamics.ts`)**: Pure TypeScript solver for **Module A: Pure-Fluid PVT & Peng–Robinson Equation of State** (verified NIST critical constants $T_c, P_c, \omega$ for $\mathrm{CO_2}, \mathrm{N_2}, \mathrm{CH_4}, \mathrm{C_2H_6}$, analytical + Newton-refined cubic $Z$ roots, $Z > B$ physical covolume filtering, subcritical 3-root vapor/liquid branch classification) and **Module B: Ideal Binary Vapor–Liquid Equilibrium** (Raoult's & Dalton's laws, partial pressures $p_A, p_B$, bubble-point $P_{\mathrm{bubble}}(x_A)$, dew-point $P_{\mathrm{dew}}(y_A)$, relative volatility $\alpha_{AB}$, and constant-pressure two-phase tie-lines).
  - **Visualizations & Workflow**: Dual-tab workspace (**Real-Gas PVT** and **Binary Phase Equilibrium**), interactive piston-cylinder compression schematic and isothermal VLE cell schematic, 4 PVT charts ($Z$ vs. $P$, $v$ vs. $P$, $P\text{–}v$ isotherms, ideal-gas deviation $\%$), 3 VLE charts ($P\text{–}x\text{–}y$ phase diagram, $y_A$ vs. $x_A$ curve, partial pressures), 10 presets (5 per module), scenario comparison tables, CSV export, and 10 guided inquiry exercises (5 per module).
- **Process Dynamics & Control Virtual Laboratory (`/?view=process-control`)**:
  - **Independent Calculation Engine (`lib/process-control.ts`)**: Pure TypeScript SISO First-Order-Plus-Dead-Time (FOPDT) dynamic simulation engine ($\tau \frac{dy}{dt} + y = K_p[u(t-\theta) + d(t)]$) with exact zero-order-hold exponential integration, fractional dead-time linear interpolation, analytical open-loop step reference, ISA standard parallel P/PI/PID controllers with filtered derivative-on-measurement ($-dY/dt$ to prevent derivative kick), actuator saturation $[U_{\min}, U_{\max}]$, conditional integration anti-windup clamping, and rigorous performance metrics ($t_r$, $Y_{\mathrm{peak}}$, $\%$ overshoot, $\pm 2\%$ settling time $t_s$, $e_{\mathrm{ss}}$, $\mathrm{IAE}$, $\mathrm{ITAE}$, actuator Total Variation $\mathrm{TV}_u$).
  - **Visualizations & Workflow**: Interactive SISO feedback block diagram (`ProcessControlSchematic`), 8 KPI metric cards, 5-tab visualization suite ($Y(t)$ vs. $r(t)$ with analytical open-loop reference, $u_{\mathrm{cmd}}(t)$ vs. $U_{\mathrm{act}}(t)$ with saturation bounds, $e(t)$ & P/I/D term breakdown, P vs. PI vs. PID mode comparison, and $0.5\times/1.0\times/2.0\times$ sensitivity sweep for $K_c, \tau_I, \tau_D, \tau, \theta$), 10 verified presets, scenario comparison table, CSV export, and 10 guided inquiry exercises.

---

## Scientific Models & Explicit Assumptions

### 1. Countercurrent Heat Exchanger ($\varepsilon\text{–NTU}$)

Models an **idealized 1D pure countercurrent heat exchanger** in consistent SI units:
- Steady-state ($\partial/\partial t = 0$), single-phase fluids, constant $C_{p,h}$, $C_{p,c}$, and $U$, adiabatic outer shell ($Q_h = Q_c = Q$), negligible axial conduction, no pressure-drop model, and no phase-change (boiling/condensation) latent heat.
- **Numerical Stability**: Uses an algebraically factored `expm1` formulation as $C_r \to 1$ or $\text{NTU} \to 0$, strictly non-positive exponents in axial profiles, and displays an advisory when aqueous-range streams ($C_p \approx 4.18\ \text{kJ/(kg}\cdot\text{K)}$) exceed $100\ ^\circ\text{C}$.

### 2. Fluid Flow & Pipe Hydraulics

Models **steady, incompressible, isothermal internal flow** through a uniform circular pipe in consistent SI units:
1. Steady-state flow ($\partial/\partial t = 0$) of a single-phase, incompressible, Newtonian fluid.
2. Constant density ($\rho$) and dynamic viscosity ($\mu$) along the pipe.
3. Uniform circular pipe of internal diameter ($D$) and equivalent sand-grain roughness ($\varepsilon$).
4. Fully developed flow along straight length $L$, with entrance-region effects and fitting interactions lumped into total minor-loss coefficient $\Sigma K$.
5. Introductory pumping-head model assumes equal inlet and outlet gauge pressures ($P_1 = P_2$) and nonnegative elevation rise ($\Delta z = z_2 - z_1 \ge 0$).

### 3. Chemical Reaction Engineering (Ideal Reactors)

Models a **single irreversible first-order reaction** $A \to B$ ($-r_A = k C_A$) in consistent SI units ($\text{mol/m}^3$, $\text{s}^{-1}$, $\text{m}^3$, $\text{m}^3/\text{s}$, $\text{s}$):
1. **Isothermal, constant-density, single-phase system**: No energy balance, temperature variation, or volumetric expansion ($\varepsilon_A = 0$).
2. **Batch Reactor**: $C_A(t) = C_{A0} e^{-kt}$, $X(t) = 1 - e^{-kt}$, $t_{\text{req}} = -\ln(1 - X_{\text{target}})/k$. Reported batch time $t$ represents reaction duration only (excluding filling, emptying, cleaning, and turnaround).
3. **Ideal CSTR**: $\tau = V/q$, $C_A = C_{A0}/(1 + k\tau)$, $X = k\tau / (1 + k\tau)$, $V_{\text{req,CSTR}} = q X_{\text{target}} / [k (1 - X_{\text{target}})]$. Assumes instantaneous complete mixing.
4. **Ideal PFR**: $\tau = V/q$, $C_A(V) = C_{A0} e^{-k V / q}$, $X = 1 - e^{-k\tau}$, $V_{\text{req,PFR}} = -(q/k)\ln(1 - X_{\text{target}})$. Assumes flat radial velocity and zero axial dispersion.

### 4. Binary Fractional Distillation (McCabe–Thiele Method)

Models **steady-state continuous binary fractional distillation** of a hypothetical binary mixture (Component A more volatile than Component B):
1. **Constant Relative Volatility ($\alpha > 1$)**: $y^*(x) = \frac{\alpha x}{1 + (\alpha - 1)x}$ and inverse $x^*(y) = \frac{y}{\alpha - (\alpha - 1)y}$ (no azeotropes or strong nonidealities).
2. **Overall & Component Material Balances**: $F = D + B$ and $F z_F = D x_D + B x_B$ with normal ordering $0 < x_B < z_F < x_D < 1$.
3. **Constant Molar Overflow (CMO)**: Equal molar heats of vaporization and negligible heat losses keep $L = R D$, $V = (R+1)D$, $\bar{L} = L + qF$, and $\bar{V} = V - (1-q)F$ constant within each section.
4. **Feed Thermal Condition ($0 \le q \le 1$)**: Supports saturated liquid ($q = 1$, vertical $q$-line $x = z_F$), partially vaporized two-phase feed ($0 < q < 1$, slope $q/(q-1)$), and saturated vapor ($q = 0$, horizontal $q$-line $y = z_F$).
5. **Stage Convention & Feasibility**: Total condenser = $0$ equilibrium stages; Partial reboiler = $1$ equilibrium stage. Distinguishes feasible operation, near-minimum-reflux crowding, and pinched/infeasible specifications ($R \le R_{\min}$).

### 5. Chemical Engineering Thermodynamics (Peng–Robinson EOS & Ideal Binary VLE)

1. **Pure-Fluid PVT & Peng–Robinson EOS (Module A)**:
   - Ideal gas reference: $PV = nRT$, $Pv_{\mathrm{ideal}} = RT$, $Z = \frac{Pv}{RT}$.
   - Peng–Robinson EOS: $P = \frac{RT}{v - b} - \frac{a\alpha}{v(v + b) + b(v - b)}$ with $a = 0.45724\frac{R^2 T_c^2}{P_c}$, $b = 0.07780\frac{R T_c}{P_c}$, $\alpha = [1 + \kappa(1 - \sqrt{T_r})]^2$, and $\kappa = 0.37464 + 1.54226\omega - 0.26992\omega^2$.
   - Dimensionless cubic in $Z$: $Z^3 - (1-B)Z^2 + (A - 3B^2 - 2B)Z - (AB - B^2 - B^3) = 0$ where $A = \frac{a\alpha P}{R^2 T^2}$ and $B = \frac{bP}{RT}$. Rejects nonphysical roots $Z \le B$ ($v \le b$) and distinguishes vapor-like ($Z_{\max}$) and liquid-like ($Z_{\min}$) roots when 3 real roots occur at $T < T_c$ (equal-fugacity phase equilibrium is outside Phase 2.3 scope).
   - Reference fluids use published NIST Chemistry WebBook constants ($\mathrm{CO_2}, \mathrm{N_2}, \mathrm{CH_4}, \mathrm{C_2H_6}$).
2. **Ideal Binary Vapor–Liquid Equilibrium (Module B)**:
   - Models two hypothetical ideal volatile components $A$ and $B$ at constant temperature using Raoult's Law ($p_i = x_i P_i^{\mathrm{sat}}$) and Dalton's Law ($p_i = y_i P$).
   - Bubble-point pressure $P_{\mathrm{bubble}}(x_A) = x_A P_A^{\mathrm{sat}} + (1 - x_A)P_B^{\mathrm{sat}}$, equilibrium vapor $y_A = \frac{x_A P_A^{\mathrm{sat}}}{P_{\mathrm{bubble}}}$, and dew-point pressure $\frac{1}{P_{\mathrm{dew}}(y_A)} = \frac{y_A}{P_A^{\mathrm{sat}}} + \frac{1 - y_A}{P_B^{\mathrm{sat}}}$.

### 6. Process Dynamics & Control (SISO FOPDT & PID Feedback Control)

Models a **single-input, single-output (SISO) linear time-invariant First-Order-Plus-Dead-Time (FOPDT) process** in deviation variables around nominal operating state $(Y_0, U_0)$:
1. **Governing FOPDT Differential Equation & Transfer Function**:
   $$\tau \frac{dy(t)}{dt} + y(t) = K_p \left[u(t - \theta) + d(t)\right], \qquad G_p(s) = \frac{K_p e^{-\theta s}}{\tau s + 1}$$
   where $y(t) = Y(t) - Y_0$, $u(t) = U_{\mathrm{act}}(t) - U_0$, $\tau > 0$ is the first-order time constant, $\theta \ge 0$ is the pure transport dead time, and $d(t)$ is an input-equivalent load disturbance.
2. **Controller Modes (`open-loop`, `P`, `PI`, `PID`)**:
   - Feedback error $e(t) = r(t) - Y(t)$.
   - ISA parallel PID law with proportional and integral action on $e(t)$ and first-order filtered derivative action on measured process variable $-dY_f/dt$ ($\tau_f = \max(\Delta t, 0.1\tau_D)$) to avoid derivative kick on instantaneous setpoint steps.
3. **Actuator Saturation & Conditional Anti-Windup**:
   - Distinguishes unconstrained controller output $u_{\mathrm{cmd}}(t)$ from saturated actuator output $U_{\mathrm{act}}(t) = \mathrm{clamp}(u_{\mathrm{cmd}}(t), U_{\min}, U_{\max})$.
   - When anti-windup is enabled (`enableAntiWindup = true`), conditional integration freezes integral accumulation whenever $u_{\mathrm{cmd}}(t)$ is saturated and $\mathrm{sign}(K_c e(t))$ drives the actuator further into saturation.
4. **Performance & Settling Criteria**:
   - $\pm 2\%$ settling time $t_s$ is reported only when $Y(t)$ enters and remains within $|Y(t) - Y_{\mathrm{target}}| \le \max(0.05, 0.02|\Delta Y|)$ through the end of the simulation horizon; unsettled or oscillatory responses explicitly report `Unsettled`.

---

## Project Structure

- `app/`: Next.js App Router entry (`page.tsx`, `layout.tsx`, `globals.css`).
- `lib/`:
  - `heat-exchanger.ts` & `heat-exchanger.test.ts`: $\varepsilon\text{–NTU}$ solver and automated unit tests.
  - `fluid-mechanics.ts` & `fluid-mechanics.test.ts`: Pipe hydraulics / Colebrook–White solver and automated unit tests.
  - `reaction-engineering.ts` & `reaction-engineering.test.ts`: Ideal Batch/CSTR/PFR kinetics & sizing solver and automated unit tests.
  - `distillation.ts` & `distillation.test.ts`: Binary distillation McCabe–Thiele solver and automated unit tests.
  - `thermodynamics.ts` & `thermodynamics.test.ts`: Peng–Robinson EOS & Raoult–Dalton Binary VLE solver and automated unit tests.
  - `process-control.ts` & `process-control.test.ts`: SISO FOPDT & P/PI/PID dynamic feedback control solver and automated unit tests.
  - `katex-render.ts` & `katex-render.test.ts`: Centralized KaTeX HTML + MathML rendering utilities and equation validation tests.
  - `lab-download.ts`: Client-side CSV export utility (`downloadSimulationCsv`).
  - `labs-data.ts`: Curriculum metadata for all 6 laboratory modules, guided exploration questions, and roadmap milestones.
- `components/`:
  - `lab-shared/`: Reusable laboratory UI framework (`LabWorkspaceHeader`, `LabValidationAlerts`, `LabParameterPanel`, `LabMetricCard`, `LabChartCard`, `LabAssumptionsCard`, `LabTheoryDisclosureCard`, `LabGuidedInquiryCard`, `math/`).
  - `chemeng-studio-shell.tsx`, `navbar.tsx`, `landing-sections.tsx`, `labs-directory.tsx`.
  - `heat-exchanger-lab.tsx`, `heat-exchanger-schematic.tsx`, `heat-exchanger-charts.tsx`, `learning-panel.tsx`.
  - `fluid-mechanics-lab.tsx`, `fluid-mechanics-schematic.tsx`, `fluid-mechanics-charts.tsx`.
  - `reaction-engineering-lab.tsx`, `reaction-engineering-schematic.tsx`, `reaction-engineering-charts.tsx`.
  - `distillation-lab.tsx`, `distillation-schematic.tsx`, `distillation-charts.tsx`.
  - `thermodynamics-lab.tsx`, `thermodynamics-schematic.tsx`, `thermodynamics-charts.tsx`.
  - `process-control-lab.tsx`, `process-control-schematic.tsx`, `process-control-charts.tsx`.

---

## Verification Commands

```bash
# Run automated engineering calculation & KaTeX MathML tests across all 6 laboratories (73 tests)
npx --yes tsx --test lib/heat-exchanger.test.ts lib/fluid-mechanics.test.ts lib/reaction-engineering.test.ts lib/distillation.test.ts lib/katex-render.test.ts lib/thermodynamics.test.ts lib/process-control.test.ts

# Lint TypeScript & Next.js rules
npm run lint

# Build production Next.js bundle
npm run build
```

---

## Development Roadmap (Simulation-First Sequence)

1. **Phase 1 — Platform Foundation and Heat Exchanger Laboratory** *(Implemented)*
2. **Phase 1.1 — Scientific Validation and UI Refinement** *(Implemented)*
3. **Phase 1.2 — Shared Laboratory Framework and Fluid Mechanics** *(Implemented)*
4. **Phase 2.1 — Chemical Reaction Engineering Virtual Laboratory** *(Implemented)*
5. **Phase 2.2 — Distillation and Separation Processes** *(Implemented)*
6. **Phase 2.2.1 — Platform-wide Mathematical Typography & Equation Rendering Upgrade** *(Implemented)*
7. **Phase 2.3 — Chemical Engineering Thermodynamics Virtual Laboratory** *(Implemented)*
8. **Phase 2.4 — Process Dynamics & Control Virtual Laboratory** *(Current Phase)*
   - Dynamic SISO FOPDT process simulation ($\tau, K_p, \theta$), open-loop and closed-loop P/PI/PID controller modes, filtered derivative-on-measurement, actuator saturation $[U_{\min}, U_{\max}]$, conditional anti-windup clamping, and transient performance analysis.
9. **Phase 2.5 — Platform-wide UI/UX Overhaul** *(Planned — Next Phase)*
   - Comprehensive visual, navigation, interactive diagram, and instructional refinement across all six core laboratories prior to AI features.
10. **Phase 3 — Gemini AI Engineering Tutor** *(Planned)*
    - Context-aware AI tutoring grounded directly in verified simulation states and calculation engines.
11. **Phase 4 — Machine Learning Workspace** *(Planned)*
    - Engineering dataset upload, regression modeling, evaluation, and comparison with first-principles conservation models.
12. **Phase 5 — Academic SaaS Features** *(Planned)*
    - Student accounts, instructor dashboards, course assignments, experiment submissions, and institutional subscriptions.
