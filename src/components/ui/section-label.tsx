import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  tone?: "default" | "brand";
  className?: string;
};

/**
 * Small uppercase section label, used for "Couche 1 · Toi" / "Partage" /
 * "Verbatims" kind of headers. Centralises spacing/typography so panels stay
 * visually aligned across the app.
 */
export function SectionLabel({ children, tone = "default", className }: Props) {
  return (
    <p
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.14em]",
        tone === "brand" ? "text-[var(--brand-orange)]" : "text-stone-400",
        className,
      )}
    >
      {children}
    </p>
  );
}
