import Image from "next/image";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative w-12 h-12 mx-auto">
          <Image src="/logo-pilotes.png" alt="Les Pilotes" fill className="object-contain" />
        </div>
        <div className="space-y-3">
          <p className="text-6xl">🤔</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Page introuvable</h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Le lien que tu as suivi ne mène nulle part. Vérifie que tu as bien copié l&apos;adresse
            complète, ou repars du dernier email reçu.
          </p>
        </div>
        <a
          href="mailto:contact@lespilotes.fr"
          className="inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Nous écrire → contact@lespilotes.fr
        </a>
      </div>
    </div>
  );
}
