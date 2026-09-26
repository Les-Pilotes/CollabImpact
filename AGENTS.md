<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Branching

- `main` = cible de déploiement Vercel. **Pas de push direct.** Tout passe par PR.
- `claude/v2-architecture-*` = changements de schema Prisma, rename de modèles, conventions d'architecture multi-event. PR vers `main` après revue.
- `claude/feature-*` ou `claude/fix-*` = implémentation de fonctionnalités (UI, server actions, endpoints). PR vers `main` après revue.

## Règles Prisma sur cette DB

La DB Supabase a été créée par `prisma db push` jusqu'à `prisma/migrations/0_init` (baseline générée depuis le schéma tel qu'il était en prod à ce moment-là — voir plus bas). **Depuis cette baseline, toute évolution de schéma passe par une vraie migration Prisma, plus de `db push`.** Les noms de tables existants sont en **PascalCase** : `"Immersion"`, `"Enrollment"`, `"User"`, `"Admin"`, `"Organisation"`, `"Task"`, `"Feedback"`. Les colonnes sont en **camelCase** : `"immersionId"`, `"organisationId"`, `"createdAt"`, etc.

- Tout `@@map` ou `@map` doit respecter le case exact des identifiants en DB (cf. `\d` dans psql). Une casse incorrecte produit `relation "..." does not exist` → 500 en runtime.
- Renommer un modèle Prisma (ex. `Immersion` → `Event`) **sans nouvelle colonne** : utiliser `@@map("Immersion")` pour pointer vers la table existante (aucune migration nécessaire si la table ne change pas).
- Renommer un champ qui est aussi une FK (ex. `immersionId` → `eventId`) **sans nouvelle colonne** : utiliser `@map("immersionId")` pour pointer vers la colonne existante.
- **Toute évolution qui change réellement la DB** (nouveau champ scalaire, nouveau modèle qui sera requêté en runtime, index, contrainte) : `pnpm db:migrate` en local (= `prisma migrate dev`, génère et applique le fichier de migration sur ta DB de dev) puis commit le dossier `prisma/migrations/<horodatage>_<nom>/` généré. **Pas de raccourci, pas de `db push` sur cette branche.**
- **Cible** (pas encore actif, voir « État actuel » ci-dessous) : le déploiement Vercel doit exécuter `prisma migrate deploy` (script `vercel-build` dans `package.json`) avant `next build`, pour que les migrations non appliquées en prod soient jouées automatiquement à chaque déploiement. `pnpm build` (utilisé par la CI) ne touche pas à la DB.

### Baseline `0_init`

`prisma/migrations/0_init/migration.sql` a été généré par `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` — un diff purement basé sur le fichier schéma, sans connexion DB. Il ne doit **jamais être exécuté tel quel sur la base de prod** (elle a déjà toutes ces tables) : il faut le marquer comme déjà appliqué, une seule fois, avec `prisma migrate resolve --applied 0_init` (nécessite `DATABASE_URL`/`DIRECT_URL` de prod dans `.env.local`, comme pour `db:push` précédemment). Après ce `resolve`, `prisma migrate deploy` ne rejoue plus 0_init et applique normalement les migrations suivantes.

### État actuel : `vercel-build` ne fait PAS encore `migrate deploy`

Tentative faite le 2026-09-26 : le build Vercel a échoué avec `P1001 Can't reach database server at db.gtvcbymbremngkeijkfd.supabase.co:5432`. Cause : `DIRECT_URL` (utilisée par Prisma pour les migrations) pointait vers la connexion directe Supabase, IPv6-only, injoignable depuis les machines de build Vercel (IPv4 only). `vercel-build` a donc été repassé temporairement à `prisma generate && next build` (identique à `build`) pour débloquer les déploiements.

**Pour réactiver `migrate deploy` dans `vercel-build`** :
1. Dans Supabase → Project Settings → Database → Connection string → onglet **Session pooler**, récupérer l'URL (même hôte que le pooler déjà utilisé pour `DATABASE_URL`, mais port **5432** au lieu de 6543).
2. Mettre à jour la variable d'env Vercel `DIRECT_URL` (Production **et** Preview) avec cette URL.
3. Remettre `"vercel-build": "prisma migrate deploy && prisma generate && next build"` dans `package.json`.
4. Redéployer et vérifier que le build passe.

Tant que ce n'est pas fait, **toute nouvelle migration doit être appliquée manuellement** en local avant/après le merge (`pnpm prisma migrate deploy` avec les creds prod dans `.env.local`), comme on le faisait avec `db:push` — sinon le code qui requête les nouvelles colonnes/tables plantera en prod.
