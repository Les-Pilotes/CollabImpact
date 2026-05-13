"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  Users,
  CheckSquare,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
  ArrowLeft,
} from "lucide-react";
import AdminSignOutButton from "./AdminSignOutButton";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Calendar;
  exact?: boolean;
};

const GLOBAL_NAV: NavItem[] = [
  { href: "/admin/events", label: "Evenements", icon: Calendar },
];

function eventNav(eventId: string): NavItem[] {
  const base = `/admin/events/${eventId}`;
  return [
    { href: base, label: "Aperçu", icon: Eye, exact: true },
    { href: `${base}/inscrites`, label: "Participantes", icon: Users },
    { href: `${base}/taches`, label: "Tâches", icon: CheckSquare },
    { href: `${base}/impact`, label: "Impact", icon: BarChart2 },
  ];
}

const EVENT_PATH_RE = /^\/admin\/events\/([^/]+)(?:\/|$)/;

function extractEventId(pathname: string): string | null {
  const match = pathname.match(EVENT_PATH_RE);
  if (!match) return null;
  const id = match[1];
  if (id === "new") return null;
  return id;
}

type Props = {
  adminName: string;
  adminEmail: string;
};

export default function Sidebar({ adminName, adminEmail }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const eventId = extractEventId(pathname);
  const inEventMode = !!eventId;
  const nav = inEventMode ? eventNav(eventId) : GLOBAL_NAV;

  return (
    <aside
      className={`hidden md:flex flex-col bg-stone-900 text-stone-100 shrink-0 transition-all duration-200 ${
        collapsed ? "w-[60px]" : "w-60"
      }`}
    >
      {/* Logo */}
      <div
        className={`border-b border-stone-800 flex items-center ${
          collapsed ? "justify-center py-5" : "px-5 pt-6 pb-5"
        }`}
      >
        <Link
          href="/admin/events"
          className={`flex items-center gap-3 ${collapsed ? "" : ""}`}
        >
          <Image
            src="/logo-pilotes.png"
            alt="Les Pilotes"
            width={32}
            height={32}
            className="rounded-lg shrink-0"
          />
          {!collapsed && (
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">
                Les Pilotes
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-orange-500">
                admin
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Event mode back link */}
      {inEventMode && !collapsed && (
        <Link
          href="/admin/events"
          className="flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.16em] text-stone-400 hover:text-white transition-colors border-b border-stone-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Tous les events
        </Link>
      )}
      {inEventMode && collapsed && (
        <Link
          href="/admin/events"
          title="Tous les events"
          className="flex justify-center py-3 text-stone-400 hover:text-white transition-colors border-b border-stone-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      )}

      {/* Nav */}
      <nav className="flex-1 flex flex-col px-2 py-4">
        <div className="space-y-0.5">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);

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
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-400" : ""}`}
                />
                {!collapsed && label}
              </Link>
            );
          })}
        </div>

        {/* Paramètres pinned to bottom (global or per-event) */}
        <div className="mt-auto pt-3 border-t border-stone-800">
          {inEventMode ? (
            <Link
              href={`/admin/events/${eventId}/parametres`}
              title={collapsed ? "Paramètres" : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                pathname.startsWith(`/admin/events/${eventId}/parametres`)
                  ? "bg-stone-800 text-white"
                  : "text-stone-400 hover:text-white hover:bg-stone-800/70"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!collapsed && "Paramètres"}
            </Link>
          ) : (
            <Link
              href="/admin/parametres"
              title={collapsed ? "Paramètres" : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                pathname.startsWith("/admin/parametres")
                  ? "bg-stone-800 text-white"
                  : "text-stone-400 hover:text-white hover:bg-stone-800/70"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!collapsed && "Paramètres"}
            </Link>
          )}
        </div>
      </nav>

      {/* Bottom: user + toggle */}
      <div className="border-t border-stone-800 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {adminName}
              </p>
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

        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-stone-500 hover:text-white hover:bg-stone-800/70 text-xs transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
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
