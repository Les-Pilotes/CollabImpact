import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl bg-white shadow-sm border border-zinc-100 p-10 space-y-6">
          <div className="text-5xl">🎉</div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">
              Workshop 100% Féminin — La Cité Audacieuse
            </h1>
            <p className="text-lg font-semibold text-zinc-700">
              Ton inscription est bien enregistrée
            </p>
          </div>
          <p className="text-sm text-zinc-500">
            Tu recevras un email de confirmation dans quelques instants. Pense à vérifier
            tes spams si tu ne le reçois pas.
          </p>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
