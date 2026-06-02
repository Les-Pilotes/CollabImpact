import { redirect } from "next/navigation";

// The app is admin-only; there's no public landing. Per-event public
// inscription lives at /inscription/[eventId] and is reached via shared
// links, not the root.
export default function RootPage() {
  redirect("/admin");
}
