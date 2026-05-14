import { DroitsImageStatus, EnrollmentMode } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection, Field, EmptyValue } from "./CollapsibleSection";

type Props = {
  enrolledAt: Date;
  mode: EnrollmentMode;
  referentName: string | null;
  source: string | null;
  userSource: string | null;
  droitsImageStatus: DroitsImageStatus;
  droitsImageSignedAt: Date | null;
  droitsImageSignature: string | null;
  regime: string[];
  accessibilite: string | null;
  accompagnateur: boolean;
  commentaire: string | null;
};

const DROITS_LABEL: Record<DroitsImageStatus, string> = {
  pending: "En attente",
  accepted: "Acceptés",
  refused: "Refusés",
  minor_parental_pending: "Mineure · attente parentale",
};

const DROITS_VARIANT: Record<
  DroitsImageStatus,
  "success" | "destructive" | "warning" | "muted"
> = {
  pending: "muted",
  accepted: "success",
  refused: "destructive",
  minor_parental_pending: "warning",
};

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Couche Événement — info specific to this enrollment: droits image,
 * régime, accessibilité, mode (individuel / via referent), commentaire
 * laissé par la participante.
 */
export function EventLayer({
  enrolledAt,
  mode,
  referentName,
  source,
  userSource,
  droitsImageStatus,
  droitsImageSignedAt,
  droitsImageSignature,
  regime,
  accessibilite,
  accompagnateur,
  commentaire,
}: Props) {
  const effectiveSource = source ?? userSource;

  return (
    <CollapsibleSection
      label="Couche 3"
      title="Inscription à cet événement"
      defaultOpen
      meta={
        <Badge variant={DROITS_VARIANT[droitsImageStatus]}>
          {DROITS_LABEL[droitsImageStatus]}
        </Badge>
      }
    >
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-4">
        <Field label="Inscrite le">
          {dateTimeFormatter.format(enrolledAt)}
        </Field>
        <Field label="Mode d'inscription">
          {mode === "via_referent" ? (
            <>
              Via référent
              {referentName ? (
                <span className="text-stone-500"> · {referentName}</span>
              ) : null}
            </>
          ) : (
            "Individuel"
          )}
        </Field>
        <Field label="Source">{effectiveSource ?? <EmptyValue />}</Field>
        <Field label="Accompagnateur">
          {accompagnateur ? "Oui" : "Non"}
        </Field>

        <Field label="Droits image" wide>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant={DROITS_VARIANT[droitsImageStatus]}>
                {DROITS_LABEL[droitsImageStatus]}
              </Badge>
              {droitsImageSignedAt && (
                <span className="text-xs text-stone-500">
                  Signés le {dateFormatter.format(droitsImageSignedAt)}
                </span>
              )}
            </div>
            {droitsImageSignature && (
              <p className="text-xs text-stone-500">
                Signature : <span className="italic">{droitsImageSignature}</span>
              </p>
            )}
          </div>
        </Field>

        <Field label="Régime alimentaire" wide>
          {regime.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {regime.map((r) => (
                <li
                  key={r}
                  className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-800 border border-amber-200"
                >
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyValue />
          )}
        </Field>

        <Field label="Accessibilité" wide>
          {accessibilite ? (
            <p className="whitespace-pre-wrap rounded-xl bg-stone-50 px-3 py-2">
              {accessibilite}
            </p>
          ) : (
            <EmptyValue />
          )}
        </Field>

        <Field label="Commentaire de la participante" wide>
          {commentaire ? (
            <p className="whitespace-pre-wrap rounded-xl bg-stone-50 px-3 py-2 text-stone-700 italic">
              &ldquo;{commentaire}&rdquo;
            </p>
          ) : (
            <EmptyValue />
          )}
        </Field>
      </dl>
    </CollapsibleSection>
  );
}
