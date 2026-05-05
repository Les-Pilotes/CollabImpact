import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { sendMagicLink } from "./actions";

export const metadata = { title: "Connexion admin, Les Pilotes" };

const REASON_MESSAGES: Record<string, string> = {
  "not-authorized": "Cet email n'est pas autorisé à accéder à l'admin.",
  "auth-unavailable":
    "Service d'authentification indisponible. Si tu testes en local, active DEV_BYPASS_AUTH=true.",
  "magic-sent": "Un lien de connexion vient d'être envoyé à ton email.",
  "magic-error": "Impossible d'envoyer le lien magique. Vérifie l'email ou réessaie.",
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
          <form action={sendMagicLink} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ton.email@lespilotes.fr"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Envoyer le lien magique
            </Button>
            <p className="text-xs text-stone-500 leading-relaxed max-w-[60ch]">
              Tu recevras un lien de connexion par email. Seuls les admins
              whitelistés peuvent se connecter.
            </p>
          </form>
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
