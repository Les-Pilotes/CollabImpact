/**
 * Run `fn` over `items` with a bounded concurrency. Returns settled results
 * in input order (no exception thrown — each slot is either fulfilled or
 * rejected so callers can decide what to do).
 *
 * Use case : Resend tolerates a few concurrent calls per second but not
 * Promise.all over 100 items at once. concurrency=8 keeps under the
 * provider's rate limit while staying ~10× faster than sequential await.
 */
export async function parallelLimit<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<Array<PromiseSettledResult<R>>> {
  const results: Array<PromiseSettledResult<R>> = new Array(items.length);
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        const value = await fn(items[i], i);
        results[i] = { status: "fulfilled", value };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let k = 0; k < limit; k++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
