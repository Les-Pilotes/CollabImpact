import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { sendMagicLink, signInWithGoogle } from "./actions";

export const metadata = { title: "Connexion admin, Les Pilotes" };

const REASON_MESSAGES: Record<string, string> = {
  "not-authorized": "Cet email n'est pas autorisé à accéder à l'admin.",
  "auth-unavailable":
    "Service d'authentification indisponible. Réessaie dans quelques secondes — si ça persiste, regarde les logs Vercel.",
  "db-error":
    "Base de données inaccessible. Vérifie DATABASE_URL côté Vercel (env vars du projet).",
  "magic-sent": "Un lien de connexion vient d'être envoyé à ton email.",
  "magic-error":
    "Impossible d'envoyer le lien magique. Vérifie l'orthographe de l'email puis réessaie.",
  "rate-limit":
    "Trop de tentatives sur cet email. Attends quelques minutes puis réessaie, ou connecte-toi avec Google.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const isDevBypass =
    process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "true";
  const message = reason ? REASON_MESSAGES[reason] : null;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-10">
        <header className="space-y-1">
          <Link href="/" className="inline-flex items-baseline gap-2">
            <span className="font-semibold text-lg tracking-tight text-stone-900">Les Pilotes</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-stone-500">admin</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Connexion</h1>
        </header>

        {message && (
          <div
            role="status"
            className={`flex items-start gap-2 text-sm ${
              reason === "magic-sent" ? "text-emerald-800" : "text-amber-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{message}</p>
          </div>
        )}

        {isDevBypass ? (
          <div className="space-y-4">
            <p className="text-sm text-stone-600 leading-relaxed">
              Mode développeur actif (DEV_BYPASS_AUTH=true), tu peux entrer
              directement en tant que premier admin de la DB.
            </p>
            <Button asChild className="w-full" size="lg">
              <Link href="/admin">
                Continuer en mode dev
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary: Google */}
            <form action={signInWithGoogle}>
              <Button type="submit" variant="outline" className="w-full gap-3" size="lg">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden>
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuer avec Google
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400">ou</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Secondary: Magic link */}
            <form action={sendMagicLink} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-stone-600">Lien magique par email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ton.email@les-pilotes.fr"
                />
              </div>
              <Button type="submit" variant="ghost" className="w-full text-stone-600">
                Envoyer le lien
              </Button>
            </form>
          </div>
        )}

        <p className="text-xs text-stone-400">
          <Link href="/" className="hover:text-stone-700">
            {"<- Retour à l'accueil"}
          </Link>
        </p>
      </div>
    </div>
  );
}
