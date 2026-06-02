import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  Calendar,
  Users,
  CheckSquare,
  BarChart2,
  Eye,
  Settings,
  Bell,
  Clock,
} from "lucide-react";

export const metadata = { title: "Aide" };

export default async function AidePage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Guide d&apos;utilisation</h1>
        <p className="text-sm text-stone-500 mt-1">
          Une mini-doc pour comprendre comment l&apos;app est organisée et ce
          qu&apos;elle fait automatiquement pour toi.
        </p>
      </header>

      <Section title="Vue d'ensemble" icon={<Eye className="w-5 h-5" />}>
        <p>
          L&apos;admin tourne autour de <strong>trois espaces</strong> :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Événements</strong> — la liste de tous les workshops /
            immersions / ateliers. Tu crées, publies, suis chacun.
          </li>
          <li>
            <strong>À l&apos;intérieur d&apos;un événement</strong> — Aperçu,
            Participantes (kanban), Tâches, Impact, Émargement, Paramètres.
          </li>
          <li>
            <strong>Paramètres globaux</strong> — gestion des
            administrateur·rices et des templates d&apos;emails de
            l&apos;organisation.
          </li>
        </ul>
      </Section>

      <Section
        title="Cycle de vie d'un événement"
        icon={<Calendar className="w-5 h-5" />}
      >
        <p>Un événement passe par 5 états :</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
          {[
            { label: "Brouillon", desc: "Tu prépares" },
            { label: "Publié", desc: "Inscriptions ouvertes" },
            { label: "En cours", desc: "Jour J" },
            { label: "Finalisé", desc: "Émargé, feedbacks en cours" },
            { label: "Archivé", desc: "Hors tableau de bord" },
          ].map((s) => (
            <div key={s.label} className="rounded border border-stone-200 p-2.5">
              <p className="font-semibold text-stone-900">{s.label}</p>
              <p className="text-stone-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Parcours participant·e"
        icon={<Users className="w-5 h-5" />}
      >
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Clic sur le lien d&apos;inscription public (que tu copies depuis
            l&apos;Aperçu de l&apos;événement).
          </li>
          <li>
            Email connu ? La participante reçoit un lien magique pour reprendre.
            Sinon → formulaire en 3 étapes.
          </li>
          <li>
            J-7 et J-2 : emails automatiques de rappel avec boutons
            confirmer / décliner.
          </li>
          <li>Jour J : émargement depuis l&apos;onglet Participantes.</li>
          <li>
            Lendemain : email feedback automatique. Relance unique à J+3 si pas
            de réponse.
          </li>
        </ol>
      </Section>

      <Section
        title="Les outils par événement"
        icon={<CheckSquare className="w-5 h-5" />}
      >
        <ul className="space-y-2">
          {[
            ["Aperçu", "KPI, prochaines actions, lien d'inscription"],
            ["Participantes", "Kanban des statuts (inscrite → présente → feedback)"],
            ["Tâches", "Préparation / Workshop / Post-event"],
            ["Impact", "Feedbacks agrégés, ratings, verbatims"],
            ["Paramètres", "Capacité, lieu, configuration emails"],
          ].map(([name, desc]) => (
            <li key={name} className="flex gap-3">
              <strong className="text-stone-900 min-w-[110px]">{name}</strong>
              <span className="text-stone-600">{desc}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Notifications" icon={<Bell className="w-5 h-5" />}>
        <p>
          La cloche en haut à droite affiche les événements importants pour ton
          organisation entière (tous les admins voient les mêmes notifs) :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>nouvelle inscription,</li>
          <li>jalon de capacité atteint,</li>
          <li>changement de statut d&apos;un événement,</li>
          <li>nouveau feedback reçu.</li>
        </ul>
        <p>
          Chaque admin a son propre état lu / non-lu — pas de risque
          d&apos;écraser celui des autres.
        </p>
      </Section>

      <Section
        title="Tâches automatiques (crons)"
        icon={<Clock className="w-5 h-5" />}
      >
        <p>Tu n&apos;as rien à faire pour ces étapes — elles tournent seules :</p>
        <ul className="space-y-1.5">
          <li>
            <strong>08:00 UTC</strong> — Email J-7 aux inscrit·es de la semaine
          </li>
          <li>
            <strong>08:15 UTC</strong> — Email J-2 aux inscrit·es des prochains jours
          </li>
          <li>
            <strong>08:30 UTC</strong> — Email feedback aux participantes du
            jour précédent
          </li>
          <li>
            <strong>08:45 UTC</strong> — Relance feedback (J+3 sans réponse)
          </li>
          <li>
            <strong>09:00 UTC</strong> — Relance autorisation parentale (J+3 pour
            les mineur·es)
          </li>
        </ul>
      </Section>

      <Section title="FAQ" icon={<Settings className="w-5 h-5" />}>
        <Faq q="Comment ajouter un·e co-admin ?">
          <Link
            href="/admin/parametres/admins"
            className="text-orange-600 hover:underline"
          >
            Paramètres → Administrateurs
          </Link>
          . Saisis un email @les-pilotes.fr. La personne reçoit un mail
          d&apos;invitation et se connecte avec son compte Google.
        </Faq>
        <Faq q="Comment changer l'expéditeur des emails par événement ?">
          Onglet Paramètres de l&apos;événement → champ « Reply-to » et
          « Signature ».
        </Faq>
        <Faq q="Le lien magique des participantes expire en combien de temps ?">
          15 minutes. Il est lié à l&apos;événement courant donc on ne peut pas
          le réutiliser pour un autre.
        </Faq>
        <Faq q="Comment archiver un événement ?">
          Liste des événements → ouvrir l&apos;événement → bouton « Archiver »
          en haut à droite. Il quitte le dashboard mais reste consultable via
          l&apos;onglet « Archivés ».
        </Faq>
      </Section>

      <div className="rounded-lg border border-stone-200 p-5 bg-stone-50 text-sm text-stone-600">
        Tu veux revoir la visite de bienvenue ? Vide la clé
        <code className="mx-1 px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-xs">
          lp.onboarding.welcomeDismissed
        </code>
        dans le localStorage de ton navigateur et recharge la page. Idem pour
        réafficher la checklist avec
        <code className="mx-1 px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-xs">
          lp.onboarding.checklistHidden
        </code>
        .
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
        <span className="text-orange-600">{icon}</span>
        {title}
      </h2>
      <div className="text-sm text-stone-700 leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded border border-stone-200 p-3 group">
      <summary className="cursor-pointer font-medium text-stone-900 list-none flex items-center gap-2">
        <span className="text-orange-500 group-open:rotate-90 transition-transform">
          ›
        </span>
        {q}
      </summary>
      <div className="mt-2 pl-5 text-stone-600">{children}</div>
    </details>
  );
}
