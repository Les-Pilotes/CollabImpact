import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PageHeader from "../../../PageHeader";
import SpeakersManager from "./SpeakersManager";

export const metadata = { title: "Intervenantes" };

export default async function IntervenantesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { admin } = await requireAdmin();
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organisationId: admin.organisationId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!event) notFound();

  const speakers = await prisma.speaker.findMany({
    where: { eventId, organisationId: admin.organisationId, deletedAt: null },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      company: true,
      domain: true,
      bio: true,
      photoUrl: true,
      status: true,
    },
  });

  return (
    <div className="flex flex-col h-full -m-4 md:-m-10 overflow-hidden">
      <PageHeader
        title="Intervenantes"
        subtitle={`${speakers.length} intervenante${speakers.length !== 1 ? "s" : ""}`}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <SpeakersManager eventId={eventId} speakers={speakers} />
      </div>
    </div>
  );
}
