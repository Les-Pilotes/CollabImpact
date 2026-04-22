"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const KIND_OPTIONS = [
  { value: "news", label: "Actu" },
  { value: "post_linkedin", label: "Post LinkedIn" },
  { value: "video", label: "Vidéo" },
  { value: "article", label: "Article" },
];

interface Props {
  immersions: { id: string; companyName: string }[];
}

export default function UpdateForm({ immersions }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [form, setForm] = useState({
    title: "",
    body: "",
    kind: "news",
    sourceUrl: "",
    imageUrl: "",
    immersionId: "",
    publishNow: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");

    const res = await fetch("/api/admin/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        body: form.body,
        kind: form.kind,
        sourceUrl: form.sourceUrl || undefined,
        imageUrl: form.imageUrl || undefined,
        immersionId: form.immersionId || undefined,
        publishedAt: form.publishNow ? new Date().toISOString() : undefined,
      }),
    });

    if (res.ok) {
      router.push("/admin/feed");
      router.refresh();
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
        <div className="p-6 space-y-4">
          <Field label="Titre" required>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              placeholder="Retour sur l'immersion SteelSeries"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                className={inputClass}
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Immersion liée (optionnel)">
              <select
                value={form.immersionId}
                onChange={(e) => setForm((f) => ({ ...f, immersionId: e.target.value }))}
                className={inputClass}
              >
                <option value="">— Aucune —</option>
                {immersions.map((imm) => (
                  <option key={imm.id} value={imm.id}>{imm.companyName}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Contenu" required>
            <textarea
              required
              rows={6}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className={`${inputClass} resize-none`}
              placeholder="Description de la publication…"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Lien externe (optionnel)">
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                className={inputClass}
                placeholder="https://linkedin.com/…"
              />
            </Field>
            <Field label="URL image (optionnel)">
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className={inputClass}
                placeholder="https://…/image.jpg"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.publishNow}
              onChange={(e) => setForm((f) => ({ ...f, publishNow: e.target.checked }))}
              className="w-4 h-4 rounded accent-[var(--brand-orange)]"
            />
            <span className="text-sm text-zinc-700">Publier maintenant</span>
          </label>
        </div>
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
        className="font-bold"
        disabled={status === "saving"}
      >
        {status === "saving" ? "Publication en cours…" : "Publier"}
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
