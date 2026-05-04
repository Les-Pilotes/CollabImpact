import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { prisma } from "./db";

/**
 * Garde d'accès pour toute route /admin.
 * Vérifie 1) session Supabase valide, 2) email whitelist dans la table Admin.
 * À appeler en tête de chaque Server Component sous /admin ou dans le layout.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/admin/login");
  }

  const admin = await prisma.admin.findUnique({
    where: { email: user.email.toLowerCase() },
    include: { organisation: true },
  });

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?reason=not-authorized");
  }

  return { admin, user };
}
