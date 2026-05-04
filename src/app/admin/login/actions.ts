"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    redirect("/admin/login?reason=magic-error");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.APP_URL ?? "http://localhost:3000"}/admin`,
      },
    });
    if (error) {
      redirect("/admin/login?reason=magic-error");
    }
  } catch {
    redirect("/admin/login?reason=auth-unavailable");
  }

  redirect("/admin/login?reason=magic-sent");
}
