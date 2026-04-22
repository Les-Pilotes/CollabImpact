"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  pollId: string;
  options: { id: string; label: string }[];
}

export default function PollVoteForm({ pollId, options }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleVote() {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch(`/api/sondages/${pollId}/repondre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setSelected(opt.id)}
          className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
            selected === opt.id
              ? "border-[var(--brand-orange)] bg-orange-50 text-[var(--brand-orange)] font-semibold"
              : "border-zinc-200 text-zinc-700 hover:border-zinc-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
      <Button
        onClick={handleVote}
        disabled={!selected || loading}
        variant="gradient"
        size="sm"
        className="w-full mt-2"
      >
        {loading ? "Envoi…" : "Voter"}
      </Button>
    </div>
  );
}
