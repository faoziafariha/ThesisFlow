# Verification record

Verified on 9 November 2026.

## Public deployment

- Live application: https://thesisflow-wine.vercel.app
- Repository: https://github.com/faoziafariha/ThesisFlow
- Verified CI run: https://github.com/faoziafariha/ThesisFlow/actions/runs/42651164358
- Vercel project: `faozia-farihas-projects/thesisflow`.
- Database: Neon `thesisflow-db`, explicitly provisioned on `free_v3`, connected to Production.
- No paid Render/VPS resources were provisioned. The unintended temporary CLI test project was deleted after user approval.

Anonymous requests to `/` and `/api/health` returned HTTP 200 without Vercel sign-in. Chromium tests on the actual public URL passed for student proposal creation, supervisor review, administrator account approval, project search and mobile navigation. The connected hosted Neon database passed all 12 API tests using a disposable schema over the unpooled connection. Test schemas were removed afterward.

## CI and local validation

The verified GitHub Actions run passed:

- Formatting and TypeScript/Vite production build.
- 13 Node integration/serverless tests with local SQLite.
- The same suite with PostgreSQL provided by a disposable CI service.
- Two Chromium workflow tests.
- Multi-stage Docker build and container health/frontend smoke tests.
- High/critical vulnerability gate, followed by successful GHCR image publication.

The first image scan found six high-severity issues in npm's bundled dependencies. The final runtime image removes the unused package manager; the scan then passed. No vulnerability gate was bypassed. Scan results are point-in-time evidence, not a guarantee against future vulnerabilities.

## Delivery and limits

Vercel is connected to `faoziafariha/ThesisFlow`, production branch `main`. Git pushes trigger Vercel deployments separately from GitHub Actions; Vercel does not wait for CI by default. The workflow's SSH deployment job remains skipped because no VPS deployment is enabled.

Free-tier compute/storage/bandwidth limits and cold starts still apply. Shared demo users intentionally operate on the same synthetic records. Runtime rate limits are per function instance. This portfolio demo is not an institutional production deployment.
