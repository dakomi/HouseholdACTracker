import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { safeUserSelect } from '../prisma/selects';
import {
  emitSessionStarted,
  emitSessionEnded,
  emitSessionUpdated,
  emitStatusUpdate,
} from '../services/socketService';

const router = Router();

const sessionInclude = {
  user: { select: safeUserSelect },
  zones: { include: { zone: true } },
  sessionZoneLogs: true,
};

async function broadcastStatus() {
  const active = await prisma.session.findMany({
    where: { end_time: null },
    include: { user: { select: safeUserSelect }, zones: { include: { zone: true } } },
  });
  emitStatusUpdate({ activeSessions: active, timestamp: new Date() });
}

// GET /api/sessions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, limit, offset } = req.query;
    const sessions = await prisma.session.findMany({
      where: user_id ? { user_id: parseInt(user_id as string, 10) } : undefined,
      include: sessionInclude,
      orderBy: { created_at: 'desc' },
      take: limit ? parseInt(limit as string, 10) : undefined,
      skip: offset ? parseInt(offset as string, 10) : undefined,
    });
    res.json({ data: sessions, error: null });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/active
router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { end_time: null },
      include: sessionInclude,
    });
    res.json({ data: sessions, error: null });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const session = await prisma.session.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) {
      res.status(404).json({ data: null, error: 'Session not found' });
      return;
    }
    res.json({ data: session, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions (start session)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, zone_ids, start_time } = req.body;
    if (!user_id || !Array.isArray(zone_ids) || zone_ids.length === 0) {
      res.status(400).json({
        data: null,
        error: 'user_id and zone_ids (non-empty array) are required',
      });
      return;
    }
    const startTime = start_time ? new Date(start_time) : new Date();
    const session = await prisma.session.create({
      data: {
        user_id,
        start_time: startTime,
        zones: { create: (zone_ids as number[]).map((id) => ({ zone_id: id })) },
        sessionZoneLogs: {
          create: (zone_ids as number[]).map((zId) => ({
            zone_id: zId,
            activated_by: user_id,
            activated_at: startTime,
          })),
        },
      },
      include: sessionInclude,
    });

    emitSessionStarted(session);
    await broadcastStatus();
    res.status(201).json({ data: session, error: null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sessions/:id (edit session)
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { start_time, end_time, zone_ids } = req.body;

    const updateData: Record<string, unknown> = { edited: true };
    if (start_time !== undefined) updateData.start_time = new Date(start_time);
    if (end_time !== undefined) updateData.end_time = new Date(end_time);

    if (Array.isArray(zone_ids)) {
      // Replace zones
      await prisma.sessionZone.deleteMany({ where: { session_id: id } });
      updateData.zones = {
        create: (zone_ids as number[]).map((zId) => ({ zone_id: zId })),
      };
    }

    const session = await prisma.session.update({
      where: { id },
      data: updateData,
      include: sessionInclude,
    });

    emitSessionUpdated(session);
    await broadcastStatus();
    res.json({ data: session, error: null });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const session = await prisma.session.findUnique({ where: { id }, include: sessionInclude });
    if (!session) {
      res.status(404).json({ data: null, error: 'Session not found' });
      return;
    }
    await prisma.session.delete({ where: { id } });
    emitSessionEnded(session);
    await broadcastStatus();
    res.json({ data: { id }, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/:id/end
router.post('/:id/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { end_time } = req.body;
    const endTime = end_time ? new Date(end_time) : new Date();

    const session = await prisma.session.update({
      where: { id },
      data: { end_time: endTime },
      include: sessionInclude,
    });

    // Close any open zone logs
    await prisma.sessionZoneLog.updateMany({
      where: { session_id: id, deactivated_at: null },
      data: { deactivated_at: endTime },
    });

    emitSessionEnded(session);
    await broadcastStatus();
    res.json({ data: session, error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
