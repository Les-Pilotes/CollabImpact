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
        address: form.address,
        capacity: Number(form.capacity),
        description: form.description || undefined,
        replyToEmail: form.replyToEmail,
        emailSignature: form.emailSignature,
      });
      if (result.ok) {
        toast.success("Paramètres enregistrés");
        setIsDirty(false);
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Informations</h2>

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time">Heure</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
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
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description (optionnel)</Label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-stone-200">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Communications</h2>
          <p className="text-xs text-stone-500 mt-1.5 max-w-prose">
            Personnalisation des emails envoyés aux participantes (confirmation, J-7, J-2,
            feedback).
          </p>
        </div>

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
            Si une participante répond à un email, sa réponse arrive ici. Laisse vide pour
            utiliser l&apos;email par défaut.
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

      <div className="flex items-center gap-3 pt-6 border-t border-stone-200">
        {isDirty ? (
          <p className="text-xs text-stone-500">Modifications non enregistrées</p>
        ) : (
          <p className="text-xs text-emerald-600">✓ À jour</p>
        )}
        <div className="flex-1" />
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
