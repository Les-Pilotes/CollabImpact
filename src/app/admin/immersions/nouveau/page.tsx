import { requireAdmin } from "@/lib/auth";
import ImmersionForm from "@/components/admin/ImmersionForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "Nouvelle immersion — Admin" };

export default async function NouvelleImmersionPage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/immersions">
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Retour aux immersions
        </span>
      </Link>
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">
        Nouvelle immersion
      </h1>
      <ImmersionForm />
    </div>
  );
}
