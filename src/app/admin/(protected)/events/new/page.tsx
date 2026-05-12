"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EVENT_TYPES = [
  { value: "FEMININ", label: "Workshop 100% Feminin" },
  { value: "IMMERSION", label: "Immersion professionnelle" },
  { value: "ATELIER", label: "Atelier" },
  { value: "IMPULSION", label: "Impulsion" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "FEMININ",
    date: "",
    time: "09:30",
    address: "",
    capacity: "30",
    description: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // V2 : mock — en V3 on branche la server action
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    router.push("/admin/events");
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux evenements
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Nouvel evenement</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Informations</h2>

          <div className="space-y-2">
            <Label htmlFor="name">Nom de l&apos;evenement</Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Workshop 100% Feminin — Edition 7" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de programme</Label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Heure de debut</Label>
              <Input id="time" name="time" type="time" value={form.time} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Lieu / Adresse</Label>
            <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="15 rue de la Paix, Paris 75001" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Objectif de participantes</Label>
            <Input id="capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} />
            <p className="text-xs text-stone-400">Indicatif — pas une limite stricte</p>
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
              placeholder="Contexte et objectifs de l'edition..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Creation..." : "Creer l'evenement"}
          </Button>
          <Link href="/admin/events">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
