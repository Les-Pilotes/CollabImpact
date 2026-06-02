import { describe, it, expect } from "vitest";
import {
  ALLOWED_ADMIN_DOMAINS,
  isAllowedAdminEmail,
} from "@/lib/auth/allowed-domains";

describe("isAllowedAdminEmail", () => {
  it("accepts the canonical domain", () => {
    expect(isAllowedAdminEmail("amadou@les-pilotes.fr")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAllowedAdminEmail("Amadou@Les-Pilotes.FR")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(isAllowedAdminEmail("  bocar@les-pilotes.fr  ")).toBe(true);
  });

  it("rejects other domains", () => {
    expect(isAllowedAdminEmail("a@gmail.com")).toBe(false);
    expect(isAllowedAdminEmail("a@les-pilotes.com")).toBe(false);
    expect(isAllowedAdminEmail("a@lespilotes.fr")).toBe(false);
  });

  it("rejects substring tricks", () => {
    expect(isAllowedAdminEmail("a@evil-les-pilotes.fr")).toBe(false);
    expect(isAllowedAdminEmail("a@les-pilotes.fr.evil.com")).toBe(false);
  });

  it("rejects malformed inputs", () => {
    expect(isAllowedAdminEmail("")).toBe(false);
    expect(isAllowedAdminEmail("no-at-sign")).toBe(false);
    expect(isAllowedAdminEmail("@les-pilotes.fr")).toBe(false);
    expect(isAllowedAdminEmail("a@")).toBe(false);
    expect(isAllowedAdminEmail(null)).toBe(false);
    expect(isAllowedAdminEmail(undefined)).toBe(false);
    expect(isAllowedAdminEmail(42)).toBe(false);
  });

  it("exposes the allow list as a readonly tuple", () => {
    expect(ALLOWED_ADMIN_DOMAINS).toContain("les-pilotes.fr");
  });
});
