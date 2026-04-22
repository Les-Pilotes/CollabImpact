import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import UpdateForm from "@/components/admin/UpdateForm";

export const metadata = { title: "Nouvelle publication — Admin" };

export default async function NouvellePublicationPage() {
  const { admin } = await requireAdmin();

  const immersions = await prisma.immersion.findMany({
    where: { organisationId: admin.organisationId, deletedAt: null },
    orderBy: { date: "desc" },
    select: { id: true, companyName: true },
  });

  return (
    <div className="max-w-2xl">
      <Link href="/admin/feed">
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Retour au feed
        </span>
      </Link>
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">
        Nouvelle publication
      </h1>
      <UpdateForm immersions={immersions} />
    </div>
  );
}
