"use client";

import type { LikertQuestion } from "@/shared/constants/participant-forms";
import { PARTICIPANT_LIKERT_OPTIONS } from "@/shared/constants/participant-forms";

interface LikertScaleGroupProps {
  title?: string;
  questions: LikertQuestion[];
  values: Record<string, number>;
  onChange: (questionId: string, value: number) => void;
}

export function LikertScaleGroup({ title, questions, values, onChange }: LikertScaleGroupProps) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      {title ? (
        <legend className="px-1 text-sm font-semibold text-slate-900">{title}</legend>
      ) : null}

      <div className="space-y-5">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <p className="text-sm font-medium leading-6 text-slate-900">
              {index + 1}. {question.label}
            </p>
            <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">
              {PARTICIPANT_LIKERT_OPTIONS.map((option) => {
                const selected = values[question.id] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(question.id, option.value)}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-center text-xs font-semibold transition sm:min-w-[4.5rem] ${
                      selected
                        ? "border-document-primary bg-document-primary text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="block text-sm">{option.value}</span>
                    <span className="mt-0.5 hidden text-[10px] font-normal opacity-80 sm:block">
                      {option.label.replace(/^\d+\s*-\s*/, "")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
