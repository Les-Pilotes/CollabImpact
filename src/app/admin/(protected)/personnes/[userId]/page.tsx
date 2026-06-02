import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { getPersonDetail, type PersonDetail } from "@/lib/people/queries";

export const metadata = { title: "Personne" };

const ENROLLMENT_STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "muted" | "outline" }
> = {
  inscrit: { label: "Inscrite", variant: "secondary" },
  contactee: { label: "Contactée", variant: "secondary" },
  confirmee_j7: { label: "Confirmée J-7", variant: "secondary" },
  confirmee_j2: { label: "Confirmée J-2", variant: "warning" },
  presente: { label: "Présente", variant: "success" },
  absente: { label: "Absente", variant: "destructive" },
  desistement: { label: "Désistement", variant: "muted" },
  feedback_recu: { label: "Feedback reçu", variant: "success" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function age(birthDate: Date): number {
  const diff = Date.now() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { admin } = await requireAdmin();
  const { userId } = await params;
  const person = await getPersonDetail(userId, admin.organisationId);
  if (!person) notFound();

  const enrollments = person.enrollments;
  const presenceCount = enrollments.filter((e) => e.status === "presente").length;
  const feedbackCount = enrollments.filter((e) => e.feedback !== null).length;
  const noShowCount = enrollments.filter((e) => e.status === "absente").length;

  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/admin/personnes"
        className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Carnet
      </Link>

      {/* Identity card */}
      <header className="flex items-start gap-5">
        <div
          className="shrink-0 w-16 h-16 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xl font-semibold"
          aria-hidden
        >
          {(person.firstName[0] ?? "") + (person.lastName[0] ?? "")}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-stone-900">
            {person.firstName} {person.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 mt-1">
            <ContactLine icon={<Mail className="w-3.5 h-3.5" />}>
              <a href={`mailto:${person.email}`} className="hover:text-stone-900">
                {person.email}
              </a>
            </ContactLine>
            {person.phone && (
              <ContactLine icon={<Phone className="w-3.5 h-3.5" />}>
                <a href={`tel:${person.phone}`} className="hover:text-stone-900">
                  {person.phone}
                </a>
              </ContactLine>
            )}
            {person.city && (
              <ContactLine icon={<MapPin className="w-3.5 h-3.5" />}>
                {person.city}
              </ContactLine>
            )}
            {person.birthDate && (
              <ContactLine icon={<Calendar className="w-3.5 h-3.5" />}>
                {age(person.birthDate)} ans
              </ContactLine>
            )}
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Événements"
          value={enrollments.length}
          icon={<Calendar className="w-4 h-4" />}
        />
        <Stat
          label="Présences"
          value={presenceCount}
          icon={<CheckCircle2 className="w-4 h-4" />}
          tone="emerald"
        />
        <Stat
          label="Absences"
          value={noShowCount}
          icon={<XCircle className="w-4 h-4" />}
          tone="red"
        />
        <Stat
          label="Feedbacks"
          value={feedbackCount}
          icon={<Star className="w-4 h-4" />}
          tone="amber"
        />
      </div>

      {/* Profile sections */}
      <Section title="Profil d'orientation">
        <DefinitionList>
          <Definition label="Niveau scolaire">
            {person.niveauScolaire ?? "—"}
            {person.niveauScolaireAutre ? ` (${person.niveauScolaireAutre})` : ""}
          </Definition>
          <Definition label="Établissement">
            {person.etablissement ?? "—"}
          </Definition>
          <Definition label="Région">{person.region ?? "—"}</Definition>
          <Definition label="Projet pro">{person.projetPro ?? "—"}</Definition>
          <Definition label="Motivations">
            {person.motivation.length > 0
              ? person.motivation.join(" · ")
              : "—"}
          </Definition>
          {person.motivationDetail && (
            <Definition label="Détail" span={2}>
              {person.motivationDetail}
            </Definition>
          )}
          <Definition label="Comment connu">
            {person.commentConnu ?? "—"}
          </Definition>
          <Definition label="Profil mis à jour">
            {person.orientationUpdatedAt
              ? formatDate(person.orientationUpdatedAt)
              : "—"}
          </Definition>
        </DefinitionList>
      </Section>

      <Section title="Identité">
        <DefinitionList>
          <Definition label="Genre">{person.gender ?? "—"}</Definition>
          <Definition label="Date de naissance">
            {person.birthDate ? formatDate(person.birthDate) : "—"}
          </Definition>
          <Definition label="Source">{person.source ?? "—"}</Definition>
          <Definition label="Inscription créée">
            {formatDate(person.createdAt)}
          </Definition>
          <Definition label="Score fiabilité">
            <span className="tabular-nums">{person.reliabilityScore}</span>
          </Definition>
          <Definition label="Email vérifié">
            {person.emailVerified ? "Oui" : "Non"}
          </Definition>
        </DefinitionList>
      </Section>

      {/* Event history */}
      <Section title={`Historique (${enrollments.length})`}>
        {enrollments.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun événement enregistré.</p>
        ) : (
          <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
            {enrollments.map((e) => (
              <EnrollmentRow key={e.id} enrollment={e} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function EnrollmentRow({
  enrollment: e,
}: {
  enrollment: PersonDetail["enrollments"][number];
}) {
  const statusInfo = ENROLLMENT_STATUS_LABELS[e.status] ?? {
    label: e.status,
    variant: "muted" as const,
  };

  return (
    <Link
      href={`/admin/events/${e.event.id}`}
      className="block px-5 py-4 hover:bg-stone-50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900 group-hover:text-orange-600 transition-colors truncate">
            {e.event.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 mt-0.5">
            <span>{formatShortDate(e.event.date)}</span>
            <span className="truncate">{e.event.address}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {e.feedback && (
            <span
              className="inline-flex items-center gap-1 text-xs text-amber-700"
              title={`Note globale ${e.feedback.overallRating}/5`}
            >
              <Star className="w-3 h-3 fill-current" />
              {e.feedback.overallRating}/5
            </span>
          )}
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>
      {e.internalNote && (
        <p className="mt-2 text-xs text-stone-500 italic">
          Note interne : {e.internalNote}
        </p>
      )}
    </Link>
  );
}

function ContactLine({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-stone-400">{icon}</span>
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm uppercase tracking-wider text-stone-500 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DefinitionList({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm bg-white border border-stone-200 rounded-lg p-5">
      {children}
    </dl>
  );
}

function Definition({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="text-stone-900 mt-0.5">{children}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "stone",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "stone" | "emerald" | "red" | "amber";
}) {
  const tones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tones[tone]}`} aria-hidden>
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold tabular-nums text-stone-900 leading-none">
          {value}
        </p>
        <p className="text-xs text-stone-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
