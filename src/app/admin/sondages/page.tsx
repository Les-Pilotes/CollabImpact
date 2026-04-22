import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3 } from "lucide-react";

export const metadata = { title: "Sondages — Admin" };

const STATUS_VARIANTS: Record<string, "success" | "warning" | "muted"> = {
  actif: "success",
  brouillon: "muted",
  clos: "warning",
};

const STATUS_LABELS: Record<string, string> = {
  actif: "Actif",
  brouillon: "Brouillon",
  clos: "Clos",
};

export default async function AdminSondagesPage() {
  const { admin } = await requireAdmin();

  const polls = await prisma.poll.findMany({
    where: { organisationId: admin.organisationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Sondages</h1>
        <Link href="/admin/sondages/nouveau">
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4" /> Nouveau sondage
          </Button>
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <BarChart3 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 mb-4">Aucun sondage créé.</p>
          <Link href="/admin/sondages/nouveau">
            <Button variant="gradient">Créer un sondage</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => {
            const options = poll.options as { id: string; label: string }[];
            return (
              <div key={poll.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-zinc-900">{poll.question}</p>
                      <Badge variant={STATUS_VARIANTS[poll.status] ?? "muted"} className="text-xs">
                        {STATUS_LABELS[poll.status] ?? poll.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {options.length} options · {poll._count.responses} réponses
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {options.map((o) => (
                        <span
                          key={o.id}
                          className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5"
                        >
                          {o.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-zinc-900 shrink-0">
                    {poll._count.responses}
                    <span className="text-sm font-normal text-zinc-400 ml-1">rép.</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
