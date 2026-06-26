import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import KanbanBoard, { type ParticipantRow, type SpeakerRow } from "./KanbanBoard";
import { capitalizeName } from "@/lib/normalize";
import { createCheckinToken } from "@/lib/tokens";

function mapStatus(s: string): ParticipantRow["status"] {
  if (s === "confirmee_j7") return "attente_j2";
  if (s === "confirmee_j2" || s === "presente") return "confirmee";
  return "attente_j7"; // inscrit, contactee
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `il y a ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export default async function ParticipantesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { admin } = await requireAdmin();
  const { eventId } = await params;

  const [enrollments, speakersRaw] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        eventId,
        deletedAt: null,
        // `presente` stays on the board (mapped to the "Attendues le Jour J"
        // column) so marking a participante présente — manually or via
        // émargement — doesn't hide her from Suivi / Workshop on the day.
        status: { notIn: ["desistement", "absente", "feedback_recu"] },
      },
      include: { user: true },
      orderBy: { enrolledAt: "asc" },
    }),
    prisma.speaker.findMany({
      where: { eventId, organisationId: admin.organisationId, deletedAt: null },
      orderBy: [{ createdAt: "asc" }],
      select: { id: true, firstName: true, lastName: true, domain: true },
    }),
  ]);

  const speakers: SpeakerRow[] = speakersRaw;

  const participants: ParticipantRow[] = enrollments.map((e) => {
    const history: ParticipantRow["history"] = [
      {
        id: "enroll",
        label: "Inscription · Email de confirmation envoyé",
        kind: "email",
        ts: e.enrolledAt.getTime(),
        relTime: relativeTime(e.enrolledAt),
      },
    ];
    if (e.j7SentAt) {
      history.push({
        id: "j7",
        label: "Confirmation J-7 · Email envoyé",
        kind: "email",
        ts: e.j7SentAt.getTime(),
        relTime: relativeTime(e.j7SentAt),
      });
    }
    if (e.status === "confirmee_j7" || e.status === "confirmee_j2") {
      history.push({
        id: "conf_j7",
        label: "Confirmation J-7 · Présence confirmée",
        kind: "success",
        ts: (e.j7SentAt?.getTime() ?? e.enrolledAt.getTime()) + 3600000,
        relTime: relativeTime(new Date((e.j7SentAt?.getTime() ?? e.enrolledAt.getTime()) + 3600000)),
      });
    }
    if (e.j2SentAt) {
      history.push({
        id: "j2",
        label: "Confirmation J-2 · Email envoyé",
        kind: "email",
        ts: e.j2SentAt.getTime(),
        relTime: relativeTime(e.j2SentAt),
      });
    }
    if (e.status === "confirmee_j2") {
      history.push({
        id: "conf_j2",
        label: "Confirmation J-2 · Présence confirmée",
        kind: "success",
        ts: (e.j2SentAt?.getTime() ?? e.enrolledAt.getTime()) + 3600000,
        relTime: relativeTime(new Date((e.j2SentAt?.getTime() ?? e.enrolledAt.getTime()) + 3600000)),
      });
    }

    // Only confirmées get a personal QR — TTL is short, no need to generate
    // tokens for participantes still in the J-7/J-2 funnel.
    const checkinToken =
      e.status === "confirmee_j2" ? createCheckinToken(e.id) : null;

    return {
      id: e.id,
      firstName: capitalizeName(e.user.firstName),
      lastName: capitalizeName(e.user.lastName),
      email: e.user.email,
      phone: e.user.phone ?? null,
      city: e.user.city ?? null,
      source: e.source ?? e.user.source ?? "inconnu",
      enrolledAt: e.enrolledAt.toISOString(),
      status: mapStatus(e.status),
      realStatus: e.status,
      j7EmailSent: !!e.j7SentAt,
      j2EmailSent: !!e.j2SentAt,
      droitsImageStatus: e.droitsImageStatus,
      // Orientation fields (PR #3) — surfaced in the Workshop tab so the admin
      // can compose groups based on niveau/projet/centres d'intérêt/région.
      niveauScolaire: e.user.niveauScolaire ?? null,
      niveauScolaireAutre: e.user.niveauScolaireAutre ?? null,
      projetPro: e.user.projetPro ?? null,
      motivation: e.user.motivation ?? [],
      region: e.user.region ?? null,
      checkinToken,
      history,
    };
  });

  return <KanbanBoard initialParticipants={participants} eventId={eventId} speakers={speakers} />;
}
