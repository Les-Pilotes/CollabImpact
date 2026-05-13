import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Shield, Users } from "lucide-react";
import AdminsListClient from "./AdminsListClient";

export const metadata = { title: "Administrateurs" };

export default async function AdminsPage() {
  const { admin } = await requireAdmin();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  const admins = await prisma.admin.findMany({
    where: { organisationId: admin.organisationId },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin/parametres"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux paramètres
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Administrateurs</h1>
            <p className="text-sm text-stone-500 mt-1">
              {admins.length} compte{admins.length !== 1 ? "s" : ""} avec accès au dashboard.
            </p>
          </div>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
          <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Lecture seule</p>
            <p className="text-amber-800 text-xs mt-0.5">
              Seuls les super-administrateurs peuvent ajouter ou retirer des admins. Demande
              à un super-admin de modifier la liste.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-stone-500 leading-relaxed">
        Ajouter un email ici autorise cette personne à se connecter par magic link sur{" "}
        <code className="font-mono text-stone-700">/admin/login</code>. Les{" "}
        <strong className="text-[var(--brand-orange)]">super-admins</strong> peuvent gérer
        les admins ; les <strong>admins</strong> ont accès au dashboard sans droits CRUD sur
        les permissions.
      </p>

      <AdminsListClient
        admins={admins.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
        currentAdminId={admin.id}
        isSuperAdmin={isSuperAdmin}
      />

      {admins.length === 0 && (
        <div className="text-center py-12 border border-dashed border-stone-200 rounded-lg">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Aucun administrateur pour l&apos;instant.</p>
        </div>
      )}
    </div>
  );
}
