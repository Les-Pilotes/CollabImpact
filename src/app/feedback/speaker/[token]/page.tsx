import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import FeedbackForm from "@/app/feedback/[token]/FeedbackForm";
import { SPEAKER_SECTIONS } from "@/lib/feedback/speaker-questions";

export const metadata = { title: "Votre avis — Les Pilotes" };

export default async function SpeakerFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const speaker = await prisma.speaker.findUnique({
    where: { feedbackToken: token, deletedAt: null },
    include: { event: { select: { name: true, date: true } } },
  });

  if (!speaker) notFound();

  if (speaker.feedbackSubmittedAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-stone-50">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full text-center space-y-3">
          <p className="text-3xl">✅</p>
          <h1 className="text-lg font-extrabold text-stone-900">Déjà soumis</h1>
          <p className="text-sm text-stone-500">Vous avez déjà donné votre avis. Merci !</p>
        </div>
      </main>
    );
  }

  const sections = SPEAKER_SECTIONS.map((s) => ({
    number: s.number,
    title: s.title,
    questions: s.questions,
  }));

  return (
    <FeedbackForm
      token={token}
      firstName={speaker.firstName}
      immersionName={speaker.event.name}
      eventDate={speaker.event.date.toISOString()}
      sections={sections}
      submitUrl={`/api/feedback/speaker/${token}`}
    />
  );
}
