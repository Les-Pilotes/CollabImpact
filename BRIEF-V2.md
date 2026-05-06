# Brief V2 — Workshop 100% Féminin · Les Pilotes
> Document de référence pour la refonte V2. À lire intégralement avant toute modification.
> Rédigé après validation de la V1 et tests utilisateurs.

---

## 1. Contexte & état de la V1

### Ce qu'est la plateforme
Application web de gestion des éditions du Workshop 100% Féminin des Pilotes. Remplace un workflow Notion manuel. Deux interfaces distinctes sur le même backend : dashboard admin (Les Pilotes) et formulaire d'inscription public (participantes).

### Stack technique actuelle
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth magic link admin)
- Prisma 6 (ORM)
- Resend + React Email (emails — non branché en V1)
- Vercel Cron (non actif en V1)

### Ce qui est construit en V1
- Dashboard admin complet avec sidebar collapsible
- Page Participantes : 4 onglets (Listing / Suivi Kanban / Workshop / Post-Event)
  - Suivi Kanban : 3 colonnes (Confirmation J-7 / J-2 / Attendues Jour J)
  - Panel latéral slide-in avec historique et mode simulation
  - Multi-select + barre flottante d'actions groupées
  - Workshop : Groupes (drag & drop desktop, tap mobile) + Émargement 3 sections
- Page Tâches (kanban 3 phases)
- Page Impact (placeholder)
- Page Paramètres (à créer en V2)
- Formulaire d'inscription public : 2 flux (nouvelle / retour avec vérification date de naissance)
- 18 participantes seed réalistes avec statuts variés

### Ce qui est mocké en V1 (zéro logique réelle)
- Auth participantes (pas de compte, pas d'OTP)
- Envoi des emails (toasts uniquement)
- Soumission formulaire inscription (success screen fictif)
- Confirmations J-7 / J-2 (simulation boutons)
- Crons (routes existent, non déclenchées)
- Logique des groupes (hardcodé côté client)

### Hardcoding à éliminer en V2
- `const IMMERSION_ID = "seed-event-cite-audacieuse"` présent dans plusieurs fichiers
- `const EVENT_ID = "seed-event-cite-audacieuse"` dans taches/page.tsx et admin/page.tsx
- Intervenantes hardcodées dans KanbanBoard.tsx (`const INTERVENANTES = [...]`)
- Participants retour hardcodés dans inscription/page.tsx (`const RETURNING = {...}`)

---

## 2. Déploiement V1 (pré-V2, pour les tests utilisateurs)

### Checklist Vercel
1. Créer projet Supabase en prod (schema identique au dev)
2. Lancer `pnpm db:migrate` sur la base prod
3. Lancer `SEED_ADMIN_EMAIL="amadou@les-pilotes.fr" pnpm db:seed`
4. Variables d'environnement Vercel à configurer :
   ```
   DATABASE_URL
   DIRECT_URL
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   LES_PILOTES_ORG_ID
   RESEND_API_KEY
   CRON_SECRET
   FEEDBACK_TOKEN_SECRET
   APP_URL
   ```
5. Pusher le repo → Vercel détecte Next.js automatiquement
6. Vérifier que `/admin` redirige vers `/admin/login` si non connecté
7. Configurer un admin dans Supabase Auth pour les testeurs

### Protocole test utilisateur
- Donner accès à l'URL admin uniquement
- Observer sans intervenir pendant 15 minutes
- Questions post-test : qu'est-ce qui était confus ? qu'est-ce qui manquait ? qu'avez-vous cherché sans trouver ?
- Points à valider : navigation sidebar, Kanban, panel participante, Workshop groupes + émargement

---

## 3. Objectifs V2

V2 est une refonte **sans logique métier nouvelle**. Pas de vrais emails, pas d'auth réelle. L'objectif est de rendre la codebase prête pour V3 qui branchera la vraie logique sur une fondation propre.

**V2 = Architecture multi-événements + Design System 100% Féminin**

Ce que V2 ne fait PAS :
- Brancher les vrais emails
- Implémenter l'OTP (prévu en V3)
- Ajouter de la logique de matching IA
- Créer les comptes participantes

---

## 4. V2 Architecture — Multi-événements

### Problème actuel
Toute l'application tourne autour d'un seul événement hardcodé. La navigation admin n'a pas de notion d'événement sélectionné.

### Vision cible
Modèle billetterie : l'admin arrive sur une liste d'événements, sélectionne un événement, accède à toutes ses pages dans ce contexte.

```
/admin                          → liste de tous les événements
/admin/events/[eventId]         → overview d'un événement
/admin/events/[eventId]/participantes
/admin/events/[eventId]/taches
/admin/events/[eventId]/impact
/admin/events/[eventId]/workshop
```

### Changements routing à opérer

**Fichiers à créer :**
- `src/app/admin/events/page.tsx` — liste des événements (statuts : brouillon / préparation / en cours / terminé)
- `src/app/admin/events/new/page.tsx` — création d'un événement
- `src/app/admin/events/[eventId]/layout.tsx` — layout avec event context + nav
- `src/app/admin/events/[eventId]/page.tsx` — overview (reprend l'actuel admin/page.tsx)
- `src/app/admin/events/[eventId]/participantes/page.tsx` — reprend l'actuel
- `src/app/admin/events/[eventId]/taches/page.tsx`
- `src/app/admin/events/[eventId]/impact/page.tsx`

**Fichiers à supprimer / rediriger :**
- `src/app/admin/(protected)/participantes/` → migré vers events/[id]/participantes
- `src/app/admin/(protected)/taches/` → migré
- `src/app/admin/(protected)/impact/` → migré

**Sidebar :**
La sidebar passe d'une navigation globale à une navigation contextuelle. Deux niveaux :
- Niveau 1 (global) : logo + "Tous les événements" + Paramètres
- Niveau 2 (dans un événement) : Overview / Participantes / Tâches / Workshop / Impact

### Changements schema Prisma

Aucune modification du schéma existant nécessaire — les relations sont déjà correctes. Ce qui change :
- Renommer le modèle `Immersion` en `Event` dans le schéma (migration required)
- Renommer `ImmersionStatus` → `EventStatus`
- Supprimer l'enum `EventType.FEMININ` en faveur d'un champ `programType: String` plus flexible

**Migration à prévoir :**
```prisma
model Event {
  id             String      @id @default(cuid())
  organisationId String
  programType    String      // "workshop_feminin" | "immersion" | "bootcamp"
  name           String
  status         EventStatus
  ...
}
```

### Élimination du hardcoding

Créer un hook/context `useCurrentEvent()` qui lit l'`eventId` depuis les params URL et expose l'événement courant à tous les composants enfants. Remplace tous les `const EVENT_ID = "seed-event-..."`.

### Intervenantes — nouveau module

Actuellement hardcodées dans le code client. En V2, les intervenantes sont des entités en base :

```prisma
model Intervenante {
  id        String @id @default(cuid())
  eventId   String
  event     Event  @relation(...)
  firstName String
  lastName  String
  domain    String  // "Informatique", "Marketing", etc.
  jobTitle  String?
  company   String?
  bio       String?
  photoUrl  String?
  formToken String? @unique // token pour le lien formulaire
  createdAt DateTime @default(now())
}
```

**Nouveau formulaire intervenante** (`/intervenantes/[token]`) :
- Prénom, nom, intitulé de poste, entreprise, domaine, bio courte
- Upload photo (stocké Supabase Storage)
- Accessible via lien unique envoyé par l'admin

**Page admin intervenantes** (dans le contexte d'un événement) :
- Liste des intervenantes avec statut (formulaire rempli / en attente)
- Bouton "Générer lien" pour envoyer à une nouvelle intervenante
- Les groupes Workshop sont liés aux intervenantes en base, pas hardcodés

### Paramètres — nouvelle page

`/admin/settings` (global, pas lié à un événement)

Contenu V2 (UI uniquement, logique en V3) :
- Notifications : activer/désactiver emails automatiques (toggle + label "disponible en V3")
- Templates email : afficher les 5 templates avec preview (non éditables en V2)
- Organisation : nom, logo, couleurs du programme

---

## 5. V2 Design System — 100% Féminin

### Constat actuel
La V1 utilise le orange générique de l'association (`#F97316`) et une palette zinc/stone. Ce n'est pas l'identité visuelle du programme 100% Féminin qui a son propre dégradé distinctif.

### Identité visuelle du programme (extraite de la présentation officielle)

**Gradient signature :**
```
rose chaud → orange → jaune doré
#F7719A → #FF914D → #FFD100
```

**Couleurs à définir comme tokens :**
```css
/* Programme 100% Féminin */
--feminin-pink:    #F7719A;   /* rose chaud — couleur primaire programme */
--feminin-orange:  #FF914D;   /* orange — couleur Les Pilotes */
--feminin-yellow:  #FFD100;   /* jaune doré — accent chaleureux */
--feminin-gradient: linear-gradient(135deg, #F7719A 0%, #FF914D 50%, #FFD100 100%);

/* Neutres */
--neutral-900:  #111827;   /* texte principal */
--neutral-600:  #4B5563;   /* texte secondaire */
--neutral-100:  #F3F4F6;   /* fonds légers */
--neutral-50:   #F9FAFB;   /* fonds très légers */

/* Sémantiques */
--success:   #22C55E;
--warning:   #F59E0B;
--danger:    #EF4444;
--info:      #3B82F6;
```

**Teinte de fond du programme :** blanc avec une légère teinte rose `#FFF5F7` (visible sur les slides de contenu)

### Typographie

**Police à utiliser : Nunito** (disponible sur Google Fonts, déjà compatible avec le projet)
- Nunito est rounded, moderne, accessible — correspond au positionnement du programme
- Remplace DM Sans pour les pages publiques (formulaire inscription, future app participantes)
- DM Sans reste pour l'interface admin (plus neutre, professionnel)

```css
/* Public (participantes) */
font-family: 'Nunito', sans-serif;
font-weights: 400, 600, 700, 800 (ExtraBold pour les titres)

/* Admin */
font-family: 'DM Sans', sans-serif;  /* inchangé */
```

### Composants à mettre à jour

**Sidebar admin :**
- Le dégradé du programme peut apparaître sur l'icône active (au lieu du orange uni actuel)
- Le logo Les Pilotes reste tel quel

**PageHeader :**
- Ajouter la possibilité de passer une `variant` prop : `"default"` (zinc/orange actuel) ou `"feminin"` (dégradé rose→jaune)
- La page d'overview d'un événement 100% Féminin utilise la variant `"feminin"`

**Bouton primaire :**
- Variante `gradient` : `background: var(--feminin-gradient)` pour les CTAs importants
- Variante `default` : zinc-900 (actuel, pour l'admin)

**Formulaire d'inscription (public) :**
- Header avec dégradé signature (déjà fait approximativement, à affiner avec les vraies couleurs)
- Bouton "Continuer" → variante gradient
- Progress bar → gradient rose → orange → jaune

**Barre de navigation en bas de slides (style présentations) :**
- La thin bar rose→orange→jaune en bas des slides Canva peut inspirer un élément décoratif dans le header public

### Déroulé — module futur (noter pour V3+)

La présentation Canva contient un déroulé type (9h30 Accueil → 9h40 Formation des groupes → ... → 11h55 Networking). En V2 on note l'existence de ce besoin. En V3+ :
- L'admin crée le déroulé d'un événement dans la plateforme
- Le déroulé est exportable (PDF ou affichage projection)
- Il remplace le fichier Canva actuel

---

## 6. Checklist complète V2

### Architecture
- [ ] Créer routing `/admin/events/[eventId]/...`
- [ ] Créer page liste des événements avec statuts
- [ ] Créer page création d'événement
- [ ] Implémenter `useCurrentEvent()` context
- [ ] Supprimer tout `const EVENT_ID = "seed-event-..."` hardcodé
- [ ] Migrer schéma Prisma : `Immersion` → `Event`
- [ ] Créer modèle `Intervenante` en base
- [ ] Créer formulaire public intervenante `/intervenantes/[token]`
- [ ] Créer page admin intervenantes dans le contexte événement
- [ ] Créer page Paramètres `/admin/settings`
- [ ] Mettre à jour la sidebar pour navigation à deux niveaux
- [ ] Nettoyer le `NavLinks.tsx` (devenu redondant avec Sidebar.tsx)

### Design System
- [ ] Définir les tokens CSS dans `globals.css`
- [ ] Ajouter Nunito à `next/font` pour les pages publiques
- [ ] Mettre à jour `PageHeader` avec variant `feminin`
- [ ] Mettre à jour le bouton primaire avec variant `gradient`
- [ ] Appliquer les bonnes couleurs au formulaire d'inscription
- [ ] Appliquer la teinte fond `#FFF5F7` aux pages publiques
- [ ] Revoir le formulaire retour avec les nouvelles couleurs
- [ ] Créer un `DESIGN_SYSTEM.md` qui documente tous les tokens et composants

### Code quality (avant de passer à V3)
- [ ] Découper `KanbanBoard.tsx` (~900 lignes) en composants séparés :
  - `KanbanBoard.tsx` (conteneur, ~100 lignes)
  - `KanbanColumn.tsx`
  - `ParticipantCard.tsx`
  - `ParticipantPanel.tsx`
  - `WorkshopTab.tsx`
  - `ListingTab.tsx`
  - `types.ts` (tous les types partagés)
- [ ] Extraire les données hardcodées (intervenantes, profils retour) vers la DB
- [ ] Créer `src/lib/constants.ts` pour les valeurs constantes
- [ ] Ajouter des tests unitaires sur les fonctions utilitaires (`capitalizeName`, `archivedStage`, etc.)
- [ ] Documenter toutes les server actions dans `actions.ts`

---

## 7. Ce que V3 fera (out of scope V2, noter seulement)

- Auth OTP via téléphone (Supabase Phone Auth) pour les participantes
- Magic link actif pour les admins (déjà dans le schéma)
- Envoi réel des emails via Resend (5 templates existent)
- Crons Vercel actifs (J-7, J-2, feedback J+1)
- Confirmations self-service participantes (lien dans email → met à jour le statut)
- Formulaire inscription branché en base (crée vraiment User + Enrollment)
- Formulaire feedback branché
- App mobile Flutter connectée à la même API Supabase (OTP natif iOS/Android)
- Score de fiabilité calculé automatiquement

---

## 8. Références utiles

**Codebase :**
- Schéma DB complet : `prisma/schema.prisma`
- Seed actuel : `prisma/seed.ts` (18 participantes, 6 intervenantes hardcodées)
- Composant principal admin : `src/app/admin/(protected)/participantes/KanbanBoard.tsx`
- Formulaire inscription : `src/app/inscription/page.tsx`
- Layout admin : `src/app/admin/(protected)/layout.tsx`
- Sidebar : `src/app/admin/(protected)/Sidebar.tsx`

**Identité visuelle :**
- Logo Les Pilotes : `public/logo-pilotes.png`
- Présentation officielle Workshop 100% Féminin : PDF partagé (voir dossier uploads)
- Gradient signature : `linear-gradient(135deg, #F7719A 0%, #FF914D 50%, #FFD100 100%)`
- Police programme (public) : Nunito (Google Fonts)
- Police admin : DM Sans (déjà configurée)

**Contexte métier :**
- Document de référence complet : `BRIEF-V2.md` (ce fichier)
- Audit UX V1 : `AUDIT-ADMIN-UX.md`
- Plateforme Test (Notion) : page partagée avec l'intégration Notion "🤖 Agent"
