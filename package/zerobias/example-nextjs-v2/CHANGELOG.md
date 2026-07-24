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

## [0.4.0] - 2026-07-23

Phase 4 — parity pass against **example-angular-v2**: the code-reveal write demos
now build every request as a **typed object literal** and show it **inline in the
call** (one panel, not a signature beside a JSON blob), plus a portal-exact
header, a home "Your session" landing, response auto-folding, and code-block copy
buttons.

### Changed — the code-reveal write-demo doctrine

- **Request objects are now plain object literals typed to the model**, not
  positional `new NewX(...)` / `new UpdateX(...)`. Typing the const
  (`const project: NewProject = { … }`) makes the **compiler enforce the model's
  required fields** — a missing one is a build error, which `newInstance(obj: any)`
  would not catch. Values stay real SDK types: enum members via `Status.from(...)`,
  ids via `toUUID(...)`, each `NewTaskLink` a `{ resourceId }` literal. Update
  deltas are `const delta: UpdateX = {}` with only changed fields assigned; `null`
  (clear/unassign) survives to the wire because nothing round-trips through a
  serializer (no `applyNulls` workaround needed). Applied across all seven
  code-reveal forms + `CommentComposer`, and to the two live writes the doctrine
  also covers — `Pkv` (`upsertPrincipalKeyValue({ key, value })`) and
  `CreateApiKeyBody`.
- **`CallReveal` folds the payload into the call.** The separate "Request payload"
  JSON panel is gone; a new `objectLiteral()` helper renders the REAL built object
  as the literal a consumer assigns, so the code shown cannot drift from what the
  app constructs. Arrays render as real `[...]` literals and nested plain objects as
  `{ k: v }` (so `links: [{ resourceId: "…" }]` reads as code); SDK value types
  (UUID / enum / DateTime) keep their wire-string form. Two panels now: **The call**
  (payload inline) + **Example response**.
- **"Compliance" prefix dropped** from project / board / task copy (titles,
  demo-card titles, placeholders, doc comments). A project/board/task is a generic
  container that can track compliance but isn't specifically for it. Mirrors
  example-angular-v2.

### Added

- **Response type name + "TS" shape popover.** Each code-reveal response panel now names the SDK
  class it returns (e.g. `Example response · ProjectExtended`) and shows a small **TS** badge; hover
  (or click to pin) reveals a popover with the REAL class shape and a copy button, so a dev can paste
  the type into their own code as a reference. The shapes are extracted from the installed SDK's
  `.d.ts` at build time (`scripts/extract-response-shapes.mjs` -> `src/lib/response-shapes.generated.ts`,
  `npm run extract:shapes`) — never hand-authored, so they cannot drift. Response types:
  `ProjectExtended` / `BoardExtended` / `TaskExtended` (create+edit) and `TaskComment` (comment).
- **Response JSON auto-folds beyond depth 2** (`src/lib/auto-fold.ts`) — a live
  platform response can run ~900 lines (a 25-repo Hub listing); the response panel
  now collapses every JSON container nested deeper than the envelope, leaving
  `{ count, items: [ {…} ] }` legible with each item one click from expanding. Code
  folding + a fold gutter are enabled on the response block (`CodeBlock fold`).
- **Code-block copy buttons** — every `CodeBlock` (call-reveal panels and rendered
  Markdown fenced code) has a copy affordance that reveals on hover/focus and copies
  the raw source via the native Clipboard API.
- **Home "Your session" landing** (`src/app/page.tsx`) — an intro blurb (the app's
  purpose + the `project -> board -> task` teaching goal) and a session card
  showing the signed-in user, email, and current org (from `useSession()`) with a
  note on how the client bootstrapped. The demo-card grid stays below it.

### Changed — UI

- **Header matched to the portal exactly** (`Header.tsx`, `_header.scss`) — black
  64px toolbar (8px gap, 8px left padding), the ZeroBias app-icon tile at 36px in
  place of the "ZB" mark, brand in Roboto 16px / weight 400, and the 4px cyan->dark
  accent as a **separate `.zb-ui-bar` element** below the toolbar (not a
  border-bottom, which would make the bar 68px). App-shell height accounts for the
  extra 4px.

## [0.3.0] - 2026-07-16

Phase 3 — the app builds its **own** React components (no component library) and
teaches the compliance API surface, **project -> board -> task**, both read and
write. Writes use a **code-reveal** doctrine: create/edit demos never call the
platform — they reveal the call, the real request object built from live input,
and an obfuscated response fixture. See [docs/write-demos.md](./docs/write-demos.md)
and [docs/component-strategy.md](./docs/component-strategy.md).

### Added — features and the calls they demonstrate

- **Token ingest pipeline** (`scripts/ingest-tokens.mjs`, `npm run ingest:tokens`)
  — compiles ngx-library's theme the way its showcase does into
  `src/styles/_tokens.generated.scss` (70 `--zb-*` over the `--mat-sys-*` layer)
  + `_breakpoints.generated.scss`, hard-failing on any dangling `var()`. Angular
  Material is a **build-time-only** devDep; the app ships no Angular. Replaces the
  hand-authored `_tokens.scss`. See [docs/theming.md](./docs/theming.md).
- **Sidebar shell** — `DemoNav` + a demo registry (`src/lib/demos.ts`) whose one
  entry drives both the side rail and the home cards. Fixed 220px, matching the
  showcase (no responsive collapse).
- **`RemoteTable`** (`src/components/RemoteTable.tsx`) — server-driven table on the
  two-call pattern `getXApi().searchOptions()` (per-column sort/filter metadata) +
  `.search(body, page, size, sort)`. `Column.filterParam` carries the
  column-name -> body-field mapping (the plural-filter trap: options key `status`,
  the body wants `statuses`). **`MultiSelect`** (`src/components/MultiSelect.tsx`)
  — a checkbox popover for multi-value filters (pure logic in `src/lib/multi-select.ts`).
- **`MarkdownViewer`** (`react-markdown` + `remark-gfm` + `rehype-sanitize`,
  XSS-safe) and **`MarkdownEditor`** (CodeMirror 6, source + live preview), plus a
  shared read-only **`CodeBlock`** highlighter. The editor/viewer are tools for the
  write-demo forms, not a standalone route.
- **Read demos — Projects, Boards, Tasks** (`/projects`, `/boards`, `/tasks`) —
  list (`RemoteTable`) + detail, cross-linked down the containment chain. Reads
  live on `portalClient`. Project detail adds a structure panel
  (`getProjectApi().getTree(id, true)` — full ancestry + descendants). Task detail
  shows the **client split** (`portalClient.getTaskApi().get(id)` for the read,
  `platformClient.getTaskApi().listSubtasks/listComments(id)` for the rest) and the
  task's `nextTransitions`. Detail routes are query-param (`/x/detail?id=`) so the
  static export needs no server-side dynamic routes.
- **Write demos — code-reveal** (`docs/write-demos.md`) — a `Drawer` (scoped to the
  region beside the rail, no scrim) hosting `CreateXForm` / `EditXForm`, a
  `CallReveal` primitive (call as TS + real request payload + obfuscated fixture in
  `src/lib/fixtures.ts`), and a `CommentComposer`. Constructing the real
  `new NewX(...)` / `new UpdateX(...)` typechecks the shape against the installed
  SDK (anti-rot); nothing is sent.
  - **Projects** — `platformClient.getProjectApi().create(new NewProject(...))` and
    `.update(id, new UpdateProject(...))` (partial delta). Sub-project = `parentId`.
  - **Boards** — `getBoardApi().create(new NewBoard(name, status, boardType, ...))`
    and `.update(id, new UpdateBoard(...))`. `projectId` places the board in a project.
  - **Tasks** — `getTaskApi().create(new NewTask(...))`, whose **four required**
    fields are the lesson: `activityId` (a task hangs off an activity) plus the
    arrays `approvers[]`, `notified[]`, `links[]` (each a `new NewTaskLink(...)`).
    Edit's money shot: **status is a workflow move** —
    `.update(id, new UpdateTask({ transitionId }))` where `transitionId` is one of
    the task's `nextTransitions`, never a status string.
- **`src/lib/uuid-list.ts`** — `splitUuidList()` for the RACI / links inputs
  (comma/whitespace split, de-duplicated). Unit-tested; suite now 41 tests.

### Fixed

- **Dev WebSocket reconnect spam.** The v2 client opens a session WebSocket when
  `ZbEnvironment.socketUrlPath` is truthy. In local dev there is no ws server at
  `localhost:3000/session`, so it failed and reconnect-looped forever, flooding the
  console. `socketUrlPath` is now empty in local dev (disabling the socket); uat /
  qa / prod keep the real `wss://<host>/api/session` channel.
- **Header accent strip clipped by the sidebar.** Scoping the Drawer to `.app-shell`
  (a positioned ancestor) made the shell paint over the header's cyan accent strip.
  Fixed with an explicit `z-index` on `.app-header`.

### Changed

- **Favicon** — the account/browser-tab mark is now the ZeroBias logo, sourced from
  the platform portal's CDN (`metadata.icons` in `src/app/layout.tsx`).

### Deps

- Runtime: `react-markdown`, `remark-gfm`, `rehype-sanitize`, `@codemirror/*`.

## [0.2.2] - 2026-07-10

### Added
- **App version in the account menu.** The user dropdown shows the running app
  version (e.g. `v0.2.2`) on the right of the Sign Out row. Sourced from
  `package.json` at build via `NEXT_PUBLIC_APP_VERSION` (`next.config.ts`), so the
  displayed version always matches the release — one source of truth.

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
