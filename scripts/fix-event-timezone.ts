/**
 * One-time migration: event dates were saved as "Paris local time treated as UTC"
 * (combineDateTime bug). This script re-interprets the UTC value as the intended
 * Paris local time and converts it to the correct UTC timestamp.
 *
 * Run once with: npx tsx scripts/fix-event-timezone.ts
 * Safe to re-run (idempotent after the first pass because the code fix is deployed).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function buggedUtcToCorrectUtc(date: Date): Date {
  // The stored date has the Paris local time in its UTC fields.
  // e.g. DB = 09:30 UTC but admin meant 09:30 Paris (= 07:30 UTC in summer).
  // We re-interpret the UTC clock as Paris local and convert back to real UTC.
  const asIfUtc = date;
  const parisLocal = new Date(asIfUtc.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const offsetMs = asIfUtc.getTime() - parisLocal.getTime();
  return new Date(asIfUtc.getTime() + offsetMs);
}

async function main() {
  const events = await prisma.event.findMany({
    select: { id: true, name: true, date: true, endTime: true },
  });

  console.log(`Found ${events.length} event(s) to migrate.\n`);

  for (const event of events) {
    const correctedDate = buggedUtcToCorrectUtc(event.date);
    const correctedEndTime = event.endTime ? buggedUtcToCorrectUtc(event.endTime) : null;

    console.log(`[${event.name}]`);
    console.log(`  date:    ${event.date.toISOString()} → ${correctedDate.toISOString()}`);
    if (event.endTime) {
      console.log(`  endTime: ${event.endTime.toISOString()} → ${correctedEndTime!.toISOString()}`);
    }

    await prisma.event.update({
      where: { id: event.id },
      data: {
        date: correctedDate,
        ...(correctedEndTime !== null ? { endTime: correctedEndTime } : {}),
      },
    });
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
