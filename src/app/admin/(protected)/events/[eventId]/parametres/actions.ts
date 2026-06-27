"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { NotificationConfig } from "@/lib/notifications/config";

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

/**
 * Persist the feedback form configuration. Each question of the canonical
 * feedback questionnaire is toggled on/off; we store that map in the existing
 * `FeedbackConfig.customFields` JSON column so no migration is needed (cf.
 * AGENTS.md — JSON pour éviter les migrations à chaque champ). The legacy
 * boolean columns (satisfactionEnabled…) are left at their defaults — the new
 * UI is driven entirely by `customFields.fields`.
 */
export async function upsertFeedbackConfig(
  eventId: string,
  enabledFields: Record<string, boolean>,
  animatriceName?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const customFields = animatriceName !== undefined
      ? { fields: enabledFields, animatriceName: animatriceName.trim() }
      : { fields: enabledFields };
    await prisma.feedbackConfig.upsert({
      where: { eventId },
      create: { eventId, customFields },
      update: { customFields },
    });
    revalidatePath(`/admin/events/${eventId}/parametres`);
    return { ok: true };
  } catch (err) {
    console.error("[upsertFeedbackConfig]", err);
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

/**
 * Persist per-event admin notification settings. We trust the toggle but
 * sanitize the recipient list: only admins of the same organisation that have
 * already validated their access (lastLoginAt !== null) are kept. This is the
 * server-side enforcement — the UI also hides never-connected admins, but we
 * defend in depth so a stale client state can't enrol an invited-but-inactive
 * admin into the alert flow.
 */
export async function upsertNotificationConfig(
  eventId: string,
  data: NotificationConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { admin } = await requireAdmin();

    // Ensure the event belongs to the caller's organisation — prevents
    // cross-tenant writes via a forged eventId.
    const event = await prisma.event.findFirst({
      where: { id: eventId, organisationId: admin.organisationId, deletedAt: null },
      select: { id: true },
    });
    if (!event) return { ok: false, error: "Événement introuvable." };

    const validatedAdmins = await prisma.admin.findMany({
      where: {
        organisationId: admin.organisationId,
        lastLoginAt: { not: null },
        id: { in: data.recipientAdminIds },
      },
      select: { id: true },
    });
    const allowedIds = new Set(validatedAdmins.map((a) => a.id));
    const cleanIds = data.recipientAdminIds.filter((id) => allowedIds.has(id));

    const next: NotificationConfig = {
      newEnrollmentEnabled: Boolean(data.newEnrollmentEnabled),
      recipientAdminIds: cleanIds,
    };

    await prisma.event.update({
      where: { id: eventId },
      data: { notificationConfig: next },
    });

    revalidatePath(`/admin/events/${eventId}/parametres`);
    return { ok: true };
  } catch (err) {
    console.error("[upsertNotificationConfig]", err);
    return { ok: false, error: "Erreur lors de la sauvegarde." };
  }
}
