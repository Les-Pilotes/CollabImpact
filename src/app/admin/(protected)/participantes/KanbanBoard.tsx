"use client";

import { useState, useCallback } from "react";
import { X, Zap, ChevronDown, ChevronUp, RotateCcw, Plus, List, GitBranch, Users, MessageSquare } from "lucide-react";
import PageHeader from "../PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KanbanStatus = "attente_j7" | "attente_j2" | "confirmee";

export type HistoryItem = {
  id: string;
  label: string;
  kind: "info" | "success" | "warning" | "email";
  ts: number;
  relTime: string;
};

export type ParticipantRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  source: string;
  enrolledAt: string;
  status: KanbanStatus;
  j7EmailSent?: boolean;
  j2EmailSent?: boolean;
  history: HistoryItem[];
  isDemo?: boolean;
  archivedAs?: "desistee" | "presente" | "absente";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: "attente_j7", label: "Confirmation J-7", color: "bg-zinc-100 text-zinc-600" },
  { id: "attente_j2", label: "Confirmation J-2", color: "bg-blue-50 text-blue-700" },
  { id: "confirmee", label: "Attendues le Jour J", color: "bg-violet-50 text-violet-700" },
];

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: "bg-green-50 text-green-700",
  instagram: "bg-pink-50 text-pink-700",
  bouche_a_oreille: "bg-amber-50 text-amber-700",
  referent: "bg-purple-50 text-purple-700",
  classe: "bg-sky-50 text-sky-700",
  inconnu: "bg-zinc-100 text-zinc-500",
};

const DEMO_FIRSTNAMES = ["Amira", "Sofia", "Nadia", "Fatou", "Yasmine", "Sarah", "Inès", "Camille", "Maya", "Lena", "Kenza", "Aissatou"];
const DEMO_LASTNAMES = ["Martin", "Diallo", "Benali", "Rousseau", "Cissé", "Bernard", "Atmane", "Hadj", "Laurent", "Ndiaye", "Tounkara", "Bah"];
const DEMO_SOURCES = ["whatsapp", "instagram", "bouche_a_oreille", "referent"];

let demoCounter = 0;
function generateDemoParticipant(): ParticipantRow {
  demoCounter++;
  const fn = DEMO_FIRSTNAMES[demoCounter % DEMO_FIRSTNAMES.length];
  const ln = DEMO_LASTNAMES[(demoCounter * 3) % DEMO_LASTNAMES.length];
  const src = DEMO_SOURCES[demoCounter % DEMO_SOURCES.length];
  const now = Date.now();
  return {
    id: `demo-${demoCounter}-${now}`,
    firstName: fn,
    lastName: ln,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
    phone: "06 XX XX XX XX",
    city: "Paris",
    source: src,
    enrolledAt: new Date().toISOString(),
    status: "attente_j7",
    j7EmailSent: false,
    j2EmailSent: false,
    history: [
      {
        id: "enroll",
        label: "Inscription · Email de confirmation envoyé",
        kind: "email",
        ts: now,
        relTime: "à l'instant",
      },
    ],
    isDemo: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() {
  return { ts: Date.now(), relTime: "à l'instant" };
}

function sourceLabel(src: string) {
  const map: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    bouche_a_oreille: "Bouche à oreille",
    referent: "Référent·e",
    classe: "Classe",
    inconnu: "—",
  };
  return map[src] ?? src;
}

function historyDot(kind: HistoryItem["kind"]) {
  if (kind === "success") return "bg-green-500";
  if (kind === "email") return "bg-blue-400";
  if (kind === "warning") return "bg-amber-400";
  return "bg-zinc-300";
}

function lastAction(p: ParticipantRow) {
  if (!p.history.length) return null;
  return p.history[p.history.length - 1].label;
}

function initials(p: ParticipantRow) {
  return `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
];

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KanbanBoard({ initialParticipants }: { initialParticipants: ParticipantRow[] }) {
  const [participants, setParticipants] = useState<ParticipantRow[]>(initialParticipants);
  const [archived, setArchived] = useState<ParticipantRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simOpen, setSimOpen] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("listing");

  const selected = participants.find((p) => p.id === selectedId) ?? null;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const update = useCallback((id: string, patch: Partial<ParticipantRow>, extraHistory?: Omit<HistoryItem, "ts" | "relTime">) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const history = extraHistory
          ? [...p.history, { ...extraHistory, ...now() }]
          : p.history;
        return { ...p, ...patch, history };
      })
    );
  }, []);

  const archive = useCallback((id: string, as: ParticipantRow["archivedAs"], label: string) => {
    setParticipants((prev) => {
      const p = prev.find((x) => x.id === id);
      if (!p) return prev;
      setArchived((a) => [
        ...a,
        {
          ...p,
          archivedAs: as,
          history: [...p.history, { id: "archive", label, kind: "warning", ...now() }],
        },
      ]);
      return prev.filter((x) => x.id !== id);
    });
    setSelectedId(null);
  }, []);

  // Simulation actions
  const sim = {
    sendJ7: (id: string) => {
      update(id, { j7EmailSent: true }, { id: "j7send", label: "Confirmation J-7 · Email envoyé", kind: "email" });
      showToast("Email J-7 envoyé");
    },
    confirmJ7: (id: string) => {
      update(id, { status: "attente_j2" }, { id: "conf_j7", label: "Confirmation J-7 · Présence confirmée", kind: "success" });
      showToast("Confirmation J-7 reçue — carte déplacée");
    },
    sendJ2: (id: string) => {
      update(id, { j2EmailSent: true }, { id: "j2send", label: "Confirmation J-2 · Email envoyé", kind: "email" });
      showToast("Email J-2 envoyé");
    },
    confirmJ2: (id: string) => {
      update(id, { status: "confirmee" }, { id: "conf_j2", label: "Confirmation J-2 · Présence confirmée", kind: "success" });
      showToast("Confirmation J-2 reçue — carte déplacée");
    },
    desist: (id: string) => {
      archive(id, "desistee", "Désistement · Participante archivée");
      showToast("Participante archivée — désistement");
    },
    presente: (id: string) => {
      archive(id, "presente", "Jour J · Présente ✓");
      showToast("Marquée présente — archivée");
    },
    absente: (id: string) => {
      archive(id, "absente", "Jour J · Absente");
      showToast("Marquée absente — archivée");
    },
  };

  const addDemo = () => {
    const p = generateDemoParticipant();
    setParticipants((prev) => [p, ...prev]);
    setSelectedId(p.id);
    showToast(`${p.firstName} ${p.lastName} inscrite (simulation)`);
  };

  const reset = () => {
    setParticipants(initialParticipants);
    setArchived([]);
    setSelectedId(null);
    demoCounter = 0;
    showToast("Données réinitialisées");
  };

  const cols = COLUMNS.map((col) => ({
    ...col,
    items: [...participants.filter((p) => p.status === col.id)].sort((a, b) => {
      const tsA = a.history.at(-1)?.ts ?? 0;
      const tsB = b.history.at(-1)?.ts ?? 0;
      return tsB - tsA;
    }),
  }));

  return (
    <div className="flex h-full overflow-hidden relative -m-4 md:-m-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg pointer-events-none">
          {toast}
        </div>
      )}

      {/* ── Kanban area ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <PageHeader
          title="Participantes"
          subtitle={`${participants.length} en cours · ${archived.length} archivées`}
          tabs={[
            { id: "listing", label: "Listing", icon: List, count: initialParticipants.length },
            { id: "suivi", label: "Suivi", icon: GitBranch, count: participants.length },
            { id: "workshop", label: "Workshop", icon: Users },
            { id: "postevent", label: "Post-Event", icon: MessageSquare },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => { setActiveTab(id); setSelectedId(null); }}
          actions={
            <>
              <button
                onClick={addDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold hover:bg-orange-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Simuler inscription
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-semibold hover:bg-zinc-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            </>
          }
        />

        {/* ── Listing tab ── */}
        {activeTab === "listing" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Participante</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Inscrite le</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Dernière action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {[...initialParticipants]
                    .sort((a, b) => new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime())
                    .map((p, i) => {
                      const last = p.history.at(-1);
                      const [labelTitle] = (last?.label ?? "Inscription").split(" · ");
                      const statusColors: Record<KanbanStatus, string> = {
                        attente_j7: "bg-zinc-100 text-zinc-600",
                        attente_j2: "bg-blue-50 text-blue-700",
                        confirmee: "bg-violet-50 text-violet-700",
                      };
                      const statusLabels: Record<KanbanStatus, string> = {
                        attente_j7: "Confirmation J-7",
                        attente_j2: "Confirmation J-2",
                        confirmee: "Attendue Jour J",
                      };
                      return (
                        <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3 text-xs text-zinc-400">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(p.id)}`}>
                                {initials(p)}
                              </div>
                              <span className="font-medium text-zinc-900">{p.firstName} {p.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>
                              {statusLabels[p.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {new Date(p.enrolledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">{labelTitle}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Workshop tab ── */}
        {activeTab === "workshop" && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-sm font-semibold text-zinc-700">Groupes · Intervenantes · Émargement</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Formation des groupes et émargement Jour J. Préparable en amont, finalisé le jour de l'événement.
              </p>
            </div>
          </div>
        )}

        {/* ── Post-Event tab ── */}
        {activeTab === "postevent" && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-sm font-semibold text-zinc-700">Post-Event · Feedbacks</p>
              <p className="text-xs text-zinc-400 mt-1">
                Disponible après le Jour J — les feedbacks apparaîtront ici une fois l'émargement terminé.
              </p>
            </div>
          </div>
        )}

        {/* ── Suivi tab (Kanban) ── */}
        {activeTab === "suivi" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 h-full p-6 min-w-max md:min-w-0">
            {cols.map((col) => (
              <div key={col.id} className="flex flex-col w-72 md:flex-1 min-w-[260px]">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-zinc-700">{col.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                    {col.items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {col.items.length === 0 && (
                    <div className="text-center py-8 text-zinc-300 text-xs">
                      Aucune participante ici
                    </div>
                  )}
                  {col.items.map((p) => {
                    const last = p.history.at(-1);
                    const [labelTitle, labelDesc] = (last?.label ?? "Inscription").split(" · ");
                    const lastTime = last ? new Date(last.ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
                    const lastDate = last ? new Date(last.ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                        className={`w-full text-left bg-white border rounded-xl p-3 transition-all hover:shadow-sm ${
                          p.id === selectedId
                            ? "border-orange-300 shadow-sm ring-1 ring-orange-200"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${avatarColor(p.id)}`}>
                            {initials(p)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-sm font-semibold text-zinc-900 truncate">
                                {p.firstName} {p.lastName}
                                {p.isDemo && <span className="ml-1.5 text-[10px] font-normal text-orange-400">démo</span>}
                              </p>
                              <span className="text-[10px] text-zinc-300 shrink-0">{lastDate} {lastTime}</span>
                            </div>
                            <p className="text-[11px] font-medium text-zinc-500 truncate mt-0.5">{labelTitle}</p>
                            {labelDesc && <p className="text-[10px] text-zinc-400 truncate">{labelDesc}</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* ── Side panel — desktop: pushes kanban, mobile: overlay ── */}
      {selected && (
        <>
          {/* Mobile backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-30"
            onClick={() => setSelectedId(null)}
          />
          {/* Panel */}
          <div className="fixed md:relative inset-y-0 right-0 w-80 md:w-80 bg-white border-l border-zinc-200 z-40 md:z-auto flex flex-col overflow-y-auto shadow-xl md:shadow-none">
            {/* Panel header */}
            <div className="flex items-start justify-between p-4 border-b border-zinc-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(selected.id)}`}>
                    {initials(selected)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {selected.firstName} {selected.lastName}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_COLORS[selected.source] ?? SOURCE_COLORS.inconnu}`}>
                      {sourceLabel(selected.source)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 border-b border-zinc-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 cursor-pointer" onClick={() => setInfoOpen(v => !v)}>Informations {infoOpen ? '▲' : '▼'}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email</span>
                  <span className="text-zinc-800 truncate max-w-[160px]">{selected.email}</span>
                </div>
                {selected.phone && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Téléphone</span>
                    <span className="text-zinc-800">{selected.phone}</span>
                  </div>
                )}
                {selected.city && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ville</span>
                    <span className="text-zinc-800">{selected.city}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Inscrite le</span>
                  <span className="text-zinc-800">
                    {new Date(selected.enrolledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 border-b border-zinc-100 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Historique</p>
              <div className="space-y-0">
                {[...selected.history].reverse().map((h, i) => (
                  <div key={h.id} className={`flex gap-2.5 ${i < selected.history.length - 1 ? "pb-3" : ""}`}>
                    <div className="flex flex-col items-center gap-0 shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${historyDot(h.kind)}`} />
                      {i < selected.history.length - 1 && <div className="w-px flex-1 bg-zinc-100 mt-1" style={{ minHeight: 16 }} />}
                    </div>
                    <div className="min-w-0 pb-0.5">
                      {(() => {
                        const [title, desc] = h.label.split(" · ");
                        return (
                          <>
                            <p className="text-xs font-semibold text-zinc-800 leading-snug">{title}</p>
                            {desc && <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>}
                            <p className="text-[10px] text-zinc-300 mt-0.5">{h.relTime}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation section */}
            <div className="p-4 border-t border-zinc-100 shrink-0">
              <button
                onClick={() => setSimOpen((v) => !v)}
                className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-2"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Mode simulation
                </span>
                {simOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {simOpen && (
                <div className="space-y-1.5">
                  {selected.status === "attente_j7" && (
                    <>
                      {!selected.j7EmailSent && (
                        <SimBtn onClick={() => sim.sendJ7(selected.id)}>
                          ✉️ Simuler envoi email J-7
                        </SimBtn>
                      )}
                      {selected.j7EmailSent && (
                        <SimBtn onClick={() => sim.confirmJ7(selected.id)} highlight>
                          ✅ Simuler confirmation J-7
                        </SimBtn>
                      )}
                      <SimBtn onClick={() => sim.desist(selected.id)} danger>
                        ❌ Simuler désistement
                      </SimBtn>
                    </>
                  )}

                  {selected.status === "attente_j2" && (
                    <>
                      {!selected.j2EmailSent && (
                        <SimBtn onClick={() => sim.sendJ2(selected.id)}>
                          ✉️ Simuler envoi email J-2
                        </SimBtn>
                      )}
                      {selected.j2EmailSent && (
                        <SimBtn onClick={() => sim.confirmJ2(selected.id)} highlight>
                          ✅ Simuler confirmation J-2
                        </SimBtn>
                      )}
                      <SimBtn onClick={() => sim.desist(selected.id)} danger>
                        ❌ Simuler désistement
                      </SimBtn>
                    </>
                  )}

                  {selected.status === "confirmee" && (
                    <>
                      <SimBtn onClick={() => sim.presente(selected.id)} highlight>
                        ✅ Simuler présente Jour J
                      </SimBtn>
                      <SimBtn onClick={() => sim.absente(selected.id)} danger>
                        ❌ Simuler absente Jour J
                      </SimBtn>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Small sub-component ──────────────────────────────────────────────────────

function SimBtn({
  onClick,
  children,
  highlight,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        danger
          ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100"
          : highlight
          ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100"
          : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
