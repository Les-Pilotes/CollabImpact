import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET() {
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(dbUser);
}

export async function PATCH(req: NextRequest) {
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  const {
    firstName,
    lastName,
    phone,
    birthDate,
    gender,
    city,
    dietary,
    dietaryOther,
    // Couche 2
    educationLevel,
    field,
    institution,
    projectStatus,
    projectDescription,
    interestAreas,
    preferredEnvironment,
  } = body;

  const layer2Fields = {
    educationLevel,
    field,
    institution,
    projectStatus,
    projectDescription,
    interestAreas,
    preferredEnvironment,
  };

  const hasLayer2 = Object.values(layer2Fields).some((v) => v !== undefined);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: dbUser.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(birthDate !== undefined && {
          birthDate: birthDate ? new Date(birthDate) : null,
        }),
        ...(gender !== undefined && { gender }),
        ...(city !== undefined && { city }),
        ...(dietary !== undefined && { dietary }),
        ...(dietaryOther !== undefined && { dietaryOther }),
        ...(educationLevel !== undefined && { educationLevel }),
        ...(field !== undefined && { field }),
        ...(institution !== undefined && { institution }),
        ...(projectStatus !== undefined && { projectStatus }),
        ...(projectDescription !== undefined && { projectDescription }),
        ...(interestAreas !== undefined && { interestAreas }),
        ...(preferredEnvironment !== undefined && { preferredEnvironment }),
        ...(hasLayer2 && { layer2UpdatedAt: new Date() }),
      },
    });

    // Snapshot Couche 2 if any layer2 fields were updated
    if (hasLayer2) {
      const updatedUser = await tx.user.findUnique({ where: { id: dbUser.id } });
      if (updatedUser) {
        await tx.profileSnapshot.create({
          data: {
            userId: dbUser.id,
            trigger: "mise_a_jour",
            data: {
              educationLevel: updatedUser.educationLevel,
              field: updatedUser.field,
              institution: updatedUser.institution,
              projectStatus: updatedUser.projectStatus,
              projectDescription: updatedUser.projectDescription,
              interestAreas: updatedUser.interestAreas,
              preferredEnvironment: updatedUser.preferredEnvironment,
            },
          },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}
