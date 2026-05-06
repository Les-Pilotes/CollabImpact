"use client";

import { useState, useCallback } from "react";
import { X, Zap, ChevronDown, ChevronUp, RotateCcw, Plus, List, GitBranch, MessageSquare } from "lucide-react";
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
  const [emargState, setEmargState] = useState<Record<string, string>>({});

  const markEmarg = useCallback((id: string, st: string) => {
    setEmargState((prev) => ({ ...prev, [id]: st }));
  }, []);

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
      setArchived((a) => {
        if (a.some((x) => x.id === p.id)) return a; // guard contre double-call StrictMode
        return [
          ...a,
          {
            ...p,
            archivedAs: as,
            history: [...p.history, { id: "archive", label, kind: "warning", ...now() }],
          },
        ];
      });
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
            { id: "workshop", label: "Workshop", emoji: "🌟" },
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
          <ListingTab
            initialParticipants={initialParticipants}
            archived={archived}
            avatarColor={avatarColor}
            initials={initials}
          />
        )}

        {/* ── Workshop tab ── */}
        {activeTab === "workshop" && (
          <WorkshopTab
            participants={participants}
            archived={archived}
            emargState={emargState}
            onMarkEmarg={markEmarg}
            avatarColor={avatarColor}
            initials={initials}
          />
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

// ─── Workshop tab component ───────────────────────────────────────────────────

const INTERVENANTES = [
  { id: "emna",     name: "Emna",     domain: "Informatique", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "fabienne", name: "Fabienne", domain: "Marketing",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "sophie",   name: "Sophie",   domain: "DRH",          color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "imane",    name: "Imane",    domain: "Banque",        color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "sonia",    name: "Sonia",    domain: "Gestion",       color: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  { id: "gaelle",   name: "Gaëlle",   domain: "Assurance",     color: "bg-orange-50 text-orange-700 border-orange-200" },
];

function EmargRow({ p, st, groups, onMarkEmarg, avatarColor, initials }: {
  p: ParticipantRow; st: string;
  groups: Record<string, string>;
  onMarkEmarg: (id: string, st: string) => void;
  avatarColor: (id: string) => string;
  initials: (p: ParticipantRow) => string;
}) {
  const inv = INTERVENANTES.find((i) => i.id === groups[p.id]);
  return (
    <div className={`flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-50 transition-colors ${
      st === "present" ? "bg-green-50/50" : st === "absent" ? "bg-red-50/50" : ""
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(p.id)}`}>
          {initials(p)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">{p.firstName} {p.lastName}</p>
          <p className="text-[10px] text-zinc-400">{inv ? `${inv.name} · ${inv.domain}` : "—"}</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {st === "pending" ? (
          <>
            <button onClick={() => onMarkEmarg(p.id, "present")}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors min-w-[72px] text-center">
              Présente
            </button>
            <button onClick={() => onMarkEmarg(p.id, "absent")}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors min-w-[72px] text-center">
              Absente
            </button>
          </>
        ) : (
          <button onClick={() => onMarkEmarg(p.id, "pending")}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200 transition-colors text-center">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

function WorkshopTab({ participants, emargState, onMarkEmarg, avatarColor, initials }: {
  participants: ParticipantRow[];
  archived: ParticipantRow[];
  emargState: Record<string, string>;
  onMarkEmarg: (id: string, st: string) => void;
  avatarColor: (id: string) => string;
  initials: (p: ParticipantRow) => string;
}) {
  const [mode, setMode] = useState<"groupes" | "emargement">("groupes");
  const [picking, setPicking] = useState<string | null>(null);   // tap-to-assign (mobile)
  const [draggingId, setDraggingId] = useState<string | null>(null); // drag (desktop)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  const eligible = participants.filter((p) =>
    ["confirmee", "attente_j2", "attente_j7"].includes(p.status)
  );

  const [groups, setGroups] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    eligible.forEach((p, i) => {
      initial[p.id] = INTERVENANTES[i % INTERVENANTES.length].id;
    });
    return initial;
  });

  const assignGroup = (participantId: string, intervenanteId: string) => {
    setGroups((prev) => ({ ...prev, [participantId]: intervenanteId }));
  };

  // Mobile: tap-to-select
  const handleParticipantTap = (id: string) => {
    setPicking((prev) => (prev === id ? null : id));
  };
  const handleGroupTap = (intervenanteId: string) => {
    if (!picking) return;
    assignGroup(picking, intervenanteId);
    setPicking(null);
  };

  const pickingParticipant = picking ? eligible.find((p) => p.id === picking) : null;

  const emargList = [...participants.filter((p) =>
    ["confirmee", "attente_j2"].includes(p.status)
  )].sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

  const present = Object.values(emargState).filter((v) => v === "present").length;
  const absent = Object.values(emargState).filter((v) => v === "absent").length;
  const remaining = emargList.filter((p) => !emargState[p.id] || emargState[p.id] === "pending").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" onClick={(e) => {
      if ((e.target as HTMLElement).closest("[data-group],[data-participant]") === null) setPicking(null);
    }}>
      {/* Mode switcher */}
      <div className="px-4 md:px-6 pt-4 pb-3 flex items-center gap-2 shrink-0 border-b border-zinc-100">
        <button
          onClick={() => { setMode("groupes"); setPicking(null); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            mode === "groupes" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }`}
        >
          Groupes
        </button>
        <button
          onClick={() => { setMode("emargement"); setPicking(null); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            mode === "emargement" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          }`}
        >
          Émargement
        </button>
      </div>

      {/* Pick banner */}
      {picking && pickingParticipant && (
        <div className="bg-orange-500 text-white px-4 py-2.5 flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold">
            Assigner {pickingParticipant.firstName} {pickingParticipant.lastName} → choisis un groupe
          </span>
          <button onClick={() => setPicking(null)} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
        </div>
      )}

      {/* Groupes view */}
      {mode === "groupes" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-3 content-start auto-rows-min">
          {INTERVENANTES.map((inv) => {
            const members = [...eligible.filter((p) => groups[p.id] === inv.id)]
              .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
            const isTapTarget = !!picking;
            const isDragTarget = dragOverGroup === inv.id;

            return (
              <div
                key={inv.id}
                data-group
                onClick={() => handleGroupTap(inv.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverGroup(inv.id); }}
                onDragLeave={() => setDragOverGroup(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId) { assignGroup(draggingId, inv.id); setDraggingId(null); }
                  setDragOverGroup(null);
                }}
                className={`bg-white rounded-xl overflow-hidden transition-all ${
                  isDragTarget
                    ? "border-2 border-orange-400 shadow-md scale-[1.01]"
                    : isTapTarget
                    ? "border-2 border-orange-400 cursor-pointer shadow-sm"
                    : "border border-zinc-200"
                }`}
              >
                {/* Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isDragTarget ? "bg-orange-50" : isTapTarget ? "bg-orange-50" : "border-b border-zinc-100"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900">{inv.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${inv.color}`}>
                      {inv.domain}
                    </span>
                    {(isTapTarget || isDragTarget) && (
                      <span className="text-xs text-orange-500 font-medium">← déposer ici</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-zinc-400">{members.length}</span>
                </div>

                {/* Members — hidden during drag hover to keep card clean */}
                {!isDragTarget && (
                  <div className="divide-y divide-zinc-50">
                    {members.length === 0 && (
                      <p className="px-4 py-2.5 text-xs text-zinc-300">Aucune participante</p>
                    )}
                    {members.map((p) => (
                      <div
                        key={p.id}
                        data-participant
                        draggable
                        onDragStart={() => { setDraggingId(p.id); setPicking(null); }}
                        onDragEnd={() => { setDraggingId(null); setDragOverGroup(null); }}
                        onClick={(e) => { e.stopPropagation(); handleParticipantTap(p.id); }}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors select-none ${
                          draggingId === p.id
                            ? "opacity-40 cursor-grabbing"
                            : picking === p.id
                            ? "bg-orange-50 ring-2 ring-inset ring-orange-300 cursor-pointer"
                            : "hover:bg-zinc-50 cursor-grab"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(p.id)}`}>
                          {initials(p)}
                        </div>
                        <span className="text-sm text-zinc-800 flex-1 truncate">{p.firstName} {p.lastName}</span>
                        <span className="text-[10px] text-zinc-300 hidden md:inline">⠿</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Émargement view */}
      {mode === "emargement" && (
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-3 flex items-center gap-6 z-10">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{present}</div>
              <div className="text-[10px] text-zinc-400">présentes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-500">{absent}</div>
              <div className="text-[10px] text-zinc-400">absentes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-zinc-400">{remaining}</div>
              <div className="text-[10px] text-zinc-400">à venir</div>
            </div>
          </div>

          {emargList.length === 0 && (
            <div className="px-6 py-12 text-center text-zinc-400 text-sm">
              Aucune participante confirmée pour le Jour J.
            </div>
          )}

          {/* Section : en attente */}
          {emargList.filter((p) => !emargState[p.id] || emargState[p.id] === "pending").length > 0 && (
            <>
              <div className="px-4 md:px-6 py-2 bg-zinc-50 border-y border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                En attente — {emargList.filter((p) => !emargState[p.id] || emargState[p.id] === "pending").length}
              </div>
              {emargList.filter((p) => !emargState[p.id] || emargState[p.id] === "pending").map((p) => (
                <EmargRow key={p.id} p={p} st="pending" groups={groups} onMarkEmarg={onMarkEmarg} avatarColor={avatarColor} initials={initials} />
              ))}
            </>
          )}

          {/* Section : présentes */}
          {emargList.filter((p) => emargState[p.id] === "present").length > 0 && (
            <>
              <div className="px-4 md:px-6 py-2 bg-green-50 border-y border-green-100 text-[10px] font-bold uppercase tracking-wider text-green-600">
                Présentes — {emargList.filter((p) => emargState[p.id] === "present").length}
              </div>
              {emargList.filter((p) => emargState[p.id] === "present").map((p) => (
                <EmargRow key={p.id} p={p} st="present" groups={groups} onMarkEmarg={onMarkEmarg} avatarColor={avatarColor} initials={initials} />
              ))}
            </>
          )}

          {/* Section : absentes */}
          {emargList.filter((p) => emargState[p.id] === "absent").length > 0 && (
            <>
              <div className="px-4 md:px-6 py-2 bg-red-50 border-y border-red-100 text-[10px] font-bold uppercase tracking-wider text-red-500">
                Absentes — {emargList.filter((p) => emargState[p.id] === "absent").length}
              </div>
              {emargList.filter((p) => emargState[p.id] === "absent").map((p) => (
                <EmargRow key={p.id} p={p} st="absent" groups={groups} onMarkEmarg={onMarkEmarg} avatarColor={avatarColor} initials={initials} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Listing tab component ────────────────────────────────────────────────────

function archivedStage(p: ParticipantRow): string {
  const labels = p.history.map((h) => h.label);
  const hasJ2 = labels.some((l) => l.includes("J-2"));
  const hasJ7 = labels.some((l) => l.includes("J-7"));
  if (p.archivedAs === "absente") return "Jour J";
  if (hasJ2) return "Confirmation J-2";
  if (hasJ7) return "Confirmation J-7";
  return "Avant contact";
}

const STATUS_COLORS: Record<KanbanStatus, string> = {
  attente_j7: "bg-zinc-100 text-zinc-600",
  attente_j2: "bg-blue-50 text-blue-700",
  confirmee: "bg-violet-50 text-violet-700",
};
const STATUS_LABELS_LISTING: Record<KanbanStatus, string> = {
  attente_j7: "Confirmation J-7",
  attente_j2: "Confirmation J-2",
  confirmee: "Attendue Jour J",
};

function ListingRow({ p, i, avatarColor, initials }: { p: ParticipantRow; i: number; avatarColor: (id: string) => string; initials: (p: ParticipantRow) => string }) {
  const last = p.history.at(-1);
  const [labelTitle] = (last?.label ?? "Inscription").split(" · ");
  const enrolledDate = new Date(p.enrolledAt);
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
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
        {"status" in p && (p as ParticipantRow).status ? (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[(p as ParticipantRow).status]}`}>
            {STATUS_LABELS_LISTING[(p as ParticipantRow).status]}
          </span>
        ) : (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            {p.archivedAs === "absente" ? "Absente Jour J" : "Désistée"}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">
        <div>{enrolledDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</div>
        <div className="text-zinc-400">{enrolledDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
      </td>
      <td className="px-4 py-3 text-xs text-zinc-500">{labelTitle}</td>
    </tr>
  );
}

function ListingTab({ initialParticipants, archived, avatarColor, initials }: {
  initialParticipants: ParticipantRow[];
  archived: ParticipantRow[];
  avatarColor: (id: string) => string;
  initials: (p: ParticipantRow) => string;
}) {
  const [archiveOpen, setArchiveOpen] = useState(false);

  const sorted = [...initialParticipants].sort(
    (a, b) => new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime()
  );

  const stageOrder = ["Avant contact", "Confirmation J-7", "Confirmation J-2", "Jour J"];
  const groupedArchived = stageOrder
    .map((stage) => ({
      stage,
      items: archived.filter((p) => archivedStage(p) === stage),
    }))
    .filter((g) => g.items.length > 0);

  const thCls = "text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider";

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Active participants */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className={thCls}>#</th>
              <th className={thCls}>Participante</th>
              <th className={thCls}>Statut</th>
              <th className={thCls}>Inscrite le</th>
              <th className={thCls}>Dernière action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sorted.map((p, i) => (
              <ListingRow key={p.id} p={p} i={i} avatarColor={avatarColor} initials={initials} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Archived accordion */}
      {archived.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setArchiveOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 transition-colors"
          >
            <span className="font-semibold text-zinc-500">
              Archivées · {archived.length}
            </span>
            <span className="text-zinc-400 text-xs">{archiveOpen ? "▲" : "▼"}</span>
          </button>

          {archiveOpen && (
            <div className="border-t border-zinc-100">
              {groupedArchived.map(({ stage, items }) => (
                <div key={stage}>
                  <div className="px-4 py-2 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                    Sortie au stade : {stage} · {items.length}
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-zinc-50">
                      {items.map((p, i) => (
                        <ListingRow key={"arch-" + p.id} p={p} i={i} avatarColor={avatarColor} initials={initials} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
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
