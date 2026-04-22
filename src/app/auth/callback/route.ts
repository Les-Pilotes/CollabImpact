import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

const ORG_ID = process.env.LES_PILOTES_ORG_ID!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/me";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?reason=no-code`);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    console.error("[auth/callback] exchangeCodeForSession error:", error);
    return NextResponse.redirect(`${origin}/auth/login?reason=invalid-code`);
  }

  const email = data.user.email.toLowerCase();
  const supabaseAuthId = data.user.id;

  // 1. Check Admin whitelist
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (admin) {
    // Admin confirmed — redirect to /admin or the requested `next` if it starts with /admin
    const destination = next.startsWith("/admin") ? next : "/admin";
    return NextResponse.redirect(`${origin}${destination}`);
  }

  // 2. Upsert jeune (User) in our DB
  await prisma.user.upsert({
    where: { email },
    update: {
      supabaseAuthId,
      // keep existing data, just refresh the auth binding
    },
    create: {
      organisationId: ORG_ID,
      email,
      supabaseAuthId,
    },
  });

  // 3. Redirect jeune to their requested destination (default /me)
  // Only allow /me routes for non-admins
  const safeNext = next.startsWith("/admin") ? "/me" : next;
  return NextResponse.redirect(`${origin}${safeNext}`);
}
