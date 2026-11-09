# GitHub, CV and interview guide

## Repository presentation

Suggested repository name: `thesisflow-portal`.

Suggested About text: "Full-stack thesis management portal with role-based workflows, React/TypeScript, Express, SQLite, Docker and GitHub Actions CI/CD."

Suggested topics: `react`, `typescript`, `express`, `sqlite`, `docker`, `github-actions`, `playwright`, `thesis-management`.

Set the About website field to the verified live URL. Replace placeholders before using badges or links. Pin the repository on your profile. Keep the original contributor attribution and describe this as an extension if the original project was not solely yours.

## CV wording

Use this after you have deployed it and observed a green delivery pipeline:

**ThesisFlow — Thesis & Project Management Portal** | React, TypeScript, Express, SQLite, Docker, GitHub Actions

- Extended an academic portal into a full-stack workspace with server-enforced student, supervisor and admin access, proposal reviews, progress tracking and versioned PDF submissions.
- Containerized the application with persistent storage, non-root execution and health checks; implemented CI for type checks, integration tests, browser tests, image builds and vulnerability scanning.
- Deployed an HTTPS live demo with automated releases and health-based image rollback. [Use this last statement only for the VPS delivery route after successful verification; for Render, describe its actual deployment process instead.]

Add: `GitHub: YOUR_REPOSITORY_URL | Live demo: YOUR_VERIFIED_HTTPS_URL`.

Before hosting, say "Implemented Docker and CI/CD configuration" rather than claiming a successful cloud deployment. Do not invent user counts, uptime, scale, performance gains, deployment statistics or ownership.

## Three-minute interview walkthrough

1. Open the live demo and select Student. Explain how the dashboard calculates progress from persisted project records.
2. Create a proposal, choose the first supervisor, and show it in Projects.
3. Sign out, select Supervisor, open that proposal, and send an approval with feedback.
4. Return as Student, update the progress, upload a small synthetic PDF, and show previous submission versions.
5. Select Admin, approve the pending seeded account if still pending, add a deadline, and show the audit trail.
6. Open GitHub Actions. Show an actual successful quality job, container smoke test, scan and publication. For the VPS route, show the deployment job and explain immutable digests and rollback.
7. Explain why SQLite was chosen for a single-instance demo and when PostgreSQL/object storage would be appropriate.

Shared demo data may already be changed by visitors. Test your walkthrough beforehand. Restoring fresh data deletes changes; use a separate disposable environment for repeated demonstrations.

## Be ready to discuss

- Why hiding buttons is insufficient for authorization; point to API ownership checks and negative tests.
- Why cookie sessions need HttpOnly, SameSite, Secure, origin validation and HTTPS.
- Why files are attachments and size-limited, and why PDF signature checks do not replace malware scanning.
- Why a durable database volume matters when replacing a container.
- What CI proves, what only an actual deployment proves, and why a rollback does not reverse database migrations.
- What came from the academic project and what you extended yourself.
