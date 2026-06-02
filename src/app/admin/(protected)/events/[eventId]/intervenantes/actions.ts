"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SpeakerStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Result =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().optional(),
);

const speakerSchema = z.object({
  eventId: z.string().min(1),
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  jobTitle: optionalText,
  company: optionalText,
  domain: optionalText,
  bio: optionalText,
  photoUrl: optionalText,
  status: z.enum(["invitee", "brief_envoye", "confirmee"]),
});

export type SpeakerInput = z.infer<typeof speakerSchema>;

/** Confirms the event belongs to the admin's org before mutating. */
async function assertEventInOrg(eventId: string, organisationId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organisationId, deletedAt: null },
    select: { id: true },
  });
  return Boolean(event);
}

export async function createSpeaker(input: SpeakerInput): Promise<Result> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch {
    return { ok: false, error: "Non autorisé." };
  }

  const parsed = speakerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  if (!(await assertEventInOrg(data.eventId, ctx.admin.organisationId))) {
    return { ok: false, error: "Événement introuvable." };
  }

  try {
    await prisma.speaker.create({
      data: {
        organisationId: ctx.admin.organisationId,
        eventId: data.eventId,
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle,
        company: data.company,
        domain: data.domain,
        bio: data.bio,
        photoUrl: data.photoUrl,
        status: data.status as SpeakerStatus,
      },
    });
    revalidatePath(`/admin/events/${data.eventId}/intervenantes`);
    return { ok: true };
  } catch (err) {
    console.error("[createSpeaker]", err);
    return { ok: false, error: "Impossible d'ajouter l'intervenante." };
  }
}

export async function updateSpeaker(
  speakerId: string,
  input: SpeakerInput,
): Promise<Result> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch {
    return { ok: false, error: "Non autorisé." };
  }

  const parsed = speakerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  try {
    // Scope the update to the admin's org so a forged id can't touch another tenant.
    const existing = await prisma.speaker.findFirst({
      where: { id: speakerId, organisationId: ctx.admin.organisationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Intervenante introuvable." };

    await prisma.speaker.update({
      where: { id: speakerId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle ?? null,
        company: data.company ?? null,
        domain: data.domain ?? null,
        bio: data.bio ?? null,
        photoUrl: data.photoUrl ?? null,
        status: data.status as SpeakerStatus,
      },
    });
    revalidatePath(`/admin/events/${data.eventId}/intervenantes`);
    return { ok: true };
  } catch (err) {
    console.error("[updateSpeaker]", err);
    return { ok: false, error: "Impossible de modifier l'intervenante." };
  }
}

export async function deleteSpeaker(
  speakerId: string,
  eventId: string,
): Promise<Result> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch {
    return { ok: false, error: "Non autorisé." };
  }

  try {
    const existing = await prisma.speaker.findFirst({
      where: { id: speakerId, organisationId: ctx.admin.organisationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Intervenante introuvable." };

    // Soft delete — keeps history and any group link intact.
    await prisma.speaker.update({
      where: { id: speakerId },
      data: { deletedAt: new Date() },
    });
    revalidatePath(`/admin/events/${eventId}/intervenantes`);
    return { ok: true };
  } catch (err) {
    console.error("[deleteSpeaker]", err);
    return { ok: false, error: "Impossible de supprimer l'intervenante." };
  }
}
