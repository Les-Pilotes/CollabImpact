"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent } from "../actions";

export default function NewEventPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "09:30",
    address: "",
    capacity: "30",
    description: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    startTransition(async () => {
      const result = await createEvent({
        name: form.name,
        type: "FEMININ",
        date: form.date,
        time: form.time,
        address: form.address,
        capacity: Number(form.capacity),
        description: form.description || undefined,
      });
      if (result.ok) {
        toast.success("Événement créé en brouillon");
        router.push(`/admin/events/${result.data.id}`);
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Nouvel événement</h1>
        <p className="text-sm text-stone-500 mt-1">
          Crée d&apos;abord en brouillon — tu pourras publier les inscriptions quand tu seras
          prête.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
            Informations
          </h2>

          <div className="space-y-2">
            <Label htmlFor="name">Nom de l&apos;événement</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Workshop 100% Féminin — Édition 7"
              required
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-600">{fieldErrors.name[0]}</p>
            )}
            <p className="text-xs text-stone-400">
              Visible publiquement sur la page d&apos;inscription.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                aria-invalid={!!fieldErrors.date}
              />
              {fieldErrors.date && (
                <p className="text-xs text-red-600">{fieldErrors.date[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Heure de début</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={form.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Lieu / adresse</Label>
            <Input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="9 rue de Vaugirard, 75006 Paris"
              required
              aria-invalid={!!fieldErrors.address}
            />
            {fieldErrors.address && (
              <p className="text-xs text-red-600">{fieldErrors.address[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacité (places)</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={handleChange}
              aria-invalid={!!fieldErrors.capacity}
            />
            {fieldErrors.capacity && (
              <p className="text-xs text-red-600">{fieldErrors.capacity[0]}</p>
            )}
            <p className="text-xs text-stone-400">
              Sert à afficher la jauge de remplissage et le badge &quot;Complet&quot;.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Contexte et objectifs de l'édition…"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Création…" : "Créer l'événement"}
          </Button>
          <Link href="/admin/events">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
