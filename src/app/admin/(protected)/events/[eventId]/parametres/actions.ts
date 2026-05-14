"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function upsertFormConfig(
  eventId: string,
  data: {
    phoneEnabled: boolean;
    birthDateEnabled: boolean;
    cityEnabled: boolean;
    sourceEnabled: boolean;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.formConfig.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
    return { ok: true };
  } catch (err) {
    console.error("[upsertFormConfig]", err);
    return { ok: false, error: "Erreur lors de la sauvegarde." };
  }
}

export async function upsertEmailConfig(
  eventId: string,
  data: {
    confirmationNote: string;
    j7Note: string;
    j2Note: string;
    feedbackNote: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const cleaned = {
      confirmationNote: data.confirmationNote.trim() || null,
      j7Note: data.j7Note.trim() || null,
      j2Note: data.j2Note.trim() || null,
      feedbackNote: data.feedbackNote.trim() || null,
    };
    await prisma.emailConfig.upsert({
      where: { eventId },
      create: { eventId, ...cleaned },
      update: cleaned,
    });
    return { ok: true };
  } catch (err) {
    console.error("[upsertEmailConfig]", err);
    return { ok: false, error: "Erreur lors de la sauvegarde." };
  }
}
