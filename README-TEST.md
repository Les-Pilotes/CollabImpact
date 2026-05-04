# Guide de test — CollabImpact MVP

## Prérequis

- `pnpm dev` lancé sur :3000
- `pnpm db:seed` exécuté (1 événement + 10 tâches en DB)
- Naviguer vers `/admin/dev` (accessible car `ENABLE_DEV_PAGE=true` dans `.env.local`)
- Se connecter avec `admin@lespilotes.fr` (magic link ou session Supabase locale)

---

## Scénario en 8 étapes

### Étape 1 — 🌱 Seeder des participantes

**But** : Peupler la base avec 20 fausses participantes ayant des statuts variés.

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 1 de `/admin/dev`
- **Résultat attendu** : `{ "ok": true, "created": 20 }`
- Les statuts sont distribués : 30 % inscrit, 20 % contactée, 15 % confirmée J-7, 15 % confirmée J-2, 10 % présente, 5 % absente, 5 % feedback reçu

---

### Étape 2 — ⏱ Voyager à J-7

**But** : Décaler la date de l'événement à aujourd'hui + 7 jours pour simuler la fenêtre J-7.

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 2
- **Résultat attendu** : `{ "ok": true, "newDate": "2026-05-11T..." }`

---

### Étape 3 — ▶️ Lancer le cron J-7

**But** : Déclencher l'envoi des emails de rappel J-7.

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 3
- **Via curl** :
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/j7
  ```
- **Résultat attendu** : `{ "ok": true, "sent": N }` — les enrollments `inscrit` / `contactee` passent à `confirmee_j7`

---

### Étape 4 — ⏱ Voyager à J-2

**But** : Décaler la date à aujourd'hui + 2 jours pour simuler la fenêtre J-2.

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 4
- **Résultat attendu** : `{ "ok": true, "newDate": "2026-05-06T..." }`

---

### Étape 5 — ▶️ Lancer le cron J-2

**But** : Déclencher l'envoi des emails de confirmation J-2.

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 5
- **Via curl** :
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/j2
  ```
- **Résultat attendu** : `{ "ok": true, "sent": N }` — les enrollments `confirmee_j7` passent à `confirmee_j2`

---

### Étape 6 — ✅ Marquer présentes/absentes

**But** : Simuler l'émargement du Jour J (12 présentes, 3 absentes).

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 6
- **Résultat attendu** : `{ "ok": true, "presente": 12, "absente": 3 }`
- Vérifier dans `/admin/participants` que les statuts ont changé

---

### Étape 7 — ▶️ Lancer le cron Feedback

**But** : Envoyer les emails de demande de feedback aux présentes.

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 7
- **Via curl** :
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/feedback
  ```
- **Résultat attendu** : `{ "ok": true, "sent": N }` — `feedbackToken` et `feedbackSentAt` renseignés

---

### Étape 8 — 📝 Soumettre 8 feedbacks

**But** : Générer 8 faux feedbacks pour valider les KPIs du dashboard.

- **Via l'UI** : Cliquer sur **"Faire maintenant"** dans l'étape 8
- **Résultat attendu** : `{ "ok": true, "submitted": 8 }`
- Vérifier dans `/admin` que le compteur "Feedbacks reçus" affiche 8

---

## Vérifications finales

Après les 8 étapes, naviguer vers :

| Page | Ce qu'on vérifie |
|------|-----------------|
| `/admin` | KPIs : 20 inscrites, 12 présentes, 8 feedbacks |
| `/admin/participants` | Statuts corrects pour chaque participante |
| `/admin/taches` | Tâches avec leur statut (non modifiées par ce scénario) |

## Reset

Pour recommencer à zéro, cliquer sur **"🧹 Tout réinitialiser"** en haut de `/admin/dev` (ou utiliser le bouton "Reset" dans les actions rapides). Cela supprime toutes les inscriptions et participantes fictives, et remet les tâches à leur état initial.
