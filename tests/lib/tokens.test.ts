import { describe, it, expect, beforeAll } from "vitest";
import {
  createFeedbackToken,
  verifyFeedbackToken,
  createCheckinToken,
  verifyCheckinToken,
  createActionToken,
} from "@/lib/tokens";

beforeAll(() => {
  process.env.FEEDBACK_TOKEN_SECRET = "test-secret-for-vitest-only";
});

describe("createFeedbackToken / verifyFeedbackToken", () => {
  it("round-trips a valid token", () => {
    const token = createFeedbackToken("e_123");
    const result = verifyFeedbackToken(token);
    expect(result).toEqual({ valid: true, enrollmentId: "e_123" });
  });

  it("rejects a garbage string", () => {
    const result = verifyFeedbackToken("garbage.bad.string");
    expect(result).toMatchObject({ valid: false });
  });

  it("rejects an already-expired token (negative TTL)", () => {
    const token = createFeedbackToken("e_123", -1);
    const result = verifyFeedbackToken(token);
    expect(result).toEqual({ valid: false, reason: "expired" });
  });
});

describe("createCheckinToken / verifyCheckinToken", () => {
  it("round-trips a valid token", () => {
    const token = createCheckinToken("e_abc");
    const result = verifyCheckinToken(token);
    expect(result).toEqual({ valid: true, enrollmentId: "e_abc" });
  });

  it("rejects an expired token", () => {
    const token = createCheckinToken("e_abc", -1);
    const result = verifyCheckinToken(token);
    expect(result).toEqual({ valid: false, reason: "expired" });
  });

  it("rejects a malformed token", () => {
    expect(verifyCheckinToken("foo.bar.baz")).toEqual({
      valid: false,
      reason: "malformed",
    });
  });

  it("rejects a tampered token", () => {
    const token = createCheckinToken("e_abc");
    const parts = token.split(".");
    // Flip a char in the signature
    const sig = parts[3];
    const flipped = sig.startsWith("a")
      ? "b" + sig.slice(1)
      : "a" + sig.slice(1);
    const tampered = [...parts.slice(0, 3), flipped].join(".");
    expect(verifyCheckinToken(tampered)).toEqual({
      valid: false,
      reason: "bad_signature",
    });
  });

  it("does not validate an actionToken as checkin (bad signature)", () => {
    // Action tokens have 4 parts too, but use a different tag string; HMAC differs.
    const actionToken = createActionToken("e_abc", "confirm");
    const result = verifyCheckinToken(actionToken);
    expect(result.valid).toBe(false);
  });
});
