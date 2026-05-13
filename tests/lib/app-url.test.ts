import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAppUrl } from "@/lib/app-url";

describe("getAppUrl", () => {
  const originalAppUrl = process.env.APP_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  beforeEach(() => {
    delete process.env.APP_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    if (originalAppUrl !== undefined) process.env.APP_URL = originalAppUrl;
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

  it("falls back to VERCEL_URL with https prefix", () => {
    process.env.VERCEL_URL = "collab-impact-git-foo-bar.vercel.app";
    expect(getAppUrl()).toBe("https://collab-impact-git-foo-bar.vercel.app");
  });

  it("strips trailing slash from VERCEL_URL", () => {
    process.env.VERCEL_URL = "collab-impact-git-foo-bar.vercel.app/";
    expect(getAppUrl()).toBe("https://collab-impact-git-foo-bar.vercel.app");
  });

  it("prefers APP_URL over VERCEL_URL when both set", () => {
    process.env.APP_URL = "https://app.les-pilotes.fr";
    process.env.VERCEL_URL = "ignored.vercel.app";
    expect(getAppUrl()).toBe("https://app.les-pilotes.fr");
  });

  it("falls back to localhost when neither set", () => {
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
