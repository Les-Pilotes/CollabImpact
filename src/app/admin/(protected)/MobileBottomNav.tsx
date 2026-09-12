"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  CheckSquare,
  BarChart2,
  Eye,
  Settings,
  Contact,
  Mic,
  ArrowLeft,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Calendar;
  exact?: boolean;
};

const GLOBAL_NAV: NavItem[] = [
  { href: "/admin/events", label: "Évènements", icon: Calendar },
  { href: "/admin/personnes", label: "Contacts", icon: Contact },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function eventNav(eventId: string): NavItem[] {
  const base = `/admin/events/${eventId}`;
  return [
    { href: "/admin/events", label: "Events", icon: ArrowLeft, exact: true },
    { href: `${base}/inscrites`, label: "Participantes", icon: Users },
    { href: `${base}/intervenantes`, label: "Intervenantes", icon: Mic },
    { href: `${base}/taches`, label: "Tâches", icon: CheckSquare },
    { href: `${base}/impact`, label: "Impact", icon: BarChart2 },
  ];
}

const EVENT_PATH_RE = /^\/admin\/events\/([^/]+)(?:\/|$)/;

function extractEventId(pathname: string): string | null {
  const match = pathname.match(EVENT_PATH_RE);
  if (!match) return null;
  if (match[1] === "new") return null;
  return match[1];
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const eventId = extractEventId(pathname);
  const inEventMode = !!eventId;
  const nav = inEventMode ? eventNav(eventId) : GLOBAL_NAV;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-stone-900 border-t border-stone-800 flex safe-bottom">
      {nav.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname.startsWith(href) && href !== "/admin/events";
        // Special case: back arrow is never "active"
        const showActive = label !== "Events" && isActive;

        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              showActive
                ? "text-orange-400"
                : "text-stone-500 hover:text-stone-200"
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${showActive ? "text-orange-400" : ""}`} />
            <span className="leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
