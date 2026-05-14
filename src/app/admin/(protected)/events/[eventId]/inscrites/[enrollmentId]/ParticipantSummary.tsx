import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { capitalizeName } from "@/lib/normalize";

type Props = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  birthDate: Date | null;
  gender: string | null;
  isMinor: boolean;
  ageOnEventDay: number | null;
  hasDietary: boolean;
  hasAccessibility: boolean;
  droitsImageStatus: "pending" | "accepted" | "refused" | "minor_parental_pending";
  statusLabel: string;
  statusTone: "default" | "warning" | "success" | "destructive" | "muted" | "secondary" | "outline";
};

const DROITS_LABEL: Record<Props["droitsImageStatus"], string> = {
  pending: "En attente",
  accepted: "Acceptés",
  refused: "Refusés",
  minor_parental_pending: "Mineure · attente parentale",
};

const DROITS_VARIANT: Record<
  Props["droitsImageStatus"],
  "success" | "destructive" | "warning" | "muted"
> = {
  pending: "muted",
  accepted: "success",
  refused: "destructive",
  minor_parental_pending: "warning",
};

/**
 * Sticky header with the participante name, key contact info, and the
 * critical visual badges (minor, droits image, dietary, accessibility,
 * enrollment status) that need to be visible at a glance.
 */
export function ParticipantSummary({
  firstName,
  lastName,
  email,
  phone,
  city,
  birthDate,
  gender,
  isMinor,
  ageOnEventDay,
  hasDietary,
  hasAccessibility,
  droitsImageStatus,
  statusLabel,
  statusTone,
}: Props) {
  const displayFirst = capitalizeName(firstName);
  const displayLast = capitalizeName(lastName);

  const birthLabel = birthDate
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(birthDate)
    : null;

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h1 className="text-3xl font-bold leading-tight text-stone-900">
          {displayFirst} {displayLast}
        </h1>
        <Badge variant={statusTone}>{statusLabel}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {isMinor && (
          <Badge
            variant="warning"
            className="bg-orange-100 text-orange-800"
            title={
              ageOnEventDay !== null
                ? `${ageOnEventDay} ans le jour de l'événement`
                : "Mineure le jour de l'événement"
            }
          >
            Mineure {ageOnEventDay !== null ? `· ${ageOnEventDay} ans` : ""}
          </Badge>
        )}
        <Badge variant={DROITS_VARIANT[droitsImageStatus]}>
          Droits image · {DROITS_LABEL[droitsImageStatus]}
        </Badge>
        {hasDietary && (
          <Badge variant="secondary" title="Régime alimentaire spécifique">
            Régime spécifique
          </Badge>
        )}
        {hasAccessibility && (
          <Badge variant="outline" title="Besoin d'accessibilité">
            Accessibilité
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 pt-2 text-sm">
        <div>
          <SectionLabel>Email</SectionLabel>
          <dd className="mt-1 text-stone-900 break-all">
            <a
              className="hover:text-[var(--brand-orange)] transition-colors"
              href={`mailto:${email}`}
            >
              {email}
            </a>
          </dd>
        </div>
        <div>
          <SectionLabel>Téléphone</SectionLabel>
          <dd className="mt-1 text-stone-900 tabular-nums">
            {phone ? (
              <a
                className="hover:text-[var(--brand-orange)] transition-colors"
                href={`tel:${phone}`}
              >
                {phone}
              </a>
            ) : (
              <span className="text-stone-400">—</span>
            )}
          </dd>
        </div>
        <div>
          <SectionLabel>Ville</SectionLabel>
          <dd className="mt-1 text-stone-900">
            {city ?? <span className="text-stone-400">—</span>}
          </dd>
        </div>
        <div>
          <SectionLabel>Naissance</SectionLabel>
          <dd className="mt-1 text-stone-900">
            {birthLabel ? (
              <>
                {birthLabel}
                {gender ? <span className="text-stone-400"> · {gender}</span> : null}
              </>
            ) : (
              <span className="text-stone-400">—</span>
            )}
          </dd>
        </div>
      </dl>
    </header>
  );
}
