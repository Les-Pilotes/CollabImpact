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
    // Session valide mais email non whitelisté — déconnexion et retour au login.
    await supabase.auth.signOut();
    redirect("/admin/login?reason=not-authorized");
  }

  return { admin, user };
}

/**
 * Garde d'accès pour toute route /me.
 * Vérifie 1) session Supabase valide, 2) User présent dans notre DB.
 * Redirige vers /auth/login si non authentifié.
 */
export async function requireJeune() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email.toLowerCase() },
  });

  if (!dbUser) {
    // Auth session existe mais pas de User en DB (edge case) — on déconnecte
    await supabase.auth.signOut();
    redirect("/auth/login");
  }

  return { dbUser, authUser };
}

/**
 * Récupère l'utilisateur authentifié sans rediriger.
 * Retourne null si non connecté ou si User pas dans notre DB.
 * Utile pour les pages publiques qui s'adaptent selon l'état de connexion.
 */
export async function getOptionalUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) return null;

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email.toLowerCase() },
    });

    if (!dbUser) return null;

    return { dbUser, authUser };
  } catch {
    return null;
  }
}
