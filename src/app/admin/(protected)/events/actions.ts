"use server";

import { revalidatePath } from "next/cache";
import { ImmersionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  createEventSchema,
  updateEventSchema,
  ALLOWED_TRANSITIONS,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validation/event";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function combineDateTime(dateISO: string, time: string): Date {
  // Build a Date in the user's timezone (server runs UTC; treat input as local time).
  // We construct from an ISO string with no Z suffix → JS parses as local time.
  return new Date(`${dateISO}T${time}:00`);
}

export async function createEvent(input: CreateEventInput): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireAdmin();
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  try {
    const event = await prisma.event.create({
      data: {
        organisationId: ctx.admin.organisationId,
        name: data.name,
        type: data.type,
        date: combineDateTime(data.date, data.time),
        address: data.address,
        capacity: data.capacity,
        description: data.description,
        status: ImmersionStatus.brouillon,
      },
      select: { id: true },
    });
    revalidatePath("/admin/events");
    return { ok: true, data: { id: event.id } };
  } catch (err) {
    console.error("[createEvent]", err);
    return { ok: false, error: "Impossible de créer l'événement." };
  }
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  try {
    await prisma.event.update({
      where: { id: eventId, deletedAt: null },
      data: {
        name: data.name,
        type: data.type,
        date: combineDateTime(data.date, data.time),
        address: data.address,
        capacity: data.capacity,
        description: data.description,
        replyToEmail: data.replyToEmail?.trim() ? data.replyToEmail.trim() : null,
        emailSignature: data.emailSignature?.trim() ? data.emailSignature.trim() : null,
      },
    });
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}/parametres`);
    revalidatePath("/admin/events");
    return { ok: true, data: undefined };
  } catch (err) {
    console.error("[updateEvent]", err);
    return { ok: false, error: "Impossible de modifier l'événement." };
  }
}

export async function transitionEventStatus(
  eventId: string,
  newStatus: ImmersionStatus,
): Promise<ActionResult> {
  await requireAdmin();

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { status: true },
    });
    if (!event) return { ok: false, error: "Événement introuvable." };

    const allowed = ALLOWED_TRANSITIONS[event.status];
    if (!allowed.includes(newStatus)) {
      return {
        ok: false,
        error: `Transition impossible (${event.status} → ${newStatus}).`,
      };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: newStatus },
    });
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/admin/events");
    return { ok: true, data: undefined };
  } catch (err) {
    console.error("[transitionEventStatus]", err);
    return { ok: false, error: "Erreur lors du changement de statut." };
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  await requireAdmin();

  try {
    await prisma.event.update({
      where: { id: eventId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/admin/events");
    return { ok: true, data: undefined };
  } catch (err) {
    console.error("[deleteEvent]", err);
    return { ok: false, error: "Impossible de supprimer l'événement." };
  }
}
