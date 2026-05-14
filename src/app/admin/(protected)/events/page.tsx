import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Plus, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImmersionStatus } from "@prisma/client";

export const metadata = { title: "Événements" };

// UI lifecycle labels: 5 user-facing groups. complet & en_cours are derived
// visual states; admins transition through these 4 buckets.
const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "muted" | "outline" }
> = {
  brouillon: { label: "Brouillon", variant: "muted" },
  publie: { label: "En préparation", variant: "secondary" },
  complet: { label: "Complet", variant: "warning" },
  en_cours: { label: "En cours", variant: "success" },
  termine: { label: "Finalisé", variant: "outline" },
  archive: { label: "Archivé", variant: "muted" },
};

const TYPE_LABELS: Record<string, string> = {
  FEMININ: "100% Féminin",
  IMMERSION: "Immersion",
  ATELIER: "Atelier",
  IMPULSION: "Impulsion",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const view = sp.view === "archived" ? "archived" : "active";

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: { select: { enrollments: { where: { deletedAt: null } } } },
    },
    where: {
      deletedAt: null,
      status:
        view === "archived"
          ? ImmersionStatus.archive
          : { not: ImmersionStatus.archive },
    },
  });

  // Counts for tab badges
  const [activeCount, archivedCount] = await Promise.all([
    prisma.event.count({
      where: { deletedAt: null, status: { not: ImmersionStatus.archive } },
    }),
    prisma.event.count({
      where: { deletedAt: null, status: ImmersionStatus.archive },
    }),
  ]);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Événements</h1>
          <p className="text-sm text-stone-500 mt-1">
            {events.length} événement{events.length !== 1 ? "s" : ""}
            {view === "archived" ? " archivé" : " actif"}
            {events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel événement
          </Button>
        </Link>
      </div>

      {/* Tabs Actifs / Archivés */}
      <div className="flex items-center gap-1 border-b border-stone-200">
        <TabLink
          href="/admin/events"
          active={view === "active"}
          label="Actifs"
          count={activeCount}
        />
        <TabLink
          href="/admin/events?view=archived"
          active={view === "archived"}
          label="Archivés"
          count={archivedCount}
          icon={<Archive className="w-3.5 h-3.5" />}
        />
      </div>

      {events.length === 0 ? (
        <EmptyState view={view} />
      ) : (
        <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
          {events.map((event) => {
            const status =
              STATUS_LABELS[event.status] ??
              { label: event.status, variant: "muted" as const };
            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-stone-400">
                      {TYPE_LABELS[event.type] ?? event.type}
                    </span>
                  </div>
                  <p className="font-medium text-stone-900 truncate group-hover:text-orange-600 transition-colors">
                    {event.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{formatDate(event.date)}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-stone-900 tabular-nums">
                      {event._count.enrollments}
                    </p>
                    <p className="text-xs text-stone-400">inscrites</p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2.5 -mb-px border-b-2 text-sm font-medium transition-colors ${
        active
          ? "border-orange-500 text-orange-700"
          : "border-transparent text-stone-500 hover:text-stone-900"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold tabular-nums ${
          active ? "bg-orange-100 text-orange-800" : "bg-stone-100 text-stone-500"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function EmptyState({ view }: { view: "active" | "archived" }) {
  if (view === "archived") {
    return (
      <div className="text-center py-16 border border-dashed border-stone-200 rounded-lg">
        <p className="text-stone-500 text-sm">Aucun événement archivé.</p>
        <p className="text-stone-400 text-xs mt-1">
          Les événements terminés que tu archives apparaissent ici.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-16 border border-dashed border-stone-200 rounded-lg">
      <p className="text-stone-500 text-sm">Aucun événement actif pour l&apos;instant.</p>
      <Link href="/admin/events/new" className="mt-4 inline-block">
        <Button variant="outline" size="sm" className="gap-2 mt-4">
          <Plus className="w-4 h-4" />
          Créer le premier événement
        </Button>
      </Link>
    </div>
  );
}
