import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';

const router = Router();

// GET /api/zones
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const zones = await prisma.zone.findMany({ orderBy: { id: 'asc' } });
    res.json({ data: zones, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/zones
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, kwh_per_hour } = req.body;
    if (!name || kwh_per_hour === undefined) {
      res.status(400).json({ data: null, error: 'name and kwh_per_hour are required' });
      return;
    }
    const zone = await prisma.zone.create({ data: { name, kwh_per_hour } });
    res.status(201).json({ data: zone, error: null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/zones/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, kwh_per_hour } = req.body;
    const zone = await prisma.zone.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(kwh_per_hour !== undefined && { kwh_per_hour }),
      },
    });
    res.json({ data: zone, error: null });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/zones/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.zone.delete({ where: { id } });
    res.json({ data: { id }, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
