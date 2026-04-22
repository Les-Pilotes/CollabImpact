"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function PollForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [question, setQuestion] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [options, setOptions] = useState([
    { id: "1", label: "" },
    { id: "2", label: "" },
  ]);

  function addOption() {
    setOptions((o) => [...o, { id: String(Date.now()), label: "" }]);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions((o) => o.filter((opt) => opt.id !== id));
  }

  function updateOption(id: string, label: string) {
    setOptions((o) => o.map((opt) => (opt.id === id ? { ...opt, label } : opt)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (options.some((o) => !o.label.trim())) return;
    setStatus("saving");

    const res = await fetch("/api/admin/sondages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        options: options.map((o) => ({ id: o.id, label: o.label.trim() })),
        status: publishNow ? "actif" : "brouillon",
      }),
    });

    if (res.ok) {
      router.push("/admin/sondages");
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
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={inputClass}
              placeholder="Quel secteur aimerais-tu découvrir ?"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-zinc-700">
                Options (min. 2)
              </label>
              {options.length < 6 && (
                <Button type="button" variant="ghost" size="sm" onClick={addOption}>
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-4 shrink-0">{idx + 1}</span>
                  <input
                    type="text"
                    required
                    value={opt.label}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    disabled={options.length <= 2}
                    className="text-zinc-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--brand-orange)]"
            />
            <span className="text-sm text-zinc-700">Activer maintenant</span>
          </label>
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">Une erreur est survenue.</p>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="font-bold"
        disabled={status === "saving"}
      >
        {status === "saving" ? "Création…" : "Créer le sondage"}
      </Button>
    </form>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:border-transparent text-sm bg-white";
