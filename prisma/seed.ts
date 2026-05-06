/**
 * Seed Wave 0 — un seul évent "La Cité Audacieuse"
 *
 * Usage :
 *   SEED_ADMIN_EMAIL="ton@email.fr" pnpm db:seed
 *
 * Idempotent : upsert sur les IDs stables.
 * Après exécution, copie l'ID de l'org affiché dans .env.local → LES_PILOTES_ORG_ID
 */

import { PrismaClient, TaskPhase, EnrollmentStatus } from "@prisma/client";

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

  // ── Participantes ────────────────────────────────────────────────────────────
  const J7 = daysOffset(EVENT_DATE, -7);  // 11 avril
  const J2 = daysOffset(EVENT_DATE, -2);  // 16 avril

  const PARTICIPANTS: Array<{
    id: string; firstName: string; lastName: string;
    email: string; phone: string; city: string;
    enrolledAt: Date; source: string;
    status: EnrollmentStatus;
    j7SentAt?: Date; j2SentAt?: Date;
  }> = [
    // Inscrites — en attente J-7
    { id: "seed-user-01", firstName: "Amira",    lastName: "Benali",   email: "amira.benali@gmail.com",    phone: "06 11 22 33 44", city: "Saint-Denis",   enrolledAt: daysOffset(EVENT_DATE, -22), source: "whatsapp",        status: "inscrit" },
    { id: "seed-user-02", firstName: "Sofia",    lastName: "Martin",   email: "sofia.martin@outlook.fr",   phone: "07 22 33 44 55", city: "Aubervilliers",  enrolledAt: daysOffset(EVENT_DATE, -20), source: "instagram",       status: "inscrit" },
    { id: "seed-user-03", firstName: "Imane",    lastName: "Kaci",     email: "imane.kaci@gmail.com",      phone: "06 33 44 55 66", city: "Clichy",         enrolledAt: daysOffset(EVENT_DATE, -15), source: "bouche_a_oreille", status: "inscrit" },
    { id: "seed-user-04", firstName: "Emma",     lastName: "Bonnet",   email: "emma.bonnet@yahoo.fr",      phone: "07 44 55 66 77", city: "Paris 18e",      enrolledAt: daysOffset(EVENT_DATE, -12), source: "instagram",       status: "inscrit" },
    // Contactées — j7 email envoyé
    { id: "seed-user-05", firstName: "Fatou",    lastName: "Diallo",   email: "fatou.diallo@gmail.com",    phone: "06 55 66 77 88", city: "Montreuil",      enrolledAt: daysOffset(EVENT_DATE, -25), source: "whatsapp",        status: "contactee",    j7SentAt: J7 },
    { id: "seed-user-06", firstName: "Yasmine",  lastName: "Hadj",     email: "yasmine.hadj@gmail.com",    phone: "07 66 77 88 99", city: "Pantin",         enrolledAt: daysOffset(EVENT_DATE, -23), source: "referent",        status: "contactee",    j7SentAt: J7 },
    { id: "seed-user-07", firstName: "Rania",    lastName: "Fares",    email: "rania.fares@hotmail.fr",    phone: "06 77 88 99 00", city: "Stains",         enrolledAt: daysOffset(EVENT_DATE, -19), source: "whatsapp",        status: "contactee",    j7SentAt: J7 },
    // Confirmées J-7 — en attente J-2
    { id: "seed-user-08", firstName: "Inès",     lastName: "Rousseau", email: "ines.rousseau@gmail.com",   phone: "06 88 99 00 11", city: "Paris 13e",      enrolledAt: daysOffset(EVENT_DATE, -28), source: "instagram",       status: "confirmee_j7", j7SentAt: J7 },
    { id: "seed-user-09", firstName: "Sarah",    lastName: "Cissé",    email: "sarah.cisse@gmail.com",     phone: "07 99 00 11 22", city: "Bobigny",        enrolledAt: daysOffset(EVENT_DATE, -26), source: "whatsapp",        status: "confirmee_j7", j7SentAt: J7 },
    { id: "seed-user-10", firstName: "Nadia",    lastName: "Tounkara", email: "nadia.tounkara@gmail.com",  phone: "06 00 11 22 33", city: "Aulnay-sous-Bois", enrolledAt: daysOffset(EVENT_DATE, -24), source: "bouche_a_oreille", status: "confirmee_j7", j7SentAt: J7 },
    { id: "seed-user-11", firstName: "Lina",     lastName: "Meziane",  email: "lina.meziane@gmail.com",    phone: "07 11 22 33 44", city: "Épinay-sur-Seine", enrolledAt: daysOffset(EVENT_DATE, -21), source: "instagram",     status: "confirmee_j7", j7SentAt: J7 },
    // Confirmées J-2 — sur le listing Jour J
    { id: "seed-user-12", firstName: "Léa",      lastName: "Bernard",  email: "lea.bernard@gmail.com",     phone: "06 22 33 44 55", city: "Paris 20e",      enrolledAt: daysOffset(EVENT_DATE, -30), source: "instagram",       status: "confirmee_j2", j7SentAt: J7, j2SentAt: J2 },
    { id: "seed-user-13", firstName: "Camille",  lastName: "Ndiaye",   email: "camille.ndiaye@gmail.com",  phone: "07 33 44 55 66", city: "Bagnolet",       enrolledAt: daysOffset(EVENT_DATE, -29), source: "whatsapp",        status: "confirmee_j2", j7SentAt: J7, j2SentAt: J2 },
    { id: "seed-user-14", firstName: "Maya",     lastName: "Atmane",   email: "maya.atmane@outlook.fr",    phone: "06 44 55 66 77", city: "Paris 11e",      enrolledAt: daysOffset(EVENT_DATE, -27), source: "bouche_a_oreille", status: "confirmee_j2", j7SentAt: J7, j2SentAt: J2 },
    { id: "seed-user-15", firstName: "Kenza",    lastName: "Laurent",  email: "kenza.laurent@gmail.com",   phone: "07 55 66 77 88", city: "Noisy-le-Grand", enrolledAt: daysOffset(EVENT_DATE, -25), source: "referent",        status: "confirmee_j2", j7SentAt: J7, j2SentAt: J2 },
    { id: "seed-user-16", firstName: "Priya",    lastName: "Sharma",   email: "priya.sharma@gmail.com",    phone: "06 66 77 88 99", city: "Vincennes",      enrolledAt: daysOffset(EVENT_DATE, -23), source: "instagram",       status: "confirmee_j2", j7SentAt: J7, j2SentAt: J2 },
    // Désistements
    { id: "seed-user-17", firstName: "Aissatou", lastName: "Bah",      email: "aissatou.bah@gmail.com",    phone: "07 77 88 99 00", city: "La Courneuve",   enrolledAt: daysOffset(EVENT_DATE, -20), source: "whatsapp",        status: "desistement" },
    { id: "seed-user-18", firstName: "Chloé",    lastName: "Dubois",   email: "chloe.dubois@gmail.com",    phone: "06 88 99 00 11", city: "Drancy",         enrolledAt: daysOffset(EVENT_DATE, -18), source: "instagram",       status: "desistement",  j7SentAt: J7 },
  ];

  for (const p of PARTICIPANTS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      create: {
        id: p.id,
        organisationId: ORG_ID,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        city: p.city,
        source: p.source,
      },
      update: { firstName: p.firstName, lastName: p.lastName, phone: p.phone, city: p.city },
    });

    await prisma.enrollment.upsert({
      where: { immersionId_userId: { immersionId: EVENT_ID, userId: user.id } },
      create: {
        organisationId: ORG_ID,
        immersionId: EVENT_ID,
        userId: user.id,
        status: p.status,
        source: p.source,
        enrolledAt: p.enrolledAt,
        j7SentAt: p.j7SentAt ?? null,
        j2SentAt: p.j2SentAt ?? null,
      },
      update: {
        status: p.status,
        j7SentAt: p.j7SentAt ?? null,
        j2SentAt: p.j2SentAt ?? null,
      },
    });
  }

  console.log("  Participantes :", PARTICIPANTS.length, "créées");
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
