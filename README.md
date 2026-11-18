# ChemEng Studio

ChemEng Studio helps chemical engineering students understand engineering principles through interactive virtual laboratories and scientifically grounded simulations.

Designed for undergraduate chemical engineering students, professors, and university departments, the platform follows a **simulation-first architecture**: verifying conservation laws, numerical stability, and pedagogical workflows before layering AI tutoring and machine learning tools on top.

---

## Implemented Capabilities (Phases 1, 1.1, 1.2 & 2.1)

- **Platform Landing & Directory (`/` & `/?view=directory`)**: Overview of ChemEng Studio's learning workflow, target academic audiences, and the 6-module core chemical engineering directory (3 live laboratories, 3 planned).
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
  - **Visualizations & Workflow**: Reactor-specific SVG schematics (closed Batch vessel, backmixed CSTR without axial gradient, tubular PFR with axial gradient), reactor-filtered SI parameter controls, 6-card results dashboard, Batch $C_A(t)$ & $X(t)$ curves, CSTR vs. PFR $X(\tau)$, PFR $C_A(V)$, reactor performance BarChart, $V_{\text{req}}$ vs. $X_{\text{target}}$ sizing curves, 7 presets, scenario comparison table, CSV export, and 6 guided inquiry questions.

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
6. **Friction Factor & Transitional Regime Transparency**:
   - **Zero Flow ($Q = 0$)**: Velocity, $Re$, friction losses, and pump power equal $0$; required static head equals $\Delta z$.
   - **Laminar ($Re < 2{,}100$)**: Exact Hagen–Poiseuille law $f_D = 64/Re$ (roughness-independent).
   - **Transitional ($2{,}100 \le Re \le 4{,}000$)**: Explicitly warns that transitional friction is physically uncertain and leaves the Moody diagram band shaded rather than fabricating an empirical bridge curve; Colebrook–White is reported strictly as a conservative turbulent reference.
   - **Turbulent ($Re > 4{,}000$)**: Solves implicit Colebrook–White using Haaland's correlation as initial seed followed by Newton–Raphson on $1/\sqrt{f_D}$ to $< 10^{-13}$.
   - **Darcy vs. Fanning**: Reports Darcy $f_D$ as primary and Fanning $f_F = f_D / 4$ in subtext and CSV exports.
7. **Scope Boundary**: Does not predict real centrifugal pump $H\text{–}Q$ performance curves or NPSH / cavitation margins.

### 3. Chemical Reaction Engineering (Ideal Reactors)

Models a **single irreversible first-order reaction** $A \to B$ ($-r_A = k C_A$) in consistent SI units ($\text{mol/m}^3$, $\text{s}^{-1}$, $\text{m}^3$, $\text{m}^3/\text{s}$, $\text{s}$):
1. **Isothermal, constant-density, single-phase system**: No energy balance, temperature variation, or volumetric expansion ($\varepsilon_A = 0$).
2. **Batch Reactor**: $C_A(t) = C_{A0} e^{-kt}$, $X(t) = 1 - e^{-kt}$, $t_{\text{req}} = -\ln(1 - X_{\text{target}})/k$. Reported batch time $t$ represents reaction duration only (excluding filling, emptying, cleaning, and turnaround).
3. **Ideal CSTR**: $\tau = V/q$, $C_A = C_{A0}/(1 + k\tau)$, $X = k\tau / (1 + k\tau)$, $V_{\text{req,CSTR}} = q X_{\text{target}} / [k (1 - X_{\text{target}})]$. Assumes instantaneous complete mixing (uniform vessel concentration equals outlet $C_A$; no axial concentration profile).
4. **Ideal PFR**: $\tau = V/q$, $C_A(V) = C_{A0} e^{-k V / q}$, $X = 1 - e^{-k\tau}$, $V_{\text{req,PFR}} = -(q/k)\ln(1 - X_{\text{target}})$. Assumes flat radial velocity and zero axial dispersion.
5. **Asymptotic & Numerical Boundaries**: Exact $X_{\text{target}} = 100\%$ and $k = 0\ \text{s}^{-1}$ (for $X_{\text{target}} > 0$) are explicitly flagged as unachievable/unbounded limits instead of emitting `Infinity` or `NaN`. Uses `expm1`/`log1p` for tiny Damköhler accuracy.

---

## Project Structure

- `app/`: Next.js App Router entry (`page.tsx`, `layout.tsx`, `globals.css`).
- `lib/`:
  - `heat-exchanger.ts` & `heat-exchanger.test.ts`: $\varepsilon\text{–NTU}$ solver and automated unit tests.
  - `fluid-mechanics.ts` & `fluid-mechanics.test.ts`: Pipe hydraulics / Colebrook–White solver and automated unit tests.
  - `reaction-engineering.ts` & `reaction-engineering.test.ts`: Ideal Batch/CSTR/PFR kinetics & sizing solver and automated unit tests.
  - `lab-download.ts`: Client-side CSV export utility (`downloadSimulationCsv`).
  - `labs-data.ts`: Curriculum metadata for all 6 laboratory modules, guided exploration questions, and roadmap milestones.
- `components/`:
  - `lab-shared/`: Reusable laboratory UI framework (`LabWorkspaceHeader`, `LabValidationAlerts`, `LabParameterPanel`, `LabMetricCard`, `LabChartCard`, `LabAssumptionsCard`, `LabTheoryDisclosureCard`, `LabGuidedInquiryCard`).
  - `chemeng-studio-shell.tsx`, `navbar.tsx`, `landing-sections.tsx`, `labs-directory.tsx`.
  - `heat-exchanger-lab.tsx`, `heat-exchanger-schematic.tsx`, `heat-exchanger-charts.tsx`, `learning-panel.tsx`.
  - `fluid-mechanics-lab.tsx`, `fluid-mechanics-schematic.tsx`, `fluid-mechanics-charts.tsx`.
  - `reaction-engineering-lab.tsx`, `reaction-engineering-schematic.tsx`, `reaction-engineering-charts.tsx`.

---

## Registering a New Virtual Laboratory (Phase 2 Guide)

To add one of the remaining Phase 2 modules (Reaction Engineering, Distillation, Thermodynamics, Process Control):

1. **Create a Pure SI Calculation Engine (`lib/<lab-slug>.ts` & `lib/<lab-slug>.test.ts`)**:
   - Export typed `Inputs`, `Results`, `Preset[]`, `validate...`, `calculate...`, and sweep/profile generators with zero React/DOM dependencies.
   - Verify all conservation laws, edge cases, and textbook benchmarks via `node:test`.
2. **Add Curriculum Metadata & Guided Questions (`lib/labs-data.ts`)**:
   - Flip the module's `status` from `'Coming Soon'` to `'Available'` and update its `roadmapPhase`.
   - Export a `SharedGuidedQuestion<Inputs>[]` array for Step 4 inquiry.
3. **Build Lab Visualizations & Workspace (`components/<lab-slug>-schematic.tsx`, `<lab-slug>-charts.tsx`, `<lab-slug>-lab.tsx`)**:
   - Compose `LabWorkspaceHeader`, `LabValidationAlerts`, `LabParameterPanel`, `LabMetricCard`, `LabChartCard`, `LabAssumptionsCard`, `LabTheoryDisclosureCard`, and `LabGuidedInquiryCard` from `@/components/lab-shared`.
   - Wire `downloadSimulationCsv` from `@/lib/lab-download` for one-click CSV export.
4. **Register Routing (`components/navbar.tsx`, `components/labs-directory.tsx`, `components/chemeng-studio-shell.tsx`, `app/page.tsx`)**:
   - Add the new slug to `ActiveView` and `AvailableLabId`, render `<YourNewLab />` in `ChemEngStudioShell`, and map `?view=<lab-slug>` in `app/page.tsx`.

---

## Verification Commands

```bash
# Run automated engineering calculation tests (Heat Exchanger + Fluid Mechanics + Reaction Engineering)
npx --yes tsx --test lib/heat-exchanger.test.ts lib/fluid-mechanics.test.ts lib/reaction-engineering.test.ts

# Lint TypeScript & Next.js rules
npm run lint

# Build production Next.js bundle
npm run build
```

---

## Development Roadmap (Simulation-First Sequence)

1. **Phase 1 — Platform Foundation and Heat Exchanger Laboratory** *(Implemented)*
   - Application foundation, landing page, laboratories directory, and initial countercurrent $\varepsilon\text{–NTU}$ simulator.
2. **Phase 1.1 — Scientific Validation and UI Refinement** *(Implemented)*
   - Engineering validation audit, assumption transparency, aqueous $> 100\ ^\circ\text{C}$ advisories, expanded unit tests, 4-step guided student workflow, and UI accessibility refinement.
3. **Phase 1.2 — Shared Laboratory Framework and Fluid Mechanics** *(Implemented)*
   - Reusable laboratory UI primitives (`components/lab-shared/*`), CSV export, independent Fluid Mechanics engine (`lib/fluid-mechanics.ts`), and Fluid Flow & Pipe Hydraulics Virtual Laboratory.
4. **Phase 2.1 — Chemical Reaction Engineering Virtual Laboratory** *(Current Phase)*
   - Ideal Batch, CSTR, and PFR isothermal first-order kinetics engine (`lib/reaction-engineering.ts`), dynamic reactor schematics, 6-chart/sizing analytics, CSV export, and 6 guided inquiry exercises.
5. **Phase 2.2 — Distillation and Separation Processes** *(Planned)*
   - McCabe–Thiele binary distillation simulator, vapor–liquid equilibrium curves, q-line feed conditions, and Murphree tray efficiency.
6. **Phase 2.3 — Thermodynamics Virtual Laboratory** *(Planned)*
   - Cubic equations of state (Peng–Robinson / SRK), phase envelopes, fugacity coefficients, and excess Gibbs models.
7. **Phase 2.4 — Process Control Virtual Laboratory** *(Planned)*
   - Dynamic FOPDT process simulation, PID controller tuning, setpoint tracking, and disturbance rejection.
8. **Phase 2.5 — Platform-wide UI/UX Overhaul** *(Planned)*
   - Comprehensive visual, navigation, interactive diagram, and instructional refinement across all six core laboratories prior to AI features.
9. **Phase 3 — Gemini AI Engineering Tutor** *(Planned)*
   - Context-aware AI tutoring grounded directly in verified simulation states and calculation engines.
10. **Phase 4 — Machine Learning Workspace** *(Planned)*
    - Engineering dataset upload, regression modeling, evaluation, and comparison with first-principles conservation models.
11. **Phase 5 — Academic SaaS Features** *(Planned)*
    - Student accounts, instructor dashboards, course assignments, experiment submissions, and institutional subscriptions.
