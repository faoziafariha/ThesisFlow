import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes, createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { verifyPassword } from './db.js';
const digest = (t) => createHash('sha256').update(t).digest('hex');
export function createApp(
  db,
  {
    demo = true,
    production = false,
    staticDir = resolve('dist'),
    frontendOrigin = process.env.FRONTEND_ORIGIN,
  } = {},
) {
  const app = express();
  app.disable('x-powered-by');
  if (production) app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: '3mb' }));
  app.use((req, _res, next) => {
    req.body ??= {};
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.get('sec-fetch-site') === 'cross-site'
    )
      return res.status(403).json({ error: 'Cross-site request rejected' });
    const origin = req.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== req.get('host') && origin !== frontendOrigin)
          return res.status(403).json({ error: 'Origin rejected' });
      } catch {
        return res.status(403).json({ error: 'Origin rejected' });
      }
    }
    next();
  });
  app.use(
    '/api',
    rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
  );
  const safe = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    approved: !!u.approved,
  });
  const audit = async (u, action) =>
    await db.prepare('INSERT INTO audit(user_id,action) VALUES(?,?)').run(u.id, action);
  async function session(res, u) {
    const token = randomBytes(32).toString('hex');
    await db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    await db
      .prepare('INSERT INTO sessions VALUES(?,?,?)')
      .run(digest(token), u.id, Date.now() + 8 * 3600000);
    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: production,
      maxAge: 8 * 3600000,
      path: '/',
    });
    res.json({ user: safe(u) });
  }
  app.get('/api/health', async (_req, res) => {
    await db.prepare('SELECT 1').get();
    res.json({ status: 'ok', service: 'thesisflow' });
  });
  app.get('/api/config', (_req, res) => res.json({ demo }));
  const loginLimit = rateLimit({
    windowMs: 900000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  app.post('/api/auth/demo', loginLimit, async (req, res) => {
    if (!demo) return res.status(404).json({ error: 'Demo access disabled' });
    if (!['student', 'supervisor', 'admin'].includes(req.body.role))
      return res.status(400).json({ error: 'Choose a role' });
    const u = await db
      .prepare('SELECT * FROM users WHERE role=? AND approved=1 ORDER BY id LIMIT 1')
      .get(req.body.role);
    if (!u) return res.status(404).json({ error: 'Demo account unavailable' });
    await session(res, u);
  });
  app.post('/api/auth/login', loginLimit, async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256)
      return res.status(400).json({ error: 'Email and password required' });
    const u = await db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase().trim());
    if (!u || !verifyPassword(password, u.password))
      return res.status(401).json({ error: 'Invalid email or password' });
    if (!u.approved) return res.status(403).json({ error: 'Account awaiting approval' });
    await session(res, u);
  });
  app.use('/api', async (req, res, next) => {
    const token = req.headers.cookie
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('session='))
      ?.slice(8);
    const u =
      token &&
      (await db
        .prepare(
          'SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?',
        )
        .get(digest(token), Date.now()));
    if (!u || !u.approved) return res.status(401).json({ error: 'Please sign in' });
    req.user = u;
    next();
  });
  const role =
    (...roles) =>
    (req, res, next) =>
      roles.includes(req.user.role)
        ? next()
        : res.status(403).json({ error: 'Your role cannot perform this action' });
  const visible = (u, p) =>
    p &&
    (u.role === 'admin' ||
      (u.role === 'student' ? p.student_id === u.id : p.supervisor_id === u.id));
  const project = async (id) => await db.prepare('SELECT * FROM projects WHERE id=?').get(id);
  const text = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.length <= max;
  app.get('/api/auth/me', (req, res) => res.json({ user: safe(req.user) }));
  app.post('/api/auth/logout', async (req, res) => {
    const token = req.headers.cookie
      ?.split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('session='))
      ?.slice(8);
    if (token) await db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));
    res.clearCookie('session', { path: '/', httpOnly: true, sameSite: 'lax', secure: production });
    res.json({ ok: true });
  });
  app.get('/api/workspace', async (req, res) => {
    const u = req.user;
    const where =
      u.role === 'admin' ? '1=1' : u.role === 'student' ? 'p.student_id=?' : 'p.supervisor_id=?';
    const params = u.role === 'admin' ? [] : [u.id];
    const projects = await db
      .prepare(
        `SELECT p.*,s.name student,v.name supervisor FROM projects p JOIN users s ON s.id=p.student_id JOIN users v ON v.id=p.supervisor_id WHERE ${where} ORDER BY p.id DESC`,
      )
      .all(...params);
    const ids = new Set(projects.map((p) => p.id));
    res.json({
      user: safe(u),
      projects,
      supervisors: await db
        .prepare("SELECT id,name,email FROM users WHERE role='supervisor' AND approved=1")
        .all(),
      reviews: (
        await db
          .prepare(
            'SELECT r.*,u.name author FROM reviews r JOIN users u ON u.id=r.author_id ORDER BY r.id DESC',
          )
          .all()
      ).filter((r) => ids.has(r.project_id)),
      submissions: (
        await db
          .prepare(
            'SELECT id,project_id,title,filename,created_at FROM submissions ORDER BY id DESC',
          )
          .all()
      ).filter((s) => ids.has(s.project_id)),
      deadlines: await db.prepare('SELECT * FROM deadlines ORDER BY due_date').all(),
      notifications: await db
        .prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 20')
        .all(u.id),
      users:
        u.role === 'admin'
          ? await db.prepare('SELECT id,name,email,role,approved FROM users ORDER BY id').all()
          : [],
      audit:
        u.role === 'admin'
          ? await db
              .prepare(
                'SELECT a.*,u.name FROM audit a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 30',
              )
              .all()
          : [],
    });
  });
  app.post('/api/projects', role('student'), async (req, res) => {
    const { title, abstract, area, supervisor_id } = req.body;
    if (
      !text(title, 8, 160) ||
      !text(abstract, 30, 5000) ||
      !text(area, 2, 80) ||
      !Number.isInteger(supervisor_id) ||
      !(await db
        .prepare("SELECT id FROM users WHERE id=? AND role='supervisor' AND approved=1")
        .get(supervisor_id))
    )
      return res.status(400).json({
        error: 'Enter a title (8–160 characters), abstract (30–5000), area and approved supervisor',
      });
    const result = await db
      .prepare(
        'INSERT INTO projects(title,abstract,area,student_id,supervisor_id) VALUES(?,?,?,?,?)',
      )
      .run(title.trim(), abstract.trim(), area.trim(), req.user.id, supervisor_id);
    await db
      .prepare('INSERT INTO notifications(user_id,message) VALUES(?,?)')
      .run(supervisor_id, `New proposal: ${title.trim()}`);
    await audit(req.user, 'Created proposal');
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  });
  app.patch('/api/projects/:id/progress', role('student'), async (req, res) => {
    const p = await project(req.params.id);
    if (!visible(req.user, p)) return res.status(404).json({ error: 'Project not found' });
    if (!['Approved', 'In progress'].includes(p.status))
      return res.status(409).json({ error: 'Progress can change after proposal approval' });
    const { progress } = req.body;
    if (!Number.isInteger(progress) || progress < 0 || progress > 100)
      return res.status(400).json({ error: 'Progress must be 0–100' });
    await db
      .prepare("UPDATE projects SET progress=?,status='In progress' WHERE id=?")
      .run(progress, p.id);
    await audit(req.user, 'Updated project progress');
    res.json({ ok: true });
  });
  app.post('/api/projects/:id/reviews', role('supervisor'), async (req, res) => {
    const p = await project(req.params.id);
    if (!visible(req.user, p)) return res.status(404).json({ error: 'Project not found' });
    const { comment, decision } = req.body;
    if (
      !text(comment, 5, 3000) ||
      !['Approved', 'Changes requested', 'In progress', 'Completed'].includes(decision)
    )
      return res.status(400).json({ error: 'Provide feedback and a valid decision' });
    await db.batch([
      {
        sql: 'INSERT INTO reviews(project_id,author_id,comment,decision) VALUES(?,?,?,?)',
        args: [p.id, req.user.id, comment.trim(), decision],
      },
      {
        sql: 'UPDATE projects SET status=?,progress=? WHERE id=?',
        args: [decision, decision === 'Completed' ? 100 : p.progress, p.id],
      },
      {
        sql: 'INSERT INTO notifications(user_id,message) VALUES(?,?)',
        args: [p.student_id, `Feedback on ${p.title}: ${decision}`],
      },
      {
        sql: 'INSERT INTO audit(user_id,action) VALUES(?,?)',
        args: [req.user.id, `Reviewed project ${p.id}`],
      },
    ]);
    res.status(201).json({ ok: true });
  });
  app.post('/api/projects/:id/submissions', role('student'), async (req, res) => {
    const p = await project(req.params.id);
    if (!visible(req.user, p)) return res.status(404).json({ error: 'Project not found' });
    const { title, filename, content } = req.body;
    if (
      !text(title, 3, 120) ||
      !text(filename, 1, 160) ||
      !filename.toLowerCase().endsWith('.pdf') ||
      typeof content !== 'string' ||
      content.length > 2800000 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(content)
    )
      return res.status(400).json({ error: 'Provide a title and PDF up to 2 MB' });
    const data = Buffer.from(content, 'base64');
    if (data.length > 2097152 || data.subarray(0, 5).toString() !== '%PDF-')
      return res.status(400).json({ error: 'A valid PDF up to 2 MB is required' });
    await db
      .prepare('INSERT INTO submissions(project_id,title,filename,content) VALUES(?,?,?,?)')
      .run(p.id, title.trim(), filename.replace(/[^a-zA-Z0-9._-]/g, '_'), data);
    await db
      .prepare('INSERT INTO notifications(user_id,message) VALUES(?,?)')
      .run(p.supervisor_id, `New submission for ${p.title}`);
    await audit(req.user, `Submitted document for project ${p.id}`);
    res.status(201).json({ ok: true });
  });
  app.get('/api/submissions/:id/download', async (req, res) => {
    const s = await db.prepare('SELECT * FROM submissions WHERE id=?').get(req.params.id);
    if (!s || !visible(req.user, await project(s.project_id)))
      return res.status(404).json({ error: 'Document not found' });
    res
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${s.filename}"`,
      })
      .send(Buffer.from(s.content));
  });
  app.post('/api/deadlines', role('admin'), async (req, res) => {
    const { title, due_date, description } = req.body;
    if (
      !text(title, 3, 120) ||
      !text(description, 3, 1000) ||
      typeof due_date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(due_date) ||
      !Number.isFinite(Date.parse(due_date)) ||
      new Date(due_date).toISOString().slice(0, 10) !== due_date
    )
      return res.status(400).json({ error: 'Enter a title, description and valid date' });
    await db
      .prepare('INSERT INTO deadlines(title,due_date,description) VALUES(?,?,?)')
      .run(title.trim(), due_date, description.trim());
    await audit(req.user, 'Created academic deadline');
    res.status(201).json({ ok: true });
  });
  app.patch('/api/users/:id/approve', role('admin'), async (req, res) => {
    const target = await db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    await db.prepare('UPDATE users SET approved=1 WHERE id=?').run(target.id);
    await audit(req.user, `Approved account ${target.id}`);
    res.json({ ok: true });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));
  app.use(express.static(staticDir));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(staticDir, 'index.html')));
  app.use((err, _req, res, _next) => {
    if (err.status === 413) return res.status(413).json({ error: 'Upload exceeds 2 MB limit' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });
  return app;
}
