# Verification record

Verified locally on 9 November 2026 with Node.js 24.18.0:

- `npm run format:check` — passed.
- `npm run build` — TypeScript check and Vite production build passed.
- `npm test` — 11/11 API integration tests passed.
- `npm run test:e2e` — 2/2 Chromium browser tests passed, including all three role workflows and a 390px mobile viewport.
- `npm audit --omit=dev` — zero known production dependency vulnerabilities reported at verification time. This is not a guarantee against future advisories or an OS container scan.
- `docker compose config --quiet` — local Compose configuration passed.
- Production Compose configuration passed with sample image/domain variables.
- Rendered dashboard screenshot visually reviewed; see `dashboard.png`.

Not verified:

- Docker image build/runtime: Docker Desktop's Linux engine was unavailable (named-pipe connection error).
- GitHub Actions execution, registry publication, image vulnerability scan, SSH deployment, rollback on a real VPS, Render deployment, custom-domain TLS and public reachability: no repository or hosting credentials were configured for this work.

The included delivery workflow performs container build/smoke/scan checks when run on GitHub. The deploy job remains opt-in through `DEPLOY_ENABLED`. Do not describe this as a successful public deployment until a real run and live URL have been checked.
