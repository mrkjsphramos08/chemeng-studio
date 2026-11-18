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

function escapeHtmlFallback(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
