"use client";

import { useState } from "react";
import Link from "next/link";
import { Rocket, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

interface Props {
  searchParams: { next?: string; reason?: string };
}

export default function LoginPage({ searchParams }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const next = searchParams.next ?? "/me";
  const reason = searchParams.reason;

  async function handleGoogle() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const redirectTo =
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const redirectTo =
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900">Les Pilotes</span>
          </Link>
        </div>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {status === "sent" ? (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">
                Vérifie tes mails !
              </h1>
              <p className="text-zinc-500 mb-2">
                On a envoyé un lien de connexion à
              </p>
              <p className="font-semibold text-zinc-900 mb-6">{email}</p>
              <p className="text-sm text-zinc-400 mb-6">
                Clique sur le lien dans l&apos;email pour accéder à ton espace. Il est valable 1h.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-500"
                onClick={() => { setStatus("idle"); setEmail(""); }}
              >
                Utiliser une autre adresse
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center shrink-0">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-zinc-900 leading-tight">
                      Connexion
                    </h1>
                    <p className="text-sm text-zinc-500">Sans mot de passe 🔐</p>
                  </div>
                </div>

                {/* Not authorized warning */}
                {reason === "not-authorized" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">
                      Cette adresse email n&apos;est pas autorisée à accéder au dashboard admin.
                    </p>
                  </div>
                )}

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-sm font-medium text-zinc-700 transition-colors mb-5"
                >
                  <GoogleIcon />
                  Continuer avec Google
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-100" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-zinc-400">ou par email</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-zinc-700 mb-1.5"
                    >
                      Adresse email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      autoComplete="email"
                      placeholder="ton@email.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] focus:border-transparent text-sm"
                    />
                  </div>

                  {status === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700">
                        {errorMsg || "Une erreur est survenue. Réessaie."}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full font-bold"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? (
                      "Envoi en cours…"
                    ) : (
                      <>
                        Recevoir mon lien <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-zinc-400 text-center mt-4">
                  En continuant, tu acceptes les conditions d&apos;utilisation de la plateforme Les Pilotes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
