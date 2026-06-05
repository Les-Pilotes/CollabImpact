import { describe, it, expect } from "vitest";
import {
  DEFAULT_NOTIFICATION_CONFIG,
  parseNotificationConfig,
} from "@/lib/notifications/config";

describe("parseNotificationConfig", () => {
  it("returns defaults for null", () => {
    expect(parseNotificationConfig(null)).toEqual(DEFAULT_NOTIFICATION_CONFIG);
  });

  it("returns defaults for undefined", () => {
    expect(parseNotificationConfig(undefined)).toEqual(DEFAULT_NOTIFICATION_CONFIG);
  });

  it("returns defaults for non-object values", () => {
    expect(parseNotificationConfig("foo" as never)).toEqual(DEFAULT_NOTIFICATION_CONFIG);
    expect(parseNotificationConfig(42 as never)).toEqual(DEFAULT_NOTIFICATION_CONFIG);
    expect(parseNotificationConfig(true as never)).toEqual(DEFAULT_NOTIFICATION_CONFIG);
    expect(parseNotificationConfig([] as never)).toEqual(DEFAULT_NOTIFICATION_CONFIG);
  });

  it("parses a fully-populated config", () => {
    const result = parseNotificationConfig({
      newEnrollmentEnabled: true,
      recipientAdminIds: ["a1", "a2"],
    });
    expect(result).toEqual({
      newEnrollmentEnabled: true,
      recipientAdminIds: ["a1", "a2"],
    });
  });

  it("treats missing newEnrollmentEnabled as false (must opt-in)", () => {
    const result = parseNotificationConfig({ recipientAdminIds: ["a1"] });
    expect(result.newEnrollmentEnabled).toBe(false);
  });

  it("treats truthy non-boolean newEnrollmentEnabled as false (strict)", () => {
    // Defense in depth: only literal `true` enables the alert.
    expect(
      parseNotificationConfig({ newEnrollmentEnabled: 1 }).newEnrollmentEnabled,
    ).toBe(false);
    expect(
      parseNotificationConfig({ newEnrollmentEnabled: "true" }).newEnrollmentEnabled,
    ).toBe(false);
  });

  it("drops non-string entries from recipientAdminIds", () => {
    // Cast: the parser exists to defend against this kind of garbage data
    // landing in the JSON column, so we have to feed it values TS wouldn't
    // normally allow.
    const result = parseNotificationConfig({
      newEnrollmentEnabled: true,
      recipientAdminIds: ["a1", 42, null, undefined, "a2", { id: "x" }],
    } as never);
    expect(result.recipientAdminIds).toEqual(["a1", "a2"]);
  });

  it("normalises a missing recipientAdminIds to an empty array", () => {
    const result = parseNotificationConfig({ newEnrollmentEnabled: true });
    expect(result.recipientAdminIds).toEqual([]);
  });

  it("normalises a non-array recipientAdminIds to an empty array", () => {
    const result = parseNotificationConfig({
      newEnrollmentEnabled: true,
      recipientAdminIds: "a1",
    });
    expect(result.recipientAdminIds).toEqual([]);
  });
});
