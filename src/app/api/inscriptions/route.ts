import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email.toLowerCase() },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();
  const { immersionId, couche1, couche2, couche3 } = body;

  if (!immersionId) {
    return NextResponse.json({ error: "Missing immersionId" }, { status: 400 });
  }

  // Check immersion exists and is open
  const immersion = await prisma.immersion.findFirst({
    where: {
      id: immersionId,
      status: "publie",
      date: { gte: new Date() },
      deletedAt: null,
    },
    include: { _count: { select: { enrollments: true } } },
  });

  if (!immersion) {
    return NextResponse.json({ error: "Immersion not found or closed" }, { status: 404 });
  }

  // Check capacity
  const placesLeft = immersion.maxCapacity - immersion._count.enrollments;
  if (placesLeft <= 0) {
    return NextResponse.json({ error: "No places left" }, { status: 409 });
  }

  // Check not already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: { immersionId_userId: { immersionId, userId: dbUser.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  // Transaction: update user profile + create enrollment + snapshot if needed
  await prisma.$transaction(async (tx) => {
    // Update Couche 1 if provided
    if (couche1) {
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          firstName: couche1.firstName || undefined,
          lastName: couche1.lastName || undefined,
          phone: couche1.phone || undefined,
          birthDate: couche1.birthDate ? new Date(couche1.birthDate) : undefined,
          gender: couche1.gender || undefined,
          city: couche1.city || undefined,
          dietary: couche1.dietary || undefined,
          dietaryOther: couche1.dietaryOther || undefined,
        },
      });
    }

    // Update Couche 2 if provided + create snapshot
    if (couche2) {
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          educationLevel: couche2.educationLevel || undefined,
          field: couche2.field || undefined,
          institution: couche2.institution || undefined,
          projectStatus: couche2.projectStatus || undefined,
          projectDescription: couche2.projectDescription || undefined,
          interestAreas: couche2.interestAreas ?? [],
          preferredEnvironment: couche2.preferredEnvironment || undefined,
          layer2UpdatedAt: new Date(),
        },
      });

      // Snapshot Couche 2
      await tx.profileSnapshot.create({
        data: {
          userId: dbUser.id,
          trigger: "inscription",
          data: couche2,
        },
      });
    }

    // Create enrollment
    await tx.enrollment.create({
      data: {
        organisationId: dbUser.organisationId,
        immersionId,
        userId: dbUser.id,
        source: couche3?.source ?? "autre",
        comment: couche3?.comment || undefined,
        status: "inscrit",
      },
    });
  });

  // Send confirmation email (best effort)
  try {
    const updatedUser = await prisma.user.findUnique({ where: { id: dbUser.id } });
    const firstName = updatedUser?.firstName ?? "là";
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: dbUser.email,
      replyTo: process.env.EMAIL_REPLY_TO,
      subject: `Inscription confirmée — ${immersion.companyName} 🚀`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bonjour ${firstName} 👋</h2>
          <p>Ton inscription à l'immersion <strong>${immersion.companyName}</strong> est confirmée !</p>
          <p><strong>Date :</strong> ${new Date(immersion.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à ${new Date(immersion.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
          <p><strong>Lieu :</strong> ${immersion.companyAddress}, ${immersion.companyCity}</p>
          <p>On te recontacte quelques jours avant pour confirmer ta présence. Garde bien ce créneau dans ton agenda !</p>
          <p>À très bientôt,<br/>L'équipe Les Pilotes</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[api/inscriptions] Email error:", err);
    // Don't fail the request because of email error
  }

  return NextResponse.json({ success: true });
}
