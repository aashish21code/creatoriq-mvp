import { Router, Request, Response } from 'express';

export const router = Router();

// GET /health — lightweight liveness check for this router.
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// GET /api/test — sanity-check endpoint for verifying the API is reachable.
router.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'CreatorIQ API test endpoint working', timestamp: new Date().toISOString() });
});
