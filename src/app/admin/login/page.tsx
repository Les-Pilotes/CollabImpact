import { redirect } from "next/navigation";

// Admin login is now unified with the main auth flow.
// Redirect to /auth/login with next=/admin so the callback routes them correctly.
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const params = new URLSearchParams({ next: "/admin" });
  if (reason) params.set("reason", reason);
  redirect(`/auth/login?${params.toString()}`);
}
