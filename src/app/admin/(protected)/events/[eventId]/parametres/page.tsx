import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import EventSettingsForm from "./EventSettingsForm";
import FormConfigSection from "./FormConfigSection";
import EmailConfigSection from "./EmailConfigSection";

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
      formConfig: true,
      emailConfig: true,
    },
  });

  if (!event) notFound();

  const dateISO = event.date.toISOString();

  const formCfg = event.formConfig ?? {
    phoneEnabled: true,
    birthDateEnabled: true,
    cityEnabled: true,
    sourceEnabled: true,
  };

  const emailCfg = event.emailConfig ?? {
    confirmationNote: "",
    j7Note: "",
    j2Note: "",
    feedbackNote: "",
  };

  return (
    <div className="space-y-10 max-w-2xl">
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

      <section className="space-y-4 pt-4 border-t border-stone-200">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
            Formulaire d&apos;inscription
          </h2>
          <p className="text-xs text-stone-500 mt-1.5 max-w-prose">
            Coche les champs à afficher dans le formulaire. Les champs obligatoires (prénom,
            nom, email) sont toujours présents.
          </p>
        </div>
        <FormConfigSection
          eventId={event.id}
          initial={{
            phoneEnabled: formCfg.phoneEnabled,
            birthDateEnabled: formCfg.birthDateEnabled,
            cityEnabled: formCfg.cityEnabled,
            sourceEnabled: formCfg.sourceEnabled,
          }}
        />
      </section>

      <section className="space-y-4 pt-4 border-t border-stone-200">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
            Notes dans les emails
          </h2>
          <p className="text-xs text-stone-500 mt-1.5 max-w-prose">
            Ajoute une note personnalisée à chaque type d&apos;email envoyé aux participantes.
            Le reste du contenu (boutons, infos pratiques) reste identique.
          </p>
        </div>
        <EmailConfigSection
          eventId={event.id}
          initial={{
            confirmationNote: emailCfg.confirmationNote ?? "",
            j7Note: emailCfg.j7Note ?? "",
            j2Note: emailCfg.j2Note ?? "",
            feedbackNote: emailCfg.feedbackNote ?? "",
          }}
        />
      </section>
    </div>
  );
}
