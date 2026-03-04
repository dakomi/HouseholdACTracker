/**
 * Usage Calculator Service
 *
 * Handles calculation of AC usage costs including:
 * - Exclusive vs shared time periods across overlapping sessions
 * - Zone combination rates
 * - Cost calculation based on electricity rate
 */

export interface SessionInput {
  id: number;
  userId: number;
  startTime: Date;
  endTime: Date | null;
  zoneIds: number[];
}

export interface ZoneInput {
  id: number;
  kwhPerHour: number;
}

export interface ZoneCombinationInput {
  id: number;
  kwhPerHour: number;
  zoneIds: number[];
}

export interface UsageResult {
  userId: number;
  exclusiveHours: number;
  sharedHours: number;
  totalHours: number;
  kWh: number;
  cost: number;
}

/**
 * Given a set of active zone IDs for a period, determine the effective kWh/hr rate.
 * If a zone combination matches (all its zones are active), use the combo rate;
 * otherwise sum individual zone rates.
 */
export function getEffectiveRate(
  activeZoneIds: number[],
  zones: ZoneInput[],
  combinations: ZoneCombinationInput[]
): number {
  if (activeZoneIds.length === 0) return 0;

  const activeSet = new Set(activeZoneIds);

  // Find best matching combination: largest subset that is fully contained
  let bestCombo: ZoneCombinationInput | null = null;
  let bestComboSize = 0;
  for (const combo of combinations) {
    if (
      combo.zoneIds.length > bestComboSize &&
      combo.zoneIds.every((zId) => activeSet.has(zId))
    ) {
      bestCombo = combo;
      bestComboSize = combo.zoneIds.length;
    }
  }

  if (bestCombo) {
    // Use combo rate for the matched zones, add individual rates for remaining zones
    const comboZoneSet = new Set(bestCombo.zoneIds);
    const remainingZoneIds = activeZoneIds.filter((id) => !comboZoneSet.has(id));
    const remainingRate = remainingZoneIds.reduce((sum, zId) => {
      const zone = zones.find((z) => z.id === zId);
      return sum + (zone ? zone.kwhPerHour : 0);
    }, 0);
    return bestCombo.kwhPerHour + remainingRate;
  }

  // Sum individual zone rates
  return activeZoneIds.reduce((sum, zId) => {
    const zone = zones.find((z) => z.id === zId);
    if (!zone) {
      console.warn(`getEffectiveRate: zone ID ${zId} not found in zones lookup — defaulting to 0 kWh/hr`);
    }
    return sum + (zone ? zone.kwhPerHour : 0);
  }, 0);
}

/**
 * Calculate usage for a set of sessions within a period.
 *
 * Algorithm:
 * 1. Collect all event timestamps (session start/end) to form time intervals.
 * 2. For each interval, determine which sessions are active.
 * 3. For each active session, calculate fraction = 1 / (number of concurrent sessions).
 * 4. Accumulate exclusive hours (fraction=1) and shared hours (fraction<1) per user.
 * 5. Calculate kWh using zone rates for that interval.
 */
export function calculateUsage(
  sessions: SessionInput[],
  zones: ZoneInput[],
  combinations: ZoneCombinationInput[],
  electricityRate: number,
  periodStart?: Date,
  periodEnd?: Date
): UsageResult[] {
  const now = new Date();
  const effectiveEnd = periodEnd ?? now;

  // Clamp sessions to period
  const clampedSessions = sessions
    .map((s) => ({
      ...s,
      startTime: s.startTime < (periodStart ?? s.startTime) ? (periodStart ?? s.startTime) : s.startTime,
      endTime: s.endTime
        ? s.endTime > effectiveEnd
          ? effectiveEnd
          : s.endTime
        : effectiveEnd,
    }))
    .filter((s) => s.startTime < s.endTime!);

  if (clampedSessions.length === 0) return [];

  // Collect all boundary timestamps
  const timestampSet = new Set<number>();
  for (const s of clampedSessions) {
    timestampSet.add(s.startTime.getTime());
    if (s.endTime) timestampSet.add(s.endTime.getTime());
  }
  const timestamps = Array.from(timestampSet).sort((a, b) => a - b);

  // Accumulate per-user results
  const userMap = new Map<
    number,
    { exclusiveHours: number; sharedHours: number; kWh: number }
  >();

  for (let i = 0; i < timestamps.length - 1; i++) {
    const intervalStart = timestamps[i];
    const intervalEnd = timestamps[i + 1];
    const intervalHours = (intervalEnd - intervalStart) / 3_600_000;

    if (intervalHours <= 0) continue;

    // Find active sessions in this interval
    const activeSessions = clampedSessions.filter(
      (s) =>
        s.startTime.getTime() <= intervalStart &&
        s.endTime!.getTime() >= intervalEnd
    );

    if (activeSessions.length === 0) continue;

    const concurrency = activeSessions.length;
    const fraction = 1 / concurrency;
    const isShared = concurrency > 1;

    for (const session of activeSessions) {
      const rate = getEffectiveRate(session.zoneIds, zones, combinations);
      const sessionKwh = rate * intervalHours * fraction;

      const existing = userMap.get(session.userId) ?? {
        exclusiveHours: 0,
        sharedHours: 0,
        kWh: 0,
      };

      if (isShared) {
        existing.sharedHours += intervalHours * fraction;
      } else {
        existing.exclusiveHours += intervalHours;
      }
      existing.kWh += sessionKwh;
      userMap.set(session.userId, existing);
    }
  }

  const results: UsageResult[] = [];
  for (const [userId, data] of userMap.entries()) {
    results.push({
      userId,
      exclusiveHours: Math.round(data.exclusiveHours * 10000) / 10000,
      sharedHours: Math.round(data.sharedHours * 10000) / 10000,
      totalHours:
        Math.round((data.exclusiveHours + data.sharedHours) * 10000) / 10000,
      kWh: Math.round(data.kWh * 10000) / 10000,
      cost: Math.round(data.kWh * electricityRate * 10000) / 10000,
    });
  }

  return results;
}
