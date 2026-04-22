import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Users,
  Image,
  MessageSquare,
  Plus,
  Building2,
  MapPin,
  ChevronRight,
  Clock,
} from "lucide-react";

export const metadata = { title: "Dashboard Admin" };

function formatDateShort(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  inscrit: { label: "Inscrit", color: "bg-blue-100 text-blue-700" },
  contacte: { label: "Contacté", color: "bg-purple-100 text-purple-700" },
  confirme_j7: { label: "Confirmé J-7", color: "bg-indigo-100 text-indigo-700" },
  confirme_j2: { label: "Confirmé J-2", color: "bg-green-100 text-green-700" },
  present: { label: "Présent ✓", color: "bg-green-100 text-green-700" },
  absent: { label: "Absent", color: "bg-red-100 text-red-700" },
  desistement: { label: "Désistement", color: "bg-zinc-100 text-zinc-500" },
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    upcomingCount,
    newInscriptionsCount,
    missingRightsCount,
    feedbacksCount,
    upcomingImmersions,
    recentEnrollments,
  ] = await Promise.all([
    prisma.immersion.count({
      where: { status: { in: ["publie", "complet"] }, date: { gte: now }, deletedAt: null },
    }),
    prisma.enrollment.count({
      where: { enrolledAt: { gte: weekAgo }, deletedAt: null },
    }),
    prisma.enrollment.count({
      where: {
        imageRightsSignedAt: null,
        deletedAt: null,
        immersion: { date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
        status: { notIn: ["desistement"] },
      },
    }),
    prisma.feedback.count({
      where: { submittedAt: { gte: weekAgo } },
    }),
    prisma.immersion.findMany({
      where: {
        status: { in: ["publie", "complet", "en_cours"] },
        date: { gte: now },
        deletedAt: null,
      },
      orderBy: { date: "asc" },
      take: 5,
      include: {
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { deletedAt: null },
      orderBy: { enrolledAt: "desc" },
      take: 10,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        immersion: { select: { companyName: true, date: true } },
      },
    }),
  ]);

  const kpis = [
    {
      label: "Immersions à venir",
      value: upcomingCount,
      icon: CalendarDays,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Inscriptions cette semaine",
      value: newInscriptionsCount,
      icon: Users,
      color: "from-[#ffe959] to-[#ff914d]",
    },
    {
      label: "Droits image manquants",
      value: missingRightsCount,
      icon: Image,
      color: "from-red-400 to-red-500",
    },
    {
      label: "Feedbacks reçus (7j)",
      value: feedbacksCount,
      icon: MessageSquare,
      color: "from-green-400 to-green-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Dashboard</h1>
        <Link href="/admin/immersions/nouveau">
          <Button variant="gradient" size="sm">
            <Plus className="w-4 h-4" /> Nouvelle immersion
          </Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3`}
            >
              <kpi.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-zinc-900">{kpi.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming immersions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900">Prochaines immersions</h2>
            <Link href="/admin/immersions">
              <Button variant="ghost" size="sm">
                Tout voir <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingImmersions.length === 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">
                Aucune immersion à venir.{" "}
                <Link href="/admin/immersions/nouveau" className="text-[var(--brand-orange)] hover:underline">
                  En créer une
                </Link>
              </div>
            )}
            {upcomingImmersions.map((imm) => {
              const pct = Math.round((imm._count.enrollments / imm.maxCapacity) * 100);
              const placesLeft = imm.maxCapacity - imm._count.enrollments;
              return (
                <Link key={imm.id} href={`/admin/immersions/${imm.id}`} className="block group">
                  <div className="bg-white rounded-2xl border border-zinc-200 hover:border-[var(--brand-orange)] hover:shadow-sm transition-all p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-zinc-900 group-hover:text-[var(--brand-orange)] transition-colors">
                            {imm.companyName}
                          </p>
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateShort(imm.date)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          placesLeft <= 0
                            ? "muted"
                            : placesLeft <= 3
                              ? "warning"
                              : "success"
                        }
                        className="text-xs shrink-0"
                      >
                        {placesLeft <= 0
                          ? "Complet"
                          : `${imm._count.enrollments}/${imm.maxCapacity}`}
                      </Badge>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ffe959] to-[#ff914d] rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent enrollments */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900">Inscriptions récentes</h2>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            {recentEnrollments.length === 0 ? (
              <p className="p-6 text-center text-zinc-400 text-sm">
                Aucune inscription pour l&apos;instant.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {recentEnrollments.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {e.user.firstName
                          ? `${e.user.firstName} ${e.user.lastName ?? ""}`.trim()
                          : e.user.email}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {e.immersion.companyName} · {formatDateShort(e.immersion.date)}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_LABELS[e.status]?.color ?? "bg-zinc-100 text-zinc-600"}`}
                    >
                      {STATUS_LABELS[e.status]?.label ?? e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
