import { createRuntime } from '../server/runtime.js';
let runtime;
export default async function handler(req, res) {
  try {
    const internalPath =
      req.query?.__portal_path ??
      new URL(req.url, 'http://localhost').searchParams.get('__portal_path');
    if (typeof internalPath === 'string') {
      const query = new URL(req.url, 'http://localhost').searchParams;
      query.delete('__portal_path');
      req.url = `/api/${internalPath}${query.size ? `?${query}` : ''}`;
    }
    runtime ||= createRuntime().catch((error) => {
      runtime = undefined;
      throw error;
    });
    const { app } = await runtime;
    return app(req, res);
  } catch (error) {
    console.error('Runtime initialization failed:', error.code || error.name);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Database is temporarily unavailable. Please try again.' }));
  }
}
