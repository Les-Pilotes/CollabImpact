"use client";

import { useEffect } from "react";

export default function ProtectedAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/(protected)] runtime error:", error);
  }, [error]);

  const isVisible =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-red-700">Erreur serveur</p>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Une erreur s&apos;est produite sur l&apos;admin.
          </h1>
        </header>

        {isVisible && (
          <details
            open
            className="bg-white border border-stone-200 rounded-md p-4 text-sm font-mono text-stone-800"
          >
            <summary className="cursor-pointer font-sans font-medium text-stone-900 mb-2">
              Détails techniques (visible en preview/dev)
            </summary>
            <p className="mt-3 text-stone-700">
              <strong>Message:</strong> {error.message || "(no message)"}
            </p>
            {error.digest && (
              <p className="mt-1 text-stone-500">
                <strong>Digest:</strong> {error.digest}
              </p>
            )}
            {error.stack && (
              <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-stone-600 max-h-96 overflow-auto bg-stone-50 p-3 rounded">
                {error.stack}
              </pre>
            )}
          </details>
        )}

        {!isVisible && (
          <p className="text-sm text-stone-600">
            Si tu peux, recharge la page. Si le problème persiste, contacte l&apos;équipe technique.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-stone-900 text-white text-sm font-medium px-4 py-2 hover:bg-stone-800 transition-colors"
          >
            Réessayer
          </button>
          <a
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-md border border-stone-300 text-stone-700 text-sm font-medium px-4 py-2 hover:bg-stone-100 transition-colors"
          >
            Aller à la connexion
          </a>
        </div>
      </div>
    </div>
  );
}
