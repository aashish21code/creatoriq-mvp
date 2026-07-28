import { Request, Response, NextFunction } from 'express';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from '../utils/logger';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

// Auth0 access tokens are signed with RS256, so verification needs Auth0's
// public signing key rather than a shared secret — jwks-rsa fetches and
// caches it from Auth0's JWKS endpoint.
const client = AUTH0_DOMAIN
  ? jwksClient({
      jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    })
  : null;

function getSigningKey(header: JwtHeader, callback: SigningKeyCallback): void {
  if (!client || !header.kid) {
    callback(new Error('JWKS client not configured or token missing kid'));
    return;
  }

  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err ?? new Error('Signing key not found'));
      return;
    }
    callback(null, key.getPublicKey());
  });
}

/**
 * Verifies an Auth0-issued access token (Bearer header) against Auth0's
 * JWKS, then attaches the token payload to `req.user`.
 */
export function verifyAuth0Token(req: Request, res: Response, next: NextFunction): void {
  if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
    logger.error('AUTH0_DOMAIN or AUTH0_AUDIENCE is not set in the environment');
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  jwt.verify(
    token,
    getSigningKey,
    {
      audience: AUTH0_AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    },
    (err, decoded) => {
      if (err || typeof decoded === 'string' || !decoded) {
        logger.warn('Auth0 token verification failed', err);
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = { id: String(decoded.sub), ...decoded };
      next();
    }
  );
}
