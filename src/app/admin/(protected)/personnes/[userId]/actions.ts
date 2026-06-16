"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type DroitsImageAdminAction = "accept" | "refuse" | "reset";

export type DroitsImageAdminResult = { ok: true } | { ok: false; error: string };

/**
 * Lets an admin override a participant's global droit-à-l'image consent — used
 * when the person calls or emails to update their decision (RGPD: revocation
 * must be as easy as consent). Cross-org guard prevents a forged userId from
 * mutating another organisation's user.
 *
 * - "accept" / "refuse" : record the decision, signed by the admin acting on
 *   behalf of the participant (signature stores admin email for traceability).
 * - "reset" : clear the global state — the next inscription will ask again.
 *
 * Per-event Enrollment snapshots are not retroactively modified. The new
 * global decision only applies to future enrollments + when the form skips
 * the consent step.
 */
export async function setUserDroitsImageGlobal(
  userId: string,
  action: DroitsImageAdminAction,
): Promise<DroitsImageAdminResult> {
  try {
    const { admin } = await requireAdmin();

    const user = await prisma.user.findFirst({
      where: { id: userId, organisationId: admin.organisationId, deletedAt: null },
      select: { id: true },
    });
    if (!user) return { ok: false, error: "Personne introuvable." };

    if (action === "reset") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          droitsImageStatus: null,
          droitsImageSignedAt: null,
          droitsImageSignature: null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          droitsImageStatus: action === "accept" ? "accepted" : "refused",
          droitsImageSignedAt: new Date(),
          // Admin-signed records the acting admin's email so the audit log
          // distinguishes participant self-consent from admin override.
          droitsImageSignature: `[admin:${admin.email}]`,
        },
      });
    }

    revalidatePath(`/admin/personnes/${userId}`);
    return { ok: true };
  } catch (err) {
    console.error("[setUserDroitsImageGlobal]", err);
    return { ok: false, error: "Erreur lors de la mise à jour." };
  }
}
