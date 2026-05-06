/**
 * Normalise un prénom ou nom de famille :
 * - Première lettre en majuscule, reste en minuscule
 * - Gère les noms composés avec tiret ou espace (ex: "marie-claire" → "Marie-Claire")
 */
export function capitalizeName(value: string): string {
  if (!value) return value;
  return value
    .trim()
    .toLowerCase()
    .split(/([- ])/)
    .map((part) => {
      if (part === "-" || part === " ") return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}
