"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback`,
      queryParams: { hd: "les-pilotes.fr", prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    redirect("/admin/login?reason=auth-unavailable");
  }
  redirect(data.url);
}
