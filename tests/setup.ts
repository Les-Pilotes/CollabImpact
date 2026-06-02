import { vi } from "vitest";

// next/cache calls are no-ops in unit tests — server actions that revalidate
// otherwise crash with "Invariant: next/cache must be used in a Server Component".
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
