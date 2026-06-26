"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertEmailConfig } from "./actions";
import EmailPreview from "./EmailPreview";
import { DEFAULTS, VARIABLES, type EmailKey } from "./email-templates";

type EmailField = "Subject" | "Body" | "Note";

type InitialConfig = {
  confirmationSubject: string;
  confirmationBody: string;
  confirmationNote: string;
  j7Subject: string;
  j7Body: string;
  j7Note: string;
  j2Subject: string;
  j2Body: string;
  j2Note: string;
  feedbackSubject: string;
  feedbackBody: string;
  feedbackNote: string;
};

const EMAIL_ORDER: EmailKey[] = ["confirmation", "j7", "j2", "feedback"];

export default function CommunicationsTab({
  eventId,
  signature,
  initial,
}: {
  eventId: string;
  signature: string;
  initial: InitialConfig;
}) {
  const [openKey, setOpenKey] = useState<EmailKey>("confirmation");

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900">Emails transactionnels</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-prose">
          Le texte par défaut est déjà pré-rempli — modifie-le directement.{" "}
          <span className="text-stone-600">« Restaurer »</span> remet le texte par défaut.
          Insère <code className="text-stone-700 bg-stone-100 px-1 rounded text-xs">{"{prenom}"}</code>,{" "}
          <code className="text-stone-700 bg-stone-100 px-1 rounded text-xs">{"{event}"}</code>,{" "}
          <code className="text-stone-700 bg-stone-100 px-1 rounded text-xs">{"{date}"}</code>,{" "}
          <code className="text-stone-700 bg-stone-100 px-1 rounded text-xs">{"{horaire}"}</code>,{" "}
          <code className="text-stone-700 bg-stone-100 px-1 rounded text-xs">{"{lieu}"}</code> pour les valeurs dynamiques.
        </p>
      </div>

      {EMAIL_ORDER.map((key) => (
        <EmailRow
          key={key}
          emailKey={key}
          eventId={eventId}
          signature={signature}
          isOpen={openKey === key}
          onToggle={() => setOpenKey(openKey === key ? ("" as EmailKey) : key)}
          initial={{
            subject: initial[`${configKey(key)}Subject` as keyof InitialConfig] ?? "",
            body: initial[`${configKey(key)}Body` as keyof InitialConfig] ?? "",
            note: initial[`${configKey(key)}Note` as keyof InitialConfig] ?? "",
          }}
        />
      ))}
    </div>
  );
}

function configKey(emailKey: EmailKey): "confirmation" | "j7" | "j2" | "feedback" {
  return emailKey;
}

function EmailRow({
  emailKey,
  eventId,
  signature,
  isOpen,
  onToggle,
  initial,
}: {
  emailKey: EmailKey;
  eventId: string;
  signature: string;
  isOpen: boolean;
  onToggle: () => void;
  initial: { subject: string; body: string; note: string };
}) {
  const def = DEFAULTS[emailKey];
  // Pre-fill the editor with the full default copy so the admin edits real text
  // instead of starting from an empty field with a placeholder. An empty DB
  // override means "use the default", so we hydrate from the default here.
  const [subject, setSubject] = useState(initial.subject || def.subject);
  const [body, setBody] = useState(initial.body || def.body);
  const [note, setNote] = useState(initial.note);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const subjectCustom = subject.trim() !== def.subject.trim();
  const bodyCustom = body.trim() !== def.body.trim();
  const noteCustom = note.trim().length > 0;
  const customCount = [subjectCustom, bodyCustom, noteCustom].filter(Boolean).length;

  function reset(field: EmailField) {
    if (field === "Subject") setSubject(def.subject);
    if (field === "Body") setBody(def.body);
    if (field === "Note") setNote("");
    setIsDirty(true);
  }

  function handleSave() {
    // Store an override only when the text actually differs from the default.
    // Sending "" lets upsertEmailConfig persist NULL, so the event keeps
    // tracking the default copy (and inherits future edits to it).
    const payload: Partial<Record<string, string>> = {
      [`${emailKey}Subject`]: subjectCustom ? subject : "",
      [`${emailKey}Body`]: bodyCustom ? body : "",
      [`${emailKey}Note`]: note,
    };
    startTransition(async () => {
      const result = await upsertEmailConfig(eventId, payload);
      if (result.ok) {
        toast.success(`${def.label} : enregistré`);
        setIsDirty(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="border-b border-stone-200 last:border-b-0">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 py-4 text-left hover:bg-stone-50 -mx-2 px-2 rounded transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900">{def.label}</p>
          <p className="text-xs text-stone-500 truncate">{def.when}</p>
        </div>
        {customCount > 0 && (
          <span className="text-[10px] uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            {customCount} personnalisé{customCount > 1 ? "s" : ""}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="pb-8 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <FieldHeader
                label="Objet"
                hasCustom={subjectCustom}
                onReset={() => reset("Subject")}
              />
              <Input
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setIsDirty(true);
                }}
                placeholder={def.subject}
              />
            </div>

            <div className="space-y-1.5">
              <FieldHeader
                label="Corps du message"
                hasCustom={bodyCustom}
                onReset={() => reset("Body")}
              />
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setIsDirty(true);
                }}
                rows={6}
                placeholder={def.body}
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none font-mono leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <FieldHeader
                label="Note finale (encadré)"
                hasCustom={note.trim().length > 0}
                onReset={() => reset("Note")}
              />
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setIsDirty(true);
                }}
                rows={3}
                placeholder="Ex : pense à apporter ton CV, le métro le plus proche est Saint-Sulpice…"
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <p className="text-xs text-stone-400">Affiché dans un encadré gris en bas de l&apos;email.</p>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <details className="text-xs text-stone-500">
                <summary className="cursor-pointer hover:text-stone-700 select-none">
                  Variables disponibles
                </summary>
                <ul className="mt-2 space-y-1 pl-4">
                  {VARIABLES.map((v) => (
                    <li key={v.token} className="flex gap-2">
                      <code className="text-stone-700 bg-stone-100 px-1 rounded text-xs shrink-0">
                        {v.token}
                      </code>
                      <span>{v.description}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {isDirty ? (
                <p className="text-xs text-stone-500">Modifications non enregistrées</p>
              ) : (
                <p className="text-xs text-emerald-600">À jour</p>
              )}
              <div className="flex-1" />
              <Button size="sm" onClick={handleSave} disabled={isPending || !isDirty}>
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="text-[11px] uppercase tracking-wider text-stone-400 mb-2">
              Aperçu en temps réel
            </p>
            <EmailPreview
              emailKey={emailKey}
              subject={subject}
              body={body}
              note={note}
              signature={signature}
              isMinor={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldHeader({
  label,
  hasCustom,
  onReset,
}: {
  label: string;
  hasCustom: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-stone-700">{label}</Label>
      {hasCustom && (
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1"
          title="Restaurer le texte par défaut"
        >
          <RotateCcw className="w-3 h-3" />
          Restaurer
        </button>
      )}
    </div>
  );
}

