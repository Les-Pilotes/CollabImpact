/**
 * Seed Wave 0 — un seul évent "La Cité Audacieuse"
 *
 * Usage :
 *   SEED_ADMIN_EMAIL="ton@email.fr" pnpm db:seed
 *
 * Idempotent : upsert sur les IDs stables.
 * Après exécution, copie l'ID de l'org affiché dans .env.local → LES_PILOTES_ORG_ID
 */

import { PrismaClient, TaskPhase } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@lespilotes.fr").toLowerCase();
const ORG_ID = "seed-org-lespilotes";
const EVENT_ID = "seed-event-cite-audacieuse";

const EVENT_DATE = new Date("2026-04-18T09:30:00.000Z");

function daysOffset(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  const org = await prisma.organisation.upsert({
    where: { id: ORG_ID },
    create: { id: ORG_ID, name: "Les Pilotes" },
    update: { name: "Les Pilotes" },
  });

  await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      organisationId: org.id,
      firstName: "Amadou",
      lastName: "Cisse",
    },
    update: {},
  });

  const event = await prisma.immersion.upsert({
    where: { id: EVENT_ID },
    create: {
      id: EVENT_ID,
      organisationId: org.id,
      type: "FEMININ",
      name: "La Cité Audacieuse — Workshop 100% Féminin",
      status: "publie",
      address: "9 rue de Vaugirard 75006 Paris",
      date: EVENT_DATE,
      capacity: 30,
      description:
        "Un workshop 100% féminin pour rencontrer des femmes inspirantes, échanger en sous-groupes et repartir avec des clés concrètes pour construire son avenir.",
    },
    update: {},
  });

  const tasks: Array<{
    id: string;
    eventId: string;
    phase: TaskPhase;
    title: string;
    order: number;
    dueAt?: Date;
    doneAt?: Date;
  }> = [
    // PREPARATION
    {
      id: "seed-task-prep-1",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Confirmer la date et le lieu avec La Cité Audacieuse",
      order: 1,
      dueAt: daysOffset(EVENT_DATE, -60),
    },
    {
      id: "seed-task-prep-2",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Recruter 6 intervenantes inspirantes",
      order: 2,
      dueAt: daysOffset(EVENT_DATE, -45),
    },
    {
      id: "seed-task-prep-3",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Briefer les intervenantes (template + déroulé)",
      order: 3,
      dueAt: daysOffset(EVENT_DATE, -14),
    },
    {
      id: "seed-task-prep-4",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Ouvrir le formulaire d'inscription",
      order: 4,
      dueAt: daysOffset(EVENT_DATE, -30),
      doneAt: daysOffset(EVENT_DATE, -30),
    },
    {
      id: "seed-task-prep-5",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Communiquer sur Instagram + WhatsApp",
      order: 5,
      dueAt: daysOffset(EVENT_DATE, -21),
    },
    {
      id: "seed-task-prep-6",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Relancer les 30 inscrites à J-7",
      order: 6,
      dueAt: daysOffset(EVENT_DATE, -7),
    },
    {
      id: "seed-task-prep-7",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Confirmer les présentes à J-2",
      order: 7,
      dueAt: daysOffset(EVENT_DATE, -2),
    },
    {
      id: "seed-task-prep-8",
      eventId: EVENT_ID,
      phase: "PREPARATION",
      title: "Préparer les badges et la liste d'émargement",
      order: 8,
      dueAt: daysOffset(EVENT_DATE, -1),
    },
    // WORKSHOP
    {
      id: "seed-task-work-1",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Accueillir les participantes (9h30 — café)",
      order: 1,
    },
    {
      id: "seed-task-work-2",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Émargement (Présente / Absente)",
      order: 2,
    },
    {
      id: "seed-task-work-3",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Mot d'ouverture par Les Pilotes",
      order: 3,
    },
    {
      id: "seed-task-work-4",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Présentations des intervenantes (3 min chacune)",
      order: 4,
    },
    {
      id: "seed-task-work-5",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Ateliers en sous-groupes (45 min)",
      order: 5,
    },
    {
      id: "seed-task-work-6",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Restitution + Q&A",
      order: 6,
    },
    {
      id: "seed-task-work-7",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Photo de groupe",
      order: 7,
    },
    {
      id: "seed-task-work-8",
      eventId: EVENT_ID,
      phase: "WORKSHOP",
      title: "Clôture + remerciements (12h30)",
      order: 8,
    },
    // POST_EVENT
    {
      id: "seed-task-post-1",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Envoyer le mail de remerciement aux participantes (J+1)",
      order: 1,
    },
    {
      id: "seed-task-post-2",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Envoyer le formulaire de feedback aux présentes (J+1)",
      order: 2,
    },
    {
      id: "seed-task-post-3",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Relancer les feedbacks non remplis (J+5)",
      order: 3,
    },
    {
      id: "seed-task-post-4",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Compiler le rapport d'impact (verbatims + notes)",
      order: 4,
    },
    {
      id: "seed-task-post-5",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Envoyer le rapport d'impact à La Cité Audacieuse",
      order: 5,
    },
    {
      id: "seed-task-post-6",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Envoyer le rapport d'impact aux intervenantes",
      order: 6,
    },
    {
      id: "seed-task-post-7",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Publier un retour sur Instagram + LinkedIn",
      order: 7,
    },
    {
      id: "seed-task-post-8",
      eventId: EVENT_ID,
      phase: "POST_EVENT",
      title: "Suivi 3 mois plus tard (sondage rapide)",
      order: 8,
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      create: task,
      update: {},
    });
  }

  console.log("\n✅ Seed OK");
  console.log("  Organisation :", org.id, "—", org.name);
  console.log("  Admin :", ADMIN_EMAIL);
  console.log("  Évent :", event.id, "—", event.name);
  console.log("  Tasks :", tasks.length, "créées (24 attendues)");
  console.log("\n👉 Colle cet ID dans .env.local :");
  console.log(`  LES_PILOTES_ORG_ID="${org.id}"\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
