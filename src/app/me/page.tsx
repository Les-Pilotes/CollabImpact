import { requireJeune } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Building2,
  MapPin,
  Clock,
  ChevronRight,
  AlertCircle,
  Star,
  ArrowRight,
  FileText,
  Image,
  Newspaper,
  BarChart3,
} from "lucide-react";

export const metadata = { title: "Mon espace" };

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default async function MePage() {
  const { dbUser } = await requireJeune();
  const now = new Date();

  // Fetch user's enrollments with immersion details
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: dbUser.id, deletedAt: null },
    include: {
      immersion: true,
      feedback: true,
    },
    orderBy: { immersion: { date: "asc" } },
  });

  const upcoming = enrollments.filter((e) => e.immersion.date >= now && e.status !== "desistement");
  const past = enrollments.filter((e) => e.immersion.date < now && e.status !== "desistement");

  // Actions to do
  const missingFeedbacks = past.filter(
    (e) => e.status === "present" && !e.feedback && e.feedbackSentAt,
  );
  const missingRights = enrollments.filter(
    (e) =>
      !e.imageRightsSignedAt &&
      e.immersion.date >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // last 30 days
  );

  const totalActions = missingFeedbacks.length + missingRights.length;

  // Feed (latest published updates)
  const feed = await prisma.update.findMany({
    where: {
      organisationId: dbUser.organisationId,
      publishedAt: { not: null, lte: now },
      deletedAt: null,
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
    include: { immersion: { select: { companyName: true } } },
  });

  // Active poll
  const activePoll = await prisma.poll.findFirst({
    where: { organisationId: dbUser.organisationId, status: "actif" },
    include: {
      responses: { where: { userId: dbUser.id } },
    },
  });

  // Next immersions (catalogue)
  const nextImmersions = await prisma.immersion.findMany({
    where: {
      organisationId: dbUser.organisationId,
      status: "publie",
      date: { gte: now },
      deletedAt: null,
      // exclude already enrolled
      enrollments: { none: { userId: dbUser.id } },
    },
    orderBy: { date: "asc" },
    take: 3,
    select: {
      id: true,
      companyName: true,
      companySector: true,
      companyCity: true,
      date: true,
      maxCapacity: true,
      themes: true,
      _count: { select: { enrollments: true } },
    },
  });

  const displayName = dbUser.firstName ?? dbUser.email.split("@")[0];

  return (
    <div className="space-y-10">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">
          Bonjour {displayName} 👋
        </h1>
        <p className="text-zinc-500 mt-1">
          {upcoming.length === 0
            ? "Explore les prochaines immersions et inscris-toi !"
            : `Tu as ${upcoming.length} immersion${upcoming.length > 1 ? "s" : ""} à venir.`}
        </p>
      </div>

      {/* SECTION 1 — Actions to do */}
      {totalActions > 0 && (
        <section id="actions">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-lg text-zinc-900">
              Actions à faire
            </h2>
            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalActions}
            </span>
          </div>
          <div className="space-y-3">
            {missingFeedbacks.map((e) => (
              <div
                key={e.id}
                className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">
                      Feedback manquant
                    </p>
                    <p className="text-xs text-zinc-500">
                      Immersion {e.immersion.companyName} —{" "}
                      {formatDateShort(e.immersion.date)}
                    </p>
                  </div>
                </div>
                {e.feedbackToken ? (
                  <Link href={`/feedback/${e.feedbackToken}`}>
                    <Button size="sm" variant="gradient" className="shrink-0">
                      Donner mon avis
                    </Button>
                  </Link>
                ) : (
                  <Badge variant="warning">Bientôt disponible</Badge>
                )}
              </div>
            ))}

            {missingRights.map((e) => (
              <div
                key={e.id}
                className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Image className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">
                      Droits à l&apos;image à signer
                    </p>
                    <p className="text-xs text-zinc-500">
                      Immersion {e.immersion.companyName} —{" "}
                      {formatDateShort(e.immersion.date)}
                    </p>
                  </div>
                </div>
                <Link href={`/me/droits/${e.id}`}>
                  <Button size="sm" variant="outline" className="shrink-0">
                    Signer
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2 — Mes immersions */}
      <section>
        <h2 className="font-bold text-lg text-zinc-900 mb-4">
          Mes immersions
        </h2>

        {upcoming.length === 0 && past.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
            <p className="text-zinc-500 mb-4">
              Tu n&apos;as pas encore participé à une immersion.
            </p>
            <Link href="/immersions">
              <Button variant="gradient">
                Voir le catalogue <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                  À venir
                </p>
                <div className="space-y-3">
                  {upcoming.map((e) => {
                    const needsConfirm =
                      e.status === "inscrit" || e.status === "contacte";
                    const daysUntil = Math.ceil(
                      (e.immersion.date.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return (
                      <div
                        key={e.id}
                        className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
                      >
                        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
                        <div className="p-5 flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-zinc-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div>
                                <p className="font-bold text-zinc-900">
                                  {e.immersion.companyName}
                                </p>
                                <p className="text-sm text-[var(--brand-orange)]">
                                  {e.immersion.companySector}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  e.status === "confirme_j7" ||
                                  e.status === "confirme_j2"
                                    ? "success"
                                    : "warning"
                                }
                              >
                                {e.status === "confirme_j7" ||
                                e.status === "confirme_j2"
                                  ? "Confirmé ✓"
                                  : "Inscrit"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(e.immersion.date)}
                                {" à "}
                                {formatTime(e.immersion.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {e.immersion.companyCity}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(e.immersion.durationMinutes)}
                              </span>
                            </div>
                            {needsConfirm && daysUntil <= 7 && (
                              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800">
                                ⚡ Pense à confirmer ta présence — l&apos;immersion est dans{" "}
                                {daysUntil === 1 ? "1 jour" : `${daysUntil} jours`} !
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 mt-6">
                  Passées
                </p>
                <div className="space-y-3">
                  {past.slice(0, 5).map((e) => (
                    <div
                      key={e.id}
                      className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-center gap-4 opacity-80"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-zinc-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 text-sm">
                          {e.immersion.companyName}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {formatDateShort(e.immersion.date)} ·{" "}
                          {e.status === "present"
                            ? "✅ Présent"
                            : e.status === "absent"
                              ? "❌ Absent"
                              : "—"}
                        </p>
                      </div>
                      {e.feedback ? (
                        <Badge variant="success" className="text-xs shrink-0">
                          Feedback envoyé ✓
                        </Badge>
                      ) : e.status === "present" && e.feedbackToken ? (
                        <Link href={`/feedback/${e.feedbackToken}`}>
                          <Button size="sm" variant="outline" className="shrink-0 text-xs">
                            Donner mon avis
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* SECTION 3 — Feed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[var(--brand-orange)]" />
              <h2 className="font-bold text-lg text-zinc-900">
                Actus Les Pilotes
              </h2>
            </div>
          </div>

          {feed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">
              Les actus arrivent bientôt ✨
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map((update) => (
                <div
                  key={update.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm text-zinc-900 leading-snug">
                      {update.title}
                    </p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {update.kind === "post_linkedin"
                        ? "LinkedIn"
                        : update.kind === "video"
                          ? "Vidéo"
                          : update.kind === "article"
                            ? "Article"
                            : "Actu"}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                    {update.body}
                  </p>
                  <div className="flex items-center justify-between">
                    {update.immersion && (
                      <span className="text-xs text-[var(--brand-orange)] font-medium">
                        {update.immersion.companyName}
                      </span>
                    )}
                    <span className="text-xs text-zinc-400 ml-auto">
                      {update.publishedAt
                        ? formatDateShort(update.publishedAt)
                        : ""}
                    </span>
                  </div>
                  {update.sourceUrl && (
                    <a
                      href={update.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs text-[var(--brand-orange)] hover:underline flex items-center gap-1"
                    >
                      Voir le lien <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 4 — Explorer + Sondage */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[var(--brand-orange)]" />
            <h2 className="font-bold text-lg text-zinc-900">Explorer</h2>
          </div>

          {/* Sondage actif */}
          {activePoll && (
            <PollWidget poll={activePoll} userId={dbUser.id} />
          )}

          {/* Prochaines immersions non inscrites */}
          {nextImmersions.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Prochaines immersions
              </p>
              {nextImmersions.map((imm) => {
                const placesLeft = imm.maxCapacity - imm._count.enrollments;
                return (
                  <Link
                    key={imm.id}
                    href={`/immersions/${imm.id}`}
                    className="group block bg-white rounded-2xl border border-zinc-200 hover:border-[var(--brand-orange)] hover:shadow-sm transition-all p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-zinc-900 group-hover:text-[var(--brand-orange)] transition-colors">
                          {imm.companyName}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {formatDateShort(imm.date)} · {imm.companyCity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {placesLeft <= 0 ? (
                          <Badge variant="muted" className="text-xs">
                            Complet
                          </Badge>
                        ) : placesLeft <= 3 ? (
                          <Badge variant="warning" className="text-xs">
                            {placesLeft} place{placesLeft > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-xs">
                            {placesLeft} places
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--brand-orange)] transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
              <Link href="/immersions">
                <Button variant="ghost" size="sm" className="w-full mt-1">
                  Voir tout le catalogue <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}

          {nextImmersions.length === 0 && !activePoll && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">
              Pas d&apos;immersion à venir pour l&apos;instant. 👀
            </div>
          )}
        </section>
      </div>

      {/* SECTION 5 — Mon profil CTA */}
      <section className="bg-gradient-to-br from-[#fffbe6] to-[#fff3e6] rounded-2xl border border-orange-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-bold text-zinc-900">
              👤 Mon profil d&apos;orientation
            </p>
            <p className="text-sm text-zinc-600 mt-0.5">
              {dbUser.layer2UpdatedAt
                ? `Dernière mise à jour : ${formatDateShort(dbUser.layer2UpdatedAt)}`
                : "Complète ton profil pour personnaliser ton expérience."}
            </p>
          </div>
          <Link href="/me/profil">
            <Button variant="outline" size="sm">
              {dbUser.firstName ? "Modifier mon profil" : "Compléter mon profil"}{" "}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Inline PollWidget server component
async function PollWidget({
  poll,
  userId,
}: {
  poll: Awaited<ReturnType<typeof prisma.poll.findFirst>> & {
    responses: { optionId: string }[];
  };
  userId: string;
}) {
  if (!poll) return null;

  const options = poll.options as { id: string; label: string }[];
  const userResponse = poll.responses[0];
  const totalResponses = await prisma.pollResponse.count({
    where: { pollId: poll.id },
  });

  if (userResponse) {
    // Show results
    const counts = await Promise.all(
      options.map(async (opt) => ({
        ...opt,
        count: await prisma.pollResponse.count({
          where: { pollId: poll.id, optionId: opt.id },
        }),
      })),
    );

    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <p className="font-semibold text-sm text-zinc-900 mb-3">
          📊 {poll.question}
        </p>
        <div className="space-y-2">
          {counts.map((opt) => {
            const pct = totalResponses > 0 ? Math.round((opt.count / totalResponses) * 100) : 0;
            const isMyVote = opt.id === userResponse.optionId;
            return (
              <div key={opt.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span
                    className={
                      isMyVote
                        ? "font-semibold text-[var(--brand-orange)]"
                        : "text-zinc-600"
                    }
                  >
                    {opt.label} {isMyVote && "✓"}
                  </span>
                  <span className="text-zinc-400">{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isMyVote ? "bg-gradient-to-r from-[#ffe959] to-[#ff914d]" : "bg-zinc-300"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-zinc-400 mt-3">{totalResponses} réponses</p>
      </div>
    );
  }

  // Show voting form
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <p className="font-semibold text-sm text-zinc-900 mb-3">
        🗳️ {poll.question}
      </p>
      <PollVoteForm pollId={poll.id} options={options} />
    </div>
  );
}

// Client component for poll voting
import PollVoteForm from "@/components/jeune/PollVoteForm";
