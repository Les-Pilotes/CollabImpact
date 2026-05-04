import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getKpis, getTaskProgress, getNextActions } from "@/lib/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Dashboard Admin — Visibilité" };

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

function getCountdown(eventDate: Date): { text: string; color: string } {
  const now = new Date();
  const days = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { text: "Terminé", color: "text-zinc-500" };
  if (days === 0) return { text: "En cours aujourd'hui", color: "text-emerald-600 font-semibold" };
  if (days <= 3) return { text: `dans ${days} jour${days > 1 ? "s" : ""}`, color: "text-red-600 font-semibold" };
  if (days <= 7) return { text: `dans ${days} jours`, color: "text-amber-600 font-semibold" };
  return { text: `dans ${days} jours`, color: "text-zinc-600" };
}

const PHASE_LABELS: Record<string, string> = {
  PREPARATION: "Préparation",
  WORKSHOP: "Atelier",
  POST_EVENT: "Post-événement",
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

  return (
    <div className="space-y-6">
      {/* Event banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[var(--brand-orange)] to-amber-400 p-6 text-white shadow">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">
              {kpis.eventName || "Événement"}
            </h1>
            {kpis.eventDate.getTime() !== new Date(0).getTime() && (
              <p className="mt-1 text-sm opacity-90">{formatDate(kpis.eventDate)}</p>
            )}
            {kpis.eventAddress && (
              <p className="text-sm opacity-80">{kpis.eventAddress}</p>
            )}
          </div>
          <span className={`mt-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold sm:mt-0 ${countdown.color.replace("text-", "text-white")}`}>
            {countdown.text}
          </span>
        </div>
      </div>

      {/* KPI stat cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Participation
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-500 font-medium">Inscrites</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-zinc-900">{kpis.totalEnrolled}</p>
              <p className="mt-1 text-xs text-zinc-400">capacité : {kpis.capacity}</p>
              {kpis.capacity > 0 && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100">
                  <div
                    className="h-1.5 rounded-full bg-[var(--brand-orange)]"
                    style={{ width: `${Math.min(100, (kpis.totalEnrolled / kpis.capacity) * 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-500 font-medium">Confirmées J-2</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-zinc-900">{kpis.confirmed}</p>
              {kpis.totalEnrolled > 0 && (
                <p className="mt-1 text-xs text-zinc-400">
                  {Math.round((kpis.confirmed / kpis.totalEnrolled) * 100)}% des inscrites
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-500 font-medium">Présentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-zinc-900">{kpis.attended}</p>
              {kpis.confirmed > 0 && (
                <p className="mt-1 text-xs text-zinc-400">
                  {Math.round((kpis.attended / kpis.confirmed) * 100)}% des confirmées
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-500 font-medium">Feedbacks reçus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold text-zinc-900">{kpis.feedbackReceived}</p>
              {kpis.attended > 0 && (
                <p className="mt-1 text-xs text-zinc-400">
                  {Math.round((kpis.feedbackReceived / kpis.attended) * 100)}% des présentes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task progress */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Avancement des tâches
        </h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {taskProgress.map(({ phase, total, done }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={phase}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-700">
                      {PHASE_LABELS[phase]}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {done}/{total} {total > 0 ? `(${pct}%)` : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        pct === 100
                          ? "bg-emerald-500"
                          : pct >= 50
                          ? "bg-[var(--brand-orange)]"
                          : "bg-amber-300"
                      }`}
                      style={{ width: total === 0 ? "0%" : `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Next actions */}
      {nextActions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Actions recommandées
          </h2>
          <div className="space-y-2">
            {nextActions.map((action, i) => (
              <a
                key={i}
                href={action.href}
                className={`flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-zinc-50 ${
                  action.urgency === "high"
                    ? "border-red-200 bg-red-50"
                    : action.urgency === "medium"
                    ? "border-amber-200 bg-amber-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    action.urgency === "high"
                      ? "text-red-700"
                      : action.urgency === "medium"
                      ? "text-amber-700"
                      : "text-zinc-700"
                  }`}
                >
                  {action.label}
                </span>
                <span className="text-xs text-zinc-400">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Recent signups */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Dernières inscriptions
        </h2>
        <Card>
          <CardContent className="pt-6">
            {recentEnrollments.length === 0 ? (
              <p className="text-sm text-zinc-400">Aucune inscription pour l'instant.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recentEnrollments.map((enrollment) => {
                  const statusInfo = STATUS_LABELS[enrollment.status] ?? {
                    label: enrollment.status,
                    variant: "muted" as const,
                  };
                  return (
                    <li
                      key={enrollment.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {enrollment.user.firstName} {enrollment.user.lastName}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {formatShortDate(enrollment.enrolledAt)}
                        </p>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
