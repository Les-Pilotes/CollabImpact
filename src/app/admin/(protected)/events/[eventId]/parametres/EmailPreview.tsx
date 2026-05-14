"use client";

/**
 * Email preview renderer. Mirrors the visual style of the React Email templates
 * (BaseLayout-equivalent: brand header, white card, footer). Renders the user's
 * overrides if provided, falls back to the same default copy that the real
 * crons + actions use at send time. Variables get substituted with sample data.
 */

import type { EmailKey } from "./email-templates";
import { substituteVariables, SAMPLE_VARS, DEFAULTS } from "./email-templates";

type Props = {
  emailKey: EmailKey;
  subject: string;
  body: string;
  note: string;
  signature: string;
  isMinor?: boolean;
};

export default function EmailPreview({
  emailKey,
  subject,
  body,
  note,
  signature,
  isMinor,
}: Props) {
  const def = DEFAULTS[emailKey];
  const finalSubject = substituteVariables(subject || def.subject, SAMPLE_VARS);
  const finalHeading = substituteVariables(def.heading, SAMPLE_VARS);
  const finalBody = substituteVariables(body || def.body, SAMPLE_VARS);
  const finalNote = substituteVariables(note, SAMPLE_VARS);
  const finalClosing = def.closing;

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-100 overflow-hidden">
      {/* Mock email client header */}
      <div className="px-4 py-3 border-b border-stone-200 bg-white">
        <p className="text-[11px] text-stone-400 uppercase tracking-wider">Aperçu</p>
        <p className="text-sm font-semibold text-stone-900 mt-0.5 truncate" title={finalSubject}>
          {finalSubject || <span className="text-stone-400 italic">Sujet vide</span>}
        </p>
        <p className="text-xs text-stone-500 mt-1">
          De : <span className="text-stone-700">Les Pilotes &lt;hello@les-pilotes.fr&gt;</span>
        </p>
      </div>

      {/* Email body */}
      <div className="px-4 py-6 max-h-[680px] overflow-y-auto">
        <div className="bg-white rounded-md shadow-sm mx-auto max-w-[520px] overflow-hidden">
          {/* Brand header strip */}
          <div className="px-6 py-4 bg-stone-900">
            <p className="text-white font-semibold text-sm tracking-tight">Les Pilotes</p>
          </div>

          <div className="px-6 py-8 space-y-4">
            <h2 className="text-xl font-semibold text-stone-900 leading-tight">
              {finalHeading}
            </h2>

            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {finalBody}
            </p>

            {/* CTA buttons for J-7 / J-2 */}
            {(emailKey === "j7" || emailKey === "j2") && (
              <div className="flex gap-2 py-2">
                <span className="inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded">
                  ✓ Je serai là
                </span>
                <span className="inline-block px-4 py-2 bg-white border border-stone-200 text-stone-600 text-xs font-medium rounded">
                  ✗ Je me désiste
                </span>
              </div>
            )}

            {/* CTA button for feedback */}
            {emailKey === "feedback" && (
              <div className="py-2">
                <span className="inline-block px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded">
                  Donner mon avis
                </span>
              </div>
            )}

            {/* Minor reminder (for J-7 / J-2 only) */}
            {(emailKey === "j7" || emailKey === "j2") && isMinor && (
              <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2.5">
                <p className="text-xs text-amber-900 leading-relaxed">
                  📄 <strong>Rappel mineure</strong> — n&apos;oublie pas d&apos;apporter l&apos;autorisation parentale signée le jour J.
                </p>
              </div>
            )}

            {/* Custom note (shaded box) */}
            {finalNote.trim() && (
              <div className="bg-stone-100 border border-stone-200 rounded px-3 py-2.5">
                <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                  {finalNote}
                </p>
              </div>
            )}

            {/* Closing line */}
            <p className="text-xs text-stone-500 leading-relaxed">{finalClosing}</p>

            {/* Signature */}
            {signature.trim() && (
              <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line pt-3 border-t border-stone-100">
                {signature}
              </p>
            )}
          </div>

          {/* Email footer */}
          <div className="px-6 py-3 bg-stone-50 border-t border-stone-100">
            <p className="text-[10px] text-stone-400">
              Les Pilotes — programme d&apos;immersion professionnelle pour jeunes femmes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
