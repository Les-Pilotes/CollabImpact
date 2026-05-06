"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, CheckSquare, BarChart2, Terminal, ChevronLeft, ChevronRight } from "lucide-react";
import AdminSignOutButton from "./AdminSignOutButton";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/participantes", label: "Participantes", icon: Users },
  { href: "/admin/taches", label: "Tâches", icon: CheckSquare },
  { href: "/admin/impact", label: "Impact", icon: BarChart2 },
];

type Props = {
  adminName: string;
  adminEmail: string;
  devMode: boolean;
};

export default function Sidebar({ adminName, adminEmail, devMode }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={`hidden md:flex flex-col bg-stone-900 text-stone-100 shrink-0 transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className={`border-b border-stone-800 flex items-center ${collapsed ? "justify-center py-5" : "px-5 pt-6 pb-5"}`}>
        <Link href="/admin" className={`flex items-center gap-3 ${collapsed ? "" : ""}`}>
          <Image
            src="/logo-pilotes.png"
            alt="Les Pilotes"
            width={32}
            height={32}
            className="rounded-lg shrink-0"
          />
          {!collapsed && (
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">Les Pilotes</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-orange-500">admin</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-stone-800 text-white"
                  : "text-stone-400 hover:text-white hover:bg-stone-800/70"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-400" : ""}`} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-stone-800 p-3 space-y-2">
        {devMode && (
          <Link
            href="/admin/dev"
            title={collapsed ? "Console dev" : undefined}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-stone-500 hover:text-white hover:bg-stone-800/70 text-xs transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && "Console dev"}
          </Link>
        )}

        {!collapsed && (
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-xs text-stone-500 truncate">{adminEmail}</p>
            </div>
            <AdminSignOutButton />
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center">
            <AdminSignOutButton />
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-stone-500 hover:text-white hover:bg-stone-800/70 text-xs transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
