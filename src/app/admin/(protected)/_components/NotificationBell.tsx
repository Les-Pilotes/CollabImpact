"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import {
  fetchRecentNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../notifications/actions";
import type { NotificationItem } from "@/lib/notifications/queries";

const POLL_INTERVAL_MS = 60_000;
const DROPDOWN_LIMIT = 10;

type Props = {
  initialUnread: number;
  initialItems: NotificationItem[];
};

export default function NotificationBell({ initialUnread, initialItems }: Props) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [u, list] = await Promise.all([
        fetchUnreadCount(),
        fetchRecentNotifications(DROPDOWN_LIMIT),
      ]);
      setUnread(u);
      setItems(list);
    } catch {
      // Silently swallow — polling is best-effort.
    }
  }, []);

  // Poll for updates while the tab is visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function onItemClick(item: NotificationItem) {
    if (!item.read) {
      startTransition(async () => {
        await markNotificationRead(item.id);
        await refresh();
      });
    }
    setOpen(false);
    if (item.eventId) {
      router.push(`/admin/events/${item.eventId}`);
    }
  }

  function onMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      await refresh();
    });
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
        aria-label={
          unread > 0 ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications"
        }
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-stone-50 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-1rem)] origin-top-right overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-stone-200 z-50">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-semibold text-stone-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900"
              >
                <Check className="h-3 w-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>
          <ul className="max-h-[28rem] overflow-y-auto divide-y divide-stone-100">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <p className="text-sm text-stone-500">Tu es à jour ✨</p>
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                      item.read ? "" : "bg-orange-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-stone-900 line-clamp-2">
                        {item.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-stone-400">
                        {formatRelative(item.createdAt)}
                      </span>
                    </div>
                    {item.body && (
                      <p className="text-xs text-stone-500 line-clamp-2">{item.body}</p>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-stone-100 px-4 py-2 text-center">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Tout voir →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
