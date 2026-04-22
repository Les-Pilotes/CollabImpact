"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type Speaker = { firstName: string; lastName: string; role: string; email: string };

const THEMES = [
  "Tech & Numérique",
  "Finance & Gestion",
  "Santé & Social",
  "Culture & Médias",
  "Industrie & Énergie",
  "Commerce & Marketing",
  "Droit & Justice",
  "Architecture & Design",
  "Éducation & Formation",
  "Sport & Bien-être",
];

const STATUS_OPTIONS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "publie", label: "Publié" },
  { value: "complet", label: "Complet" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
];

interface Props {
  initialData?: {
    id?: string;
    name?: string;
    status?: string;
    companyName?: string;
    companySector?: string;
    companyAddress?: string;
    companyCity?: string;
    date?: string;
    durationMinutes?: number;
    maxCapacity?: number;
    themes?: string[];
    description?: string;
    program?: string;
    internalContact?: string;
    speakers?: Speaker[];
  };
}

export default function ImmersionForm({ initialData }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    status: initialData?.status ?? "brouillon",
    companyName: initialData?.companyName ?? "",
    companySector: initialData?.companySector ?? "",
    companyAddress: initialData?.companyAddress ?? "",
    companyCity: initialData?.companyCity ?? "",
    date: initialData?.date ?? "",
    durationMinutes: initialData?.durationMinutes ?? 240,
    maxCapacity: initialData?.maxCapacity ?? 15,
    themes: initialData?.themes ?? [],
    description: initialData?.description ?? "",
    program: initialData?.program ?? "",
    internalContact: initialData?.internalContact ?? "",
  });

  const [speakers, setSpeakers] = useState<Speaker[]>(
    initialData?.speakers ?? [],
  );

  function toggleTheme(theme: string) {
    setForm((f) => ({
      ...f,
      themes: f.themes.includes(theme)
        ? f.themes.filter((t) => t !== theme)
        : [...f.themes, theme],
    }));
  }

  function addSpeaker() {
    setSpeakers((s) => [
      ...s,
      { firstName: "", lastName: "", role: "", email: "" },
    ]);
  }

  function removeSpeaker(idx: number) {
    setSpeakers((s) => s.filter((_, i) => i !== idx));
  }

  function updateSpeaker(idx: number, field: keyof Speaker, value: string) {
    setSpeakers((s) =>
      s.map((speaker, i) =>
        i === idx ? { ...speaker, [field]: value } : speaker,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const payload = { ...form, speakers };
    const isEdit = !!initialData?.id;

    const res = await fetch(
      isEdit
        ? `/api/admin/immersions/${initialData.id}`
        : "/api/admin/immersions",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/immersions/${data.id ?? initialData?.id}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "Erreur lors de la sauvegarde");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Infos de base */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
        <div className="p-6 space-y-4">
          <h2 className="font-bold text-zinc-900">Informations générales</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom interne" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="Immersion SteelSeries Juin 2025"
              />
            </Field>
            <Field label="Statut">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Entreprise" required>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                className={inputClass}
                placeholder="SteelSeries"
              />
            </Field>
            <Field label="Secteur" required>
              <input
                type="text"
                required
                value={form.companySector}
                onChange={(e) => setForm((f) => ({ ...f, companySector: e.target.value }))}
                className={inputClass}
                placeholder="Gaming / Tech"
              />
            </Field>
            <Field label="Adresse">
              <input
                type="text"
                value={form.companyAddress}
                onChange={(e) => setForm((f) => ({ ...f, companyAddress: e.target.value }))}
                className={inputClass}
                placeholder="12 rue de la Paix"
              />
            </Field>
            <Field label="Ville" required>
              <input
                type="text"
                required
                value={form.companyCity}
                onChange={(e) => setForm((f) => ({ ...f, companyCity: e.target.value }))}
                className={inputClass}
                placeholder="Paris"
              />
            </Field>
            <Field label="Date & heure" required>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Durée (minutes)">
              <input
                type="number"
                min={30}
                max={1440}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) || 240 }))}
                className={inputClass}
              />
            </Field>
            <Field label="Capacité max">
              <input
                type="number"
                min={1}
                max={200}
                value={form.maxCapacity}
                onChange={(e) => setForm((f) => ({ ...f, maxCapacity: parseInt(e.target.value) || 15 }))}
                className={inputClass}
              />
            </Field>
            <Field label="Référent interne">
              <input
                type="text"
                value={form.internalContact}
                onChange={(e) => setForm((f) => ({ ...f, internalContact: e.target.value }))}
                className={inputClass}
                placeholder="Nom du référent Les Pilotes"
              />
            </Field>
          </div>

          {/* Themes */}
          <Field label="Thèmes">
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => toggleTheme(theme)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.themes.includes(theme)
                      ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)] font-semibold"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* Description & Programme */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-zinc-900">Description & Programme</h2>
        <Field label="Description publique">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={`${inputClass} resize-none`}
            placeholder="Présente l'entreprise et les objectifs de la journée…"
          />
        </Field>
        <Field label="Programme de la journée">
          <textarea
            rows={5}
            value={form.program}
            onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
            className={`${inputClass} resize-none`}
            placeholder="9h00 — Accueil&#10;9h30 — Présentation de l'entreprise&#10;…"
          />
        </Field>
      </div>

      {/* Speakers */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-zinc-900">Intervenants</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSpeaker}>
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
        {speakers.length === 0 && (
          <p className="text-sm text-zinc-400">
            Aucun intervenant ajouté. Clique sur &ldquo;Ajouter&rdquo; pour en ajouter un.
          </p>
        )}
        <div className="space-y-4">
          {speakers.map((speaker, idx) => (
            <div key={idx} className="border border-zinc-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700">Intervenant {idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeSpeaker(idx)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={speaker.firstName}
                  onChange={(e) => updateSpeaker(idx, "firstName", e.target.value)}
                  className={inputClass}
                  placeholder="Prénom"
                />
                <input
                  type="text"
                  value={speaker.lastName}
                  onChange={(e) => updateSpeaker(idx, "lastName", e.target.value)}
                  className={inputClass}
                  placeholder="Nom"
                />
                <input
                  type="text"
                  value={speaker.role}
                  onChange={(e) => updateSpeaker(idx, "role", e.target.value)}
                  className={inputClass}
                  placeholder="Poste / Rôle"
                />
                <input
                  type="email"
                  value={speaker.email}
                  onChange={(e) => updateSpeaker(idx, "email", e.target.value)}
                  className={inputClass}
                  placeholder="email@example.com (optionnel)"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="font-bold"
        disabled={status === "saving"}
      >
        {status === "saving"
          ? "Sauvegarde…"
          : initialData?.id
            ? "Mettre à jour"
            : "Créer l'immersion"}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:border-transparent text-sm bg-white";
