import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { calculateUsage } from '../services/usageCalculator';

const router = Router();

function getPeriodBounds(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);

  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (period === 'month') {
    const start = new Date(now);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  // Default: all time
  return { start: new Date(0), end };
}

// GET /api/reports/usage
router.get('/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, period = 'month' } = req.query;
    const { start, end } = getPeriodBounds(period as string);

    const where: Record<string, unknown> = {
      start_time: { gte: start, lte: end },
    };
    if (user_id) where.user_id = parseInt(user_id as string, 10);

    const sessions = await prisma.session.findMany({
      where,
      include: { zones: { include: { zone: true } } },
    });

    const zones = await prisma.zone.findMany();
    const combinations = await prisma.zoneCombination.findMany({
      include: { zones: true },
    });
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const electricityRate = settings?.electricity_rate ?? 0.25;

    const sessionInputs = sessions.map((s) => ({
      id: s.id,
      userId: s.user_id,
      startTime: s.start_time,
      endTime: s.end_time,
      zoneIds: s.zones.map((sz) => sz.zone_id),
    }));

    const zoneInputs = zones.map((z) => ({ id: z.id, kwhPerHour: z.kwh_per_hour }));
    const comboInputs = combinations.map((c) => ({
      id: c.id,
      kwhPerHour: c.kwh_per_hour,
      zoneIds: c.zones.map((cz) => cz.zone_id),
    }));

    const results = calculateUsage(
      sessionInputs,
      zoneInputs,
      comboInputs,
      electricityRate,
      start,
      end
    );

    res.json({ data: results, error: null });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/household
router.get('/household', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'month' } = req.query;
    const { start, end } = getPeriodBounds(period as string);

    const sessions = await prisma.session.findMany({
      where: { start_time: { gte: start, lte: end } },
      include: { user: true, zones: { include: { zone: true } } },
    });

    const zones = await prisma.zone.findMany();
    const combinations = await prisma.zoneCombination.findMany({
      include: { zones: true },
    });
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const electricityRate = settings?.electricity_rate ?? 0.25;

    const sessionInputs = sessions.map((s) => ({
      id: s.id,
      userId: s.user_id,
      startTime: s.start_time,
      endTime: s.end_time,
      zoneIds: s.zones.map((sz) => sz.zone_id),
    }));

    const zoneInputs = zones.map((z) => ({ id: z.id, kwhPerHour: z.kwh_per_hour }));
    const comboInputs = combinations.map((c) => ({
      id: c.id,
      kwhPerHour: c.kwh_per_hour,
      zoneIds: c.zones.map((cz) => cz.zone_id),
    }));

    const usageByUser = calculateUsage(
      sessionInputs,
      zoneInputs,
      comboInputs,
      electricityRate,
      start,
      end
    );

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => !s.end_time).length;
    const totalKwh = usageByUser.reduce((sum, u) => sum + u.kWh, 0);
    const totalCost = usageByUser.reduce((sum, u) => sum + u.cost, 0);

    res.json({
      data: {
        period,
        periodStart: start,
        periodEnd: end,
        totalSessions,
        activeSessions,
        totalKwh: Math.round(totalKwh * 10000) / 10000,
        totalCost: Math.round(totalCost * 10000) / 10000,
        usageByUser,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/data/export
router.get('/export', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, zones, combinations, sessions, settings] = await Promise.all([
      prisma.user.findMany(),
      prisma.zone.findMany(),
      prisma.zoneCombination.findMany({ include: { zones: { include: { zone: true } } } }),
      prisma.session.findMany({
        include: {
          user: true,
          zones: { include: { zone: true } },
          sessionZoneLogs: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.settings.findUnique({ where: { id: 1 } }),
    ]);

    res.json({
      data: {
        exportedAt: new Date().toISOString(),
        users,
        zones,
        zoneCombinations: combinations,
        sessions,
        settings,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
