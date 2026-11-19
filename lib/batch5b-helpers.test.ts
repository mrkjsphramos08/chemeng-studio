import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseEditableNumericDraft,
  resolveNumericDraftOnBlur,
  getNextTabIndex,
} from './numeric-input';
import { parseMathTextDisplayTokens } from './katex-render';

test('parseEditableNumericDraft does not coerce empty or partial inputs to zero', () => {
  assert.deepEqual(parseEditableNumericDraft(''), { isComplete: false });
  assert.deepEqual(parseEditableNumericDraft('   '), { isComplete: false });
  assert.deepEqual(parseEditableNumericDraft('-'), { isComplete: false });
  assert.deepEqual(parseEditableNumericDraft('+'), { isComplete: false });
  assert.deepEqual(parseEditableNumericDraft('.'), { isComplete: false });
  assert.deepEqual(parseEditableNumericDraft('0.'), { isComplete: false });
  assert.deepEqual(parseEditableNumericDraft('1e'), { isComplete: false });
  assert.deepEqual(parseEditableNumericDraft('1e-'), { isComplete: false });
});

test('parseEditableNumericDraft commits valid finite numbers promptly', () => {
  assert.deepEqual(parseEditableNumericDraft('0'), { isComplete: true, value: 0 });
  assert.deepEqual(parseEditableNumericDraft('0.85'), { isComplete: true, value: 0.85 });
  assert.deepEqual(parseEditableNumericDraft('120'), { isComplete: true, value: 120 });
  assert.deepEqual(parseEditableNumericDraft('-15.5'), { isComplete: true, value: -15.5 });
  assert.deepEqual(parseEditableNumericDraft('1.0e-3'), { isComplete: true, value: 0.001 });
});

test('resolveNumericDraftOnBlur restores last valid value on empty or invalid final draft', () => {
  assert.equal(resolveNumericDraftOnBlur('', 0.8), 0.8);
  assert.equal(resolveNumericDraftOnBlur('   ', 0.8), 0.8);
  assert.equal(resolveNumericDraftOnBlur('-', 0.8), 0.8);
  assert.equal(resolveNumericDraftOnBlur('1e-', 0.8), 0.8);
  assert.equal(resolveNumericDraftOnBlur('0.', 0.8), 0);
  assert.equal(resolveNumericDraftOnBlur('0.92', 0.8), 0.92);
});

test('getNextTabIndex supports ArrowRight, ArrowLeft, Home, End with wrap-around', () => {
  assert.equal(getNextTabIndex(0, 5, 'ArrowRight'), 1);
  assert.equal(getNextTabIndex(4, 5, 'ArrowRight'), 0);
  assert.equal(getNextTabIndex(0, 5, 'ArrowLeft'), 4);
  assert.equal(getNextTabIndex(2, 5, 'ArrowLeft'), 1);
  assert.equal(getNextTabIndex(3, 5, 'Home'), 0);
  assert.equal(getNextTabIndex(1, 5, 'End'), 4);
  assert.equal(getNextTabIndex(1, 5, 'Enter'), null);
  assert.equal(getNextTabIndex(0, 0, 'ArrowRight'), null);
});

test('parseMathTextDisplayTokens groups short parenthesized inline KaTeX to prevent orphaned parentheses', () => {
  const tokens = parseMathTextDisplayTokens('Capacity Ratio ($C_r$) and Effectiveness ($\\varepsilon$)');
  assert.deepEqual(tokens, [
    { type: 'text', content: 'Capacity Ratio ' },
    { type: 'nowrap-inline-math', prefix: '(', content: 'C_r', suffix: ')' },
    { type: 'text', content: ' and Effectiveness ' },
    { type: 'nowrap-inline-math', prefix: '(', content: '\\varepsilon', suffix: ')' },
  ]);
});

test('parseMathTextDisplayTokens does not force nowrap on long parenthesized LaTeX expressions', () => {
  const longLatex = 'h_f = f_D \\frac{L}{D} \\frac{v^2}{2g} + h_m';
  const tokens = parseMathTextDisplayTokens(`Loss (${'$' + longLatex + '$'})`);
  assert.equal(
    tokens.some((t) => t.type === 'nowrap-inline-math'),
    false,
    'Long inline math should remain wrappable'
  );
  assert.equal(
    tokens.some((t) => t.type === 'inline-math' && t.content === longLatex),
    true
  );
});

test('parseMathTextDisplayTokens prevents line breaks inside scientific notation exponents', () => {
  const tokens = parseMathTextDisplayTokens(
    'Residual |f(Z)| = 1.0e-17 and tolerance < 10⁻¹² at ε/D = 4.50e-04'
  );
  const nowrapValues = tokens
    .filter((t) => t.type === 'nowrap-text')
    .map((t) => t.content);
  assert.deepEqual(nowrapValues, ['1.0e-17', '10⁻¹²', '4.50e-04']);
});
