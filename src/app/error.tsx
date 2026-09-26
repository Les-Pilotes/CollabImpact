"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[public] runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative w-12 h-12 mx-auto">
          <Image src="/logo-pilotes.png" alt="Les Pilotes" fill className="object-contain" />
        </div>
        <div className="space-y-3">
          <p className="text-6xl">😵</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Une erreur s&apos;est produite</h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Ce n&apos;est pas ta faute — réessaie dans un instant. Si le problème persiste,
            écris-nous.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full max-w-xs py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold transition-colors"
          >
            Réessayer
          </button>
          <a
            href="mailto:contact@lespilotes.fr"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Nous écrire → contact@lespilotes.fr
          </a>
        </div>
      </div>
    </div>
  );
}
