import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inscription — Les Pilotes" };

/**
 * Compat route: /inscription (without eventId) was the V1 path with a hardcoded
 * single event. Now we redirect to the next upcoming published event. If none
 * exists, show an empty-state page.
 */
export default async function InscriptionRedirectPage() {
  const now = new Date();
  const nextEvent = await prisma.event.findFirst({
    where: {
      deletedAt: null,
      status: { in: ["publie", "complet", "en_cours"] },
      date: { gte: now },
    },
    orderBy: { date: "asc" },
    select: { id: true },
  });

  if (nextEvent) {
    redirect(`/inscription/${nextEvent.id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative w-9 h-9 shrink-0">
            <Image src="/logo-pilotes.png" alt="Les Pilotes" fill className="object-contain" />
          </div>
          <p className="text-sm font-bold text-zinc-900">Les Pilotes</p>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-6xl">🕊️</div>
        <h1 className="text-2xl font-extrabold text-zinc-900">
          Pas d&apos;événement ouvert pour l&apos;instant
        </h1>
        <p className="text-sm text-zinc-500 max-w-sm mx-auto">
          Reviens bientôt — on prépare les prochaines éditions. En attendant, suis-nous sur
          les réseaux pour ne rien rater.
        </p>
        <div className="pt-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
