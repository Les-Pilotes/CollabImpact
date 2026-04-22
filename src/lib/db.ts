import { PrismaClient } from "@prisma/client";

// Singleton Prisma — évite de multiplier les clients en dev (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Helper multi-tenant : renvoie l'ID de l'organisation courante.
 * V1 : une seule orga Les Pilotes, lue depuis l'env (seedé).
 * Futur : lira l'org depuis la session admin ou le subdomain.
 */
export function currentOrgId(): string {
  const id = process.env.LES_PILOTES_ORG_ID;
  if (!id || id === "placeholder-set-after-seed") {
    throw new Error(
      "LES_PILOTES_ORG_ID non configuré. Lance `pnpm db:seed` puis copie l'ID affiché dans .env.local.",
    );
  }
  return id;
}
