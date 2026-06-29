"use client";

import { useState } from "react";
import Image from "next/image";
import type { FeedbackQuestion } from "@/lib/feedback/questions";

type AnswerValue = string | string[];

type Section = {
  number: string;
  title: string;
  questions: FeedbackQuestion[];
};

type Props = {
  token: string;
  firstName: string;
  immersionName: string;
  sections: Section[];
};

export default function FeedbackForm({ token, firstName, immersionName, sections }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalSteps = sections.length;
  const progress = Math.round(((step + 1) / totalSteps) * 100);
  const currentSection = sections[step];

  function setAnswer(key: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(key: string, option: string) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  }

  function isVisible(q: FeedbackQuestion): boolean {
    if (!q.showIf) return true;
    return answers[q.showIf.key] === q.showIf.equals;
  }

  function isAnswered(value: AnswerValue | undefined): boolean {
    if (value == null) return false;
    return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
  }

  async function handleSubmit() {
    const allVisibleQuestions = sections.flatMap((s) => s.questions.filter(isVisible));
    const cleaned: Record<string, AnswerValue> = {};
    for (const q of allVisibleQuestions) {
      const value = answers[q.key];
      if (isAnswered(value)) cleaned[q.key] = value as AnswerValue;
    }
    if (Object.keys(cleaned).length === 0) {
      setError("Réponds à au moins une question avant d'envoyer.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: cleaned }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <FeedbackLayout immersionName={immersionName}>
        <div className="text-center py-16 space-y-4">
          <p className="text-5xl">🙏</p>
          <h2 className="text-xl font-extrabold text-zinc-900">Merci, {firstName} !</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Ton avis nous aide à améliorer les prochains événements.
          </p>
        </div>
      </FeedbackLayout>
    );
  }

  const visibleQuestions = currentSection.questions.filter(isVisible);

  return (
    <FeedbackLayout
      immersionName={immersionName}
      stepLabel={`Étape ${step + 1}/${totalSteps}`}
      progress={progress}
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-1">
            {currentSection.number} · {currentSection.title}
          </p>
          {step === 0 && (
            <p className="text-sm text-zinc-500">
              Partage ton expérience sur <strong>{immersionName}</strong>. Ça prend 3 minutes !
            </p>
          )}
        </div>

        {visibleQuestions.map((q) => (
          <QuestionField
            key={q.key}
            question={q}
            value={answers[q.key]}
            onChange={(v) => setAnswer(q.key, v)}
            onToggleMulti={(opt) => toggleMulti(q.key, opt)}
          />
        ))}

        {error && <p className="text-rose-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="px-5 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              ← Retour
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={submitting}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
            >
              Continuer →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
            >
              {submitting ? "Envoi en cours…" : "Envoyer mon avis →"}
            </button>
          )}
        </div>
      </div>
    </FeedbackLayout>
  );
}

// ─── Layout shell ─────────────────────────────────────────────────────────────

function FeedbackLayout({
  immersionName,
  stepLabel,
  progress,
  children,
}: {
  immersionName: string;
  stepLabel?: string;
  progress?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative w-9 h-9 shrink-0">
            <Image src="/logo-pilotes.png" alt="Les Pilotes" fill className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">{immersionName}</p>
            <p className="text-[11px] text-zinc-500">Questionnaire de satisfaction</p>
          </div>
        </div>
        {progress !== undefined && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
              <span>{stepLabel}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>
      <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

// ─── Question renderer ────────────────────────────────────────────────────────

function QuestionField({
  question,
  value,
  onChange,
  onToggleMulti,
}: {
  question: FeedbackQuestion;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  onToggleMulti: (option: string) => void;
}) {
  const labelEl = (
    <legend className="font-semibold mb-2 block">
      {question.label}
      {question.description && (
        <span className="block font-normal text-sm text-zinc-500 mt-0.5">
          {question.description}
        </span>
      )}
    </legend>
  );

  const stringValue = typeof value === "string" ? value : "";
  const arrayValue = Array.isArray(value) ? value : [];

  switch (question.type) {
    case "text":
      return (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">{question.label}</span>
          {question.description && (
            <span className="text-sm text-zinc-500 -mt-0.5">{question.description}</span>
          )}
          <input
            type="text"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition bg-white"
          />
        </label>
      );

    case "long":
      return (
        <label className="flex flex-col gap-1">
          <span className="font-semibold">{question.label}</span>
          {question.description && (
            <span className="text-sm text-zinc-500 -mt-0.5">{question.description}</span>
          )}
          <textarea
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition bg-white resize-y"
          />
        </label>
      );

    case "scale":
      return (
        <fieldset className="border-0 p-0 m-0">
          {labelEl}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = stringValue === String(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange(String(n))}
                  className={`w-12 h-12 rounded-full border text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-orange-300"
                  }`}
                  aria-pressed={selected}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </fieldset>
      );

    case "yesno":
      return (
        <fieldset className="border-0 p-0 m-0">
          {labelEl}
          <div className="flex gap-4">
            {["Oui", "Non"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.key}
                  checked={stringValue === opt}
                  onChange={() => onChange(opt)}
                  className="accent-orange-500 w-4 h-4"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "multi":
      return (
        <fieldset className="border-0 p-0 m-0">
          {labelEl}
          <div className="flex flex-col gap-2">
            {(question.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={arrayValue.includes(opt)}
                  onChange={() => onToggleMulti(opt)}
                  className="accent-orange-500 w-4 h-4"
                />
                <span className="text-sm text-zinc-700">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "select":
      return (
        <fieldset className="border-0 p-0 m-0">
          {labelEl}
          <div className="flex flex-col gap-2">
            {(question.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50">
                <input
                  type="radio"
                  name={question.key}
                  checked={stringValue === opt}
                  onChange={() => onChange(opt)}
                  className="accent-orange-500 w-4 h-4"
                />
                <span className="text-sm text-zinc-700">{opt}</span>
              </label>
            ))}
            {(question.options ?? []).length === 0 && (
              <p className="text-sm text-zinc-400 italic">
                Aucune intervenante renseignée pour cet événement.
              </p>
            )}
          </div>
        </fieldset>
      );

    default:
      return null;
  }
}
