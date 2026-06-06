'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Accessible label, used for aria-label when no visible label is present. */
  label?: string;
  className?: string;
}

/**
 * Toggle (switch) réutilisable.
 *
 * Géométrie (mathématiquement bornée) :
 * - track : 44px × 24px (w-11 h-6)
 * - thumb : 20px (w-5 h-5) + 2px de marge de chaque côté = 24px = hauteur track
 * - OFF : thumb à gauche (translate-x-0.5 = 2px), track gris clair
 * - ON  : thumb à droite (translate-x-[22px] = 44 - 20 - 2 = 22px), track sombre
 *
 * Le thumb ne peut jamais déborder : 22px + 20px + 2px = 44px = largeur track.
 *
 * Bouton natif contrôlé : pas d'input caché, pas de `peer` Tailwind.
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex w-11 h-6 shrink-0 rounded-full transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-stone-900' : 'bg-stone-200',
        className,
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

export default Toggle;
