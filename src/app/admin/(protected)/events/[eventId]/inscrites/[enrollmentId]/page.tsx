import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EnrollmentStatus } from "@prisma/client";
import { ParticipantActions } from "./ParticipantActions";
import { ParticipantSummary } from "./ParticipantSummary";
import { OrientationLayer } from "./OrientationLayer";
import { EventLayer } from "./EventLayer";
import { Timeline, type TimelineEntry } from "./Timeline";
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

  // Timeline assembly — chronological events for this enrollment.
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
  if (enrollment.j7SentAt) {
    timeline.push({
      id: "j7",
      kind: "email",
      label: "Email J-7 envoyé",
      ts: enrollment.j7SentAt.getTime(),
    });
  }
  if (enrollment.status === "confirmee_j7" || enrollment.status === "confirmee_j2") {
    timeline.push({
      id: "conf_j7",
      kind: "success",
      label: "Confirmée J-7",
      ts: (enrollment.j7SentAt?.getTime() ?? enrollment.enrolledAt.getTime()) + 3_600_000,
    });
  }
  if (enrollment.j2SentAt) {
    timeline.push({
      id: "j2",
      kind: "email",
      label: "Email J-2 envoyé",
      ts: enrollment.j2SentAt.getTime(),
    });
  }
  if (enrollment.status === "confirmee_j2") {
    timeline.push({
      id: "conf_j2",
      kind: "success",
      label: "Confirmée J-2",
      ts: (enrollment.j2SentAt?.getTime() ?? enrollment.enrolledAt.getTime()) + 3_600_000,
    });
  }
  if (enrollment.attendedAt) {
    timeline.push({
      id: "att",
      kind: "success",
      label: "Présente — émargement Jour J",
      ts: enrollment.attendedAt.getTime(),
    });
  }
  if (enrollment.status === "absente" && !enrollment.attendedAt) {
    timeline.push({
      id: "absent",
      kind: "danger",
      label: "Marquée absente",
      ts: enrollment.updatedAt.getTime(),
    });
  }
  if (enrollment.status === "desistement") {
    timeline.push({
      id: "desist",
      kind: "danger",
      label: "Désistement",
      ts: enrollment.updatedAt.getTime(),
    });
  }
  if (enrollment.feedbackSentAt) {
    timeline.push({
      id: "fb_sent",
      kind: "email",
      label: "Invitation feedback envoyée",
      ts: enrollment.feedbackSentAt.getTime(),
    });
  }
  if (feedback) {
    timeline.push({
      id: "fb_recu",
      kind: "success",
      label: `Feedback reçu — note ${feedback.overallRating}/5`,
      ts: feedback.submittedAt.getTime(),
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
