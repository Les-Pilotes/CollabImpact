import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { LayoutDashboard, Users, CheckSquare, Phone, Terminal } from "lucide-react";
import AdminSignOutButton from "./AdminSignOutButton";

const NAV = [
  { href: "/admin", label: "Visibilité", icon: LayoutDashboard },
  { href: "/admin/participants", label: "Participantes", icon: Users },
  { href: "/admin/appels", label: "Appels", icon: Phone },
  { href: "/admin/taches", label: "Tâches", icon: CheckSquare },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = await requireAdmin();

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-stone-900 text-stone-100 shrink-0">
        <div className="px-5 pt-6 pb-5 border-b border-stone-800">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-semibold text-base tracking-tight text-white">Les Pilotes</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone-500">admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-stone-400 hover:text-white hover:bg-stone-800/70 text-sm transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-3">
          {(process.env.ENABLE_DEV_PAGE === "true" || process.env.NODE_ENV !== "production") && (
            <Link
              href="/admin/dev"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-stone-500 hover:text-white hover:bg-stone-800/70 text-xs transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              Console dev
            </Link>
          )}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {admin.firstName ?? admin.email.split("@")[0]}
              </p>
              <p className="text-xs text-stone-500 truncate">{admin.email}</p>
            </div>
            <AdminSignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-stone-900 text-white px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="font-semibold text-sm tracking-tight">Les Pilotes</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">admin</span>
        </Link>
        <AdminSignOutButton />
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:p-10 p-4 pt-16 md:pt-10">
        {children}
      </main>
    </div>
  );
}
