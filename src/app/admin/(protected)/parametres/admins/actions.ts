"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";

type Result =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const inviteSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().email("Email invalide"),
  ),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

export type InviteAdminInput = z.infer<typeof inviteSchema>;

export async function inviteAdmin(input: InviteAdminInput): Promise<Result> {
  let ctx;
  try {
    ctx = await requireSuperAdmin();
  } catch {
    return { ok: false, error: "Action réservée aux super-administrateurs." };
  }

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;
  const normalizedEmail = data.email.toLowerCase().trim();

  try {
    const existing = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return { ok: false, error: "Cet email est déjà administrateur." };
    }

    await prisma.admin.create({
      data: {
        email: normalizedEmail,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: data.role as AdminRole,
        organisationId: ctx.admin.organisationId,
      },
    });
    revalidatePath("/admin/parametres/admins");
    return { ok: true };
  } catch (err) {
    console.error("[inviteAdmin]", err);
    return { ok: false, error: "Impossible d'inviter cet administrateur." };
  }
}

export async function removeAdmin(adminId: string): Promise<Result> {
  let ctx;
  try {
    ctx = await requireSuperAdmin();
  } catch {
    return { ok: false, error: "Action réservée aux super-administrateurs." };
  }

  if (adminId === ctx.admin.id) {
    return { ok: false, error: "Tu ne peux pas te retirer toi-même." };
  }

  try {
    // Guard against removing the last SUPER_ADMIN
    const target = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { role: true },
    });
    if (!target) return { ok: false, error: "Administrateur introuvable." };

    if (target.role === "SUPER_ADMIN") {
      const remainingSuperAdmins = await prisma.admin.count({
        where: { role: "SUPER_ADMIN", id: { not: adminId } },
      });
      if (remainingSuperAdmins === 0) {
        return {
          ok: false,
          error: "Impossible — il doit rester au moins un super-administrateur.",
        };
      }
    }

    await prisma.admin.delete({ where: { id: adminId } });
    revalidatePath("/admin/parametres/admins");
    return { ok: true };
  } catch (err) {
    console.error("[removeAdmin]", err);
    return { ok: false, error: "Impossible de retirer cet administrateur." };
  }
}

export async function updateAdminRole(
  adminId: string,
  newRole: AdminRole,
): Promise<Result> {
  let ctx;
  try {
    ctx = await requireSuperAdmin();
  } catch {
    return { ok: false, error: "Action réservée aux super-administrateurs." };
  }

  if (adminId === ctx.admin.id && newRole !== "SUPER_ADMIN") {
    return { ok: false, error: "Tu ne peux pas révoquer ton propre rôle super-admin." };
  }

  try {
    if (newRole === "ADMIN") {
      // Guard last SUPER_ADMIN
      const remainingSuperAdmins = await prisma.admin.count({
        where: { role: "SUPER_ADMIN", id: { not: adminId } },
      });
      if (remainingSuperAdmins === 0) {
        return {
          ok: false,
          error: "Impossible — il doit rester au moins un super-administrateur.",
        };
      }
    }

    await prisma.admin.update({
      where: { id: adminId },
      data: { role: newRole },
    });
    revalidatePath("/admin/parametres/admins");
    return { ok: true };
  } catch (err) {
    console.error("[updateAdminRole]", err);
    return { ok: false, error: "Impossible de modifier ce rôle." };
  }
}

/** Compatibility — server actions used by Server Components need an ID. */
export async function getCurrentAdminId(): Promise<string | null> {
  try {
    const ctx = await requireAdmin();
    return ctx.admin.id;
  } catch {
    return null;
  }
}
