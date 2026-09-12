import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FEEDBACK_SECTIONS } from "@/lib/feedback/questions";
import PrintButton from "./PrintButton";

export const metadata = { title: "Export feedback — Admin" };

function avg(values: number[]): string {
  if (values.length === 0) return "—";
  const a = values.reduce((s, v) => s + v, 0) / values.length;
  return a.toFixed(1).replace(".", ",");
}

function pct(n: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((n / total) * 100)} %`;
}

function distribution(values: string[]): { label: string; count: number; pct: number }[] {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  const total = values.length;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }));
}

export default async function FeedbackPrintPage({
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
        feedback: {
          select: {
            overallRating: true,
            orgRating: true,
            changedVision: true,
            answers: true,
          },
        },
      },
    }),
  ]);

  const total = feedbacks.length;
  const eventDateLabel = event?.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      }).format(event.date)
    : null;

  // ── Aggregate KPIs ──────────────────────────────────────────────────────────
  const v2answers = feedbacks
    .map((f) => (f.feedback!.answers ?? {}) as Record<string, unknown>)
    .filter((a) => Object.keys(a).length > 0);

  // Prefer v2 noteAnimation, fall back to v1 overallRating
  const animationRatings = v2answers
    .map((a) => a["noteAnimation"])
    .filter((v): v is number => typeof v === "number");
  const overallRatings = feedbacks
    .map((f) => f.feedback!.overallRating)
    .filter((n): n is number => n != null);
  const orgRatings = feedbacks
    .map((f) => f.feedback!.orgRating)
    .filter((n): n is number => n != null);

  const visionChangedCount = (() => {
    // v2: rencontresAide = "Oui" / "Non"
    const v2 = v2answers.filter((a) => a["rencontresAide"] === "Oui").length;
    // v1 fallback
    const v1 = feedbacks.filter(
      (f) => (f.feedback!.answers == null || Object.keys(f.feedback!.answers as object).length === 0) && f.feedback!.changedVision === true,
    ).length;
    return v2 + v1;
  })();

  // ── Distribution of select/multi/yesno questions ─────────────────────────
  const SELECT_KEYS = [
    "momentPrefere",
    "rencontresAide",
    "interesseAutresEvents",
  ] as const;

  const MULTI_KEYS = ["raisonsVenue"] as const;

  const selectDists = Object.fromEntries(
    SELECT_KEYS.map((key) => {
      const values = v2answers
        .map((a) => a[key])
        .filter((v): v is string => typeof v === "string" && v.length > 0);
      return [key, distribution(values)];
    }),
  );

  const multiDists = Object.fromEntries(
    MULTI_KEYS.map((key) => {
      const flat = v2answers
        .flatMap((a) => (Array.isArray(a[key]) ? (a[key] as string[]) : []))
        .filter((v) => v.length > 0);
      return [key, distribution(flat)];
    }),
  );

  // ── Open-ended verbatims (anonymous) ─────────────────────────────────────
  const LONG_KEYS = [
    { key: "motivationDetail", label: "Motivation pour venir" },
    { key: "momentPreferePourquoi", label: "Moment préféré — pourquoi ?" },
    { key: "intervenantePrefereePourquoi", label: "Intervenante préférée — pourquoi ?" },
    { key: "plusMarque", label: "Ce qui a le plus marqué" },
    { key: "domaineProchaineFois", label: "Domaine souhaité la prochaine fois" },
    { key: "commentaireAnimation", label: "Commentaire sur l'animation" },
    { key: "avisOrganisation", label: "Avis sur l'organisation" },
    { key: "ameliorations", label: "Suggestions d'amélioration" },
    { key: "motDeLaFin", label: "Mot de la fin" },
  ];

  const verbatimGroups = LONG_KEYS.map(({ key, label }) => ({
    label,
    items: v2answers
      .map((a) => a[key])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 5),
  })).filter((g) => g.items.length > 0);

  // Question labels from schema
  const questionLabel = (key: string): string => {
    for (const section of FEEDBACK_SECTIONS) {
      const q = section.questions.find((q) => q.key === key);
      if (q) return q.dynamicLabel ? q.label.replace("{animatriceName}", "l'animatrice") : q.label;
    }
    return key;
  };

  const hasData = total > 0;

  return (
    <div className="min-h-screen bg-white text-stone-900">
      {/* Print controls — hidden when printing */}
      <div className="no-print sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="../"
            className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            ← Retour
          </a>
          <span className="text-stone-300">|</span>
          <span className="text-sm font-medium text-stone-700">Export présentation</span>
        </div>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto px-8 py-10 space-y-10 print:px-0 print:py-0">
        {/* Header */}
        <header className="space-y-1 border-b border-stone-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
            Mesure d&apos;impact · Les Pilotes
          </p>
          <h1 className="text-2xl font-bold text-stone-900">{event?.name ?? "Événement"}</h1>
          {eventDateLabel && (
            <p className="text-sm text-stone-500 capitalize">{eventDateLabel}</p>
          )}
          <p className="text-sm text-stone-600 mt-2 font-medium">
            {total} feedback{total !== 1 ? "s" : ""} reçu{total !== 1 ? "s" : ""}
          </p>
        </header>

        {!hasData && (
          <p className="text-center text-stone-400 py-16 text-sm">
            Aucun feedback disponible pour cet événement.
          </p>
        )}

        {hasData && (
          <>
            {/* KPIs */}
            <section className="space-y-4">
              <SectionTitle>Indicateurs clés</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(animationRatings.length > 0 || overallRatings.length > 0) && (
                  <Kpi
                    label="Satisfaction globale"
                    value={`${animationRatings.length > 0 ? avg(animationRatings) : avg(overallRatings)} / 5`}
                  />
                )}
                {orgRatings.length > 0 && (
                  <Kpi label="Organisation" value={`${avg(orgRatings)} / 5`} />
                )}
                <Kpi
                  label="Rencontres utiles à l'orientation"
                  value={pct(visionChangedCount, total)}
                />
              </div>
            </section>

            {/* Distributions */}
            {(
              [
                { key: "momentPrefere", dists: selectDists["momentPrefere"] },
                { key: "raisonsVenue", dists: multiDists["raisonsVenue"] },
                { key: "rencontresAide", dists: selectDists["rencontresAide"] },
                { key: "interesseAutresEvents", dists: selectDists["interesseAutresEvents"] },
              ] as const
            )
              .filter(({ dists }) => dists && dists.length > 0)
              .map(({ key, dists }) => (
                <section key={key} className="space-y-3 print:break-inside-avoid">
                  <SectionTitle>{questionLabel(key)}</SectionTitle>
                  <ul className="space-y-2">
                    {dists.map(({ label, count, pct: p }) => (
                      <li key={label} className="flex items-center gap-3">
                        {/* Bar */}
                        <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-orange-400 rounded-full flex items-center pl-2"
                            style={{ width: `${Math.max(p, 4)}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-500 tabular-nums w-10 text-right shrink-0">
                          {p} %
                        </span>
                        <span className="text-xs text-stone-700 shrink-0 w-6 text-right tabular-nums">
                          ({count})
                        </span>
                        <span className="text-sm text-stone-800 min-w-0">{label}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

            {/* Verbatims par thème */}
            {verbatimGroups.map(({ label, items }) => (
              <section key={label} className="space-y-3 print:break-inside-avoid">
                <SectionTitle>{label}</SectionTitle>
                <ul className="space-y-2">
                  {items.map((text, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-sm text-stone-700 leading-relaxed"
                    >
                      {text}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}

        <footer className="pt-4 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-300">
            Export anonymisé · Généré le{" "}
            {new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Europe/Paris",
            }).format(new Date())}
          </p>
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 20mm 15mm; size: A4; }
          body { font-size: 11pt; }
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
      {children}
    </h2>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 p-4 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="text-2xl font-extrabold tabular-nums text-stone-900">{value}</p>
    </div>
  );
}
