import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import RootPage from "@/app/page";

beforeEach(() => vi.clearAllMocks());

describe("root /", () => {
  it("redirects to /admin so logged-in users go to events and others to login", () => {
    expect(() => RootPage()).toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });
});
