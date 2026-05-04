import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { prisma } from "./db";

/**
 * Garde d'accès pour toute route /admin/(protected)/*.
 *
 * Modes :
 * - Production / staging : vérifie session Supabase + email whitelist `Admin`.
 * - Dev local (NODE_ENV=development + DEV_BYPASS_AUTH=true) : retourne le premier
 *   Admin de la DB sans appeler Supabase. Permet de tester sans config Supabase.
 */
export async function requireAdmin() {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_BYPASS_AUTH === "true"
  ) {
    const admin = await prisma.admin.findFirst({ include: { organisation: true } });
    if (!admin) {
      throw new Error(
        "DEV_BYPASS_AUTH actif mais aucun Admin en DB. Lance `pnpm db:seed`.",
      );
    }
    return { admin, user: { email: admin.email } as { email: string } };
  }

  let userEmail: string | undefined;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email;
  } catch {
    redirect("/admin/login?reason=auth-unavailable");
  }

  if (!userEmail) {
    redirect("/admin/login");
  }

  const admin = await prisma.admin.findUnique({
    where: { email: userEmail.toLowerCase() },
    include: { organisation: true },
  });

  if (!admin) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — supabase peut être indisponible
    }
    redirect("/admin/login?reason=not-authorized");
  }

  return { admin, user: { email: userEmail } };
}
