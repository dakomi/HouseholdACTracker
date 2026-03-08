import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorHandler';
import usersRouter from './routes/users';
import zonesRouter from './routes/zones';
import zoneCombinationsRouter from './routes/zoneCombinations';
import sessionsRouter from './routes/sessions';
import reportsRouter from './routes/reports';
import settingsRouter from './routes/settings';
import botRouter from './routes/bot';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  })
);

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/zones', zonesRouter);
app.use('/api/zone-combinations', zoneCombinationsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/data', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/bot', botRouter);

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date() }, error: null });
});

// ── Static frontend (production / Docker single-service deployment) ──────────
// When the frontend is built into the sibling 'public/' directory (as the
// Dockerfile does), Express serves it here so the whole app runs on one port.
// This block must come before the notFound handler so that React Router paths
// (e.g. /stats, /sessions) serve index.html rather than a JSON 404.
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  const indexPath = path.join(publicDir, 'index.html');
  // Read index.html once at startup into memory so the route handler never
  // performs file I/O on every request (also makes it cache-friendly).
  const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : null;
  app.use(express.static(publicDir));
  // SPA fallback: any request that doesn't start with /api gets index.html so
  // that React Router can handle client-side navigation.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (!indexHtml) return next();
    res.type('html').send(indexHtml);
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
