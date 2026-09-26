import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EnrollmentStatus } from "@prisma/client";
import { ParticipantActions } from "./ParticipantActions";
import { ParticipantSummary } from "./ParticipantSummary";
import { OrientationLayer } from "./OrientationLayer";
import { EventLayer } from "./EventLayer";
import { Timeline, type TimelineEntry, type TimelineKind } from "./Timeline";
import { InternalNote } from "./InternalNote";
import { FeedbackCard } from "./FeedbackCard";

export const metadata = { title: "Participante — Admin" };

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  inscrit: "Inscrite",
  contactee: "Contactée",
  confirmee_j7: "Confirmée J-7",
  confirmee_j2: "Confirmée J-2",
  presente: "Présente",
  absente: "Absente",
  desistement: "Désistement",
  feedback_recu: "Feedback reçu",
};

type BadgeTone =
  | "default"
  | "warning"
  | "success"
  | "destructive"
  | "muted"
  | "secondary"
  | "outline";

const STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  inscrit: "muted",
  contactee: "secondary",
  confirmee_j7: "outline",
  confirmee_j2: "outline",
  presente: "success",
  absente: "destructive",
  desistement: "warning",
  feedback_recu: "success",
};

function eventKind(type: string, label: string): TimelineKind {
  if (type === "email_failed") return "danger";
  if (type === "email_sent") return "email";
  if (type === "checked_in" || type === "feedback_submitted") return "success";
  if (type === "status_changed") {
    return label.includes("absente") || label.includes("Désistement") ? "danger" : "success";
  }
  return "neutral";
}

function computeAge(birthDate: Date, atDate: Date): number {
  let age = atDate.getFullYear() - birthDate.getFullYear();
  const m = atDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && atDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; enrollmentId: string }>;
}) {
  await requireAdmin();

  const { eventId, enrollmentId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: true,
      event: true,
      feedback: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!enrollment) {
    notFound();
  }

  const { user, event, feedback } = enrollment;

  // Event-day window check (±1 day) for attendance buttons.
  const eventDate = new Date(event.date);
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - eventDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const isEventDay = diffDays <= 1;

  // Age / minor detection — computed at the event date so a 17-yo enrolled
  // today but turning 18 before the event is correctly counted as majeure.
  const ageOnEventDay = user.birthDate
    ? computeAge(new Date(user.birthDate), eventDate)
    : null;
  const isMinor = ageOnEventDay !== null && ageOnEventDay < 18;

  // Timeline assembly — "Inscription" and "Droits image" come from reliable
  // real fields; everything else (confirmations, emails, présence, feedback)
  // comes from EnrollmentEvent, the real history log (see
  // src/lib/enrollment/timeline.ts). This replaces the previous version,
  // which fabricated "Confirmée J-7/J-2" timestamps as sentAt + 1h and used
  // `updatedAt` as a stand-in for "when was she marked absente/désistée".
  const timeline: TimelineEntry[] = [];
  timeline.push({
    id: "enroll",
    kind: "neutral",
    label: "Inscription",
    detail: enrollment.source
      ? `Source : ${enrollment.source}`
      : undefined,
    ts: enrollment.enrolledAt.getTime(),
  });
  if (enrollment.droitsImageSignedAt) {
    const droitsLabel =
      enrollment.droitsImageStatus === "accepted"
        ? "Droits image acceptés"
        : enrollment.droitsImageStatus === "refused"
          ? "Droits image refusés"
          : "Droits image — signature";
    timeline.push({
      id: "droits",
      kind:
        enrollment.droitsImageStatus === "accepted"
          ? "success"
          : enrollment.droitsImageStatus === "refused"
            ? "danger"
            : "neutral",
      label: droitsLabel,
      detail: enrollment.droitsImageSignature
        ? `Signé par ${enrollment.droitsImageSignature}`
        : undefined,
      ts: enrollment.droitsImageSignedAt.getTime(),
    });
  }
  for (const e of enrollment.events) {
    timeline.push({
      id: e.id,
      kind: eventKind(e.type, e.label),
      label: e.label,
      ts: e.createdAt.getTime(),
    });
  }

  const hasDietary = enrollment.regime.length > 0;
  const hasAccessibility = !!enrollment.accessibilite && enrollment.accessibilite.trim().length > 0;

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/events/${eventId}/inscrites`}
        className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        ← Retour aux inscrites
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Main column — scrolls independently on tall screens */}
        <main className="space-y-6 min-w-0">
          <ParticipantSummary
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            phone={user.phone}
            city={user.city}
            birthDate={user.birthDate}
            gender={user.gender}
            isMinor={isMinor}
            ageOnEventDay={ageOnEventDay}
            hasDietary={hasDietary}
            hasAccessibility={hasAccessibility}
            droitsImageStatus={enrollment.droitsImageStatus}
            statusLabel={STATUS_LABELS[enrollment.status]}
            statusTone={STATUS_TONE[enrollment.status]}
          />

          <OrientationLayer
            niveauScolaire={user.niveauScolaire}
            niveauScolaireAutre={user.niveauScolaireAutre}
            etablissement={user.etablissement}
            region={user.region}
            projetPro={user.projetPro}
            motivation={user.motivation}
            motivationDetail={user.motivationDetail}
            commentConnu={user.commentConnu}
            orientationUpdatedAt={user.orientationUpdatedAt}
          />

          <EventLayer
            enrolledAt={enrollment.enrolledAt}
            mode={enrollment.mode}
            referentName={enrollment.referentName}
            source={enrollment.source}
            userSource={user.source}
            droitsImageStatus={enrollment.droitsImageStatus}
            droitsImageSignedAt={enrollment.droitsImageSignedAt}
            droitsImageSignature={enrollment.droitsImageSignature}
            regime={enrollment.regime}
            accessibilite={enrollment.accessibilite}
            accompagnateur={enrollment.accompagnateur}
            commentaire={enrollment.commentaire}
          />

          <InternalNote
            enrollmentId={enrollment.id}
            initialNote={enrollment.internalNote}
          />

          {feedback && <FeedbackCard feedback={feedback} />}
        </main>

        {/* Right rail — actions & timeline. Sticks on lg+ so it stays
            visible as the main column scrolls. */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="p-5 border-b border-stone-100">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-orange)]">
                Action
              </p>
              <h2 className="mt-1 text-lg font-semibold text-stone-900">
                Prochaine étape
              </h2>
            </div>
            <div className="p-5">
              <ParticipantActions
                enrollmentId={enrollment.id}
                currentStatus={enrollment.status}
                j7SentAt={enrollment.j7SentAt}
                j2SentAt={enrollment.j2SentAt}
                feedbackToken={enrollment.feedbackToken}
                feedbackSentAt={enrollment.feedbackSentAt}
                isEventDay={isEventDay}
              />
            </div>
          </section>

          <Timeline entries={timeline} />
        </aside>
      </div>
    </div>
  );
}
