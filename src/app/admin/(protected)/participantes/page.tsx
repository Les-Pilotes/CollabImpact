import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import KanbanBoard, { type ParticipantRow } from "./KanbanBoard";
import { capitalizeName } from "@/lib/normalize";

const EVENT_ID = "seed-event-cite-audacieuse";

function mapStatus(s: string): ParticipantRow["status"] {
  if (s === "confirmee_j7") return "attente_j2";
  if (s === "confirmee_j2") return "confirmee";
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

export default async function ParticipantesPage() {
  await requireAdmin();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      immersionId: EVENT_ID,
      deletedAt: null,
      status: { notIn: ["desistement", "absente", "presente", "feedback_recu"] },
    },
    include: { user: true },
    orderBy: { enrolledAt: "asc" },
  });

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
      j7EmailSent: !!e.j7SentAt,
      j2EmailSent: !!e.j2SentAt,
      history,
    };
  });

  return <KanbanBoard initialParticipants={participants} />;
}
