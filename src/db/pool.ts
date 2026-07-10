import { Pool } from "pg";

let pool: Pool | null = null;

/**
 * Single shared connection pool, built lazily from DATABASE_URL so that
 * importing this module has no side effects when the app boots with the
 * in-memory repository instead.
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
