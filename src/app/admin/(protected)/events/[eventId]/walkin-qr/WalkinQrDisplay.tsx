"use client";

import { QrCode } from "@/components/ui/qr-code";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WalkinQrDisplay({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const walkinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/walk-in/${eventId}`
      : `https://collabimpact.fr/walk-in/${eventId}`;

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6 gap-8">
      {/* Back link — hidden when printed */}
      <Link
        href={`/admin/events/${eventId}/inscrites`}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm font-medium transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Link>

      {/* Header */}
      <div className="text-center">
        <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1">
          Inscription sur place · Jour J
        </p>
        <h1 className="text-white text-2xl font-extrabold leading-tight">
          {eventName}
        </h1>
      </div>

      {/* QR code — large */}
      <QrCode value={walkinUrl} size={280} className="shadow-2xl" />

      {/* Instruction */}
      <div className="text-center space-y-1 max-w-xs">
        <p className="text-white text-lg font-semibold">
          Scanne pour t&apos;inscrire
        </p>
        <p className="text-zinc-400 text-sm">
          Prénom · Nom · Email · c&apos;est tout.
        </p>
      </div>

      {/* URL fallback */}
      <p className="text-zinc-600 text-[10px] text-center break-all max-w-xs print:text-zinc-400">
        {walkinUrl}
      </p>

      {/* Print button */}
      <button
        onClick={() => window.print()}
        className="mt-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors print:hidden"
      >
        Imprimer
      </button>
    </div>
  );
}
