import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirectMock, getUserMock, signOutMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  }),
  getUserMock: vi.fn(),
  signOutMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: getUserMock,
      signOut: signOutMock,
    },
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    admin: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";

const ad = vi.mocked(prisma.admin);

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.DEV_BYPASS_AUTH;
  vi.stubEnv("NODE_ENV", "test");
});

describe("requireAdmin — domain gate", () => {
  it("redirects with domain-not-allowed when session email is outside the allow list", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "evil@gmail.com" } } });

    await expect(requireAdmin()).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith(
      "/admin/login?reason=domain-not-allowed",
    );
    expect(signOutMock).toHaveBeenCalled();
    expect(ad.findUnique).not.toHaveBeenCalled();
  });

  it("redirects with not-authorized when domain is OK but no Admin row exists", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "ghost@les-pilotes.fr" } },
    });
    ad.findUnique.mockResolvedValue(null as never);

    await expect(requireAdmin()).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith("/admin/login?reason=not-authorized");
    expect(signOutMock).toHaveBeenCalled();
  });

  it("returns the admin context when everything matches", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "amadou@les-pilotes.fr" } },
    });
    ad.findUnique.mockResolvedValue({
      id: "a-1",
      email: "amadou@les-pilotes.fr",
      role: "SUPER_ADMIN",
      organisationId: "org-1",
    } as never);

    const ctx = await requireAdmin();

    expect(ctx.admin.id).toBe("a-1");
    expect(ctx.user.email).toBe("amadou@les-pilotes.fr");
    expect(redirectMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("redirects to login when no session is present", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(requireAdmin()).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });
});

describe("requireSuperAdmin", () => {
  it("throws when role is ADMIN", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "lea@les-pilotes.fr" } },
    });
    ad.findUnique.mockResolvedValue({
      id: "a-2",
      email: "lea@les-pilotes.fr",
      role: "ADMIN",
      organisationId: "org-1",
    } as never);

    await expect(requireSuperAdmin()).rejects.toThrow(/super-administrateurs/i);
  });

  it("passes through when role is SUPER_ADMIN", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { email: "amadou@les-pilotes.fr" } },
    });
    ad.findUnique.mockResolvedValue({
      id: "a-1",
      email: "amadou@les-pilotes.fr",
      role: "SUPER_ADMIN",
      organisationId: "org-1",
    } as never);

    const ctx = await requireSuperAdmin();
    expect(ctx.admin.role).toBe("SUPER_ADMIN");
  });
});

describe("DEV_BYPASS_AUTH", () => {
  it("is disabled in NODE_ENV=test even when DEV_BYPASS_AUTH=true", async () => {
    process.env.DEV_BYPASS_AUTH = "true";
    vi.stubEnv("NODE_ENV", "test");
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(requireAdmin()).rejects.toThrow(/NEXT_REDIRECT/);
    // Hits the normal auth path, redirects to login (no DB findFirst call).
    expect(ad.findFirst).not.toHaveBeenCalled();
  });
});
