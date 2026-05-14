import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Users, Mail, Shield, ArrowRight } from "lucide-react";

export const metadata = { title: "Paramètres" };

export default async function ParametresHubPage() {
  const { admin } = await requireAdmin();
  const isSuperAdmin = admin.role === "SUPER_ADMIN";

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-900">Paramètres</h1>
        <p className="text-sm text-stone-500">
          Configuration globale de l&apos;espace administrateur. Les paramètres spécifiques
          à un événement sont sur chaque page d&apos;événement.
        </p>
      </header>

      <div className="space-y-3">
        <SettingsCard
          href="/admin/parametres/admins"
          icon={Users}
          title="Administrateurs"
          description="Gérer qui peut accéder à ce dashboard."
          badge={
            isSuperAdmin ? undefined : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400">
                <Shield className="w-3 h-3" /> Lecture seule
              </span>
            )
          }
        />
        <SettingsCard
          href="#"
          icon={Mail}
          title="Modèles d'emails"
          description="Personnaliser le from/reply-to et la signature des emails par événement."
          disabled
          badge={
            <span className="text-[11px] font-medium text-stone-400">
              Disponible dans /événement/Paramètres
            </span>
          }
        />
      </div>
    </div>
  );
}

function SettingsCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  disabled,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border bg-white transition-all ${
        disabled
          ? "border-stone-200 opacity-60 cursor-not-allowed"
          : "border-stone-200 hover:border-orange-300 hover:shadow-sm cursor-pointer group"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          disabled ? "bg-stone-100 text-stone-400" : "bg-orange-50 text-orange-600"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 group-hover:text-orange-700 transition-colors">
          {title}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
        {badge && <div className="mt-1.5">{badge}</div>}
      </div>
      {!disabled && (
        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
      )}
    </div>
  );

  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}
