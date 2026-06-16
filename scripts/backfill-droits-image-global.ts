/**
 * One-shot : remonte le consentement droit-image des Enrollment vers User.
 * Évite de redemander à chaque inscrite déjà connue.
 *
 * Règle :
 *   - On prend l'Enrollment majeure le plus RÉCENT par User (snapshot canonique)
 *   - On ignore les statuts "pending" et "minor_parental_pending" (= pas de décision)
 *   - On copie status + signedAt + signature vers User
 *   - Si plusieurs choix contradictoires existent dans l'historique, c'est le
 *     plus récent qui gagne — c'est la dernière volonté exprimée
 *
 * Par défaut : dry-run. Use --apply.
 *   pnpm tsx --env-file=.env.local scripts/backfill-droits-image-global.ts
 *   pnpm tsx --env-file=.env.local scripts/backfill-droits-image-global.ts --apply
 */
import { PrismaClient } from "@prisma/client";

function buildDatasourceUrl(): string {
  const direct = process.env.DIRECT_URL;
  if (direct) return direct;
  const url = process.env.DATABASE_URL ?? "";
  const sep = url.includes("?") ? "&" : "?";
  return url.includes("pgbouncer=true") ? url : `${url}${sep}pgbouncer=true`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const prisma = new PrismaClient({ datasourceUrl: buildDatasourceUrl() });

  try {
    // Tous les Users sans statut global, qui ont au moins un Enrollment majeure
    // avec un choix exprimé (accepted/refused).
    const candidates = await prisma.user.findMany({
      where: {
        droitsImageStatus: null,
        deletedAt: null,
        enrollments: {
          some: {
            droitsImageStatus: { in: ["accepted", "refused"] },
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        enrollments: {
          where: {
            droitsImageStatus: { in: ["accepted", "refused"] },
            deletedAt: null,
          },
          orderBy: { enrolledAt: "desc" },
          select: {
            droitsImageStatus: true,
            droitsImageSignedAt: true,
            droitsImageSignature: true,
            enrolledAt: true,
            event: { select: { name: true, date: true } },
          },
        },
      },
    });

    console.log(
      `Mode : ${apply ? "APPLY" : "DRY-RUN"} — candidates : ${candidates.length}`,
    );

    let updated = 0;
    for (const u of candidates) {
      const latest = u.enrollments[0];
      if (!latest) continue;

      // Skip if the latest enrollment is a minor case (parental consent doesn't lift)
      if (u.birthDate) {
        const ageAtEvent =
          (latest.event.date.getTime() - u.birthDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365.25);
        if (ageAtEvent < 18) {
          console.log(
            `  · ${u.email} → SKIP (mineure pour event « ${latest.event.name} »)`,
          );
          continue;
        }
      }

      console.log(
        `  · ${u.email} → ${latest.droitsImageStatus} (depuis « ${latest.event.name} », ${latest.enrolledAt.toISOString().slice(0, 10)})`,
      );

      if (apply) {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            droitsImageStatus: latest.droitsImageStatus,
            droitsImageSignedAt: latest.droitsImageSignedAt,
            droitsImageSignature: latest.droitsImageSignature,
          },
        });
        updated++;
      }
    }

    if (apply) {
      console.log(`\nMis à jour : ${updated}.`);
    } else {
      console.log("\nDry-run terminé. Relance avec --apply pour écrire.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
