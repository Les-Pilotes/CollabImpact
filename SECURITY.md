# Security

CollabImpact runs in production for Les Pilotes: participants sign up to events, check in with a QR code and leave feedback; staff manage events from an admin dashboard. This page describes how the app protects that data today, and what is still on the roadmap.

## Access

| Who | How they get in | Guard |
|-----|-----------------|-------|
| Staff (admin dashboard) | Google sign-in through Supabase Auth | `requireAdmin()` on every protected page and server action. Only `@les-pilotes.fr` accounts are accepted (`src/lib/auth/allowed-domains.ts`); any other account is signed out. |
| Sensitive admin actions | Same session | `SUPER_ADMIN` role required (`AdminRole` enum, `requireSuperAdmin()`). |
| Participants | No account. Signed links only | HMAC-SHA256 tokens (`src/lib/tokens.ts`) with an expiry for each use: feedback link (30 days, also stored so it can be revoked), one-click email actions (14 days), day-of check-in QR code (about 2 days), resume link (about 15 minutes). Signatures are compared in constant time. |

A local `DEV_BYPASS_AUTH` switch exists for development only. It is ignored when `NODE_ENV` is `production` or `test`.

## Data separation

Every event, enrolment and admin belongs to an `Organisation`. Queries are scoped by `organisationId` in the application layer, so an admin only reads and changes data from their own organisation.

**Known gap:** this scoping is enforced in application code, not yet in the database. Postgres row-level security (RLS) is not enabled. The planned step is an RLS policy per table on `organisationId`, with the server connecting through a role that cannot bypass it, and tests that try to read across organisations and must fail.

## Data minimisation

- Impact reports are exported anonymised: open-ended answers are shown without names.
- Participants never get an account or password to leak.

## Secrets

- Secrets (`DATABASE_URL`, `FEEDBACK_TOKEN_SECRET`, Supabase and email keys) live in Vercel environment variables, never in the repository.
- GitHub secret scanning and push protection are on: a commit containing a key is rejected before it lands.
- Dependabot alerts and security updates are on.

## Changes to production

- `main` is protected: changes go through a pull request, and the "Lint, Typecheck, Test, Build" check must pass. Force pushes and branch deletion are blocked, history stays linear, and review conversations must be resolved before merging.
- CI runs the test suite against a real Postgres service.
- Database changes go through Prisma migrations (`prisma migrate deploy`), never manual edits in production. See `AGENTS.md`.
- Most code is written with AI coding agents. They follow the same path: their own `claude/*` branch, a pull request, green CI. They cannot push to `main`.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting (Security tab, then "Report a vulnerability"). We aim to reply within 5 working days.
