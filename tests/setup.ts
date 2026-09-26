import { vi } from "vitest";

// next/cache calls are no-ops in unit tests — server actions that revalidate
// otherwise crash with "Invariant: next/cache must be used in a Server Component".
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

// next/server's after() needs a real Next.js request-scoped AsyncLocalStorage
// context to schedule work — calling it outside one (as in these unit tests)
// throws "after() was called outside a request scope". Run the callback
// synchronously instead so server actions using after() stay testable.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (fn: () => unknown) => {
      fn();
    },
  };
});
