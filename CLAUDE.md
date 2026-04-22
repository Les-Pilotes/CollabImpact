@AGENTS.md

# CollabImpact — Guide développeur

Plateforme digitale Les Pilotes pour les immersions professionnelles des jeunes.
Stack : Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase + Prisma + Resend.

## Commandes essentielles

```bash
pnpm dev              # dev local sur :3000
pnpm build            # vérifier que le build passe (obligatoire avant commit)
pnpm lint             # eslint
pnpm prisma studio    # UI Prisma pour inspecter la DB
pnpm db:push          # pousser le schéma Prisma sur Supabase (sans migration)
pnpm db:seed          # seed initial (admin + orga + immersion demo)
pnpm email:dev        # prévisualiser les templates email Resend
```

Tester les crons manuellement :
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/j7
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/j2
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/feedback
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/feedback-relance
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/droits-relance
```

## Conventions

- **App Router uniquement** — pas de `pages/`
- **Server Components par défaut** — `'use client'` seulement si nécessaire (événements, state local)
- **Accès DB** — toujours via `src/lib/db.ts` (singleton Prisma), jamais d'import direct
- **Auth** — `requireAdmin()` / `requireJeune()` / `getOptionalUser()` depuis `src/lib/auth.ts`
- **Variables d'env côté client** — uniquement `NEXT_PUBLIC_*`
- **Commits** — `feat:`, `fix:`, `ci:`, `docs:`, `refactor:`, `chore:`
- **Ne jamais commiter** `.env.local`, clés API, secrets

## Agents automatiques

| Agent | Déclencheur | Rôle |
|-------|-------------|------|
| `coder` | Daily Dev Loop (en semaine, 12h) | Implémente l'objectif du jour, crée une branche feature |
| `reviewer` | Après coder | Valide build/lint/qualité, merge la PR |
| `manager` | Lundi matin (11h) | Bilan hebdo, met à jour DAILY_GOAL.md |
| `retro-bot` | Fin de sprint (appelé par manager) | Génère review + rétrospective |

Voir `agents/` pour les instructions détaillées de chaque agent.
Voir `memory/` pour l'état courant (goal, sprint, logs, architecture).
