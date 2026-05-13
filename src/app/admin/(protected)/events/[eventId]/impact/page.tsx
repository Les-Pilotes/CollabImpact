import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PageHeader from "../../../PageHeader";
import { Star, Heart, Sparkles, MessageSquareQuote, Lightbulb, BarChart2 } from "lucide-react";
import { capitalizeName } from "@/lib/normalize";

export const metadata = { title: "Impact — Admin" };

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

export default async function ImpactPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;

  const [event, feedbacks] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true, date: true },
    }),
    prisma.enrollment.findMany({
      where: { eventId, deletedAt: null, feedback: { isNot: null } },
      select: {
        user: { select: { firstName: true, lastName: true } },
        feedback: {
          select: {
            overallRating: true,
            orgRating: true,
            favoriteMoment: true,
            changedVision: true,
            improvements: true,
            verbatim: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { feedback: { submittedAt: "desc" } },
    }),
  ]);

  const total = feedbacks.length;
  const overalls = feedbacks.map((f) => f.feedback!.overallRating);
  const orgs = feedbacks.map((f) => f.feedback!.orgRating);
  const changedVisionCount = feedbacks.filter((f) => f.feedback!.changedVision).length;

  const favoriteMoments = feedbacks
    .filter((f) => (f.feedback!.favoriteMoment ?? "").length > 5)
    .slice(0, 5);
  const improvements = feedbacks.filter((f) => (f.feedback!.improvements ?? "").length > 5);
  const verbatims = feedbacks.filter((f) => (f.feedback!.verbatim ?? "").length > 5);

  return (
    <div className="flex flex-col h-full -m-4 md:-m-10 overflow-hidden">
      <PageHeader
        title="Mesure d'impact"
        subtitle={
          event
            ? `${event.name} · ${total} feedback${total !== 1 ? "s" : ""} reçu${
                total !== 1 ? "s" : ""
              }`
            : "Synthèse des feedbacks et indicateurs post-événement"
        }
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-8">
        {total === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-4xl space-y-10">
            {/* KPIs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                icon={Star}
                label="Satisfaction globale"
                value={`${formatRating(avg(overalls))}/5`}
                hint={`${total} avis`}
                tone="orange"
              />
              <KpiCard
                icon={Heart}
                label="Organisation"
                value={`${formatRating(avg(orgs))}/5`}
                hint={`${total} avis`}
                tone="rose"
              />
              <KpiCard
                icon={Sparkles}
                label="Vision changée"
                value={`${pct(changedVisionCount, total)} %`}
                hint={`${changedVisionCount}/${total} participantes`}
                tone="emerald"
              />
              <KpiCard
                icon={BarChart2}
                label="Verbatims"
                value={`${verbatims.length}`}
                hint={`${improvements.length} suggestions`}
                tone="stone"
              />
            </section>

            {/* Favorite moments */}
            {favoriteMoments.length > 0 && (
              <Section
                icon={Heart}
                title="Moments préférés"
                subtitle="Ce qui a marqué les participantes"
              >
                <ul className="space-y-2">
                  {favoriteMoments.map((f, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-950"
                    >
                      <span className="text-rose-500 mr-1.5">❝</span>
                      {f.feedback!.favoriteMoment}
                      <span className="text-rose-500 ml-1">❞</span>
                      <p className="text-xs text-rose-700/70 mt-1 italic">
                        — {capitalizeName(f.user.firstName)} {capitalizeName(f.user.lastName.charAt(0))}.
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Verbatims */}
            {verbatims.length > 0 && (
              <Section
                icon={MessageSquareQuote}
                title="Verbatims"
                subtitle={`${verbatims.length} message${verbatims.length !== 1 ? "s" : ""} libre${verbatims.length !== 1 ? "s" : ""}`}
              >
                <ul className="space-y-3">
                  {verbatims.map((f, i) => (
                    <li
                      key={i}
                      className="p-4 rounded-xl bg-white border border-stone-200 text-sm leading-relaxed text-stone-700"
                    >
                      <p>&ldquo;{f.feedback!.verbatim}&rdquo;</p>
                      <p className="text-xs text-stone-400 mt-2">
                        — {capitalizeName(f.user.firstName)}{" "}
                        {capitalizeName(f.user.lastName.charAt(0))}.
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Improvements */}
            {improvements.length > 0 && (
              <Section
                icon={Lightbulb}
                title="Suggestions d'amélioration"
                subtitle="À garder en tête pour la prochaine édition"
              >
                <ul className="space-y-2">
                  {improvements.map((f, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-950"
                    >
                      {f.feedback!.improvements}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: "orange" | "rose" | "emerald" | "stone";
}) {
  const tones = {
    orange: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-500" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", icon: "text-rose-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500" },
    stone: { bg: "bg-stone-50", text: "text-stone-700", icon: "text-stone-500" },
  };
  const t = tones[tone];
  return (
    <div className={`${t.bg} rounded-2xl p-4 border border-transparent`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${t.icon}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.text}`}>
          {label}
        </span>
      </div>
      <p className={`text-2xl font-extrabold tabular-nums ${t.text}`}>{value}</p>
      <p className="text-[11px] text-stone-500 mt-0.5">{hint}</p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-stone-500" />
        <h2 className="text-sm font-bold text-stone-900">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-stone-500 -mt-1.5">{subtitle}</p>}
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3">
      <p className="text-5xl">📊</p>
      <p className="text-sm font-semibold text-stone-700">Pas encore de feedback</p>
      <p className="text-xs text-stone-400 max-w-sm">
        Cette page se peuplera automatiquement dès que les participantes auront répondu à
        l&apos;email de feedback envoyé après l&apos;événement.
      </p>
    </div>
  );
}
