import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import InscriptionForm from "./InscriptionForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: { name: true },
  });
  return {
    title: event ? `${event.name} — Inscription` : "Inscription",
  };
}

export default async function InscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ resume?: string }>;
}) {
  const { eventId } = await params;
  const { resume } = await searchParams;
  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null, status: { not: "brouillon" } },
    select: {
      id: true,
      name: true,
      date: true,
      address: true,
      description: true,
      status: true,
      formConfig: true,
    },
  });

  if (!event) notFound();

  // Capacity is an admin-side target (alerts admins when reached) — never a
  // public-facing gate. Inscriptions stay open in all cases to anticipate
  // late drop-outs and avoid frustrating the user.
  const now = new Date();
  const isPast = event.date.getTime() < now.getTime() - 86400000;
  const isClosed = event.status === "termine" || isPast;

  return (
    <InscriptionForm
      event={{
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        address: event.address,
        description: event.description,
        isClosed,
      }}
      formConfig={event.formConfig}
      resumeToken={resume ?? null}
    />
  );
}
