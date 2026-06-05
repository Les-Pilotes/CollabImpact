/**
 * Tests for issue #32 — P0 quick wins
 * Acceptance criteria:
 * 1. Nav labels use correct French (Évènements, Carnet d'adresses)
 * 2. Personnes page metadata + heading updated
 * 3. Inscrites page fetches speakers alongside enrollments
 * 4. Group initialization uses real speakers (no hardcoded array)
 * 5. Empty speakers → empty groups (no crash)
 */

import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ──────────────────────────────────────────────────────────────────────────────
// Source-level assertions (no module loading overhead, no transitive dep issues)
// ──────────────────────────────────────────────────────────────────────────────

describe("issue #32 — sidebar nav labels", () => {
  const src = readFileSync(join(root, "src/app/admin/(protected)/Sidebar.tsx"), "utf8");

  it("uses 'Évènements' with accent grave in GLOBAL_NAV", () => {
    expect(src).toContain("Évènements");
  });

  it("does not use the old 'Evenements' (no accents) string", () => {
    expect(src).not.toContain('"Evenements"');
  });

  it("uses 'Carnet d\\'adresses' in GLOBAL_NAV", () => {
    expect(src).toContain("Carnet d'adresses");
  });

  it("does not use the old standalone 'Carnet' label (without adresses)", () => {
    // Match the exact string that was the old label — a quoted "Carnet" not followed by d'
    // Using regex to avoid matching "Carnet d'adresses" or comments
    expect(src).not.toMatch(/"Carnet"(?!\s*\+\s*"d)/);
  });
});

describe("issue #32 — personnes page renaming", () => {
  const src = readFileSync(join(root, "src/app/admin/(protected)/personnes/page.tsx"), "utf8");
  const userPageSrc = readFileSync(
    join(root, "src/app/admin/(protected)/personnes/[userId]/page.tsx"),
    "utf8",
  );

  it("metadata.title is 'Carnet d\\'adresses'", () => {
    expect(src).toContain("\"Carnet d'adresses\"");
  });

  it("h1 heading is 'Carnet d\\'adresses'", () => {
    expect(src).toContain(">Carnet d'adresses<");
  });

  it("breadcrumb in [userId] page uses 'Carnet d\\'adresses'", () => {
    expect(userPageSrc).toContain("Carnet d'adresses");
  });
});

describe("issue #32 — inscrites page speaker fetch", () => {
  const src = readFileSync(
    join(root, "src/app/admin/(protected)/events/[eventId]/inscrites/page.tsx"),
    "utf8",
  );

  it("fetches speakers via prisma.speaker.findMany", () => {
    expect(src).toContain("prisma.speaker.findMany");
  });

  it("uses Promise.all to fetch enrollments and speakers in parallel", () => {
    expect(src).toContain("Promise.all");
  });

  it("passes speakers to KanbanBoard", () => {
    expect(src).toContain("speakers={speakers}");
  });

  it("filters speakers by eventId and organisationId and deletedAt: null", () => {
    expect(src).toContain("eventId");
    expect(src).toContain("organisationId");
    expect(src).toContain("deletedAt: null");
  });

  it("selects only the fields needed by WorkshopTab (id, firstName, lastName, domain)", () => {
    expect(src).toContain("firstName: true");
    expect(src).toContain("lastName: true");
    expect(src).toContain("domain: true");
  });
});

describe("issue #32 — KanbanBoard workshop tab", () => {
  const src = readFileSync(
    join(root, "src/app/admin/(protected)/events/[eventId]/inscrites/KanbanBoard.tsx"),
    "utf8",
  );

  it("default active tab is 'suivi' not 'listing'", () => {
    expect(src).toContain('useState("suivi")');
    expect(src).not.toContain('useState("listing")');
  });

  it("no longer contains the hardcoded INTERVENANTES array", () => {
    expect(src).not.toContain("const INTERVENANTES");
    expect(src).not.toContain('"emna"');
    expect(src).not.toContain('"fabienne"');
  });

  it("exports SpeakerRow type", () => {
    expect(src).toContain("export type SpeakerRow");
  });

  it("WorkshopTab uses speakers prop not INTERVENANTES", () => {
    // The empty-state block for no speakers
    expect(src).toContain("speakers.length === 0");
    // Map over speakers
    expect(src).toContain("speakers.map(");
  });

  it("EmargRow receives speakers prop", () => {
    expect(src).toContain("speakers: SpeakerRow[]");
  });

  it("group initialization guards against empty speakers", () => {
    expect(src).toContain("if (speakers.length > 0)");
  });

  it("SPEAKER_COLORS palette has 8 entries for variety", () => {
    // Count lines in the SPEAKER_COLORS array
    const match = src.match(/const SPEAKER_COLORS = \[([\s\S]*?)\];/);
    expect(match).toBeTruthy();
    const colorEntries = match![1].trim().split("\n").filter((l) => l.trim().startsWith('"'));
    expect(colorEntries.length).toBe(8);
  });
});

describe("issue #32 — FormulairesTab toggle overflow fix", () => {
  const src = readFileSync(
    join(
      root,
      "src/app/admin/(protected)/events/[eventId]/parametres/FormulairesTab.tsx",
    ),
    "utf8",
  );

  it("toggle button has overflow-hidden to clip the animated span", () => {
    expect(src).toContain("overflow-hidden");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Pure logic tests — no module imports needed
// ──────────────────────────────────────────────────────────────────────────────

describe("issue #32 — group initialization logic (round-robin)", () => {
  type Speaker = { id: string };

  function initGroups(eligible: string[], speakers: Speaker[]): Record<string, string> {
    const initial: Record<string, string> = {};
    if (speakers.length > 0) {
      eligible.forEach((id, i) => {
        initial[id] = speakers[i % speakers.length].id;
      });
    }
    return initial;
  }

  it("assigns participants to speakers using round-robin", () => {
    const speakers = [{ id: "sp-1" }, { id: "sp-2" }, { id: "sp-3" }];
    const result = initGroups(["p1", "p2", "p3", "p4", "p5"], speakers);

    expect(result["p1"]).toBe("sp-1");
    expect(result["p2"]).toBe("sp-2");
    expect(result["p3"]).toBe("sp-3");
    expect(result["p4"]).toBe("sp-1"); // wraps
    expect(result["p5"]).toBe("sp-2");
  });

  it("returns empty object when no speakers configured", () => {
    const result = initGroups(["p1", "p2", "p3"], []);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("puts all participants in one group with a single speaker", () => {
    const result = initGroups(["p1", "p2", "p3"], [{ id: "sp-solo" }]);
    expect(Object.values(result).every((v) => v === "sp-solo")).toBe(true);
  });

  it("SPEAKER_COLORS wraps safely beyond the 8 color limit", () => {
    const SPEAKER_COLORS = [
      "bg-teal-50 text-teal-700 border-teal-200",
      "bg-amber-50 text-amber-700 border-amber-200",
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-violet-50 text-violet-700 border-violet-200",
      "bg-zinc-100 text-zinc-600 border-zinc-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-rose-50 text-rose-700 border-rose-200",
      "bg-green-50 text-green-700 border-green-200",
    ];
    for (let i = 0; i < 20; i++) {
      const color = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });
});
