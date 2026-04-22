import { notFound, redirect } from "next/navigation";
import { requireJeune } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InscriptionForm from "@/components/jeune/InscriptionForm";
import Link from "next/link";
import { Building2, Calendar, MapPin, Clock, ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ immersionId: string }>;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export default async function InscrirePage({ params }: Props) {
  const { immersionId } = await params;
  const { dbUser } = await requireJeune();

  const [immersion, existingEnrollment] = await Promise.all([
    prisma.immersion.findFirst({
      where: {
        id: immersionId,
        status: "publie",
        date: { gte: new Date() },
        deletedAt: null,
      },
      include: { _count: { select: { enrollments: true } } },
    }),
    prisma.enrollment.findUnique({
      where: { immersionId_userId: { immersionId, userId: dbUser.id } },
    }),
  ]);

  if (!immersion) notFound();

  // Already enrolled
  if (existingEnrollment) {
    redirect("/me");
  }

  // Check if full
  const placesLeft = immersion.maxCapacity - immersion._count.enrollments;
  if (placesLeft <= 0) {
    redirect(`/immersions/${immersionId}?reason=complet`);
  }

  // Determine inscription mode
  // - new user (no firstName) → 3 steps (Couche 1 + Couche 2 + Couche 3)
  // - layer2 stale (>6mo) → 2 steps (Couche 2 + Couche 3)
  // - layer2 fresh → 1 step (Couche 3 only)
  const sixMonthsAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 180);
  const isNewUser = !dbUser.firstName;
  const layer2Stale =
    !dbUser.layer2UpdatedAt || dbUser.layer2UpdatedAt < sixMonthsAgo;

  const steps =
    isNewUser ? 3 : layer2Stale ? 2 : 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href={`/immersions/${immersionId}`}>
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Retour à l&apos;immersion
        </span>
      </Link>

      {/* Immersion summary */}
      <div className="bg-gradient-to-br from-[#fffbe6] to-[#fff3e6] rounded-2xl border border-orange-100 p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="font-bold text-zinc-900">{immersion.companyName}</p>
            <p className="text-sm text-[var(--brand-orange)]">{immersion.companySector}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(immersion.date)} à {formatTime(immersion.date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {immersion.companyCity}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(immersion.durationMinutes)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      {steps > 1 && (
        <div className="flex items-center gap-2 mb-6">
          {Array.from({ length: steps }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center text-xs font-bold text-white">
                {i + 1}
              </div>
              {i < steps - 1 && (
                <div className="h-0.5 w-8 bg-zinc-200" />
              )}
            </div>
          ))}
          <p className="text-xs text-zinc-500 ml-2">
            {steps} étape{steps > 1 ? "s" : ""} pour t&apos;inscrire
          </p>
        </div>
      )}

      <InscriptionForm
        immersionId={immersionId}
        user={dbUser}
        steps={steps}
      />
    </div>
  );
}
