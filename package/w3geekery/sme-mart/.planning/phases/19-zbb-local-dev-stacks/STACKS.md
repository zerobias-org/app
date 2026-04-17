# SME Mart Local Dev Stacks

Run the complete SME Mart infrastructure locally: SPA + Login UI + Hub module + CloudFront simulator. Test the full three-repo workflow without external dependencies.

## What is zbb?

**zbb** (ZeroBias Build) is a local stack orchestration tool that manages Docker Compose applications with dependency resolution, environment variable aliasing, and service lifecycle management.

Think of it as "Infrastructure as Code lite" — define your stacks (zbb.yaml), add them to a slot, and zbb handles the rest: startup order, health checks, log aggregation, and cleanup.

## Why Local Stacks?

- **No external dependencies** — SPA, login, and Hub module all run locally
- **Fast iteration** — Edit module code → rebuild → restart service (no waiting for upstream deployments)
- **Complete testing** — Test the full three-repo workflow (auth flow, asset serving, module integration)
- **Reproducible environment** — Same setup works on every developer machine

## Prerequisites

- **Docker** + **Docker Compose** (required for all services)
- **Node.js 18+** + **npm** (required for builds)
- **curl** or **wget** (for health checks)
- **Git** (already have it)
- **zbb** CLI (ZeroBias Build tool)

If you don't have zbb installed, follow the [zbb installation guide](https://github.com/zerobias-org/util/tree/main/packages/zbb).

## One-Time Setup

### Step 1: Clone All Repos

Verify you have all three repositories cloned and on the correct branches:

```bash
# SME Mart SPA
cd ~/Projects/w3geekery/zerobias-org-forks/app
git checkout poc/sme-mart
git pull

# Login UI
cd ~/Projects/w3geekery/zerobias-org-forks/login
git checkout feat/w3geekery-login-package
git pull

# Hub Module
cd ~/Projects/w3geekery/zerobias-org-forks/module
git checkout feat/w3geekery-sme-mart
git pull
```

### Step 2: Verify Hub Module Builds

The Hub module must be built and packed before the stacks can consume it:

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/module
npm run build
npm pack
# Verify: should show a .tgz file in the module directory
```

This creates a local npm package that Verdaccio (the local registry) can publish.

### Step 3: Create a zbb Slot

A "slot" is a named local development environment. You can have multiple slots (e.g., "local", "testing", "feature-x").

```bash
zbb slot create local
zbb slot load local
```

This creates a new slot called "local" and loads it (makes it the active slot).

## Starting the Stacks

### Add Stacks to the Slot

Register both SPA and login stacks (cloudfront-sim is a dependency, automatically added):

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart

# Add SPA stack (includes minio + cloudfront-sim)
zbb stack add ./zbb-stacks/sme-mart-spa

# Add login stack (reuses cloudfront-sim from SPA)
zbb stack add ./zbb-stacks/sme-mart-login
```

### Start SPA Stack

The SPA stack starts all dependencies (minio) and brings up the reverse proxy (cloudfront-sim):

```bash
zbb start sme-mart-spa
```

This will:
1. Start MinIO (S3-compatible object storage)
2. Build the SPA (Angular app)
3. Upload SPA assets to MinIO bucket `sme-mart-app`
4. Start CloudFront-sim (nginx reverse proxy)

Wait for health checks to pass (all services healthy).

### Start Login Stack

The login stack reuses cloudfront-sim and adds login assets to a separate MinIO bucket:

```bash
zbb start sme-mart-login
```

This will:
1. Build the login UI (from login/package/w3geekery)
2. Wait for cloudfront-sim to be ready
3. Create a separate MinIO bucket (`sme-mart-login`)
4. Upload login assets to `s3://sme-mart-login/auth/`

### Verify Both Stacks Are Running

```bash
zbb status
```

You should see:
- `sme-mart-spa`: healthy
- `sme-mart-login`: healthy
- `cloudfront-sim`: healthy (shared)
- `minio`: healthy (shared)

### Access the Apps

Get the actual port assignments:

```bash
zbb env list | grep CLOUDFRONT_SIM_PORT
```

Then open your browser:
- **SPA:** `http://localhost:PORT/sme-mart/` (replace PORT with actual value)
- **Login:** `http://localhost:PORT/auth/`

You should see HTML content (not 404 errors).

## Iteration Workflow: Edit Hub Module → Rebuild → Republish

The Hub module is where you make changes to the service API. Here's how to test changes locally:

### Step 1: Edit Hub Module Source

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/module

# Edit the OpenAPI spec or TypeScript source
# e.g., add a new endpoint to api.yml
```

### Step 2: Rebuild and Pack

```bash
npm run build
npm pack
```

### Step 3: Publish to Local Registry (Verdaccio)

Verdaccio is a local npm registry that Verdaccio inside the SPA stack can consume.

```bash
zbb registry publish
```

Or manually publish to the registry URL (check `zbb env list` for REGISTRY_URL):

```bash
npm publish --registry http://localhost:PORT ./path/to/module.tgz
```

### Step 4: Update SPA Dependencies

The SPA's `package.json` references the module. To pick up the new version:

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart

# Install from local registry (Verdaccio inside docker)
npm install --registry http://localhost:REGISTRY_PORT

# Rebuild SPA
npm run build
```

### Step 5: Restart CloudFront-sim (or refresh browser)

Option A: Restart the nginx proxy to serve new assets:

```bash
zbb stop sme-mart-spa
zbb start sme-mart-spa
```

Option B: Just refresh your browser (assets are already served from MinIO):

```bash
# In your browser: press Ctrl+Shift+R (hard refresh)
```

The SPA will pick up the new module version.

## Debugging

### Check Service Health

```bash
zbb status
```

Shows which services are healthy, starting, degraded, or stopped.

### View Logs

See logs from all services:

```bash
zbb logs show sme-mart-spa
zbb logs show sme-mart-login
zbb logs show cloudfront-sim
```

Tail logs in real-time:

```bash
zbb logs tail sme-mart-spa
```

### Check Port Assignments

Every run allocates new ports to avoid conflicts. See what's assigned:

```bash
zbb env list | grep PORT
```

### Test Endpoints Directly

```bash
# SPA
curl -i http://localhost:PORT/sme-mart/
curl -i http://localhost:PORT/sme-mart/rfps/test  # Deep route — should return index.html

# Login
curl -i http://localhost:PORT/auth/

# Check nginx proxy
curl -i http://localhost:PORT/
```

Expected: HTTP 200 with HTML content.

### Docker Logs

If a service fails, check Docker logs directly:

```bash
docker ps  # List running containers
docker logs CONTAINER_NAME  # View container logs
docker logs -f CONTAINER_NAME  # Follow logs in real-time
```

### Check MinIO

Access the MinIO web UI (credentials from docker-compose):
- URL: `http://localhost:9001` (or check docker logs for actual port)
- Login credentials: in docker-compose.yml or check stack env vars

Verify assets are uploaded:
- Bucket `sme-mart-app` should contain SPA assets
- Bucket `sme-mart-login` should contain login assets

### Network/Connectivity

If services can't reach each other:

```bash
docker network ls  # List networks
docker inspect NETWORK_NAME  # See what's connected
```

All services should be on the same docker network (named after the stack).

## Session Handoff Verification (Local Testing)

The ZeroBias platform handles authentication, not the stacks. To test session flow:

### Step 1: Open Login Page

```bash
# Get the actual port
PORT=$(zbb env list | grep CLOUDFRONT_SIM_PORT | cut -d= -f2)

# Open in browser
open "http://localhost:${PORT}/auth/"
```

### Step 2: Check Cookies in Browser DevTools

Open DevTools: **Application** → **Cookies**

You should see a session cookie or auth token (exact name depends on platform configuration).

### Step 3: Navigate to SPA

Without logging out, navigate to:

```
http://localhost:PORT/sme-mart/
```

### Step 4: Verify Token Persists

In DevTools, check that:
1. The auth cookie/token is still present in **Application** → **Cookies**
2. Network requests to the SPA include an `Authorization` header (check **Network** tab)

If the token is missing or headers are wrong, the SPA won't authenticate properly.

## Stopping and Cleanup

### Stop Stacks (Keep Data)

Containers stop, but volumes/networks persist. Next startup is faster:

```bash
zbb stop sme-mart-spa sme-mart-login
```

### Full Cleanup (Restart from Scratch)

Remove all containers, images, and volumes:

```bash
zbb slot clean local
```

Next startup will rebuild everything (slower).

### Remove Slot Entirely

```bash
zbb slot delete local
```

## Troubleshooting

### Port Conflicts

If you get a "port already in use" error:

```bash
# Create a new slot with a different port range
zbb slot create feature-x --port-range 16000-17000
zbb slot load feature-x
zbb stack add ./zbb-stacks/sme-mart-spa
```

### Hub Module Not Found

The Hub module must be published to Verdaccio before the SPA can use it:

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/module
npm run build
npm pack
zbb registry publish
```

Verify it's in the registry:

```bash
curl http://localhost:REGISTRY_PORT/@w3geekery/sme-mart
```

### SPA Returns 404 on Deep Routes

The nginx reverse proxy (cloudfront-sim) must have SPA fallback enabled. Check the nginx config:

```bash
docker exec CLOUDFRONT_SIM_CONTAINER cat /etc/nginx/nginx.conf
```

Look for a `try_files` directive that falls back to `index.html`.

### Assets Not Loading (Blank Page)

Check that MinIO bucket has assets:

```bash
# List bucket contents
aws s3 ls s3://sme-mart-app/ --endpoint-url http://localhost:9000

aws s3 ls s3://sme-mart-login/auth/ --endpoint-url http://localhost:9000
```

If empty, re-run the setup:

```bash
zbb stop sme-mart-spa
zbb stop sme-mart-login
zbb start sme-mart-spa
zbb start sme-mart-login
```

### "Docker is not running" Error

Make sure Docker Desktop (or docker daemon) is started:

```bash
# macOS
open /Applications/Docker.app

# Or check status
docker info
```

### CloudFront-sim Fails to Start

Verify MinIO is healthy first:

```bash
zbb logs show minio
curl http://localhost:9000/minio/health/live
```

If MinIO is not responding, restart it:

```bash
zbb stop minio
zbb start minio
```

### Login Build Fails

Check that the login repo has npm dependencies:

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery
npm install
npm run build
```

If the build script is different, update the zbb.yaml `lifecycle.build` section.

## Directory Structure (Reference)

```
zerobias-org-forks/
├── app/
│   ├── zbb-stacks/
│   │   ├── sme-mart-spa/
│   │   │   ├── zbb.yaml              (SPA stack manifest)
│   │   │   ├── docker-compose.yml    (MinIO + upload service)
│   │   │   └── setup.sh              (Prerequisites + build)
│   │   ├── sme-mart-login/
│   │   │   ├── zbb.yaml              (Login stack manifest)
│   │   │   ├── docker-compose.yml    (Login upload service)
│   │   │   └── setup.sh              (Prerequisites + build)
│   │   └── cloudfront-sim/
│   │       ├── zbb.yaml              (Reusable nginx proxy)
│   │       ├── docker-compose.yml    (nginx service)
│   │       ├── nginx.conf.template   (SPA fallback routing)
│   │       └── docker-entrypoint.sh  (Config generation)
│   └── package/w3geekery/sme-mart/
│       ├── src/                      (SPA source code)
│       ├── dist/                     (SPA build output)
│       └── package.json
├── login/
│   └── package/w3geekery/
│       ├── src/                      (Login UI source)
│       ├── dist/                     (Login build output)
│       └── package.json
├── module/
│   ├── src/                          (Hub module source)
│   ├── api.yml                       (OpenAPI spec, source of truth)
│   └── package.json
└── .planning/phases/19-zbb-local-dev-stacks/
    ├── 19-01-PLAN.md
    ├── 19-02-PLAN.md
    ├── 19-01-SUMMARY.md
    ├── 19-02-SUMMARY.md
    └── STACKS.md (this file)
```

## Environment Variables (Reference)

Exported by stacks (accessible via `zbb env list`):

| Variable | Stack | Description | Example |
|----------|-------|-------------|---------|
| `CLOUDFRONT_SIM_PORT` | cloudfront-sim | nginx reverse proxy host port | `15000` |
| `CLOUDFRONT_SIM_URL` | cloudfront-sim | nginx reverse proxy URL | `http://localhost:15000` |
| `LOGIN_URL` | sme-mart-login | Public login page URL | `http://localhost:15000/auth/` |
| `AWS_ENDPOINT` | minio | MinIO S3 endpoint | `http://localhost:9000` |
| `AWS_ACCESS_KEY_ID` | minio | MinIO access key | (from docker-compose) |
| `AWS_SECRET_ACCESS_KEY` | minio | MinIO secret key | (from docker-compose) |
| `MINIO_BUCKET` | sme-mart-spa / sme-mart-login | Bucket names | `sme-mart-app`, `sme-mart-login` |
| `REGISTRY_URL` | (Verdaccio inside SPA stack) | Local npm registry URL | `http://localhost:4873` |

## Common Commands Cheat Sheet

```bash
# First time (one-time setup)
zbb slot create local
zbb slot load local
zbb stack add ./zbb-stacks/sme-mart-spa
zbb stack add ./zbb-stacks/sme-mart-login

# Daily workflow
zbb start sme-mart-spa
zbb start sme-mart-login
zbb status
# Open browser: http://localhost:PORT/sme-mart/

# Iterate on Hub module
cd ~/Projects/w3geekery/zerobias-org-forks/module
npm run build
npm pack
zbb registry publish

# Then refresh SPA (or restart)
# In browser: Ctrl+Shift+R (hard refresh)

# Check logs
zbb logs tail sme-mart-spa
zbb logs show cloudfront-sim

# Stop (for cleanup/restart)
zbb stop sme-mart-spa sme-mart-login

# Full cleanup (next startup rebuilds)
zbb slot clean local

# Environment info
zbb env list
zbb env explain CLOUDFRONT_SIM_PORT
```

## Next Steps

After verifying both stacks are running locally:

1. **Test the SPA** — Navigate to different pages, verify Angular routing works (deep links return index.html, not 404)
2. **Test session flow** — Open login page, check auth cookie persists, SPA receives auth header
3. **Iterate on Hub module** — Edit API, rebuild, test locally before committing
4. **Check Hub integration** — If Hub module changes, verify SPA still imports and uses the new APIs

For questions or issues, see **Troubleshooting** above or check the `.claude/notes/` directory for integration guides.
