import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  listPeople,
  countPeople,
  getPersonDetail,
} from "@/lib/people/queries";

const um = vi.mocked(prisma.user.findMany);
const uf = vi.mocked(prisma.user.findFirst);
const uc = vi.mocked(prisma.user.count);

beforeEach(() => vi.clearAllMocks());

function makeRow(id: string, extra: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    firstName: "Léa",
    lastName: "Bernard",
    email: `${id}@example.test`,
    phone: null,
    city: "Paris",
    _count: { enrollments: 0 },
    enrollments: [],
    ...extra,
  };
}

describe("listPeople", () => {
  it("scopes the where clause to the organisation and filters soft-deleted", async () => {
    um.mockResolvedValue([] as never);

    await listPeople({ organisationId: "org-1" });

    const args = um.mock.calls[0][0]!;
    expect(args.where).toMatchObject({
      organisationId: "org-1",
      deletedAt: null,
    });
    expect(args.where!.OR).toBeUndefined();
  });

  it("builds an OR clause for search (name, email, phone)", async () => {
    um.mockResolvedValue([] as never);

    await listPeople({ organisationId: "org-1", search: "Léa" });

    const args = um.mock.calls[0][0]!;
    const or = args.where!.OR as Array<Record<string, unknown>>;
    expect(or).toHaveLength(4);
    expect(or[0]).toEqual({ firstName: { contains: "Léa", mode: "insensitive" } });
    expect(or[3]).toEqual({ phone: { contains: "Léa" } });
  });

  it("ignores blank search strings", async () => {
    um.mockResolvedValue([] as never);

    await listPeople({ organisationId: "org-1", search: "   " });

    expect(um.mock.calls[0][0]!.where!.OR).toBeUndefined();
  });

  it("returns a nextCursor when more rows exist than the limit", async () => {
    const rows = Array.from({ length: 4 }, (_, i) => makeRow(`u-${i}`));
    um.mockResolvedValue(rows as never);

    const result = await listPeople({
      organisationId: "org-1",
      limit: 3,
    });

    expect(result.items).toHaveLength(3);
    expect(result.nextCursor).toBe("u-2");
  });

  it("returns null cursor when the page is the last one", async () => {
    const rows = [makeRow("u-1"), makeRow("u-2")];
    um.mockResolvedValue(rows as never);

    const result = await listPeople({ organisationId: "org-1", limit: 50 });

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toBeNull();
  });

  it("maps enrollment count and last event from the include", async () => {
    const rows = [
      makeRow("u-1", {
        _count: { enrollments: 3 },
        enrollments: [
          {
            enrolledAt: new Date("2026-05-01"),
            event: { name: "Atelier découverte" },
          },
        ],
      }),
    ];
    um.mockResolvedValue(rows as never);

    const result = await listPeople({ organisationId: "org-1" });

    expect(result.items[0].enrollmentCount).toBe(3);
    expect(result.items[0].lastEventName).toBe("Atelier découverte");
    expect(result.items[0].lastEnrollmentAt).toEqual(new Date("2026-05-01"));
  });

  it("skips the cursor row when paginating", async () => {
    um.mockResolvedValue([] as never);

    await listPeople({
      organisationId: "org-1",
      cursor: "u-cursor-id",
    });

    const args = um.mock.calls[0][0]!;
    expect(args.cursor).toEqual({ id: "u-cursor-id" });
    expect(args.skip).toBe(1);
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

describe("getPersonDetail", () => {
  it("scopes to the org and excludes soft-deleted users", async () => {
    uf.mockResolvedValue(null as never);

    await getPersonDetail("u-1", "org-1");

    const args = uf.mock.calls[0][0]!;
    expect(args.where).toEqual({
      id: "u-1",
      organisationId: "org-1",
      deletedAt: null,
    });
  });

  it("requests enrollments newest-first with event + feedback hydrated", async () => {
    uf.mockResolvedValue({ id: "u-1", enrollments: [] } as never);

    await getPersonDetail("u-1", "org-1");

    const args = uf.mock.calls[0][0]!;
    const enr = args.include!.enrollments as Record<string, unknown>;
    expect(enr.where).toEqual({ deletedAt: null });
    expect(enr.orderBy).toEqual({ enrolledAt: "desc" });
    expect(enr.include).toMatchObject({ event: expect.any(Object), feedback: true });
  });

  it("returns null when the user doesn't exist or is in another org", async () => {
    uf.mockResolvedValue(null as never);
    const result = await getPersonDetail("u-1", "org-1");
    expect(result).toBeNull();
  });
});
