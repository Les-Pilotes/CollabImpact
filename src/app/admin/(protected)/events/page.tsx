import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Evenements" };

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "muted" | "outline" }> = {
  brouillon: { label: "Brouillon", variant: "muted" },
  publie: { label: "Publie", variant: "secondary" },
  complet: { label: "Complet", variant: "warning" },
  en_cours: { label: "En cours", variant: "success" },
  termine: { label: "Termine", variant: "outline" },
};

const TYPE_LABELS: Record<string, string> = {
  FEMININ: "100% Feminin",
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

export default async function EventsListPage() {
  await requireAdmin();

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: { select: { enrollments: true } },
    },
    where: { deletedAt: null },
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Evenements</h1>
          <p className="text-sm text-stone-500 mt-1">{events.length} evenement{events.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nouvel evenement
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded-lg">
          <p className="text-stone-500 text-sm">Aucun evenement pour l&apos;instant.</p>
          <Link href="/admin/events/new" className="mt-4 inline-block">
            <Button variant="outline" size="sm" className="gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Creer le premier evenement
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
          {events.map((event) => {
            const status = STATUS_LABELS[event.status] ?? { label: event.status, variant: "muted" as const };
            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-stone-400">{TYPE_LABELS[event.type] ?? event.type}</span>
                  </div>
                  <p className="font-medium text-stone-900 truncate group-hover:text-orange-600 transition-colors">
                    {event.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{formatDate(event.date)}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-stone-900 tabular-nums">{event._count.enrollments}</p>
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
