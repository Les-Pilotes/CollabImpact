import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildCsv, slugify, todayStamp } from "@/lib/csv";

export const dynamic = "force-dynamic";

const HEADER = [
  // Identité (Couche Fondamentale)
  "Prénom",
  "Nom",
  "Email",
  "Téléphone",
  "Date de naissance",
  "Genre",
  "Ville",
  // Orientation (Couche 2)
  "Niveau scolaire",
  "Établissement",
  "Région",
  "Projet pro",
  "Motivations",
  "Détail motivation",
  "Comment connu",
  // Événement (Couche 3)
  "Statut inscription",
  "Mode inscription",
  "Référent",
  "Droits image",
  "Signature",
  "Date signature",
  "Régime alimentaire",
  "Accessibilité",
  "Accompagnée",
  "Commentaire",
  // Méta
  "Inscrite le",
  "Email J-7 envoyé le",
  "Email J-2 envoyé le",
  "Présente",
  "Score fiabilité",
];

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  await requireAdmin();
  const { eventId } = await context.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId, deletedAt: null },
    select: { name: true, date: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { eventId, deletedAt: null },
    orderBy: { enrolledAt: "asc" },
    include: { user: true },
  });

  const rows = enrollments.map((e) => [
    e.user.firstName,
    e.user.lastName,
    e.user.email,
    e.user.phone ?? "",
    e.user.birthDate ? e.user.birthDate.toISOString().slice(0, 10) : "",
    e.user.gender ?? "",
    e.user.city ?? "",
    e.user.niveauScolaire ?? "",
    e.user.etablissement ?? "",
    e.user.region ?? "",
    e.user.projetPro ?? "",
    (e.user.motivation ?? []).join(" | "),
    e.user.motivationDetail ?? "",
    e.user.commentConnu ?? "",
    e.status,
    e.mode,
    e.referentName ?? "",
    e.droitsImageStatus,
    e.droitsImageSignature ?? "",
    e.droitsImageSignedAt ? e.droitsImageSignedAt.toISOString() : "",
    (e.regime ?? []).join(" | "),
    e.accessibilite ?? "",
    e.accompagnateur ? "oui" : "non",
    e.commentaire ?? "",
    e.enrolledAt.toISOString(),
    e.j7SentAt ? e.j7SentAt.toISOString() : "",
    e.j2SentAt ? e.j2SentAt.toISOString() : "",
    e.attendedAt ? "oui" : e.noShow ? "non" : "",
    e.user.reliabilityScore,
  ]);

  const csv = buildCsv(HEADER, rows);
  const filename = `${slugify(event.name)}-inscriptions-${todayStamp()}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
