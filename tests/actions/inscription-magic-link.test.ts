import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    event: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import {
  lookupUserByEmail,
  sendResumeLink,
  consumeResumeToken,
} from "@/app/inscription/[eventId]/actions";
import { createResumeToken } from "@/lib/tokens";

const usr = vi.mocked(prisma.user);
const ev = vi.mocked(prisma.event);
const mail = vi.mocked(sendEmail);

beforeAll(() => {
  process.env.FEEDBACK_TOKEN_SECRET = "test-secret-for-vitest-only";
  process.env.APP_URL = "https://app.test";
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ─── lookupUserByEmail ──────────────────────────────────────────────────────

describe("lookupUserByEmail", () => {
  it("returns kind=new for an unknown email", async () => {
    usr.findUnique.mockResolvedValue(null as never);

    const result = await lookupUserByEmail("ghost@x.com");
    expect(result).toEqual({ kind: "new" });
  });

  it("returns kind=new for a known user without birthDate (defensive)", async () => {
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      lastName: "M",
      birthDate: null,
      orientationUpdatedAt: new Date(),
      enrollments: [],
    } as never);

    const result = await lookupUserByEmail("lisa@example.com");
    expect(result).toEqual({ kind: "new" });
  });

  it("returns a returning payload with a masked email (never the full address)", async () => {
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      lastName: "Martin",
      birthDate: new Date("2008-05-20"),
      orientationUpdatedAt: new Date(),
      enrollments: [
        { event: { name: "Workshop 6", date: new Date("2026-03-01") } },
      ],
    } as never);

    const result = await lookupUserByEmail("LISA@Example.com");

    expect(result.kind).toBe("returning");
    if (result.kind === "returning") {
      expect(result.firstName).toBe("Lisa");
      expect(result.maskedEmail).toBe("li***@example.com");
      expect(result).not.toHaveProperty("verifyBirthDate");
      expect(result.lastEventName).toBe("Workshop 6");
    }
  });

  it("marks orientation as stale when orientationUpdatedAt is > 6 months old", async () => {
    const eightMonthsAgo = new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000);
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      lastName: "Martin",
      birthDate: new Date("2008-05-20"),
      orientationUpdatedAt: eightMonthsAgo,
      enrollments: [],
    } as never);

    const result = await lookupUserByEmail("lisa@example.com");
    expect(result.kind === "returning" && result.isStale).toBe(true);
  });

  it("marks orientation as fresh when orientationUpdatedAt is recent", async () => {
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      lastName: "Martin",
      birthDate: new Date("2008-05-20"),
      orientationUpdatedAt: new Date(),
      enrollments: [],
    } as never);

    const result = await lookupUserByEmail("lisa@example.com");
    expect(result.kind === "returning" && result.isStale).toBe(false);
  });
});

// ─── sendResumeLink ─────────────────────────────────────────────────────────

describe("sendResumeLink", () => {
  it("returns no_event when the event doesn't exist", async () => {
    usr.findUnique.mockResolvedValue({ id: "u1", firstName: "Lisa", updatedAt: new Date(0) } as never);
    ev.findUnique.mockResolvedValue(null as never);

    const result = await sendResumeLink("lisa@x.com", "ev-missing");
    expect(result).toEqual({ ok: false, reason: "no_event" });
    expect(mail).not.toHaveBeenCalled();
  });

  it("returns unknown_email when the user doesn't exist (but the event does)", async () => {
    usr.findUnique.mockResolvedValue(null as never);
    ev.findUnique.mockResolvedValue({ id: "ev-1", name: "Workshop 7", replyToEmail: null } as never);

    const result = await sendResumeLink("ghost@x.com", "ev-1");
    expect(result).toEqual({ ok: false, reason: "unknown_email" });
    expect(mail).not.toHaveBeenCalled();
  });

  it("returns rate_limited when user.updatedAt is within the cooldown window", async () => {
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      updatedAt: new Date(Date.now() - 5_000), // 5s ago, well under 60s
    } as never);
    ev.findUnique.mockResolvedValue({ id: "ev-1", name: "Workshop 7", replyToEmail: null } as never);

    const result = await sendResumeLink("lisa@x.com", "ev-1");
    expect(result).toEqual({ ok: false, reason: "rate_limited" });
    expect(mail).not.toHaveBeenCalled();
  });

  it("sends a magic-link email with a resume URL bound to the event and bumps user.updatedAt", async () => {
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      updatedAt: new Date(0), // long enough ago
    } as never);
    ev.findUnique.mockResolvedValue({
      id: "ev-1",
      name: "Workshop 7",
      replyToEmail: "amadou@les-pilotes.fr",
    } as never);
    usr.update.mockResolvedValue({} as never);

    const result = await sendResumeLink("lisa@x.com", "ev-1");

    expect(result).toEqual({ ok: true });
    expect(usr.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { updatedAt: expect.any(Date) },
    });
    expect(mail).toHaveBeenCalledOnce();
    const args = mail.mock.calls[0][0];
    expect(args.to).toBe("lisa@x.com");
    expect(args.replyTo).toBe("amadou@les-pilotes.fr");
    expect(args.subject).toContain("Workshop 7");
    // The resumeUrl is passed inside the React element props; verify via props.
    const props = (args.react as { props: { resumeUrl: string; firstName: string; eventName: string } }).props;
    expect(props.firstName).toBe("Lisa");
    expect(props.eventName).toBe("Workshop 7");
    expect(props.resumeUrl).toMatch(/^https:\/\/app\.test\/inscription\/ev-1\?resume=/);
  });

  it("treats a sendEmail failure as non-fatal (still returns ok)", async () => {
    usr.findUnique.mockResolvedValue({ id: "u1", firstName: "Lisa", updatedAt: new Date(0) } as never);
    ev.findUnique.mockResolvedValue({ id: "ev-1", name: "Workshop 7", replyToEmail: null } as never);
    usr.update.mockResolvedValue({} as never);
    mail.mockRejectedValueOnce(new Error("resend down"));

    const result = await sendResumeLink("lisa@x.com", "ev-1");
    expect(result).toEqual({ ok: true });
  });
});

// ─── consumeResumeToken ─────────────────────────────────────────────────────

describe("consumeResumeToken", () => {
  it("rejects an invalid token with reason=invalid", async () => {
    const result = await consumeResumeToken("garbage", "ev-1");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(usr.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an expired token with reason=expired", async () => {
    const expired = createResumeToken("u1", "ev-1", -1);
    const result = await consumeResumeToken(expired, "ev-1");
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a token issued for a different event with reason=wrong_event", async () => {
    const token = createResumeToken("u1", "ev-other");
    const result = await consumeResumeToken(token, "ev-1");
    expect(result).toEqual({ ok: false, reason: "wrong_event" });
  });

  it("returns user_gone when the user has been deleted between issue and consume", async () => {
    usr.findUnique.mockResolvedValue(null as never);
    const token = createResumeToken("u-gone", "ev-1");

    const result = await consumeResumeToken(token, "ev-1");
    expect(result).toEqual({ ok: false, reason: "user_gone" });
  });

  it("returns the full profile and isStale=false on a fresh valid token", async () => {
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      lastName: "Martin",
      email: "lisa@x.com",
      phone: "0612345678",
      birthDate: new Date("2008-05-20"),
      city: "Paris",
      gender: "Fille",
      niveauScolaire: "Terminale",
      etablissement: "Voltaire",
      region: "Île-De-France",
      projetPro: "Découvrir",
      motivation: ["Apprendre"],
      motivationDetail: null,
      commentConnu: "Instagram",
      orientationUpdatedAt: new Date(),
    } as never);
    const token = createResumeToken("u1", "ev-1");

    const result = await consumeResumeToken(token, "ev-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isStale).toBe(false);
      expect(result.profile.firstName).toBe("Lisa");
      expect(result.profile.email).toBe("lisa@x.com");
      expect(result.profile.birthDate).toBe("2008-05-20");
      expect(result.profile.motivation).toEqual(["Apprendre"]);
    }
  });

  it("flags isStale=true when orientation is > 6 months old", async () => {
    const eightMonthsAgo = new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000);
    usr.findUnique.mockResolvedValue({
      id: "u1",
      firstName: "Lisa",
      lastName: "Martin",
      email: "lisa@x.com",
      phone: "",
      birthDate: new Date("2008-05-20"),
      city: "",
      gender: null,
      niveauScolaire: null,
      etablissement: null,
      region: null,
      projetPro: null,
      motivation: [],
      motivationDetail: null,
      commentConnu: null,
      orientationUpdatedAt: eightMonthsAgo,
    } as never);
    const token = createResumeToken("u1", "ev-1");

    const result = await consumeResumeToken(token, "ev-1");
    expect(result.ok && result.isStale).toBe(true);
  });
});
