import { describe, it, expect, vi, beforeEach } from "vitest";

// Default to SUPER_ADMIN; tests override via mockResolvedValueOnce
vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    admin: { id: "current-1", organisationId: "org-1", role: "SUPER_ADMIN" },
    user: { email: "amadou@les-pilotes.fr" },
  }),
  requireSuperAdmin: vi.fn().mockResolvedValue({
    admin: { id: "current-1", organisationId: "org-1", role: "SUPER_ADMIN" },
    user: { email: "amadou@les-pilotes.fr" },
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    admin: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { sendAdminInvitationMock } = vi.hoisted(() => ({
  sendAdminInvitationMock: vi
    .fn()
    .mockResolvedValue({ sent: true, id: "email-id" }),
}));

vi.mock("@/lib/email/admin-invitation", () => ({
  sendAdminInvitation: sendAdminInvitationMock,
}));

import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import {
  inviteAdmin,
  removeAdmin,
  updateAdminRole,
} from "@/app/admin/(protected)/parametres/admins/actions";

const ad = vi.mocked(prisma.admin);

describe("inviteAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an admin from valid input and sends an invitation email", async () => {
    ad.findUnique.mockResolvedValue(null as never);
    ad.create.mockResolvedValue({ id: "new", firstName: "Léa" } as never);

    const result = await inviteAdmin({
      email: "lea@les-pilotes.fr",
      firstName: "Léa",
      lastName: "Bernard",
      role: "ADMIN",
    });

    expect(result.ok).toBe(true);
    expect(ad.create).toHaveBeenCalledOnce();
    const args = ad.create.mock.calls[0][0];
    expect(args.data.email).toBe("lea@les-pilotes.fr");
    expect(args.data.role).toBe("ADMIN");

    // Invitation is fired and not awaited inside the action — the mock is
    // sync-resolved so it has been called by the time we assert.
    expect(sendAdminInvitationMock).toHaveBeenCalledTimes(1);
    expect(sendAdminInvitationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "lea@les-pilotes.fr",
        firstName: "Léa",
      }),
    );
  });

  it("rejects an email outside the allowed domain", async () => {
    const result = await inviteAdmin({
      email: "stranger@gmail.com",
      firstName: "X",
      lastName: "Y",
      role: "ADMIN",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.email?.[0]).toMatch(/les-pilotes\.fr/i);
    }
    expect(ad.findUnique).not.toHaveBeenCalled();
    expect(ad.create).not.toHaveBeenCalled();
    expect(sendAdminInvitationMock).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase + trims", async () => {
    ad.findUnique.mockResolvedValue(null as never);
    ad.create.mockResolvedValue({ id: "new" } as never);

    await inviteAdmin({
      email: "  Lea@LES-Pilotes.fr  ",
      firstName: "L",
      lastName: "B",
      role: "ADMIN",
    });

    expect(ad.create.mock.calls[0][0].data.email).toBe("lea@les-pilotes.fr");
  });

  it("rejects duplicate email", async () => {
    ad.findUnique.mockResolvedValue({ id: "existing" } as never);

    const result = await inviteAdmin({
      email: "lea@les-pilotes.fr",
      firstName: "L",
      lastName: "B",
      role: "ADMIN",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/déjà/i);
    expect(ad.create).not.toHaveBeenCalled();
  });

  it("rejects non-super-admin", async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(new Error("denied"));

    const result = await inviteAdmin({
      email: "x@y.fr",
      firstName: "X",
      lastName: "Y",
      role: "ADMIN",
    });

    expect(result.ok).toBe(false);
    expect(ad.create).not.toHaveBeenCalled();
  });
});

describe("removeAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks self-removal", async () => {
    const result = await removeAdmin("current-1");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/toi-même/i);
    expect(ad.delete).not.toHaveBeenCalled();
  });

  it("blocks removing the last SUPER_ADMIN", async () => {
    ad.findUnique.mockResolvedValue({ role: "SUPER_ADMIN" } as never);
    ad.count.mockResolvedValue(0 as never); // no other super-admin remains

    const result = await removeAdmin("super-2");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/super-administrateur/i);
    expect(ad.delete).not.toHaveBeenCalled();
  });

  it("allows removing an ADMIN", async () => {
    ad.findUnique.mockResolvedValue({ role: "ADMIN" } as never);
    ad.delete.mockResolvedValue({} as never);

    const result = await removeAdmin("admin-2");

    expect(result.ok).toBe(true);
    expect(ad.delete).toHaveBeenCalledWith({ where: { id: "admin-2" } });
  });
});

describe("updateAdminRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks self-demotion from SUPER_ADMIN", async () => {
    const result = await updateAdminRole("current-1", "ADMIN");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/propre rôle/i);
    expect(ad.update).not.toHaveBeenCalled();
  });

  it("blocks demoting the last SUPER_ADMIN", async () => {
    ad.count.mockResolvedValue(0 as never);

    const result = await updateAdminRole("other-super", "ADMIN");

    expect(result.ok).toBe(false);
    expect(ad.update).not.toHaveBeenCalled();
  });

  it("promotes ADMIN to SUPER_ADMIN without count check", async () => {
    ad.update.mockResolvedValue({} as never);

    const result = await updateAdminRole("admin-2", "SUPER_ADMIN");

    expect(result.ok).toBe(true);
    expect(ad.count).not.toHaveBeenCalled();
    expect(ad.update).toHaveBeenCalled();
  });
});
