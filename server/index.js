import { openDatabase } from './db.js';
import { createApp } from './app.js';
const production = process.env.NODE_ENV === 'production';
const demo = process.env.DEMO_MODE !== 'false';
if (production && !demo && !process.env.SEED_PASSWORD)
  throw new Error('Set SEED_PASSWORD when demo access is disabled');
const db = openDatabase(process.env.DATABASE_PATH || 'data/portal.sqlite', {
  password: process.env.SEED_PASSWORD || 'DemoPass!2026',
});
const server = createApp(db, { production, demo }).listen(
  Number(process.env.PORT) || 3000,
  '0.0.0.0',
  () => console.log(`ThesisFlow API listening on port ${process.env.PORT || 3000}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
