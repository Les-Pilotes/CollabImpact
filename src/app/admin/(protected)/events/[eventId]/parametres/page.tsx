import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import EventSettingsForm from "./EventSettingsForm";

export const metadata = { title: "Paramètres — Event" };

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
      type: true,
      date: true,
      address: true,
      capacity: true,
      description: true,
      status: true,
      replyToEmail: true,
      emailSignature: true,
    },
  });

  if (!event) notFound();

  const dateISO = event.date.toISOString();

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{event.name}</p>
        <h1 className="text-2xl font-bold text-stone-900">Paramètres</h1>
      </header>

      <EventSettingsForm
        eventId={event.id}
        initial={{
          name: event.name,
          type: event.type,
          date: dateISO.slice(0, 10),
          time: dateISO.slice(11, 16),
          address: event.address,
          capacity: event.capacity,
          description: event.description ?? "",
          replyToEmail: event.replyToEmail ?? "",
          emailSignature: event.emailSignature ?? "",
        }}
      />

      <section className="space-y-3 pt-4 border-t border-stone-200">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Formulaire d&apos;inscription</h2>
        <p className="text-sm text-stone-500 max-w-[60ch]">
          La configuration du formulaire (couches actives, champs custom, ordre) arrive dans
          une prochaine itération. Pour l&apos;instant, les 3 couches (Fondamentale,
          Orientation, Événement) sont toutes activées par défaut.
        </p>
      </section>
    </div>
  );
}
