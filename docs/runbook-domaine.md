# Runbook — Mettre en production sur `workshop.les-pilotes.fr`

Étapes à exécuter une seule fois, dans l'ordre.

## 1. Côté Vercel

1. Vercel project → **Settings → Domains** → **Add** → saisir `workshop.les-pilotes.fr`.
2. Vercel propose un enregistrement DNS (CNAME). Ne pas valider avant l'étape 2.

## 2. Côté registrar `les-pilotes.fr`

Ajouter l'enregistrement DNS :

| Type  | Hôte       | Valeur                 | TTL   |
| ----- | ---------- | ---------------------- | ----- |
| CNAME | `workshop` | `cname.vercel-dns.com.`| 3600  |

Attendre la propagation (généralement 5-10 min, jusqu'à 24 h). Vercel détecte
automatiquement et émet le certificat TLS Let's Encrypt dans la foulée.

## 3. Côté Vercel — variables d'env

Vercel project → **Settings → Environment Variables**, ajouter en **Production** :

| Clé       | Valeur                                |
| --------- | ------------------------------------- |
| `APP_URL` | `https://workshop.les-pilotes.fr`     |

→ **Redeploy** la prod (Deployments → … → Redeploy) pour que `getAppUrl()`
reprenne la nouvelle valeur (les emails Resend mentionneront ce domaine).

## 4. Côté Supabase

Dashboard Supabase → **Authentication → URL Configuration** :

1. **Site URL** : `https://workshop.les-pilotes.fr`
2. **Redirect URLs** → ajouter (conserver les autres) :
   - `https://workshop.les-pilotes.fr/auth/callback`
   - `http://localhost:3000/auth/callback` (pour le dev local)

Sans ces ajouts, le login admin Google se casse en prod (Supabase refuse le
redirect non listé).

## 5. Vérification

```bash
# DNS / TLS
curl -I https://workshop.les-pilotes.fr/admin/login
# attendu : HTTP/2 200, cert valide pour workshop.les-pilotes.fr
```

- Aller sur `https://workshop.les-pilotes.fr/admin/login` → se connecter avec
  Google `@les-pilotes.fr` → arriver sur `/admin/events`.
- Vérifier dans un email Resend reçu (test inscription d'un participant) que
  les liens CTA pointent bien sur `workshop.les-pilotes.fr` et non sur l'URL
  `.vercel.app`.

## 6. Optionnel — redirect du domaine `.vercel.app`

Vercel project → Domains → trouver l'ancien alias `.vercel.app` → cocher
**Redirect to** `workshop.les-pilotes.fr`. Ainsi les anciens liens partagés
basculent sur la marque sans casser.
