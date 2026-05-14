"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Update the admin-only internal note attached to an enrollment.
 *
 * The note is invisible to the participante. An empty / whitespace-only
 * string is persisted as `null` so the UI can render an empty state.
 */
export async function updateInternalNote(
  enrollmentId: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  if (typeof enrollmentId !== "string" || enrollmentId.length === 0) {
    return { ok: false, error: "Inscription invalide." };
  }
  if (typeof note !== "string") {
    return { ok: false, error: "Note invalide." };
  }
  if (note.length > 5000) {
    return { ok: false, error: "Note trop longue (5000 caractères max)." };
  }

  const trimmed = note.trim();
  const value = trimmed.length === 0 ? null : trimmed;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { eventId: true },
    });
    if (!enrollment) {
      return { ok: false, error: "Inscription introuvable." };
    }

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { internalNote: value },
    });

    revalidatePath(
      `/admin/events/${enrollment.eventId}/inscrites/${enrollmentId}`,
    );
    return { ok: true };
  } catch (err) {
    console.error("[updateInternalNote]", err);
    return { ok: false, error: "Erreur lors de la mise à jour de la note." };
  }
}
