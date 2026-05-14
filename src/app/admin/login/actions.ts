"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";

/**
 * Detects Next.js's internal `redirect()` exception. Imported lazily because
 * the public re-export changes across Next versions; this works on 14+ / 16+.
 */
function isNextRedirect(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * Map Supabase auth-otp error messages to user-facing reason codes. The
 * codes feed the login page banner copy.
 */
function classifySupabaseError(message: string): "rate-limit" | "magic-error" {
  const lower = message.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    lower.includes("for security purposes")
  ) {
    return "rate-limit";
  }
  return "magic-error";
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    redirect("/admin/login?reason=magic-error");
  }

  let reason: "magic-sent" | "magic-error" | "rate-limit" | "auth-unavailable" =
    "magic-sent";

  try {
    const supabase = await createSupabaseServerClient();
    const redirectUrl = `${getAppUrl()}/admin`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      console.error(
        `[sendMagicLink] supabase error: ${error.message} (status=${error.status ?? "?"}) for ${email} → ${redirectUrl}`,
      );
      reason = classifySupabaseError(error.message);
    }
  } catch (err) {
    // Don't swallow Next.js redirect signals (they look like exceptions).
    if (isNextRedirect(err)) throw err;
    console.error("[sendMagicLink] unexpected exception:", err);
    reason = "auth-unavailable";
  }

  redirect(`/admin/login?reason=${reason}`);
}
