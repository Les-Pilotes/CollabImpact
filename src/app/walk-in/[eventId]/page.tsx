import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import WalkinForm from "./WalkinForm";

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
  return { title: event ? `${event.name} — Inscription sur place` : "Inscription sur place" };
}

export default async function WalkinPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!event) notFound();

  return <WalkinForm eventId={event.id} eventName={event.name} />;
}
