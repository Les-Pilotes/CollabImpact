import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma as db } from "@/lib/db";
import { Building2, MapPin, Clock, Users, ArrowRight, Rocket } from "lucide-react";

export const metadata = { title: "Catalogue des immersions" };

async function getImmersions() {
  const now = new Date();
  return db.immersion.findMany({
    where: {
      status: "publie",
      date: { gte: now },
      deletedAt: null,
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      name: true,
      companyName: true,
      companySector: true,
      companyCity: true,
      companyAddress: true,
      date: true,
      durationMinutes: true,
      maxCapacity: true,
      themes: true,
      description: true,
      _count: { select: { enrollments: true } },
    },
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export default async function CataloguePage() {
  const immersions = await getImmersions();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900">Les Pilotes</span>
          </Link>
          <Link href="/auth/login">
            <Button variant="gradient" size="sm">
              Mon espace
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#ffe959] to-[#ff914d] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-2">
            Catalogue des immersions
          </h1>
          <p className="text-zinc-800 text-lg">
            {immersions.length > 0
              ? `${immersions.length} immersion${immersions.length > 1 ? "s" : ""} à venir`
              : "Les prochaines immersions arrivent bientôt !"}
          </p>
        </div>
      </div>

      {/* Liste */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {immersions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">
              Aucune immersion à venir pour l&apos;instant
            </h2>
            <p className="text-zinc-500 mb-6">
              Reste à l&apos;affût, de nouvelles immersions arrivent régulièrement !
            </p>
            <Link href="/auth/login">
              <Button variant="gradient">
                Créer mon profil pour être alerté
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {immersions.map((imm) => {
              const placesLeft = imm.maxCapacity - imm._count.enrollments;
              const isFull = placesLeft <= 0;
              const pct = Math.round(
                (imm._count.enrollments / imm.maxCapacity) * 100
              );

              return (
                <Link key={imm.id} href={`/immersions/${imm.id}`} className="group">
                  <article className="rounded-2xl border border-zinc-200 bg-white hover:shadow-lg transition-all duration-200 overflow-hidden group-hover:border-[var(--brand-orange)] h-full flex flex-col">
                    {/* Gradient bar */}
                    <div className="h-2 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />

                    <div className="p-6 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-6 h-6 text-zinc-400" />
                        </div>
                        {isFull ? (
                          <Badge variant="muted">Complet</Badge>
                        ) : placesLeft <= 3 ? (
                          <Badge variant="warning">Dernières places !</Badge>
                        ) : (
                          <Badge variant="success">
                            {placesLeft} place{placesLeft > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>

                      {/* Company & sector */}
                      <h2 className="font-extrabold text-lg text-zinc-900 leading-snug mb-1">
                        {imm.companyName}
                      </h2>
                      <p className="text-sm text-[var(--brand-orange)] font-semibold mb-3">
                        {imm.companySector}
                      </p>

                      {/* Metadata */}
                      <div className="space-y-1.5 text-sm text-zinc-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {imm.companyCity}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {formatDuration(imm.durationMinutes)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          {imm._count.enrollments}/{imm.maxCapacity} inscrits
                        </div>
                      </div>

                      {/* Themes */}
                      {imm.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {imm.themes.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2.5 py-0.5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="mt-auto">
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mb-4">
                          <div
                            className="h-full bg-gradient-to-r from-[#ffe959] to-[#ff914d] rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>

                        {/* Date + CTA */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-zinc-700">
                            {new Date(imm.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-1 text-[var(--brand-orange)] text-sm font-semibold group-hover:gap-2 transition-all">
                            Voir <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
