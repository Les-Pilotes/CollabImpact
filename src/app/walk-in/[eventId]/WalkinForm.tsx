"use client";

import { useState, useTransition } from "react";
import { submitWalkin } from "./actions";

export default function WalkinForm({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [droitsImage, setDroitsImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.includes("@")) {
      setError("Renseigne au moins ton prénom, ton nom et un email valide.");
      return;
    }
    startTransition(async () => {
      const res = await submitWalkin({
        eventId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        droitsImageAccepted: droitsImage,
      });
      if (res.ok) setDone(true);
      else setError(res.error ?? "Une erreur est survenue.");
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-start justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-5">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
            Inscription sur place
          </p>
          <h1 className="text-white text-lg font-extrabold mt-0.5">{eventName}</h1>
        </div>

        {done ? (
          <div className="px-6 py-12 text-center">
            <p className="text-5xl">🎉</p>
            <h2 className="text-xl font-bold mt-3 mb-2">Bienvenue {firstName} !</h2>
            <p className="text-zinc-500 text-sm">
              Tu es bien enregistrée. Installe-toi, on s&apos;occupe du reste.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
            <p className="text-sm text-zinc-500 -mt-1">
              Quelques infos et c&apos;est parti. Ça prend 30 secondes.
            </p>

            <WField label="Prénom" required>
              <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
            </WField>
            <WField label="Nom" required>
              <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </WField>
            <WField label="Email" required>
              <input className={inputCls} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </WField>
            <WField label="Téléphone">
              <input className={inputCls} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </WField>

            <label className="flex items-start gap-3 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={droitsImage}
                onChange={(e) => setDroitsImage(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-orange-500"
              />
              <span className="text-sm text-zinc-600">
                J&apos;autorise Les Pilotes à utiliser les photos / vidéos prises pendant
                l&apos;événement.
              </span>
            </label>

            {error && <p className="text-rose-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="mt-1 bg-zinc-900 text-white py-3 rounded-xl font-semibold text-[15px] disabled:opacity-60"
            >
              {isPending ? "Enregistrement…" : "Je m'inscris"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-zinc-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white";

function WField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-900">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
