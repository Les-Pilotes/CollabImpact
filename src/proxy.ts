import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every admin request.
 *
 * `src/lib/supabase/server.ts` cannot write cookies from a Server Component
 * (Next.js forbids it there) — its `setAll` silently no-ops with a comment
 * saying "le proxy gère le refresh". That proxy never existed, so an admin's
 * session could expire mid-visit without ever being renewed. This file is
 * that proxy (Next 16 renamed `middleware.ts` to `proxy.ts` — same mechanism).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Triggers a token refresh (and the setAll above) if the access token is
  // expired or close to it. Must be called — merely constructing the client
  // does nothing.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
