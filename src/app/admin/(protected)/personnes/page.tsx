import Link from "next/link";
import { Search, MapPin, Mail, Phone, GraduationCap } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listPeople, listEventsForFilter } from "@/lib/people/queries";
import type { PeopleSort } from "@/lib/people/queries";
import { NIVEAUX, REGIONS } from "@/lib/validation/inscription";

export const metadata = { title: "Carnet d'adresses" };

const SORT_OPTIONS: { value: PeopleSort; label: string }[] = [
  { value: "recent", label: "Activité récente" },
  { value: "name", label: "Nom (A→Z)" },
  { value: "age_young", label: "Âge (plus jeune)" },
  { value: "age_old", label: "Âge (plus âgé)" },
  { value: "events", label: "Nb d'événements" },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function ageFromBirthDate(birthDate: Date): number {
  return Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

type SP = {
  q?: string;
  niveau?: string;
  region?: string;
  event?: string;
  ageMin?: string;
  ageMax?: string;
  sort?: string;
  page?: string;
};

function parseSort(value: string | undefined): PeopleSort {
  const allowed: PeopleSort[] = ["recent", "name", "age_young", "age_old", "events"];
  return allowed.includes(value as PeopleSort) ? (value as PeopleSort) : "recent";
}

function parseIntOrUndef(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function PeopleListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { admin } = await requireAdmin();
  const sp = await searchParams;

  const search = sp.q?.trim() || undefined;
  const niveauScolaire = sp.niveau || undefined;
  const region = sp.region || undefined;
  const eventId = sp.event || undefined;
  const ageMin = parseIntOrUndef(sp.ageMin);
  const ageMax = parseIntOrUndef(sp.ageMax);
  const sort = parseSort(sp.sort);
  const page = parseIntOrUndef(sp.page) ?? 1;

  const hasFilters = Boolean(
    search || niveauScolaire || region || eventId || ageMin != null || ageMax != null,
  );

  const [events, result] = await Promise.all([
    listEventsForFilter(admin.organisationId),
    listPeople({
      organisationId: admin.organisationId,
      search,
      niveauScolaire,
      region,
      eventId,
      ageMin,
      ageMax,
      sort,
      page,
    }),
  ]);

  // Build a query object that preserves the current filters for pagination links.
  const baseQuery: Record<string, string> = {};
  if (search) baseQuery.q = search;
  if (niveauScolaire) baseQuery.niveau = niveauScolaire;
  if (region) baseQuery.region = region;
  if (eventId) baseQuery.event = eventId;
  if (ageMin != null) baseQuery.ageMin = String(ageMin);
  if (ageMax != null) baseQuery.ageMax = String(ageMax);
  if (sort !== "recent") baseQuery.sort = sort;

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">{"Carnet d'adresses"}</h1>
        <p className="text-sm text-stone-500 mt-1">
          {result.total} personne{result.total !== 1 ? "s" : ""}
          {hasFilters ? " (filtré)" : " dans la base"}.
        </p>
      </header>

      {/* Filter + sort bar — plain GET form, no JS needed */}
      <form
        action="/admin/personnes"
        className="space-y-3 rounded-lg border border-stone-200 bg-white p-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={search ?? ""}
            placeholder="Nom, email, téléphone…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-stone-200 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <SelectField name="niveau" label="Niveau" defaultValue={niveauScolaire}>
            <option value="">Tous</option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>

          <SelectField name="region" label="Région" defaultValue={region}>
            <option value="">Toutes</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectField>

          <SelectField name="event" label="Événement" defaultValue={eventId}>
            <option value="">Tous</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </SelectField>

          <NumberField name="ageMin" label="Âge min" defaultValue={ageMin} />
          <NumberField name="ageMax" label="Âge max" defaultValue={ageMax} />

          <SelectField name="sort" label="Trier par" defaultValue={sort}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-md bg-stone-900 text-white hover:bg-stone-800 transition-colors"
          >
            Appliquer
          </button>
          {hasFilters && (
            <Link
              href="/admin/personnes"
              className="text-sm text-stone-500 hover:text-stone-900"
            >
              Réinitialiser
            </Link>
          )}
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
          {result.items.map((p) => (
            <Link
              key={p.id}
              href={`/admin/personnes/${p.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group"
            >
              <div
                className="shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-semibold"
                aria-hidden
              >
                {initials(p.firstName, p.lastName)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900 group-hover:text-orange-600 transition-colors truncate">
                  {p.firstName} {p.lastName}
                  {p.birthDate && (
                    <span className="text-stone-400 font-normal">
                      {" "}
                      · {ageFromBirthDate(p.birthDate)} ans
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-stone-500 mt-0.5">
                  <span className="inline-flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {p.email}
                  </span>
                  {p.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 shrink-0" />
                      {p.phone}
                    </span>
                  )}
                  {p.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {p.city}
                    </span>
                  )}
                  {p.niveauScolaire && (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      {p.niveauScolaire}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold text-stone-900 tabular-nums">
                  {p.enrollmentCount}
                </p>
                <p className="text-xs text-stone-400">
                  événement{p.enrollmentCount !== 1 ? "s" : ""}
                </p>
              </div>

              {p.lastEnrollmentAt && (
                <div className="hidden md:block shrink-0 text-right min-w-[160px]">
                  <p className="text-xs text-stone-500 truncate">{p.lastEventName}</p>
                  <p className="text-xs text-stone-400">
                    {formatDate(p.lastEnrollmentAt)}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PageLink
            baseQuery={baseQuery}
            page={page - 1}
            disabled={page <= 1}
            label="← Précédent"
          />
          <span className="text-stone-500">
            Page {page} / {result.totalPages}
          </span>
          <PageLink
            baseQuery={baseQuery}
            page={page + 1}
            disabled={page >= result.totalPages}
            label="Suivant →"
          />
        </div>
      )}
    </div>
  );
}

function PageLink({
  baseQuery,
  page,
  disabled,
  label,
}: {
  baseQuery: Record<string, string>;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="text-stone-300 select-none">{label}</span>;
  }
  return (
    <Link
      href={{
        pathname: "/admin/personnes",
        query: { ...baseQuery, page: String(page) },
      }}
      className="text-orange-700 hover:text-orange-900 font-medium"
    >
      {label}
    </Link>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-stone-500">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="px-2 py-1.5 text-sm text-stone-900 rounded-md border border-stone-200 bg-white focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
      >
        {children}
      </select>
    </label>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-stone-500">
      {label}
      <input
        type="number"
        name={name}
        min={0}
        max={120}
        defaultValue={defaultValue ?? ""}
        className="px-2 py-1.5 text-sm text-stone-900 rounded-md border border-stone-200 bg-white focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
      />
    </label>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="text-center py-16 border border-dashed border-stone-200 rounded-lg">
        <p className="text-stone-500 text-sm">
          Aucune personne ne correspond à ces critères.
        </p>
        <Link
          href="/admin/personnes"
          className="text-xs text-orange-600 hover:underline mt-2 inline-block"
        >
          Réinitialiser les filtres
        </Link>
      </div>
    );
  }
  return (
    <div className="text-center py-16 border border-dashed border-stone-200 rounded-lg">
      <p className="text-stone-500 text-sm">
        Pas encore de personnes dans la base.
      </p>
      <p className="text-stone-400 text-xs mt-1">
        Les contacts apparaissent ici au fur et à mesure des inscriptions.
      </p>
    </div>
  );
}
