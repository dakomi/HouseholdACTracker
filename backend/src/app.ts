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

app.use(notFound);
app.use(errorHandler);

export default app;
