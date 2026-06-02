import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/auth/allowed-domains";

/**
 * Callback Supabase Auth — échange le code PKCE contre une session,
 * puis vérifie immédiatement que l'email retourné appartient à un
 * domaine autorisé. Si non : sign-out et redirect avec raison explicite.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?reason=auth-unavailable`);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/admin/login?reason=auth-unavailable`);
  }

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;

  if (!isAllowedAdminEmail(email)) {
    console.warn(
      `[auth.callback] domaine non autorisé pour ${email ?? "<no-email>"} — sign-out`,
    );
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    return NextResponse.redirect(
      `${origin}/admin/login?reason=domain-not-allowed`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
