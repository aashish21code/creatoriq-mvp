// Must run before any local module that reads process.env at import time
// (e.g. config/database.ts) — import order among `import` statements is
// preserved even though TS hoists them above other top-level statements.
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { router } from './routes';
import { authRouter } from './routes/auth';
import { testConnection } from './config/database';
import { logger } from './utils/logger';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Primary health check required for uptime/monitoring checks.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'creatoriq-backend', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use(router);

// 404 handler — must come after all routes.
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler — must be registered last and take 4 args
// for Express to recognize it as an error middleware.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start(): Promise<void> {
  try {
    await testConnection();
  } catch (err) {
    logger.error('Startup aborted: database connection failed', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

start();
