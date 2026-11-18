'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Play,
  XCircle,
} from 'lucide-react';

export interface LabAssumptionItem {
  label: string;
  detail: string;
}

export interface LabConceptCardItem {
  title: string;
  body: React.ReactNode;
}

export interface LabEquationBlockItem {
  title: string;
  subtitle: string;
  equations: { text: string; tone?: 'default' | 'teal' | 'muted' }[];
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

export function LabAssumptionsCard({
  eyebrow,
  title,
  assumptions,
}: {
  eyebrow: string;
  title: string;
  assumptions: LabAssumptionItem[];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
        <span>{eyebrow}</span>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
        {assumptions.map((item, idx) => (
          <li key={idx} className="flex items-baseline justify-between gap-2">
            <span className="font-medium text-slate-800">{item.label}</span>
            <span className="text-slate-600 text-right">{item.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LabTheoryDisclosureCard({
  eyebrow,
  title,
  subtitle,
  expandLabel = 'Expand Detailed Equations & Limiting Cases',
  collapseLabel = 'Hide Detailed Equations & Limiting Cases',
  concepts,
  detailedBlocks,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  expandLabel?: string;
  collapseLabel?: string;
  concepts: LabConceptCardItem[];
  detailedBlocks: LabEquationBlockItem[];
}) {
  const [showDetailedTheory, setShowDetailedTheory] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-teal-800 mb-1">{eyebrow}</div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailedTheory((prev) => !prev)}
          aria-expanded={showDetailedTheory}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          {showDetailedTheory ? collapseLabel : expandLabel}
          {showDetailedTheory ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Essential Concepts (Always Visible, Concise Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
        {concepts.map((concept, idx) => (
          <div
            key={idx}
            className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 space-y-1.5"
          >
            <div className="text-xs font-bold text-slate-900">{concept.title}</div>
            <p className="text-xs text-slate-600 leading-relaxed">{concept.body}</p>
          </div>
        ))}
      </div>

      {/* Progressive Disclosure: Detailed Equations */}
      {showDetailedTheory && (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200"
          data-testid="detailed-equations-panel"
        >
          {detailedBlocks.map((block, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">{block.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{block.subtitle}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-800 space-y-1.5">
                {block.equations.map((eq, eIdx) => (
                  <div
                    key={eIdx}
                    className={
                      eq.tone === 'teal'
                        ? 'text-teal-900'
                        : eq.tone === 'muted'
                        ? 'text-slate-600'
                        : 'text-slate-800'
                    }
                  >
                    {eq.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LabGuidedInquiryCard<TInputs>({
  eyebrow = 'Step 4 · Reflect — Guided Engineering Inquiry',
  title = 'Test Hypotheses & Check Your Conclusions',
  subtitle = 'Apply each test condition to the simulator, inspect the updated charts and scenario table, select your conclusion, and then reveal the analytical explanation to verify your reasoning.',
  questions,
  onApplyInputs,
  derivationHeading = 'Engineering Derivation & Insight',
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  questions: SharedGuidedQuestion<TInputs>[];
  onApplyInputs: (inputs: TInputs) => void;
  derivationHeading?: string;
}) {
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const toggleQuestion = (id: string) => {
    setRevealedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="mb-5">
        <div className="text-xs font-medium text-teal-800 mb-1">{eyebrow}</div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{subtitle}</p>
      </div>

      <div className="divide-y divide-slate-200">
        {questions.map((item) => {
          const isOpen = !!revealedQuestions[item.id];
          const selectedId = selectedAnswers[item.id];
          const selectedOpt = item.selfCheckOptions.find((o) => o.id === selectedId);

          return (
            <div key={item.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="text-xs font-medium text-slate-600">{item.conditionTag}</div>
                  <h4 className="text-base font-semibold text-slate-900">
                    {item.number}. {item.question}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>Investigation Steps:</strong> {item.experimentPrompt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full lg:shrink-0">
                  <button
                    type="button"
                    onClick={() => onApplyInputs(item.suggestedInputs)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-teal-800 transition-colors max-w-full text-left sm:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    <Play className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.presetActionLabel}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleQuestion(item.id)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    {isOpen ? 'Hide Full Explanation' : 'Reveal Full Explanation'}
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Self-Check Reasoning Prompt */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
                <div className="text-xs font-semibold text-slate-800">{item.selfCheckPrompt}</div>
                <div className="grid grid-cols-1 gap-2">
                  {item.selfCheckOptions.map((opt) => {
                    const isChosen = selectedId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(item.id, opt.id)}
                        aria-pressed={isChosen}
                        className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-start gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                          isChosen
                            ? opt.isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-amber-50 border-amber-300 text-amber-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0 font-mono text-[11px] text-slate-500">
                          {isChosen ? '●' : '○'}
                        </span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedOpt && (
                  <div
                    className={`mt-2 p-3 rounded-lg border text-xs flex items-start gap-2 leading-relaxed ${
                      selectedOpt.isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                    role="status"
                  >
                    {selectedOpt.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong>{selectedOpt.isCorrect ? 'Verified:' : 'Re-check Simulation:'}</strong>{' '}
                      {selectedOpt.feedback}
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Full Analytical Explanation */}
              {isOpen && (
                <div className="bg-teal-50/50 border border-teal-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">
                      Quantitative Simulation Result
                    </div>
                    <p className="text-slate-700">{item.keyObservation}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-teal-950 mb-1">{derivationHeading}</div>
                    <p className="text-slate-700">{item.engineeringExplanation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
