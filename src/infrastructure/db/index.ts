import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

export async function createDb(config: { DATABASE_URL: string }) {
  const pool = mysql.createPool({
    uri: config.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60_000,
    queueLimit: 0,
  });

  const db = drizzle(pool, { schema, mode: 'default' });
  return db;
}

export type Database = Awaited<ReturnType<typeof createDb>>;
export * from './schema';
