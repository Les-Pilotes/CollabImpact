# Audit UX Admin — CollabImpact V1
> Analyse complète · Mai 2026

---

## Ce qui existe et ce qui est bien

La base est solide. En 5 écrans, le code couvre l'essentiel :

- **Dashboard** avec KPIs (inscrites, confirmées J-2, présentes, feedbacks), progression des tâches par phase, actions recommandées contextuelles, et flux des dernières inscriptions.
- **Liste participantes** avec filtres par statut (8 onglets), tableau complet, et lien vers la fiche.
- **Fiche participante** avec infos perso, changement de statut, envoi de relances manuelles, émargement Jour J.
- **Émargement** : vue mobile-optimisée triée alphabétiquement, uniquement les confirmées J-2.
- **Tâches** : Kanban 3 colonnes (Préparation / Atelier / Post-événement).

Le design system est cohérent (zinc/orange), les badges couleur sont bien différenciés, la hiérarchie visuelle est propre.

---

## Les vrais problèmes (ce qui bloque une équipe réelle)

### 1. Tout est hardcodé sur un seul événement

Chaque page charge `IMMERSION_ID = 'seed-event-cite-audacieuse'` en dur. Pour passer à un deuxième workshop, il faut modifier le code. C'est le blocker n°1 — une association qui gère plusieurs events par an ne peut pas utiliser l'app en l'état.

### 2. Chaque action nécessite une navigation complète

Pour changer le statut d'une participante, il faut : cliquer "Voir" → charger la page détail → scroller jusqu'aux actions → changer le statut → revenir à la liste. Sur 30 participantes, c'est 30 × 4 clics minimum. Un admin passe sa journée à naviguer au lieu de travailler.

### 3. Aucune action groupée

Il n'y a aucun moyen de sélectionner plusieurs participantes et de les passer à un statut d'un coup. Si 15 personnes répondent "oui" suite à la relance J-7, il faut les confirmer une par une.

### 4. L'historique de contact est invisible

Les champs `j7SentAt`, `j2SentAt`, `feedbackSentAt` existent dans le schéma mais ne sont affichés nulle part dans la liste. L'admin ne peut pas voir en un coup d'œil "à qui j'ai déjà envoyé quelque chose".

### 5. Le funnel de conversion est aveugle

Le dashboard montre 4 KPIs isolés mais pas le flux. On ne voit pas combien de personnes sont passées de "Inscrite" à "Contactée" à "Confirmée". C'est pourtant la métrique clé pour savoir si les relances fonctionnent.

### 6. Le score de fiabilité n'est jamais utilisé

`reliabilityScore` est dans le schéma mais jamais affiché. Pour une asso qui gère les no-shows, c'est une donnée précieuse qu'on ignore complètement.

### 7. La terminologie ne correspond pas au workflow réel

Le workflow Notion parle de "Contacté → Suivi → Confirmé". L'app parle de "Contactée → Confirmée J-7 → Confirmée J-2". La distinction J-7/J-2 est utile pour les crons mais elle ne correspond pas à la façon dont l'équipe pense son suivi. Il faut réconcilier les deux.

### 8. Mode émargement insuffisant pour le Jour J

L'émargement actuel est une liste alphabétique statique. Il n'y a pas de compteur en temps réel ("18/25 présentes"), pas de recherche par nom rapide, pas de feedback visuel immédiat au tap. Sur le terrain avec 30 personnes qui arrivent en même temps, c'est trop lent.

---

## Ce que font les meilleures plateformes (et comment l'appliquer)

### Luma / Attio / Linear — la leçon clé

Le niveau premium ne vient pas de l'ajout de fonctionnalités mais de la **réduction des frictions**. Attio affiche 500 contacts en une seule vue, avec toutes les actions accessibles sans navigation. Linear permet de changer le statut d'une issue en 1 clic depuis n'importe quelle vue. Luma gère l'émargement avec un compteur live et une barre de recherche comme unique UI.

**Pour CollabImpact, ça se traduit par :**

---

## Recommandations prioritaires (classées par impact/effort)

### Priorité 1 — Sélecteur d'événement dans la navigation *(effort : 2h, impact : débloquant)*

Un dropdown dans le layout `/admin/(protected)/layout.tsx` qui liste tous les events. L'event sélectionné est passé via l'URL ou le contexte. Toutes les pages lisent `eventId` depuis là au lieu du constant hardcodé.

Sans ça, rien d'autre ne vaut vraiment la peine.

---

### Priorité 2 — Panel latéral sur la liste participantes *(effort : 4h, impact : très élevé)*

Au lieu de naviguer vers `/admin/participants/[id]`, un clic sur une ligne ouvre un **panneau coulissant depuis la droite** (style Attio/Linear). Le panneau contient :
- En-tête : nom + badge statut + score fiabilité
- Infos de contact cliquables (email → `mailto:`, tel → `tel:`)
- Sélecteur de statut inline
- Historique de contact : "Inscrite le 26/03 · Relance J-7 envoyée le 11/04 · Confirmée le 14/04"
- Boutons d'action contextuels (selon le statut actuel)

La page détail reste accessible pour les cas avancés, mais le panneau couvre 90% des besoins.

---

### Priorité 3 — Actions groupées (bulk) *(effort : 3h, impact : très élevé)*

Ajouter des cases à cocher sur chaque ligne. Quand au moins une ligne est sélectionnée, une **barre d'action flotte en bas de l'écran** :

```
[✓ 8 sélectionnées]  [Changer statut ▾]  [Envoyer relance]  [Exporter]  [×]
```

Les actions disponibles s'adaptent à la sélection (ex : "Envoyer relance" masqué si une présente est sélectionnée). C'est ce qui permet de confirmer 15 personnes en 10 secondes au lieu de 15 minutes.

---

### Priorité 4 — Funnel de conversion sur le dashboard *(effort : 2h, impact : élevé)*

Remplacer (ou compléter) les 4 KPI cards par un funnel visuel horizontal :

```
Inscrites    Contactées   Conf. J-7    Conf. J-2    Présentes
   30    →      25    →     18     →     14     →      12
         -17%        -28%        -22%        -14%
```

Chaque étape est cliquable et filtre la liste. Les taux de chute indiquent immédiatement où ça bloque.

---

### Priorité 5 — Mode Live Jour J *(effort : 3h, impact : élevé sur le terrain)*

Refonte de la page émargement :
- **Compteur live** en haut et fixe : `14 / 25 présentes · 3 absentes · 8 à venir`
- **Barre de recherche** autofocusée à l'ouverture (tape "Sar" → "Sarah Martin" apparaît)
- **Tap pour émarger** : un seul tap sur le nom → passe en "Présente" avec animation verte
- **Swipe gauche** → marquer absente (pattern iOS standard)
- **Badge de statut actuel** visible sur chaque ligne (pour distinguer confirmée J-2 / inscrite)

---

### Priorité 6 — Colonne "Dernière action" dans la liste *(effort : 1h, impact : moyen)*

Ajouter une colonne simple dans le tableau : "Dernière action" qui affiche la date la plus récente parmi `j7SentAt`, `j2SentAt`, `feedbackSentAt`, `enrolledAt`. Ça permet à l'admin de trier par "à qui je n'ai pas parlé depuis longtemps" sans aller dans chaque fiche.

---

### Priorité 7 — Score de fiabilité visible *(effort : 30min, impact : moyen)*

Afficher `reliabilityScore` sous forme d'indicateur discret sur la fiche et la liste (ex : icône étoile colorée, ou texte "⚠️ 2 no-shows passés"). Rien de stigmatisant, juste informatif pour l'admin.

---

### Priorité 8 — Analytique feedback agrégée *(effort : 2h, impact : moyen)*

Sur le dashboard ou une page dédiée, après l'événement :
- Note moyenne globale (overallRating) et organisation (orgRating) avec étoiles
- % de participantes dont la vision a changé (`changedVision`)
- Liste des verbatims dans un accordéon scrollable
- Export CSV des feedbacks

---

## Ce qui peut rester simulé en V1

Ces éléments peuvent être mockés (données fake ou Server Actions qui ne font rien) pour valider l'UX sans implémenter la logique :

- Envoi réel des emails (les boutons existent, les actions server aussi — juste pas de Resend connecté)
- Crons J-7/J-2/feedback (les routes existent, la logique est à compléter)
- Login magic link (peut rester sur un bypass dev)
- Formulaire d'inscription participante
- CRUD immersions (un seul event suffit pour valider l'admin)

---

## Réconciliation statuts Notion vs App

| Notion (workflow équipe) | App (EnrollmentStatus) | Note |
|---|---|---|
| Inscrit | `inscrit` | ✅ aligné |
| Contacté | `contactee` | ✅ ok, renommer label en "Contactée" |
| Suivi | — | ❌ manquant — à fusionner avec `contactee` ou créer |
| Confirmé | `confirmee_j7` + `confirmee_j2` | ⚠️ trop granulaire pour l'équipe |
| Présent | `presente` | ✅ aligné |
| Absent Jour J | `absente` | ✅ aligné |
| Désistement en amont | `desistement` | ✅ aligné |
| Feedback à faire | — | ❌ manquant — état intermédiaire post-event |
| Suivi terminé | `feedback_recu` | ⚠️ à renommer "Suivi terminé" dans l'UI |

**Recommandation :** ne pas toucher au schéma (les enums sont bons), mais adapter les **labels d'affichage** dans l'UI pour correspondre au vocabulaire de l'équipe. `confirmee_j7` → "Confirmée" dans l'UI suffit pour la V1.

---

## Résumé exécutif

La fondation technique est excellente — schéma propre, stack moderne, code lisible. Ce qui manque c'est exclusivement de l'UX : trop de navigation, pas d'actions groupées, funnel invisible. Les 4 premières priorités ci-dessus transforment l'outil en quelque chose qu'une admin peut utiliser seule, sans formation, en moins de 10 minutes par jour. Total estimé : **12-16h de développement** pour passer de l'état actuel à un outil au niveau d'une startup licorne.
