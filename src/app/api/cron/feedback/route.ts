import { NextRequest, NextResponse } from "next/server";
import { assertCronRequest } from "@/lib/cron";

// TODO Wave 2: refactor to use new schema fields (presente status, feedbackSentAt, etc.)
export async function GET(request: NextRequest) {
  const unauthorized = assertCronRequest(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({ ok: true, message: "cron stub — to be refactored in Wave 2" });
}
