import React from 'react';
import { renderLatexToHtml, parseMathTextSegments } from '@/lib/katex-render';

export interface MathInlineProps {
  latex: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Renders an inline mathematical expression (variables, subscripts, units, short formulas)
 * using KaTeX with deterministic HTML + MathML output (`output: 'htmlAndMathml'`).
 * KaTeX automatically embeds `<span class="katex-mathml"><math>...</math></span>` for
 * assistive technology and marks `.katex-html` as `aria-hidden="true"`, avoiding
 * duplicate spoken output or raw-LaTeX announcements.
 */
export function MathInline({ latex, className = '', ariaLabel }: MathInlineProps) {
  const html = renderLatexToHtml(latex, false);
  return (
    <span
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      className={`normal-case inline-block align-baseline leading-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export interface MathBlockProps {
  latex: string;
  equationNumber?: string;
  align?: 'center' | 'left';
  className?: string;
  ariaLabel?: string;
}

/**
 * Renders a standalone display mathematical equation using KaTeX displayMode (`output: 'htmlAndMathml'`),
 * with horizontal scroll protection on narrow mobile viewports and optional equation numbering.
 */
export function MathBlock({
  latex,
  equationNumber,
  align = 'center',
  className = '',
  ariaLabel,
}: MathBlockProps) {
  const html = renderLatexToHtml(latex, true);
  return (
    <div
      {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      className={`normal-case relative flex w-full items-center gap-3 overflow-x-auto py-1.5 ${
        align === 'center' ? 'justify-center' : 'justify-start'
      } ${className}`}
    >
      <div
        className="min-w-0 max-w-full overflow-x-auto py-0.5 text-[0.95rem] text-slate-900 [&_.katex-display]:my-0.5 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {equationNumber && (
        <span className="shrink-0 font-mono text-xs font-medium text-slate-400 select-none">
          ({equationNumber})
        </span>
      )}
    </div>
  );
}

export interface EquationDefinitionItem {
  symbolLatex: string;
  description: string;
  unitLatex?: string;
  unit?: string;
}

export interface EquationDefinitionProps extends EquationDefinitionItem {
  className?: string;
}

/**
 * Renders a textbook-style variable definition row:
 * Symbol — Description [Unit]
 */
export function EquationDefinition({
  symbolLatex,
  description,
  unitLatex,
  unit,
  className = '',
}: EquationDefinitionProps) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 rounded-md border border-slate-200/70 bg-white/90 px-2.5 py-1.5 text-xs ${className}`}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="shrink-0 font-medium text-slate-900">
          <MathInline latex={symbolLatex} />
        </span>
        <span className="text-slate-400 select-none">—</span>
        <span className=" leading-snug text-slate-600">
          <MathText text={description} />
        </span>
      </div>
      {(unitLatex || unit) && (
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
          {unitLatex ? <MathInline latex={unitLatex} /> : unit}
        </span>
      )}
    </div>
  );
}

export interface EngineeringEquationProps {
  latex: string;
  label?: string;
  equationNumber?: string;
  badge?: string;
  note?: string;
  definitions?: EquationDefinitionItem[];
  align?: 'center' | 'left';
  variant?: 'default' | 'compact' | 'highlighted';
  className?: string;
}

/**
 * Structured engineering equation block with optional title, condition badge,
 * equation number, explanatory note, and variable definitions.
 */
export function EngineeringEquation({
  latex,
  label,
  equationNumber,
  badge,
  note,
  definitions,
  align = 'left',
  variant = 'default',
  className = '',
}: EngineeringEquationProps) {
  const containerStyles =
    variant === 'highlighted'
      ? 'rounded-lg border border-teal-200/90 bg-teal-50/40 px-3.5 py-2.5 shadow-2xs'
      : variant === 'compact'
        ? 'rounded-md border border-slate-200/80 bg-white px-2.5 py-1.5'
        : 'rounded-lg border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-2xs';

  return (
    <div
      className={`${containerStyles} ${className}`}
      data-testid="engineering-equation-block"
    >
      {(label || badge || equationNumber) && (
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          {label ? (
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              <MathText text={label} />
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                <MathText text={badge} />
              </span>
            )}
            {equationNumber && (
              <span className="font-mono text-[11px] font-medium text-slate-400">
                ({equationNumber})
              </span>
            )}
          </div>
        </div>
      )}

      <MathBlock latex={latex} align={align} className="py-1" />

      {note && (
        <p className="mt-1.5 border-t border-slate-100 pt-1.5 text-xs leading-relaxed text-slate-600">
          <MathText text={note} />
        </p>
      )}

      {definitions && definitions.length > 0 && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <div className="mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Where
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {definitions.map((def, idx) => (
              <EquationDefinition key={idx} {...def} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface EquationCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  equations: {
    latex: string;
    label?: string;
    equationNumber?: string;
    badge?: string;
    note?: string;
  }[];
  definitions?: EquationDefinitionItem[];
  footerNote?: string;
  className?: string;
}

/**
 * Textbook-grade engineering card grouping one or more governing equations
 * together with a standardized "Where:" nomenclature legend.
 */
export function EquationCard({
  title,
  subtitle,
  badge,
  equations,
  definitions,
  footerNote,
  className = '',
}: EquationCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 shadow-2xs ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
            <MathText text={title} />
          </h4>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-600">
              <MathText text={subtitle} />
            </p>
          )}
        </div>
        {badge && (
          <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-800">
            <MathText text={badge} />
          </span>
        )}
      </div>

      <div className="space-y-2">
        {equations.map((eq, idx) => (
          <EngineeringEquation
            key={idx}
            latex={eq.latex}
            label={eq.label}
            equationNumber={eq.equationNumber}
            badge={eq.badge}
            note={eq.note}
            align="left"
          />
        ))}
      </div>

      {definitions && definitions.length > 0 && (
        <div className="mt-3 border-t border-slate-200/80 pt-2.5">
          <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Nomenclature &amp; Units
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {definitions.map((def, idx) => (
              <EquationDefinition key={idx} {...def} />
            ))}
          </div>
        </div>
      )}

      {footerNote && (
        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
          <MathText text={footerNote} />
        </p>
      )}
    </div>
  );
}

export interface MathTextProps {
  text: React.ReactNode;
  className?: string;
}

/**
 * Renders mixed prose and LaTeX strings (`$...$` for inline math, `$$...$$` for display math).
 * If passed a non-string ReactNode, returns it directly.
 */
export function MathText({ text, className = '' }: MathTextProps) {
  if (typeof text !== 'string') {
    return <>{text}</>;
  }

  if (!text.includes('$')) {
    return className ? <span className={className}>{text}</span> : <>{text}</>;
  }

  const segments = parseMathTextSegments(text);
  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'inline-math') {
          return <MathInline key={idx} latex={seg.content} className="mx-0.5" />;
        }
        if (seg.type === 'block-math') {
          return <MathBlock key={idx} latex={seg.content} className="my-1.5" />;
        }
        return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
      })}
    </span>
  );
}
