import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, ShieldAlert, ArrowRight } from "lucide-react";
import { sendMagicLink } from "./actions";

export const metadata = { title: "Connexion Admin — Les Pilotes" };

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-zinc-900">Les Pilotes — Admin</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  reason === "magic-sent"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-amber-50 text-amber-900 border border-amber-200"
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}

            {isDevBypass ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-zinc-900 text-white px-4 py-3 text-xs font-mono">
                  DEV_BYPASS_AUTH=true
                </div>
                <p className="text-sm text-zinc-600">
                  Mode développeur actif — l&apos;authentification Supabase est
                  bypassée. Tu peux entrer directement en tant que premier admin
                  de la DB.
                </p>
                <Button asChild className="w-full" size="lg">
                  <Link href="/admin">
                    Continuer en mode dev
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <form action={sendMagicLink} className="space-y-3">
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
                <p className="text-xs text-zinc-500 text-center">
                  Tu recevras un lien de connexion par email. Seuls les admins
                  whitelistés peuvent se connecter.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-400 mt-6">
          <Link href="/" className="hover:text-zinc-600">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
