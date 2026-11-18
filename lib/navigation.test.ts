import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VALID_VIEWS,
  isValidView,
  parseViewFromParam,
  parseViewFromSearch,
  buildViewUrl,
  normalizeSignedZero,
  formatSignedZero,
  truncateScenarioTickLabel,
} from './navigation';
import { renderLatexToHtml, parseMathTextSegments } from './katex-render';

test('Navigation 1 — All 8 canonical platform views are recognized and round-trip cleanly via URL query parameters', () => {
  assert.equal(VALID_VIEWS.length, 8);
  for (const view of VALID_VIEWS) {
    assert.equal(isValidView(view), true);
    const url = buildViewUrl(view);
    if (view === 'landing') {
      assert.equal(url, '/');
      assert.equal(parseViewFromSearch(''), 'landing');
    } else {
      assert.equal(url, `/?view=${view}`);
      assert.equal(parseViewFromSearch(`?view=${view}`), view);
    }
  }
});

test('Navigation 2 — Legacy view aliases and invalid parameters fall back safely without throwing', () => {
  assert.equal(parseViewFromParam('overview'), 'landing');
  assert.equal(parseViewFromParam('lab'), 'heat-exchanger');
  assert.equal(parseViewFromParam('distillation-separations'), 'distillation');
  assert.equal(parseViewFromParam('labs'), 'directory');
  assert.equal(parseViewFromParam('catalog'), 'directory');
  assert.equal(parseViewFromParam(undefined, '1'), 'heat-exchanger');
  assert.equal(parseViewFromParam('unknown-nonexistent-view'), 'landing');
  assert.equal(parseViewFromSearch('?view=unknown'), 'landing');
});

test('Navigation 3 — buildViewUrl preserves section anchor hashes on landing and laboratory views', () => {
  assert.equal(
    buildViewUrl('landing', 'how-it-works-section'),
    '/#how-it-works-section'
  );
  assert.equal(
    buildViewUrl('overview', '#roadmap-section'),
    '/#roadmap-section'
  );
  assert.equal(
    buildViewUrl('directory', 'featured-labs-section'),
    '/?view=directory#featured-labs-section'
  );
});

test('Navigation 4 — normalizeSignedZero and formatSignedZero eliminate negative zero (-0.00%) while preserving true signed values', () => {
  assert.equal(Object.is(normalizeSignedZero(-0, 2), -0), false);
  assert.equal(normalizeSignedZero(-1e-15, 2), 0);
  assert.equal(normalizeSignedZero(-0.004, 2), 0);
  assert.equal(formatSignedZero(-0, 2, { positivePrefix: true }), '0.00');
  assert.equal(formatSignedZero(-1e-15, 2, { positivePrefix: true }), '0.00');
  assert.equal(formatSignedZero(0.001, 2, { positivePrefix: true }), '0.00');
  assert.equal(formatSignedZero(5.0, 2, { positivePrefix: true }), '+5.00');
  assert.equal(formatSignedZero(-2.345, 2, { positivePrefix: true }), '-2.35');
});

test('Navigation 5 — truncateScenarioTickLabel shortens long scenario labels cleanly for chart X-axis ticks', () => {
  assert.equal(truncateScenarioTickLabel('Current Run', 18), 'Current Run');
  const truncated = truncateScenarioTickLabel(
    'Baseline Water Flow (20 °C, 80 mm Pipe)',
    18
  );
  assert.equal(truncated.endsWith('…'), true);
  assert.equal(truncated.length <= 18, true);
});

test('Navigation 6 — Parameter group headings with inline LaTeX tokenize and render KaTeX HTML + MathML without raw dollar signs', () => {
  const headings = [
    'Reaction Kinetics ($A \\rightarrow B$)',
    'VLE Volatility ($\\alpha$) & Operating Reflux ($R$)',
    'Feed Thermal Condition ($q$-Line)',
  ];

  for (const heading of headings) {
    const tokens = parseMathTextSegments(heading);
    const mathTokens = tokens.filter((t) => t.type === 'inline-math');
    assert.ok(
      mathTokens.length >= 1,
      `Expected at least one math token in "${heading}"`
    );
    for (const token of mathTokens) {
      const html = renderLatexToHtml(token.content, false);
      assert.ok(
        html.includes('katex'),
        `Expected KaTeX markup for ${token.content}`
      );
      assert.ok(
        html.includes('<math'),
        `Expected accessible MathML markup for ${token.content}`
      );
      assert.equal(html.includes('$'), false);
    }
  }
});

import fs from 'node:fs';
import path from 'node:path';
import {
  ENTROLUME_ICON_PATHS,
  ENTROLUME_WORDMARK_PATHS,
  ENTROLUME_BRAND_COLORS,
} from '../components/branding/entrolume-logo';

test('Branding 1 — All 5 production SVG brand assets exist in public/ and contain valid scalable SVG viewBox definitions', () => {
  const assetRelativePaths = [
    'public/branding/entrolume-logo.svg',
    'public/branding/entrolume-logo-dark.svg',
    'public/branding/entrolume-icon.svg',
    'public/branding/entrolume-monochrome.svg',
    'public/favicon.svg',
  ];

  for (const relPath of assetRelativePaths) {
    const absPath = path.join(process.cwd(), relPath);
    assert.equal(
      fs.existsSync(absPath),
      true,
      `Expected production brand asset to exist: ${relPath}`
    );
    const content = fs.readFileSync(absPath, 'utf8');
    assert.ok(content.includes('<svg'), `${relPath} must contain <svg`);
    assert.ok(content.includes('viewBox="'), `${relPath} must define viewBox`);
    assert.ok(content.includes('<path'), `${relPath} must contain vector <path> elements`);
  }
});

test('Branding 2 — No SVG brand asset embeds raster images (<image> or base64 data URIs)', () => {
  const assetRelativePaths = [
    'public/branding/entrolume-logo.svg',
    'public/branding/entrolume-logo-dark.svg',
    'public/branding/entrolume-icon.svg',
    'public/branding/entrolume-monochrome.svg',
    'public/favicon.svg',
  ];

  for (const relPath of assetRelativePaths) {
    const content = fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');
    assert.equal(
      content.toLowerCase().includes('<image'),
      false,
      `${relPath} must not embed raster <image> tags`
    );
    assert.equal(
      content.toLowerCase().includes('data:image/'),
      false,
      `${relPath} must not embed base64 raster data URIs`
    );
  }
});

test('Branding 3 — Primary logo and icon-only assets use the approved Midnight Navy (#0F172A) and Teal (#0D9488) palette', () => {
  const primarySvg = fs.readFileSync(
    path.join(process.cwd(), 'public/branding/entrolume-logo.svg'),
    'utf8'
  );
  const iconSvg = fs.readFileSync(
    path.join(process.cwd(), 'public/branding/entrolume-icon.svg'),
    'utf8'
  );
  const faviconSvg = fs.readFileSync(
    path.join(process.cwd(), 'public/favicon.svg'),
    'utf8'
  );

  for (const svg of [primarySvg, iconSvg, faviconSvg]) {
    assert.ok(svg.includes('#0F172A'), 'Expected Midnight Navy (#0F172A)');
    assert.ok(svg.includes('#0D9488'), 'Expected Teal (#0D9488)');
  }
});

test('Branding 4 — Dark-background logo uses White (#FFFFFF) and Teal (#0D9488) while preserving exact symbol and wordmark geometry', () => {
  const darkSvg = fs.readFileSync(
    path.join(process.cwd(), 'public/branding/entrolume-logo-dark.svg'),
    'utf8'
  );
  assert.ok(darkSvg.includes('#FFFFFF'), 'Expected White (#FFFFFF) in dark logo');
  assert.ok(darkSvg.includes('#0D9488'), 'Expected Teal (#0D9488) in dark logo');
  assert.ok(darkSvg.includes(ENTROLUME_ICON_PATHS.upper));
  assert.ok(darkSvg.includes(ENTROLUME_ICON_PATHS.middle));
  assert.ok(darkSvg.includes(ENTROLUME_ICON_PATHS.lower));
});

test('Branding 5 — Monochrome logo uses a single flat color without gradients or shadows', () => {
  const monoSvg = fs.readFileSync(
    path.join(process.cwd(), 'public/branding/entrolume-monochrome.svg'),
    'utf8'
  );
  assert.ok(monoSvg.includes('#0F172A'));
  assert.equal(monoSvg.includes('#0D9488'), false);
  assert.equal(monoSvg.includes('<linearGradient'), false);
  assert.equal(monoSvg.includes('<radialGradient'), false);
  assert.equal(monoSvg.includes('<filter'), false);
});

test('Branding 6 — Centralized ENTROLUME_ICON_PATHS and ENTROLUME_WORDMARK_PATHS match the 3-element E-mark and 9-letter entrolume wordmark', () => {
  assert.equal(Object.keys(ENTROLUME_ICON_PATHS).length, 3);
  assert.equal(Object.keys(ENTROLUME_WORDMARK_PATHS).length, 9);
  assert.equal(ENTROLUME_BRAND_COLORS.midnightNavy, '#0F172A');
  assert.equal(ENTROLUME_BRAND_COLORS.teal, '#0D9488');
  assert.equal(ENTROLUME_BRAND_COLORS.white, '#FFFFFF');
});

import { LABORATORY_MODULES, DEVELOPMENT_ROADMAP } from './labs-data';

test('Batch 2 — LABORATORY_MODULES provide concise student descriptions, 3 topic tags, preserved governing equations, and DEVELOPMENT_ROADMAP separates completed/in-progress from planned phases', () => {
  assert.equal(LABORATORY_MODULES.length, 6);
  for (const mod of LABORATORY_MODULES) {
    assert.ok(mod.shortTitle.length > 0, `Expected shortTitle on ${mod.id}`);
    assert.ok(
      mod.description.length > 20 && mod.description.length <= 130,
      `Expected concise 1-sentence description on ${mod.id}, got length ${mod.description.length}`
    );
    assert.ok(
      mod.keyTopics.length >= 2 && mod.keyTopics.length <= 3,
      `Expected 2-3 concise topic tags on ${mod.id}, got ${mod.keyTopics.length}`
    );
    assert.ok(mod.governingEquation.length > 0);
    assert.ok(mod.governingEquationLatex.length > 0);
  }

  const futurePhases = DEVELOPMENT_ROADMAP.filter(
    (s) => s.status === 'Upcoming' || s.status === 'Planned'
  );
  assert.deepEqual(
    futurePhases.map((s) => s.phase),
    ['Phase 3', 'Phase 4', 'Phase 5']
  );

  const historicalPhases = DEVELOPMENT_ROADMAP.filter(
    (s) => s.status === 'Implemented' || s.status === 'Current Phase'
  );
  assert.ok(historicalPhases.some((s) => s.phase === 'Phase 1' && s.status === 'Implemented'));
  assert.ok(historicalPhases.some((s) => s.phase === 'Phase 2.5.2' && s.status === 'Implemented'));
  assert.ok(historicalPhases.some((s) => s.phase === 'Phase 2.5.3' && s.status === 'Current Phase'));
  assert.equal(
    historicalPhases.some((s) => ['Phase 3', 'Phase 4', 'Phase 5'].includes(s.phase)),
    false
  );
});


