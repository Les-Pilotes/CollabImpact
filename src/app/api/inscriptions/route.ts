import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { inscriptionSchema } from "@/lib/validation/inscription";
import InscriptionConfirmation from "@/lib/email/templates/InscriptionConfirmation";
import React from "react";

const ORG_ID = "seed-org-lespilotes";
const IMMERSION_ID = "seed-event-cite-audacieuse";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = inscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;

  try {
    const user = await prisma.user.upsert({
      where: { email: input.email },
      create: {
        organisationId: ORG_ID,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        city: input.city,
        birthDate: new Date(input.birthDate),
        source: input.source,
        emailVerified: false,
      },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        city: input.city,
        source: input.source,
      },
    });

    const enrollment = await prisma.enrollment.upsert({
      where: {
        immersionId_userId: {
          immersionId: IMMERSION_ID,
          userId: user.id,
        },
      },
      create: {
        organisationId: ORG_ID,
        immersionId: IMMERSION_ID,
        userId: user.id,
        source: input.source,
      },
      update: {},
    });

    await sendEmail({
      to: user.email,
      subject: "Ton inscription au Workshop 100% Féminin est confirmée !",
      react: React.createElement(InscriptionConfirmation, {
        firstName: user.firstName,
        eventName: "Workshop 100% Féminin — La Cité Audacieuse",
        eventDate: "Samedi 18 avril 2026",
        eventAddress: "9 rue de Vaugirard, Paris 6",
      }),
    });

    return NextResponse.json({ ok: true, userId: user.id, enrollmentId: enrollment.id });
  } catch (err) {
    console.error("[inscriptions:error]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
