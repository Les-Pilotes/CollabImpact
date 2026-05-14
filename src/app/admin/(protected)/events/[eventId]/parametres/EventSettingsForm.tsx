"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEvent } from "../../actions";

type Initial = {
  name: string;
  type: string;
  date: string;
  time: string;
  endTime: string;
  address: string;
  capacity: number;
  description: string;
  replyToEmail: string;
  emailSignature: string;
};

type Props = {
  eventId: string;
  initial: Initial;
};

export default function EventSettingsForm({ eventId, initial }: Props) {
  const [form, setForm] = useState({
    name: initial.name,
    type: initial.type,
    date: initial.date,
    time: initial.time,
    endTime: initial.endTime,
    address: initial.address,
    capacity: String(initial.capacity),
    description: initial.description,
    replyToEmail: initial.replyToEmail,
    emailSignature: initial.emailSignature,
  });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await updateEvent(eventId, {
        name: form.name,
        type: form.type as "FEMININ" | "IMMERSION" | "ATELIER" | "IMPULSION",
        date: form.date,
        time: form.time,
        endTime: form.endTime || undefined,
        address: form.address,
        capacity: Number(form.capacity),
        description: form.description || undefined,
        replyToEmail: form.replyToEmail,
        emailSignature: form.emailSignature,
      });
      if (result.ok) {
        toast.success("Informations enregistrées");
        setIsDirty(false);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="space-y-5">
        <SectionHeader title="Identité" hint="Comment l'événement est annoncé aux participantes." />

        <div className="space-y-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="FEMININ">100% Féminin</option>
            <option value="IMMERSION">Immersion</option>
            <option value="ATELIER">Atelier</option>
            <option value="IMPULSION">Impulsion</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            placeholder="Ce qui rend cette session unique, ce que la participante va vivre…"
          />
          <p className="text-xs text-stone-400">
            Apparaît sur la page d&apos;inscription publique.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader title="Quand et où" hint="Date, créneau horaire et lieu physique." />

        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            className="max-w-xs"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="time">Début</Label>
            <Input
              id="time"
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              required
              className="w-32"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endTime">Fin</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={handleChange}
              className="w-32"
            />
            <p className="text-xs text-stone-400">Optionnel</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            placeholder="9 rue de Vaugirard, 75006 Paris"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="capacity">Capacité</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            value={form.capacity}
            onChange={handleChange}
            required
            className="w-32"
          />
          <p className="text-xs text-stone-400">
            Nombre maximum de participantes. L&apos;inscription se ferme automatiquement
            quand ce nombre est atteint.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeader
          title="Communications"
          hint="L&apos;adresse de réponse et la signature utilisées par défaut dans tous les emails."
        />

        <div className="space-y-1.5">
          <Label htmlFor="replyToEmail">Reply-To</Label>
          <Input
            id="replyToEmail"
            name="replyToEmail"
            type="email"
            value={form.replyToEmail}
            onChange={handleChange}
            placeholder="amadou@les-pilotes.fr"
            aria-invalid={!!errors.replyToEmail}
          />
          {errors.replyToEmail && (
            <p className="text-xs text-red-600">{errors.replyToEmail[0]}</p>
          )}
          <p className="text-xs text-stone-400">
            Si une participante répond, sa réponse arrive ici. Laisse vide pour utiliser
            l&apos;email par défaut.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="emailSignature">Signature</Label>
          <textarea
            id="emailSignature"
            name="emailSignature"
            value={form.emailSignature}
            onChange={handleChange}
            rows={4}
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            placeholder={"Léa & Amadou\nLes Pilotes\nhttps://les-pilotes.fr"}
          />
          <p className="text-xs text-stone-400">
            Apparaît en bas de chaque email. Peut contenir plusieurs lignes.
          </p>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        {isDirty ? (
          <p className="text-xs text-stone-500">Modifications non enregistrées</p>
        ) : (
          <p className="text-xs text-emerald-600">À jour</p>
        )}
        <div className="flex-1" />
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="pb-2 border-b border-stone-100">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {hint && <p className="text-xs text-stone-500 mt-1 max-w-prose">{hint}</p>}
    </div>
  );
}
