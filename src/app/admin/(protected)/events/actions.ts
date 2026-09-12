"use server";

import { revalidatePath } from "next/cache";
import { ImmersionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emitNotification } from "@/lib/notifications/emit";
import {
  createEventSchema,
  updateEventSchema,
  ALLOWED_TRANSITIONS,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/lib/validation/event";

const STATUS_LABEL_FR: Record<ImmersionStatus, string> = {
  brouillon: "Brouillon",
  publie: "Publié",
  complet: "Complet",
  en_cours: "En cours",
  termine: "Terminé",
  archive: "Archivé",
};

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function combineDateTime(dateISO: string, time: string): Date {
  // Interpret the admin input as Europe/Paris local time and convert to UTC.
  // The trick: create the moment as if it were UTC, ask what Paris reads at that UTC
  // moment, then shift by the difference — this handles DST automatically.
  const asIfUtc = new Date(`${dateISO}T${time}:00Z`);
  const parisLocal = new Date(asIfUtc.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const offsetMs = asIfUtc.getTime() - parisLocal.getTime();
  return new Date(asIfUtc.getTime() + offsetMs);
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
        endTime: data.endTime && data.endTime !== "" ? combineDateTime(data.date, data.endTime) : null,
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
      select: { status: true, name: true, organisationId: true },
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

    void emitNotification({
      organisationId: event.organisationId,
      type: "event.status_changed",
      title: `${event.name} : ${STATUS_LABEL_FR[event.status]} → ${STATUS_LABEL_FR[newStatus]}`,
      eventId,
      metadata: { from: event.status, to: newStatus },
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
