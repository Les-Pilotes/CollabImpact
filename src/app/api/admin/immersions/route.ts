import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { admin } = await requireAdmin();

  const body = await req.json();
  const {
    name, status, companyName, companySector, companyAddress, companyCity,
    date, durationMinutes, maxCapacity, themes, description, program,
    internalContact, speakers,
  } = body;

  if (!name || !companyName || !companyCity || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const immersion = await prisma.immersion.create({
    data: {
      organisationId: admin.organisationId,
      name,
      status: status ?? "brouillon",
      companyName,
      companySector: companySector ?? "",
      companyAddress: companyAddress ?? "",
      companyCity,
      date: new Date(date),
      durationMinutes: durationMinutes ?? 240,
      maxCapacity: maxCapacity ?? 15,
      themes: themes ?? [],
      description: description || undefined,
      program: program || undefined,
      internalContact: internalContact || undefined,
      speakers: speakers ?? [],
    },
  });

  return NextResponse.json(immersion);
}
