# Immersion App — Les Pilotes (V1)

Plateforme de gestion des immersions professionnelles pour l'association Les Pilotes.
Remplace le workflow Notion actuel par une app dédiée : app mobile-first pour les jeunes
(inscription + feedback) et dashboard web pour l'admin.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** v4
- **Supabase** (Postgres + Auth magic link)
- **Prisma** 6 (ORM, migrations)
- **Resend** + **React Email** (emails transactionnels)
- **Vercel Cron** (rappels J-7 / J-2 / feedback)
- **Zod** + **react-hook-form** (validation)

Pas de monorepo : une seule app Next.js avec routes publiques (`/inscription/...`, `/feedback/...`)
et routes admin protégées (`/admin/...`).

## Démarrage rapide

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (free tier).
2. Récupérer dans **Project Settings → Database** :
   - `DATABASE_URL` (Connection pooling, port 6543, avec `?pgbouncer=true&connection_limit=1`)
   - `DIRECT_URL` (Direct connection, port 5432)
3. Récupérer dans **Project Settings → API** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configurer Resend

1. Créer un compte sur [resend.com](https://resend.com) (free : 3000 emails/mois).
2. Vérifier un domaine (DNS) ou utiliser `onboarding@resend.dev` en dev.
3. Récupérer `RESEND_API_KEY`.

### 4. Remplir `.env.local`

Copier `.env.example` vers `.env.local` et remplir les vraies valeurs.
Générer deux secrets aléatoires pour `CRON_SECRET` et `FEEDBACK_TOKEN_SECRET` :

```bash
openssl rand -hex 32
```

### 5. Migrer la base + seed

```bash
pnpm db:push       # pousse le schéma vers Supabase (sans migration file, pratique en dev)
# ou
pnpm db:migrate    # crée une migration versionnée (recommandé dès qu'en équipe)

SEED_ADMIN_EMAIL="ton-email@lespilotes.fr" pnpm db:seed
```

Le seed affiche l'ID de l'organisation Les Pilotes — **le copier dans `.env.local`** sous
`LES_PILOTES_ORG_ID`.

### 6. Lancer en dev

```bash
pnpm dev
```

- Landing : http://localhost:3000
- Dashboard admin : http://localhost:3000/admin (TODO : formulaire magic link en V1)

### 7. Prévisualiser les emails

```bash
pnpm email:dev
```

Ouvre un dev server dédié avec les 5 templates React Email
(`InscriptionConfirm`, `J7Reminder`, `J2Reminder`, `FeedbackInvite`, `FeedbackRelance`).

## Scripts

| Commande | Action |
|---|---|
| `pnpm dev` | Dev server Next.js |
| `pnpm build` | Build production |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Régénère le client Prisma |
| `pnpm db:push` | Push le schéma vers la DB (sans migration file) |
| `pnpm db:migrate` | Crée / applique une migration Prisma |
| `pnpm db:studio` | Ouvre Prisma Studio (GUI DB) |
| `pnpm db:seed` | Seed initial (org + admin + immersion demo) |
| `pnpm email:dev` | Preview des templates React Email |

## Structure

```
src/
├── app/
│   ├── page.tsx                         # landing
│   ├── admin/
│   │   ├── login/page.tsx               # magic link (TODO)
│   │   └── page.tsx                     # dashboard pipeline (TODO)
│   └── api/cron/                        # 4 jobs Vercel Cron (skeletons)
├── lib/
│   ├── db.ts                            # singleton Prisma + helper currentOrgId()
│   ├── supabase/{server,client}.ts      # clients SSR + browser
│   ├── auth.ts                          # requireAdmin()
│   ├── cron.ts                          # assertCronRequest()
│   ├── tokens.ts                        # feedback tokens HMAC
│   ├── email/
│   │   ├── client.ts                    # wrapper Resend
│   │   └── templates/                   # 5 templates React Email + BaseLayout
│   └── validation/                      # schémas Zod
prisma/
├── schema.prisma                        # schéma complet (8 modèles, 9 enums)
└── seed.ts
vercel.json                              # 4 cron jobs
```

## Multi-tenant (futur)

Toutes les entités métier portent déjà `organisationId`. En V1, une seule orga (Les Pilotes),
référencée via `LES_PILOTES_ORG_ID` dans l'env. Quand le multi-tenant arrivera :

- Remplacer `currentOrgId()` (dans `src/lib/db.ts`) par une résolution depuis la session admin.
- Activer Row Level Security Postgres côté Supabase.
- Ajouter un middleware subdomain ou un sélecteur d'orga dans le dashboard admin.

## Déploiement Vercel

1. Pusher le repo sur GitHub.
2. Importer le projet sur [vercel.com](https://vercel.com) → connecter le repo.
3. Ajouter toutes les variables de `.env.example` dans **Project Settings → Environment Variables**.
4. Vercel détecte `vercel.json` et active les 4 cron jobs automatiquement.
5. Premier déploiement → `prisma migrate deploy` via un post-deploy hook (ou manuel).

## Ce qui reste à construire (next PR)

- Formulaire d'inscription multi-étapes `/inscription/[immersionId]` (3 couches, RHF + Zod)
- Endpoint `/api/utilisateurs/check` (préfill Couche 1+2 par email)
- Endpoint `/api/inscriptions` (upsert User + ProfileSnapshot + Enrollment + mail)
- Formulaire de feedback tokenisé `/feedback/[token]`
- Login admin magic link fonctionnel
- Pipeline Kanban admin (4 colonnes)
- Vue Jour J + export PDF
- Fiche inscrit (détail + édition manuelle)
- CRUD immersions
- Logique réelle des 4 cron jobs

## Hors scope V1

- Auth jeune (compte / mot de passe)
- Espace entreprise
- Multi-organisation actif
- Algorithme de matching
- Notifications push natives
- Gamification / badges
