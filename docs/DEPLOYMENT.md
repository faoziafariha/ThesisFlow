# Deployment routes

The selected route is **Vercel + Neon Free**, documented in [VERCEL.md](VERCEL.md). Paid Render/VPS instructions below are optional alternatives.

# Deployment guide

## 1. Create the GitHub repository

Create an empty repository in your own GitHub account, then open a terminal **inside this project folder**:

```sh
git init -b main
git add .
git commit -m "Build ThesisFlow full-stack portal and delivery pipeline"
git remote add origin https://github.com/YOUR_USERNAME/thesis-portal.git
git push -u origin main
```

Before publishing, review contributor permissions in `PROVENANCE.md`. Do not add the original download ZIP or credential JSON files. `.gitignore` excludes local data and environment files. The archive's Google credential must be revoked/rotated by its owner if it was real or previously exposed; excluding it here does not invalidate it.

The included `.github/workflows/pipeline.yml` runs on PRs and main pushes. In repository Settings → Actions → General, allow the workflow to publish packages (the workflow explicitly requests `packages: write`). Set a branch protection rule that requires the `quality` and `container` checks before merging; branch protection itself must be configured in GitHub.

After the first successful main run, the image is at `ghcr.io/YOUR_USERNAME/thesis-portal:COMMIT_SHA`. In the package settings, make the container package public for anonymous server pulls. The workflow intentionally avoids mutable `latest` deployment tags.

## 2. Choose a hosting route

### Option A: Render Docker deployment

This is the shorter path to an interviewer-accessible URL. The included `docs/examples/render.paid.yaml` requests a **paid Starter service and 1 GB persistent disk**. Check Render's current pricing before creating it. SQLite data needs a persistent disk; an ephemeral free service would lose data on replacement.

1. Connect your GitHub repository to Render and choose **New → Blueprint**.
2. Review the `docs/examples/render.paid.yaml` resources and create the service.
3. Render builds the Dockerfile, mounts `/app/data`, checks `/api/health`, and assigns an HTTPS `onrender.com` URL.
4. Keep `DEMO_MODE=true` for the public portfolio. Use fictional data only. Do not use shared demo admin access for real records.
5. `autoDeployTrigger: checksPass` makes later Git deployments wait for repository checks. Verify the actual GitHub check results and Render deploy logs before claiming that the release passed.
6. Add the public URL to the repository About panel and your CV after testing all three roles in a private browser window.

Render builds its own Docker image from the checked Git commit. GHCR publication remains part of CI; Render does not consume that GHCR image in this option. Render disk-backed services are single-instance and have deployment downtime. Back up data before significant changes.

Official references: [Docker](https://render.com/docs/docker), [persistent disks](https://render.com/docs/disks), [Blueprint configuration](https://render.com/docs/blueprint-spec).

### Option B: Full GHCR → VPS delivery with HTTPS and rollback

Use an Ubuntu server with Docker Engine + Compose v2, a DNS hostname pointing at it, and inbound ports 80/443 open. Bind the app's HTTP port to loopback as in `compose.production.yaml`. Caddy terminates TLS and forwards to the app. The production cookie is Secure, so use the HTTPS hostname for sign-in.

On the VPS, create `/opt/thesisflow`, make it writable by a dedicated deployment account, and install `compose.production.yaml`, `Caddyfile`, `scripts/deploy.sh` (as `/opt/thesisflow/deploy.sh`). Create `/opt/thesisflow/.env`:

```dotenv
APP_DOMAIN=thesis.your-domain.com
DEMO_MODE=true
SEED_PASSWORD=choose-a-unique-demo-password
```

`chmod 600 /opt/thesisflow/.env`. The default demo password changes only on a fresh database. Public demo role buttons intentionally allow access regardless of password.

The deployment account must be able to run Docker. Docker group access effectively grants root privileges; use a dedicated account and protect its key. For public GHCR packages, no registry password is needed on the server. For private packages, log in once with a restricted read-packages credential; never commit it.

Configure GitHub:

| Kind | Name | Value |
| --- | --- | --- |
| Repository variable | `DEPLOY_ENABLED` | `true` |
| Actions secret | `DEPLOY_HOST` | VPS hostname/IP |
| Actions secret | `DEPLOY_USER` | Dedicated deployment username |
| Actions secret | `DEPLOY_SSH_KEY` | Deployment private SSH key |
| Actions secret | `DEPLOY_KNOWN_HOSTS` | Verified SSH host key line(s) |

Use your provider console or a trusted channel to verify the SSH host fingerprint before adding `DEPLOY_KNOWN_HOSTS`. The workflow uses strict known-host verification and never disables it. Restrict the `production` GitHub Environment to main and optionally enable required reviewers.

The main workflow transfers deployment files, pulls the SHA-tagged image, resolves its immutable registry digest, starts Compose, and waits for health. A successful image reference is recorded in `.deployed-image`. A failed deployment attempts to restart the previously recorded image. The first deployment has no previous image to restore. Rollback restores application code, not database changes; future schema migrations need explicit backward compatibility and backup planning.

Manually deploy a known digest:

```sh
cd /opt/thesisflow
PORTAL_IMAGE=ghcr.io/YOUR_USERNAME/thesis-portal@sha256:YOUR_DIGEST bash deploy.sh
```

Check `docker compose -f compose.production.yaml ps`, logs and the HTTPS URL. A protected deployment environment may require you to approve the job in GitHub.

Official references: [publish Docker images with GitHub Actions](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images), [GHCR permissions](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

## Backup and restore

For the VPS deployment, first stop the application to obtain a consistent SQLite file (the proxy can stay up):

```sh
cd /opt/thesisflow
export PORTAL_IMAGE="$(cat .deployed-image)"
docker compose -f compose.production.yaml stop app
docker compose -f compose.production.yaml cp app:/app/data/portal.sqlite ./portal-backup.sqlite
docker compose -f compose.production.yaml start app
```

Keep backups outside the public repository. To restore, stop the app, preserve the current database elsewhere, remove the old `portal.sqlite-wal` and `portal.sqlite-shm` companions from the volume, and copy the backup into the data volume with node user ownership (UID 1000). Restart and verify health, sign-in and records. Test restoration on a separate environment before relying on a backup. Render disk access/backup procedures depend on its service tooling.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | API and built frontend listener |
| `DATABASE_PATH` | `data/portal.sqlite` | SQLite file; use `/app/data/portal.sqlite` in containers |
| `DEMO_MODE` | `true` | One-click demo role access |
| `SEED_PASSWORD` | `DemoPass!2026` | Password used only when seeding a new database |
| `NODE_ENV` | unset | `production` enables Secure cookies and single reverse-proxy trust |

Local Compose sets `NODE_ENV=development` so HTTP localhost sign-in works. Production Compose sets it to `production` behind Caddy. If using a different proxy, review Express trust-proxy configuration instead of exposing the app directly.

## Troubleshooting

- **Docker named-pipe connection error:** start Docker Desktop and select Linux containers.
- **Login appears to succeed but returns to sign-in:** production Secure cookies require HTTPS. Use local Compose for HTTP localhost.
- **Existing accounts still use the old password:** seed variables do not change existing database hashes.
- **Deploy skipped:** add `DEPLOY_ENABLED=true` and configure deployment secrets, or use the Render route.
- **Container scan fails:** update affected base image/dependencies and rerun; do not bypass the quality gate just to obtain a green badge.
- **GHCR denied:** check package write permission in CI, package visibility, and any server-side registry login.

