import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userIdHeader = req.headers['x-user-id'];
  if (!userIdHeader) {
    res.status(401).json({ data: null, error: 'Unauthorized: no user id provided' });
    return;
  }
  const userId = parseInt(userIdHeader as string, 10);
  if (isNaN(userId)) {
    res.status(401).json({ data: null, error: 'Unauthorized: invalid user id' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.is_admin) {
    res.status(403).json({ data: null, error: 'Forbidden: admin access required' });
    return;
  }
  next();
}
