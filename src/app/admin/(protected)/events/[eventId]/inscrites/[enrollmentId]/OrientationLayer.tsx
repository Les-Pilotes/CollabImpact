import { CollapsibleSection, Field, EmptyValue } from "./CollapsibleSection";

type Props = {
  niveauScolaire: string | null;
  niveauScolaireAutre: string | null;
  etablissement: string | null;
  region: string | null;
  projetPro: string | null;
  motivation: string[];
  motivationDetail: string | null;
  commentConnu: string | null;
  orientationUpdatedAt: Date | null;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Couche Orientation — école, projet pro, motivation. Stored on the User
 * (refreshable across enrollments). Rendered as a collapsible section so
 * admins can scan or expand on demand.
 */
export function OrientationLayer({
  niveauScolaire,
  niveauScolaireAutre,
  etablissement,
  region,
  projetPro,
  motivation,
  motivationDetail,
  commentConnu,
  orientationUpdatedAt,
}: Props) {
  const niveauDisplay =
    niveauScolaire === "Autres" && niveauScolaireAutre
      ? `Autres · ${niveauScolaireAutre}`
      : niveauScolaire;

  const hasContent =
    niveauScolaire ||
    etablissement ||
    region ||
    projetPro ||
    motivation.length > 0 ||
    motivationDetail ||
    commentConnu;

  return (
    <CollapsibleSection
      label="Couche 2"
      title="Orientation"
      defaultOpen
      meta={
        orientationUpdatedAt ? (
          <span className="text-xs text-stone-400">
            MAJ {dateFormatter.format(orientationUpdatedAt)}
          </span>
        ) : null
      }
    >
      {!hasContent ? (
        <p className="pt-4 text-sm text-stone-500">
          La participante n&apos;a pas encore rempli ces informations.
        </p>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-4">
          <Field label="Niveau scolaire">
            {niveauDisplay ?? <EmptyValue />}
          </Field>
          <Field label="Établissement">
            {etablissement ?? <EmptyValue />}
          </Field>
          <Field label="Région">{region ?? <EmptyValue />}</Field>
          <Field label="Comment elle nous a connues">
            {commentConnu ?? <EmptyValue />}
          </Field>
          <Field label="Projet professionnel" wide>
            {projetPro ? (
              <p className="whitespace-pre-wrap">{projetPro}</p>
            ) : (
              <EmptyValue />
            )}
          </Field>
          <Field label="Motivations" wide>
            {motivation.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {motivation.map((m) => (
                  <li
                    key={m}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyValue />
            )}
          </Field>
          {motivationDetail && (
            <Field label="Détail motivation" wide>
              <p className="whitespace-pre-wrap text-stone-700 italic">
                &ldquo;{motivationDetail}&rdquo;
              </p>
            </Field>
          )}
        </dl>
      )}
    </CollapsibleSection>
  );
}
