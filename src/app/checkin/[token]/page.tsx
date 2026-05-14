import { ActionResultLayout } from '../../decline/[token]/ActionResultLayout';
import { markPresent } from './actions';
import { capitalizeName } from '@/lib/normalize';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bienvenue — Les Pilotes' };

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const outcome = await markPresent(token);

  if (!outcome.ok) {
    switch (outcome.reason) {
      case 'expired':
        return (
          <ActionResultLayout
            emoji="⏰"
            title="Ce QR a expiré"
            description="Demande à l'équipe de te générer un nouveau lien de check-in."
            variant="warning"
          />
        );
      case 'terminal':
        return (
          <ActionResultLayout
            emoji="ℹ️"
            title={
              outcome.firstName
                ? `${capitalizeName(outcome.firstName)}, cette inscription est clôturée`
                : 'Inscription clôturée'
            }
            description="Cette inscription a été marquée absente, désistée, ou le feedback a été reçu. Préviens l'équipe si c'est une erreur."
            variant="info"
          />
        );
      case 'not_found':
        return (
          <ActionResultLayout
            emoji="🤔"
            title="Inscription introuvable"
            description="Le QR n'est pas reconnu. Vérifie que tu scannes bien le bon code."
            variant="warning"
          />
        );
      case 'invalid':
      default:
        return (
          <ActionResultLayout
            emoji="🤔"
            title="QR invalide"
            description="Ce QR ne semble pas valide. Demande à l'équipe de t'en générer un nouveau."
            variant="warning"
          />
        );
    }
  }

  const firstName = capitalizeName(outcome.firstName);
  const eventDateFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(outcome.eventDate);

  // Already checked in earlier today — show calmer screen, no confettis
  if (outcome.kind === 'already_present') {
    return (
      <ActionResultLayout
        emoji="✅"
        title={`Déjà enregistrée à ${formatTime(outcome.attendedAt)}`}
        description={
          <>
            <strong>{firstName}</strong>, ton check-in pour{' '}
            <strong>{outcome.eventName}</strong> est déjà validé.
            <br />
            Bonne journée parmi nous !
          </>
        }
        variant="info"
      />
    );
  }

  // First-time check-in — celebratory landing
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-white to-violet-50">
      {/* Confetti — pure CSS, decorative, hidden from AT */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className={`confetti confetti-${(i % 6) + 1}`}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i * 0.13) % 2.4}s`,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-7xl mb-4 animate-[wave_1.6s_ease-in-out_infinite]">
          👋
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 leading-tight">
          Bienvenue {firstName} !
        </h1>
        <p className="text-base text-zinc-600 mt-3">
          Check-in validé à <strong>{formatTime(outcome.attendedAt)}</strong>
        </p>
        <div className="mt-8 inline-flex flex-col gap-1 bg-white border border-zinc-200 rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
            Aujourd&apos;hui
          </p>
          <p className="text-lg font-bold text-zinc-900">{outcome.eventName}</p>
          <p className="text-sm text-zinc-500">{eventDateFormatted}</p>
        </div>
        <p className="text-xs text-zinc-400 mt-10">
          On t&apos;attend dans la salle — installe-toi confortablement.
        </p>
      </main>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(-8deg); }
          50%      { transform: rotate(12deg); }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(-10vh) rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.9; }
        }
        .confetti {
          position: absolute;
          top: -10vh;
          width: 8px;
          height: 14px;
          border-radius: 2px;
          animation: confetti-fall 3.2s linear infinite;
        }
        .confetti-1 { background: #ff914d; }
        .confetti-2 { background: #facc15; }
        .confetti-3 { background: #34d399; }
        .confetti-4 { background: #60a5fa; }
        .confetti-5 { background: #c084fc; }
        .confetti-6 { background: #fb7185; }
        @media (prefers-reduced-motion: reduce) {
          .confetti { animation: none; display: none; }
        }
      `}</style>
    </div>
  );
}
