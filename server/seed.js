import { hashPassword } from './db.js';
export async function seedDatabase(db, password) {
  if (await db.prepare('SELECT id FROM users LIMIT 1').get()) return;
  const add = db.prepare('INSERT INTO users(name,email,password,role,approved) VALUES(?,?,?,?,?)');
  for (const [name, email, role, approved] of [
    ['Amina Rahman', 'student@demo.thesisflow.app', 'student', 1],
    ['Dr. Samiha Ahmed', 'supervisor@demo.thesisflow.app', 'supervisor', 1],
    ['Academic Coordinator', 'admin@demo.thesisflow.app', 'admin', 1],
    ['Rafi Hasan', 'rafi@demo.thesisflow.app', 'student', 1],
    ['Dr. Nabil Karim', 'nabil@demo.thesisflow.app', 'supervisor', 1],
    ['Maya Das', 'maya@demo.thesisflow.app', 'student', 0],
  ])
    await add.run(name, email, hashPassword(password), role, approved);
  const p = db.prepare(
    'INSERT INTO projects(title,abstract,area,student_id,supervisor_id,status,progress) VALUES(?,?,?,?,?,?,?)',
  );
  await p.run(
    'Bengali sign language recognition',
    'An accessible computer vision system translating Bengali sign language into text. The study evaluates lightweight models for real-time use on everyday devices.',
    'Machine Learning',
    1,
    2,
    'In progress',
    65,
  );
  await p.run(
    'Smart campus energy monitoring',
    'A low-cost sensor network to measure classroom energy use and recommend efficiency improvements.',
    'Internet of Things',
    4,
    2,
    'Proposed',
    10,
  );
  await p.run(
    'Privacy-preserving health analytics',
    'An investigation of federated learning for distributed clinical data, using synthetic datasets.',
    'Data Science',
    1,
    5,
    'Approved',
    30,
  );
  await db
    .prepare('INSERT INTO reviews(project_id,author_id,comment,decision) VALUES(1,2,?,?)')
    .run(
      'The baseline looks promising. Please include a comparison of model performance under different lighting conditions.',
      'In progress',
    );
  const now = new Date();
  for (const [days, title, description] of [
    [7, 'Literature review submission', 'Submit your annotated review and research gap analysis.'],
    [
      14,
      'Mid-term progress presentation',
      'Prepare a 10-minute presentation with preliminary results.',
    ],
    [30, 'Final proposal defense', 'Upload the revised proposal before your defense.'],
  ]) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + days);
    await db
      .prepare('INSERT INTO deadlines(title,due_date,description) VALUES(?,?,?)')
      .run(title, d.toISOString().slice(0, 10), description);
  }
  await db
    .prepare('INSERT INTO notifications(user_id,message) VALUES(1,?)')
    .run('Dr. Samiha Ahmed left feedback on your sign language project.');
}
