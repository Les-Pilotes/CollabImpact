import { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/section-label";

type Props = {
  label: string;
  title: string;
  defaultOpen?: boolean;
  meta?: ReactNode;
  children: ReactNode;
};

/**
 * Native <details> collapsible: zero client-side JS, accessible by default,
 * works fine in a server component. Uniform styling so all three layers
 * (Fondamentale, Orientation, Événement) feel like a stack.
 */
export function CollapsibleSection({
  label,
  title,
  defaultOpen = false,
  meta,
  children,
}: Props) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-stone-200 bg-white shadow-sm open:shadow-md transition-shadow"
    >
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 select-none">
        <div className="min-w-0">
          <SectionLabel>{label}</SectionLabel>
          <h2 className="mt-1 text-lg font-semibold text-stone-900 truncate">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {meta}
          <span
            aria-hidden
            className="text-stone-400 group-open:rotate-90 transition-transform"
          >
            {">"}
          </span>
        </div>
      </summary>
      <div className="px-5 pb-5 border-t border-stone-100">{children}</div>
    </details>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
  wide?: boolean;
};

/**
 * Definition-list row used inside CollapsibleSection bodies. Layout adapts
 * via a 2-col grid; `wide` makes a field span the full row.
 */
export function Field({ label, children, wide = false }: FieldProps) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-stone-900 leading-relaxed">{children}</dd>
    </div>
  );
}

export function EmptyValue() {
  return <span className="text-stone-400">—</span>;
}
