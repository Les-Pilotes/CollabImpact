/**
 * Single source of truth for the email domains allowed to log in to the
 * admin area. Add a domain here to extend access; nothing else needs to
 * change.
 */
export const ALLOWED_ADMIN_DOMAINS = ["les-pilotes.fr"] as const;

export function isAllowedAdminEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return false;
  const local = normalized.slice(0, at);
  if (!local) return false;
  const domain = normalized.slice(at + 1);
  return (ALLOWED_ADMIN_DOMAINS as readonly string[]).includes(domain);
}
