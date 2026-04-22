import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma as db } from "@/lib/db";
import {
  Building2,
  MapPin,
  Clock,
  Users,
  Calendar,
  ChevronLeft,
  Rocket,
  User,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

async function getImmersion(id: string) {
  return db.immersion.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { enrollments: true } } },
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const imm = await getImmersion(id);
  if (!imm) return { title: "Immersion introuvable" };
  return { title: `Immersion — ${imm.companyName}` };
}

export default async function ImmersionDetailPage({ params }: Props) {
  const { id } = await params;
  const imm = await getImmersion(id);

  if (!imm) notFound();

  const placesLeft = imm.maxCapacity - imm._count.enrollments;
  const isFull = placesLeft <= 0;
  const pct = Math.round((imm._count.enrollments / imm.maxCapacity) * 100);

  type Speaker = { firstName: string; lastName: string; role: string; email?: string };
  const speakers = (imm.speakers as Speaker[]) || [];

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
            <Button variant="gradient" size="sm">Mon espace</Button>
          </Link>
        </div>
      </nav>

      {/* Back */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/immersions">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Retour au catalogue
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
              <div className="h-3 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
              <div className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-8 h-8 text-zinc-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-zinc-900 leading-tight">
                      {imm.companyName}
                    </h1>
                    <p className="text-[var(--brand-orange)] font-semibold">
                      {imm.companySector}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                  {[
                    {
                      icon: <Calendar className="w-4 h-4" />,
                      label: new Date(imm.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    },
                    {
                      icon: <Clock className="w-4 h-4" />,
                      label: `Durée : ${formatDuration(imm.durationMinutes)}`,
                    },
                    {
                      icon: <MapPin className="w-4 h-4" />,
                      label: `${imm.companyAddress}, ${imm.companyCity}`,
                    },
                    {
                      icon: <Users className="w-4 h-4" />,
                      label: `${imm.maxCapacity} places maximum`,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                      <span className="text-[var(--brand-orange)] mt-0.5 shrink-0">
                        {item.icon}
                      </span>
                      <span className="capitalize">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Themes */}
                {imm.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {imm.themes.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-orange-50 text-[var(--brand-orange)] rounded-full px-3 py-1 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {imm.description && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
                <h2 className="font-bold text-lg text-zinc-900 mb-3">
                  À propos de l&apos;immersion
                </h2>
                <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {imm.description}
                </p>
              </div>
            )}

            {/* Speakers */}
            {speakers.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
                <h2 className="font-bold text-lg text-zinc-900 mb-4">
                  Les intervenants
                </h2>
                <div className="space-y-3">
                  {speakers.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 text-sm">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-zinc-500">{s.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Programme */}
            {imm.program && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
                <h2 className="font-bold text-lg text-zinc-900 mb-3">
                  Programme de la journée
                </h2>
                <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {imm.program}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="space-y-4">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <div className="text-center mb-4">
                  {isFull ? (
                    <Badge variant="muted" className="text-sm px-4 py-1.5">
                      Complet
                    </Badge>
                  ) : placesLeft <= 3 ? (
                    <Badge variant="warning" className="text-sm px-4 py-1.5">
                      ⚡ Dernières places !
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-sm px-4 py-1.5">
                      {placesLeft} place{placesLeft > 1 ? "s" : ""} disponible
                      {placesLeft > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>{imm._count.enrollments} inscrits</span>
                    <span>{imm.maxCapacity} places</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ffe959] to-[#ff914d] rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center text-sm text-zinc-500 mb-4">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {new Date(imm.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                  })}
                  {" à "}
                  {new Date(imm.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {isFull ? (
                  <Button disabled className="w-full" size="lg">
                    Plus de places disponibles
                  </Button>
                ) : (
                  <Link href={`/auth/login?next=/me/inscrire/${imm.id}`}>
                    <Button variant="gradient" size="lg" className="w-full font-bold">
                      Je m&apos;inscris 🚀
                    </Button>
                  </Link>
                )}

                <p className="text-xs text-zinc-400 text-center mt-3">
                  Inscription gratuite · Confirmation par email
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#fffbe6] to-[#fff3e6] rounded-2xl border border-orange-100 p-5 mt-4">
                <p className="text-sm text-zinc-700 font-medium mb-1">
                  ✅ Déjà inscrit(e) ?
                </p>
                <p className="text-xs text-zinc-500 mb-3">
                  Connecte-toi pour voir le statut de ton inscription.
                </p>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Accéder à mon espace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
