import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

// Augment Express's Request type so `req.user` is typed everywhere downstream.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies the Bearer token on the Authorization header, then attaches the
 * decoded payload to `req.user` before calling next(). Rejects the request
 * with 401 (missing/malformed token) or 403 (invalid/expired token).
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET is not set in the environment');
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;

    if (typeof decoded === 'string' || !decoded.id) {
      res.status(403).json({ error: 'Invalid token payload' });
      return;
    }

    req.user = decoded as AuthUser;
    next();
  } catch (err) {
    logger.warn('JWT verification failed', err);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}
