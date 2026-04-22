"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AdminSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    router.push("/auth/login?next=/admin");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      title="Se déconnecter"
      className="text-zinc-400 hover:text-white transition-colors p-1"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
