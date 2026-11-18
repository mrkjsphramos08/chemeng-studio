import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderLatexToHtml,
  validateLatexExpression,
  parseMathTextSegments,
} from './katex-render';

test('KaTeX Renderer — Heat Exchanger governing equations compile cleanly', () => {
  const equations = [
    'Q = \\varepsilon C_{\\min} (T_{h,\\mathrm{in}} - T_{c,\\mathrm{in}})',
    '\\mathrm{NTU} = \\frac{UA}{C_{\\min}}',
    '\\varepsilon = \\frac{Q}{Q_{\\max}}',
    'C_h = \\dot{m}_h C_{p,h}, \\quad C_c = \\dot{m}_c C_{p,c}',
    'C_r = \\frac{C_{\\min}}{C_{\\max}}',
    '\\varepsilon = \\frac{1 - \\exp\\!\\left[-\\mathrm{NTU}(1 - C_r)\\right]}{1 - C_r \\exp\\!\\left[-\\mathrm{NTU}(1 - C_r)\\right]}',
    '\\varepsilon = \\frac{\\mathrm{NTU}}{1 + \\mathrm{NTU}}',
    '\\mathrm{LMTD} = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1 / \\Delta T_2)}',
  ];

  for (const eq of equations) {
    const res = validateLatexExpression(eq, true);
    assert.equal(res.valid, true, `Failed on equation: ${eq} (${res.error})`);
    assert.ok(res.html.includes('katex'), 'Rendered HTML should include katex class');
  }
});

test('KaTeX Renderer — Fluid Mechanics governing equations compile cleanly', () => {
  const equations = [
    '\\mathrm{Re} = \\frac{\\rho v D}{\\mu}',
    'f_D = \\frac{64}{\\mathrm{Re}}, \\quad f_F = \\frac{f_D}{4} = \\frac{16}{\\mathrm{Re}}',
    '\\frac{1}{\\sqrt{f_D}} = -2 \\log_{10}\\!\\left( \\frac{\\varepsilon / D}{3.7} + \\frac{2.51}{\\mathrm{Re}\\sqrt{f_D}} \\right)',
    'h_f = f_D \\frac{L}{D} \\frac{v^2}{2g}',
    'h_m = \\sum K \\frac{v^2}{2g}',
    '\\Delta P_{\\mathrm{f}} = \\rho g (h_f + h_m)',
    'H = \\Delta z + h_f + h_m',
    'P_h = \\rho g Q H, \\quad P_s = \\frac{P_h}{\\eta}',
  ];

  for (const eq of equations) {
    const res = validateLatexExpression(eq, true);
    assert.equal(res.valid, true, `Failed on equation: ${eq} (${res.error})`);
    assert.ok(res.html.includes('katex'));
  }
});

test('KaTeX Renderer — Chemical Reaction Engineering equations compile cleanly', () => {
  const equations = [
    'C_A(t) = C_{A,0} e^{-kt}',
    'X(t) = 1 - e^{-kt}',
    't_{\\mathrm{req}} = -\\frac{\\ln(1 - X_{\\mathrm{target}})}{k}',
    'X = \\frac{k\\tau}{1 + k\\tau}',
    'C_A = \\frac{C_{A,0}}{1 + k\\tau}',
    'V_{\\mathrm{CSTR}} = \\frac{q X}{k(1 - X)}',
    'C_A(V) = C_{A,0} e^{-kV/q}',
    'X = 1 - e^{-k\\tau}',
    'V_{\\mathrm{PFR}} = -\\frac{q}{k}\\ln(1 - X_{\\mathrm{target}})',
    '-r_A = k C_A',
    '\\mathrm{Da} = k\\tau',
  ];

  for (const eq of equations) {
    const res = validateLatexExpression(eq, true);
    assert.equal(res.valid, true, `Failed on equation: ${eq} (${res.error})`);
    assert.ok(res.html.includes('katex'));
  }
});

test('KaTeX Renderer — Distillation & McCabe-Thiele equations compile cleanly', () => {
  const equations = [
    'y^* = \\frac{\\alpha x}{1 + (\\alpha - 1)x}',
    'x^* = \\frac{y}{\\alpha - (\\alpha - 1)y}',
    'F = D + B, \\quad F z_F = D x_D + B x_B',
    'L = R D, \\quad V = (R + 1)D',
    '\\bar{L} = L + qF, \\quad \\bar{V} = V - (1 - q)F',
    'y_{\\mathrm{ROL}} = \\frac{R}{R + 1}x + \\frac{x_D}{R + 1}',
    'y_q = \\frac{q}{q - 1}x - \\frac{z_F}{q - 1}',
    'y_{\\mathrm{SOL}} = \\frac{\\bar{L}}{\\bar{V}}x - \\frac{B}{\\bar{V}}x_B',
    'R_{\\min} = \\frac{x_D - y_{\\mathrm{pinch}}}{y_{\\mathrm{pinch}} - x_{\\mathrm{pinch}}}',
    'N_{\\min} = \\frac{\\ln\\!\\left[\\left(\\frac{x_D}{1 - x_D}\\right)\\left(\\frac{1 - x_B}{x_B}\\right)\\right]}{\\ln \\alpha}',
  ];

  for (const eq of equations) {
    const res = validateLatexExpression(eq, true);
    assert.equal(res.valid, true, `Failed on equation: ${eq} (${res.error})`);
    assert.ok(res.html.includes('katex'));
  }
});

test('KaTeX Renderer — Thermodynamics Peng-Robinson & Binary VLE equations compile cleanly with MathML', () => {
  const equations = [
    'PV = nRT, \\quad Pv = RT, \\quad Z = \\frac{Pv}{RT}',
    'P = \\frac{RT}{v - b} - \\frac{a\\alpha}{v(v + b) + b(v - b)}',
    'a = 0.45724\\frac{R^2 T_c^2}{P_c}, \\quad b = 0.07780\\frac{R T_c}{P_c}',
    '\\alpha = \\left[1 + \\kappa\\left(1 - \\sqrt{T_r}\\right)\\right]^2, \\quad T_r = \\frac{T}{T_c}',
    '\\kappa = 0.37464 + 1.54226\\omega - 0.26992\\omega^2',
    'Z^3 - (1 - B)Z^2 + (A - 3B^2 - 2B)Z - (AB - B^2 - B^3) = 0',
    'A = \\frac{a\\alpha P}{R^2 T^2}, \\quad B = \\frac{bP}{RT}',
    'p_A = x_A P_A^{\\mathrm{sat}}, \\quad p_B = (1 - x_A) P_B^{\\mathrm{sat}}',
    'P_{\\mathrm{bubble}} = x_A P_A^{\\mathrm{sat}} + (1 - x_A) P_B^{\\mathrm{sat}}',
    'y_A = \\frac{x_A P_A^{\\mathrm{sat}}}{P_{\\mathrm{bubble}}}',
    '\\frac{1}{P_{\\mathrm{dew}}} = \\frac{y_A}{P_A^{\\mathrm{sat}}} + \\frac{1 - y_A}{P_B^{\\mathrm{sat}}}',
  ];

  for (const eq of equations) {
    const res = validateLatexExpression(eq, true);
    assert.equal(res.valid, true, `Failed on equation: ${eq} (${res.error})`);
    assert.ok(res.html.includes('katex'), 'Should include katex root');
    assert.ok(
      res.html.includes('<math') && res.html.includes('katex-mathml'),
      'Should include semantic MathML (<math> inside .katex-mathml) for assistive technologies'
    );
    assert.ok(
      res.html.includes('class="katex-html" aria-hidden="true"'),
      'Visual .katex-html tree should be marked aria-hidden="true" to prevent duplicate announcements'
    );
  }
});

test('KaTeX Renderer — Safe fallback does not throw on malformed LaTeX', () => {
  const malformed = '\\frac{1}{unclosed';
  const strictRes = validateLatexExpression(malformed, false);
  assert.equal(strictRes.valid, false);
  const safeHtml = renderLatexToHtml(malformed, false);
  assert.ok(safeHtml.length > 0, 'Safe renderer returns fallback HTML without throwing');
});

test('parseMathTextSegments — Splits prose and inline/block LaTeX segments accurately', () => {
  const sample =
    'For a first-order reaction with Damköhler number $\\mathrm{Da} = k\\tau$, CSTR conversion is $$X = \\frac{k\\tau}{1 + k\\tau}$$ at steady state.';
  const segments = parseMathTextSegments(sample);
  assert.equal(segments.length, 5);
  assert.deepEqual(segments[0], {
    type: 'text',
    content: 'For a first-order reaction with Damköhler number ',
  });
  assert.deepEqual(segments[1], {
    type: 'inline-math',
    content: '\\mathrm{Da} = k\\tau',
  });
  assert.deepEqual(segments[2], {
    type: 'text',
    content: ', CSTR conversion is ',
  });
  assert.deepEqual(segments[3], {
    type: 'block-math',
    content: 'X = \\frac{k\\tau}{1 + k\\tau}',
  });
  assert.deepEqual(segments[4], {
    type: 'text',
    content: ' at steady state.',
  });
});

test('KaTeX Renderer — Process Dynamics & Control FOPDT & PID equations compile cleanly with MathML', () => {
  const equations = [
    '\\tau \\frac{dy(t)}{dt} + y(t) = K_p u(t - \\theta) + K_p d(t)',
    'y(t) = K_p \\Delta u \\left(1 - e^{-(t - \\theta)/\\tau}\\right) H(t - \\theta)',
    'G_p(s) = \\frac{Y(s)}{U(s)} = \\frac{K_p e^{-\\theta s}}{\\tau s + 1}',
    'e(t) = r(t) - Y(t)',
    'u_{\\mathrm{cmd}}(t) = U_0 + K_c \\left[ e(t) + \\frac{1}{\\tau_I}\\int_0^t e(\\tau^{\\prime})\\,d\\tau^{\\prime} - D_f(t) \\right]',
    '(\\alpha_D \\tau_D)\\frac{dD_f(t)}{dt} + D_f(t) = \\tau_D \\frac{dY(t)}{dt}',
    'U_{\\mathrm{act}}(t) = \\min\\!\\left(U_{\\max},\\; \\max\\!\\left(U_{\\min},\\; u_{\\mathrm{cmd}}(t)\\right)\\right)',
    'e_{\\mathrm{ss},\\mathrm{P}} = \\frac{\\Delta r}{1 + K_p K_c}',
    '\\mathrm{IAE} = \\int_0^{t_{\\mathrm{sim}}} |e(t)|\\,dt, \\quad \\mathrm{ITAE} = \\int_0^{t_{\\mathrm{sim}}} t\\,|e(t)|\\,dt',
  ];

  for (const eq of equations) {
    const res = validateLatexExpression(eq, true);
    assert.equal(res.valid, true, `Failed on equation: ${eq} (${res.error})`);
    assert.ok(res.html.includes('<math') && res.html.includes('katex-mathml'));
  }
});

