const PARIS_TZ = "Europe/Paris";

/**
 * Combines a date (YYYY-MM-DD) and time (HH:mm) that an admin entered —
 * assumed to be Europe/Paris local time — into a UTC Date. DST-safe: builds
 * the moment as if it were UTC, asks what Paris reads at that UTC moment,
 * then shifts by the difference.
 */
export function combineParisDateTime(dateISO: string, time: string): Date {
  const asIfUtc = new Date(`${dateISO}T${time}:00Z`);
  const parisLocal = new Date(asIfUtc.toLocaleString("en-US", { timeZone: PARIS_TZ }));
  const offsetMs = asIfUtc.getTime() - parisLocal.getTime();
  return new Date(asIfUtc.getTime() + offsetMs);
}

/**
 * Splits a UTC Date back into the (date, time) pair an admin expects to see
 * in Europe/Paris local time — the inverse of combineParisDateTime.
 *
 * Prefilling a form with `date.toISOString().slice(...)` instead silently
 * shows the UTC values. Re-saving unchanged then round-trips through
 * combineParisDateTime a second time and shifts the event by the Paris/UTC
 * offset (1h or 2h depending on DST) every time the settings form is saved.
 */
/**
 * Whether "now" falls within the walk-in window for an event: from Paris
 * midnight on the event's calendar day through 06:00 the next day (covers a
 * workshop running late into the evening). Keeps the public walk-in form from
 * being usable at any time for any event (see submitWalkin).
 */
export function isWalkinWindowOpen(eventDate: Date, now: Date = new Date()): boolean {
  const eventDay = splitParisDateTime(eventDate).date;
  const windowStart = combineParisDateTime(eventDay, "00:00");
  const nextDay = splitParisDateTime(
    new Date(windowStart.getTime() + 24 * 60 * 60 * 1000),
  ).date;
  const windowEnd = combineParisDateTime(nextDay, "06:00");
  return now.getTime() >= windowStart.getTime() && now.getTime() < windowEnd.getTime();
}

export function splitParisDateTime(date: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}
