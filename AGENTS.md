# AGENTS.md — zerobias-org/app

This repo hosts example and custom **ZeroBias platform apps**. Each app is an
independent SPA, built to a static bundle and deployed to S3/CloudFront per
environment. This file is the authoritative, general guide for the **repo as a
whole** — how apps are laid out, created, and deployed.

Scope split:
- **This file (repo root)** = overall, general instructions for using the repo.
- **Each app folder** (`package/<org>/<app>/`) = that app's own `AGENTS.md` +
  `docs/`, holding **package-specific** instructions and reference. Start there
  for anything about a specific app (e.g.
  `package/zerobias/example-nextjs-v2/AGENTS.md`).

## Deployment modes

Apps run in one of two modes; both are handled by the ZeroBias client:
- **Embedded (iframe in the portal)** — inherits the portal session; coordinates
  via `postMessage`. The primary mode for platform-integrated apps.
- **Standalone** — served at its own `*.zerobias.com` URL; the client redirects
  to platform SSO to establish a session.

## Directory & naming convention

Every app lives at exactly:

```
package/<org-slug>/<app-name>/
```

| Segment | What it is | Rules |
|---|---|---|
| `<org-slug>` | The **ZeroBias platform org slug** that owns the app | Must be a real org slug: `zerobias`, `w3geekery`, `raghu`, `miraxr`, … Reuse an existing folder or add one named for the owning org. It is the **org**, never the app name. |
| `<app-name>` | The app directory | Must equal `package.json` `name`. Becomes the deployed URL path `app-<env>-zerobias.com/<app-name>/`, and the app's `basePath` must be `/<app-name>`. |

Current examples:

```
package/zerobias/example-nextjs-v2     # v2 reference app (clone this)
package/zerobias/example-nextjs        # v1 legacy (do not model new apps on it)
package/zerobias/example-angular       # v1 legacy
package/w3geekery/sme-mart
```

### Why the depth and the org-slug matter

The deploy detector (`.github/workflows/dispatch.yml`) matches changed files
against `package/*/*/**` and derives the app from the **first two path
segments** (`awk -F/ '{print $1"/"$2"/"$3}'`). Consequences:

- The app must be **exactly two levels** under `package/`. Shallower or deeper
  nesting is not detected/deployed.
- **Anti-pattern:** `package/<app>/<app>/` (double-nesting, e.g.
  `package/auditcrowd/auditcrowd/`). It technically deploys, but the group
  segment is meant to be the **owning org slug**, not a repeated app name. Place
  it under the org that owns it, e.g. `package/raghu/auditcrowd/`.

## Starting a new app

Clone the v2 reference and re-home it under your org slug:

```bash
cp -r package/zerobias/example-nextjs-v2 package/<org-slug>/<app-name>
```

Then in the new folder:
1. `package.json` → set `name` to `<app-name>`.
2. Set the app's `basePath` / `NEXT_PUBLIC_BASE_PATH` to `/<app-name>`.
3. Follow that app's `README.md` + `AGENTS.md`.

`example-nextjs-v2` already encodes the correct patterns: latest Next.js, the
**v2** client (`@zerobias-com/zerobias-client`) + per-service SDKs, platform-SSO
auth (no custom login), one-build-for-all-envs, and the `.npmrc`/token setup.
Do **not** start from `example-nextjs`/`example-angular` — those are v1
(`@auditmation` client) and carry patterns we've since corrected.

## Per-app requirements (for deploy to work)

Each app folder must have:

- `.nvmrc` — Node **>= 22** (v2 client engine requirement). CI installs from this.
- Committed `package-lock.json` — CI runs `npm ci`.
- `.npmrc` — both `@zerobias-com` and `@zerobias-org` scopes resolve from
  `https://pkg.zerobias.org` with `${ZB_TOKEN}` (a single platform API key
  authenticates both; it's the only registry secret CI provides).
- `npm run build` producing a static bundle in **`dist/`** — that's what CI
  syncs to S3.

## Deploy

`.github/workflows/dispatch.yml` fires on push to `main` / `uat` / `qa`, finds
each changed `package/<org>/<app>/**`, and dispatches `deploy.yml`, which runs
the `static-s3-app-release` action:

```
.nvmrc  ->  npm ci  ->  npm run build  ->  aws s3 sync <app>/dist  s3://app-<env>-zerobias.com/<app-name>/
```

| Branch | Env | Bucket |
|---|---|---|
| `main` | prod | `app-app-zerobias.com` |
| `uat`  | uat  | `app-uat-zerobias.com` |
| `qa`   | qa   | `app-qa-zerobias.com` |

**A commit to `main` is a production release.** For a new or risky app, land on
a branch and push to `qa` first to smoke-test the deployed artifact, then promote
to `uat` / `main`.
