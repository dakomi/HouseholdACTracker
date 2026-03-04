import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ data: null, error: message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ data: null, error: 'Route not found' });
}
