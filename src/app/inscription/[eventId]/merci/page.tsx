import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FileDown, Mail, Phone, Calendar, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inscription confirmée — Les Pilotes" };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function InscriptionMerciPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ firstName?: string; minor?: string }>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const firstName = sp.firstName ?? "";
  const isMinor = sp.minor === "1";

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: { id: true, name: true, date: true, address: true },
  });

  if (!event) notFound();

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

      <main className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="text-6xl">🎉</div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            {firstName ? `Inscription confirmée, ${firstName} !` : "Inscription confirmée !"}
          </h1>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            On a bien reçu ton inscription au <strong>{event.name}</strong>. Un email de
            confirmation vient de partir.
          </p>
        </div>

        {/* Event details card */}
        <div className="rounded-2xl bg-white border border-zinc-200 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
            L&apos;événement
          </p>
          <div className="flex items-start gap-3 text-sm text-zinc-700">
            <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
            <span>
              <strong className="text-zinc-900">{formatDate(event.date)}</strong>
              <br />
              <span className="text-zinc-500">à {formatTime(event.date)}</span>
            </span>
          </div>
          <div className="flex items-start gap-3 text-sm text-zinc-700">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
            <span className="text-zinc-900">{event.address}</span>
          </div>
        </div>

        {/* Minor reminder */}
        {isMinor && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-bold text-amber-900">
                  Autorisation parentale à apporter
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  Comme tu es mineure, tes parents doivent signer l&apos;autorisation
                  parentale. Apporte-la signée le jour J.
                </p>
              </div>
            </div>
            <a
              href="/legal/adhesion-mineur.pdf"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Re-télécharger le PDF
            </a>
          </div>
        )}

        {/* What's next */}
        <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            La suite
          </p>
          <div className="space-y-2 text-sm text-zinc-700">
            <p className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
              <span>
                Tu vas recevoir <strong>2 emails de relance</strong> : un à J-7 et un à J-2,
                avec un bouton pour confirmer ou te désister en un clic.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Phone className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
              <span>
                Si on n&apos;a pas de retour, on t&apos;appellera. Garde un œil sur tes
                appels !
              </span>
            </p>
          </div>
        </div>

        <div className="text-center">
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
