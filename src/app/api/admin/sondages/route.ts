import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { admin } = await requireAdmin();

  const body = await req.json();
  const { question, options, status } = body;

  if (!question || !options || options.length < 2) {
    return NextResponse.json(
      { error: "Question and at least 2 options are required" },
      { status: 400 },
    );
  }

  const poll = await prisma.poll.create({
    data: {
      organisationId: admin.organisationId,
      question,
      options,
      status: status ?? "brouillon",
      openedAt: status === "actif" ? new Date() : undefined,
    },
  });

  return NextResponse.json(poll);
}

export async function GET() {
  const { admin } = await requireAdmin();

  const polls = await prisma.poll.findMany({
    where: { organisationId: admin.organisationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  });

  return NextResponse.json(polls);
}
