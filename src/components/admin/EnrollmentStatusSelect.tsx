"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "inscrit", label: "Inscrit" },
  { value: "contacte", label: "Contacté" },
  { value: "confirme_j7", label: "Confirmé J-7" },
  { value: "confirme_j2", label: "Confirmé J-2" },
  { value: "present", label: "Présent ✓" },
  { value: "absent", label: "Absent" },
  { value: "desistement", label: "Désistement" },
];

const STATUS_COLORS: Record<string, string> = {
  inscrit: "text-blue-700 bg-blue-50",
  contacte: "text-purple-700 bg-purple-50",
  confirme_j7: "text-indigo-700 bg-indigo-50",
  confirme_j2: "text-green-700 bg-green-50",
  present: "text-green-700 bg-green-50",
  absent: "text-red-700 bg-red-50",
  desistement: "text-zinc-500 bg-zinc-50",
};

interface Props {
  enrollmentId: string;
  currentStatus: string;
}

export default function EnrollmentStatusSelect({ enrollmentId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleChange(newStatus: string) {
    setSaving(true);
    setStatus(newStatus);
    await fetch(`/api/admin/inscriptions/${enrollmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className={`text-xs px-2 py-1.5 rounded-lg border border-transparent font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] transition-all ${STATUS_COLORS[status] ?? "text-zinc-600 bg-zinc-50"}`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
