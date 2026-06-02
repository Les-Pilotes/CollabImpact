import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

vi.mock("next/font/google", () => ({
  DM_Sans: () => ({ variable: "var-mock", className: "cls-mock" }),
}));

describe("root metadata", () => {
  const originalAppUrl = process.env.APP_URL;
  const originalProdAlias = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  beforeAll(() => {
    delete process.env.APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    process.env.APP_URL = "https://admin.les-pilotes.fr";
  });

  afterAll(() => {
    if (originalAppUrl !== undefined) process.env.APP_URL = originalAppUrl;
    else delete process.env.APP_URL;
    if (originalProdAlias !== undefined)
      process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProdAlias;
    if (originalVercelUrl !== undefined) process.env.VERCEL_URL = originalVercelUrl;
  });

  it("exposes a canonical metadataBase, OG fields, robots, and twitter card", async () => {
    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase?.toString()).toBe(
      "https://admin.les-pilotes.fr/",
    );
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.openGraph?.locale).toBe("fr_FR");
    expect(metadata.twitter).toBeDefined();
    expect(metadata.applicationName).toBe("Les Pilotes — Admin");
  });

  it("exposes a viewport with the brand theme color", async () => {
    const { viewport } = await import("@/app/layout");
    expect(viewport.themeColor).toBe("#ff914d");
  });
});
