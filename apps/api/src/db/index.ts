import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { loadConfig } from '../config.js';
import * as schema from './schema.js';

const config = loadConfig();

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export { schema };
