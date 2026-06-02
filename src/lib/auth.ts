import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { prisma } from "./db";
import { isAllowedAdminEmail } from "./auth/allowed-domains";

/**
 * Garde d'accès pour toute route /admin/(protected)/*.
 *
 * Verrous :
 * 1. session Supabase active
 * 2. email du compte ∈ ALLOWED_ADMIN_DOMAINS (verrou de domaine)
 * 3. email présent dans la whitelist `Admin` (verrou de personne)
 *
 * Dev local : si `NODE_ENV=development` ET `DEV_BYPASS_AUTH=true`, retourne
 * le premier Admin de la DB sans appeler Supabase. Désactivé en test/prod.
 */
export async function requireAdmin() {
  if (
    process.env.DEV_BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production" &&
    process.env.NODE_ENV !== "test"
  ) {
    console.warn("[requireAdmin] DEV_BYPASS_AUTH actif — auth désactivée");
    let admin;
    try {
      admin = await prisma.admin.findFirst({ include: { organisation: true } });
    } catch (err) {
      console.error("[requireAdmin] DB unreachable in DEV_BYPASS_AUTH mode:", err);
      redirect("/admin/login?reason=db-error");
    }
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

  if (!isAllowedAdminEmail(userEmail)) {
    console.warn(
      `[requireAdmin] domaine non autorisé pour ${userEmail} — sign-out forcé`,
    );
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    redirect("/admin/login?reason=domain-not-allowed");
  }

  let admin;
  try {
    admin = await prisma.admin.findUnique({
      where: { email: userEmail.toLowerCase() },
      include: { organisation: true },
    });
  } catch (err) {
    console.error("[requireAdmin] DB unreachable when looking up admin:", err);
    redirect("/admin/login?reason=db-error");
  }

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

/**
 * Tighter guard for actions that should be restricted to SUPER_ADMIN
 * (CRUD on other admins, sensitive global config). Throws (not redirect)
 * so calling server actions can surface the error to the user.
 */
export async function requireSuperAdmin() {
  const ctx = await requireAdmin();
  if (ctx.admin.role !== "SUPER_ADMIN") {
    throw new Error("Action réservée aux super-administrateurs.");
  }
  return ctx;
}
