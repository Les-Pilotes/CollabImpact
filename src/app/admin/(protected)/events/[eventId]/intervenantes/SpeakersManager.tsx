"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Briefcase, Building2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { createSpeaker, updateSpeaker, deleteSpeaker } from "./actions";

type SpeakerStatus = "invitee" | "brief_envoye" | "confirmee";

type Speaker = {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  company: string | null;
  domain: string | null;
  bio: string | null;
  photoUrl: string | null;
  status: SpeakerStatus;
};

type Props = {
  eventId: string;
  speakers: Speaker[];
};

const STATUS_LABELS: Record<SpeakerStatus, { label: string; cls: string }> = {
  invitee: { label: "Invitée", cls: "bg-stone-100 text-stone-600" },
  brief_envoye: { label: "Brief envoyé", cls: "bg-amber-100 text-amber-700" },
  confirmee: { label: "Confirmée", cls: "bg-emerald-100 text-emerald-700" },
};

function initials(s: { firstName: string; lastName: string }): string {
  return `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase();
}

export default function SpeakersManager({ eventId, speakers }: Props) {
  const [editing, setEditing] = useState<Speaker | null>(null);
  const [creating, setCreating] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Speaker | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete(speaker: Speaker) {
    startTransition(async () => {
      const res = await deleteSpeaker(speaker.id, eventId);
      if (res.ok) {
        toast.success("Intervenante supprimée");
        setRemoveTarget(null);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une intervenante
        </Button>
      </div>

      {speakers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 rounded-lg">
          <p className="text-stone-500 text-sm">
            Aucune intervenante pour cet événement.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 mt-4"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-4 h-4" />
            Ajouter la première
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {speakers.map((s) => {
            const status = STATUS_LABELS[s.status];
            return (
              <div
                key={s.id}
                className="rounded-lg border border-stone-200 bg-white p-4 flex gap-3"
              >
                {s.photoUrl ? (
                  <Image
                    src={s.photoUrl}
                    alt={`${s.firstName} ${s.lastName}`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold shrink-0"
                    aria-hidden
                  >
                    {initials(s)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-stone-900 truncate">
                      {s.firstName} {s.lastName}
                    </p>
                    <span
                      className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  {s.jobTitle && (
                    <p className="text-xs text-stone-500 mt-0.5 inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      {s.jobTitle}
                    </p>
                  )}
                  {s.company && (
                    <p className="text-xs text-stone-500 mt-0.5 inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 shrink-0" />
                      {s.company}
                    </p>
                  )}
                  {s.domain && (
                    <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                      {s.domain}
                    </span>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setEditing(s)}
                      className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(s)}
                      className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <SpeakerDialog
        eventId={eventId}
        open={creating || editing !== null}
        speaker={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      {/* Delete confirmation */}
      <Dialog
        open={removeTarget !== null}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;intervenante ?</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `${removeTarget.firstName} ${removeTarget.lastName} sera retirée de cet événement.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => removeTarget && handleDelete(removeTarget)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SpeakerDialog({
  eventId,
  open,
  speaker,
  onClose,
}: {
  eventId: string;
  open: boolean;
  speaker: Speaker | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isEdit = speaker !== null;

  function onSubmit(formData: FormData) {
    const input = {
      eventId,
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      jobTitle: String(formData.get("jobTitle") ?? ""),
      company: String(formData.get("company") ?? ""),
      domain: String(formData.get("domain") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      photoUrl: String(formData.get("photoUrl") ?? ""),
      status: String(formData.get("status") ?? "invitee") as SpeakerStatus,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateSpeaker(speaker!.id, input)
        : await createSpeaker(input);
      if (res.ok) {
        toast.success(isEdit ? "Intervenante modifiée" : "Intervenante ajoutée");
        onClose();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'intervenante" : "Nouvelle intervenante"}
          </DialogTitle>
          <DialogDescription>
            Renseigne au minimum le prénom et le nom.
          </DialogDescription>
        </DialogHeader>

        {/* key forces a fresh uncontrolled form when switching target */}
        <form key={speaker?.id ?? "new"} action={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                defaultValue={speaker?.firstName ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                name="lastName"
                required
                defaultValue={speaker?.lastName ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="jobTitle">Poste</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                defaultValue={speaker?.jobTitle ?? ""}
                placeholder="Développeuse, RH…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                name="company"
                defaultValue={speaker?.company ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="domain">Domaine</Label>
              <Input
                id="domain"
                name="domain"
                defaultValue={speaker?.domain ?? ""}
                placeholder="Informatique, Marketing…"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                name="status"
                defaultValue={speaker?.status ?? "invitee"}
                className="w-full h-10 px-3 text-sm rounded-md border border-stone-200 bg-white focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              >
                <option value="invitee">Invitée</option>
                <option value="brief_envoye">Brief envoyé</option>
                <option value="confirmee">Confirmée</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="photoUrl">Photo (URL)</Label>
            <Input
              id="photoUrl"
              name="photoUrl"
              type="url"
              defaultValue={speaker?.photoUrl ?? ""}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={speaker?.bio ?? ""}
              className="w-full px-3 py-2 text-sm rounded-md border border-stone-200 bg-white focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
