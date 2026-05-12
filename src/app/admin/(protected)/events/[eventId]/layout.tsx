import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventSubNav from "./EventSubNav";

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
    select: { id: true, name: true, status: true, type: true },
  });

  if (!event) notFound();

  return (
    <div className="space-y-6">
      {/* Event breadcrumb + sub-nav */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Link href="/admin/events" className="hover:text-stone-900 transition-colors">Evenements</Link>
          <span>/</span>
          <span className="text-stone-900 font-medium truncate max-w-[24ch]">{event.name}</span>
        </div>
        <EventSubNav eventId={eventId} />
      </div>
      {children}
    </div>
  );
}
