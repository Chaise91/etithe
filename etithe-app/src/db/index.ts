import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return new Pool({
    connectionString: url,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}

// Lazy singleton — pool is only created on first call, not at module load.
// This prevents Next.js build failures when DATABASE_URL is absent.
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = createPool();
  }
  return _pool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export type Db = ReturnType<typeof getDb>;
