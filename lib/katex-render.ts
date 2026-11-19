import katex from 'katex';

export interface MathTextSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

function normalizeLatexInput(raw: string): string {
  // In JSX string attributes (e.g., description="... $\\omega$ ..."), JSX passes two literal
  // backslashes before a control word, which LaTeX would otherwise treat as a line break (\\)
  // followed by plain letters. Normalize \\<letters> to \<letters>.
  return raw.trim().replace(/\\\\(?=[a-zA-Z]+)/g, '\\');
}

/**
 * Safely renders a LaTeX expression to an HTML + MathML string using KaTeX.
 * Uses `throwOnError: false`, `trust: false`, and `output: 'htmlAndMathml'` so that
 * each rendered formula includes both semantic `<math>` (inside `.katex-mathml`) for
 * assistive technologies and visual `.katex-html` (`aria-hidden="true"`).
 */
export function renderLatexToHtml(
  latex: string,
  displayMode: boolean = false
): string {
  const trimmed = normalizeLatexInput(latex);
  if (!trimmed) {
    return '';
  }

  try {
    return katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      output: 'htmlAndMathml',
      trust: false,
    });
  } catch {
    return escapeHtmlFallback(trimmed);
  }
}

/**
 * Strictly validates whether a LaTeX expression compiles without KaTeX syntax errors.
 * Intended for automated scientific and mathematical typography tests.
 */
export function validateLatexExpression(
  latex: string,
  displayMode: boolean = false
): { valid: boolean; html: string; error?: string } {
  const trimmed = normalizeLatexInput(latex);
  if (!trimmed) {
    return { valid: false, html: '', error: 'Empty LaTeX expression' };
  }

  try {
    const html = katex.renderToString(trimmed, {
      displayMode,
      throwOnError: true,
      strict: 'ignore',
      output: 'htmlAndMathml',
      trust: false,
    });
    return { valid: true, html };
  } catch (err) {
    return {
      valid: false,
      html: renderLatexToHtml(trimmed, displayMode),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Parses a text string containing `$$...$$` (display math) or `$...$` (inline math)
 * into structured segments for seamless React + KaTeX rendering.
 */
export function parseMathTextSegments(input: string): MathTextSegment[] {
  if (!input) return [];
  if (!input.includes('$')) {
    return [{ type: 'text', content: input }];
  }

  const segments: MathTextSegment[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: input.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      segments.push({
        type: 'block-math',
        content: match[1].trim(),
      });
    } else if (match[2] !== undefined) {
      segments.push({
        type: 'inline-math',
        content: match[2].trim(),
      });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({
      type: 'text',
      content: input.slice(lastIndex),
    });
  }

  return segments;
}

export type MathTextDisplayToken =
  | { type: 'text'; content: string }
  | { type: 'nowrap-text'; content: string }
  | { type: 'inline-math'; content: string }
  | {
      type: 'nowrap-inline-math';
      prefix: string;
      content: string;
      suffix: string;
    }
  | { type: 'block-math'; content: string };

const SCIENTIFIC_NOTATION_TOKEN_PATTERN =
  /([+-]?\d+(?:\.\d+)?[eE][+-]?\d+|\b10[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g;

const MAX_NOWRAP_INLINE_LATEX_LENGTH = 28;

function splitTextForScientificNotation(text: string): MathTextDisplayToken[] {
  if (!text) return [];
  SCIENTIFIC_NOTATION_TOKEN_PATTERN.lastIndex = 0;
  if (!SCIENTIFIC_NOTATION_TOKEN_PATTERN.test(text)) {
    return [{ type: 'text', content: text }];
  }

  SCIENTIFIC_NOTATION_TOKEN_PATTERN.lastIndex = 0;
  const out: MathTextDisplayToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = SCIENTIFIC_NOTATION_TOKEN_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    out.push({ type: 'nowrap-text', content: match[0] });
    lastIndex = SCIENTIFIC_NOTATION_TOKEN_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    out.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return out;
}

/**
 * Enhances `parseMathTextSegments` for visual typography rendering:
 * 1. Groups short parenthesized or bracketed inline math (`($C_r$)`, `[$2,100$]`)
 *    into atomic non-breaking units so opening/closing delimiters never orphan.
 * 2. Protects compact scientific notation (`1.0e-17`, `4.50e-04`, `10⁻¹²`)
 *    from breaking across lines between mantissa/sign and exponent.
 */
export function parseMathTextDisplayTokens(input: string): MathTextDisplayToken[] {
  if (!input) return [];
  const rawSegments = parseMathTextSegments(input);
  const tokens: MathTextDisplayToken[] = [];

  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];

    if (
      seg.type === 'inline-math' &&
      seg.content.length <= MAX_NOWRAP_INLINE_LATEX_LENGTH
    ) {
      const prevToken = tokens[tokens.length - 1];
      const nextSeg = rawSegments[i + 1];

      const openMatch =
        prevToken?.type === 'text' &&
        (prevToken.content.endsWith('(') || prevToken.content.endsWith('['));
      const openChar = openMatch ? prevToken.content.slice(-1) : '';
      const expectedClose = openChar === '(' ? ')' : openChar === '[' ? ']' : '';
      const closeMatch =
        Boolean(expectedClose) &&
        nextSeg?.type === 'text' &&
        nextSeg.content.startsWith(expectedClose);

      if (openMatch && closeMatch && prevToken.type === 'text' && nextSeg.type === 'text') {
        const trimmedPrev = prevToken.content.slice(0, -1);
        if (trimmedPrev.length > 0) {
          prevToken.content = trimmedPrev;
        } else {
          tokens.pop();
        }

        // Capture any immediate trailing punctuation (e.g., `,`, `.`, `:`) only for the closing paren itself
        tokens.push({
          type: 'nowrap-inline-math',
          prefix: openChar,
          content: seg.content,
          suffix: expectedClose,
        });

        const remainingNext = nextSeg.content.slice(1);
        if (remainingNext.length > 0) {
          rawSegments[i + 1] = { type: 'text', content: remainingNext };
        } else {
          i += 1; // Skip completely consumed next text segment
        }
        continue;
      }
    }

    if (seg.type === 'text') {
      tokens.push(...splitTextForScientificNotation(seg.content));
    } else if (seg.type === 'inline-math') {
      tokens.push({ type: 'inline-math', content: seg.content });
    } else {
      tokens.push({ type: 'block-math', content: seg.content });
    }
  }

  return tokens;
}

function escapeHtmlFallback(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
