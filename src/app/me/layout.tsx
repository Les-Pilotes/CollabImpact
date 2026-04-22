import { requireJeune } from "@/lib/auth";
import Link from "next/link";
import { Rocket, Bell, User, LogOut } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import SignOutButton from "./SignOutButton";

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dbUser } = await requireJeune();

  // Count pending actions (missing feedback + unsigned image rights)
  const pendingCount = await prisma.enrollment.count({
    where: {
      userId: dbUser.id,
      deletedAt: null,
      OR: [
        // Feedback due: past immersion with status present + no feedback + token was sent
        {
          status: "present",
          feedbackSentAt: { not: null },
          feedback: null,
        },
        // Image rights not signed + immersion in the future or recent
        {
          imageRightsSignedAt: null,
          immersion: {
            date: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) }, // within last 7 days
          },
        },
      ],
    },
  });

  const displayName = dbUser.firstName ?? dbUser.email.split("@")[0];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900 hidden sm:block">Les Pilotes</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Actions badge */}
            {pendingCount > 0 && (
              <Link href="/me#actions" className="relative">
                <div className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors">
                  <Bell className="w-4 h-4 text-zinc-600" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                </div>
              </Link>
            )}

            {/* Profile */}
            <div className="flex items-center gap-2 bg-zinc-100 rounded-full pl-3 pr-1 py-1">
              <span className="text-sm font-medium text-zinc-700 hidden sm:block">
                {displayName}
              </span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
