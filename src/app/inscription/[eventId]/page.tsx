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
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null, status: { not: "brouillon" } },
    select: {
      id: true,
      name: true,
      date: true,
      address: true,
      capacity: true,
      description: true,
      status: true,
      formConfig: true,
      _count: { select: { enrollments: { where: { deletedAt: null } } } },
    },
  });

  if (!event) notFound();

  const now = new Date();
  const isFull = event._count.enrollments >= event.capacity;
  const isPast = event.date.getTime() < now.getTime() - 86400000;
  const isClosed = event.status === "termine" || isPast;

  return (
    <InscriptionForm
      event={{
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        address: event.address,
        capacity: event.capacity,
        description: event.description,
        currentEnrolled: event._count.enrollments,
        isFull,
        isClosed,
      }}
      formConfig={event.formConfig}
    />
  );
}
