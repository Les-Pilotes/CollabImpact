import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Inscrits — Admin" };

export default async function AdminInscritsPage() {
  const { admin } = await requireAdmin();

  const users = await prisma.user.findMany({
    where: { organisationId: admin.organisationId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">
          Inscrits ({users.length})
        </h1>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <User className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400">Aucun jeune inscrit pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/inscrits/${user.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 text-sm group-hover:text-[var(--brand-orange)] transition-colors">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                      : <span className="text-zinc-400 italic">Profil incomplet</span>}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  {user.educationLevel && (
                    <span className="text-xs text-zinc-400">{user.educationLevel}</span>
                  )}
                  <Badge variant="muted" className="text-xs">
                    {user._count.enrollments} immersion{user._count.enrollments > 1 ? "s" : ""}
                  </Badge>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--brand-orange)] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
