import { prisma } from "@/lib/db";
import { ImmersionStatus } from "@prisma/client";

export type ChecklistItemKey =
  | "first_event_created"
  | "first_event_published"
  | "first_enrollment_received"
  | "first_feedback_received"
  | "team_assembled";

export type ChecklistItem = {
  key: ChecklistItemKey;
  label: string;
  description: string;
  done: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export type OnboardingProgress = {
  items: ChecklistItem[];
  completed: number;
  total: number;
};

type Input = {
  organisationId: string;
  isSuperAdmin: boolean;
};

/**
 * Derives the 5 onboarding milestones entirely from existing data — no extra
 * column needed. Each `done` reflects "did this org reach this milestone at
 * least once", so it never reverts (the only direction is forward).
 *
 * `team_assembled` is only surfaced to SUPER_ADMINs since regular admins
 * can't invite teammates.
 */
export async function getOnboardingProgress({
  organisationId,
  isSuperAdmin,
}: Input): Promise<OnboardingProgress> {
  const [
    eventCount,
    publishedCount,
    enrollmentCount,
    feedbackCount,
    adminCount,
  ] = await Promise.all([
    prisma.event.count({ where: { organisationId, deletedAt: null } }),
    prisma.event.count({
      where: {
        organisationId,
        deletedAt: null,
        status: { not: ImmersionStatus.brouillon },
      },
    }),
    prisma.enrollment.count({
      where: { organisationId, deletedAt: null },
    }),
    prisma.feedback.count({
      where: { enrollment: { organisationId, deletedAt: null } },
    }),
    prisma.admin.count({ where: { organisationId } }),
  ]);

  const items: ChecklistItem[] = [
    {
      key: "first_event_created",
      label: "Créer ton premier événement",
      description: "L'unité de base : un workshop, une immersion, un atelier.",
      done: eventCount > 0,
      ctaLabel: "Nouvel événement",
      ctaHref: "/admin/events/new",
    },
    {
      key: "first_event_published",
      label: "Publier un événement",
      description: "Passe-le de brouillon à publié pour ouvrir les inscriptions.",
      done: publishedCount > 0,
      ctaLabel: "Voir mes événements",
      ctaHref: "/admin/events",
    },
    {
      key: "first_enrollment_received",
      label: "Recevoir une première inscription",
      description: "Partage le lien d'inscription d'un événement publié.",
      done: enrollmentCount > 0,
      ctaLabel: "Aller aux événements",
      ctaHref: "/admin/events",
    },
    {
      key: "first_feedback_received",
      label: "Collecter un premier feedback",
      description:
        "Après l'événement, le cron envoie le questionnaire automatiquement.",
      done: feedbackCount > 0,
      ctaLabel: "Voir la page Impact",
      ctaHref: "/admin/events",
    },
  ];

  if (isSuperAdmin) {
    items.push({
      key: "team_assembled",
      label: "Inviter un·e co-administrateur·rice",
      description:
        "Au moins 2 admins dans l'org pour ne pas porter tout seul·e.",
      done: adminCount >= 2,
      ctaLabel: "Ajouter un·e admin",
      ctaHref: "/admin/parametres/admins",
    });
  }

  const completed = items.filter((i) => i.done).length;
  return { items, completed, total: items.length };
}
