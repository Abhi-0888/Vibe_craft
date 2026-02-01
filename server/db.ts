
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export let pool: pg.Pool | null = null;
export let db: any = null;
export let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) return { db, pool };

  if (!connectionString) {
    console.warn("DATABASE_URL not set. Running in in-memory mode.");
    isInitialized = true;
    return { db: null, pool: null };
  }

  try {
    console.log("Creating database connection pool...");
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase.co") || connectionString.includes("pooler.supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 10000, // Increased to 10s for slower networks
      idleTimeoutMillis: 30000,
      max: 10,
    });

    pool.on('error', (err) => {
      console.error('Background Database Pool Error:', err.message);
    });

    console.log("Probing database connectivity (10s timeout)...");
    const client = await pool.connect();
    console.log("Database connectivity verified.");
    client.release();

    db = drizzle(pool, { schema });
    console.log("Drizzle adapter initialized successfully.");
  } catch (error: any) {
    console.error("⚠️ DATABASE PROBE FAILED. Falling back to in-memory mode.");
    console.error(`Status: ${error.code || 'UNKNOWN'} - ${error.message}`);
    console.error("Please check your DATABASE_URL and network connectivity.");
    pool = null;
    db = null;
  } finally {
    isInitialized = true;
  }

  return { db, pool };
}
