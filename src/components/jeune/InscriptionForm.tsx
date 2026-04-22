"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
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
};

interface Props {
  immersionId: string;
  user: User;
  steps: 1 | 2 | 3;
}

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

const SOURCE_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "bouche_a_oreille", label: "Bouche à oreille" },
  { value: "classe", label: "Ma classe" },
  { value: "conseiller", label: "Un conseiller" },
  { value: "autre", label: "Autre" },
];

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

export default function InscriptionForm({ immersionId, user, steps }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Determine actual step indices
  // steps=3: step1=Couche1, step2=Couche2, step3=Couche3
  // steps=2: step1=Couche2, step2=Couche3
  // steps=1: step1=Couche3
  const showCouche1 = steps === 3;
  const showCouche2 = steps >= 2;

  // Couche 1
  const [c1, setC1] = useState({
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
  });

  // Couche 2
  const [c2, setC2] = useState({
    educationLevel: user.educationLevel ?? "",
    field: user.field ?? "",
    institution: user.institution ?? "",
    projectStatus: user.projectStatus ?? "aucun",
    projectDescription: user.projectDescription ?? "",
    interestAreas: user.interestAreas ?? [],
    preferredEnvironment: user.preferredEnvironment ?? "",
  });

  // Couche 3 (immersion-specific)
  const [c3, setC3] = useState({
    source: "autre",
    comment: "",
  });

  function toggleInterest(area: string) {
    setC2((prev) => ({
      ...prev,
      interestAreas: prev.interestAreas.includes(area)
        ? prev.interestAreas.filter((a) => a !== area)
        : [...prev.interestAreas, area],
    }));
  }

  function getStepTitle() {
    if (steps === 1) return "Confirmation d'inscription";
    if (steps === 2) {
      return step === 1 ? "Ton parcours" : "Confirmation d'inscription";
    }
    // steps === 3
    if (step === 1) return "Tes informations";
    if (step === 2) return "Ton parcours";
    return "Confirmation d'inscription";
  }

  function isLayer1Step() {
    return showCouche1 && step === 1;
  }

  function isLayer2Step() {
    if (steps === 3) return step === 2;
    if (steps === 2) return step === 1;
    return false;
  }

  function isLayer3Step() {
    return step === steps;
  }

  async function handleNext() {
    if (step < steps) {
      setStep((s) => s + 1);
    } else {
      await handleSubmit();
    }
  }

  async function handleSubmit() {
    setStatus("loading");

    const res = await fetch("/api/inscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        immersionId,
        ...(showCouche1 ? { couche1: c1 } : {}),
        ...(showCouche2 ? { couche2: c2 } : {}),
        couche3: c3,
      }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const data = await res.json().catch(() => ({}));
      console.error("Inscription error:", data);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">
          Inscription confirmée ! 🚀
        </h2>
        <p className="text-zinc-500 mb-6">
          Tu vas recevoir un email de confirmation. On te recontacte
          quelques jours avant l&apos;immersion.
        </p>
        <Button
          variant="gradient"
          onClick={() => router.push("/me")}
          className="font-bold"
        >
          Voir mon espace
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
      <div className="p-6 sm:p-8">
        <h2 className="font-bold text-lg text-zinc-900 mb-6">
          {getStepTitle()}
          {steps > 1 && (
            <span className="ml-2 text-sm font-normal text-zinc-400">
              Étape {step}/{steps}
            </span>
          )}
        </h2>

        {/* COUCHE 1 */}
        {isLayer1Step() && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Prénom" required>
                <input
                  type="text"
                  required
                  value={c1.firstName}
                  onChange={(e) => setC1((p) => ({ ...p, firstName: e.target.value }))}
                  className={inputClass}
                  placeholder="Prénom"
                />
              </Field>
              <Field label="Nom">
                <input
                  type="text"
                  value={c1.lastName}
                  onChange={(e) => setC1((p) => ({ ...p, lastName: e.target.value }))}
                  className={inputClass}
                  placeholder="Nom de famille"
                />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  value={c1.phone}
                  onChange={(e) => setC1((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="06 XX XX XX XX"
                />
              </Field>
              <Field label="Date de naissance">
                <input
                  type="date"
                  value={c1.birthDate}
                  onChange={(e) => setC1((p) => ({ ...p, birthDate: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Ville">
                <input
                  type="text"
                  value={c1.city}
                  onChange={(e) => setC1((p) => ({ ...p, city: e.target.value }))}
                  className={inputClass}
                  placeholder="Paris, Lyon…"
                />
              </Field>
              <Field label="Préférence alimentaire">
                <select
                  value={c1.dietary}
                  onChange={(e) => setC1((p) => ({ ...p, dietary: e.target.value }))}
                  className={inputClass}
                >
                  {DIETARY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            {c1.dietary === "autre" && (
              <input
                type="text"
                value={c1.dietaryOther}
                onChange={(e) => setC1((p) => ({ ...p, dietaryOther: e.target.value }))}
                className={inputClass}
                placeholder="Précise ta préférence"
              />
            )}
          </div>
        )}

        {/* COUCHE 2 */}
        {isLayer2Step() && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 -mt-2 mb-4">
              Ces infos nous aident à mieux comprendre ton profil d&apos;orientation.
              Tu pourras les modifier à tout moment.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Niveau d'études">
                <select
                  value={c2.educationLevel}
                  onChange={(e) => setC2((p) => ({ ...p, educationLevel: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">— Sélectionner —</option>
                  {EDUCATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Filière">
                <input
                  type="text"
                  value={c2.field}
                  onChange={(e) => setC2((p) => ({ ...p, field: e.target.value }))}
                  className={inputClass}
                  placeholder="Informatique, Droit…"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Établissement">
                  <input
                    type="text"
                    value={c2.institution}
                    onChange={(e) => setC2((p) => ({ ...p, institution: e.target.value }))}
                    className={inputClass}
                    placeholder="Lycée, IUT, Université…"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Mon projet d'orientation">
                  <select
                    value={c2.projectStatus}
                    onChange={(e) => setC2((p) => ({ ...p, projectStatus: e.target.value }))}
                    className={inputClass}
                  >
                    {PROJECT_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                {c2.projectStatus !== "aucun" && (
                  <textarea
                    rows={2}
                    value={c2.projectDescription}
                    onChange={(e) => setC2((p) => ({ ...p, projectDescription: e.target.value }))}
                    className={`${inputClass} mt-2 resize-none`}
                    placeholder="En quelques mots…"
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
                        c2.interestAreas.includes(area)
                          ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)] font-semibold"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COUCHE 3 — immersion specific */}
        {isLayer3Step() && (
          <div className="space-y-4">
            {steps === 1 && (
              <div className="bg-gradient-to-br from-[#fffbe6] to-[#fff3e6] rounded-xl p-4 mb-2">
                <p className="text-sm text-zinc-700">
                  ✨ Bonne nouvelle, ton profil est déjà rempli !
                  Il ne reste qu&apos;une question avant de valider ton inscription.
                </p>
              </div>
            )}
            <Field label="Comment as-tu découvert cette immersion ?">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SOURCE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setC3((p) => ({ ...p, source: o.value }))}
                    className={`text-xs px-3 py-2.5 rounded-xl border transition-all ${
                      c3.source === o.value
                        ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)] font-semibold"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Un commentaire ou une question ? (optionnel)">
              <textarea
                rows={3}
                value={c3.comment}
                onChange={(e) => setC3((p) => ({ ...p, comment: e.target.value }))}
                className={`${inputClass} resize-none`}
                placeholder="Allergie non listée, question sur le déroulé…"
              />
            </Field>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            Une erreur est survenue lors de l&apos;inscription. Vérifie ta connexion et réessaie.
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-100">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>
          ) : (
            <div />
          )}
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className="font-bold gap-1"
            onClick={handleNext}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "Inscription en cours…"
              : step === steps
                ? "Confirmer mon inscription 🚀"
                : <>Suivant <ChevronRight className="w-4 h-4" /></>}
          </Button>
        </div>
      </div>
    </div>
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
