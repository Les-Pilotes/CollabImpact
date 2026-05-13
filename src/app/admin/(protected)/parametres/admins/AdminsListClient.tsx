"use client";

import { useState, useTransition } from "react";
import { AdminRole } from "@prisma/client";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { inviteAdmin, removeAdmin, updateAdminRole } from "./actions";

type AdminRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: AdminRole;
  createdAt: string;
};

type Props = {
  admins: AdminRow[];
  currentAdminId: string;
  isSuperAdmin: boolean;
};

function initials(a: AdminRow): string {
  const first = a.firstName?.[0] ?? a.email[0];
  const last = a.lastName?.[0] ?? "";
  return (first + last).toUpperCase();
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function AdminsListClient({ admins, currentAdminId, isSuperAdmin }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminRow | null>(null);

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Inviter un administrateur
          </Button>
        </div>
      )}

      {admins.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-200 overflow-hidden">
          {admins.map((admin) => (
            <AdminRow
              key={admin.id}
              admin={admin}
              isCurrent={admin.id === currentAdminId}
              canManage={isSuperAdmin}
              onRemove={() => setRemoveTarget(admin)}
            />
          ))}
        </div>
      )}

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <RemoveDialog
        target={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onDone={() => setRemoveTarget(null)}
      />
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function AdminRow({
  admin,
  isCurrent,
  canManage,
  onRemove,
}: {
  admin: AdminRow;
  isCurrent: boolean;
  canManage: boolean;
  onRemove: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const fullName =
    [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email.split("@")[0];

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as AdminRole;
    if (newRole === admin.role) return;
    startTransition(async () => {
      const result = await updateAdminRole(admin.id, newRole);
      if (result.ok) {
        toast.success(`Rôle mis à jour pour ${fullName}`);
      } else {
        toast.error(result.error);
        e.target.value = admin.role; // revert UI
      }
    });
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          admin.role === "SUPER_ADMIN"
            ? "bg-orange-100 text-orange-700"
            : "bg-stone-200 text-stone-700"
        }`}
      >
        {initials(admin)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-stone-900 truncate">
            {fullName}
            {isCurrent && (
              <span className="ml-2 text-[11px] font-medium text-orange-600">· toi</span>
            )}
          </p>
          {admin.role === "SUPER_ADMIN" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" /> Super
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 truncate">{admin.email}</p>
        <p className="text-[10px] text-stone-400 mt-0.5">
          Ajouté le {formatDate(admin.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canManage ? (
          <div className="relative">
            <select
              value={admin.role}
              onChange={handleRoleChange}
              disabled={isPending}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-stone-200 rounded-md bg-white hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer disabled:opacity-50"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super-admin</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
          </div>
        ) : (
          <span className="text-xs text-stone-500 font-medium px-2 py-1">
            {admin.role === "SUPER_ADMIN" ? "Super-admin" : "Admin"}
          </span>
        )}
        {canManage && !isCurrent && (
          <button
            type="button"
            onClick={onRemove}
            className="text-stone-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
            title="Retirer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Invite dialog ───────────────────────────────────────────────────────────

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "ADMIN" as AdminRole,
  });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await inviteAdmin(form);
      if (result.ok) {
        toast.success(`${form.firstName} ${form.lastName} ajouté·e — peut maintenant se connecter`);
        setForm({ email: "", firstName: "", lastName: "", role: "ADMIN" });
        onClose();
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un administrateur</DialogTitle>
          <DialogDescription>
            Cette personne pourra se connecter via magic link sur /admin/login dès qu&apos;elle
            sera ajoutée.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="Léa"
                required
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <p className="text-xs text-red-600">{errors.firstName[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="Bernard"
                required
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <p className="text-xs text-red-600">{errors.lastName[0]}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="lea.bernard@les-pilotes.fr"
              required
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as AdminRole }))}
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="ADMIN">Admin (peut piloter les events)</option>
              <option value="SUPER_ADMIN">Super-admin (peut aussi gérer les admins)</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Ajout…" : "Inviter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Remove dialog ───────────────────────────────────────────────────────────

function RemoveDialog({
  target,
  onClose,
  onDone,
}: {
  target: AdminRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  if (!target) return null;
  const fullName =
    [target.firstName, target.lastName].filter(Boolean).join(" ") || target.email;

  function handleRemove() {
    if (!target) return;
    startTransition(async () => {
      const result = await removeAdmin(target.id);
      if (result.ok) {
        toast.success(`${fullName} retiré·e des administrateurs`);
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirer {fullName} ?</DialogTitle>
          <DialogDescription>
            Cette personne ne pourra plus accéder au dashboard. Tu pourras la réinviter à tout
            moment si besoin — son historique d&apos;actions reste intact.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? "…" : "Retirer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
