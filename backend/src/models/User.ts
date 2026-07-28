import { query } from '../config/database';

export interface User {
  id: number;
  email: string;
  auth0_id: string;
  name: string | null;
  niche: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Auth0Profile {
  auth0Id: string;
  email: string;
  name?: string;
}

export async function findByAuth0Id(auth0Id: string): Promise<User | null> {
  const result = await query<User>('SELECT * FROM users WHERE auth0_id = $1', [auth0Id]);
  return result.rows[0] ?? null;
}

/**
 * Creates a user from an Auth0 profile, or updates the email/name of an
 * existing one. `niche` is app-specific (collected during onboarding, not
 * part of the Auth0 profile) so it's only ever set on insert, never
 * overwritten by subsequent logins.
 */
export async function upsertFromAuth0Profile(profile: Auth0Profile): Promise<User> {
  const result = await query<User>(
    `INSERT INTO users (auth0_id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (auth0_id)
     DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW()
     RETURNING *`,
    [profile.auth0Id, profile.email, profile.name ?? null]
  );
  return result.rows[0];
}
