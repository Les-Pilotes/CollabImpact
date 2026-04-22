import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image, User } from "lucide-react";

export const metadata = { title: "Droits image — Admin" };

export default async function AdminDroitsPage() {
  const { admin } = await requireAdmin();
  const now = new Date();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      organisationId: admin.organisationId,
      deletedAt: null,
      status: { notIn: ["desistement"] },
      immersion: {
        date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      immersion: { select: { companyName: true, date: true } },
    },
    orderBy: [
      { imageRightsSignedAt: "asc" },
      { immersion: { date: "asc" } },
    ],
  });

  const unsigned = enrollments.filter((e) => !e.imageRightsSignedAt);
  const signed = enrollments.filter((e) => e.imageRightsSignedAt);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-zinc-900">Droits à l&apos;image</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-red-500">{unsigned.length}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Non signés</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-green-500">{signed.length}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Signés</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-zinc-900">{enrollments.length}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Total (30j)</p>
        </div>
      </div>

      {unsigned.length > 0 && (
        <section>
          <h2 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            En attente de signature ({unsigned.length})
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {unsigned.map((e) => (
                <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {e.user.firstName
                          ? `${e.user.firstName} ${e.user.lastName ?? ""}`.trim()
                          : e.user.email}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {e.immersion.companyName} ·{" "}
                        {new Date(e.immersion.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.imageRightsReminderAt && (
                      <span className="text-xs text-zinc-400">
                        Rappel envoyé{" "}
                        {new Date(e.imageRightsReminderAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                    <Badge variant="muted" className="text-xs">Non signé</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {signed.length > 0 && (
        <section>
          <h2 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Signés ({signed.length})
          </h2>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {signed.map((e) => (
                <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {e.user.firstName
                          ? `${e.user.firstName} ${e.user.lastName ?? ""}`.trim()
                          : e.user.email}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {e.immersion.companyName} ·{" "}
                        {new Date(e.immersion.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs shrink-0">Signé ✓</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {enrollments.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <Image className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400">
            Aucune inscription sur les 30 derniers jours.
          </p>
        </div>
      )}
    </div>
  );
}
