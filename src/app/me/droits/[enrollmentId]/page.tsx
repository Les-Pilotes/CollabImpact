import { notFound, redirect } from "next/navigation";
import { requireJeune } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DroitsImageForm from "@/components/jeune/DroitsImageForm";
import Link from "next/link";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ enrollmentId: string }>;
}

export const metadata = { title: "Droits à l'image" };

export default async function DroitsPage({ params }: Props) {
  const { enrollmentId } = await params;
  const { dbUser } = await requireJeune();

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { immersion: true },
  });

  if (!enrollment || enrollment.userId !== dbUser.id) notFound();

  const firstName = dbUser.firstName ?? "Vous";

  if (enrollment.imageRightsSignedAt) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffe959] to-[#ff914d] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">
          Droits à l&apos;image signés ✓
        </h1>
        <p className="text-zinc-500 mb-6">
          Tu as déjà signé les droits à l&apos;image pour l&apos;immersion{" "}
          <strong>{enrollment.immersion.companyName}</strong> le{" "}
          {new Date(enrollment.imageRightsSignedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
        <Link href="/me">
          <Button variant="gradient">Retour à mon espace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/me">
        <span className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Retour à mon espace
        </span>
      </Link>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#ffe959] to-[#ff914d]" />
        <div className="p-6 sm:p-8">
          <h1 className="text-xl font-extrabold text-zinc-900 mb-1">
            Droits à l&apos;image
          </h1>
          <p className="text-sm text-zinc-500 mb-6">
            Immersion {enrollment.immersion.companyName} —{" "}
            {new Date(enrollment.immersion.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 mb-6 space-y-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">
              Autorisation de captation et d&apos;utilisation d&apos;images
            </p>
            <p>
              {firstName}, en cochant la case ci-dessous, tu autorises
              l&apos;association <strong>Les Pilotes</strong> à réaliser des
              photographies et/ou des enregistrements vidéo lors de
              l&apos;immersion <strong>{enrollment.immersion.companyName}</strong> et à
              utiliser ces supports à des fins de communication non commerciale
              (réseaux sociaux, site web, rapports d&apos;impact, présentations
              partenaires).
            </p>
            <p>
              Cette autorisation est valable pour une durée de 5 ans. Tu peux
              la révoquer à tout moment en contactant{" "}
              <a
                href="mailto:contact@les-pilotes.fr"
                className="text-[var(--brand-orange)] hover:underline"
              >
                contact@les-pilotes.fr
              </a>
              .
            </p>
            <p className="text-xs text-zinc-400">
              Conformément au RGPD, ces données sont traitées uniquement pour
              les finalités mentionnées et ne sont pas transmises à des tiers.
            </p>
          </div>

          <DroitsImageForm enrollmentId={enrollmentId} firstName={firstName} />
        </div>
      </div>
    </div>
  );
}
