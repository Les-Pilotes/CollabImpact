import Link from "next/link";
import { Search, MapPin, Mail, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { listPeople, countPeople } from "@/lib/people/queries";

export const metadata = { title: "Carnet" };

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

export default async function PeopleListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  const { admin } = await requireAdmin();
  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;

  const [total, page] = await Promise.all([
    countPeople(admin.organisationId),
    listPeople({
      organisationId: admin.organisationId,
      search,
      cursor: sp.cursor,
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Carnet</h1>
        <p className="text-sm text-stone-500 mt-1">
          {total} personne{total !== 1 ? "s" : ""} dans la base
          {search ? ` — recherche : « ${search} »` : ""}.
        </p>
      </header>

      <form className="relative max-w-md" action="/admin/personnes">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Nom, email, téléphone…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-stone-200 bg-white focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
        />
      </form>

      {page.items.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden bg-white">
          {page.items.map((p) => (
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
                  <p className="text-xs text-stone-500 truncate">
                    {p.lastEventName}
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatDate(p.lastEnrollmentAt)}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {page.nextCursor && (
        <div className="flex justify-center">
          <Link
            href={{
              pathname: "/admin/personnes",
              query: {
                ...(search ? { q: search } : {}),
                cursor: page.nextCursor,
              },
            }}
            className="text-sm text-orange-700 hover:text-orange-900 font-medium"
          >
            Charger plus →
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState({ search }: { search?: string }) {
  if (search) {
    return (
      <div className="text-center py-16 border border-dashed border-stone-200 rounded-lg">
        <p className="text-stone-500 text-sm">
          Aucune personne ne correspond à « {search} ».
        </p>
        <Link
          href="/admin/personnes"
          className="text-xs text-orange-600 hover:underline mt-2 inline-block"
        >
          Réinitialiser la recherche
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
