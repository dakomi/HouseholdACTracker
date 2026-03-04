import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Returns a Date set to `daysBack` days ago at the given hour and minute
 * (local-time midnight-anchored so results stay stable throughout any given day).
 */
function at(daysBack: number, hour: number, minute: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Upsert a session (idempotent).  Nested SessionZone and SessionZoneLog rows
 * are only written on first creation; a re-run leaves them untouched.
 */
async function seedSession(
  id: number,
  userId: number,
  zoneIds: number[],
  startTime: Date,
  endTime: Date | null
) {
  return prisma.session.upsert({
    where: { id },
    update: {},
    create: {
      id,
      user_id: userId,
      start_time: startTime,
      end_time: endTime,
      zones: {
        create: zoneIds.map((zId) => ({ zone_id: zId })),
      },
      sessionZoneLogs: {
        create: zoneIds.map((zId) => ({
          zone_id: zId,
          activated_by: userId,
          activated_at: startTime,
          ...(endTime
            ? { deactivated_by: userId, deactivated_at: endTime }
            : {}),
        })),
      },
    },
  });
}

async function main() {
  console.log('Seeding database...');

  // ── Zones ────────────────────────────────────────────────────────────────
  // kWh/hr values are representative of typical split-system AC units:
  //   Large room (living/dining): ~1.3–1.5 kWh/hr  (5–7 kW capacity unit)
  //   Medium room (master bed):   ~1.2 kWh/hr       (4–5 kW capacity unit)
  //   Small room  (bedroom 2):    ~1.0 kWh/hr       (2.5–3.5 kW capacity unit)
  const livingRoom    = await prisma.zone.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Living Room',    kwh_per_hour: 1.5 } });
  const masterBedroom = await prisma.zone.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Master Bedroom', kwh_per_hour: 1.2 } });
  const bedroom2      = await prisma.zone.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Bedroom 2',      kwh_per_hour: 1.0 } });
  const diningRoom    = await prisma.zone.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: 'Dining Room',    kwh_per_hour: 1.3 } });

  console.log('Zones created:', livingRoom.name, masterBedroom.name, bedroom2.name, diningRoom.name);

  // ── Zone combination: Living Room + Dining Room = 4.0 kWh/hr ────────────
  const combo = await prisma.zoneCombination.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      label: 'Living + Dining',
      kwh_per_hour: 4.0,
      zones: {
        create: [
          { zone_id: livingRoom.id },
          { zone_id: diningRoom.id },
        ],
      },
    },
  });

  console.log('Zone combination created:', combo.label);

  // ── Users ────────────────────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Alice', colour: '#FF6B6B', is_admin: true } }),
    prisma.user.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Bob',   colour: '#4ECDC4' } }),
    prisma.user.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Carol', colour: '#45B7D1' } }),
    prisma.user.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: 'Dave',  colour: '#96CEB4' } }),
    prisma.user.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: 'Eve',   colour: '#FFEAA7' } }),
  ]);

  console.log('Users created:', users.map((u) => u.name).join(', '));

  // ── Settings singleton ───────────────────────────────────────────────────
  // electricity_rate: 0.25 $/kWh — typical Australian residential flat tariff
  //   (ranges roughly 0.22–0.35 $/kWh depending on state and retailer).
  //   Change this to your local rate; e.g. 0.30 for VIC, 0.28 for NSW.
  // auto_off_duration: 120 min — session auto-ends after 2 hours if not
  //   manually closed (prevents runaway costs from forgotten sessions).
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, electricity_rate: 0.25, auto_off_duration: 120, household_name: 'Our Home', require_confirmation: true },
  });

  console.log('Settings created:', settings.household_name);

  // ── Sessions ─────────────────────────────────────────────────────────────
  //
  // Scenarios deliberately cover every category the usage calculator handles:
  //   • Exclusive single-zone sessions (all 5 users, all 4 zones)
  //   • Zone-combination usage (Living + Dining)
  //   • Exact 2-way overlap (equal shared cost)
  //   • 3-way overlap for part of a session (mixed exclusive + shared)
  //   • Partial 2-way overlap (each user has exclusive time + shared time)
  //   • Sessions spread across all report windows: ~4 wks, ~3 wks, ~2 wks, ~1 wk, yesterday, today
  //   • One ongoing session (null end_time) for active-session behaviour
  //
  // Zone key:  1 = Living Room (1.5), 2 = Master Bedroom (1.2),
  //            3 = Bedroom 2 (1.0),   4 = Dining Room (1.3)
  // Combo:     [1,4] = Living + Dining (4.0 kWh/hr)

  // --- ~4 weeks ago: exclusive sessions, different users/zones ─────────────
  await seedSession(1, 1, [1],    at(28,  9,  0), at(28, 11,  0)); // Alice, Living Room, 2h
  await seedSession(2, 2, [2],    at(28, 22,  0), at(28, 23, 30)); // Bob,   Master Bedroom, 1.5h

  // --- ~3 weeks ago: combo usage + more exclusives ─────────────────────────
  await seedSession(3, 3, [3],    at(21,  8, 30), at(21,  9, 30)); // Carol, Bedroom 2, 1h
  await seedSession(4, 4, [4],    at(21, 14,  0), at(21, 16,  0)); // Dave,  Dining Room, 2h
  await seedSession(5, 1, [1, 4], at(21, 19,  0), at(21, 20,  0)); // Alice, Living+Dining combo, 1h

  // --- ~2 weeks ago: 3-way overlap (Alice has exclusive tail) ──────────────
  // Alice: 20:00–21:00 (30 min 3-way shared + 30 min exclusive)
  // Bob:   20:00–20:30 (30 min 3-way shared only)
  // Carol: 20:00–20:30 (30 min 3-way shared only)
  await seedSession(6, 1, [1],    at(14, 20,  0), at(14, 21,  0)); // Alice
  await seedSession(7, 2, [1],    at(14, 20,  0), at(14, 20, 30)); // Bob
  await seedSession(8, 3, [1],    at(14, 20,  0), at(14, 20, 30)); // Carol

  // --- ~1 week ago: partial 2-way overlap + combo + exclusives ─────────────
  await seedSession(9,  5, [3],      at(7, 10,  0), at(7, 11,  0));  // Eve,   Bedroom 2, 1h exclusive
  await seedSession(10, 1, [2],      at(7, 13,  0), at(7, 14, 30));  // Alice, Master Bedroom, 1.5h exclusive
  // Bob: 21:00–22:00 (30 min exclusive + 30 min 2-way shared with Carol)
  // Carol: 21:30–22:30 (30 min 2-way shared + 30 min exclusive)
  await seedSession(11, 2, [1],      at(7, 21,  0), at(7, 22,  0));  // Bob
  await seedSession(12, 3, [1],      at(7, 21, 30), at(7, 22, 30));  // Carol
  await seedSession(13, 4, [1, 4],   at(7, 15,  0), at(7, 15, 45)); // Dave,  Living+Dining combo, 45 min

  // --- Yesterday: exact 2-way overlap + more exclusives ────────────────────
  await seedSession(14, 1, [1],    at(1,  8,  0), at(1,  9,  0));   // Alice, Living Room, 1h exclusive
  await seedSession(15, 2, [2],    at(1, 22,  0), at(1, 23, 59));   // Bob,   Master Bedroom, ~2h exclusive
  // Eve and Carol both use Bedroom 2 at the same time — exact 2-way shared
  await seedSession(16, 5, [3],    at(1, 19,  0), at(1, 19, 30));   // Eve
  await seedSession(17, 3, [3],    at(1, 19,  0), at(1, 19, 30));   // Carol

  // --- Today: one closed session + one ongoing ─────────────────────────────
  // Session 18: Alice, closed 1h session ending 30 min before the ongoing one started.
  // Session 19: Bob's ongoing session started 30 minutes ago (relative to seed time so
  //   it is always in the past regardless of timezone, avoiding a negative-duration display).
  const ongoingStart = new Date(Date.now() - 30 * 60 * 1000);   // 30 min ago
  const closedEnd    = new Date(ongoingStart.getTime() - 30 * 60 * 1000); // 60 min ago
  const closedStart  = new Date(closedEnd.getTime()    - 60 * 60 * 1000); // 120 min ago
  await seedSession(18, 1, [1],    closedStart, closedEnd);   // Alice, Living Room, 1h (closed)
  await seedSession(19, 2, [2],    ongoingStart, null);        // Bob,   Master Bedroom, ongoing

  console.log('Sessions created: 19 sessions across 4-week window (exclusive, overlapping, combo, ongoing)');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
