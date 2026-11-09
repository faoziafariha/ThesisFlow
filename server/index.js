import { createRuntime } from './runtime.js';
const { app, db } = await createRuntime();
const server = app.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () =>
  console.log(`ThesisFlow API listening on port ${process.env.PORT || 3000}`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () =>
    server.close(async () => {
      await db.close();
      process.exit(0);
    }),
  );
