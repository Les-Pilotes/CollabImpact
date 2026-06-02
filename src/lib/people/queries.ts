import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type PersonListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  enrollmentCount: number;
  lastEnrollmentAt: Date | null;
  lastEventName: string | null;
};

export type PersonListResult = {
  items: PersonListItem[];
  nextCursor: string | null;
};

type ListInput = {
  organisationId: string;
  search?: string;
  limit?: number;
  cursor?: string;
};

const DEFAULT_LIMIT = 50;

export async function listPeople({
  organisationId,
  search,
  limit = DEFAULT_LIMIT,
  cursor,
}: ListInput): Promise<PersonListResult> {
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

  // take + 1 to know if there's another page without a second query
  const rows = await prisma.user.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      city: true,
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
  });

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  const items: PersonListItem[] = sliced.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    city: u.city,
    enrollmentCount: u._count.enrollments,
    lastEnrollmentAt: u.enrollments[0]?.enrolledAt ?? null,
    lastEventName: u.enrollments[0]?.event.name ?? null,
  }));

  return {
    items,
    nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
  };
}

export async function countPeople(organisationId: string): Promise<number> {
  return prisma.user.count({
    where: { organisationId, deletedAt: null },
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
