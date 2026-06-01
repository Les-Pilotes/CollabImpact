"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { NotificationItem } from "@/lib/notifications/queries";
import {
  fetchRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./actions";

const TYPE_FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: "Tous" },
  { value: "enrollment.created", label: "Inscriptions" },
  { value: "event.capacity_reached", label: "Complets" },
  { value: "event.status_changed", label: "Statuts" },
  { value: "feedback.received", label: "Feedbacks" },
];

export default function NotificationsClient({
  initialItems,
}: {
  initialItems: NotificationItem[];
}) {
  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [filter, setFilter] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = filter ? items.filter((i) => i.type === filter) : items;
  const hasUnread = items.some((i) => !i.read);

  async function refresh() {
    const fresh = await fetchRecentNotifications(100);
    setItems(fresh);
  }

  function onMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      await refresh();
    });
  }

  function onItemClick(item: NotificationItem) {
    if (!item.read) {
      startTransition(async () => {
        await markNotificationRead(item.id);
        await refresh();
      });
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Activité récente de ton organisation (30 derniers jours).
          </p>
        </div>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-700 bg-white ring-1 ring-stone-200 hover:bg-stone-50 transition-colors"
          >
            <Check className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value ?? "all"}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-white ring-1 ring-stone-200 p-12 text-center">
          <p className="text-sm text-stone-500">
            {filter ? "Aucune notification de ce type." : "Tu es à jour ✨"}
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl bg-white ring-1 ring-stone-200 divide-y divide-stone-100 overflow-hidden">
          {visible.map((item) => (
            <li key={item.id}>
              <NotifRow item={item} onClick={() => onItemClick(item)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotifRow({
  item,
  onClick,
}: {
  item: NotificationItem;
  onClick: () => void;
}) {
  const body = (
    <div className="flex items-start gap-3 px-4 py-3">
      {!item.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" aria-hidden />
      )}
      <div className={`flex-1 min-w-0 ${item.read ? "pl-5" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-stone-900">{item.title}</p>
          <span className="shrink-0 text-xs text-stone-400">
            {formatRelative(item.createdAt)}
          </span>
        </div>
        {item.body && (
          <p className="text-xs text-stone-500 mt-0.5">{item.body}</p>
        )}
      </div>
    </div>
  );

  if (item.eventId) {
    return (
      <Link
        href={`/admin/events/${item.eventId}`}
        onClick={onClick}
        className={`block hover:bg-stone-50 transition-colors ${
          item.read ? "" : "bg-orange-50/40"
        }`}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full text-left hover:bg-stone-50 transition-colors ${
        item.read ? "" : "bg-orange-50/40"
      }`}
    >
      {body}
    </button>
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
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
