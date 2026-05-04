import { Resend } from "resend";

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Les Pilotes <no-reply@lespilotes.fr>";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO ?? "contact@lespilotes.fr";

// Lazy singleton — avoids throwing at module load when RESEND_API_KEY is empty.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

type SendEmailParams = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
};

/**
 * Envoie un email transactionnel. Non bloquant : log l'erreur et retourne
 * `{ sent: false }` pour que l'appelant décide quoi faire.
 */
export async function sendEmail({ to, subject, react }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) {
    // En dev sans clé : on no-op mais on log pour debug.
    console.info(`[email:noop] to=${Array.isArray(to) ? to.join(",") : to} subject="${subject}"`);
    return { sent: false as const, reason: "no-api-key" as const };
  }

  const resend = getResend();
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to,
      subject,
      react,
    });
    if (error) {
      console.error("[email:error]", error);
      return { sent: false as const, reason: error.message };
    }
    return { sent: true as const, id: data?.id };
  } catch (err) {
    console.error("[email:exception]", err);
    return { sent: false as const, reason: "exception" as const };
  }
}
