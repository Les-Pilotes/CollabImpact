import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PollForm from "@/components/admin/PollForm";

export const metadata = { title: "Nouveau sondage — Admin" };

export default async function NouveauSondagePage() {
  await requireAdmin();
  return (
    <div className="max-w-xl">
      <Link href="/admin/sondages">
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Retour aux sondages
        </span>
      </Link>
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">
        Nouveau sondage
      </h1>
      <PollForm />
    </div>
  );
}
