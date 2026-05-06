import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getKpis, getTaskProgress, getNextActions } from "@/lib/dashboard";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Visibilité" };

const SEED_EVENT_ID = "seed-event-cite-audacieuse";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "muted" | "outline" }> = {
  inscrit: { label: "Inscrite", variant: "muted" },
  contactee: { label: "Contactée", variant: "secondary" },
  confirmee_j7: { label: "Confirmée J-7", variant: "secondary" },
  confirmee_j2: { label: "Confirmée J-2", variant: "success" },
  presente: { label: "Présente", variant: "success" },
  absente: { label: "Absente", variant: "destructive" },
  desistement: { label: "Désistement", variant: "destructive" },
  feedback_recu: { label: "Feedback reçu", variant: "outline" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCountdown(eventDate: Date): { text: string; tone: "past" | "today" | "soon" | "warn" | "far" } {
  const now = new Date();
  const days = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { text: "Terminé", tone: "past" };
  if (days === 0) return { text: "aujourd'hui", tone: "today" };
  if (days <= 3) return { text: `J-${days}`, tone: "soon" };
  if (days <= 7) return { text: `J-${days}`, tone: "warn" };
  return { text: `J-${days}`, tone: "far" };
}

const PHASE_LABELS: Record<string, string> = {
  PREPARATION: "Préparation",
  WORKSHOP: "Atelier",
  POST_EVENT: "Post-événement",
};

const COUNTDOWN_TONE: Record<string, string> = {
  past: "text-stone-500",
  today: "text-emerald-700",
  soon: "text-red-700",
  warn: "text-amber-700",
  far: "text-stone-700",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [kpis, taskProgress, nextActions] = await Promise.all([
    getKpis(SEED_EVENT_ID),
    getTaskProgress(SEED_EVENT_ID),
    getNextActions(SEED_EVENT_ID),
  ]);

  const recentEnrollments = await prisma.enrollment.findMany({
    where: { immersionId: SEED_EVENT_ID },
    orderBy: { enrolledAt: "desc" },
    take: 5,
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  const countdown = getCountdown(kpis.eventDate);
  const fillPct = kpis.capacity > 0 ? Math.round((kpis.totalEnrolled / kpis.capacity) * 100) : 0;
  const confirmedPct = kpis.totalEnrolled > 0 ? Math.round((kpis.confirmed / kpis.totalEnrolled) * 100) : 0;
  const attendedPct = kpis.confirmed > 0 ? Math.round((kpis.attended / kpis.confirmed) * 100) : 0;
  const feedbackPct = kpis.attended > 0 ? Math.round((kpis.feedbackReceived / kpis.attended) * 100) : 0;

  return (
    <div className="space-y-12 max-w-3xl">
      {/* Event headline, prose, no banner */}
      <header className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${COUNTDOWN_TONE[countdown.tone]}`}>
          {countdown.text}
          {kpis.eventAddress ? ` · ${kpis.eventAddress}` : ""}
        </p>
        <h1 className="text-3xl font-bold leading-tight text-stone-900">
          {kpis.eventName || "Événement"}
        </h1>
        {kpis.eventDate.getTime() !== new Date(0).getTime() && (
          <p className="text-sm text-stone-500">{formatDate(kpis.eventDate)}</p>
        )}
      </header>

      {/* Stats as prose, not as tiles */}
      <section>
        <p className="text-base leading-relaxed text-stone-700 max-w-[68ch]">
          <strong className="font-semibold text-stone-900 tabular-nums">{kpis.totalEnrolled}</strong>{" "}
          inscrites sur {kpis.capacity} places ({fillPct}%).{" "}
          <strong className="font-semibold text-stone-900 tabular-nums">{kpis.confirmed}</strong>{" "}
          confirmées J-2 {kpis.totalEnrolled > 0 ? `(${confirmedPct}% des inscrites)` : ""}.{" "}
          <strong className="font-semibold text-stone-900 tabular-nums">{kpis.attended}</strong>{" "}
          présentes {kpis.confirmed > 0 ? `(${attendedPct}% des confirmées)` : ""}.{" "}
          <strong className="font-semibold text-stone-900 tabular-nums">{kpis.feedbackReceived}</strong>{" "}
          feedbacks {kpis.attended > 0 ? `(${feedbackPct}% des présentes)` : ""}.
        </p>
        {kpis.capacity > 0 && (
          <div className="mt-5 h-px w-full bg-stone-200 relative">
            <div
              className="absolute inset-y-0 left-0 -top-px h-[3px] bg-[var(--brand-orange)]"
              style={{ width: `${Math.min(100, fillPct)}%` }}
              aria-label={`Remplissage ${fillPct}%`}
            />
          </div>
        )}
      </section>

      {/* Task progress */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Avancement</h2>
        <dl className="space-y-3">
          {taskProgress.map(({ phase, total, done }) => {
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={phase} className="grid grid-cols-[8rem_1fr_auto] items-center gap-4">
                <dt className="text-sm text-stone-700">{PHASE_LABELS[phase]}</dt>
                <dd className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct === 100
                        ? "bg-emerald-500"
                        : pct >= 50
                        ? "bg-[var(--brand-orange)]"
                        : "bg-amber-300"
                    }`}
                    style={{ width: total === 0 ? "0%" : `${pct}%` }}
                  />
                </dd>
                <dd className="text-xs text-stone-500 tabular-nums w-16 text-right">
                  {done}/{total}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* Next actions */}
      {nextActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-stone-900">À faire</h2>
          <ul className="divide-y divide-stone-200 border-y border-stone-200">
            {nextActions.map((action, i) => (
              <li key={i}>
                <a
                  href={action.href}
                  className="flex items-center justify-between gap-4 py-3 group"
                >
                  <span
                    className={`text-sm ${
                      action.urgency === "high"
                        ? "text-red-700 font-medium"
                        : action.urgency === "medium"
                        ? "text-amber-800"
                        : "text-stone-700"
                    }`}
                  >
                    {action.label}
                  </span>
                  <span className="text-stone-400 group-hover:text-[var(--brand-orange)] group-hover:translate-x-0.5 transition-transform">
                    {"->"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent signups */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Dernières inscriptions</h2>
        {recentEnrollments.length === 0 ? (
          <p className="text-sm text-stone-500">Aucune inscription pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-stone-200 border-y border-stone-200">
            {recentEnrollments.map((enrollment) => {
              const statusInfo = STATUS_LABELS[enrollment.status] ?? {
                label: enrollment.status,
                variant: "muted" as const,
              };
              return (
                <li
                  key={enrollment.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {enrollment.user.firstName} {enrollment.user.lastName}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatShortDate(enrollment.enrolledAt)}
                    </p>
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
