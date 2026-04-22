import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { admin } = await requireAdmin();

  const body = await req.json();
  const { title, body: bodyText, imageUrl, sourceUrl, kind, immersionId, publishedAt } = body;

  if (!title || !bodyText) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const update = await prisma.update.create({
    data: {
      organisationId: admin.organisationId,
      title,
      body: bodyText,
      imageUrl: imageUrl || undefined,
      sourceUrl: sourceUrl || undefined,
      kind: kind ?? "news",
      immersionId: immersionId || undefined,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    },
  });

  return NextResponse.json(update);
}
