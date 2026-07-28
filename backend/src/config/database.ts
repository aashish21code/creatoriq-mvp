import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

// DATABASE_URL is required — e.g. postgresql://user:password@localhost:5432/creatoriq
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the environment');
}

export const pool = new Pool({
  connectionString,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30s
  connectionTimeoutMillis: 5000, // fail fast if a connection can't be established
});

// Idle clients emit 'error' on unexpected backend disconnects — without this
// handler an uncaught error here would crash the process.
pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Verifies the pool can reach the database. Call this once at startup so
 * connectivity problems surface immediately instead of on the first request.
 */
export async function testConnection(): Promise<void> {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    logger.info('PostgreSQL connection established');
  } catch (err) {
    logger.error('Failed to connect to PostgreSQL', err);
    throw err;
  } finally {
    client?.release();
  }
}

/**
 * Thin query helper so callers don't need to import `pool` directly.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  try {
    return await pool.query<T>(text, params);
  } catch (err) {
    logger.error(`Query failed: ${text}`, err);
    throw err;
  }
}
