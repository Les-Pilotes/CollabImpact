import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Calendar, Users, ChevronRight } from "lucide-react";

export const metadata = { title: "Immersions — Admin" };

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "muted" | "secondary"> = {
  brouillon: "muted",
  publie: "success",
  complet: "warning",
  en_cours: "secondary",
  termine: "muted",
};

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  publie: "Publié",
  complet: "Complet",
  en_cours: "En cours",
  termine: "Terminé",
};

export default async function AdminImmersionsPage() {
  const { admin } = await requireAdmin();

  const immersions = await prisma.immersion.findMany({
    where: { organisationId: admin.organisationId, deletedAt: null },
    orderBy: { date: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Immersions</h1>
        <Link href="/admin/immersions/nouveau">
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4" /> Nouvelle immersion
          </Button>
        </Link>
      </div>

      {immersions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <p className="text-zinc-400 mb-4">Aucune immersion créée.</p>
          <Link href="/admin/immersions/nouveau">
            <Button variant="gradient">Créer ma première immersion</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {immersions.map((imm) => {
              const placesLeft = imm.maxCapacity - imm._count.enrollments;
              return (
                <Link
                  key={imm.id}
                  href={`/admin/immersions/${imm.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-900 text-sm group-hover:text-[var(--brand-orange)] transition-colors">
                        {imm.companyName}
                      </p>
                      <Badge variant={STATUS_VARIANTS[imm.status] ?? "muted"} className="text-xs">
                        {STATUS_LABELS[imm.status] ?? imm.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {imm.companySector} · {imm.companyCity}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(imm.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {imm._count.enrollments}/{imm.maxCapacity}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--brand-orange)] transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
