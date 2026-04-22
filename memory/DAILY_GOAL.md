# Objectif du jour — 2026-04-22 (Sprint 1, J1)

## Contexte sprint
Rendre l'app bootable end-to-end et livrer la vitrine publique (Phase 0 → Phase 1).

## Tâche
Phase 0 complète : configurer l'environnement, étendre le schéma Prisma avec les nouveaux modèles V1, pousser le schéma sur Supabase, exécuter le seed.

## Critères de succès
- [ ] `.env.local` rempli avec toutes les variables (DB, Supabase anon + service role, Resend, CRON_SECRET, FEEDBACK_TOKEN_SECRET, SEED_ADMIN_EMAIL)
- [ ] `prisma/schema.prisma` étendu : champs `supabaseAuthId`, `importedFrom/At`, `imageRights*`, modèles `Update`, `Poll`, `PollResponse`
- [ ] `pnpm prisma generate` + `pnpm db:push` passent sans erreur
- [ ] `pnpm db:seed` exécuté — orga ID copié dans `.env.local`
- [ ] `pnpm dev` démarre et `/` répond (même si placeholder)

## Fichiers concernés
- `.env.local` — variables d'environnement (ne jamais commiter)
- `prisma/schema.prisma` — schéma DB à étendre
- `prisma/seed.ts` — seed à exécuter (+ ajouter 1 Update + 1 Poll demo)

## Priorité
Haute — rien ne peut avancer tant que la DB n'est pas up
