"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { inscriptionSchema, type InscriptionInput } from "@/lib/validation/inscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SOURCE_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "bouche_a_oreille", label: "Bouche à oreille" },
  { value: "classe", label: "Ma classe / mon école" },
  { value: "conseiller", label: "Conseiller(e) orientation" },
  { value: "autre", label: "Autre" },
] as const;

export default function InscriptionPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InscriptionInput>({
    resolver: zodResolver(inscriptionSchema),
  });

  async function onSubmit(data: InscriptionInput) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.ok) {
        router.push("/inscription/success");
      } else {
        setServerError(json.error ?? "Une erreur est survenue. Réessaie dans quelques instants.");
      }
    } catch {
      setServerError("Impossible de contacter le serveur. Vérifie ta connexion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Event banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#ffe959] to-[#ff914d] p-6 mb-8 text-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 opacity-70">
            Prochain événement
          </p>
          <h1 className="text-2xl font-extrabold leading-tight mb-2">
            Workshop 100% Féminin
          </h1>
          <p className="text-sm font-medium">La Cité Audacieuse</p>
          <p className="text-sm">Sam. 18 avril 2026</p>
          <p className="text-sm">9 rue de Vaugirard, Paris 6</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Je m&apos;inscris</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Prénom + Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Yasmine"
                  aria-invalid={!!errors.firstName}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  placeholder="Benali"
                  aria-invalid={!!errors.lastName}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="yasmine@exemple.fr"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="06 12 34 56 78"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Ville */}
            <div className="space-y-1.5">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                placeholder="Paris"
                aria-invalid={!!errors.city}
                {...register("city")}
              />
              {errors.city && (
                <p className="text-xs text-red-500">{errors.city.message}</p>
              )}
            </div>

            {/* Date de naissance */}
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                aria-invalid={!!errors.birthDate}
                {...register("birthDate")}
              />
              {errors.birthDate && (
                <p className="text-xs text-red-500">{errors.birthDate.message}</p>
              )}
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <Label htmlFor="source">Comment t&apos;as connu l&apos;asso ?</Label>
              <select
                id="source"
                aria-invalid={!!errors.source}
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:border-[var(--brand-orange)] disabled:cursor-not-allowed disabled:opacity-50"
                {...register("source")}
              >
                <option value="">Choisis une option…</option>
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.source && (
                <p className="text-xs text-red-500">{errors.source.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {serverError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours…" : "Je m'inscris 🎉"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
