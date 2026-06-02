import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import EventSettingsForm from "./EventSettingsForm";
import FormulairesTab from "./FormulairesTab";
import CommunicationsTab from "./CommunicationsTab";
import ParametresShell from "./ParametresShell";

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
      endTime: true,
      address: true,
      capacity: true,
      description: true,
      status: true,
      replyToEmail: true,
      emailSignature: true,
      formConfig: true,
      feedbackConfig: true,
      emailConfig: true,
    },
  });

  if (!event) notFound();

  const dateISO = event.date.toISOString();
  const endTimeISO = event.endTime?.toISOString();

  const formCfg = event.formConfig ?? {
    phoneEnabled: true,
    birthDateEnabled: true,
    cityEnabled: true,
    sourceEnabled: true,
    niveauScolaireEnabled: true,
    regionEnabled: true,
    projetProEnabled: true,
    motivationEnabled: true,
    droitsImageEnabled: true,
    regimeEnabled: true,
    accessibiliteEnabled: true,
    commentaireEnabled: true,
  };

  const feedbackCfg = event.feedbackConfig ?? {
    satisfactionEnabled: true,
    highlightsEnabled: true,
    favoriteSpeakerEnabled: true,
    recommendEnabled: true,
  };

  const emailCfg = event.emailConfig;

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{event.name}</p>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Paramètres</h1>
      </header>

      <ParametresShell
        tabs={[
          { key: "informations", label: "Informations" },
          { key: "formulaires", label: "Formulaires" },
          { key: "communications", label: "Communications" },
        ]}
        initialTab="informations"
        panels={{
          informations: (
            <EventSettingsForm
              eventId={event.id}
              initial={{
                name: event.name,
                type: event.type,
                date: dateISO.slice(0, 10),
                time: dateISO.slice(11, 16),
                endTime: endTimeISO ? endTimeISO.slice(11, 16) : "",
                address: event.address,
                capacity: event.capacity,
                description: event.description ?? "",
                replyToEmail: event.replyToEmail ?? "",
                emailSignature: event.emailSignature ?? "",
              }}
            />
          ),
          formulaires: (
            <FormulairesTab
              eventId={event.id}
              formCfg={{
                phoneEnabled: formCfg.phoneEnabled,
                birthDateEnabled: formCfg.birthDateEnabled,
                cityEnabled: formCfg.cityEnabled,
                sourceEnabled: formCfg.sourceEnabled,
                niveauScolaireEnabled: formCfg.niveauScolaireEnabled,
                regionEnabled: formCfg.regionEnabled,
                projetProEnabled: formCfg.projetProEnabled,
                motivationEnabled: formCfg.motivationEnabled,
                droitsImageEnabled: formCfg.droitsImageEnabled,
                regimeEnabled: formCfg.regimeEnabled,
                accessibiliteEnabled: formCfg.accessibiliteEnabled,
                commentaireEnabled: formCfg.commentaireEnabled,
              }}
              feedbackCfg={{
                satisfactionEnabled: feedbackCfg.satisfactionEnabled,
                highlightsEnabled: feedbackCfg.highlightsEnabled,
                favoriteSpeakerEnabled: feedbackCfg.favoriteSpeakerEnabled,
                recommendEnabled: feedbackCfg.recommendEnabled,
              }}
            />
          ),
          communications: (
            <CommunicationsTab
              eventId={event.id}
              signature={event.emailSignature ?? ""}
              initial={{
                confirmationSubject: emailCfg?.confirmationSubject ?? "",
                confirmationBody: emailCfg?.confirmationBody ?? "",
                confirmationNote: emailCfg?.confirmationNote ?? "",
                j7Subject: emailCfg?.j7Subject ?? "",
                j7Body: emailCfg?.j7Body ?? "",
                j7Note: emailCfg?.j7Note ?? "",
                j2Subject: emailCfg?.j2Subject ?? "",
                j2Body: emailCfg?.j2Body ?? "",
                j2Note: emailCfg?.j2Note ?? "",
                feedbackSubject: emailCfg?.feedbackSubject ?? "",
                feedbackBody: emailCfg?.feedbackBody ?? "",
                feedbackNote: emailCfg?.feedbackNote ?? "",
              }}
            />
          ),
        }}
      />
    </div>
  );
}
