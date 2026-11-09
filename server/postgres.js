import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { seedDatabase } from './seed.js';

function parameters(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}
function rows(result) {
  return result.rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value !== null && (key === 'id' || key.endsWith('_id')) ? Number(value) : value,
      ]),
    ),
  );
}
function adapter(executor) {
  return {
    prepare(sql) {
      return {
        async get(...args) {
          return rows(await executor.query(parameters(sql), args))[0];
        },
        async all(...args) {
          return rows(await executor.query(parameters(sql), args));
        },
        async run(...args) {
          const insert =
            /^\s*INSERT\s+INTO\s+(users|projects|submissions|reviews|deadlines|notifications|audit)\b/i.test(
              sql,
            );
          const query =
            parameters(sql) + (insert && !/\bRETURNING\b/i.test(sql) ? ' RETURNING id' : '');
          const result = await executor.query(query, args);
          return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
        },
      };
    },
  };
}
export async function openPostgres(connectionString, { password = 'DemoPass!2026', schema } = {}) {
  if (schema && !/^test_[a-z0-9_]+$/.test(schema)) throw new Error('Invalid test schema');
  const pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    ...(schema ? { options: `-c search_path=${schema}` } : {}),
  });
  pool.on('error', (error) =>
    console.error('Database pool error:', error.code || 'connection failure'),
  );
  const db = adapter(pool);
  db.batch = async (statements) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { sql, args } of statements)
        await adapter(client)
          .prepare(sql)
          .run(...args);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  };
  db.close = () => pool.end();
  db.dropTestSchema = async () => {
    if (!schema) throw new Error('Only test schemas may be dropped');
    await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
  };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('thesisflow-schema-v1'))");
    if (schema) await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    const migration = await readFile(
      new URL('./migrations/001-postgres.sql', import.meta.url),
      'utf8',
    );
    await client.query(migration);
    await seedDatabase(adapter(client), password);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    await pool.end();
    throw error;
  }
  client.release();
  return db;
}
