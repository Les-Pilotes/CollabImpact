# Runbook — Mettre en production sur `admin.les-pilotes.fr`

Étapes à exécuter une seule fois, dans l'ordre. Le projet Vercel s'appelle
`collab-impact` (org `amadougayes-projects`).

## 1. Côté Vercel — ajouter le domaine

1. Vercel → projet `collab-impact` → **Settings → Domains**.
2. Bouton **Add Existing** (ou la barre « Search any domain ») → saisir
   `admin.les-pilotes.fr` → **Add**.
3. Choisir **Connect to an environment → Production**.
4. Vercel affiche alors l'enregistrement DNS à créer (un CNAME). Garder
   l'onglet ouvert et passer à l'étape 2.

## 2. Côté registrar / DNS de `les-pilotes.fr`

Là où sont gérés les DNS du domaine `les-pilotes.fr` (OVH, Gandi, Cloudflare,
Google Domains…), ajouter :

| Type  | Nom / Hôte | Valeur (cible)          | TTL   |
| ----- | ---------- | ----------------------- | ----- |
| CNAME | `admin`    | `cname.vercel-dns.com.` | 3600  |

> Le « Nom » est juste `admin` (le registrar ajoute `.les-pilotes.fr`
> automatiquement). Si ton interface exige un FQDN, mets
> `admin.les-pilotes.fr`. Ne pas oublier le point final sur la valeur si
> l'interface le demande.

Attendre la propagation (5-10 min en général, jusqu'à 24 h). Vercel détecte
automatiquement et émet le certificat TLS Let's Encrypt dans la foulée — le
badge passe à **Valid Configuration**.

## 3. Côté Vercel — variable d'environnement

Vercel → `collab-impact` → **Settings → Environment Variables**, ajouter en
**Production** :

| Clé       | Valeur                            |
| --------- | --------------------------------- |
| `APP_URL` | `https://admin.les-pilotes.fr`    |

→ Puis **Deployments → … (dernier build prod) → Redeploy** pour que
`getAppUrl()` reprenne la nouvelle valeur. Sans ce redeploy, les emails Resend
continueraient à pointer sur l'ancienne URL.

## 4. Côté Supabase — autoriser le redirect OAuth

Dashboard Supabase → **Authentication → URL Configuration** :

1. **Site URL** : `https://admin.les-pilotes.fr`
2. **Redirect URLs** → ajouter (conserver les existantes) :
   - `https://admin.les-pilotes.fr/auth/callback`
   - `http://localhost:3000/auth/callback` (dev local)

Sans cet ajout, le login Google casse en prod (Supabase refuse tout redirect
non listé).

## 5. Vérification

```bash
# DNS / TLS
curl -I https://admin.les-pilotes.fr/admin/login
# attendu : HTTP/2 200, certificat valide pour admin.les-pilotes.fr
```

- Ouvrir `https://admin.les-pilotes.fr/admin/login` → se connecter avec un
  compte Google `@les-pilotes.fr` → arriver sur `/admin/events`.
- Vérifier dans un email Resend reçu (ex. test d'inscription) que les liens
  CTA pointent sur `admin.les-pilotes.fr` et non sur l'URL `.vercel.app`.

## 6. Optionnel — rediriger l'ancien `.vercel.app`

Vercel → Domains → `collab-impact.vercel.app` → **Redirect to** →
`admin.les-pilotes.fr`. Les anciens liens basculent proprement vers le domaine
final.
