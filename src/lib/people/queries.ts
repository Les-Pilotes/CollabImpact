import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type PersonListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  niveauScolaire: string | null;
  region: string | null;
  birthDate: Date | null;
  enrollmentCount: number;
  lastEnrollmentAt: Date | null;
  lastEventName: string | null;
};

export type PeopleSort = "recent" | "name" | "age_young" | "age_old" | "events";

export type PeopleFilters = {
  search?: string;
  niveauScolaire?: string;
  region?: string;
  eventId?: string;
  ageMin?: number;
  ageMax?: number;
  sort?: PeopleSort;
};

export type PersonListResult = {
  items: PersonListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type ListInput = PeopleFilters & {
  organisationId: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 50;

/**
 * Builds the Prisma `where` from the filter set. Shared by listPeople and the
 * count so the total always matches the filtered list.
 */
function buildWhere({
  organisationId,
  search,
  niveauScolaire,
  region,
  eventId,
  ageMin,
  ageMax,
}: ListInput): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    organisationId,
    deletedAt: null,
  };

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  if (niveauScolaire) where.niveauScolaire = niveauScolaire;
  if (region) where.region = region;

  // Participation filter: only people enrolled (not soft-deleted) in this event.
  if (eventId) {
    where.enrollments = { some: { eventId, deletedAt: null } };
  }

  // Age → birthDate window. age >= ageMin ⟺ born on/before (today - ageMin y).
  // age <= ageMax ⟺ born on/after (today - (ageMax+1) y). Rows without a
  // birthDate are excluded when an age filter is active (expected).
  if (ageMin != null || ageMax != null) {
    const now = new Date();
    const birthDate: Prisma.DateTimeFilter = {};
    if (ageMin != null) {
      birthDate.lte = new Date(
        now.getFullYear() - ageMin,
        now.getMonth(),
        now.getDate(),
      );
    }
    if (ageMax != null) {
      birthDate.gte = new Date(
        now.getFullYear() - ageMax - 1,
        now.getMonth(),
        now.getDate(),
      );
    }
    where.birthDate = birthDate;
  }

  return where;
}

function buildOrderBy(
  sort: PeopleSort = "recent",
): Prisma.UserOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }];
    case "age_young": // most recent birthDate first
      return [{ birthDate: "desc" }, { id: "asc" }];
    case "age_old":
      return [{ birthDate: "asc" }, { id: "asc" }];
    case "events":
      return [{ enrollments: { _count: "desc" } }, { id: "asc" }];
    case "recent":
    default:
      return [{ updatedAt: "desc" }, { id: "desc" }];
  }
}

export async function listPeople(input: ListInput): Promise<PersonListResult> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const where = buildWhere(input);

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: buildOrderBy(input.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        niveauScolaire: true,
        region: true,
        birthDate: true,
        _count: {
          select: { enrollments: { where: { deletedAt: null } } },
        },
        enrollments: {
          where: { deletedAt: null },
          orderBy: { enrolledAt: "desc" },
          take: 1,
          select: {
            enrolledAt: true,
            event: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const items: PersonListItem[] = rows.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    city: u.city,
    niveauScolaire: u.niveauScolaire,
    region: u.region,
    birthDate: u.birthDate,
    enrollmentCount: u._count.enrollments,
    lastEnrollmentAt: u.enrollments[0]?.enrolledAt ?? null,
    lastEventName: u.enrollments[0]?.event.name ?? null,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function countPeople(organisationId: string): Promise<number> {
  return prisma.user.count({
    where: { organisationId, deletedAt: null },
  });
}

/** Lightweight event list for the directory's "participation" filter dropdown. */
export async function listEventsForFilter(organisationId: string) {
  return prisma.event.findMany({
    where: { organisationId, deletedAt: null },
    orderBy: { date: "desc" },
    select: { id: true, name: true, date: true },
  });
}

export async function getPersonDetail(
  userId: string,
  organisationId: string,
) {
  return prisma.user.findFirst({
    where: { id: userId, organisationId, deletedAt: null },
    include: {
      enrollments: {
        where: { deletedAt: null },
        orderBy: { enrolledAt: "desc" },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
              address: true,
              status: true,
              type: true,
            },
          },
          feedback: true,
        },
      },
    },
  });
}

export type PersonDetail = NonNullable<
  Awaited<ReturnType<typeof getPersonDetail>>
>;
