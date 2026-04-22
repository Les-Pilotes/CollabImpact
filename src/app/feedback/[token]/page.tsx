import { notFound } from "next/navigation";
import { verifyFeedbackToken } from "@/lib/tokens";
import { prisma } from "@/lib/db";
import FeedbackForm from "@/components/jeune/FeedbackForm";
import Link from "next/link";
import { Rocket, CheckCircle2 } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata = { title: "Feedback" };

export default async function FeedbackPage({ params }: Props) {
  const { token } = await params;

  const result = verifyFeedbackToken(token);

  if (!result.valid) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center max-w-md">
          <p className="font-bold text-zinc-900 mb-2">
            Lien invalide ou expiré
          </p>
          <p className="text-sm text-zinc-500 mb-4">
            Ce lien de feedback n&apos;est plus valide.
          </p>
          <Link href="/" className="text-sm text-[var(--brand-orange)] hover:underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: result.enrollmentId,
      feedbackToken: token,
    },
    include: {
      immersion: { select: { companyName: true, date: true } },
      user: { select: { firstName: true, email: true } },
      feedback: true,
    },
  });

  if (!enrollment) notFound();

  if (enrollment.feedback) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center max-w-md">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="font-bold text-zinc-900 mb-2">
            Feedback déjà envoyé !
          </p>
          <p className="text-sm text-zinc-500">
            Merci pour ton retour sur l&apos;immersion{" "}
            <strong>{enrollment.immersion.companyName}</strong>. 🙏
          </p>
        </div>
      </div>
    );
  }

  const firstName = enrollment.user.firstName ?? "là";

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900">Les Pilotes</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
          <div className="p-6 sm:p-8">
            <h1 className="text-xl font-extrabold text-zinc-900 mb-1">
              Comment s&apos;est passée l&apos;immersion ? 🌟
            </h1>
            <p className="text-sm text-zinc-500 mb-6">
              Bonjour {firstName} ! Ton avis sur{" "}
              <strong>{enrollment.immersion.companyName}</strong> nous aide
              à améliorer les prochaines immersions.
            </p>

            <FeedbackForm
              token={token}
              enrollmentId={enrollment.id}
              companyName={enrollment.immersion.companyName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
