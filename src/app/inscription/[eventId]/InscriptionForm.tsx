"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Play, FileDown, X } from "lucide-react";
import {
  lookupUserByEmail,
  verifyAndFetchProfile,
  submitInscription,
  type ReturningProfile,
} from "./actions";
import {
  NIVEAUX_SCOLAIRES,
  REGIONS_FR,
  MOTIVATIONS,
  SOURCES,
  REGIMES,
} from "@/lib/validation/inscription";

// ─── Types & constants ───────────────────────────────────────────────────────

type EventProps = {
  id: string;
  name: string;
  date: string; // ISO
  address: string;
  capacity: number;
  description: string | null;
  currentEnrolled: number;
  isFull: boolean;
  isClosed: boolean;
};

type Flow = "unknown" | "new" | "returning_fresh" | "returning_stale";
type Step = 0 | 0.5 | 1 | 2 | 3;

type FormData = {
  // fondamentale
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: "Fille" | "Garçon" | "Autre" | "";
  city: string;
  // orientation
  niveauScolaire: string;
  niveauScolaireAutre: string;
  etablissement: string;
  region: string;
  projetPro: string;
  motivation: string[];
  motivationDetail: string;
  commentConnu: string;
  // événement
  droitsImageAccepted: boolean;
  droitsImageSignature: string;
  regime: string[];
  accessibilite: string;
  accompagnateur: boolean;
  commentaire: string;
};

const EMPTY: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "",
  city: "",
  niveauScolaire: "",
  niveauScolaireAutre: "",
  etablissement: "",
  region: "",
  projetPro: "",
  motivation: [],
  motivationDetail: "",
  commentConnu: "",
  droitsImageAccepted: false,
  droitsImageSignature: "",
  regime: [],
  accessibilite: "",
  accompagnateur: false,
  commentaire: "",
};

const VIDEOS = [
  { id: "OyucCIz1_8U", title: "Exemple d'event Les Pilotes" },
  { id: "IyMoyHQurGY", title: "Workshop 100% Féminin — édition précédente" },
  { id: "eRkIu1V0hQI", title: "Immersion en entreprise" },
  { id: "xh4aoxYjAOs", title: "Le programme Les Pilotes" },
];

// ─── UI primitives ───────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition bg-white placeholder:text-zinc-400";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-900 mb-1.5">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function InscriptionForm({ event }: { event: EventProps }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [flow, setFlow] = useState<Flow>("unknown");
  const [data, setData] = useState<FormData>(EMPTY);
  const [pendingProfile, setPendingProfile] = useState<{
    firstName: string;
    lastEventName: string | null;
    verifyBirthDate: string;
    isStale: boolean;
  } | null>(null);
  const [verifyDob, setVerifyDob] = useState("");
  const [verifyError, setVerifyError] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoIdx, setVideoIdx] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const eventDate = new Date(event.date);
  const eventDateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(eventDate);
  const eventTimeLabel = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(eventDate);

  const isMinor = data.birthDate
    ? (eventDate.getTime() - new Date(data.birthDate).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25) <
      18
    : false;

  // ─── Closed event guard ────────────────────────────────────────────────────
  if (event.isClosed) {
    return (
      <Layout event={event} eventDateLabel={eventDateLabel} eventTimeLabel={eventTimeLabel}>
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🕊️</div>
          <h2 className="text-xl font-extrabold text-zinc-900">
            Les inscriptions sont fermées
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Cet événement est terminé. Reviens bientôt pour découvrir nos prochains rendez-vous.
          </p>
        </div>
      </Layout>
    );
  }

  if (event.isFull) {
    return (
      <Layout event={event} eventDateLabel={eventDateLabel} eventTimeLabel={eventTimeLabel}>
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">📋</div>
          <h2 className="text-xl font-extrabold text-zinc-900">
            Toutes les places sont prises
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            L&apos;événement affiche complet. Tu peux quand même renseigner ton email
            ci-dessous pour être contactée en cas de désistement.
          </p>
        </div>
      </Layout>
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function setField<K extends keyof FormData>(k: K, v: FormData[K]) {
    setData((p) => ({ ...p, [k]: v }));
  }
  function toggleArray<K extends "motivation" | "regime">(k: K, v: string) {
    setData((p) => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v],
    }));
  }

  function applyProfile(profile: ReturningProfile, isStale: boolean) {
    setData((p) => ({
      ...p,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      birthDate: profile.birthDate,
      gender: (profile.gender as FormData["gender"]) ?? "",
      city: profile.city,
      niveauScolaire: profile.niveauScolaire ?? "",
      etablissement: profile.etablissement ?? "",
      region: profile.region ?? "",
      projetPro: profile.projetPro ?? "",
      motivation: profile.motivation ?? [],
      motivationDetail: profile.motivationDetail ?? "",
      commentConnu: profile.commentConnu ?? "",
    }));
    setFlow(isStale ? "returning_stale" : "returning_fresh");
    // returning_fresh skips steps 1 + 2; returning_stale skips only step 1
    setStep(isStale ? 2 : 3);
  }

  // ─── Step transitions ──────────────────────────────────────────────────────
  async function handleEmailContinue() {
    if (!data.email.includes("@")) return;
    startTransition(async () => {
      const result = await lookupUserByEmail(data.email);
      if (result.kind === "new") {
        setFlow("new");
        setStep(1);
      } else {
        setPendingProfile({
          firstName: result.firstName,
          lastEventName: result.lastEventName,
          verifyBirthDate: result.verifyBirthDate,
          isStale: result.isStale,
        });
        setStep(0.5);
      }
    });
  }

  async function handleVerifyConfirm() {
    if (!pendingProfile || !verifyDob) return;
    startTransition(async () => {
      const profile = await verifyAndFetchProfile(data.email, verifyDob);
      if (profile) {
        applyProfile(profile, pendingProfile.isStale);
        setPendingProfile(null);
        setVerifyDob("");
        setVerifyError(false);
      } else {
        setVerifyError(true);
      }
    });
  }

  function handleVerifyFallback() {
    setPendingProfile(null);
    setVerifyDob("");
    setVerifyError(false);
    setFlow("new");
    setStep(1);
  }

  const step1Valid =
    data.firstName.trim() &&
    data.lastName.trim() &&
    data.phone.trim() &&
    data.birthDate &&
    data.city.trim();

  const step2Valid =
    data.niveauScolaire &&
    data.region &&
    data.projetPro.trim() &&
    data.motivation.length > 0 &&
    data.commentConnu.trim();

  const step3Valid =
    // Pour majeure : doit accepter droits image + signer
    // Pour mineure : doit cocher "je m'engage à apporter le doc signé"
    (isMinor
      ? data.droitsImageAccepted // = "je m'engage à apporter le doc"
      : data.droitsImageAccepted && data.droitsImageSignature.trim().length > 2);

  function handleNext() {
    if (step === 1 && step1Valid) {
      setStep(2);
    } else if (step === 2 && step2Valid) {
      setStep(3);
    }
  }

  function handleBack() {
    if (step === 0.5) {
      setStep(0);
      setPendingProfile(null);
      setVerifyDob("");
    } else if (step === 1) {
      setStep(0);
      setFlow("unknown");
    } else if (step === 2) {
      if (flow === "returning_stale") {
        setStep(0);
        setFlow("unknown");
        setData(EMPTY);
      } else {
        setStep(1);
      }
    } else if (step === 3) {
      if (flow === "returning_fresh") {
        setStep(0);
        setFlow("unknown");
        setData(EMPTY);
      } else {
        setStep(2);
      }
    }
  }

  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitInscription({
        eventId: event.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
        gender: data.gender || undefined,
        city: data.city,
        niveauScolaire: data.niveauScolaire as (typeof NIVEAUX_SCOLAIRES)[number],
        niveauScolaireAutre: data.niveauScolaireAutre || undefined,
        etablissement: data.etablissement || undefined,
        region: data.region as (typeof REGIONS_FR)[number],
        projetPro: data.projetPro,
        motivation: data.motivation,
        motivationDetail: data.motivationDetail || undefined,
        commentConnu: data.commentConnu,
        droitsImageAccepted: data.droitsImageAccepted,
        droitsImageSignature: isMinor ? undefined : data.droitsImageSignature,
        regime: data.regime,
        accessibilite: data.accessibilite || undefined,
        accompagnateur: data.accompagnateur,
        commentaire: data.commentaire || undefined,
      });
      if (result.ok) {
        router.push(
          `/inscription/${event.id}/merci?firstName=${encodeURIComponent(data.firstName)}&minor=${isMinor ? "1" : "0"}`,
        );
      } else {
        setSubmitError(result.error);
      }
    });
  }

  const totalSteps = flow === "returning_fresh" ? 1 : flow === "returning_stale" ? 2 : 3;
  const currentStepNum =
    step === 1 ? 1 : step === 2 ? (flow === "returning_stale" ? 1 : 2) : step === 3 ? totalSteps : 0;
  const progress = step === 0 || step === 0.5 ? 0 : Math.round((currentStepNum / totalSteps) * 100);

  return (
    <Layout
      event={event}
      eventDateLabel={eventDateLabel}
      eventTimeLabel={eventTimeLabel}
      progress={step >= 1 && step <= 3 ? progress : undefined}
      stepLabel={
        step >= 1 && step <= 3 ? `Étape ${currentStepNum}/${totalSteps}` : undefined
      }
    >
      {step === 0 && (
        <Step0Email
          email={data.email}
          isPending={isPending}
          onChange={(v) => setField("email", v)}
          onContinue={handleEmailContinue}
        />
      )}

      {step === 0.5 && pendingProfile && (
        <StepVerify
          firstName={pendingProfile.firstName}
          birthDate={verifyDob}
          error={verifyError}
          isPending={isPending}
          onChange={(v) => {
            setVerifyDob(v);
            setVerifyError(false);
          }}
          onConfirm={handleVerifyConfirm}
          onFallback={handleVerifyFallback}
        />
      )}

      {step === 1 && (
        <Step1Fondamentale
          data={data}
          setField={setField}
        />
      )}

      {step === 2 && (
        <Step2Orientation
          data={data}
          flow={flow}
          setField={setField}
          toggleMotivation={(v) => toggleArray("motivation", v)}
        />
      )}

      {step === 3 && (
        <Step3Evenement
          data={data}
          flow={flow}
          isMinor={isMinor}
          setField={setField}
          toggleRegime={(v) => toggleArray("regime", v)}
          onOpenVideo={(idx) => {
            setVideoIdx(idx);
            setVideoOpen(true);
          }}
        />
      )}

      {submitError && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Nav buttons */}
      {step >= 1 && step <= 3 && (
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isPending}
            className="px-5 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            ← Retour
          </button>
          {step === 3 ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!step3Valid || isPending}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors"
            >
              {isPending ? "Envoi en cours…" : "Confirmer mon inscription →"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                isPending || (step === 1 ? !step1Valid : step === 2 ? !step2Valid : false)
              }
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors"
            >
              Continuer →
            </button>
          )}
        </div>
      )}

      {videoOpen && (
        <VideoModal
          videos={VIDEOS}
          activeIdx={videoIdx}
          onChange={setVideoIdx}
          onClose={() => setVideoOpen(false)}
        />
      )}
    </Layout>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────────

function Layout({
  event,
  eventDateLabel,
  eventTimeLabel,
  progress,
  stepLabel,
  children,
}: {
  event: EventProps;
  eventDateLabel: string;
  eventTimeLabel: string;
  progress?: number;
  stepLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative w-9 h-9 shrink-0">
            <Image src="/logo-pilotes.png" alt="Les Pilotes" fill className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">{event.name}</p>
            <p className="text-[11px] text-zinc-500 truncate">
              {eventDateLabel} · {eventTimeLabel} · {event.address}
            </p>
          </div>
        </div>
        {progress !== undefined && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
              <span>{stepLabel}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>
      <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

// ─── Step 0 — email ──────────────────────────────────────────────────────────

function Step0Email({
  email,
  isPending,
  onChange,
  onContinue,
}: {
  email: string;
  isPending: boolean;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">
          Commence par ton email
        </h2>
        <p className="text-sm text-zinc-500">
          Si tu es déjà venue à un workshop, tes infos seront pré-remplies.
        </p>
      </div>
      <Field label="Adresse email" required>
        <input
          type="email"
          value={email}
          onChange={(e) => onChange(e.target.value)}
          placeholder="prenom.nom@exemple.fr"
          className={inputCls}
          onKeyDown={(e) =>
            e.key === "Enter" && email.includes("@") && !isPending && onContinue()
          }
          autoFocus
        />
      </Field>
      <button
        type="button"
        onClick={onContinue}
        disabled={!email.includes("@") || isPending}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors"
      >
        {isPending ? "…" : "Continuer →"}
      </button>
    </div>
  );
}

// ─── Step 0.5 — verify DOB ───────────────────────────────────────────────────

function StepVerify({
  firstName,
  birthDate,
  error,
  isPending,
  onChange,
  onConfirm,
  onFallback,
}: {
  firstName: string;
  birthDate: string;
  error: boolean;
  isPending: boolean;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onFallback: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">
          On dirait qu&apos;on se connaît, {firstName} 👋
        </h2>
        <p className="text-sm text-zinc-500">
          Confirme ta date de naissance pour qu&apos;on retrouve ton profil.
        </p>
      </div>
      <Field label="Date de naissance" required>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} ${error ? "border-red-300 ring-2 ring-red-100" : ""}`}
          autoFocus
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600">
            Cette date ne correspond pas à notre fiche. Vérifie et réessaie.
          </p>
        )}
      </Field>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!birthDate || isPending}
        className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors"
      >
        {isPending ? "…" : "Confirmer →"}
      </button>
      <button
        type="button"
        onClick={onFallback}
        className="w-full text-sm text-zinc-400 hover:text-zinc-600 py-2 transition-colors"
      >
        Ce n&apos;est pas moi · m&apos;inscrire avec un nouvel email
      </button>
    </div>
  );
}

// ─── Step 1 — Couche Fondamentale ────────────────────────────────────────────

function Step1Fondamentale({
  data,
  setField,
}: {
  data: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-1">
          Couche 1 · Toi
        </p>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">Tes infos de base</h2>
        <p className="text-sm text-zinc-500">
          Ces infos ne seront pas partagées. Elles servent uniquement à te reconnaître pour
          tes prochaines inscriptions.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Prénom" required>
          <input
            value={data.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder="Marie"
            className={inputCls}
          />
        </Field>
        <Field label="Nom" required>
          <input
            value={data.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder="Dupont"
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Téléphone" required hint="Au cas où on doive te joindre rapidement.">
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => setField("phone", e.target.value)}
          placeholder="06 12 34 56 78"
          className={inputCls}
        />
      </Field>
      <Field label="Date de naissance" required>
        <input
          type="date"
          value={data.birthDate}
          onChange={(e) => setField("birthDate", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Tu es">
        <div className="grid grid-cols-3 gap-2">
          {(["Fille", "Garçon", "Autre"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setField("gender", g)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                data.gender === g
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Ville de résidence" required>
        <input
          value={data.city}
          onChange={(e) => setField("city", e.target.value)}
          placeholder="Paris, Montreuil, Bobigny…"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

// ─── Step 2 — Couche Orientation ─────────────────────────────────────────────

function Step2Orientation({
  data,
  flow,
  setField,
  toggleMotivation,
}: {
  data: FormData;
  flow: Flow;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleMotivation: (v: string) => void;
}) {
  const isStale = flow === "returning_stale";
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-1">
          Couche 2 · Orientation
        </p>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">
          {isStale ? "Tes infos ont-elles changé ?" : "Ton parcours"}
        </h2>
        <p className="text-sm text-zinc-500">
          {isStale
            ? "Ça fait un moment — vérifie et mets à jour ce qui a bougé."
            : "Ces infos nous aident à te connecter avec les bonnes intervenantes et programmes."}
        </p>
      </div>
      <Field label="Niveau scolaire" required>
        <select
          value={data.niveauScolaire}
          onChange={(e) => setField("niveauScolaire", e.target.value)}
          className={inputCls}
        >
          <option value="">Sélectionne…</option>
          {NIVEAUX_SCOLAIRES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </Field>
      {data.niveauScolaire === "Autres" && (
        <Field label="Précise ton niveau">
          <input
            value={data.niveauScolaireAutre}
            onChange={(e) => setField("niveauScolaireAutre", e.target.value)}
            placeholder="Ex : DUT, gap year, en reconversion…"
            className={inputCls}
          />
        </Field>
      )}
      <Field label="Établissement">
        <input
          value={data.etablissement}
          onChange={(e) => setField("etablissement", e.target.value)}
          placeholder="Lycée, fac, école…"
          className={inputCls}
        />
      </Field>
      <Field label="Région" required>
        <select
          value={data.region}
          onChange={(e) => setField("region", e.target.value)}
          className={inputCls}
        >
          <option value="">Sélectionne…</option>
          {REGIONS_FR.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field
        label="Sais-tu ce que tu veux faire plus tard ?"
        required
        hint="Si oui, précise ton projet. Sinon écris 'pas encore' ou 'en construction'."
      >
        <textarea
          value={data.projetPro}
          onChange={(e) => setField("projetPro", e.target.value)}
          rows={3}
          placeholder="Ex : marketing digital, médecine, je cherche encore…"
          className={inputCls}
        />
      </Field>
      <Field label="Ce qui te motive à rejoindre Les Pilotes" required>
        <div className="flex flex-wrap gap-2 mt-1">
          {MOTIVATIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMotivation(m)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                data.motivation.includes(m)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-orange-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Détaille ta motivation (optionnel)">
        <textarea
          value={data.motivationDetail}
          onChange={(e) => setField("motivationDetail", e.target.value)}
          rows={2}
          placeholder="Quelque chose de plus précis à nous dire ?"
          className={inputCls}
        />
      </Field>
      <Field label="Comment as-tu connu Les Pilotes ?" required>
        <select
          value={data.commentConnu}
          onChange={(e) => setField("commentConnu", e.target.value)}
          className={inputCls}
        >
          <option value="">Sélectionne…</option>
          {SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

// ─── Step 3 — Couche Événement ───────────────────────────────────────────────

function Step3Evenement({
  data,
  isMinor,
  setField,
  toggleRegime,
  onOpenVideo,
}: {
  data: FormData;
  flow: Flow;
  isMinor: boolean;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleRegime: (v: string) => void;
  onOpenVideo: (idx: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-1">
          Couche 3 · Cet événement
        </p>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">
          Dernière étape
        </h2>
        <p className="text-sm text-zinc-500">Quelques infos propres à cet événement.</p>
      </div>

      {/* Droits image */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 mb-1">
            Droit à l&apos;image
          </h3>
          <p className="text-sm text-zinc-500">
            On filme et photographie l&apos;événement. Ces médias servent uniquement à raconter
            l&apos;histoire des Pilotes sur nos réseaux et auprès de nos partenaires.
          </p>
          <button
            type="button"
            onClick={() => onOpenVideo(0)}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            <Play className="w-4 h-4" />
            Voir un exemple d&apos;event
          </button>
        </div>

        {isMinor ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              <strong>Tu es mineure.</strong> Tes parents doivent signer l&apos;autorisation
              parentale.
            </div>
            <a
              href="/legal/adhesion-mineur.pdf"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Télécharger l&apos;autorisation parentale (PDF)
            </a>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50">
              <input
                type="checkbox"
                checked={data.droitsImageAccepted}
                onChange={(e) => setField("droitsImageAccepted", e.target.checked)}
                className="mt-0.5 accent-orange-500 w-4 h-4"
              />
              <span className="text-sm text-zinc-700">
                Je m&apos;engage à apporter ce document signé par mes parents le jour J.
                Sans ce document, je comprends que je ne pourrai pas participer.
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50">
              <input
                type="checkbox"
                checked={data.droitsImageAccepted}
                onChange={(e) => setField("droitsImageAccepted", e.target.checked)}
                className="mt-0.5 accent-orange-500 w-4 h-4"
              />
              <span className="text-sm text-zinc-700">
                J&apos;autorise Les Pilotes à me filmer et me photographier pendant cet
                événement, et à diffuser ces médias sur leurs réseaux sociaux et supports
                de communication.
              </span>
            </label>
            {data.droitsImageAccepted && (
              <Field
                label="Signature (ton nom complet)"
                required
                hint="Vaut signature digitale du consentement. Tu recevras une copie PDF par email."
              >
                <input
                  value={data.droitsImageSignature}
                  onChange={(e) => setField("droitsImageSignature", e.target.value)}
                  placeholder="Marie Dupont"
                  className={inputCls}
                />
              </Field>
            )}
          </div>
        )}
      </section>

      {/* Régime alimentaire */}
      <Field
        label="Régime alimentaire"
        hint="Au cas où il y a un repas ou un snack — coche ce qui s'applique."
      >
        <div className="flex flex-wrap gap-2 mt-1">
          {REGIMES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRegime(r)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                data.regime.includes(r)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-orange-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

      {/* Accessibilité */}
      <Field
        label="Besoin spécifique / accessibilité"
        hint="Mobilité réduite, neurodivergence, troubles dys, malentendante, etc. — dis-nous ce qu'il te faut."
      >
        <textarea
          value={data.accessibilite}
          onChange={(e) => setField("accessibilite", e.target.value)}
          rows={2}
          placeholder="Ex : besoin d'un accès PMR, présence d'un chien guide…"
          className={inputCls}
        />
      </Field>

      {/* Accompagnateur */}
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50">
        <input
          type="checkbox"
          checked={data.accompagnateur}
          onChange={(e) => setField("accompagnateur", e.target.checked)}
          className="accent-orange-500 w-4 h-4"
        />
        <span className="text-sm text-zinc-700">
          Je viendrai accompagnée (parent, ami·e, référent·e…)
        </span>
      </label>

      {/* Commentaire libre */}
      <Field label="Commentaire / question (optionnel)">
        <textarea
          value={data.commentaire}
          onChange={(e) => setField("commentaire", e.target.value)}
          rows={3}
          placeholder="Une question, une attente, un truc à nous dire ?"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

// ─── Video modal ─────────────────────────────────────────────────────────────

function VideoModal({
  videos,
  activeIdx,
  onChange,
  onClose,
}: {
  videos: { id: string; title: string }[];
  activeIdx: number;
  onChange: (idx: number) => void;
  onClose: () => void;
}) {
  const active = videos[activeIdx];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <p className="font-bold text-sm text-zinc-900">{active.title}</p>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${active.id}?rel=0&modestbranding=1`}
            title={active.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-2 border-t border-zinc-100">
          {videos.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => onChange(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                idx === activeIdx
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
