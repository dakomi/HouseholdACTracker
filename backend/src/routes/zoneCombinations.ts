import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';

const router = Router();

const combinationInclude = {
  zones: { include: { zone: true } },
};

// GET /api/zone-combinations
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const combinations = await prisma.zoneCombination.findMany({
      include: combinationInclude,
    });
    res.json({ data: combinations, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/zone-combinations
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { label, kwh_per_hour, zone_ids } = req.body;
    if (!label || kwh_per_hour === undefined || !Array.isArray(zone_ids)) {
      res.status(400).json({
        data: null,
        error: 'label, kwh_per_hour, and zone_ids (array) are required',
      });
      return;
    }
    const combination = await prisma.zoneCombination.create({
      data: {
        label,
        kwh_per_hour,
        zones: { create: (zone_ids as number[]).map((id) => ({ zone_id: id })) },
      },
      include: combinationInclude,
    });
    res.status(201).json({ data: combination, error: null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/zone-combinations/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { label, kwh_per_hour, zone_ids } = req.body;

    await prisma.zoneCombinationZone.deleteMany({
      where: { zone_combination_id: id },
    });

    const combination = await prisma.zoneCombination.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(kwh_per_hour !== undefined && { kwh_per_hour }),
        ...(Array.isArray(zone_ids) && {
          zones: { create: (zone_ids as number[]).map((zId) => ({ zone_id: zId })) },
        }),
      },
      include: combinationInclude,
    });
    res.json({ data: combination, error: null });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/zone-combinations/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.zoneCombination.delete({ where: { id } });
    res.json({ data: { id }, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
