"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface Props {
  enrollmentId: string;
  firstName: string;
}

export default function DroitsImageForm({ enrollmentId, firstName }: Props) {
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checked) return;

    setStatus("loading");
    const res = await fetch(`/api/droits/${enrollmentId}`, {
      method: "POST",
    });

    if (res.ok) {
      setStatus("success");
      setTimeout(() => router.push("/me"), 2000);
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
        <p className="font-semibold text-zinc-900">Droits signés avec succès !</p>
        <p className="text-sm text-zinc-500">Redirection vers ton espace…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="flex items-start gap-3 cursor-pointer group mb-6">
        <div className="mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              checked
                ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]"
                : "border-zinc-300 group-hover:border-zinc-400"
            }`}
          >
            {checked && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-zinc-700 leading-relaxed">
          Je, <strong>{firstName}</strong>, consens à l&apos;utilisation de mon
          image dans le cadre des activités de communication de l&apos;association
          Les Pilotes, conformément aux conditions ci-dessus.
        </span>
      </label>

      {status === "error" && (
        <p className="text-sm text-red-600 mb-4">
          Une erreur est survenue. Réessaie ou contacte contact@les-pilotes.fr.
        </p>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full font-bold"
        disabled={!checked || status === "loading"}
      >
        {status === "loading" ? "Enregistrement…" : "J'accepte et je signe ✓"}
      </Button>
    </form>
  );
}
