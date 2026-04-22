import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_STATUSES = [
  "inscrit",
  "contacte",
  "confirme_j7",
  "confirme_j2",
  "present",
  "absent",
  "desistement",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireAdmin();

  const body = await req.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.enrollment.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ success: true });
}
