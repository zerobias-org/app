# Consuming `@zerobias-org/ngx-library` (v0.2.42)

How this app uses the ZeroBias Angular component library. Verified against the installed package's
own docs (`node_modules/@zerobias-org/ngx-library/docs/`) and its `types/` + `src/styles/`. Adapted
from the same doc in `../../example-angular-v2`.

The library targets **Angular 21** (`peerDependencies: @angular/core ^21`) — which is why this app
is on Angular 21. Single import entry: `@zerobias-org/ngx-library` (no subpaths). A convenience
`ZbNgxLibraryModule` re-exports everything, or import individual `Zb*Component`s for tree-shaking
(what this app does).

Its other peer dependencies are why `@ngx-translate/core`, `ngx-infinite-scroll`,
`@acrodata/code-editor` and `@codemirror/theme-one-dark` are in `package.json` even though this app
imports none of them directly.

## Providers (`app.config.ts`)

```ts
providers: [
  provideAnimationsAsync(),   // REQUIRED — zb-simple-panel uses synthetic animation bindings
  provideHttpClient(),        // ngx-library components that fetch
  ...provideZbDefaults(),     // Material form-field/paginator/ripple/tabs defaults (spread!)
  importProvidersFrom(TranslateModule.forRoot()),
]
```

Two traps this app already hit:

- Without animations providers, ngx-library components throw **NG05105** at runtime.
- `zb-remote-table` uses the `translate` pipe internally, so `TranslateService` / `TranslateStore`
  must be in the injector. Plain `TranslateModule` does **not** provide them — only `forRoot()`
  does — and its absence throws **NG0201 (No provider for _TranslateService)** the moment such a
  component renders.

`provideZbDefaults()` returns an array (spread it). It sets `MAT_FORM_FIELD_DEFAULT_OPTIONS`
(outline), `MAT_PAGINATOR_DEFAULT_OPTIONS`, disables global ripples, and `MAT_TABS_CONFIG`.

## i18n

The library renders translation **keys** (e.g. `'ZbRemoteTable.Search' | translate`) but ships no
dictionary; the real platform apps load one from their own `assets/i18n/en.json`. This app uses only
`zb-remote-table`, so `app.config.ts` registers just that namespace inline
(`translate.setTranslation('en', { ZbRemoteTable: { … } }, true)`). Without it the search box,
filter controls, sort menu and empty state show raw keys.

One label is deliberately not the library default: `Contains` is set to **"Starts with"**, because
the receiver's filter language has no contains operator and the control-id search compiles to a
prefix match. Labelling it "Contains" would promise a search this app cannot run.

## Theming (`src/styles.scss` + `angular.json`)

The theme is Angular Material **M3** — `theme.scss` exports `$theme` (light) and `$altTheme`
(dark). Dark mode is a `.dark-theme` class on `body`, toggled by `ZbThemeService`.

`angular.json` build options need the library's styles on the SCSS include path and its assets
copied:

```json
"stylePreprocessorOptions": { "includePaths": ["node_modules/@zerobias-org/ngx-library/src/styles"] },
"assets": [ { "glob": "**/*", "input": "node_modules/@zerobias-org/ngx-library/src/assets", "output": "assets" } ]
```

`src/styles.scss` (exact partial names verified in `src/styles/`):

```scss
@use '@angular/material' as mat;
@use 'theme' as theme;         // $theme, $altTheme
@use 'theme-variables' as *;   // zb-theme-variables-light/dark mixins
@use 'chips'; @use 'checkbox'; @use 'buttons';

html { color-scheme: light; @include mat.theme(theme.$theme); }
@include zb-theme-variables-light(theme.$theme);
@include zb-theme-variables-dark(theme.$altTheme);
body { background: var(--zb-background); color: var(--zb-text);
  &.dark-theme { color-scheme: dark; @include mat.theme(theme.$altTheme); } }
```

CSS custom properties (use these, never hardcode): `--zb-primary` (#03aff0), `--zb-background`,
`--zb-background-card`, `--zb-text`, `--zb-secondary-text`, `--zb-divider`, `--zb-spacing-{xs,sm,md,lg}`,
`--zb-font-size-{xs..xl}`, semantic `--zb-color-{success,error,warning,info,pending}` and
`--zb-severity-{critical,high,medium,low}`. Full list: the package's `docs/CSS_PROPERTIES.md`.

`ZbThemeService`: `.toggle()` (light<->dark), `.cycle()` (system->light->dark),
`.setPreference('dark')`, `.preference$`, `.isDarkMode()`. The user menu exposes it.

## What this app uses

- **`zb-simple-panel`** (`ZbSimplePanelComponent`) — the card container, on every page.
  `mode="header-only"` + `[bodyPad]="true"` is the pattern used throughout.
- **`zb-remote-table`** via `ZbRemoteTableContainerComponent` (extend it) + `ZbRemoteTableService`
  (**provide per-component, not root**) + `zb-remote-table-header` for the filter/sort menus. The
  messages page runs it in `ZB_TABLE_MODE.ROUTE`, which syncs filters/sort/page to the URL. Columns
  are `<ng-container matColumnDef>` projections. Server flow: `tableService.init(config)` →
  `tableService.getRequestParams()` → your SDK `search(...)` → `tableService.setData({items, count})`.
  Filter menus take `[useExactKey]="true"` here, because the receiver's filter accepts one value per
  attribute and nothing pluralizes. No column is `sortable`: the module accepts a sort and discards
  it. **Third trap, this app's own:** the table components are `Default` strategy and assign plain
  fields from RxJS subjects, so under this app's zoneless change detection asynchronously-arriving
  column options never reached the DOM — the header filter menus rendered zero buttons while holding
  22 options. Subscribe to `tableService.columnOptionChanges()` and `markForCheck()`; see
  [../AGENTS.md](../AGENTS.md#ngx-library-under-zoneless-change-detection).
- **`zb-resource-status`** (`ZbResourceStatusComponent`) — the labelled status pill, for message
  status and connection status.

Also available and worth checking before hand-rolling anything: `zb-dialog`, `zb-search-input`,
`zb-simple-autocomplete` / `zb-simple-multi-autocomplete`, `zb-code-editor` (CodeMirror),
`zb-button-label`, `zb-empty-state-container`, `zb-avatar-label`, the `.zb-chip` class families
(`.severity`, `.priority`, `.task-status`, `.state`, `.raci`, `.party-type`, `.cmm`, `.generic`),
the `img[imgDefault]` directive and the `snakeToSpaces` pipe.

## What is hand-rolled here, and why

No shell/nav component ships, so the app shell is `mat-sidenav-container` + `mat-toolbar` composed
by hand and styled with `--zb-*` tokens.

`shared/json-view` and `shared/er7-view` are hand-rolled `<pre>` components rather than
`zb-code-editor`: they paint arbitrary character ranges and exact JSON paths computed from the HL7
schema, which a CodeMirror instance cannot place, and they are a fraction of its weight. See
[architecture.md](./architecture.md).
