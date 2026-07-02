import type { Feedback } from "@prisma/client";
import { CollapsibleSection, Field } from "./CollapsibleSection";
import { FEEDBACK_SECTIONS } from "@/lib/feedback/questions";
import { capitalizeName } from "@/lib/normalize";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function renderAnswerValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "—";
}

function isAnswered(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Feedback panel — only rendered when a Feedback row exists for this Enrollment.
 * Shows v2 answers (from `answers` JSON) when available, falls back to legacy v1 fields.
 */
export function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const answers = (feedback.answers ?? {}) as Record<string, unknown>;
  const hasV2 = Object.keys(answers).length > 0;

  return (
    <CollapsibleSection
      label="Post-événement"
      title="Feedback reçu"
      defaultOpen
      meta={
        <span className="text-xs text-stone-500">
          Soumis le {dateFormatter.format(feedback.submittedAt)}
        </span>
      }
    >
      <div className="space-y-6 pt-4">
        {hasV2 ? (
          // ── V2 answers (structured questionnaire) ──────────────────────────
          FEEDBACK_SECTIONS
            .filter((s) =>
              s.questions.some(
                (q) => !q.fromProfile && isAnswered(answers[q.key])
              )
            )
            .map((section) => {
              const answered = section.questions.filter(
                (q) => !q.fromProfile && isAnswered(answers[q.key])
              );
              return (
                <div key={section.number} className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400 border-b border-stone-100 pb-1">
                    {section.number} · {section.title}
                  </p>
                  <dl className="grid grid-cols-1 gap-3">
                    {answered.map((q) => {
                      const label = q.dynamicLabel
                        ? q.label.replace("{animatriceName}", "l'animatrice")
                        : q.label;
                      const val = answers[q.key];
                      return (
                        <Field key={q.key} label={label} wide>
                          {q.type === "scale" ? (
                            <span className="font-semibold">{String(val)} / 5</span>
                          ) : Array.isArray(val) ? (
                            <ul className="list-disc list-inside space-y-0.5">
                              {(val as string[]).map((v) => (
                                <li key={v}>{v}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="whitespace-pre-wrap">{renderAnswerValue(val)}</p>
                          )}
                        </Field>
                      );
                    })}
                  </dl>
                </div>
              );
            })
        ) : (
          // ── Legacy V1 fields ───────────────────────────────────────────────
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                  Note globale
                </p>
                <p className="mt-1 text-2xl font-bold text-stone-900 tabular-nums">
                  {feedback.overallRating ?? "—"}
                  <span className="text-base text-stone-400">/5</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                  Organisation
                </p>
                <p className="mt-1 text-2xl font-bold text-stone-900 tabular-nums">
                  {feedback.orgRating ?? "—"}
                  <span className="text-base text-stone-400">/5</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                  Vision changée
                </p>
                <p className="mt-1 text-lg font-semibold text-stone-900">
                  {feedback.changedVision == null ? "—" : feedback.changedVision ? "Oui" : "Non"}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-4">
              {feedback.favoriteMoment && (
                <Field label="Moment préféré">{feedback.favoriteMoment}</Field>
              )}
              {feedback.improvements && (
                <Field label="Améliorations">{feedback.improvements}</Field>
              )}
              {feedback.verbatim && (
                <Field label="Verbatim">
                  <p className="whitespace-pre-wrap rounded-xl bg-stone-50 px-3 py-2 text-stone-700 italic">
                    &ldquo;{feedback.verbatim}&rdquo;
                  </p>
                </Field>
              )}
            </dl>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}
