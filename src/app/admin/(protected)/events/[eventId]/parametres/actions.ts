"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type FormConfigInput = {
  // Couche Fondamentale
  phoneEnabled: boolean;
  birthDateEnabled: boolean;
  cityEnabled: boolean;
  // Couche Orientation
  niveauScolaireEnabled: boolean;
  regionEnabled: boolean;
  projetProEnabled: boolean;
  motivationEnabled: boolean;
  sourceEnabled: boolean;
  // Couche Événement
  droitsImageEnabled: boolean;
  regimeEnabled: boolean;
  accessibiliteEnabled: boolean;
  commentaireEnabled: boolean;
};

export async function upsertFormConfig(
  eventId: string,
  data: FormConfigInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.formConfig.upsert({
      where: { eventId },
      create: { eventId, ...data },
      update: data,
    });
    revalidatePath(`/admin/events/${eventId}/parametres`);
    return { ok: true };
  } catch (err) {
    console.error("[upsertFormConfig]", err);
    return { ok: false, error: "Erreur lors de la sauvegarde." };
  }
}

export type EmailFieldKey =
  | "confirmationSubject"
  | "confirmationBody"
  | "confirmationNote"
  | "j7Subject"
  | "j7Body"
  | "j7Note"
  | "j2Subject"
  | "j2Body"
  | "j2Note"
  | "feedbackSubject"
  | "feedbackBody"
  | "feedbackNote";

export type EmailConfigInput = Record<EmailFieldKey, string>;

export async function upsertEmailConfig(
  eventId: string,
  data: Partial<EmailConfigInput>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const cleaned: Partial<Record<EmailFieldKey, string | null>> = {};
    for (const [key, value] of Object.entries(data) as [EmailFieldKey, string][]) {
      const trimmed = (value ?? "").trim();
      cleaned[key] = trimmed === "" ? null : trimmed;
    }
    await prisma.emailConfig.upsert({
      where: { eventId },
      create: { eventId, ...cleaned },
      update: cleaned,
    });
    revalidatePath(`/admin/events/${eventId}/parametres`);
    return { ok: true };
  } catch (err) {
    console.error("[upsertEmailConfig]", err);
    return { ok: false, error: "Erreur lors de la sauvegarde." };
  }
}
