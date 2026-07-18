import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, pool } from './index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
// Works from both src/ (tsx) and dist/ (node) — drizzle/ sits at the app root.
const migrationsFolder = path.resolve(here, '..', '..', 'drizzle');

async function main() {
  await migrate(db, { migrationsFolder });
  console.log('Migrations applied');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
