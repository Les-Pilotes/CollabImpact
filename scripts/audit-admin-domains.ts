/**
 * Liste tous les Admin dont l'email n'est pas dans ALLOWED_ADMIN_DOMAINS.
 * Informatif : ne supprime rien, ne modifie rien. À lancer avant un changement
 * de politique d'auth pour s'assurer que personne ne se retrouve dehors.
 *
 * Usage : `pnpm tsx scripts/audit-admin-domains.ts`
 */
import { PrismaClient } from "@prisma/client";
import {
  ALLOWED_ADMIN_DOMAINS,
  isAllowedAdminEmail,
} from "../src/lib/auth/allowed-domains";

async function main() {
  const prisma = new PrismaClient();
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const allowed = admins.filter((a) => isAllowedAdminEmail(a.email));
    const offending = admins.filter((a) => !isAllowedAdminEmail(a.email));

    console.log(`Domaines autorisés : ${ALLOWED_ADMIN_DOMAINS.join(", ")}`);
    console.log(`Total admins : ${admins.length}`);
    console.log(`  - dans le domaine : ${allowed.length}`);
    console.log(`  - hors domaine    : ${offending.length}`);

    if (offending.length > 0) {
      console.log("\nAdmins hors domaine (à traiter avant le verrouillage) :");
      for (const a of offending) {
        console.log(
          `  · ${a.email}  [${a.role}]  créé ${a.createdAt.toISOString()}  id=${a.id}`,
        );
      }
      process.exitCode = 1;
    } else {
      console.log("\nOK — tous les admins sont dans le domaine autorisé.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
