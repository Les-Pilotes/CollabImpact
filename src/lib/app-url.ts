/**
 * Resolves the canonical URL of the deployed app, used to build absolute URLs
 * in emails and OAuth callbacks.
 *
 * Resolution order:
 * 1. `APP_URL` env var (set on Vercel for production with custom domain)
 * 2. `VERCEL_URL` (auto-injected on every Vercel deployment — preview or prod)
 * 3. `http://localhost:3000` (local dev fallback)
 *
 * Always returns a URL without trailing slash, so callers can safely append
 * `/foo` without producing `//foo`.
 */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL;
  if (explicit) return stripTrailingSlash(explicit);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${stripTrailingSlash(vercelUrl)}`;

  return "http://localhost:3000";
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
