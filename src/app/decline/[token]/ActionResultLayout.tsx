import Image from "next/image";
import Link from "next/link";

const variantClasses = {
  success: "bg-emerald-50 border-emerald-200",
  info: "bg-zinc-50 border-zinc-200",
  warning: "bg-amber-50 border-amber-200",
  danger: "bg-red-50 border-red-200",
} as const;

type Variant = keyof typeof variantClasses;

export function ActionResultLayout({
  emoji,
  title,
  description,
  variant,
}: {
  emoji: string;
  title: string;
  description: React.ReactNode;
  variant: Variant;
}) {
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
      <main className="max-w-lg mx-auto px-4 py-16">
        <div
          className={`rounded-2xl border p-8 text-center space-y-4 ${variantClasses[variant]}`}
        >
          <div className="text-6xl">{emoji}</div>
          <h1 className="text-2xl font-extrabold text-zinc-900 leading-tight">{title}</h1>
          <div className="text-sm text-zinc-700 leading-relaxed">{description}</div>
        </div>
        <div className="text-center mt-6">
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
