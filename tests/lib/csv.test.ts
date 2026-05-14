import { describe, it, expect } from "vitest";
import { buildCsv, escapeCell, slugify, todayStamp } from "@/lib/csv";

describe("escapeCell", () => {
  it("returns empty string for null/undefined", () => {
    expect(escapeCell(null)).toBe("");
    expect(escapeCell(undefined)).toBe("");
  });

  it("returns simple values unquoted", () => {
    expect(escapeCell("Léa")).toBe("Léa");
    expect(escapeCell(42)).toBe("42");
  });

  it("quotes when value contains a comma", () => {
    expect(escapeCell("Paris, France")).toBe('"Paris, France"');
  });

  it("quotes and doubles inner double-quotes", () => {
    expect(escapeCell('She said "hi"')).toBe('"She said ""hi"""');
  });

  it("quotes when value contains a newline", () => {
    expect(escapeCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes CSV-injection formulas with a leading quote", () => {
    expect(escapeCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(escapeCell("+CMD")).toBe("'+CMD");
    expect(escapeCell("-CMD")).toBe("'-CMD");
    expect(escapeCell("@ref")).toBe("'@ref");
  });
});

describe("buildCsv", () => {
  it("includes UTF-8 BOM + CRLF line endings", () => {
    const csv = buildCsv(["a", "b"], [["1", "2"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(csv).toContain("\r\n");
  });

  it("escapes headers AND cells", () => {
    const csv = buildCsv(["col,1", "col2"], [["v,1", "v2"]]);
    expect(csv).toContain('"col,1",col2');
    expect(csv).toContain('"v,1",v2');
  });
});

describe("slugify", () => {
  it("strips accents and lowercases", () => {
    expect(slugify("Workshop 100% Féminin — Édition 7")).toBe(
      "workshop-100-feminin-edition-7",
    );
  });

  it("falls back to 'export' for empty result", () => {
    expect(slugify("___")).toBe("export");
  });

  it("caps length at 60", () => {
    const s = slugify("a".repeat(200));
    expect(s.length).toBeLessThanOrEqual(60);
  });
});

describe("todayStamp", () => {
  it("formats date as YYYYMMDD", () => {
    expect(todayStamp(new Date(2026, 4, 13))).toBe("20260513");
  });
});
