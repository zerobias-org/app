# Changelog

All notable changes to **example-nextjs-v2** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the app
uses [Semantic Versioning](https://semver.org/). The version below tracks
`package.json` `"version"`. **Maintained manually for now** (Phase 1) — there is
no CI changelog/version automation yet.

Each release is written so that a developer — or their AI assistant — who cloned
a specific version can quickly see **what changed** and **which ZeroBias v2
client / SDK calls and patterns** that version introduces, to make incorporating
the changes into their own app easier.

## [Unreleased]

## [0.2.1] - 2026-07-10

### Fixed
- **Module chain — Hub connect 401 in the browser.** The GitHub Hub SDK client
  (`GithubHubImpl`) is a separate HTTP client and does not inherit the platform
  clients' auth interceptor, so its `connect()` call to
  `/api/hub/targets/<id>/metadata` was sent with **no `Authorization` header** and
  the dana proxy returned `401` on uat/prod (local dev was unaffected because it
  authenticates with the API key). Fixed by passing the platform **session id**
  (`api.getZerobiasSessionId()`) into `HubConnectionProfile`'s `session` arg, so
  the SDK sends `Authorization: session <id>` like `danaClient` / `hubClient`.

## [0.2.0] - 2026-07-09

Phase 2 — the GitHub **module chain** and **shared-session key**, plus
portal-parity theming, an accessible org switcher, the loading/status UI kit,
error handling, and the unit-test harness.

### Added — features and the calls they demonstrate

- **Module chain — GitHub via the Hub** (`/module`, `src/app/module/page.tsx`) —
  walks `product -> module -> connection -> scope -> hub client` and lists a
  GitHub org's repositories through the Hub. The payoff hop:
  `new GithubHubImpl().connect(new HubConnectionProfile(server, targetId, apiKey?, session?, orgId?))`,
  then `getOrganizationApi().listMyOrganizations()` / `.listRepositories(...)`.
  The Hub holds the GitHub credentials — the browser never sees a token. SDK:
  **`@auditlogic/hub-sdk-github-github`** (+ `@zerobias-org/util-connector`).
  See [docs/module-chain.md](./docs/module-chain.md).
- **Shared-session keys** (`src/components/CreateSharedSessionDialog.tsx`) —
  `danaClient.getMeApi().createSharedSessionKey(new CreateSharedSessionKeyBody(undefined, new Duration("PT<n>M")))`.
  See [docs/shared-session-keys.md](./docs/shared-session-keys.md).
- **Portal-parity theming** (`src/lib/theme.ts`) — a port of ngx-library's
  `ZbThemeService`: a `useTheme` hook, `zb-theme-preference` storage, light
  default + a `dark-theme` class on `<html>`/`<body>`, a pre-paint FOWT script,
  and iframe `theme_change` follow. See [docs/theming.md](./docs/theming.md).
- **Accessible org switcher** (`src/components/OrgSwitcher.tsx`) — a WAI-ARIA
  listbox (keyboard nav, `aria-activedescendant`) replacing the native `<select>`,
  driven by the pure `src/lib/listbox-nav.ts` helper.
- **Loading & status UI kit** — `PageLoader` (the branded "0" preloader),
  `Spinner` (mat-spinner equivalent), `TableSkeleton`, `ButtonLabel` (port of
  `zb-ui-button-label`; also blocks repeat clicks), and `StatusDot` (port of
  ngx-library `zb-resource-status` — connection status as a solid/outlined
  colored dot, via the pure `src/lib/status-tone.ts` mapping). `ConnectionPicker`
  renders the module chain's connections with status dots.
  See [docs/loading-and-status.md](./docs/loading-and-status.md).
- **Unit test harness** — Vitest (`npm test` / `npm run test:watch`) with suites
  for `errors`, `listbox-nav`, and `status-tone` (26 tests).
- **`src/lib/errors.ts`** — `toUserMessage(err)` maps any thrown value to a
  safe, user-facing message.

### Changed

- **Error handling** — the Products, PKV, and Create-API-Key views now show a
  mapped, friendly message via `toUserMessage()` and log the raw error to the
  console for developers, instead of rendering raw error text (which can leak
  backend detail) directly in the UI.
- **Loading feedback** — `AuthGate` shows the branded `PageLoader`; the Products
  and PKV tables show skeleton rows + a spinner while loading; action buttons
  swap their label for a spinner while an action runs.
- **`.npmrc`** — sets `legacy-peer-deps=true`: the GitHub Hub SDK publishes stale
  `^1.x` peerDependencies while its real deps are the v2 stack. To be dropped
  once the SDK's peerDeps are corrected upstream.

## [0.1.0] - 2026-07-08

Initial release. Canonical Next.js (App Router, static export) reference app for
building a custom app on the ZeroBias platform with the **v2 client**
(`@zerobias-com/zerobias-client`) + per-service SDKs.

### Added — features and the calls they demonstrate

- **Client bootstrap** (`src/lib/zerobias-app-service.ts`) — a browser-only,
  StrictMode-safe singleton that builds and initializes the client:
  `ZerobiasClientOrgId` + `ZerobiasClientSessionId` -> `ZerobiasClientApi` ->
  `ZerobiasClientApp` -> `app.init(interceptor)`. All SDK access goes through
  `service.api` (`danaClient`, `portalClient`, …). Never hand-roll `fetch`.
- **Session state** (`src/context/session-context.tsx`) — `user` / `org` / `api`
  sourced from the client's RxJS streams (`app.getWhoAmI()`,
  `app.getCurrentOrg()`) with subscription teardown on unmount. Exposes
  `selectOrg(org)` and `logout()`.
- **Auth — platform SSO only** (`src/components/AuthGate.tsx`) — no custom login
  page. On `init()` with no session the client redirects to
  `/api/dana/me/session/login?nextPath=<app>&cookieDomain=<host>` and returns
  with a session cookie. The API key is used **only in local dev**
  (`Authorization: APIKey <key>` interceptor); it is never present in a
  production build.
- **Identity + org switch** — `api.danaClient.getOrgApi().listOrgs(page, size)`
  (sorted by name on the client; `listOrgs` has no sort param) and
  `app.selectOrg(org)`.
- **Products catalog** (`/products`) —
  `api.portalClient.getProductApi().search(body, page, size)` ->
  `PagedResults<ProductExtended>` (`.items` for rows; fields `code`, `imageUrl`).
- **Principal Key-Value** (`/pkv`) — read
  `api.danaClient.getPkvApi().listPrincipalKeyValues()`, write
  `.upsertPrincipalKeyValue(new Pkv(key, value))` (`Pkv.value` is a JSON object).
- **Create API key** (in the user menu, `src/components/CreateApiKeyDialog.tsx`)
  — `api.danaClient.getMeApi().createApiKey(new CreateApiKeyBody(name, expiration))`
  -> `ApiKeyWithData`; the secret (`data`) is returned once and shown with a copy
  action alongside the current Organization ID. Expiration is a `DateTime` built
  from a duration + unit (hours / days / years).

### Build & deploy

- Next.js 16 + React 19. Static export (`output: "export"` -> `dist/`),
  `basePath` / URL path `/example-nextjs-v2`, built with `next build --webpack`
  (Turbopack fails on a dynamic JSON `import()` in `@zerobias-org/types-core-js`).
- **One build for all environments** — the client resolves its API host from
  `location.host` at runtime (origin-relative `/api`), so the same `dist/` is
  promoted across uat / qa / prod. No credentials are baked into the bundle.
- Deployed by `dispatch.yml` -> `static-s3-app-release`
  (`npm ci && npm run build`, then `aws s3 sync dist/` to
  `app-<env>-zerobias.com/example-nextjs-v2/`).

### v2 SDK signatures worth noting

- `CreateApiKeyBody(name, expiration?)`
- `upsertPrincipalKeyValue(pkv, principalId?)` — the `Pkv` comes first
- Client constructors require `ZerobiasClientOrgId` and `ZerobiasClientSessionId`
- Product fields are `code` / `imageUrl`; PKV type is `Pkv`
