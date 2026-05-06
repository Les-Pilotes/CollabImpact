import { requireAdmin } from "@/lib/auth";
import PageHeader from "../PageHeader";

export const metadata = { title: "Mesure d'impact — Admin" };

export default async function ImpactPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col h-full -m-4 md:-m-10 overflow-hidden">
      <PageHeader
        title="Mesure d'impact"
        subtitle="Synthèse des feedbacks et indicateurs post-événement"
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-sm font-semibold text-zinc-700">À venir après le Jour J</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Les feedbacks, notes moyennes et verbatims des participantes apparaîtront ici une fois l&apos;événement terminé.
          </p>
        </div>
      </div>
    </div>
  );
}
