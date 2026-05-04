import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Dashboard Admin" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-zinc-900">Visibilité</h1>
      <p className="text-zinc-500">Page Visibilité — à reconstruire en Vague 1</p>
    </div>
  );
}
