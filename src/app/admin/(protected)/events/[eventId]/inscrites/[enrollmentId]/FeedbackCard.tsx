import { Feedback } from "@prisma/client";
import { CollapsibleSection, Field } from "./CollapsibleSection";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Feedback panel — only rendered when a Feedback row exists for this
 * Enrollment. Collapsible so the page stays compact.
 */
export function FeedbackCard({ feedback }: { feedback: Feedback }) {
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
      <div className="space-y-5 pt-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Note globale
            </p>
            <p className="mt-1 text-2xl font-bold text-stone-900 tabular-nums">
              {feedback.overallRating}
              <span className="text-base text-stone-400">/5</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Organisation
            </p>
            <p className="mt-1 text-2xl font-bold text-stone-900 tabular-nums">
              {feedback.orgRating}
              <span className="text-base text-stone-400">/5</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Vision changée
            </p>
            <p className="mt-1 text-lg font-semibold text-stone-900">
              {feedback.changedVision ? "Oui" : "Non"}
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
      </div>
    </CollapsibleSection>
  );
}
