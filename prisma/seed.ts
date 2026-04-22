/**
 * Seed local / dev.
 * - Crée l'organisation Les Pilotes (ou la récupère si existante)
 * - Crée un admin de démo
 * - Crée une immersion d'exemple en statut `publie`
 * - Crée un Update (news) demo
 * - Crée un Poll demo
 *
 * Usage :
 *   SEED_ADMIN_EMAIL="ton@email.fr" pnpm db:seed
 *
 * ⚠️ Après exécution, copie l'ID de l'org affiché dans .env.local → LES_PILOTES_ORG_ID
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@lespilotes.fr";
const ORG_ID = "seed-org-lespilotes";

async function main() {
  // Organisation
  const org = await prisma.organisation.upsert({
    where: { id: ORG_ID },
    create: { id: ORG_ID, name: "Les Pilotes" },
    update: { name: "Les Pilotes" },
  });

  // Admin
  await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    create: {
      email: ADMIN_EMAIL.toLowerCase(),
      organisationId: org.id,
      firstName: "Amadou",
      lastName: "Cisse",
    },
    update: {},
  });

  // Immersion demo — dans 14 jours
  const demoDate = new Date();
  demoDate.setDate(demoDate.getDate() + 14);
  demoDate.setHours(14, 0, 0, 0);

  const immersion = await prisma.immersion.upsert({
    where: { id: "seed-immersion-ledger" },
    create: {
      id: "seed-immersion-ledger",
      organisationId: org.id,
      name: "Découverte des métiers tech — Ledger",
      status: "publie",
      companyName: "Ledger",
      companySector: "Fintech / Cryptomonnaies",
      companyAddress: "1 rue de la Paix",
      companyCity: "Paris",
      speakers: [
        { firstName: "Alice", lastName: "Martin", role: "Product Manager" },
        { firstName: "Karim", lastName: "Diallo", role: "Software Engineer" },
      ],
      date: demoDate,
      durationMinutes: 180,
      maxCapacity: 15,
      themes: ["tech", "fintech", "product", "engineering"],
      description:
        "Une demi-journée pour découvrir les métiers tech chez Ledger — le leader mondial de la sécurité des cryptomonnaies. Présentations, échanges avec des professionnels et visite des locaux.",
      internalContact: "Amadou Cisse",
    },
    update: {},
  });

  // Update (news feed) demo
  await prisma.update.upsert({
    where: { id: "seed-update-steelseries" },
    create: {
      id: "seed-update-steelseries",
      organisationId: org.id,
      title: "🎮 Retour sur l'Immersion SteelSeries",
      body: `Une journée exceptionnelle chez **SteelSeries** ! 13 jeunes ont découvert les métiers du gaming : marketing, data, développement, R&D…

> "C'était trop bien, j'ai beaucoup apprécié malgré le fait que ce n'était pas mon domaine de prédilection." — Un participant

Merci à toute l'équipe SteelSeries pour leur accueil et leur générosité. 🚀`,
      kind: "news",
      publishedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000), // il y a 7 jours
    },
    update: {},
  });

  // Poll demo — sondage actif sur les secteurs
  await prisma.poll.upsert({
    where: { id: "seed-poll-secteurs" },
    create: {
      id: "seed-poll-secteurs",
      organisationId: org.id,
      question: "Quel secteur aimerais-tu découvrir lors d'une prochaine immersion ?",
      options: [
        { id: "tech", label: "🖥️ Tech & Numérique" },
        { id: "finance", label: "💼 Finance & Banque" },
        { id: "media", label: "🎬 Médias & Création" },
        { id: "sante", label: "🏥 Santé & Recherche" },
        { id: "industrie", label: "🏭 Industrie & Énergie" },
      ],
      status: "actif",
      openedAt: new Date(),
    },
    update: {},
  });

  console.log("\n✅ Seed OK");
  console.log("  Organisation :", org.id, "—", org.name);
  console.log("  Admin :", ADMIN_EMAIL);
  console.log("  Immersion demo :", immersion.id);
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
