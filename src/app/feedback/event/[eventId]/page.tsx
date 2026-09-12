import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FeedbackEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { eventId } = await params;
  const { error } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, date: true },
  });
  if (!event) notFound();

  const dateLabel = event.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Paris",
      }).format(event.date)
    : null;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
            Les Pilotes
          </p>
          <h1 className="text-xl font-extrabold text-stone-900">{event.name}</h1>
          {dateLabel && (
            <p className="text-sm text-stone-500 capitalize">{dateLabel}</p>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-base font-bold text-stone-800">Ton adresse e-mail</p>
            <p className="text-xs text-stone-500">
              Celle avec laquelle tu t&apos;es inscrite à l&apos;événement.
            </p>
          </div>

          <form action={`/feedback/event/${eventId}/go`} method="GET">
            <div className="space-y-3">
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="prenom@exemple.fr"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              {error === "not_found" && (
                <p className="text-xs text-red-600 font-medium">
                  Cette adresse n&apos;est pas reconnue pour cet événement. Vérifie qu&apos;il s&apos;agit bien de l&apos;adresse utilisée à l&apos;inscription.
                </p>
              )}
              {error === "already_done" && (
                <p className="text-xs text-emerald-700 font-medium">
                  Tu as déjà soumis ton feedback — merci ! ✓
                </p>
              )}
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-[var(--brand-orange)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Accéder au formulaire →
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-stone-400">
          Tu ne trouves pas ton adresse ? Demande à l&apos;organisatrice.
        </p>
      </div>
    </div>
  );
}
