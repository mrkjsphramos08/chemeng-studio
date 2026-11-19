'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import {
  EngineeringEquation,
  EquationDefinition,
  EquationDefinitionItem,
  MathText,
} from '@/components/lab-shared/math';

export interface LabAssumptionItem {
  label: string;
  detail: string;
}

interface LabAssumptionsCardProps {
  eyebrow: string;
  title: string;
  assumptions: LabAssumptionItem[];
}

export function LabAssumptionsCard({
  eyebrow,
  title,
  assumptions,
}: LabAssumptionsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const previewCount = Math.min(2, assumptions.length);
  const visibleItems = expanded ? assumptions : assumptions.slice(0, previewCount);
  const hiddenCount = Math.max(0, assumptions.length - previewCount);

  return (
    <div
      className="h-full bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-3"
      data-testid="model-assumptions-card"
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            <div className="text-xs font-medium text-teal-800 mb-0.5">
              <MathText text={eyebrow} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              <MathText text={title} />
            </h3>
          </div>
          <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 shrink-0">
            {assumptions.length} items
          </span>
        </div>

        <ul className="space-y-1.5 text-xs text-slate-700">
          {visibleItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 last:border-b-0"
            >
              <span className="font-semibold text-slate-900 shrink-0">
                <MathText text={item.label} />
              </span>
              <span className="text-right text-slate-600">
                <MathText text={item.detail} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {hiddenCount > 0 && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-600">
            {expanded
              ? `Showing all ${assumptions.length} documented assumptions`
              : `${hiddenCount} more model assumptions available`}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            data-testid="model-assumptions-toggle"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {expanded ? (
              <>
                Show Fewer <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Show All ({assumptions.length}) <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export interface LabModelScopeDisclosureProps {
  badge: string;
  summary: string;
  children: React.ReactNode;
  id?: string;
}

/**
 * Compact progressive disclosure for supplementary idealized model scope notes
 * above scientific schematics. Keeps active warnings separate and always visible.
 */
export function LabModelScopeDisclosure({
  badge,
  summary,
  children,
  id,
}: LabModelScopeDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = id ?? `model-scope-${badge.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div
      className="mb-3 rounded-lg bg-slate-50 border border-slate-200/90 text-xs text-slate-700"
      data-testid="model-scope-disclosure"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="w-full px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-slate-100/70 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center rounded bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-semibold text-slate-800 shrink-0">
            {badge}
          </span>
          <span className="text-xs text-slate-600 leading-snug">
            <MathText text={summary} />
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 shrink-0">
          <span>{expanded ? 'Hide Scope' : 'Model Scope'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </span>
      </button>
      {expanded && (
        <div
          id={contentId}
          className="px-3 pb-2.5 pt-2 border-t border-slate-200/80 text-xs text-slate-700 leading-relaxed"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface LabConceptItem {
  title: string;
  body: React.ReactNode;
}

export interface LabEquationLine {
  text?: string;
  latex?: string;
  label?: string;
  equationNumber?: string;
  badge?: string;
  note?: string;
  definitions?: EquationDefinitionItem[];
  tone?: 'default' | 'teal' | 'muted';
}

export interface LabDetailedEquationBlock {
  title: string;
  subtitle: string;
  equations: LabEquationLine[];
  definitions?: EquationDefinitionItem[];
}

interface LabTheoryDisclosureCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  expandLabel: string;
  collapseLabel: string;
  concepts: LabConceptItem[];
  detailedBlocks: LabDetailedEquationBlock[];
  defaultExpanded?: boolean;
}

export function LabTheoryDisclosureCard({
  eyebrow,
  title,
  subtitle,
  expandLabel,
  collapseLabel,
  concepts,
  detailedBlocks,
  defaultExpanded = false,
}: LabTheoryDisclosureCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      data-testid="theory-disclosure-card"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-teal-800 mb-1">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>
              <MathText text={eyebrow} />
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            <MathText text={title} />
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
            <MathText text={subtitle} />
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors shrink-0 self-start md:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {expanded ? (
            <>
              {collapseLabel} <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              {expandLabel} <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* 4 Core Concept Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {concepts.map((concept, idx) => (
          <div
            key={idx}
            className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1.5"
          >
            <div className="text-xs font-bold text-slate-900">
              <MathText text={concept.title} />
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              {typeof concept.body === 'string' ? (
                <MathText text={concept.body} />
              ) : (
                concept.body
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Detailed Equations & Nomenclature */}
      {expanded && (
        <div
          className="pt-4 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-5"
          data-testid="detailed-equations-section"
        >
          {detailedBlocks.map((block, bIdx) => (
            <div
              key={bIdx}
              className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    <MathText text={block.title} />
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    <MathText text={block.subtitle} />
                  </p>
                </div>

                <div className="space-y-2">
                  {block.equations.map((eq, eIdx) => {
                    if (eq.latex) {
                      return (
                        <EngineeringEquation
                          key={eIdx}
                          latex={eq.latex}
                          label={eq.label}
                          equationNumber={eq.equationNumber}
                          badge={eq.badge}
                          note={eq.note}
                          definitions={eq.definitions}
                          variant={eq.tone === 'teal' ? 'highlighted' : 'default'}
                        />
                      );
                    }

                    const toneClass =
                      eq.tone === 'teal'
                        ? 'bg-teal-50/80 border-teal-200 text-teal-950 font-semibold'
                        : eq.tone === 'muted'
                        ? 'bg-white/70 border-slate-200 text-slate-600'
                        : 'bg-white border-slate-200 text-slate-900';

                    return (
                      <div
                        key={eIdx}
                        className={`px-3 py-2 rounded-lg border text-xs font-mono ${toneClass}`}
                      >
                        <MathText text={eq.text ?? ''} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {block.definitions && block.definitions.length > 0 && (
                <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Where
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {block.definitions.map((def, dIdx) => (
                      <EquationDefinition key={dIdx} {...def} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface SharedGuidedQuestion<TInputs> {
  id: string;
  conditionTag: string;
  number: string;
  question: string;
  experimentPrompt: string;
  presetActionLabel: string;
  suggestedInputs: TInputs;
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

interface LabGuidedInquiryCardProps<TInputs> {
  questions: SharedGuidedQuestion<TInputs>[];
  onApplyInputs: (inputs: TInputs) => void;
  derivationHeading?: string;
}

export function LabGuidedInquiryCard<TInputs>({
  questions,
  onApplyInputs,
  derivationHeading = 'Engineering Derivation & Physical Principle',
}: LabGuidedInquiryCardProps<TInputs>) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [revealedExplanations, setRevealedExplanations] = useState<Record<string, boolean>>({});

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleReveal = (questionId: string) => {
    setRevealedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      data-testid="guided-exploration-section"
    >
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-teal-300">
              Step 4 · Reflect — Guided Engineering Inquiry
            </div>
            <h3 className="text-base font-semibold">
              Test Physical Hypotheses &amp; Verify Derivations
            </h3>
          </div>
        </div>
        <span className="text-xs text-slate-300">
          Run each experiment condition, check your prediction, and inspect the derivation
        </span>
      </div>

      <div className="p-6 divide-y divide-slate-200 space-y-6">
        {questions.map((q, idx) => {
          const selectedOptId = selectedOptions[q.id];
          const selectedOpt = q.selfCheckOptions.find((o) => o.id === selectedOptId);
          const isRevealed = Boolean(revealedExplanations[q.id]);

          return (
            <div
              key={q.id}
              className={idx > 0 ? 'pt-6' : ''}
              data-testid={`guided-question-${q.number}`}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-teal-50 text-teal-900 border border-teal-200 rounded-md">
                    <MathText text={q.conditionTag} />
                  </span>

                  <button
                    type="button"
                    onClick={() => onApplyInputs(q.suggestedInputs)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    <MathText text={q.presetActionLabel} />
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-base font-semibold text-slate-900 leading-snug">
                  <MathText text={q.question} />
                </h4>

                <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 leading-relaxed">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Experiment Protocol: </strong>
                    <MathText text={q.experimentPrompt} />
                  </div>
                </div>

                {/* Self-check interactive options */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-slate-800">
                    <MathText text={q.selfCheckPrompt} />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {q.selfCheckOptions.map((opt) => {
                      const isChosen = selectedOptId === opt.id;
                      const styleClass = isChosen
                        ? opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium'
                          : 'bg-amber-50 border-amber-500 text-amber-950 font-medium'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50';

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-start justify-between gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${styleClass}`}
                        >
                          <span className="leading-relaxed">
                            <MathText text={opt.label} />
                          </span>
                          {isChosen && (
                            <span className="shrink-0 font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white/90 border border-current">
                              {opt.isCorrect ? 'Verified' : 'Re-evaluate'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOpt && (
                    <div
                      className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                        selectedOpt.isCorrect
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {selectedOpt.isCorrect
                            ? 'Physical Reasoning Confirmed'
                            : 'Check Physical Mechanism'}
                        </span>
                      </div>
                      <MathText text={selectedOpt.feedback} />
                    </div>
                  )}
                </div>

                {/* Expandable Derivation */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleReveal(q.id)}
                    aria-expanded={isRevealed}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950"
                  >
                    {isRevealed ? (
                      <>
                        Hide {derivationHeading} <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        Reveal {derivationHeading} <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  {isRevealed && (
                    <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-slate-900">Key Quantitative Observation: </strong>
                        <MathText text={q.keyObservation} />
                      </div>
                      <div>
                        <strong className="text-slate-900">{derivationHeading}: </strong>
                        <MathText text={q.engineeringExplanation} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
