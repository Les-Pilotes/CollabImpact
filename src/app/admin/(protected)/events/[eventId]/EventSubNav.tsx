"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Apercu", path: "" },
  { label: "Participantes", path: "/participantes" },
  { label: "Taches", path: "/taches" },
  { label: "Impact", path: "/impact" },
  { label: "Parametres", path: "/settings" },
];

export default function EventSubNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/admin/events/${eventId}`;

  return (
    <nav className="flex gap-1 border-b border-stone-200 -mb-px">
      {NAV_ITEMS.map(({ label, path }) => {
        const href = `${base}${path}`;
        const isActive = path === ""
          ? pathname === base
          : pathname.startsWith(`${base}${path}`);
        return (
          <Link
            key={path}
            href={href}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
