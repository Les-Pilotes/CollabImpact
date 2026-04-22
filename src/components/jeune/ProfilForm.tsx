"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  birthDate: Date | null;
  gender: string | null;
  city: string | null;
  dietary: string;
  dietaryOther: string | null;
  educationLevel: string | null;
  field: string | null;
  institution: string | null;
  projectStatus: string | null;
  projectDescription: string | null;
  interestAreas: string[];
  preferredEnvironment: string | null;
  layer2UpdatedAt: Date | null;
};

const INTEREST_OPTIONS = [
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

const DIETARY_OPTIONS = [
  { value: "aucun", label: "Aucune" },
  { value: "vegetarien", label: "Végétarien" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "casher", label: "Casher" },
  { value: "sans_gluten", label: "Sans gluten" },
  { value: "sans_porc", label: "Sans porc" },
  { value: "autre", label: "Autre" },
];

const EDUCATION_OPTIONS = [
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
  { value: "bac", label: "Bac" },
  { value: "post_bac_1", label: "Bac +1" },
  { value: "post_bac_2", label: "Bac +2" },
  { value: "post_bac_3", label: "Bac +3" },
  { value: "post_bac_4_5", label: "Bac +4/5" },
  { value: "hors_cursus", label: "Hors cursus" },
];

const PROJECT_STATUS_OPTIONS = [
  { value: "aucun", label: "Je ne sais pas encore" },
  { value: "en_construction", label: "J'ai des pistes" },
  { value: "defini", label: "Mon projet est défini" },
];

const ENVIRONMENT_OPTIONS = [
  { value: "startup", label: "Startup" },
  { value: "grand_groupe", label: "Grand groupe" },
  { value: "public", label: "Secteur public" },
  { value: "associatif", label: "Associatif / ONG" },
];

const GENDER_OPTIONS = [
  { value: "femme", label: "Féminin" },
  { value: "homme", label: "Masculin" },
  { value: "autre", label: "Autre" },
  { value: "non_precise", label: "Je préfère ne pas préciser" },
];

export default function ProfilForm({ user }: { user: User }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    birthDate: user.birthDate
      ? new Date(user.birthDate).toISOString().split("T")[0]
      : "",
    gender: user.gender ?? "",
    city: user.city ?? "",
    dietary: user.dietary ?? "aucun",
    dietaryOther: user.dietaryOther ?? "",
    educationLevel: user.educationLevel ?? "",
    field: user.field ?? "",
    institution: user.institution ?? "",
    projectStatus: user.projectStatus ?? "aucun",
    projectDescription: user.projectDescription ?? "",
    interestAreas: user.interestAreas ?? [],
    preferredEnvironment: user.preferredEnvironment ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleInterest(area: string) {
    setForm((f) => ({
      ...f,
      interestAreas: f.interestAreas.includes(area)
        ? f.interestAreas.filter((a) => a !== area)
        : [...f.interestAreas, area],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const res = await fetch("/api/utilisateurs/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Couche 1 */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
        <div className="p-6">
          <h2 className="font-bold text-zinc-900 mb-4">Informations personnelles</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Prénom" required>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className={inputClass}
                placeholder="Prénom"
              />
            </Field>
            <Field label="Nom">
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className={inputClass}
                placeholder="Nom de famille"
              />
            </Field>
            <Field label="Téléphone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
                placeholder="06 XX XX XX XX"
              />
            </Field>
            <Field label="Date de naissance">
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Genre">
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ville">
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
                placeholder="Paris, Lyon, Marseille…"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Préférence alimentaire">
                <select
                  value={form.dietary}
                  onChange={(e) => set("dietary", e.target.value)}
                  className={inputClass}
                >
                  {DIETARY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {form.dietary === "autre" && (
                <input
                  type="text"
                  value={form.dietaryOther}
                  onChange={(e) => set("dietaryOther", e.target.value)}
                  className={`${inputClass} mt-2`}
                  placeholder="Précise ta préférence alimentaire"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Couche 2 */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
            <h2 className="font-bold text-zinc-900">Mon parcours & projet</h2>
            {user.layer2UpdatedAt && (
              <span className="text-xs text-zinc-400">
                Mis à jour le{" "}
                {new Date(user.layer2UpdatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Niveau d'études">
              <select
                value={form.educationLevel}
                onChange={(e) => set("educationLevel", e.target.value)}
                className={inputClass}
              >
                <option value="">— Sélectionner —</option>
                {EDUCATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Filière">
              <input
                type="text"
                value={form.field}
                onChange={(e) => set("field", e.target.value)}
                className={inputClass}
                placeholder="Informatique, Droit, Commerce…"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Établissement">
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => set("institution", e.target.value)}
                  className={inputClass}
                  placeholder="Lycée, IUT, Université…"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Ton projet d'orientation">
                <select
                  value={form.projectStatus}
                  onChange={(e) => set("projectStatus", e.target.value)}
                  className={inputClass}
                >
                  {PROJECT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              {form.projectStatus !== "aucun" && (
                <textarea
                  rows={3}
                  value={form.projectDescription}
                  onChange={(e) => set("projectDescription", e.target.value)}
                  className={`${inputClass} mt-2 resize-none`}
                  placeholder="Décris ton projet en quelques mots…"
                />
              )}
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-zinc-700 mb-2">
                Secteurs qui t&apos;intéressent
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleInterest(area)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      form.interestAreas.includes(area)
                        ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)] font-semibold"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Field label="Environnement de travail préféré">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ENVIRONMENT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set("preferredEnvironment", o.value)}
                      className={`text-xs px-3 py-2 rounded-xl border transition-all text-center ${
                        form.preferredEnvironment === o.value
                          ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)] font-semibold"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {status === "saved" && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            Profil mis à jour avec succès !
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600">
            Une erreur est survenue. Réessaie.
          </p>
        )}
        {status !== "saved" && status !== "error" && <div />}
        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="font-bold"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Enregistrement…" : "Enregistrer mon profil"}
        </Button>
      </div>
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
