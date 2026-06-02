import { describe, it, expect, vi, beforeEach } from "vitest";

const { exchangeMock, getUserMock, signOutMock } = vi.hoisted(() => ({
  exchangeMock: vi.fn(),
  getUserMock: vi.fn(),
  signOutMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: exchangeMock,
      getUser: getUserMock,
      signOut: signOutMock,
    },
  }),
}));

import { GET } from "@/app/auth/callback/route";

function request(url: string) {
  return new Request(url) as unknown as Parameters<typeof GET>[0];
}

beforeEach(() => vi.clearAllMocks());

describe("auth callback", () => {
  it("redirects with auth-unavailable when no code is present", async () => {
    const res = await GET(request("https://app.test/auth/callback"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://app.test/admin/login?reason=auth-unavailable",
    );
    expect(exchangeMock).not.toHaveBeenCalled();
  });

  it("redirects with auth-unavailable when the code exchange fails", async () => {
    exchangeMock.mockResolvedValue({ error: { message: "bad code" } });

    const res = await GET(request("https://app.test/auth/callback?code=abc"));

    expect(res.headers.get("location")).toBe(
      "https://app.test/admin/login?reason=auth-unavailable",
    );
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("signs out and redirects when the resulting email is outside the allowed domain", async () => {
    exchangeMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { email: "stranger@gmail.com" } },
    });

    const res = await GET(request("https://app.test/auth/callback?code=abc"));

    expect(signOutMock).toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "https://app.test/admin/login?reason=domain-not-allowed",
    );
  });

  it("redirects to /admin when the email is allowed", async () => {
    exchangeMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { email: "amadou@les-pilotes.fr" } },
    });

    const res = await GET(request("https://app.test/auth/callback?code=abc"));

    expect(signOutMock).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("https://app.test/admin");
  });

  it("honors a ?next= override when the email is allowed", async () => {
    exchangeMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { email: "amadou@les-pilotes.fr" } },
    });

    const res = await GET(
      request("https://app.test/auth/callback?code=abc&next=/admin/events/42"),
    );

    expect(res.headers.get("location")).toBe(
      "https://app.test/admin/events/42",
    );
  });
});
