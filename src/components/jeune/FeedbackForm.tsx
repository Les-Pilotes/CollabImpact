"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle2 } from "lucide-react";

interface Props {
  token: string;
  enrollmentId: string;
  companyName: string;
}

export default function FeedbackForm({ token, enrollmentId, companyName }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [form, setForm] = useState({
    overallRating: 0,
    organizationRating: 0,
    favoriteMoment: "",
    changedVision: false,
    wouldContinue: false,
    improvements: "",
    verbatim: "",
  });

  function setRating(field: "overallRating" | "organizationRating", value: number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.overallRating === 0) return;
    setStatus("loading");

    const res = await fetch(`/api/feedback/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, enrollmentId }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-zinc-900 text-lg mb-1">Merci ! 🙏</p>
        <p className="text-sm text-zinc-500 mb-4">
          Ton feedback sur {companyName} a bien été envoyé.
        </p>
        <Button variant="gradient" onClick={() => router.push("/me")}>
          Retour à mon espace
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Overall rating */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 mb-3">
          Note globale de l&apos;expérience <span className="text-red-500">*</span>
        </label>
        <StarRating
          value={form.overallRating}
          onChange={(v) => setRating("overallRating", v)}
          labels={["Très décevant", "Décevant", "Moyen", "Bien", "Excellent"]}
        />
      </div>

      {/* Org rating */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 mb-3">
          Organisation de la journée
        </label>
        <StarRating
          value={form.organizationRating}
          onChange={(v) => setRating("organizationRating", v)}
        />
      </div>

      {/* Favorite moment */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Ton moment préféré (optionnel)
        </label>
        <textarea
          rows={2}
          value={form.favoriteMoment}
          onChange={(e) => setForm((f) => ({ ...f, favoriteMoment: e.target.value }))}
          className={`${inputClass} resize-none`}
          placeholder="La visite des bureaux, l'échange avec le DG…"
        />
      </div>

      {/* Changed vision */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-900">
          Est-ce que cette immersion a changé ta vision ?
        </p>
        <div className="flex gap-3">
          {[
            { value: true, label: "Oui ✓" },
            { value: false, label: "Pas vraiment" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setForm((f) => ({ ...f, changedVision: opt.value }))}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.changedVision === opt.value
                  ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)]"
                  : "border-zinc-200 text-zinc-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Would continue */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-zinc-900">
          Envisages-tu une suite (stage, alternance, vœu…) ?
        </p>
        <div className="flex gap-3">
          {[
            { value: true, label: "Oui" },
            { value: false, label: "Non" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setForm((f) => ({ ...f, wouldContinue: opt.value }))}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.wouldContinue === opt.value
                  ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)]"
                  : "border-zinc-200 text-zinc-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verbatim */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          En quelques mots, comment c&apos;était ? (optionnel)
        </label>
        <textarea
          rows={3}
          value={form.verbatim}
          onChange={(e) => setForm((f) => ({ ...f, verbatim: e.target.value }))}
          className={`${inputClass} resize-none`}
          placeholder="Ce que j'ai retenu de cette journée…"
        />
      </div>

      {/* Improvements */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Une suggestion d&apos;amélioration ? (optionnel)
        </label>
        <textarea
          rows={2}
          value={form.improvements}
          onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))}
          className={`${inputClass} resize-none`}
          placeholder="Plus de temps de questions-réponses, par exemple…"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">
          Une erreur est survenue. Réessaie.
        </p>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full font-bold"
        disabled={form.overallRating === 0 || status === "loading"}
      >
        {status === "loading" ? "Envoi…" : "Envoyer mon feedback 🚀"}
      </Button>
    </form>
  );
}

function StarRating({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  labels?: string[];
}) {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <Star
              className={`w-8 h-8 transition-all ${
                star <= (hover || value)
                  ? "fill-[#ffe959] text-[#ffe959]"
                  : "text-zinc-200 fill-zinc-200"
              }`}
            />
          </button>
        ))}
      </div>
      {labels && (hover > 0 || value > 0) && (
        <p className="text-xs text-zinc-400 mt-1">
          {labels[(hover || value) - 1]}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:border-transparent text-sm bg-white";
