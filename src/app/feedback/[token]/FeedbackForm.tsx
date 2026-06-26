"use client";

import { useState } from "react";
import type { FeedbackQuestion } from "@/lib/feedback/questions";

type AnswerValue = string | string[];

type Props = {
  token: string;
  firstName: string;
  immersionName: string;
  /** Visible questions, already filtered by config and with dynamic options resolved. */
  questions: FeedbackQuestion[];
};

export default function FeedbackForm({ token, firstName, immersionName, questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  function isAnswered(value: AnswerValue | undefined): boolean {
    if (value == null) return false;
    return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
  }

  // A conditional question is shown only when its dependency matches.
  function isVisible(q: FeedbackQuestion): boolean {
    if (!q.showIf) return true;
    return answers[q.showIf.key] === q.showIf.equals;
  }
  const visibleQuestions = questions.filter(isVisible);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Keep only answered questions that are actually visible — the form is
    // voluntary, nothing is hard-required, but we ask for at least one answer
    // so we don't store empty feedbacks (and never store a hidden conditional).
    const cleaned: Record<string, AnswerValue> = {};
    for (const q of visibleQuestions) {
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
      <div className="text-center py-10 px-6">
        <p className="text-5xl">🙏</p>
        <h2 className="text-xl font-bold mt-3 mb-2">Merci, {firstName} !</h2>
        <p className="text-zinc-500">
          Ton avis nous aide à améliorer les prochains événements.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <p className="text-zinc-500 text-sm">
        Partage ton expérience sur <strong>{immersionName}</strong>. Ça prend 3 minutes !
      </p>

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

      <button
        type="submit"
        disabled={submitting}
        className="bg-zinc-900 text-white py-3 px-6 rounded-md font-semibold text-[15px] disabled:opacity-60"
      >
        {submitting ? "Envoi en cours…" : "Envoyer mon avis"}
      </button>
    </form>
  );
}

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
          <input
            type="text"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            className="border border-zinc-200 rounded-md px-3 py-2 text-[15px]"
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
            className="border border-zinc-200 rounded-md px-3 py-2 text-[15px] resize-y"
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
                  className={`w-11 h-11 rounded-full border text-sm font-semibold transition-colors ${
                    selected
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
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
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={arrayValue.includes(opt)}
                  onChange={() => onToggleMulti(opt)}
                />
                {opt}
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
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.key}
                  checked={stringValue === opt}
                  onChange={() => onChange(opt)}
                />
                {opt}
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
