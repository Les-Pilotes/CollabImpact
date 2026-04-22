import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { admin } = await requireAdmin();

  const immersion = await prisma.immersion.findFirst({
    where: { id, organisationId: admin.organisationId, deletedAt: null },
  });

  if (!immersion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    name, status, companyName, companySector, companyAddress, companyCity,
    date, durationMinutes, maxCapacity, themes, description, program,
    internalContact, speakers,
  } = body;

  const updated = await prisma.immersion.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(status && { status }),
      ...(companyName && { companyName }),
      ...(companySector !== undefined && { companySector }),
      ...(companyAddress !== undefined && { companyAddress }),
      ...(companyCity && { companyCity }),
      ...(date && { date: new Date(date) }),
      ...(durationMinutes && { durationMinutes }),
      ...(maxCapacity && { maxCapacity }),
      ...(themes !== undefined && { themes }),
      ...(description !== undefined && { description: description || null }),
      ...(program !== undefined && { program: program || null }),
      ...(internalContact !== undefined && { internalContact: internalContact || null }),
      ...(speakers !== undefined && { speakers }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { admin } = await requireAdmin();

  const immersion = await prisma.immersion.findFirst({
    where: { id, organisationId: admin.organisationId, deletedAt: null },
  });

  if (!immersion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.immersion.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
