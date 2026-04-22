import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  Edit,
} from "lucide-react";
import ImmersionForm from "@/components/admin/ImmersionForm";
import EnrollmentStatusSelect from "@/components/admin/EnrollmentStatusSelect";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  inscrit: "Inscrit",
  contacte: "Contacté",
  confirme_j7: "Confirmé J-7",
  confirme_j2: "Confirmé J-2",
  present: "Présent",
  absent: "Absent",
  desistement: "Désistement",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export default async function AdminImmersionDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = tabParam ?? "inscrits";
  const { admin } = await requireAdmin();

  const immersion = await prisma.immersion.findFirst({
    where: { id, organisationId: admin.organisationId, deletedAt: null },
    include: {
      enrollments: {
        where: { deletedAt: null },
        include: {
          user: true,
          feedback: true,
        },
        orderBy: { enrolledAt: "desc" },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!immersion) notFound();

  type Speaker = { firstName: string; lastName: string; role: string; email: string };
  const speakers = ((immersion.speakers as { firstName: string; lastName: string; role: string; email?: string }[]) ?? []).map((s) => ({
    firstName: s.firstName,
    lastName: s.lastName,
    role: s.role,
    email: s.email ?? "",
  }));

  const presentCount = immersion.enrollments.filter((e) => e.status === "present").length;
  const signedRightsCount = immersion.enrollments.filter((e) => e.imageRightsSignedAt).length;
  const feedbackCount = immersion.enrollments.filter((e) => e.feedback).length;

  const initialFormData = {
    id: immersion.id,
    name: immersion.name,
    status: immersion.status,
    companyName: immersion.companyName,
    companySector: immersion.companySector,
    companyAddress: immersion.companyAddress,
    companyCity: immersion.companyCity,
    date: immersion.date.toISOString().slice(0, 16),
    durationMinutes: immersion.durationMinutes,
    maxCapacity: immersion.maxCapacity,
    themes: immersion.themes,
    description: immersion.description ?? "",
    program: immersion.program ?? "",
    internalContact: immersion.internalContact ?? "",
    speakers,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/immersions">
          <span className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
            <ChevronLeft className="w-4 h-4" /> Immersions
          </span>
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm font-semibold text-zinc-900">{immersion.companyName}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-zinc-400" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900">{immersion.companyName}</h1>
                <p className="text-[var(--brand-orange)] font-semibold text-sm">{immersion.companySector}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(immersion.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(immersion.durationMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {immersion.companyCity}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant={immersion.status === "publie" ? "success" : "muted"}>
              {immersion.status}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-100">
            {[
              { label: "Inscrits", value: `${immersion._count.enrollments}/${immersion.maxCapacity}` },
              { label: "Présents", value: presentCount },
              { label: "Droits signés", value: signedRightsCount },
              { label: "Feedbacks", value: feedbackCount },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-zinc-900">{s.value}</p>
                <p className="text-xs text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200">
        {[
          { id: "inscrits", label: "Inscrits" },
          { id: "modifier", label: "Modifier" },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/admin/immersions/${id}?tab=${t.id}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-[var(--brand-orange)] text-[var(--brand-orange)]"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {tab === "inscrits" && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {immersion.enrollments.length === 0 ? (
            <p className="p-8 text-center text-zinc-400 text-sm">
              Aucun inscrit pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-zinc-500 uppercase tracking-wide">
                      Participant
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-zinc-500 uppercase tracking-wide hidden sm:table-cell">
                      Statut
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                      Droits image
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-xs text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                      Feedback
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {immersion.enrollments.map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">
                              {e.user.firstName
                                ? `${e.user.firstName} ${e.user.lastName ?? ""}`.trim()
                                : "—"}
                            </p>
                            <p className="text-xs text-zinc-400">{e.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <EnrollmentStatusSelect
                          enrollmentId={e.id}
                          currentStatus={e.status}
                        />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge
                          variant={e.imageRightsSignedAt ? "success" : "muted"}
                          className="text-xs"
                        >
                          {e.imageRightsSignedAt ? "Signé ✓" : "En attente"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge
                          variant={e.feedback ? "success" : "muted"}
                          className="text-xs"
                        >
                          {e.feedback ? `${e.feedback.overallRating}/5 ⭐` : "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/inscrits/${e.userId}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Fiche
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "modifier" && (
        <ImmersionForm initialData={initialFormData} />
      )}
    </div>
  );
}
