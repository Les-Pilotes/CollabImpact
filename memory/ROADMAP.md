# CollabImpact — Roadmap V1

## Vision
Remplacer Notion comme outil de gestion des immersions Les Pilotes. MVP centré sur le jeune : compte persistant, zéro ressaisie, vraie UX produit.

## Phases V1

| Phase | Contenu | Durée estimée | Statut |
|-------|---------|---------------|--------|
| **Phase 0** | App bootable : `.env.local` rempli, schema Prisma étendu + pushé, seed exécuté, `pnpm dev` répond | 30 min | ⬜ |
| **Phase 1** | UI kit (shadcn) + Landing `/` + Catalogue `/immersions` + Détail `/immersions/[id]` | 1 jour | ⬜ |
| **Phase 2** | Auth unifié magic link (jeune + admin) — `/auth/login` + `/auth/callback` + `requireJeune()` | 0.5 jour | ⬜ |
| **Phase 3** | Espace jeune `/me` (5 sections) + inscription adaptative + droits à l'image + sondages côté jeune | 2 jours | ⬜ |
| **Phase 4** | Dashboard admin complet (KPI, Kanban, fiche 360°, CMS feed, sondages, insights) | 1.5 jour | ⬜ |
| **Phase 5** | Feedback tokenisé + 5 crons Vercel réels | 0.5 jour | ⬜ |
| **Phase 6** | Polish (états vides, badges, mobile-first, a11y) + deploy Vercel | 0.5 jour | ⬜ |

**Total estimé : ~6 jours de code**

## Hors V1 (documenté, à planifier après V1 éprouvée)
- Import Notion historique (champs `importedFrom`/`importedAt` déjà prévus dans le schéma)
- Portail entreprise / école
- Extension **100% Féminin** (2e brique prioritaire)
- Atelier Impulsion (à évaluer)
- App mobile Flutter/Supabase (Figma designs déjà faits)
- Signature électronique PDF réelle
- Gamification (badges, secteurs découverts)
- Tests automatisés (Vitest + Playwright)
- Row Level Security Supabase
