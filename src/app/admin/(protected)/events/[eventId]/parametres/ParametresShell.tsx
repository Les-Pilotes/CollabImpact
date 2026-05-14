"use client";

import { useState, type ReactNode } from "react";

type Tab = {
  key: string;
  label: string;
  count?: number;
};

export default function ParametresShell({
  tabs,
  initialTab,
  panels,
}: {
  tabs: Tab[];
  initialTab?: string;
  panels: Record<string, ReactNode>;
}) {
  const [active, setActive] = useState(initialTab ?? tabs[0]?.key);

  return (
    <div>
      <div className="border-b border-stone-200 mb-10">
        <nav className="flex gap-6" aria-label="Sections">
          {tabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-stone-900"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-stone-900" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div>{panels[active]}</div>
    </div>
  );
}
