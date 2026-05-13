import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: { id: true },
  });

  if (!event) notFound();

  return <>{children}</>;
}
