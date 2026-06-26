import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf-8");

describe("droit-image global — schema", () => {
  const schema = read("prisma/schema.prisma");

  it("declares droitsImageStatus on User (nullable, no default)", () => {
    // NULL = "never expressed a global opinion" (distinct from per-event default
    // of "pending" on Enrollment).
    expect(schema).toMatch(/model User\s*\{[\s\S]*droitsImageStatus\s+DroitsImageStatus\?[\s\S]*\}/);
  });

  it("declares droitsImageSignedAt and droitsImageSignature on User", () => {
    expect(schema).toMatch(/model User\s*\{[\s\S]*droitsImageSignedAt\s+DateTime\?[\s\S]*\}/);
    expect(schema).toMatch(/model User\s*\{[\s\S]*droitsImageSignature\s+String\?[\s\S]*\}/);
  });

  it("keeps droitsImageStatus on Enrollment (per-event snapshot still required)", () => {
    expect(schema).toMatch(/model Enrollment\s*\{[\s\S]*droitsImageStatus\s+DroitsImageStatus\s+@default\(pending\)/);
  });
});

describe("droit-image global — inscription server actions", () => {
  const actions = read("src/app/inscription/[eventId]/actions.ts");

  it("LookupResult.returning exposes droitsImageGlobalStatus", () => {
    expect(actions).toMatch(/droitsImageGlobalStatus:\s*"accepted"\s*\|\s*"refused"\s*\|\s*null/);
  });

  it("lookupUserByEmail selects droitsImageStatus from User", () => {
    expect(actions).toMatch(/select:\s*\{[^}]*droitsImageStatus:\s*true/);
  });

  it("lookupUserByEmail only returns 'accepted' or 'refused' (filters pending/minor_parental_pending)", () => {
    expect(actions).toMatch(
      /user\.droitsImageStatus === "accepted" \|\| user\.droitsImageStatus === "refused"/,
    );
  });

  it("ReturningProfile includes droitsImageGlobalStatus for the resume flow", () => {
    expect(actions).toMatch(/export type ReturningProfile[\s\S]*droitsImageGlobalStatus:/);
  });

  it("submitInscription reads existing user droit-image BEFORE the upsert", () => {
    // The snapshot logic depends on the prior global value, so we must read it
    // before user.upsert merges create/update.
    expect(actions).toMatch(
      /const existingUser = await prisma\.user\.findUnique\(\{[\s\S]*droitsImageStatus:\s*true[\s\S]*droitsImageSignedAt:\s*true[\s\S]*droitsImageSignature:\s*true/,
    );
  });

  it("submitInscription inherits the snapshot from global when form skipped the step", () => {
    expect(actions).toMatch(
      /existingUser\?\.droitsImageStatus === "accepted"\s*\|\|\s*existingUser\?\.droitsImageStatus === "refused"/,
    );
  });

  it("submitInscription only updates User global for majeures who freshly consented", () => {
    expect(actions).toMatch(/formAskedDroitImage && !isMinor/);
  });

  it("submitInscription does NOT lift minor consent to User global", () => {
    // Minors stay per-event because parental consent isn't transferable (RGPD).
    const lines = actions.split("\n");
    const minorBlock = lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => line.includes("minor_parental_pending"))
      .map(({ i }) => lines.slice(Math.max(0, i - 3), i + 3).join("\n"));
    expect(minorBlock.length).toBeGreaterThan(0);
    // The minor branch sets Enrollment.droitsImageStatus but never writes to User.
    expect(actions).not.toMatch(/isMinor[\s\S]{0,200}userDroitsUpdate\s*=/);
  });
});

describe("droit-image global — inscription form (client)", () => {
  const form = read("src/app/inscription/[eventId]/InscriptionForm.tsx");

  it("tracks globalDroitImage state from lookup or resume", () => {
    expect(form).toMatch(/const \[globalDroitImage, setGlobalDroitImage\]/);
  });

  it("captures the global status from lookupUserByEmail result", () => {
    expect(form).toMatch(/setGlobalDroitImage\(result\.droitsImageGlobalStatus\)/);
  });

  it("captures the global status when consuming a resume token", () => {
    expect(form).toMatch(/setGlobalDroitImage\(profile\.droitsImageGlobalStatus\)/);
  });

  it("computes shouldAskDroitImage = enabled && !(global set && majeure)", () => {
    expect(form).toMatch(
      /shouldAskDroitImage\s*=\s*fc\.droitsImageEnabled && !\(globalDroitImage !== null && !isMinor\)/,
    );
  });

  it("uses shouldAskDroitImage in the step-3 validation gate", () => {
    expect(form).toMatch(/const step3Valid = !shouldAskDroitImage/);
  });

  it("renders the droit-image block conditionally on shouldAskDroitImage", () => {
    // Should NOT have a bare `fc.droitsImageEnabled &&` JSX guard left over.
    expect(form).not.toMatch(/\{fc\.droitsImageEnabled\s*&&\s*\(/);
    expect(form).toMatch(/\{shouldAskDroitImage && \(/);
  });

  it("does not send droitsImageAccepted to the server when the step was skipped", () => {
    expect(form).toMatch(
      /droitsImageAccepted:\s*shouldAskDroitImage\s*\?\s*data\.droitsImageAccepted\s*:\s*undefined/,
    );
  });
});

describe("droit-image global — admin server action", () => {
  const adminActions = read(
    "src/app/admin/(protected)/personnes/[userId]/actions.ts",
  );

  it("is a server action file", () => {
    expect(adminActions).toMatch(/"use server"/);
  });

  it("requires admin auth", () => {
    expect(adminActions).toMatch(/await requireAdmin\(\)/);
  });

  it("guards against cross-organisation writes", () => {
    expect(adminActions).toMatch(
      /findFirst\(\{[\s\S]*organisationId:\s*admin\.organisationId/,
    );
  });

  it("supports accept, refuse, and reset actions", () => {
    expect(adminActions).toMatch(/"accept"\s*\|\s*"refuse"\s*\|\s*"reset"/);
  });

  it("clears all three droit-image fields on reset", () => {
    expect(adminActions).toMatch(
      /action === "reset"[\s\S]*droitsImageStatus:\s*null[\s\S]*droitsImageSignedAt:\s*null[\s\S]*droitsImageSignature:\s*null/,
    );
  });

  it("stamps an admin override marker in the signature for traceability", () => {
    expect(adminActions).toMatch(/\[admin:\$\{admin\.email\}\]/);
  });
});

describe("droit-image global — admin UI", () => {
  const panel = read(
    "src/app/admin/(protected)/personnes/[userId]/DroitsImagePanel.tsx",
  );
  const page = read("src/app/admin/(protected)/personnes/[userId]/page.tsx");

  it("DroitsImagePanel is a client component", () => {
    expect(panel).toMatch(/"use client"/);
  });

  it("DroitsImagePanel renders all three actions when state allows", () => {
    expect(panel).toMatch(/Marquer accepté/);
    expect(panel).toMatch(/Marquer refusé/);
    expect(panel).toMatch(/Réinitialiser/);
  });

  it("DroitsImagePanel confirms each destructive action before firing", () => {
    expect(panel).toMatch(/window\.confirm/);
  });

  it("personnes/[userId]/page renders the DroitsImagePanel", () => {
    expect(page).toMatch(/import DroitsImagePanel from "\.\/DroitsImagePanel"/);
    expect(page).toMatch(/<DroitsImagePanel/);
  });
});

describe("droit-image global — backfill script", () => {
  const script = read("scripts/backfill-droits-image-global.ts");

  it("is dry-run by default and requires --apply to write", () => {
    expect(script).toMatch(/--apply/);
    expect(script).toMatch(/apply = process\.argv\.includes\("--apply"\)/);
  });

  it("targets only users with no global status yet", () => {
    expect(script).toMatch(/droitsImageStatus:\s*null/);
  });

  it("ignores enrollments where the user was a minor at the event", () => {
    expect(script).toMatch(/ageAtEvent < 18/);
    expect(script).toMatch(/SKIP \(mineure/);
  });

  it("takes the most recent enrollment as the canonical decision", () => {
    expect(script).toMatch(/orderBy:\s*\{\s*enrolledAt:\s*"desc"\s*\}/);
  });
});
