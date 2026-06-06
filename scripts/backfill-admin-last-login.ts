/**
 * One-shot : marque comme "validés" (lastLoginAt = now) les admins qui se sont
 * connectés avant qu'on ajoute le champ lastLoginAt. Sans ce backfill, ils
 * apparaissent à tort dans "En attente" dans Paramètres → Notifications.
 *
 * Par défaut : dry-run (affiche la liste, ne modifie rien).
 * Pour appliquer : `pnpm tsx scripts/backfill-admin-last-login.ts --apply`
 *
 * Cible : tous les Admin dont `lastLoginAt` est null. Si tu veux restreindre à
 * certaines adresses, passe-les en arguments :
 *   `pnpm tsx scripts/backfill-admin-last-login.ts --apply crystal@les-pilotes.fr hakim@les-pilotes.fr`
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const emails = args.filter((a) => !a.startsWith("--")).map((e) => e.toLowerCase());

  const prisma = new PrismaClient();
  try {
    const where = {
      lastLoginAt: null,
      ...(emails.length > 0 ? { email: { in: emails } } : {}),
    };

    const targets = await prisma.admin.findMany({
      where,
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `Mode : ${apply ? "APPLY" : "DRY-RUN"}${emails.length > 0 ? ` (filtre : ${emails.join(", ")})` : ""}`,
    );
    console.log(`Admins ciblés (lastLoginAt = null) : ${targets.length}`);
    for (const a of targets) {
      console.log(`  · ${a.email}  [${a.role}]  créé ${a.createdAt.toISOString()}`);
    }

    if (!apply) {
      console.log("\nDry-run terminé. Relance avec --apply pour écrire.");
      return;
    }

    if (targets.length === 0) {
      console.log("\nRien à faire.");
      return;
    }

    const result = await prisma.admin.updateMany({
      where: { id: { in: targets.map((a) => a.id) } },
      data: { lastLoginAt: new Date() },
    });
    console.log(`\nMis à jour : ${result.count} admin(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
