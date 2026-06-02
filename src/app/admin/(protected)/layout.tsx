import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import AdminSignOutButton from "./AdminSignOutButton";
import Sidebar from "./Sidebar";
import NotificationBell from "./_components/NotificationBell";
import {
  countUnread,
  listNotifications,
} from "@/lib/notifications/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = await requireAdmin();

  const [initialUnread, initialItems] = await Promise.all([
    countUnread(admin.organisationId, admin.id),
    listNotifications(admin.organisationId, admin.id, { limit: 10 }),
  ]);

  const bell = (
    <NotificationBell initialUnread={initialUnread} initialItems={initialItems} />
  );

  return (
    <div className="h-screen bg-stone-50 flex overflow-hidden">
      {/* Sidebar — desktop */}
      <Sidebar
        adminName={admin.firstName ?? admin.email.split("@")[0]}
        adminEmail={admin.email}
      />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-stone-900 text-white px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/logo-pilotes.png" alt="Les Pilotes" width={24} height={24} className="rounded-md" />
          <span className="font-semibold text-sm tracking-tight">Les Pilotes</span>
        </Link>
        <div className="flex items-center gap-2">
          {bell}
          <AdminSignOutButton />
        </div>
      </div>

      {/* Desktop floating bell */}
      <div className="hidden md:block fixed top-4 right-6 z-40">{bell}</div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:p-10 p-4 pt-16 md:pt-10 overflow-y-auto">
        {children}
      </main>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
