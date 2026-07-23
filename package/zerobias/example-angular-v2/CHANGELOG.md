# Changelog

All notable changes to **example-angular-v2** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the app
uses [Semantic Versioning](https://semver.org/). The version below tracks
`package.json` `"version"`. **Maintained manually for now** — there is no CI
changelog/version automation yet.

Each release is written so that a developer — or their AI assistant — who cloned
a specific version can quickly see **what changed** and **which ZeroBias v2
client / SDK calls and patterns** that version introduces, to make incorporating
the changes into their own app easier. This app is the **Angular 21** twin of
`example-nextjs-v2` (standalone, zoneless, signals; built on the real
`@zerobias-org/ngx-library`), so entries also note where it now matches — or
still differs from — the Next.js reference.

## [Unreleased]

## [0.2.0] - 2026-07-22

Rounds out the **project -> board -> task** surface toward Next.js
parity and establishes the SDK-construction and code-reveal doctrines the whole
app now follows.

### Added

- **Module Usage — GitHub** (`pages/module/module-usage.ts`, new `/module` route
  + nav entry). Demonstrates the canonical **module chain**, each hop a real read:
  `product (github.github)` via `portalClient.getProductApi().search()` ->
  `module` via `storeClient.getModuleApi().search({ products })` -> `connection`
  via `hubClient.getConnectionApi().search({ modules })` -> `scope` via
  `hubClient.getScopeApi().search({ connections })` -> a live GitHub client
  connected **through the Hub** (`new GithubHubImpl().connect(HubConnectionProfile)`),
  then `listMyOrganizations` / `listRepositories`. The Hub holds the connection's
  GitHub credentials, so the browser never sees them. A monotonic run-id guard
  discards superseded async results; connected clients are cached per target.
  New deps: `@auditlogic/hub-sdk-github-github`, its peer
  `@zerobias-org/util-connector`, and the `events` polyfill (the connector imports
  Node's `EventEmitter`; Angular's esbuild does not auto-polyfill it as Next.js does).
- **Recursive project tree** on project detail (`pages/projects/project-tree-node.ts`),
  replacing the flat top-level list. Renders the full ancestry + descendants from
  `getProjectApi().getTree(id, true)`; the current node is highlighted and not
  linked, every other node links to its own detail. Each node's **+** opens a
  code-reveal **sub-project** create demo (the real `NewProject` carries `parentId`).
  Surfaces `skippedSubtreeCount`; shows an illustrative example hierarchy for a
  standalone project. Mirrors the real `projects-app` structure panel (flatten +
  house pattern), not `mat-tree`.
- **Live call log** on the Module page — a right-hand column of `app-call-reveal`
  panels showing every executed hop with the platform's **actual** response
  (`[live]="true"`), newest hop replacing any prior run of the same hop; a new
  selection truncates now-stale downstream hops. Paged responses are trimmed to
  their shape plus the first few items.
- **Markdown copy buttons** — `[clipboard]="true"` on the markdown viewer, wired to
  the vendored `ClipboardButtonComponent` via `CLIPBOARD_OPTIONS`. Requires
  `clipboard` in `angular.json` `scripts` (without it ngx-markdown throws and
  **aborts the whole render** — not just the buttons).
- **`CHANGELOG.md`** (this file).

### Changed

- **SDK request objects are built as plain object literals typed to the model** —
  `const board: NewBoard = { name, status, boardType }` — replacing positional
  constructors. Typing the const makes the **compiler enforce the model's required
  fields** at the call site (a missing required field is a build error); the
  alternative `Model.newInstance(obj: any)` accepts anything and catches nothing.
  Values are the real SDK types (`EnumValue` via `Status.from(...)`, `UUID` via
  `toUUID(...)`), so nothing is coerced or serialized in the builder. Applied to
  `NewProject`, `UpdateProject`, `NewBoard`, `UpdateBoard`, `NewTask`, `UpdateTask`,
  `NewTaskComment`, `NewTaskLink`, `Pkv`, `CreateApiKeyBody`, and the four
  `Search*Body` bodies.
- **Code-reveal panels merge the request payload into the call.** The separate
  "Request payload" JSON panel is gone; `app-call-reveal` now renders the call
  **with its live values inline** — `const project: NewProject = { name: "...",
  status: "draft", ... }` — via a new `objectLiteral()` helper that serializes the
  REAL built object, so the code shown cannot drift from what the app constructs.
- **Milkdown/Crepe editor + CodeMirror panels follow the app theme.** Scoped
  Crepe's `nord-dark` custom properties under `body.dark-theme` (no runtime
  stylesheet swap, no JS; reactive via `ZbThemeService`, including the OS `system`
  preference). CodeMirror already re-themed via `ZbThemeService`; verified rather
  than changed.
- **Response JSON auto-folds beyond depth 2** in code panels
  (`shared/call-reveal/auto-fold.ts`), keeping a ~900-line repo listing readable as
  `{ count, items: [ {…} ] }`. Reduced the Module call column from ~18,000px to
  ~2,300px.
- Production bundle budget raised (initial: warning 10mb -> 12mb, error 12mb ->
  14mb) to fit the added SDKs + CodeMirror/Milkdown without a spurious build error.

### Fixed

- **PATCH deltas preserve `null` for free.** Deltas are built as a typed
  `const delta: UpdateX = {}` with only changed fields assigned. `null` (an explicit
  "clear this field") and `undefined` (absent, "leave alone") mean different things
  on the wire; because the builder never round-trips through a serializer, an
  emptied description or unassigned party keeps its `null` and is not silently
  dropped. (An earlier iteration used `Model.newInstance` + an `applyNulls` helper
  to work around `ObjectSerializer.deserialize` dropping nulls; the typed-literal
  pattern removes that whole problem — the helper is gone.)
- **Double fold-carets.** `zb-code-editor` runs CodeMirror with `setup: 'basic'`,
  which already includes `foldGutter()`; the auto-fold extension no longer adds a
  second one.

### Notes for the Next.js twin

`example-nextjs-v2` is now behind on the SDK-construction change tracked in its
`CLAUDE.md` TODO: build request objects as plain object literals typed to the model
(`const x: NewX = { … }`) for compile-time required-field checking, and merge the
request payload into the call panel.

## [0.1.0]

Initial Angular 21 scaffold and the Phase B/C read demos + code-reveal write demos
(products, key-value, projects, boards, tasks) with drill-down detail pages, built
on `@zerobias-org/ngx-library` (`zb-remote-table`, `zb-resource-status`,
`zb-code-editor`, `zb-simple-panel`), Signal Forms, and a Vitest suite.
