/**
 * Resolves the canonical URL of the deployed app, used to build absolute URLs
 * in emails (J-7, J-2, feedback, confirmation, magic link) and OAuth callbacks.
 *
 * Resolution order (first match wins):
 * 1. `APP_URL` env var (typical when you have a custom domain like app.les-pilotes.fr)
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` (stable production alias, auto-injected by
 *    Vercel on Production builds even when no custom domain is set — e.g.
 *    `collab-impact.vercel.app`). Survives redeploys.
 * 3. `VERCEL_URL` (deployment-specific hostname, auto-injected by Vercel on every
 *    build — preview AND production. Changes with each deploy — fine for previews,
 *    but flaky on prod because old magic links become dead links after a redeploy.)
 * 4. `http://localhost:3000` (local dev fallback)
 *
 * Always returns a URL without trailing slash, so callers can safely append
 * `/foo` without producing `//foo`.
 */
export function getAppUrl(): string {
  const explicit = process.env.APP_URL;
  if (explicit) return stripTrailingSlash(explicit);

  const prodAlias = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prodAlias) return `https://${stripTrailingSlash(prodAlias)}`;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${stripTrailingSlash(vercelUrl)}`;

  return "http://localhost:3000";
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
