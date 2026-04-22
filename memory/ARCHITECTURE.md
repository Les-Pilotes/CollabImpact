# CollabImpact — Architecture

## Stack technique
| Couche | Choix |
|--------|-------|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Style | Tailwind CSS v4 + shadcn/ui |
| Base de données | Supabase (PostgreSQL) — projet `gtvcbymbremngkeijkfd` (eu-central-1) |
| ORM | Prisma |
| Auth | Supabase Auth (magic link) — whitelist admin par email |
| Email | Resend |
| Crons | Vercel Cron Jobs |
| Déploiement | Vercel |

## Branding
- Couleur primaire : jaune `#ffe959`
- Couleur secondaire : orange `#ff914d`
- Fond : blanc
- Police : Gotham (Bold pour titres, Medium/Book pour corps)
- Logo : fusée Les Pilotes (voir `public/`)
- Mode : light uniquement (v1)

## Personas
1. **Jeune** (magic link) — explore, s'inscrit, donne feedback, signe droits image
2. **Admin Les Pilotes** (magic link + whitelist) — gère les immersions, publie contenu, consulte KPIs
3. **Visiteur anonyme** — browse le catalogue, toute action force le login

## Structure src/
```
src/app/
├── page.tsx                         # landing
├── immersions/
│   ├── page.tsx                     # catalogue public
│   └── [id]/page.tsx                # détail
├── auth/
│   ├── login/page.tsx               # form email unique
│   └── callback/route.ts            # exchange + routing
├── me/
│   ├── layout.tsx                   # requireJeune + nav
│   ├── page.tsx                     # dashboard 5 sections
│   ├── profil/page.tsx
│   ├── inscrire/[immersionId]/page.tsx
│   └── droits/[enrollmentId]/page.tsx
├── feedback/[token]/page.tsx        # public, tokenisé
├── admin/
│   ├── layout.tsx                   # requireAdmin
│   ├── page.tsx                     # KPI + Kanban
│   ├── immersions/...
│   ├── inscrits/[id]/page.tsx
│   ├── feed/...
│   ├── sondages/...
│   ├── droits/page.tsx
│   └── insights/page.tsx
└── api/
    ├── inscriptions/route.ts
    ├── utilisateurs/me/route.ts
    ├── droits/[enrollmentId]/route.ts
    ├── sondages/[id]/repondre/route.ts
    ├── feedback/[token]/route.ts
    ├── admin/...
    └── cron/{j7,j2,feedback,feedback-relance,droits-relance}/route.ts

src/lib/
├── db.ts           # Prisma client (singleton)
├── auth.ts         # requireAdmin, requireJeune, getOptionalUser
├── tokens.ts       # génération/vérification tokens feedback
├── cron.ts         # helpers cron
├── email/          # client Resend + templates
├── validation/     # schémas Zod
└── supabase/       # server.ts + client.ts

src/components/
├── ui/             # shadcn
├── forms/          # InscriptionForm, FeedbackForm, ProfilForm, DroitsImageForm
├── jeune/          # DashboardSections, UpcomingCard, PastCard, FeedList, PollWidget...
└── admin/          # KPIBar, PipelineBoard, InscritFiche360, UpdateEditor
```

## Crons Vercel
| Route | Déclencheur | Action |
|-------|-------------|--------|
| `/api/cron/j7` | J-7 avant immersion | Rappel + demande confirmation présence |
| `/api/cron/j2` | J-2 avant immersion | 2e rappel |
| `/api/cron/feedback` | J+1 après immersion | Envoi lien feedback aux `present` |
| `/api/cron/feedback-relance` | J+8 | Relance feedback si pas répondu |
| `/api/cron/droits-relance` | J+2 | Rappel signature droits image si non signé |

## Variables d'environnement requises (.env.local)
```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
CRON_SECRET=
FEEDBACK_TOKEN_SECRET=
NEXT_PUBLIC_APP_URL=
SEED_ADMIN_EMAIL=
```
