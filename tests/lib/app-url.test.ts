import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAppUrl } from "@/lib/app-url";

describe("getAppUrl", () => {
  const originalAppUrl = process.env.APP_URL;
  const originalProdAlias = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  beforeEach(() => {
    delete process.env.APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    if (originalAppUrl !== undefined) process.env.APP_URL = originalAppUrl;
    if (originalProdAlias !== undefined)
      process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProdAlias;
    if (originalVercelUrl !== undefined) process.env.VERCEL_URL = originalVercelUrl;
  });

  it("returns APP_URL when set", () => {
    process.env.APP_URL = "https://app.les-pilotes.fr";
    expect(getAppUrl()).toBe("https://app.les-pilotes.fr");
  });

  it("strips trailing slash from APP_URL", () => {
    process.env.APP_URL = "https://app.les-pilotes.fr/";
    expect(getAppUrl()).toBe("https://app.les-pilotes.fr");
  });

  it("falls back to VERCEL_PROJECT_PRODUCTION_URL when APP_URL absent", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "collab-impact.vercel.app";
    expect(getAppUrl()).toBe("https://collab-impact.vercel.app");
  });

  it("strips trailing slash from VERCEL_PROJECT_PRODUCTION_URL", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "collab-impact.vercel.app/";
    expect(getAppUrl()).toBe("https://collab-impact.vercel.app");
  });

  it("falls back to VERCEL_URL when neither APP_URL nor prod alias set", () => {
    process.env.VERCEL_URL = "collab-impact-git-foo-bar.vercel.app";
    expect(getAppUrl()).toBe("https://collab-impact-git-foo-bar.vercel.app");
  });

  it("strips trailing slash from VERCEL_URL", () => {
    process.env.VERCEL_URL = "collab-impact-git-foo-bar.vercel.app/";
    expect(getAppUrl()).toBe("https://collab-impact-git-foo-bar.vercel.app");
  });

  it("prefers APP_URL over prod alias and VERCEL_URL", () => {
    process.env.APP_URL = "https://app.les-pilotes.fr";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "ignored-prod.vercel.app";
    process.env.VERCEL_URL = "ignored-deploy.vercel.app";
    expect(getAppUrl()).toBe("https://app.les-pilotes.fr");
  });

  it("prefers prod alias over deployment-specific VERCEL_URL", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "collab-impact.vercel.app";
    process.env.VERCEL_URL = "collab-impact-abc-xyz.vercel.app";
    expect(getAppUrl()).toBe("https://collab-impact.vercel.app");
  });

  it("falls back to localhost when no env vars set", () => {
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
