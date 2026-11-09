import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64));
}
export function openDatabase(path, { seed = true, password = 'DemoPass!2026' } = {}) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('student','supervisor','admin')),approved INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY,title TEXT NOT NULL,abstract TEXT NOT NULL,area TEXT NOT NULL,student_id INTEGER NOT NULL REFERENCES users(id),supervisor_id INTEGER NOT NULL REFERENCES users(id),status TEXT NOT NULL DEFAULT 'Proposed',progress INTEGER NOT NULL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS submissions(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL REFERENCES projects(id),title TEXT NOT NULL,filename TEXT NOT NULL,content BLOB NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY,project_id INTEGER NOT NULL REFERENCES projects(id),author_id INTEGER NOT NULL REFERENCES users(id),comment TEXT NOT NULL,decision TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS deadlines(id INTEGER PRIMARY KEY,title TEXT NOT NULL,due_date TEXT NOT NULL,description TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),message TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,user_id INTEGER REFERENCES users(id),action TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 PRAGMA user_version=1;`);
  if (seed && !db.prepare('SELECT id FROM users LIMIT 1').get()) {
    const add = db.prepare(
      'INSERT INTO users(name,email,password,role,approved) VALUES(?,?,?,?,?)',
    );
    for (const [name, email, role, approved] of [
      ['Amina Rahman', 'student@demo.thesisflow.app', 'student', 1],
      ['Dr. Samiha Ahmed', 'supervisor@demo.thesisflow.app', 'supervisor', 1],
      ['Academic Coordinator', 'admin@demo.thesisflow.app', 'admin', 1],
      ['Rafi Hasan', 'rafi@demo.thesisflow.app', 'student', 1],
      ['Dr. Nabil Karim', 'nabil@demo.thesisflow.app', 'supervisor', 1],
      ['Maya Das', 'maya@demo.thesisflow.app', 'student', 0],
    ])
      add.run(name, email, hashPassword(password), role, approved);
    const p = db.prepare(
      'INSERT INTO projects(title,abstract,area,student_id,supervisor_id,status,progress) VALUES(?,?,?,?,?,?,?)',
    );
    p.run(
      'Bengali sign language recognition',
      'An accessible computer vision system translating Bengali sign language into text. The study evaluates lightweight models for real-time use on everyday devices.',
      'Machine Learning',
      1,
      2,
      'In progress',
      65,
    );
    p.run(
      'Smart campus energy monitoring',
      'A low-cost sensor network to measure classroom energy use and recommend efficiency improvements.',
      'Internet of Things',
      4,
      2,
      'Proposed',
      10,
    );
    p.run(
      'Privacy-preserving health analytics',
      'An investigation of federated learning for distributed clinical data, using synthetic datasets.',
      'Data Science',
      1,
      5,
      'Approved',
      30,
    );
    db.prepare('INSERT INTO reviews(project_id,author_id,comment,decision) VALUES(1,2,?,?)').run(
      'The baseline looks promising. Please include a comparison of model performance under different lighting conditions.',
      'In progress',
    );
    const now = new Date();
    for (const [days, title, description] of [
      [
        7,
        'Literature review submission',
        'Submit your annotated review and research gap analysis.',
      ],
      [
        14,
        'Mid-term progress presentation',
        'Prepare a 10-minute presentation with preliminary results.',
      ],
      [30, 'Final proposal defense', 'Upload the revised proposal before your defense.'],
    ]) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() + days);
      db.prepare('INSERT INTO deadlines(title,due_date,description) VALUES(?,?,?)').run(
        title,
        d.toISOString().slice(0, 10),
        description,
      );
    }
    db.prepare('INSERT INTO notifications(user_id,message) VALUES(1,?)').run(
      'Dr. Samiha Ahmed left feedback on your sign language project.',
    );
  }
  db.batch = (statements) => {
    db.exec('BEGIN');
    try {
      for (const { sql, args } of statements) db.prepare(sql).run(...args);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  return db;
}
