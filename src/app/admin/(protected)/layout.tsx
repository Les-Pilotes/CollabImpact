import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import AdminSignOutButton from "./AdminSignOutButton";
import Sidebar from "./Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = await requireAdmin();
  const devMode =
    process.env.ENABLE_DEV_PAGE === "true" ||
    process.env.NODE_ENV !== "production";

  return (
    <div className="h-screen bg-stone-50 flex overflow-hidden">
      {/* Sidebar — desktop */}
      <Sidebar
        adminName={admin.firstName ?? admin.email.split("@")[0]}
        adminEmail={admin.email}
        devMode={devMode}
      />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-stone-900 text-white px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src="/logo-pilotes.png" alt="Les Pilotes" width={24} height={24} className="rounded-md" />
          <span className="font-semibold text-sm tracking-tight">Les Pilotes</span>
        </Link>
        <AdminSignOutButton />
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:p-10 p-4 pt-16 md:pt-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
