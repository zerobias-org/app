# Consuming `@zerobias-org/ngx-library` (v0.2.42)

How this app uses the ZeroBias Angular component library. Verified against the installed package's
own docs (`node_modules/@zerobias-org/ngx-library/docs/`) and its `types/` + `src/styles/`.

The library targets **Angular 21** (`peerDependencies: @angular/core ^21`) — which is why this app
is on Angular 21. Single import entry: `@zerobias-org/ngx-library` (no subpaths). A convenience
`ZbNgxLibraryModule` re-exports everything, or import individual `Zb*Component`s for tree-shaking.

## Providers (`app.config.ts`)

```ts
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideZbDefaults } from '@zerobias-org/ngx-library';

providers: [
  provideAnimations(),        // Material animations
  provideHttpClient(),        // ngx-library components that fetch
  ...provideZbDefaults(),     // Material form-field/paginator/ripple/tabs defaults (spread!)
]
```

`provideZbDefaults()` returns an array (spread it). It sets `MAT_FORM_FIELD_DEFAULT_OPTIONS`
(outline), `MAT_PAGINATOR_DEFAULT_OPTIONS`, disables global ripples, and `MAT_TABS_CONFIG`.

## Theming (`src/styles.scss` + `angular.json`)

The theme is Angular Material **M3** — `theme.scss` exports `$theme` (light) and `$altTheme`
(dark) via `mat.define-theme(...)`. Dark mode is a `.dark-theme` class toggled by `ZbThemeService`.

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

`ZbThemeService`: `.toggle()` (light<->dark), `.cycle()` (system->light->dark), `.setPreference('dark')`,
`.preference$`, `.isDarkMode()`.

## Shell

No pre-built shell/nav ships — compose `mat-sidenav-container` + `mat-toolbar` yourself (a fixed
side rail of demo links + a content area), styled with the `--zb-*` tokens. `ZbSimplePanelComponent`
is the card container; `ZbAvatarLabelComponent` for org/user chips.

## Remote table (the read-demo workhorse)

`zb-remote-table` via `ZbRemoteTableContainerComponent` (extend it) + `ZbRemoteTableService`
(**provide per-component, not root**). `ZB_TABLE_MODE.ROUTE` syncs filters/sort/page to the URL.
Columns are `<ng-container matColumnDef>` projections. Server flow: `tableService.init(config)` ->
`tableService.getRequestParams()` -> your SDK `search(...)` -> `tableService.setData({items, count})`.
This is the Angular-native equivalent of the React app's hand-built `RemoteTable`.

## Status/chips (CSS classes, no component needed)

`<span class="zb-chip square task-status in_progress">` + the `snakeToSpaces` pipe. Groups:
`.severity`, `.priority`, `.task-status`, `.state`, `.raci`, `.party-type`, `.cmm`, `.generic`.
`ZbResourceStatusComponent` (`zb-resource-status`) for a labeled status dot.

## Other useful pieces

`zb-dialog` (`ZbDialogComponent`), `zb-search-input`, `zb-simple-autocomplete` /
`zb-simple-multi-autocomplete` (the real user/resource pickers — the React app deferred these),
`zb-code-editor` (`ZbCodeEditorComponent`, CodeMirror), `zb-button-label`, `zb-empty-state-container`.
Directive `img[imgDefault]`, pipe `snakeToSpaces`.
