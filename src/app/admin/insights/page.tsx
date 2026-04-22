import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Star } from "lucide-react";

export const metadata = { title: "Insights — Admin" };

export default async function InsightsPage() {
  const { admin } = await requireAdmin();

  const [
    totalUsers,
    totalEnrollments,
    presentEnrollments,
    totalFeedbacks,
    avgRating,
    recentFeedbacks,
    topSectors,
    pollResults,
  ] = await Promise.all([
    prisma.user.count({
      where: { organisationId: admin.organisationId, deletedAt: null },
    }),
    prisma.enrollment.count({
      where: { organisationId: admin.organisationId, deletedAt: null },
    }),
    prisma.enrollment.count({
      where: {
        organisationId: admin.organisationId,
        status: "present",
        deletedAt: null,
      },
    }),
    prisma.feedback.count({
      where: {
        enrollment: { organisationId: admin.organisationId },
      },
    }),
    prisma.feedback.aggregate({
      where: {
        enrollment: { organisationId: admin.organisationId },
      },
      _avg: { overallRating: true },
    }),
    prisma.feedback.findMany({
      where: {
        enrollment: { organisationId: admin.organisationId },
        verbatim: { not: null },
      },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        enrollment: {
          include: {
            user: { select: { firstName: true } },
            immersion: { select: { companyName: true } },
          },
        },
      },
    }),
    // Top interest areas from user profiles
    prisma.user.findMany({
      where: { organisationId: admin.organisationId, deletedAt: null },
      select: { interestAreas: true },
    }),
    // Active poll results
    prisma.poll.findFirst({
      where: { organisationId: admin.organisationId, status: "actif" },
      include: { responses: true },
    }),
  ]);

  const presenceRate =
    totalEnrollments > 0
      ? Math.round((presentEnrollments / totalEnrollments) * 100)
      : 0;

  const feedbackRate =
    presentEnrollments > 0
      ? Math.round((totalFeedbacks / presentEnrollments) * 100)
      : 0;

  // Count interest areas
  const areaCount: Record<string, number> = {};
  topSectors.forEach((u) => {
    u.interestAreas.forEach((area) => {
      areaCount[area] = (areaCount[area] ?? 0) + 1;
    });
  });
  const sortedAreas = Object.entries(areaCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Poll results
  let pollResultsData: { label: string; count: number; pct: number }[] = [];
  if (pollResults) {
    const options = pollResults.options as { id: string; label: string }[];
    const totalVotes = pollResults.responses.length;
    pollResultsData = options.map((opt) => {
      const count = pollResults.responses.filter((r) => r.optionId === opt.id).length;
      return { label: opt.label, count, pct: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0 };
    }).sort((a, b) => b.count - a.count);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-zinc-900">Insights</h1>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Jeunes inscrits", value: totalUsers },
          { label: "Inscriptions totales", value: totalEnrollments },
          { label: "Taux de présence", value: `${presenceRate}%` },
          { label: "Taux de feedback", value: `${feedbackRate}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm text-center">
            <p className="text-3xl font-extrabold gradient-brand-text">{kpi.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top interest areas */}
        <section>
          <h2 className="font-bold text-zinc-900 mb-4">Secteurs les plus demandés</h2>
          {sortedAreas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">
              Pas encore de données (les jeunes doivent compléter leur profil).
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-3">
              {sortedAreas.map(([area, count]) => {
                const max = sortedAreas[0][1];
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={area}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-zinc-700">{area}</span>
                      <span className="text-zinc-400">{count} jeune{count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ffe959] to-[#ff914d] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sondage actif */}
        <section>
          <h2 className="font-bold text-zinc-900 mb-4">
            {pollResults ? pollResults.question : "Résultats du sondage"}
          </h2>
          {!pollResults || pollResultsData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">
              Pas de sondage actif ou aucune réponse.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 space-y-3">
              <p className="text-xs text-zinc-400 mb-3">
                {pollResults.responses.length} réponse{pollResults.responses.length > 1 ? "s" : ""}
              </p>
              {pollResultsData.map(({ label, count, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-zinc-700">{label}</span>
                    <span className="text-zinc-400">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ffe959] to-[#ff914d] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Note moyenne + verbatims */}
      <section>
        <h2 className="font-bold text-zinc-900 mb-4">Feedback</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-zinc-900">
                {avgRating._avg.overallRating
                  ? avgRating._avg.overallRating.toFixed(1)
                  : "—"}
              </p>
              <p className="text-xs text-zinc-400">Note moyenne /5</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-zinc-900">{totalFeedbacks}</p>
              <p className="text-xs text-zinc-400">Feedbacks reçus</p>
            </div>
          </div>
        </div>

        {recentFeedbacks.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-zinc-600">Verbatims récents</p>
            {recentFeedbacks.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < f.overallRating ? "fill-[#ffe959] text-[#ffe959]" : "text-zinc-200 fill-zinc-200"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-zinc-700 italic mb-2">
                  &ldquo;{f.verbatim}&rdquo;
                </p>
                <p className="text-xs text-zinc-400">
                  {f.enrollment.user.firstName ?? "Participant"} ·{" "}
                  {f.enrollment.immersion.companyName}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
