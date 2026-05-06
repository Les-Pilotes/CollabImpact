import type { LucideIcon } from "lucide-react";

type Tab = {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
};

type Props = {
  title: string;
  subtitle?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  actions?: React.ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  actions,
}: Props) {
  return (
    <div className="bg-white border-b border-zinc-100 px-6 pt-6 pb-0 shrink-0">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-zinc-900">{title}</h1>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-orange-100 text-orange-600"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {(!tabs || tabs.length === 0) && <div className="pb-4" />}
    </div>
  );
}
