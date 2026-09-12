import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import WalkinQrDisplay from "./WalkinQrDisplay";

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
  return { title: event ? `QR Walk-in — ${event.name}` : "QR Walk-in" };
}

export default async function WalkinQrPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!event) notFound();

  return <WalkinQrDisplay eventId={event.id} eventName={event.name} />;
}
