import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    event: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  listPeople,
  countPeople,
  getPersonDetail,
  listEventsForFilter,
} from "@/lib/people/queries";

const um = vi.mocked(prisma.user.findMany);
const uf = vi.mocked(prisma.user.findFirst);
const uc = vi.mocked(prisma.user.count);
const ef = vi.mocked(prisma.event.findMany);

beforeEach(() => {
  vi.clearAllMocks();
  uc.mockResolvedValue(0 as never);
  um.mockResolvedValue([] as never);
});

function makeRow(id: string, extra: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    firstName: "Léa",
    lastName: "Bernard",
    email: `${id}@example.test`,
    phone: null,
    city: "Paris",
    niveauScolaire: null,
    region: null,
    birthDate: null,
    _count: { enrollments: 0 },
    enrollments: [],
    ...extra,
  };
}

describe("listPeople — where clause", () => {
  it("scopes to the org and filters soft-deleted, no OR without search", async () => {
    await listPeople({ organisationId: "org-1" });

    const args = um.mock.calls[0][0]!;
    expect(args.where).toMatchObject({ organisationId: "org-1", deletedAt: null });
    expect(args.where!.OR).toBeUndefined();
  });

  it("builds an OR clause for search (name, email, phone)", async () => {
    await listPeople({ organisationId: "org-1", search: "Léa" });

    const or = um.mock.calls[0][0]!.where!.OR as Array<Record<string, unknown>>;
    expect(or).toHaveLength(4);
    expect(or[0]).toEqual({ firstName: { contains: "Léa", mode: "insensitive" } });
    expect(or[3]).toEqual({ phone: { contains: "Léa" } });
  });

  it("ignores blank search strings", async () => {
    await listPeople({ organisationId: "org-1", search: "   " });
    expect(um.mock.calls[0][0]!.where!.OR).toBeUndefined();
  });

  it("filters by niveau scolaire and region", async () => {
    await listPeople({
      organisationId: "org-1",
      niveauScolaire: "Terminale",
      region: "Île-De-France",
    });

    const where = um.mock.calls[0][0]!.where!;
    expect(where.niveauScolaire).toBe("Terminale");
    expect(where.region).toBe("Île-De-France");
  });

  it("filters by event participation via a some() relation", async () => {
    await listPeople({ organisationId: "org-1", eventId: "ev-9" });

    const where = um.mock.calls[0][0]!.where!;
    expect(where.enrollments).toEqual({
      some: { eventId: "ev-9", deletedAt: null },
    });
  });

  it("translates an age window into a birthDate range", async () => {
    await listPeople({ organisationId: "org-1", ageMin: 16, ageMax: 25 });

    const bd = um.mock.calls[0][0]!.where!.birthDate as {
      lte: Date;
      gte: Date;
    };
    // ageMin=16 → born on/before ~16y ago (lte). ageMax=25 → born on/after ~26y ago (gte).
    const now = new Date();
    expect(bd.lte.getFullYear()).toBe(now.getFullYear() - 16);
    expect(bd.gte.getFullYear()).toBe(now.getFullYear() - 26);
    expect(bd.lte.getTime()).toBeGreaterThan(bd.gte.getTime());
  });
});

describe("listPeople — sorting", () => {
  it("defaults to recent activity (updatedAt desc)", async () => {
    await listPeople({ organisationId: "org-1" });
    expect(um.mock.calls[0][0]!.orderBy).toEqual([
      { updatedAt: "desc" },
      { id: "desc" },
    ]);
  });

  it("sorts by name", async () => {
    await listPeople({ organisationId: "org-1", sort: "name" });
    expect(um.mock.calls[0][0]!.orderBy).toEqual([
      { lastName: "asc" },
      { firstName: "asc" },
      { id: "asc" },
    ]);
  });

  it("sorts by youngest (birthDate desc)", async () => {
    await listPeople({ organisationId: "org-1", sort: "age_young" });
    expect(um.mock.calls[0][0]!.orderBy).toEqual([
      { birthDate: "desc" },
      { id: "asc" },
    ]);
  });

  it("sorts by enrollment count", async () => {
    await listPeople({ organisationId: "org-1", sort: "events" });
    expect(um.mock.calls[0][0]!.orderBy).toEqual([
      { enrollments: { _count: "desc" } },
      { id: "asc" },
    ]);
  });
});

describe("listPeople — pagination", () => {
  it("computes skip/take and totalPages from total + pageSize", async () => {
    uc.mockResolvedValue(120 as never);
    um.mockResolvedValue([makeRow("u-1")] as never);

    const result = await listPeople({
      organisationId: "org-1",
      page: 2,
      pageSize: 50,
    });

    const args = um.mock.calls[0][0]!;
    expect(args.skip).toBe(50);
    expect(args.take).toBe(50);
    expect(result.total).toBe(120);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
  });

  it("clamps page to a minimum of 1", async () => {
    await listPeople({ organisationId: "org-1", page: 0 });
    expect(um.mock.calls[0][0]!.skip).toBe(0);
  });

  it("maps enrollment count and last event from the include", async () => {
    um.mockResolvedValue([
      makeRow("u-1", {
        _count: { enrollments: 3 },
        enrollments: [
          {
            enrolledAt: new Date("2026-05-01"),
            event: { name: "Atelier découverte" },
          },
        ],
      }),
    ] as never);

    const result = await listPeople({ organisationId: "org-1" });

    expect(result.items[0].enrollmentCount).toBe(3);
    expect(result.items[0].lastEventName).toBe("Atelier découverte");
    expect(result.items[0].lastEnrollmentAt).toEqual(new Date("2026-05-01"));
  });

  it("uses the same where for count and findMany so total matches filters", async () => {
    await listPeople({ organisationId: "org-1", niveauScolaire: "BTS" });

    const countWhere = uc.mock.calls[0][0]!.where;
    const listWhere = um.mock.calls[0][0]!.where;
    expect(countWhere).toEqual(listWhere);
  });
});

describe("countPeople", () => {
  it("counts non-deleted users in the org only", async () => {
    uc.mockResolvedValue(42 as never);
    const n = await countPeople("org-9");
    expect(n).toBe(42);
    expect(uc.mock.calls[0][0]).toEqual({
      where: { organisationId: "org-9", deletedAt: null },
    });
  });
});

describe("listEventsForFilter", () => {
  it("returns org events newest-first with minimal fields", async () => {
    ef.mockResolvedValue([] as never);
    await listEventsForFilter("org-1");

    const args = ef.mock.calls[0][0]!;
    expect(args.where).toEqual({ organisationId: "org-1", deletedAt: null });
    expect(args.orderBy).toEqual({ date: "desc" });
    expect(args.select).toEqual({ id: true, name: true, date: true });
  });
});

describe("getPersonDetail", () => {
  it("scopes to the org and excludes soft-deleted users", async () => {
    uf.mockResolvedValue(null as never);
    await getPersonDetail("u-1", "org-1");

    expect(uf.mock.calls[0][0]!.where).toEqual({
      id: "u-1",
      organisationId: "org-1",
      deletedAt: null,
    });
  });

  it("requests enrollments newest-first with event + feedback hydrated", async () => {
    uf.mockResolvedValue({ id: "u-1", enrollments: [] } as never);
    await getPersonDetail("u-1", "org-1");

    const enr = uf.mock.calls[0][0]!.include!.enrollments as Record<string, unknown>;
    expect(enr.where).toEqual({ deletedAt: null });
    expect(enr.orderBy).toEqual({ enrolledAt: "desc" });
    expect(enr.include).toMatchObject({ event: expect.any(Object), feedback: true });
  });

  it("returns null when the user doesn't exist or is in another org", async () => {
    uf.mockResolvedValue(null as never);
    expect(await getPersonDetail("u-1", "org-1")).toBeNull();
  });
});
