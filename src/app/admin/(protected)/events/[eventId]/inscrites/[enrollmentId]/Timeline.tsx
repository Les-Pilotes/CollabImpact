import { SectionLabel } from "@/components/ui/section-label";

export type TimelineKind =
  | "neutral"
  | "email"
  | "success"
  | "warning"
  | "danger";

export type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  label: string;
  detail?: string;
  ts: number;
};

const KIND_DOT: Record<TimelineKind, string> = {
  neutral: "bg-stone-300",
  email: "bg-sky-400",
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  danger: "bg-red-500",
};

const KIND_TEXT: Record<TimelineKind, string> = {
  neutral: "text-stone-700",
  email: "text-sky-800",
  success: "text-emerald-800 font-medium",
  warning: "text-amber-800",
  danger: "text-red-800 font-medium",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Vertical timeline of lifecycle events for a single enrollment.
 * Entries are sorted chronologically (oldest -> newest), with the most
 * recent rendered at the bottom — matches how admins read activity feeds
 * in the rest of the app.
 */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.ts - b.ts);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="p-5 border-b border-stone-100">
        <SectionLabel>Historique</SectionLabel>
        <h2 className="mt-1 text-lg font-semibold text-stone-900">Timeline</h2>
      </div>
      <ol className="relative px-5 py-4 space-y-3">
        {sorted.length === 0 ? (
          <li className="text-sm text-stone-500">Aucun événement enregistré.</li>
        ) : (
          sorted.map((entry, idx) => (
            <li key={entry.id} className="flex gap-3 relative">
              <div className="flex flex-col items-center flex-shrink-0">
                <span
                  className={`h-2.5 w-2.5 rounded-full mt-1.5 ${KIND_DOT[entry.kind]}`}
                  aria-hidden
                />
                {idx < sorted.length - 1 && (
                  <span className="flex-1 w-px bg-stone-200 my-1" aria-hidden />
                )}
              </div>
              <div className="flex-1 pb-2 min-w-0">
                <p className={`text-sm ${KIND_TEXT[entry.kind]}`}>
                  {entry.label}
                </p>
                {entry.detail && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    {entry.detail}
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-0.5 tabular-nums">
                  {dateFormatter.format(new Date(entry.ts))}
                </p>
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
