import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pollId } = await params;

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
  const { optionId } = body;

  if (!optionId) {
    return NextResponse.json({ error: "Missing optionId" }, { status: 400 });
  }

  // Check poll exists and is active
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, status: "actif" },
  });

  if (!poll) {
    return NextResponse.json({ error: "Poll not found or closed" }, { status: 404 });
  }

  // Verify optionId is valid
  const options = poll.options as { id: string; label: string }[];
  if (!options.find((o) => o.id === optionId)) {
    return NextResponse.json({ error: "Invalid optionId" }, { status: 400 });
  }

  // Upsert response (1 vote per user per poll)
  await prisma.pollResponse.upsert({
    where: { pollId_userId: { pollId, userId: dbUser.id } },
    update: { optionId },
    create: { pollId, userId: dbUser.id, optionId },
  });

  return NextResponse.json({ success: true });
}
