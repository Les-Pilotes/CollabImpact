"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, Check, Mail, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/Toggle";
import type { NotificationConfig } from "@/lib/notifications/config";
import { upsertNotificationConfig } from "./actions";

export type AdminOption = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  validated: boolean; // lastLoginAt !== null
};

export default function NotificationsTab({
  eventId,
  admins,
  initial,
}: {
  eventId: string;
  admins: AdminOption[];
  initial: NotificationConfig;
}) {
  const [cfg, setCfg] = useState<NotificationConfig>(initial);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { validatedAdmins, pendingAdmins } = useMemo(() => {
    const v: AdminOption[] = [];
    const p: AdminOption[] = [];
    for (const a of admins) (a.validated ? v : p).push(a);
    return { validatedAdmins: v, pendingAdmins: p };
  }, [admins]);

  function toggleEnabled() {
    setCfg((prev) => ({ ...prev, newEnrollmentEnabled: !prev.newEnrollmentEnabled }));
    setIsDirty(true);
  }

  function toggleRecipient(id: string) {
    setCfg((prev) => {
      const has = prev.recipientAdminIds.includes(id);
      return {
        ...prev,
        recipientAdminIds: has
          ? prev.recipientAdminIds.filter((x) => x !== id)
          : [...prev.recipientAdminIds, id],
      };
    });
    setIsDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertNotificationConfig(eventId, cfg);
      if (result.ok) {
        toast.success("Notifications mises à jour");
        setIsDirty(false);
      } else {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  const noValidatedAdmins = validatedAdmins.length === 0;

  return (
    <section className="space-y-10 max-w-2xl">
      {/* Toggle: master switch */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900">Alertes email</h2>
        <p className="text-sm text-stone-500 mt-1">
          Préviens l&apos;équipe par email à chaque nouvelle inscription sur cet
          événement.
        </p>

        <div className="mt-5 rounded-lg border border-stone-200 bg-white p-5 flex items-start gap-4">
          <div
            className="w-9 h-9 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"
            aria-hidden
          >
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900">
              Nouvelle inscription
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              Envoyé immédiatement aux destinataires sélectionnés ci-dessous.
            </p>
          </div>
          <Toggle
            checked={cfg.newEnrollmentEnabled}
            onChange={toggleEnabled}
            label="Activer la notification de nouvelle inscription"
            className="mt-0.5"
          />
        </div>
      </div>

      {/* Recipients */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900">Destinataires</h2>
        <p className="text-sm text-stone-500 mt-1">
          Coche les membres de l&apos;équipe à prévenir. Seules les personnes
          déjà connectées au dashboard peuvent être sélectionnées.
        </p>

        {noValidatedAdmins ? (
          <div className="mt-5 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
            <Mail className="w-6 h-6 mx-auto text-stone-400 mb-2" />
            <p className="text-sm text-stone-700">
              Aucun membre validé pour le moment
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Un membre est validé après sa première connexion au dashboard.
              Invite ton équipe depuis Paramètres → Administrateurs.
            </p>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-stone-100 border border-stone-200 rounded-lg bg-white overflow-hidden">
            {validatedAdmins.map((a) => {
              const checked = cfg.recipientAdminIds.includes(a.id);
              return (
                <li key={a.id}>
                  <label
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      checked ? "bg-orange-50/40" : "hover:bg-stone-50"
                    } ${!cfg.newEnrollmentEnabled ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`relative w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked
                          ? "bg-stone-900 border-stone-900"
                          : "border-stone-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={!cfg.newEnrollmentEnabled}
                      onChange={() => toggleRecipient(a.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {fullName(a)}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{a.email}</p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {pendingAdmins.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400 mb-2">
              Invités, pas encore connectés
            </p>
            <ul className="divide-y divide-stone-100 border border-stone-200 rounded-lg bg-stone-50/60 overflow-hidden">
              {pendingAdmins.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-3 text-stone-500"
                >
                  <UserX className="w-4 h-4 shrink-0 text-stone-400" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{fullName(a)}</p>
                    <p className="text-xs text-stone-400 truncate">{a.email}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 shrink-0">
                    En attente
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-stone-500 mt-2">
              Ces personnes recevront les alertes dès leur première connexion,
              si tu les ajoutes à la liste plus tard.
            </p>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
        {isDirty ? (
          <p className="text-xs text-stone-500">Modifications non enregistrées</p>
        ) : (
          <p className="text-xs text-emerald-600">À jour</p>
        )}
        <div className="flex-1" />
        <Button size="sm" onClick={handleSave} disabled={isPending || !isDirty}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </section>
  );
}

function fullName(a: AdminOption): string {
  const name = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
  return name || a.email;
}
