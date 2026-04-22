# Sprint 1 — Phase 0 + Phase 1

**Période :** 2026-04-22 → 2026-04-29
**Sprint Goal :** Rendre l'app bootable end-to-end et livrer la vitrine publique (landing + catalogue + détail immersion)

## Backlog

### Phase 0 — Rendre l'app bootable
- ⬜ Générer `CRON_SECRET` + `FEEDBACK_TOKEN_SECRET` via `openssl rand -hex 32`
- ⬜ Remplir `.env.local` avec toutes les valeurs (DB, Supabase, Resend, secrets)
- ⬜ Étendre `prisma/schema.prisma` : champs auth jeune, import, image rights, Update, Poll, PollResponse
- ⬜ `pnpm prisma generate` + `pnpm db:push`
- ⬜ `SEED_ADMIN_EMAIL="amadou_g@hotmail.fr" pnpm db:seed` → copier orga ID dans `.env.local`
- ⬜ Vérifier que `pnpm dev` répond sur `/`

### Phase 1 — UI kit + Landing + Catalogue
- ⬜ Installer shadcn components (button, input, form, card, label, select, textarea, checkbox, badge, tabs, dialog, skeleton, avatar, progress)
- ⬜ Configurer palette Les Pilotes : jaune `#ffe959`, orange `#ff914d`, blanc, police Gotham (ou Inter fallback)
- ⬜ `src/app/globals.css` + `src/app/layout.tsx` (font + couleurs)
- ⬜ `src/app/page.tsx` — landing produit (hero + 3 bénéfices + verbatims + CTA)
- ⬜ `src/app/immersions/page.tsx` — catalogue public (cards entreprise/thème/date/places)
- ⬜ `src/app/immersions/[id]/page.tsx` — détail immersion + CTA inscription

## Definition of Done
- [ ] `pnpm dev` démarre sans erreur
- [ ] `pnpm build` passe sans erreur
- [ ] `/` affiche la landing avec le branding Les Pilotes
- [ ] `/immersions` affiche le catalogue avec au moins 1 immersion seed
- [ ] `/immersions/[id]` affiche le détail avec CTA fonctionnel
