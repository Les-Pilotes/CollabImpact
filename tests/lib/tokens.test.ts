import { describe, it, expect, beforeAll } from "vitest";
import { createFeedbackToken, verifyFeedbackToken } from "@/lib/tokens";

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
