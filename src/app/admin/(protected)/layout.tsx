import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Rocket, LayoutDashboard, Users, CheckSquare, Phone } from "lucide-react";
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
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-zinc-900 text-white shrink-0">
        <div className="p-5 border-b border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Les Pilotes</p>
              <p className="text-xs text-zinc-400">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-sm transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">
                {admin.firstName ?? admin.email.split("@")[0]}
              </p>
              <p className="text-xs text-zinc-500">{admin.email}</p>
            </div>
            <AdminSignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 text-white px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">Admin</span>
        </Link>
        <AdminSignOutButton />
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:p-8 p-4 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
