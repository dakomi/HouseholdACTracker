import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';

const router = Router();

// GET /api/users
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    res.json({ data: users, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, colour, pin, is_admin } = req.body;
    if (!name || !colour) {
      res.status(400).json({ data: null, error: 'name and colour are required' });
      return;
    }
    const user = await prisma.user.create({
      data: { name, colour, pin: pin ?? null, is_admin: is_admin ?? false },
    });
    res.status(201).json({ data: user, error: null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, colour, pin, is_admin } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(colour !== undefined && { colour }),
        ...(pin !== undefined && { pin }),
        ...(is_admin !== undefined && { is_admin }),
      },
    });
    res.json({ data: user, error: null });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.user.delete({ where: { id } });
    res.json({ data: { id }, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/authenticate
router.post('/authenticate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, pin } = req.body;
    if (!id) {
      res.status(400).json({ data: null, error: 'id is required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: parseInt(id, 10) } });
    if (!user) {
      res.status(404).json({ data: null, error: 'User not found' });
      return;
    }
    if (user.pin && user.pin !== pin) {
      res.status(401).json({ data: null, error: 'Invalid PIN' });
      return;
    }
    const { pin: _pin, ...safeUser } = user;
    res.json({ data: safeUser, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
