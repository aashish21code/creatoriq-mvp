import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { upsertFromAuth0Profile } from '../models/User';
import { logger } from '../utils/logger';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const AUTH0_CALLBACK_URL = process.env.AUTH0_CALLBACK_URL;
const AUTH0_LOGOUT_RETURN_TO = process.env.AUTH0_LOGOUT_RETURN_TO;

interface Auth0TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface Auth0IdTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  [claim: string]: unknown;
}

function requireAuth0Config(res: Response): boolean {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
    logger.error('Auth0 environment variables are not fully configured');
    res.status(500).json({ error: 'Server misconfiguration' });
    return false;
  }
  return true;
}

/**
 * Exchanges a grant (password or authorization_code) for tokens via Auth0's
 * /oauth/token endpoint. Shared by login and callback since both need the
 * same request/error handling shape, only the grant payload differs.
 */
async function exchangeToken(payload: Record<string, string>): Promise<Auth0TokenResponse> {
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as Auth0TokenResponse & { error?: string; error_description?: string };

  if (!response.ok) {
    throw new Error(body.error_description || body.error || 'Auth0 token exchange failed');
  }

  return body;
}

/**
 * The id_token was issued directly by Auth0 over this same HTTPS request,
 * so it's decoded (not re-verified) here — there's no untrusted transport
 * in between. Tokens presented later by a client on other routes go through
 * verifyAuth0Token, which does verify the signature.
 */
function decodeProfile(idToken: string): Auth0IdTokenPayload {
  return jwt.decode(idToken) as Auth0IdTokenPayload;
}

/**
 * POST /auth/login
 * Body: { email, password }
 * Exchanges user credentials for tokens via Auth0's Resource Owner Password
 * Grant, then upserts the local user record from the returned profile.
 */
export async function login(req: Request, res: Response): Promise<void> {
  if (!requireAuth0Config(res)) return;

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  try {
    const tokens = await exchangeToken({
      grant_type: 'password',
      username: email,
      password,
      client_id: AUTH0_CLIENT_ID!,
      client_secret: AUTH0_CLIENT_SECRET!,
      audience: AUTH0_AUDIENCE ?? '',
      scope: 'openid profile email',
    });

    const profile = tokens.id_token ? decodeProfile(tokens.id_token) : null;
    const user = profile
      ? await upsertFromAuth0Profile({ auth0Id: profile.sub, email: profile.email ?? email, name: profile.name })
      : null;

    res.json({
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      user,
    });
  } catch (err) {
    logger.warn('Login failed', err);
    res.status(401).json({ error: err instanceof Error ? err.message : 'Login failed' });
  }
}

/**
 * POST /auth/callback
 * Body: { code }
 * Exchanges an Auth0 authorization code (obtained by the frontend via
 * Universal Login / Authorization Code flow) for tokens. Kept server-side
 * so the client secret never reaches the browser.
 */
export async function callback(req: Request, res: Response): Promise<void> {
  if (!requireAuth0Config(res)) return;

  const { code } = req.body ?? {};
  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  if (!AUTH0_CALLBACK_URL) {
    logger.error('AUTH0_CALLBACK_URL is not set in the environment');
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    const tokens = await exchangeToken({
      grant_type: 'authorization_code',
      client_id: AUTH0_CLIENT_ID!,
      client_secret: AUTH0_CLIENT_SECRET!,
      code,
      redirect_uri: AUTH0_CALLBACK_URL,
    });

    const profile = tokens.id_token ? decodeProfile(tokens.id_token) : null;
    const user = profile
      ? await upsertFromAuth0Profile({ auth0Id: profile.sub, email: profile.email ?? '', name: profile.name })
      : null;

    res.json({
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      user,
    });
  } catch (err) {
    logger.warn('Auth0 callback exchange failed', err);
    res.status(401).json({ error: err instanceof Error ? err.message : 'Callback exchange failed' });
  }
}

/**
 * GET /auth/logout
 * Redirects to Auth0's logout endpoint, which clears the Auth0 session and
 * redirects back to AUTH0_LOGOUT_RETURN_TO.
 */
export function logout(_req: Request, res: Response): void {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_LOGOUT_RETURN_TO) {
    logger.error('Auth0 logout environment variables are not fully configured');
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  const logoutUrl = new URL(`https://${AUTH0_DOMAIN}/v2/logout`);
  logoutUrl.searchParams.set('client_id', AUTH0_CLIENT_ID);
  logoutUrl.searchParams.set('returnTo', AUTH0_LOGOUT_RETURN_TO);

  res.redirect(logoutUrl.toString());
}
