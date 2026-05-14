"use client";

import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  size?: number;
  className?: string;
  /** When true, embeds the orange brand color as the foreground. */
  branded?: boolean;
};

/**
 * Wrapper around qrcode.react with brand styling defaults.
 * The wrapper sets a white background + comfortable padding so the QR can be
 * printed or screenshot without further styling.
 */
export function QrCode({ value, size = 192, className, branded = true }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-white p-4 rounded-2xl border border-zinc-200",
        className,
      )}
    >
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={0}
        // Matches --brand-orange in src/app/globals.css. Keep in sync if the var changes.
        fgColor={branded ? "#ff914d" : "#1c1917"}
        bgColor="#ffffff"
      />
    </div>
  );
}
