import crypto from "node:crypto";

/**
 * Tokens HMAC signés. Quatre usages :
 *
 * 1. Feedback token — `createFeedbackToken` / `verifyFeedbackToken`
 *    Format : base64url(enrollmentId).base64url(expiryTs).base64url(hmac)
 *    Stocké aussi en base (Enrollment.feedbackToken) pour pouvoir invalider.
 *
 * 2. Action token — `createActionToken` / `verifyActionToken`
 *    Format : base64url(enrollmentId).base64url(action).base64url(expiryTs).base64url(hmac)
 *    Pour les boutons one-click dans les emails J-7 et J-2.
 *    Pas stocké en base — auto-vérifiable via signature.
 *
 * 3. Checkin token — `createCheckinToken` / `verifyCheckinToken`
 *    Format : base64url(enrollmentId).base64url("checkin").base64url(expiryTs).base64url(hmac)
 *    Encodé dans le QR Jour-J personnel d'une participante. TTL court (~2 jours).
 *    Pas stocké en base — auto-vérifiable via signature.
 *
 * 4. Resume token — `createResumeToken` / `verifyResumeToken`
 *    Format : base64url(userId).base64url(eventId).base64url("resume").base64url(expiryTs).base64url(hmac)
 *    Magic-link participant : permet à un.e utilisateur.rice connu.e de reprendre
 *    son inscription sans re-saisir ses infos. TTL très court (~15 min).
 *    Pas stocké en base — auto-vérifiable via signature.
 */

const SECRET = () => {
  const s = process.env.FEEDBACK_TOKEN_SECRET;
  if (!s) throw new Error("FEEDBACK_TOKEN_SECRET manquant");
  return s;
};

const DEFAULT_TTL_DAYS = 30;

function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", SECRET()).update(payload).digest("base64url");
}

export function createFeedbackToken(enrollmentId: string, ttlDays = DEFAULT_TTL_DAYS): string {
  const expiry = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `${b64url(enrollmentId)}.${b64url(String(expiry))}`;
  return `${payload}.${sign(payload)}`;
}

export type FeedbackTokenResult =
  | { valid: true; enrollmentId: string }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyFeedbackToken(token: string): FeedbackTokenResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, reason: "malformed" };
  const [encId, encExp, sig] = parts;
  const payload = `${encId}.${encExp}`;
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return { valid: false, reason: "bad_signature" };
  }
  const expiry = Number(Buffer.from(encExp, "base64url").toString("utf8"));
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return { valid: false, reason: "expired" };
  }
  return {
    valid: true,
    enrollmentId: Buffer.from(encId, "base64url").toString("utf8"),
  };
}

// ─── Action tokens (one-click email actions) ────────────────────────────────

export type ActionTokenAction = "confirm" | "decline";

const ACTION_TTL_DAYS = 14; // emails J-7 / J-2 valid for ~2 weeks

export function createActionToken(
  enrollmentId: string,
  action: ActionTokenAction,
  ttlDays = ACTION_TTL_DAYS,
): string {
  const expiry = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `${b64url(enrollmentId)}.${b64url(action)}.${b64url(String(expiry))}`;
  return `${payload}.${sign(payload)}`;
}

export type ActionTokenResult =
  | { valid: true; enrollmentId: string; action: ActionTokenAction }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" | "bad_action" };

export function verifyActionToken(token: string): ActionTokenResult {
  const parts = token.split(".");
  if (parts.length !== 4) return { valid: false, reason: "malformed" };
  const [encId, encAction, encExp, sig] = parts;
  const payload = `${encId}.${encAction}.${encExp}`;
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return { valid: false, reason: "bad_signature" };
  }
  const expiry = Number(Buffer.from(encExp, "base64url").toString("utf8"));
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return { valid: false, reason: "expired" };
  }
  const action = Buffer.from(encAction, "base64url").toString("utf8");
  if (action !== "confirm" && action !== "decline") {
    return { valid: false, reason: "bad_action" };
  }
  return {
    valid: true,
    enrollmentId: Buffer.from(encId, "base64url").toString("utf8"),
    action,
  };
}

// ─── Checkin tokens (QR Jour-J personnel) ───────────────────────────────────

const CHECKIN_TTL_DAYS = 2; // QR personnel — valable J-1 / J / J+1
const CHECKIN_TAG = "checkin";

/**
 * Émet un token signé qui sera encodé dans le QR Jour-J personnel.
 * Le tag interne (`checkin`) garantit qu'on ne peut pas reuse un actionToken
 * `confirm`/`decline` ici (et inversement).
 */
export function createCheckinToken(
  enrollmentId: string,
  ttlDays = CHECKIN_TTL_DAYS,
): string {
  const expiry = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const payload = `${b64url(enrollmentId)}.${b64url(CHECKIN_TAG)}.${b64url(String(expiry))}`;
  return `${payload}.${sign(payload)}`;
}

export type CheckinTokenResult =
  | { valid: true; enrollmentId: string }
  | { valid: false; reason: "malformed" | "bad_signature" | "expired" | "bad_tag" };

export function verifyCheckinToken(token: string): CheckinTokenResult {
  const parts = token.split(".");
  if (parts.length !== 4) return { valid: false, reason: "malformed" };
  const [encId, encTag, encExp, sig] = parts;
  const payload = `${encId}.${encTag}.${encExp}`;
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return { valid: false, reason: "bad_signature" };
  }
  const tag = Buffer.from(encTag, "base64url").toString("utf8");
  if (tag !== CHECKIN_TAG) {
    return { valid: false, reason: "bad_tag" };
  }
  const expiry = Number(Buffer.from(encExp, "base64url").toString("utf8"));
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return { valid: false, reason: "expired" };
  }
  return {
    valid: true,
    enrollmentId: Buffer.from(encId, "base64url").toString("utf8"),
  };
}

// ─── Resume tokens (magic-link participant) ─────────────────────────────────

const RESUME_TTL_MINUTES = 15;
const RESUME_TAG = "resume";

/**
 * Émet un token signé pour qu'un.e participant.e qui revient puisse reprendre
 * son inscription sans re-saisir ses infos. Lié à `userId` ET `eventId` : un
 * token ne sert qu'au couple pour lequel il a été émis. TTL très court car
 * c'est un secret d'authentification, pas un rappel transactionnel.
 */
export function createResumeToken(
  userId: string,
  eventId: string,
  ttlMinutes = RESUME_TTL_MINUTES,
): string {
  const expiry = Date.now() + ttlMinutes * 60 * 1000;
  const payload = `${b64url(userId)}.${b64url(eventId)}.${b64url(RESUME_TAG)}.${b64url(String(expiry))}`;
  return `${payload}.${sign(payload)}`;
}

export type ResumeTokenResult =
  | { valid: true; userId: string; eventId: string }
  | {
      valid: false;
      reason: "malformed" | "bad_signature" | "expired" | "bad_tag" | "wrong_event";
    };

export function verifyResumeToken(
  token: string,
  expectedEventId: string,
): ResumeTokenResult {
  const parts = token.split(".");
  if (parts.length !== 5) return { valid: false, reason: "malformed" };
  const [encUid, encEid, encTag, encExp, sig] = parts;
  const payload = `${encUid}.${encEid}.${encTag}.${encExp}`;
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return { valid: false, reason: "bad_signature" };
  }
  const tag = Buffer.from(encTag, "base64url").toString("utf8");
  if (tag !== RESUME_TAG) {
    return { valid: false, reason: "bad_tag" };
  }
  const expiry = Number(Buffer.from(encExp, "base64url").toString("utf8"));
  if (!Number.isFinite(expiry) || Date.now() > expiry) {
    return { valid: false, reason: "expired" };
  }
  const eventId = Buffer.from(encEid, "base64url").toString("utf8");
  if (eventId !== expectedEventId) {
    return { valid: false, reason: "wrong_event" };
  }
  return {
    valid: true,
    userId: Buffer.from(encUid, "base64url").toString("utf8"),
    eventId,
  };
}
