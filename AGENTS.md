<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Branching

- `main` = cible de déploiement Vercel. **Pas de push direct.** Tout passe par PR.
- `claude/v2-architecture-*` = changements de schema Prisma, rename de modèles, conventions d'architecture multi-event. PR vers `main` après revue.
- `claude/feature-*` ou `claude/fix-*` = implémentation de fonctionnalités (UI, server actions, endpoints). PR vers `main` après revue.

## Règles Prisma sur cette DB

La DB Supabase actuelle a été créée par `prisma db push` initial avec les noms de modèles d'origine. Les noms de tables existants sont en **PascalCase** : `"Immersion"`, `"Enrollment"`, `"User"`, `"Admin"`, `"Organisation"`, `"Task"`, `"Feedback"`. Les colonnes sont en **camelCase** : `"immersionId"`, `"organisationId"`, `"createdAt"`, etc.

- Tout `@@map` ou `@map` doit respecter le case exact des identifiants en DB (cf. `\d` dans psql). Une casse incorrecte produit `relation "..." does not exist` → 500 en runtime.
- Renommer un modèle Prisma (ex. `Immersion` → `Event`) **sans migration** : utiliser `@@map("Immersion")` pour pointer vers la table existante.
- Renommer un champ qui est aussi une FK (ex. `immersionId` → `eventId`) **sans migration** : utiliser `@map("immersionId")` pour pointer vers la colonne existante.
- Ajouter un champ scalaire sur un modèle existant : nécessite `pnpm db:migrate` (= `prisma migrate dev`) en local puis `prisma migrate deploy` côté pipeline Vercel. **Pas de raccourci.**
- Ajouter un modèle entièrement nouveau (nouvelle table) sans migration : OK tant que **personne ne le requête en runtime**. Sinon → 500.
