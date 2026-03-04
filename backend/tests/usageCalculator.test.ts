import {
  calculateUsage,
  getEffectiveRate,
  SessionInput,
  ZoneInput,
  ZoneCombinationInput,
} from '../src/services/usageCalculator';

// Helpers
function makeSession(
  id: number,
  userId: number,
  startOffsetMin: number,
  endOffsetMin: number | null,
  zoneIds: number[],
  baseTime: Date = new Date('2024-01-01T10:00:00.000Z')
): SessionInput {
  const startTime = new Date(baseTime.getTime() + startOffsetMin * 60000);
  const endTime =
    endOffsetMin !== null
      ? new Date(baseTime.getTime() + endOffsetMin * 60000)
      : null;
  return { id, userId, startTime, endTime, zoneIds };
}

const zones: ZoneInput[] = [
  { id: 1, kwhPerHour: 1.5 }, // Living Room
  { id: 2, kwhPerHour: 1.2 }, // Master Bedroom
  { id: 3, kwhPerHour: 1.0 }, // Bedroom 2
  { id: 4, kwhPerHour: 1.3 }, // Dining Room
];

const combinations: ZoneCombinationInput[] = [
  { id: 1, kwhPerHour: 4.0, zoneIds: [1, 4] }, // Living + Dining = 4 kWh
];

const RATE = 0.25;

describe('getEffectiveRate', () => {
  it('returns 0 for empty zone list', () => {
    expect(getEffectiveRate([], zones, combinations)).toBe(0);
  });

  it('returns individual zone rate for single zone', () => {
    expect(getEffectiveRate([1], zones, combinations)).toBe(1.5);
    expect(getEffectiveRate([2], zones, combinations)).toBe(1.2);
  });

  it('sums rates for multiple zones without a matching combination', () => {
    // Zones 1 + 2 = 1.5 + 1.2 = 2.7
    expect(getEffectiveRate([1, 2], zones, combinations)).toBeCloseTo(2.7);
  });

  it('uses combination rate when zones match a combination', () => {
    // Zones 1 + 4 = Living + Dining combination = 4.0
    expect(getEffectiveRate([1, 4], zones, combinations)).toBe(4.0);
  });

  it('uses combination rate plus remaining zone rates for extra zones', () => {
    // Zones 1 + 4 + 2: combo(1+4)=4.0 + zone2=1.2 = 5.2
    expect(getEffectiveRate([1, 4, 2], zones, combinations)).toBeCloseTo(5.2);
  });

  it('uses combo even when zone order is different', () => {
    expect(getEffectiveRate([4, 1], zones, combinations)).toBe(4.0);
  });
});

describe('calculateUsage - single user', () => {
  it('returns empty array for no sessions', () => {
    const result = calculateUsage([], zones, combinations, RATE);
    expect(result).toEqual([]);
  });

  it('calculates correct hours and kWh for a 2-hour session', () => {
    const sessions = [makeSession(1, 1, 0, 120, [1])]; // 2 hours, Living Room 1.5 kWh
    const result = calculateUsage(sessions, zones, combinations, RATE);

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(1);
    expect(result[0].totalHours).toBeCloseTo(2);
    expect(result[0].exclusiveHours).toBeCloseTo(2);
    expect(result[0].sharedHours).toBeCloseTo(0);
    expect(result[0].kWh).toBeCloseTo(3.0); // 2h * 1.5
    expect(result[0].cost).toBeCloseTo(0.75); // 3.0 * 0.25
  });

  it('calculates combo rate for matching zones', () => {
    // 1 hour using Living Room + Dining Room combo = 4.0 kWh/hr
    const sessions = [makeSession(1, 1, 0, 60, [1, 4])];
    const result = calculateUsage(sessions, zones, combinations, RATE);

    expect(result[0].kWh).toBeCloseTo(4.0); // 1h * 4.0
    expect(result[0].cost).toBeCloseTo(1.0);
  });

  it('handles ongoing session (null end_time)', () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60000); // 1 hour ago
    const sessions: SessionInput[] = [
      { id: 1, userId: 1, startTime, endTime: null, zoneIds: [2] },
    ];
    const result = calculateUsage(sessions, zones, combinations, RATE);

    expect(result).toHaveLength(1);
    expect(result[0].totalHours).toBeGreaterThan(0.9);
    expect(result[0].totalHours).toBeLessThan(1.1);
  });
});

describe('calculateUsage - overlapping sessions (shared cost)', () => {
  it('splits cost equally for fully overlapping sessions', () => {
    // Two users, same time, same zone
    const sessions = [
      makeSession(1, 1, 0, 60, [1]), // User 1: 1 hour
      makeSession(2, 2, 0, 60, [1]), // User 2: 1 hour, exact overlap
    ];
    const result = calculateUsage(sessions, zones, combinations, RATE);

    const user1 = result.find((r) => r.userId === 1)!;
    const user2 = result.find((r) => r.userId === 2)!;

    expect(result).toHaveLength(2);

    // Each gets 0.5h shared (50% of 1h)
    expect(user1.sharedHours).toBeCloseTo(0.5);
    expect(user2.sharedHours).toBeCloseTo(0.5);
    expect(user1.exclusiveHours).toBeCloseTo(0);
    expect(user2.exclusiveHours).toBeCloseTo(0);

    // Each pays half = 0.5h * 1.5 kWh * 0.25
    expect(user1.kWh).toBeCloseTo(0.75);
    expect(user2.kWh).toBeCloseTo(0.75);
  });

  it('handles partial overlap correctly', () => {
    // User 1: 0-60 min (exclusive 0-30, shared 30-60)
    // User 2: 30-90 min (shared 30-60, exclusive 60-90)
    const sessions = [
      makeSession(1, 1, 0, 60, [1]),
      makeSession(2, 2, 30, 90, [1]),
    ];
    const result = calculateUsage(sessions, zones, combinations, RATE);

    const user1 = result.find((r) => r.userId === 1)!;
    const user2 = result.find((r) => r.userId === 2)!;

    // User 1: 30 min exclusive + 15 min shared (half of 30 min overlap)
    expect(user1.exclusiveHours).toBeCloseTo(0.5);
    expect(user1.sharedHours).toBeCloseTo(0.25);
    expect(user1.totalHours).toBeCloseTo(0.75);

    // User 2: 30 min exclusive + 15 min shared
    expect(user2.exclusiveHours).toBeCloseTo(0.5);
    expect(user2.sharedHours).toBeCloseTo(0.25);
    expect(user2.totalHours).toBeCloseTo(0.75);

    // kWh: exclusive 0.5h * 1.5 = 0.75, shared 0.25h * 1.5 = 0.375
    expect(user1.kWh).toBeCloseTo(0.75 + 0.375);
    expect(user2.kWh).toBeCloseTo(0.75 + 0.375);
  });

  it('handles 3-way overlap', () => {
    // Three users all overlap for 30 minutes
    const sessions = [
      makeSession(1, 1, 0, 60, [1]),
      makeSession(2, 2, 0, 30, [1]),
      makeSession(3, 3, 0, 30, [1]),
    ];
    const result = calculateUsage(sessions, zones, combinations, RATE);

    const user1 = result.find((r) => r.userId === 1)!;
    const user2 = result.find((r) => r.userId === 2)!;

    // 0-30 min: 3-way overlap, each gets 10 min; 30-60 min: user1 exclusive
    expect(user1.sharedHours).toBeCloseTo(1 / 6); // 10 min
    expect(user1.exclusiveHours).toBeCloseTo(0.5); // 30 min

    expect(user2.sharedHours).toBeCloseTo(1 / 6);
    expect(user2.exclusiveHours).toBeCloseTo(0);
  });

  it('handles sessions with different zones during overlap', () => {
    // User 1 in Living Room, User 2 in Master Bedroom, same time
    const sessions = [
      makeSession(1, 1, 0, 60, [1]), // 1.5 kWh/hr
      makeSession(2, 2, 0, 60, [2]), // 1.2 kWh/hr
    ];
    const result = calculateUsage(sessions, zones, combinations, RATE);

    const user1 = result.find((r) => r.userId === 1)!;
    const user2 = result.find((r) => r.userId === 2)!;

    // Each gets 0.5 shared hours
    // User 1 kWh: 0.5h * 1.5 = 0.75
    // User 2 kWh: 0.5h * 1.2 = 0.60
    expect(user1.kWh).toBeCloseTo(0.75);
    expect(user2.kWh).toBeCloseTo(0.60);
  });
});

describe('calculateUsage - period filtering', () => {
  it('filters sessions to the specified period', () => {
    const base = new Date('2024-01-15T12:00:00.000Z');
    const periodStart = new Date('2024-01-15T11:00:00.000Z');
    const periodEnd = new Date('2024-01-15T13:00:00.000Z');

    // Session starts before period
    const sessions: SessionInput[] = [
      {
        id: 1,
        userId: 1,
        startTime: new Date('2024-01-15T10:00:00.000Z'),
        endTime: new Date('2024-01-15T12:30:00.000Z'),
        zoneIds: [1],
      },
    ];

    const result = calculateUsage(sessions, zones, combinations, RATE, periodStart, periodEnd);
    expect(result).toHaveLength(1);
    // Only 11:00-12:30 counts = 1.5h
    expect(result[0].totalHours).toBeCloseTo(1.5);
  });

  it('excludes sessions completely outside the period', () => {
    const periodStart = new Date('2024-01-15T12:00:00.000Z');
    const periodEnd = new Date('2024-01-15T14:00:00.000Z');

    const sessions: SessionInput[] = [
      {
        id: 1,
        userId: 1,
        startTime: new Date('2024-01-15T08:00:00.000Z'),
        endTime: new Date('2024-01-15T10:00:00.000Z'),
        zoneIds: [1],
      },
    ];

    const result = calculateUsage(sessions, zones, combinations, RATE, periodStart, periodEnd);
    expect(result).toHaveLength(0);
  });
});

describe('calculateUsage - spanning midnight', () => {
  it('correctly handles sessions spanning midnight', () => {
    const sessions: SessionInput[] = [
      {
        id: 1,
        userId: 1,
        startTime: new Date('2024-01-15T23:00:00.000Z'),
        endTime: new Date('2024-01-16T01:00:00.000Z'),
        zoneIds: [1],
      },
    ];

    const result = calculateUsage(sessions, zones, combinations, RATE);
    expect(result).toHaveLength(1);
    expect(result[0].totalHours).toBeCloseTo(2);
    expect(result[0].kWh).toBeCloseTo(3.0); // 2h * 1.5
  });
});
