/**
 * Source-level assertions for the Notifications settings feature.
 *
 * We avoid loading the page module directly because the protected page pulls
 * in Prisma + Supabase + auth, which need a generated client. Instead we
 * read the source files and assert they contain the wiring we expect — this
 * catches the most common regressions (missing tab, missing prop, missing
 * server-side validation) without needing a real DB.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("notifications — schema", () => {
  const src = readFileSync(join(root, "prisma/schema.prisma"), "utf8");

  it("Admin model has lastLoginAt to distinguish validated admins", () => {
    expect(src).toMatch(/lastLoginAt\s+DateTime\?/);
  });

  it("Event model has notificationConfig JSON column", () => {
    expect(src).toMatch(/notificationConfig\s+Json\?/);
  });
});

describe("notifications — requireAdmin touches lastLoginAt", () => {
  const src = readFileSync(join(root, "src/lib/auth.ts"), "utf8");

  it("updates lastLoginAt on successful admin lookup", () => {
    expect(src).toContain("lastLoginAt");
    // Accept either inline or chained call style (prisma.admin.update(...))
    expect(src).toMatch(/prisma\.admin\s*\.?\s*\n?\s*\.update\(/);
  });

  it("throttles writes so we don't hit the DB on every page render", () => {
    expect(src).toContain("LOGIN_TOUCH_THROTTLE_MS");
  });

  it("fires the update without awaiting (must not block auth)", () => {
    // The .catch(...) chain after prisma.admin.update is the tell — we
    // don't await, so a slow/failing DB write cannot stall the request.
    expect(src).toMatch(/prisma\.admin\s*\.?\s*\n?\s*\.update\([\s\S]*?\)\s*\.catch\(/);
  });
});

describe("notifications — parametres tab wiring", () => {
  const pageSrc = readFileSync(
    join(root, "src/app/admin/(protected)/events/[eventId]/parametres/page.tsx"),
    "utf8",
  );

  it("page registers the Notifications tab", () => {
    expect(pageSrc).toContain('key: "notifications"');
    expect(pageSrc).toContain('label: "Notifications"');
  });

  it("page selects notificationConfig from the Event row", () => {
    expect(pageSrc).toContain("notificationConfig: true");
  });

  it("page fetches admins of the org with lastLoginAt to flag validation", () => {
    expect(pageSrc).toContain("prisma.admin.findMany");
    expect(pageSrc).toContain("lastLoginAt: true");
  });

  it("page passes parsed notification config + admin list to NotificationsTab", () => {
    expect(pageSrc).toContain("parseNotificationConfig");
    expect(pageSrc).toContain("<NotificationsTab");
    expect(pageSrc).toContain("admins={adminOptions}");
  });
});

describe("notifications — NotificationsTab UI", () => {
  const src = readFileSync(
    join(
      root,
      "src/app/admin/(protected)/events/[eventId]/parametres/NotificationsTab.tsx",
    ),
    "utf8",
  );

  it("is a client component", () => {
    expect(src.trim().startsWith('"use client"')).toBe(true);
  });

  it("splits admins into validated vs pending sections", () => {
    expect(src).toContain("validatedAdmins");
    expect(src).toContain("pendingAdmins");
  });

  it("shows an empty state when no validated admins exist", () => {
    expect(src).toContain("Aucun membre validé");
  });

  it("labels pending admins as 'En attente'", () => {
    expect(src).toContain("En attente");
  });

  it("disables recipient checkboxes when the master toggle is off", () => {
    expect(src).toContain("!cfg.newEnrollmentEnabled");
    expect(src).toContain('opacity-50');
  });

  it("saves through upsertNotificationConfig server action", () => {
    expect(src).toContain("upsertNotificationConfig");
  });
});

describe("notifications — server action sanitizes recipients", () => {
  const src = readFileSync(
    join(root, "src/app/admin/(protected)/events/[eventId]/parametres/actions.ts"),
    "utf8",
  );

  it("exports upsertNotificationConfig", () => {
    expect(src).toContain("export async function upsertNotificationConfig");
  });

  it("guards against cross-tenant writes via organisationId check", () => {
    expect(src).toMatch(/organisationId:\s*admin\.organisationId/);
  });

  it("filters recipients down to admins that have validated their access", () => {
    expect(src).toContain("lastLoginAt: { not: null }");
  });

  it("intersects the validated set with the requested ids", () => {
    expect(src).toContain("allowedIds");
    expect(src).toContain("filter((id)");
  });
});

describe("notifications — dispatch on new enrollment", () => {
  const dispatchSrc = readFileSync(
    join(root, "src/lib/notifications/admin-alerts.ts"),
    "utf8",
  );
  const actionsSrc = readFileSync(
    join(root, "src/app/inscription/[eventId]/actions.ts"),
    "utf8",
  );

  it("dispatch is called from submitInscription only on new enrollments", () => {
    expect(actionsSrc).toContain("dispatchEnrollmentAlerts");
    // It lives inside the `if (isNewEnrollment)` branch — assert order
    const ifIdx = actionsSrc.indexOf("if (isNewEnrollment)");
    const dispatchIdx = actionsSrc.indexOf("dispatchEnrollmentAlerts(");
    expect(ifIdx).toBeGreaterThan(0);
    expect(dispatchIdx).toBeGreaterThan(ifIdx);
  });

  it("dispatch is fire-and-forget (void ...) so it never blocks inscription", () => {
    expect(actionsSrc).toMatch(/void\s+dispatchEnrollmentAlerts\(/);
  });

  it("dispatch short-circuits when the alert is disabled", () => {
    expect(dispatchSrc).toContain("cfg.newEnrollmentEnabled");
    expect(dispatchSrc).toMatch(/if\s*\(!cfg\.newEnrollmentEnabled\)\s+return/);
  });

  it("dispatch only resolves admins that have logged in at least once", () => {
    expect(dispatchSrc).toContain("lastLoginAt: { not: null }");
  });

  it("dispatch never throws (try/catch swallows errors)", () => {
    expect(dispatchSrc).toContain("try {");
    expect(dispatchSrc).toContain("[admin-alerts] dispatch failed");
  });

  it("dispatch scopes the lookup to the calling organisation", () => {
    expect(dispatchSrc).toContain("organisationId: input.organisationId");
  });
});

describe("notifications — admin alert email template", () => {
  const src = readFileSync(
    join(root, "src/lib/email/templates/AdminEnrollmentAlert.tsx"),
    "utf8",
  );

  it("includes the participant identity and event name in the email body", () => {
    expect(src).toContain("participantFirstName");
    expect(src).toContain("eventName");
  });

  it("links to the participant detail page", () => {
    expect(src).toContain("participantUrl");
    expect(src).toContain("Voir la fiche participante");
  });

  it("shows the unsubscribe hint pointing to Paramètres → Notifications", () => {
    expect(src).toContain("Paramètres → Notifications");
  });
});
