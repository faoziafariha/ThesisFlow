# Free Vercel + Neon deployment

The application supports SQLite for local/Docker development and PostgreSQL for durable Vercel hosting. The paid Render blueprint is only an alternative example at `docs/examples/render.paid.yaml`; it is not the selected route.

## Setup

1. Link/import `faoziafariha/ThesisFlow` into Vercel. Use Vite, Node.js 24, build `npm run build`, output `dist`.
2. Connect Neon using the **Free** plan in the linked project's Storage area. Review and accept marketplace terms yourself. Connect to Production. The integration supplies `DATABASE_URL` as a server-side secret. Never prefix it with `VITE_` or commit it.
3. Deploy. `vercel.json` routes API requests to `api/index.js` and serves the built frontend. The runtime initializes the PostgreSQL schema under a transaction/advisory lock and seeds only an empty database.
4. Check `/api/health`, then login, proposal/review flows, PDF upload/download, progress, admin approvals and logout on the final HTTPS URL.

Current CLI provisioning command:

```sh
vercel integration add neon --billing-plan free_v3 --name thesisflow-db --meta region=sin1 --meta auth=false --environment production --no-env-pull
```

Plan IDs may change; verify the provider still identifies the selected plan as Free. Do not upgrade billing to bypass a free-tier limit.

## Runtime and configuration

Users, sessions, reviews and PDF versions persist in PostgreSQL. PDFs are limited to 2 MB and stored as BYTEA. A small connection pool serves each warm function instance. No local disk is needed. `VERCEL` without `DATABASE_URL` fails with 503 rather than silently using ephemeral SQLite.

`DEMO_MODE=true` enables public shared synthetic accounts. `SEED_PASSWORD` applies only when seeding a new database. `FRONTEND_ORIGIN` is needed only for a separately hosted frontend; the same-origin Vercel app does not need it. Preview deployments need a separately connected database before API operations work; production credentials are not automatically copied to previews.

## CI/CD

GitHub Actions checks formatting/build, tests the API against isolated SQLite and PostgreSQL databases, checks serverless routing/session behavior, and runs Chromium workflows. Docker is built, smoke-tested, scanned and then published to GHCR. The optional SSH deployment job is for a VPS and remains disabled.

Vercel's Git integration is a separate deployment mechanism and does not wait for GitHub checks by default. Use a deployment gate or release manually after CI passes if strict ordering is required. Test the deployed API as well as the frontend build.

## Free-tier limits

Free services have storage, compute, request and bandwidth quotas, may cold-start, and are not an uptime SLA. Use fictional information for this personal portfolio/demo. Do not enable paid upgrades or automatic spending. Database BLOBs suit small demo documents; object storage is preferable at higher volume.

Official references: [Vercel Functions](https://vercel.com/docs/functions), [Neon integration](https://vercel.com/integrations/neon), [integration CLI](https://vercel.com/docs/cli/integration).
