import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import handler from '../api/index.js';
let server, base;
before(async () => {
  process.env.DATABASE_PATH = ':memory:';
  process.env.DEMO_MODE = 'true';
  process.env.NODE_ENV = 'development';
  server = createServer(handler).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api?__portal_path=`;
});
after(() => server.close());
test('serverless rewrite preserves API routing and session state', async () => {
  const health = await fetch(base + 'health', { signal: AbortSignal.timeout(10000) });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  const login = await fetch(base + 'auth/demo', {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const workspace = await fetch(base + 'workspace', {
    signal: AbortSignal.timeout(10000),
    headers: { cookie },
  });
  assert.equal(workspace.status, 200);
  assert.equal((await workspace.json()).user.role, 'student');
});
