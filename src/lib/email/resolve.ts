/**
 * Server-side helper that resolves the final subject / heading / body / note for
 * a transactional email by combining the event's EmailConfig overrides (if any)
 * with the hardcoded defaults, then substituting {variables}.
 *
 * Used by the J-7 / J-2 / feedback crons and the inscription confirmation
 * action. Sharing the same DEFAULTS + substituteVariables as the admin preview
 * guarantees that what the admin sees in the parametres page is what the
 * participant receives.
 */

import {
  DEFAULTS,
  substituteVariables,
  type EmailKey,
  type EmailVars,
} from "@/app/admin/(protected)/events/[eventId]/parametres/email-templates";

type EmailConfigSlice = {
  confirmationSubject?: string | null;
  confirmationBody?: string | null;
  confirmationNote?: string | null;
  j7Subject?: string | null;
  j7Body?: string | null;
  j7Note?: string | null;
  j2Subject?: string | null;
  j2Body?: string | null;
  j2Note?: string | null;
  feedbackSubject?: string | null;
  feedbackBody?: string | null;
  feedbackNote?: string | null;
} | null;

export type ResolvedEmail = {
  subject: string;
  heading: string;
  body: string;
  note: string | null;
};

export function resolveEmail(
  emailKey: EmailKey,
  config: EmailConfigSlice,
  vars: EmailVars,
): ResolvedEmail {
  const def = DEFAULTS[emailKey];
  const subjectOverride = config?.[`${emailKey}Subject`];
  const bodyOverride = config?.[`${emailKey}Body`];
  const noteOverride = config?.[`${emailKey}Note`];

  return {
    subject: substituteVariables(subjectOverride || def.subject, vars),
    heading: substituteVariables(def.heading, vars),
    body: substituteVariables(bodyOverride || def.body, vars),
    note: noteOverride ? substituteVariables(noteOverride, vars) : null,
  };
}
