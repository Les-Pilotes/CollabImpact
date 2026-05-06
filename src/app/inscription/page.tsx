'use client';

import { useState } from 'react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  firstName: string; lastName: string; email: string; phone: string;
  birthDate: string; city: string; educationLevel: string; specialty: string;
  projectStatus: string; projectDescription: string; interests: string[];
  howYouHeard: string; comment: string;
}

type Flow = 'unknown' | 'new' | 'returning';
type Step = 0 | 1 | 2 | 3 | 4; // 0=email, 1-3=new, 3=returning condensed, 4=success

// ─── Demo returning participants ──────────────────────────────────────────────

const RETURNING: Record<string, Partial<FormData> & { lastEvent: string; verifyBirthDate: string }> = {
  'sarah.cisse@gmail.com': {
    firstName: 'Sarah', lastName: 'Cissé', phone: '07 99 00 11 22',
    birthDate: '2007-03-15', verifyBirthDate: '2007-03-15',
    city: 'Bobigny', educationLevel: 'Première',
    specialty: 'Générale', projectStatus: "Mon projet est en construction",
    interests: ['Tech & Numérique', 'Marketing & Communication'],
    lastEvent: 'Workshop 100% Féminin #4 · octobre 2025',
  },
  'lea.bernard@gmail.com': {
    firstName: 'Léa', lastName: 'Bernard', phone: '06 22 33 44 55',
    birthDate: '2005-08-22', verifyBirthDate: '2005-08-22',
    city: 'Paris 20e', educationLevel: 'Terminale',
    specialty: 'Économique et Sociale', projectStatus: "J'ai un projet défini",
    projectDescription: 'Marketing digital et communication de marque',
    interests: ['Marketing & Communication', 'Art & Culture'],
    lastEvent: 'Workshop 100% Féminin #3 · mars 2025',
  },
};

const EMPTY_FORM: FormData = {
  firstName: '', lastName: '', email: '', phone: '', birthDate: '', city: '',
  educationLevel: '', specialty: '', projectStatus: '', projectDescription: '',
  interests: [], howYouHeard: '', comment: '',
};

const EVENT_DATE = new Date('2026-04-18');
const DAYS_UNTIL_EVENT = Math.ceil((EVENT_DATE.getTime() - Date.now()) / 86400000);

// ─── Shared components ────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-900 mb-1.5">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition bg-white placeholder:text-zinc-400";
const readonlyCls = "w-full px-4 py-3 rounded-xl border border-zinc-100 text-sm bg-zinc-50 text-zinc-500";

const EDUCATION_LEVELS = ['3ème', 'Seconde', 'Première', 'Terminale', 'BTS/BUT', 'Licence', 'Master', 'Autre'];
const INTERESTS = ['Tech & Numérique', 'Finance & Banque', 'Marketing & Communication', 'Santé & Médecine', 'Droit & Justice', 'Art & Culture', 'Éducation & Social', 'Autre'];
const SOURCES = ['WhatsApp', 'Instagram', 'Bouche à oreille', 'Via un référent / professeur', 'Autre'];

// ─── Step 0v — Verify identity ────────────────────────────────────────────────

function StepVerify({ birthDate, onChange, onConfirm, onFallback }: {
  birthDate: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onFallback: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">Confirme ton identité</h2>
        <p className="text-sm text-zinc-500">Pour protéger tes informations, indique ta date de naissance.</p>
      </div>
      <Field label="Date de naissance" required>
        <input type="date" value={birthDate} onChange={(e) => onChange(e.target.value)} className={inputCls} autoFocus />
      </Field>
      <button onClick={onConfirm} disabled={!birthDate} className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors">
        Confirmer →
      </button>
      <button onClick={onFallback} className="w-full text-sm text-zinc-400 hover:text-zinc-600 py-2 transition-colors">
        ← Changer d'email
      </button>
    </div>
  );
}

// ─── Step 0 — Email check ─────────────────────────────────────────────────────

function StepEmail({ email, onChange, onContinue }: { email: string; onChange: (v: string) => void; onContinue: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">Commence par ton email</h2>
        <p className="text-sm text-zinc-500">Si tu t'es déjà inscrite à un Workshop Les Pilotes, tes informations seront pré-remplies.</p>
      </div>
      <Field label="Adresse email" required>
        <input type="email" value={email} onChange={(e) => onChange(e.target.value)} placeholder="prenom.nom@exemple.fr" className={inputCls} onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && onContinue()} autoFocus />
      </Field>
      <button onClick={onContinue} disabled={!email.includes('@')} className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors">
        Continuer →
      </button>
    </div>
  );
}

// ─── Steps 1-3 — New participant ──────────────────────────────────────────────

function Step1({ data, onChange }: { data: FormData; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">Tes informations</h2>
        <p className="text-sm text-zinc-500">Ces informations ne seront jamais partagées avec des tiers.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Prénom" required><input name="firstName" value={data.firstName} onChange={onChange} placeholder="Marie" className={inputCls} /></Field>
        <Field label="Nom" required><input name="lastName" value={data.lastName} onChange={onChange} placeholder="Dupont" className={inputCls} /></Field>
      </div>
      <Field label="Téléphone" required><input name="phone" type="tel" value={data.phone} onChange={onChange} placeholder="06 12 34 56 78" className={inputCls} /></Field>
      <Field label="Date de naissance" required><input name="birthDate" type="date" value={data.birthDate} onChange={onChange} className={inputCls} /></Field>
      <Field label="Ville de résidence" required><input name="city" value={data.city} onChange={onChange} placeholder="Paris, Montreuil, Bobigny…" className={inputCls} /></Field>
    </div>
  );
}

function Step2({ data, onChange, onCheck }: { data: FormData; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; onCheck: (v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">Ton orientation</h2>
        <p className="text-sm text-zinc-500">Ces infos nous aident à te connecter avec les bonnes intervenantes.</p>
      </div>
      <Field label="Niveau scolaire" required>
        <select name="educationLevel" value={data.educationLevel} onChange={onChange} className={inputCls}>
          <option value="">Sélectionne ton niveau</option>
          {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </Field>
      <Field label="Filière / Spécialité">
        <input name="specialty" value={data.specialty} onChange={onChange} placeholder="Ex : Économique et Sociale, Informatique…" className={inputCls} />
      </Field>
      <Field label="Ton projet professionnel" required>
        <div className="space-y-2">
          {["J'ai un projet défini", "Mon projet est en construction", "Je n'ai pas encore de projet"].map((opt) => (
            <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${data.projectStatus === opt ? 'border-orange-400 bg-orange-50' : 'border-zinc-200 hover:border-zinc-300'}`}>
              <input type="radio" name="projectStatus" value={opt} checked={data.projectStatus === opt} onChange={onChange} className="accent-orange-500" />
              <span className="text-sm font-medium text-zinc-800">{opt}</span>
            </label>
          ))}
        </div>
      </Field>
      {data.projectStatus === "J'ai un projet défini" && (
        <Field label="Décris ton projet" required>
          <textarea name="projectDescription" value={data.projectDescription} onChange={onChange} rows={3} placeholder="Ex : Je veux travailler dans la communication digitale…" className={inputCls} />
        </Field>
      )}
      <Field label="Domaines qui t'intéressent" required>
        <div className="flex flex-wrap gap-2 mt-1">
          {INTERESTS.map((i) => (
            <button key={i} type="button" onClick={() => onCheck(i)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${data.interests.includes(i) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-300'}`}>
              {i}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Step3({ data, onChange }: { data: FormData; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">Derniers détails</h2>
        <p className="text-sm text-zinc-500">Tu y es presque !</p>
      </div>

      {/* Late registration warning */}
      {DAYS_UNTIL_EVENT <= 2 && DAYS_UNTIL_EVENT >= 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Inscription de dernière minute</strong> — L'événement est {DAYS_UNTIL_EVENT === 0 ? "aujourd'hui" : `dans ${DAYS_UNTIL_EVENT} jour(s)`}. Ta place sera validée directement sur place.
        </div>
      )}

      <Field label="Comment as-tu entendu parler de cet événement ?" required>
        <select name="howYouHeard" value={data.howYouHeard} onChange={onChange} className={inputCls}>
          <option value="">Sélectionne une option</option>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Commentaire ou question">
        <textarea name="comment" value={data.comment} onChange={onChange} rows={3} placeholder="Une question ? Un besoin particulier ?" className={inputCls} />
      </Field>

      {/* Recap */}
      <div className="bg-zinc-50 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-semibold text-zinc-800 mb-3">Récapitulatif</p>
        {[
          ['Nom complet', `${data.firstName} ${data.lastName}`],
          ['Email', data.email],
          ['Téléphone', data.phone],
          ['Ville', data.city],
          ['Niveau', data.educationLevel],
          ['Domaines', data.interests.join(', ') || '—'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-zinc-500">{k}</span>
            <span className="text-zinc-800 font-medium text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Returning participant step ───────────────────────────────────────────────

function ReturningStep({ data, profile, onChange, onCheck }: {
  data: FormData;
  profile: typeof RETURNING[string];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onCheck: (v: string) => void;
}) {
  const [editOrientation, setEditOrientation] = useState(false);

  return (
    <div className="space-y-6">
      {/* Welcome back banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-2xl">👋</span>
        <div>
          <p className="font-bold text-orange-800">Bienvenue {profile.firstName} !</p>
          <p className="text-sm text-orange-700 mt-0.5">On te reconnaît depuis <strong>{profile.lastEvent}</strong>. Tes infos sont pré-remplies.</p>
        </div>
      </div>

      {/* Couche 1 - Read only */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tes informations · pré-remplies</p>
        <div className="bg-zinc-50 rounded-xl p-4 space-y-2 text-sm">
          {[
            [`${profile.firstName} ${profile.lastName}`, 'Nom complet'],
            [data.email, 'Email'],
            [profile.phone ?? '—', 'Téléphone'],
            [profile.city ?? '—', 'Ville'],
          ].map(([v, k]) => (
            <div key={k} className="flex justify-between">
              <span className="text-zinc-500">{k}</span>
              <span className="font-medium text-zinc-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Couche 2 - Editable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ton orientation</p>
          <button onClick={() => setEditOrientation((v) => !v)} className="text-xs text-orange-500 hover:text-orange-700 font-semibold">
            {editOrientation ? 'Fermer ↑' : 'Mettre à jour ↓'}
          </button>
        </div>
        {!editOrientation ? (
          <div className="bg-zinc-50 rounded-xl p-4 space-y-2 text-sm">
            {[
              [profile.educationLevel ?? '—', 'Niveau'],
              [profile.specialty ?? '—', 'Filière'],
              [profile.projectStatus ?? '—', 'Projet'],
              [(profile.interests ?? []).join(', ') || '—', 'Domaines'],
            ].map(([v, k]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-zinc-500">{k}</span>
                <span className="font-medium text-zinc-800 text-right">{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 border border-zinc-200 rounded-xl p-4">
            <Field label="Niveau scolaire">
              <select name="educationLevel" value={data.educationLevel} onChange={onChange} className={inputCls}>
                {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Domaines">
              <div className="flex flex-wrap gap-2 mt-1">
                {INTERESTS.map((i) => (
                  <button key={i} type="button" onClick={() => onCheck(i)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${data.interests.includes(i) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-zinc-600 border-zinc-200'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </div>

      {/* Couche 3 - Must fill */}
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pour cet événement</p>
        <Field label="Comment as-tu entendu parler de cette édition ?" required>
          <select name="howYouHeard" value={data.howYouHeard} onChange={onChange} className={inputCls}>
            <option value="">Sélectionne une option</option>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Commentaire ou question">
          <textarea name="comment" value={data.comment} onChange={onChange} rows={2} placeholder="Quelque chose à nous dire ?" className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ firstName, isReturning }: { firstName: string; isReturning: boolean }) {
  return (
    <div className="text-center py-12 space-y-6">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-2">
          {isReturning ? `Contente de te revoir, ${firstName} !` : `Bienvenue, ${firstName} !`}
        </h2>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto">
          Ton inscription au <strong>Workshop 100% Féminin</strong> est bien enregistrée.
        </p>
      </div>
      <div className="bg-orange-50 rounded-2xl p-5 text-left space-y-3 max-w-sm mx-auto">
        <p className="text-sm font-semibold text-orange-800">📅 Samedi 18 avril 2026 · 9h30–12h30</p>
        <p className="text-sm text-orange-700">📍 9 rue de Vaugirard, 75006 Paris · La Cité Audacieuse</p>
        <p className="text-sm text-orange-700">📧 Un email de confirmation va t'être envoyé. Garde un œil sur ta boîte !</p>
      </div>
      <div className="bg-zinc-50 rounded-xl p-4 text-sm text-zinc-600 text-left max-w-sm mx-auto space-y-2">
        <p className="font-semibold text-zinc-800">La suite :</p>
        <p>• Tu recevras une relance à J-7 pour confirmer ta présence</p>
        <p>• Puis une dernière confirmation à J-2</p>
        <p>• Le jour J : viens avec une pièce d'identité</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InscriptionPage() {
  const [step, setStep] = useState<Step>(0);
  const [verifying, setVerifying] = useState(false); // interstitiel vérif identité
  const [verifyBirthDate, setVerifyBirthDate] = useState('');
  const [pendingProfile, setPendingProfile] = useState<typeof RETURNING[string] | null>(null);
  const [flow, setFlow] = useState<Flow>('unknown');
  const [returningProfile, setReturningProfile] = useState<typeof RETURNING[string] | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheck = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }));
  };

  const handleEmailContinue = () => {
    const profile = RETURNING[formData.email.toLowerCase().trim()];
    if (profile) {
      // Email trouvé → demander vérification avant de révéler quoi que ce soit
      setPendingProfile(profile);
      setVerifying(true);
    } else {
      setFlow('new');
      setStep(1);
    }
  };

  const handleVerifyConfirm = () => {
    if (!pendingProfile) return;
    if (verifyBirthDate === pendingProfile.verifyBirthDate) {
      // Vérification réussie → pré-remplir et afficher le formulaire retour
      setReturningProfile(pendingProfile);
      setFlow('returning');
      setFormData((prev) => ({ ...prev, ...pendingProfile, email: prev.email }));
      setVerifying(false);
      setPendingProfile(null);
      setVerifyBirthDate('');
      setStep(3);
    } else {
      // Échec silencieux → nouvelle inscription, sans révéler que l'email existe
      setVerifying(false);
      setPendingProfile(null);
      setVerifyBirthDate('');
      setFlow('new');
      setStep(1);
    }
  };

  const isStep1Valid = formData.firstName.trim() && formData.lastName.trim() && formData.phone.trim() && formData.birthDate && formData.city.trim();
  const isStep2Valid = formData.educationLevel && formData.projectStatus && formData.interests.length > 0 && (formData.projectStatus !== "J'ai un projet défini" || formData.projectDescription.trim());
  const isStep3Valid = formData.howYouHeard.trim();

  const handleNext = () => {
    if (flow === 'returning' && step === 3 && isStep3Valid) { setStep(4); return; }
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2 && isStep2Valid) setStep(3);
    else if (step === 3 && isStep3Valid) setStep(4);
  };

  const handleBack = () => {
    if (flow === 'returning' && step === 3) { setStep(0); setFlow('unknown'); setReturningProfile(null); setFormData(EMPTY_FORM); return; }
    if (step > 0 && step < 4) setStep((step - 1) as Step);
  };

  const stepLabel = flow === 'returning' ? 'Retour' : step === 1 ? 'Étape 1/3' : step === 2 ? 'Étape 2/3' : step === 3 ? 'Étape 3/3' : '';
  const progress = step === 0 ? 0 : flow === 'returning' ? 66 : step === 1 ? 33 : step === 2 ? 66 : 100;

  const nextDisabled = step === 0 ? !formData.email.includes('@')
    : step === 1 ? !isStep1Valid
    : step === 2 ? !isStep2Valid
    : step === 3 ? !isStep3Valid
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/logo-pilotes.png" alt="Les Pilotes" fill className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 truncate">Workshop 100% Féminin · Les Pilotes</p>
            <p className="text-[11px] text-zinc-500">18 avril 2026 · 9h30–12h30 · 9 rue de Vaugirard, Paris 6e</p>
          </div>
        </div>
        {step > 0 && step < 4 && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
              <span>{stepLabel}</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {step === 0 && !verifying && (
          <StepEmail
            email={formData.email}
            onChange={(v) => setFormData((p) => ({ ...p, email: v }))}
            onContinue={handleEmailContinue}
          />
        )}
        {verifying && (
          <StepVerify
            birthDate={verifyBirthDate}
            onChange={setVerifyBirthDate}
            onConfirm={handleVerifyConfirm}
            onFallback={() => { setVerifying(false); setPendingProfile(null); setVerifyBirthDate(''); }}
          />
        )}
        {flow === 'new' && step === 1 && <Step1 data={formData} onChange={handleChange} />}
        {flow === 'new' && step === 2 && <Step2 data={formData} onChange={handleChange} onCheck={handleCheck} />}
        {flow === 'new' && step === 3 && <Step3 data={formData} onChange={handleChange} />}
        {flow === 'returning' && step === 3 && returningProfile && (
          <ReturningStep data={formData} profile={returningProfile} onChange={handleChange} onCheck={handleCheck} />
        )}
        {step === 4 && <SuccessScreen firstName={formData.firstName} isReturning={flow === 'returning'} />}

        {/* Nav buttons */}
        {step > 0 && step < 4 && (
          <div className="mt-8 flex gap-3">
            <button onClick={handleBack} className="px-5 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
              ← Retour
            </button>
            <button onClick={handleNext} disabled={nextDisabled} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-colors">
              {step === 3 ? "Confirmer mon inscription →" : "Continuer →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
