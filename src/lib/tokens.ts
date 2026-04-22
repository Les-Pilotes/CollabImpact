import crypto from "node:crypto";

/**
 * Token de feedback signé (HMAC-SHA256).
 * Format : base64url(enrollmentId).base64url(expiryTs).base64url(hmac)
 * Stocké aussi en base (Enrollment.feedbackToken) pour pouvoir invalider.
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
