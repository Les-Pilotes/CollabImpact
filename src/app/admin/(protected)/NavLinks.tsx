"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CheckSquare, BarChart2 } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Visibilité", icon: LayoutDashboard },
  { href: "/admin/participantes", label: "Participantes", icon: Users },
  { href: "/admin/taches", label: "Tâches", icon: CheckSquare },
  { href: "/admin/impact", label: "Impact", icon: BarChart2 },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-stone-800 text-white"
                : "text-stone-400 hover:text-white hover:bg-stone-800/70"
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-400" : ""}`}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
