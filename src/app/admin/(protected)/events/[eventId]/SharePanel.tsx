"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, QrCode as QrCodeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/ui/qr-code";
import { SectionLabel } from "@/components/ui/section-label";

type Props = {
  inscriptionUrl: string;
  eventName: string;
  eventDate: string; // pre-formatted for the WhatsApp message
  /** When false, the panel renders a softer "not yet published" state. */
  isPublished: boolean;
};

export default function SharePanel({
  inscriptionUrl,
  eventName,
  eventDate,
  isPublished,
}: Props) {
  const [qrOpen, setQrOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const whatsappMessage = `Coucou 👋\nLes Pilotes organisent *${eventName}* le ${eventDate}.\nTu peux t'inscrire ici : ${inscriptionUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inscriptionUrl);
      toast.success("Lien copié");
    } catch {
      // Clipboard API may be unavailable (e.g. non-secure context, Firefox
      // permissions). Select the input so the user can finish with Ctrl/Cmd+C.
      inputRef.current?.focus();
      inputRef.current?.select();
      toast.info("Lien sélectionné — appuie sur ⌘C / Ctrl+C pour copier", {
        duration: 5000,
      });
    }
  }

  if (!isPublished) {
    return (
      <section className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-5 space-y-2">
        <SectionLabel>Partage</SectionLabel>
        <p className="text-sm text-stone-600">
          Passe l&apos;événement en <strong>En préparation</strong> pour activer le lien
          d&apos;inscription et le QR code.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
        <div>
          <SectionLabel tone="brand">Partage</SectionLabel>
          <p className="text-sm text-stone-500 mt-1">
            Diffuse ce lien sur WhatsApp, Instagram, dans une newsletter ou imprime le QR code
            sur un flyer.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-stretch gap-2">
            <input
              ref={inputRef}
              readOnly
              value={inscriptionUrl}
              onClick={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 px-3 py-2 text-sm font-mono bg-stone-50 border border-stone-200 rounded-lg text-stone-700 truncate focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)] cursor-text"
              aria-label="Lien d'inscription"
            />
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleCopy}
              className="gap-1.5 shrink-0"
            >
              <Copy className="w-4 h-4" />
              Copier
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:brightness-110 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Partager via WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 text-stone-700 text-sm font-semibold hover:border-stone-300 hover:bg-stone-50 transition-colors"
          >
            <QrCodeIcon className="w-4 h-4" />
            Afficher le QR code
          </button>
        </div>
      </section>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR code d&apos;inscription</DialogTitle>
            <DialogDescription>
              Scanne ou imprime ce code. Il pointe vers la page d&apos;inscription publique
              de l&apos;événement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <QrCode value={inscriptionUrl} size={240} />
          </div>
          <p className="text-center text-xs text-stone-500 truncate">{inscriptionUrl}</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setQrOpen(false)}>
              Fermer
            </Button>
            <Button type="button" onClick={handleCopy} className="gap-1.5">
              <Copy className="w-4 h-4" />
              Copier le lien
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
