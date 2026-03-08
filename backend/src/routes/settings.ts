import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/settings
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: 1 } });
    }
    res.json({ data: settings, error: null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      electricity_rate,
      auto_off_duration,
      household_name,
      require_confirmation,
    } = req.body;

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        ...(electricity_rate !== undefined && { electricity_rate }),
        ...(auto_off_duration !== undefined && { auto_off_duration }),
        ...(household_name !== undefined && { household_name }),
        ...(require_confirmation !== undefined && { require_confirmation }),
      },
      create: {
        id: 1,
        electricity_rate: electricity_rate ?? 0.25,
        auto_off_duration: auto_off_duration ?? 120,
        household_name: household_name ?? 'Our Home',
        require_confirmation: require_confirmation ?? true,
      },
    });
    res.json({ data: settings, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
