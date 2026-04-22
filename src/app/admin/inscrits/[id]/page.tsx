import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ChevronLeft, User, Calendar, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const EDUCATION_LABELS: Record<string, string> = {
  college: "Collège",
  lycee: "Lycée",
  bac: "Bac",
  post_bac_1: "Bac +1",
  post_bac_2: "Bac +2",
  post_bac_3: "Bac +3",
  post_bac_4_5: "Bac +4/5",
  hors_cursus: "Hors cursus",
};

export default async function AdminInscritFichePage({ params }: Props) {
  const { id } = await params;
  const { admin } = await requireAdmin();

  const user = await prisma.user.findFirst({
    where: { id, organisationId: admin.organisationId, deletedAt: null },
    include: {
      enrollments: {
        where: { deletedAt: null },
        include: {
          immersion: true,
          feedback: true,
        },
        orderBy: { enrolledAt: "desc" },
      },
      profileSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/immersions">
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
          <ChevronLeft className="w-4 h-4" /> Retour
        </span>
      </Link>

      {/* Identity */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900">
                {user.firstName
                  ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                  : "Profil incomplet"}
              </h1>
              <p className="text-zinc-500 text-sm">{user.email}</p>
              {user.phone && <p className="text-xs text-zinc-400 mt-0.5">{user.phone}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-100">
            <InfoItem label="Date de naissance" value={user.birthDate ? formatDate(user.birthDate) : "—"} />
            <InfoItem label="Ville" value={user.city ?? "—"} />
            <InfoItem label="Préférence alimentaire" value={user.dietary} />
            <InfoItem
              label="Niveau d'études"
              value={user.educationLevel ? EDUCATION_LABELS[user.educationLevel] ?? user.educationLevel : "—"}
            />
            <InfoItem label="Filière" value={user.field ?? "—"} />
            <InfoItem label="Établissement" value={user.institution ?? "—"} />
          </div>

          {user.interestAreas.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                Secteurs d&apos;intérêt
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.interestAreas.map((area) => (
                  <span
                    key={area}
                    className="text-xs bg-orange-50 text-[var(--brand-orange)] rounded-full px-2.5 py-0.5 font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enrollments */}
      <section>
        <h2 className="font-bold text-zinc-900 mb-3">
          Immersions ({user.enrollments.length})
        </h2>
        {user.enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center text-zinc-400 text-sm">
            Aucune inscription.
          </div>
        ) : (
          <div className="space-y-2">
            {user.enrollments.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">
                      {e.immersion.companyName}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatDate(e.immersion.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="muted" className="text-xs">{e.status}</Badge>
                  {e.imageRightsSignedAt ? (
                    <Badge variant="success" className="text-xs">Droits ✓</Badge>
                  ) : (
                    <Badge variant="muted" className="text-xs">Droits —</Badge>
                  )}
                  {e.feedback ? (
                    <Badge variant="success" className="text-xs">
                      Feedback {e.feedback.overallRating}/5
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profile snapshots */}
      {user.profileSnapshots.length > 0 && (
        <section>
          <h2 className="font-bold text-zinc-900 mb-3">
            Historique profil ({user.profileSnapshots.length} snapshot{user.profileSnapshots.length > 1 ? "s" : ""})
          </h2>
          <div className="space-y-2">
            {user.profileSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="bg-white rounded-2xl border border-zinc-200 p-4 text-xs text-zinc-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="muted" className="text-xs">{snap.trigger}</Badge>
                  <span>{formatDate(snap.createdAt)}</span>
                </div>
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-all">
                  {JSON.stringify(snap.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-zinc-900 mt-0.5">{value}</p>
    </div>
  );
}
