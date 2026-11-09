# Deploying with Vercel

Repository: https://github.com/faoziafariha/ThesisFlow

## What can be deployed as-is?

The React/Vite frontend can be built on Vercel (`npm run build`, output `dist`). The full application currently needs its Express API and a persistent SQLite disk. A frontend-only deployment would display the page but login and every data workflow would fail without API routing.

Vercel Functions do not provide persistent local SQLite storage. Do not move the database to `/tmp` as a workaround: users, sessions and submissions would be lost or inconsistent between instances. Vercel also does not deploy the included Compose stack as a normal Vite project.

Official documentation: https://vercel.com/kb/guide/is-sqlite-supported-in-vercel and https://vercel.com/docs/frameworks/backend/express

## Recommended next deployment

1. Deploy this repository's Docker backend on Render with the persistent disk in `render.yaml`, following `DEPLOYMENT.md`. Verify its `/api/health` endpoint.
2. Create a Vercel project by importing `faoziafariha/ThesisFlow`. Use repository root `.`, Vite, build command `npm run build`, output directory `dist`, and Node.js 24.
3. Before activating the frontend, configure a same-origin `/api/*` reverse-proxy rewrite to your real backend URL. Keep the API rewrite ahead of any SPA fallback. The browser code deliberately uses relative `/api` URLs and HttpOnly session cookies.
4. Update the API's origin policy to allow the exact production Vercel origin, using a server-side allowlist. The current API rejects foreign origins intentionally. Do not remove that check or add wildcard credential access. Preview deployment origins should be explicitly reviewed rather than implicitly trusted.
5. Test login, cookie persistence after reload, all three demo roles, PDF upload/download, reviews and logout on the final HTTPS Vercel URL before adding it to your CV.

Example rewrite structure (replace the backend hostname before use):

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-BACKEND.onrender.com/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

This is a planning example, not an active `vercel.json`; a hostname and the corresponding backend origin-policy change are still required. Avoid deploying the frontend alone and describing it as a working full-stack demo.

## Alternative: entire application on Vercel

First replace local SQLite with a hosted database (for example PostgreSQL), make database queries asynchronous, move uploaded PDFs into object storage or a suitable external database, and export an Express application using Vercel's supported server entry point. Keep sessions in shared durable storage. Re-test the existing authorization, document and browser workflows after that migration. This is a separate implementation task, not a configuration-only deployment.

## CI/CD distinction

The included GitHub Actions workflow tests the app and publishes a Docker image. Its optional SSH deployment job targets a VPS. A Vercel Git integration is a separate deployment route; configure Vercel deployment checks if you want publication to wait for GitHub quality checks. A green frontend build alone does not verify API/database connectivity.
