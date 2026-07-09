# AGENTS.md — zerobias-org/app

This repo hosts example and custom **ZeroBias platform apps**. Each app is an
independent SPA, built to a static bundle and deployed to S3/CloudFront per
environment. This file is the authoritative, general guide for the **repo as a
whole** — how apps are laid out, created, and deployed. **AGENTS.md is the
source of truth**; the app repo's `CLAUDE.md` is only a pointer here.

Scope split:
- **This file (repo root)** = overall, general instructions for using the repo.
- **Each app folder** (`package/<org>/<app>/`) = that app's own `AGENTS.md` +
  `docs/`, holding **package-specific** instructions and reference. Start there
  for anything about a specific app (e.g.
  `package/zerobias/example-nextjs-v2/AGENTS.md`).

## Repository overview

The **ZeroBias Community Apps Monorepo** lets developers build custom UIs on top
of the ZeroBias platform without owning the auth or hosting infrastructure:

- **Create custom UIs** without implementing authentication or hosting yourself.
- **Leverage the ZeroBias client + SDKs** and community-generated module SDKs.
- **Deploy automatically** — a PR merged to an environment branch publishes the
  changed app to that environment.
- **Access platform capabilities** — connections, modules, schemas, queries, and
  more, through the client.

## Deployment modes

Apps run in one of two modes; both are handled by the ZeroBias client:

- **Embedded (iframe in the portal)** — inherits the portal session and
  coordinates via `postMessage`. The primary mode for platform-integrated apps.
- **Standalone** — served at its own `*.zerobias.com` URL; the client redirects
  to platform SSO to establish a session. (Local dev uses an API key, since a
  `localhost` browser can't share the platform's session cookie.)

## Directory & naming convention

Every app lives at exactly:

```
package/<org-slug>/<app-name>/
```

| Segment | What it is | Rules |
|---|---|---|
| `<org-slug>` | The **ZeroBias platform org slug** that owns the app | Must be a real org slug: `zerobias`, `w3geekery`, `raghu`, `miraxr`, … Reuse an existing folder or add one named for the owning org. It is the **org**, never the app name. |
| `<app-name>` | The app directory | Must equal `package.json` `name`. Becomes the deployed URL path `app-<env>-zerobias.com/<app-name>/`, and the app's `basePath` must be `/<app-name>`. |

### Notable apps

- **`package/zerobias/example-nextjs-v2`** — the **v2 reference app**. Clone this
  for new apps: latest Next.js, the **v2 client** (`@zerobias-com/zerobias-client`)
  + per-service SDKs, platform-SSO auth, one-build-for-all-envs.
- **`package/zerobias/data-explorer`** — production app using the DataProducer
  interface (`@zerobias-org/data-utils`).
- **`package/zerobias/example-nextjs`, `package/zerobias/example-angular`** —
  **v1 legacy** (old `@auditmation` client). Kept for reference; **do not model
  new apps on them**.

(Which apps are present varies by branch/environment. The list above is the
canonical set; the reference for new work is always `example-nextjs-v2`.)

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

**Do not start from `example-nextjs` or `example-angular`** — those are v1
(`@auditmation` client) and carry patterns we've since corrected.

## ZeroBias platform integration

### Module ecosystem

The platform exposes modules that apps consume through the client:

- **Core modules** — published to public NPM (e.g. the DataProducer interface,
  the GitHub integration). No auth required to install.
- **Community modules** — published to the private registry
  (`pkg.zerobias.org`, needs `ZB_TOKEN`). Discovered via the ZeroBias **Catalog**
  app (browse modules, schemas, queries, collector/alert bots).
- **Local/custom modules** — forked and customized for a specific org.

### Authentication

Every app initializes a ZeroBias client service that establishes and checks the
session; the client handles auth transparently:

1. The app calls the client's `init()` to check for a valid session.
2. No session → the client redirects to platform login (SSO).
3. The user authenticates; the platform redirects back to the app (via a
   `nextPath`), now with a session cookie.
4. The app runs with the authenticated session.

Session lifetime (limits, inactivity timers) is governed by org policy and
handled by the platform — apps need no manual refresh/renew logic. In **iframe**
mode the session is inherited from the portal; in **standalone** mode the client
drives the SSO redirect (local dev uses an API key).

**Do not build a custom login page.** For the concrete v2 implementation (the
SSO redirect, `nextPath`, the local-dev API-key interceptor) see
`package/zerobias/example-nextjs-v2/docs/authentication.md`.

## Per-app requirements (for deploy to work)

Each app folder must have:

- `.nvmrc` — Node **>= 22** (v2 client engine requirement). CI installs from
  this. (Legacy v1 apps may pin an older version via their own `.nvmrc`.)
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

### Cross-fork publishing (e.g. W3Geekery / SME Mart)

For apps developed on a separate org fork that publish to the canonical
`zerobias-org/app`:

- Work on a feature branch (e.g. `w3geekery/app:poc/sme-mart`). **That branch
  publishes nowhere.**
- To publish, open a **PR from the feature branch → the matching
  `zerobias-org/app` environment branch**:
  - `… → zerobias-org/app:uat` publishes to `https://uat.zerobias.com/<app-name>`
  - `… → zerobias-org/app:main` publishes to `https://app.zerobias.com/<app-name>`
- Merging the PR triggers the auto-deploy to that environment.

## Key integration patterns

> The code below shows the platform mechanics. The **current concrete
> implementations** live in the apps — `example-nextjs-v2` for v2 client patterns,
> `data-explorer` for the DataProducer/Hub pattern. The v2 module-chain example
> (GitHub) is on the `example-nextjs-v2` roadmap.

### DataProducer interface (data-explorer)

A generic object-oriented view over a data source:

1. **Discover connections** implementing DataProducer (via product/module association).
2. **Handle scoping** — single-scope vs multi-scope connections.
3. **Initialize the client** with the Hub connection profile.
4. **Browse the hierarchy** — root → containers → collections/functions.
5. **Access data** — query collections with RFC 4515 filters, invoke functions, read schemas.
6. **Generate diagrams** — ERDs from schema metadata (where supported).

### Platform connection flow (module integration)

Apps that connect to an external service (GitHub, etc.) follow:

1. Authenticate the user; get current user + org.
2. Select a **product** from the catalog (e.g. GitHub).
3. Find **modules** implementing that product.
4. List **connections** implementing those modules.
5. Retrieve **scopes** for the chosen connection.
6. Initialize the **module client** with the Hub connection profile.
7. Call the connected client's APIs.

### Hub module client initialization (current data-explorer pattern)

Hub module clients (DataProducer, GitHub, …) connect through a Hub connection
profile. This is the pattern data-explorer uses today; the v2 client equivalent
is a Phase 2 objective for `example-nextjs-v2`:

```typescript
const hubConnectionProfile = {
  server: hubUrl,                 // resolved from browser origin (same-origin, no CORS preflight)
  targetId: scopeOrConnectionId,  // scope or connection UUID
  apiKey,                         // enables `Authorization: APIKey …`
  orgId,                          // adds `Dana-Org-Id` for multi-tenancy
};

const moduleClient = newModuleClient();
await moduleClient.connect(hubConnectionProfile);
const data = await moduleClient.getSomeApi().list(/* … */);
```

### Iframe communication

Embedded apps coordinate with the portal via `postMessage`. Validate the message
origin against known portal origins — **do not trust arbitrary `event.origin`**.
Common message types: `APP_NAV`, `RESOURCE_NAV`, `LOGOUT`, `REFRESH_NAVIGATION`,
`PORTAL_HOME`.

## App development best practices

- **Auth/session** — check auth state before API calls; handle session
  expiration gracefully; support both iframe and standalone modes.
- **API calls** — always go through the client/SDK, never hand-roll `fetch` to
  the platform; handle 401/403/500 with user-friendly messages; show loading
  states.
- **Iframe** — validate message origin against known portals; handle all
  expected message types.
- **Performance** — lazy-load routes/components, keep bundles small (dynamic
  imports), rely on the CDN for static assets.
- **Security** — never ship API keys in client code (env vars; CI injects at
  build); validate user input before it reaches platform APIs; HTTPS only.

## Troubleshooting

App-specific debugging lives in each app's own docs. High-level:

- **401 on API calls** — confirm a session (iframe) or API key (standalone);
  call `whoAmI()`; check CORS in standalone mode.
- **Iframe won't load in the portal** — verify the app is deployed and reachable;
  check CSP/sandbox; test in standalone first.
- **postMessage not working** — check origin validation and message types; confirm
  both sides are listening.
- **Build fails** — clear `node_modules` and reinstall; verify Node matches
  `.nvmrc`; run `tsc --noEmit` and `npm run lint`.

## Testing

Each app owns its test setup — see the app's `AGENTS.md` / `README.md` for unit,
integration, and (where applicable) E2E configuration and commands.

## Development requirements

- **Node.js** — >= 22 (per each app's `.nvmrc`).
- **npm** — >= 10.
- **Git** — >= 2.

## Related documentation

- `package/zerobias/example-nextjs-v2/AGENTS.md` — v2 reference implementation
  (+ its `docs/` for per-feature detail: auth, client bootstrap, org switch,
  products, PKV, API keys).
- `package/zerobias/data-explorer/` — DataProducer / Hub example.
- The ZeroBias platform + v2 client (`@zerobias-com/zerobias-client`) docs for
  platform-level auth, module ecosystem, and SDK reference.
