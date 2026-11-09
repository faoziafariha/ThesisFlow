import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';
let db, server, base;
const cookies = {};
before(async () => {
  db = openDatabase(':memory:');
  server = createApp(db).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
  for (const role of ['student', 'supervisor', 'admin']) {
    const r = await fetch(base + '/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    assert.equal(r.status, 200);
    cookies[role] = r.headers.get('set-cookie').split(';')[0];
  }
});
after(() => {
  server.close();
  db.close();
});
async function req(path, { role = 'student', method = 'GET', body, headers = {} } = {}) {
  const r = await fetch(base + path, {
    signal: AbortSignal.timeout(10000),
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies[role] ? { cookie: cookies[role] } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: r.status,
    data: r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text(),
  };
}
test('anonymous requests cannot access academic records', async () => {
  assert.equal((await req('/workspace', { role: 'anonymous' })).status, 401);
  assert.equal((await req('/health', { role: 'anonymous' })).status, 200);
});
test('login rejects invalid password and pending users', async () => {
  assert.equal(
    (
      await req('/auth/login', {
        method: 'POST',
        body: { email: 'student@demo.thesisflow.app', password: 'bad' },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await req('/auth/login', {
        method: 'POST',
        body: { email: 'maya@demo.thesisflow.app', password: 'DemoPass!2026' },
      })
    ).status,
    403,
  );
});
test('role scopes restrict visibility', async () => {
  const s = await req('/workspace');
  assert.ok(s.data.projects.every((p) => p.student === 'Amina Rahman'));
  assert.equal(s.data.users.length, 0);
  const v = await req('/workspace', { role: 'supervisor' });
  assert.ok(v.data.projects.every((p) => p.supervisor === 'Dr. Samiha Ahmed'));
  assert.equal((await req('/workspace', { role: 'admin' })).data.users.length, 6);
});
test('student creates a proposal and assigned supervisor reviews it', async () => {
  const r = await req('/projects', {
    method: 'POST',
    body: {
      title: 'Accessible campus navigation',
      abstract:
        'A mobile-first navigation study designed to make campus buildings more accessible.',
      area: 'Accessibility',
      supervisor_id: 2,
    },
  });
  assert.equal(r.status, 201);
  const id = r.data.id;
  assert.equal(
    (
      await req(`/projects/${id}/reviews`, {
        method: 'POST',
        body: { comment: 'Forged review', decision: 'Approved' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await req(`/projects/${id}/reviews`, {
        role: 'supervisor',
        method: 'POST',
        body: {
          comment: 'Good proposal. Please define your evaluation metrics.',
          decision: 'Approved',
        },
      })
    ).status,
    201,
  );
  assert.equal(
    (await req(`/projects/${id}/progress`, { method: 'PATCH', body: { progress: 45 } })).status,
    200,
  );
  const p = (await req('/workspace')).data.projects.find((p) => p.id === id);
  assert.equal(p.status, 'In progress');
  assert.equal(p.progress, 45);
});
test('ownership checks prevent cross-user writes and reviews', async () => {
  assert.equal(
    (await req('/projects/2/progress', { method: 'PATCH', body: { progress: 90 } })).status,
    404,
  );
  assert.equal(
    (
      await req('/projects/3/reviews', {
        role: 'supervisor',
        method: 'POST',
        body: { comment: 'Unauthorized review', decision: 'Completed' },
      })
    ).status,
    404,
  );
});
test('validation rejects malformed proposals, progress and dates', async () => {
  assert.equal((await req('/projects', { method: 'POST', body: { title: 'x' } })).status, 400);
  assert.equal(
    (await req('/projects/1/progress', { method: 'PATCH', body: { progress: 101 } })).status,
    400,
  );
  assert.equal(
    (
      await req('/deadlines', {
        role: 'admin',
        method: 'POST',
        body: { title: 'Defense', description: 'Final defense', due_date: '2027-02-31' },
      })
    ).status,
    400,
  );
});
test('PDF submissions preserve versions and protect downloads', async () => {
  const payload = {
    title: 'Research notes',
    filename: 'notes.pdf',
    content: Buffer.from('%PDF-1.4\nDemo test document\n%%EOF').toString('base64'),
  };
  assert.equal(
    (await req('/projects/1/submissions', { method: 'POST', body: payload })).status,
    201,
  );
  assert.equal(
    (await req('/projects/1/submissions', { method: 'POST', body: payload })).status,
    201,
  );
  const submissions = (await req('/workspace')).data.submissions.filter((s) => s.project_id === 1);
  assert.equal(submissions.length, 2);
  assert.equal(
    (await req(`/submissions/${submissions[0].id}/download`, { role: 'supervisor' })).status,
    200,
  );
  db.prepare('UPDATE submissions SET project_id=3 WHERE id=?').run(submissions[0].id);
  assert.equal(
    (await req(`/submissions/${submissions[0].id}/download`, { role: 'supervisor' })).status,
    404,
  );
  assert.equal(
    (
      await req('/projects/1/submissions', {
        method: 'POST',
        body: { ...payload, content: Buffer.from('<script>bad</script>').toString('base64') },
      })
    ).status,
    400,
  );
  assert.equal(
    (await req('/projects/2/submissions', { method: 'POST', body: payload })).status,
    404,
  );
});
test('only administrators approve accounts and create deadlines', async () => {
  assert.equal((await req('/users/6/approve', { method: 'PATCH' })).status, 403);
  assert.equal((await req('/users/6/approve', { role: 'admin', method: 'PATCH' })).status, 200);
  assert.equal(
    (await req('/deadlines', { role: 'supervisor', method: 'POST', body: {} })).status,
    403,
  );
  assert.equal(
    (
      await req('/deadlines', {
        role: 'admin',
        method: 'POST',
        body: {
          title: 'Proposal defense',
          description: 'Bring your revised proposal.',
          due_date: '2027-03-14',
        },
      })
    ).status,
    201,
  );
  assert.ok((await req('/workspace', { role: 'admin' })).data.audit.length > 0);
});
test('cross-origin writes are rejected', async () => {
  assert.equal(
    (
      await req('/projects', {
        method: 'POST',
        body: {},
        headers: { origin: 'https://attacker.example' },
      })
    ).status,
    403,
  );
});
test('logout revokes the server session', async () => {
  const r = await fetch(base + '/auth/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' }),
  });
  const cookie = r.headers.get('set-cookie').split(';')[0];
  assert.equal(
    (await fetch(base + '/auth/logout', { method: 'POST', headers: { cookie } })).status,
    200,
  );
  assert.equal((await fetch(base + '/workspace', { headers: { cookie } })).status, 401);
});
test('demo access can be disabled', async () => {
  const locked = createApp(db, { demo: false }).listen(0, '127.0.0.1');
  await new Promise((r) => locked.once('listening', r));
  try {
    assert.equal(
      (
        await fetch(`http://127.0.0.1:${locked.address().port}/api/auth/demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"role":"admin"}',
        })
      ).status,
      404,
    );
  } finally {
    locked.close();
  }
});
