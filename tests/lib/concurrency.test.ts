import { describe, it, expect } from "vitest";
import { parallelLimit } from "@/lib/concurrency";

describe("parallelLimit", () => {
  it("returns results in input order", async () => {
    const results = await parallelLimit([10, 20, 30, 40], 2, async (n) => n * 2);
    expect(results).toEqual([
      { status: "fulfilled", value: 20 },
      { status: "fulfilled", value: 40 },
      { status: "fulfilled", value: 60 },
      { status: "fulfilled", value: 80 },
    ]);
  });

  it("never exceeds the concurrency limit", async () => {
    let inflight = 0;
    let peak = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);

    await parallelLimit(items, 4, async () => {
      inflight++;
      peak = Math.max(peak, inflight);
      await new Promise((r) => setTimeout(r, 5));
      inflight--;
    });

    expect(peak).toBeLessThanOrEqual(4);
    expect(peak).toBeGreaterThan(1); // proves we're actually parallelizing
  });

  it("captures rejections without aborting the batch", async () => {
    const results = await parallelLimit([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error("boom");
      return n;
    });

    expect(results[0]).toEqual({ status: "fulfilled", value: 1 });
    expect(results[1].status).toBe("rejected");
    if (results[1].status === "rejected") {
      expect((results[1].reason as Error).message).toBe("boom");
    }
    expect(results[2]).toEqual({ status: "fulfilled", value: 3 });
  });

  it("handles an empty input array", async () => {
    const results = await parallelLimit([], 4, async (n: number) => n);
    expect(results).toEqual([]);
  });

  it("uses at most `items.length` workers when concurrency is higher", async () => {
    let inflight = 0;
    let peak = 0;
    await parallelLimit([1, 2], 16, async () => {
      inflight++;
      peak = Math.max(peak, inflight);
      await new Promise((r) => setTimeout(r, 2));
      inflight--;
    });
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("passes the index to the callback", async () => {
    const indices: number[] = [];
    await parallelLimit(["a", "b", "c"], 1, async (_item, i) => {
      indices.push(i);
    });
    expect(indices).toEqual([0, 1, 2]);
  });
});
