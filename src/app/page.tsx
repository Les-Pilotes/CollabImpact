import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Rocket, Users, Star, ChevronRight, MapPin, Building2 } from "lucide-react";
import { prisma as db } from "@/lib/db";

async function getPublishedImmersions() {
  const now = new Date();
  return db.immersion.findMany({
    where: {
      status: "publie",
      date: { gte: now },
      deletedAt: null,
    },
    orderBy: { date: "asc" },
    take: 3,
    select: {
      id: true,
      name: true,
      companyName: true,
      companySector: true,
      companyCity: true,
      date: true,
      maxCapacity: true,
      themes: true,
      _count: { select: { enrollments: true } },
    },
  });
}

const VERBATIMS = [
  {
    quote:
      "C'était trop bien, j'ai beaucoup apprécié malgré le fait que ce n'était pas mon domaine de prédilection.",
    name: "Participant — Immersion SteelSeries",
  },
  {
    quote:
      "Très enrichissante. Elle m'a permis de découvrir concrètement les métiers et le fonctionnement de l'entreprise.",
    name: "Participant — Immersion SteelSeries",
  },
  {
    quote:
      "C'était super ! Très pertinent avec mon orientation. Enrichissant d'échanger avec des professionnels.",
    name: "Participant — Immersion SteelSeries",
  },
];

export default async function LandingPage() {
  const immersions = await getPublishedImmersions();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900">Les Pilotes</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/immersions">
              <Button variant="ghost" size="sm">
                Immersions
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="gradient" size="sm">
                Mon espace
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#ffe959] via-[#ffb347] to-[#ff914d]">
          <div className="absolute inset-0 bg-black/5" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32">
            <div className="max-w-2xl">
              <Badge className="mb-6 bg-white/20 text-zinc-800 border-0 text-sm px-3 py-1">
                Association reconnue d&apos;intérêt général
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-zinc-900">
                Prends le contrôle
                <br />
                de ton avenir.
              </h1>
              <p className="text-lg md:text-xl text-zinc-800 mb-8 leading-relaxed">
                Découvre des entreprises de l&apos;intérieur, rencontre des
                professionnels qui te ressemblent, et construis ton orientation
                étape par étape.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/immersions">
                  <Button
                    size="xl"
                    className="bg-zinc-900 text-white hover:bg-zinc-800 w-full sm:w-auto"
                  >
                    Voir les immersions
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white w-full sm:w-auto"
                  >
                    J&apos;ai déjà un compte
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Wave bottom */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              <path
                d="M0 80L1440 80L1440 20C1200 60 900 80 720 60C540 40 240 0 0 20L0 80Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { value: "30+", label: "Immersions réalisées" },
                { value: "200+", label: "Jeunes accompagnés" },
                { value: "25+", label: "Entreprises partenaires" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl md:text-4xl font-extrabold gradient-brand-text">
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-20 bg-zinc-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-3">
                Comment ça marche ?
              </h2>
              <p className="text-zinc-500 text-lg">
                Simple, rapide, sans prise de tête.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  icon: <Star className="w-6 h-6" />,
                  title: "Tu choisis une immersion",
                  desc: "Browse le catalogue, filtre par secteur ou date. Trouve ce qui t'attire vraiment.",
                },
                {
                  step: "2",
                  icon: <Users className="w-6 h-6" />,
                  title: "Tu t'inscris en 3 min",
                  desc: "Crée ton profil une seule fois. La prochaine inscription, c'est en 1 clic.",
                },
                {
                  step: "3",
                  icon: <Rocket className="w-6 h-6" />,
                  title: "Tu vis l'expérience",
                  desc: "Rencontre des pros, découvre les métiers, construis ton avenir.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative bg-white rounded-2xl p-8 shadow-sm border border-zinc-100"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center text-white mb-4">
                    {item.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-6xl font-black text-zinc-50 leading-none">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg text-zinc-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Prochaines immersions */}
        {immersions.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900">
                  Prochaines immersions
                </h2>
                <Link href="/immersions">
                  <Button variant="ghost" size="sm">
                    Tout voir <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {immersions.map((imm) => {
                  const placesLeft = imm.maxCapacity - imm._count.enrollments;
                  const isFull = placesLeft <= 0;
                  return (
                    <Link
                      key={imm.id}
                      href={`/immersions/${imm.id}`}
                      className="group"
                    >
                      <div className="rounded-2xl border border-zinc-200 bg-white hover:shadow-lg transition-all duration-200 overflow-hidden group-hover:border-[var(--brand-orange)]">
                        <div className="h-2 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-zinc-400" />
                            </div>
                            {isFull ? (
                              <Badge variant="muted">Complet</Badge>
                            ) : (
                              <Badge variant="success">
                                {placesLeft} place
                                {placesLeft > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-zinc-900 mb-1 leading-snug">
                            {imm.companyName}
                          </h3>
                          <p className="text-sm text-zinc-500 mb-3">
                            {imm.companySector}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <MapPin className="w-3 h-3" />
                            {imm.companyCity}
                          </div>
                          <div className="mt-4 pt-4 border-t border-zinc-100 text-xs font-semibold text-[var(--brand-orange)]">
                            {new Date(imm.date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Verbatims */}
        <section className="py-20 bg-gradient-to-br from-[#fffbe6] to-[#fff3e6]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 mb-3">
                Ce qu&apos;ils en disent 🌟
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {VERBATIMS.map((v, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100"
                >
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 fill-[#ffe959] text-[#ffe959]"
                      />
                    ))}
                  </div>
                  <p className="text-zinc-700 text-sm leading-relaxed mb-4 italic">
                    &ldquo;{v.quote}&rdquo;
                  </p>
                  <p className="text-xs text-zinc-400 font-medium">{v.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 bg-zinc-900 text-white">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Prêt à décoller ? 🚀
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              Rejoins des centaines de jeunes qui ont déjà trouvé leur voie
              grâce aux Immersions Les Pilotes.
            </p>
            <Link href="/immersions">
              <Button size="xl" variant="gradient">
                Voir les immersions
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d]" />
            <span>Les Pilotes — Association reconnue d&apos;intérêt général</span>
          </div>
          <p className="text-zinc-600 text-xs">
            © {new Date().getFullYear()} Les Pilotes · contact@les-pilotes.fr
          </p>
        </div>
      </footer>
    </div>
  );
}
