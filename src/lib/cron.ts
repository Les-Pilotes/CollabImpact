import { NextResponse } from "next/server";

/**
 * Vérifie qu'un appel de route cron vient bien de Vercel Cron.
 * Vercel Cron envoie automatiquement le header `Authorization: Bearer $CRON_SECRET`
 * si la var d'env CRON_SECRET est définie dans le projet Vercel.
 */
export function assertCronRequest(request: Request): NextResponse | null {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
