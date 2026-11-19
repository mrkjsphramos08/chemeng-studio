import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_HEAT_EXCHANGER_INPUTS,
  calculateHeatExchanger,
} from './heat-exchanger';
import { HERO_PREVIEW_LABS } from './hero-preview';
import {
  GUIDED_EXPLORATION_QUESTIONS,
  PROCESS_CONTROL_GUIDED_QUESTIONS,
  DEVELOPMENT_ROADMAP,
} from './labs-data';
import { simulateProcessControl } from './process-control';

test('Hotfix B — Pre-edit audit verification: Landing Hero Heat Exchanger baseline uses A = 12.0 m² consistently', () => {
  assert.equal(DEFAULT_HEAT_EXCHANGER_INPUTS.A, 12.0);
  const hxHero = HERO_PREVIEW_LABS.find((l) => l.id === 'heat-exchanger');
  assert.ok(hxHero);
  assert.ok(
    hxHero.presetName.includes('12.0'),
    `Expected hero presetName to specify A = 12.0 m², got "${hxHero.presetName}"`
  );
  const hx = calculateHeatExchanger(DEFAULT_HEAT_EXCHANGER_INPUTS);
  assert.equal(hxHero.metrics[0].value, `${hx.Q_kW.toFixed(2)} kW`);
  assert.ok(hxHero.metrics[1].sub.includes(hx.NTU.toFixed(3)));
});

test('Hotfix B — Task 7.1: Heat Exchanger q2-balanced-capacity matches solver Q = 436.47 kW and Cr = 1.000 invariants', () => {
  const q2 = GUIDED_EXPLORATION_QUESTIONS.find(
    (q) => q.id === 'q2-balanced-capacity'
  );
  assert.ok(q2);
  const res = calculateHeatExchanger(q2.suggestedInputs);
  assert.equal(res.isValid, true);
  assert.equal(res.Cr.toFixed(3), '1.000');
  assert.equal(res.Q_kW.toFixed(2), '436.47');
  assert.ok(
    q2.keyObservation.includes(`${res.Q_kW.toFixed(2)} kW`),
    `Expected q2 keyObservation to contain solver duty "${res.Q_kW.toFixed(2)} kW", got "${q2.keyObservation}"`
  );
  assert.equal(
    q2.keyObservation.includes('436.46'),
    false,
    'q2-balanced-capacity must not contain stale unrounded 436.46 kW'
  );
});

test('Hotfix B — Task 7.2: Process Control pc-1-time-constant reconciles infinite-horizon asymptote with finite 120 s open-loop run', () => {
  const pc1 = PROCESS_CONTROL_GUIDED_QUESTIONS.find(
    (q) => q.id === 'pc-1-time-constant'
  );
  assert.ok(pc1);
  assert.equal(pc1.suggestedInputs.controllerMode, 'open-loop');

  const sim = simulateProcessControl(pc1.suggestedInputs);
  assert.equal(sim.isValid, true);
  const finalY =
    sim.timeSeries[sim.timeSeries.length - 1].processOutput_Y.toFixed(2);
  const residual = Math.abs(
    65.0 - sim.timeSeries[sim.timeSeries.length - 1].processOutput_Y
  ).toFixed(2);

  const combined = `${pc1.keyObservation} ${pc1.selfCheckOptions
    .map((o) => o.feedback)
    .join(' ')}`;

  assert.ok(combined.includes('65.00%'));
  assert.ok(combined.includes(`${finalY}%`));
  assert.ok(combined.includes(`${residual}%`));
  assert.ok(combined.includes('open-loop'));
  assert.equal(combined.toLowerCase().includes('setpoint offset'), false);
});

test('Hotfix B — Task 5 & 6: Repository hygiene, .gitignore rules, README, and Roadmap reflect Phase 2.5.3 honestly', () => {
  const rootDir = process.cwd();
  assert.equal(
    fs.existsSync(path.join(rootDir, 'div')),
    false,
    'Stray 0-byte /div file must be removed'
  );

  const gitignore = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('*.tsbuildinfo'));
  assert.ok(gitignore.includes('.playwright-cli/'));

  const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
  assert.ok(readme.includes('Phases 1 through 2.5.3'));
  assert.ok(readme.includes('npx --yes tsx --test lib/*.test.ts'));
  assert.ok(readme.includes('pending final independent re-verification'));
  assert.equal(readme.includes('(85 tests)'), false);

  const phase253 = DEVELOPMENT_ROADMAP.find((r) => r.phase === 'Phase 2.5.3');
  assert.ok(phase253);
  assert.equal(phase253.status, 'Implemented');
  assert.ok(phase253.summary.toLowerCase().includes('pending'));
});
