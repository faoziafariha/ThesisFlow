import { createApp } from './app.js';
import { openDatabase } from './db.js';
import { openPostgres } from './postgres.js';
export async function createRuntime() {
  const production = process.env.NODE_ENV === 'production';
  const demo = process.env.DEMO_MODE !== 'false';
  if (production && !demo && !process.env.SEED_PASSWORD)
    throw new Error('Set SEED_PASSWORD when demo access is disabled');
  const password = process.env.SEED_PASSWORD || 'DemoPass!2026';
  if (process.env.VERCEL && !process.env.DATABASE_URL)
    throw new Error('Connect a PostgreSQL database before deploying to Vercel');
  const db = process.env.DATABASE_URL
    ? await openPostgres(process.env.DATABASE_URL, { password })
    : openDatabase(process.env.DATABASE_PATH || 'data/portal.sqlite', { password });
  return { db, app: createApp(db, { production, demo }) };
}
