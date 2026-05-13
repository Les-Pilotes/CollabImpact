import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = { title: "Paramètres — Event" };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function EventParametresPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: {
      id: true,
      name: true,
      date: true,
      address: true,
      capacity: true,
      description: true,
      status: true,
    },
  });

  if (!event) notFound();

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {event.name}
        </p>
        <h1 className="text-2xl font-bold text-stone-900">Paramètres</h1>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">Informations</h2>
        <dl className="divide-y divide-stone-200 border-y border-stone-200 text-sm">
          <div className="grid grid-cols-[10rem_1fr] gap-4 py-3">
            <dt className="text-stone-500">Nom</dt>
            <dd className="text-stone-900">{event.name}</dd>
          </div>
          <div className="grid grid-cols-[10rem_1fr] gap-4 py-3">
            <dt className="text-stone-500">Date</dt>
            <dd className="text-stone-900">{formatDate(event.date)}</dd>
          </div>
          <div className="grid grid-cols-[10rem_1fr] gap-4 py-3">
            <dt className="text-stone-500">Lieu</dt>
            <dd className="text-stone-900">{event.address}</dd>
          </div>
          <div className="grid grid-cols-[10rem_1fr] gap-4 py-3">
            <dt className="text-stone-500">Capacité</dt>
            <dd className="text-stone-900 tabular-nums">{event.capacity} places</dd>
          </div>
          {event.description && (
            <div className="grid grid-cols-[10rem_1fr] gap-4 py-3">
              <dt className="text-stone-500">Description</dt>
              <dd className="text-stone-900 whitespace-pre-line">
                {event.description}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Formulaire d&apos;inscription</h2>
        <p className="text-sm text-stone-500 max-w-[60ch]">
          La configuration du formulaire d&apos;inscription (champs actifs, champs custom,
          ordre, pages) arrive dans une prochaine itération.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-stone-900">Communications</h2>
        <p className="text-sm text-stone-500 max-w-[60ch]">
          Personnalisation des emails J-7, J-2, feedback à venir.
        </p>
      </section>
    </div>
  );
}
