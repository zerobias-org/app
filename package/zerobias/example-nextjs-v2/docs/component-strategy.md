# Component strategy — why this app builds its own components

This app is the canonical **React/Next.js** reference for building on the ZeroBias platform.
It looks like the ZeroBias portal, but it shares **no component code** with it.

That is a deliberate decision, and it has been re-litigated twice. This doc records what was
decided, and — more usefully — **what was rejected and why**, so nobody re-opens it from
first principles.

## The rule

| | |
|---|---|
| **Components** | Hand-built React, in this repo. No component-library dependency. |
| **Look** | Mirror [`@zerobias-org/ngx-library`](https://github.com/zerobias-org/ngx-library)'s markup + SCSS closely where a clear parallel exists. |
| **Values** | **Ingested**, never transcribed — `npm run ingest:tokens` (see [theming.md](./theming.md)). |
| **ngx-library** | A **reference and a values source. Never a runtime dependency.** |

Components should be built to be **reused across demos**, not per-demo. A table with paging is a
reusable table component (sorting, paging, empty/loading states), not a products-specific table.

## Why not just use ngx-library?

It is an Angular library. This is a React app. That is the whole answer.

## Why not a framework-agnostic reproduction of it (Stencil / web components)?

This was actually attempted — a separate `wc-library` repo built ngx-library's components as
Stencil web components with generated React wrappers. It got as far as a working token pipeline
before being tombstoned (2026-07-14).

The token ingest it produced was genuinely good and **now lives here** (`scripts/ingest-tokens.mjs`).
The component half was abandoned: it put a code-generation layer between a reader and the SDK call
they came to see, which is the opposite of what a reference app is for. A demo app's job is to
teach the platform, not to demonstrate a component pipeline.

## Why not Angular Elements?

[Angular Elements](https://angular.dev/guide/elements) packages Angular components as custom
elements. It is the standard, correct answer to "let a non-Angular app embed an Angular library
as-is" — and it was suggested for exactly that reason.

**It cannot deliver the components we actually need.** This is not a preference; it is a hard
technical limit, and it is worth writing down because it is not obvious:

- **`zb-remote-table` does not take its columns as props.** It collects them with
  `@ContentChildren(MatColumnDef)`, `@ContentChildren(MatHeaderRowDef)`, and
  `@ContentChildren(MatRowDef)` — Angular *directives*, projected as content and compiled by
  Angular in the consumer's template. **React cannot supply a `MatColumnDef`.** There is no
  attribute, property, or custom event that expresses one.
- **Three components take `TemplateRef`-typed inputs** (`infinite-scroll-container.itemTemplate`,
  `zb-remote-table`'s row template, and five in the filters panel). `TemplateRef` is an
  Angular-internal object. It cannot be constructed from React.

Angular Elements maps inputs to **dash-case attributes** and outputs to **CustomEvents**. That
contract carries strings and simple values fine. It carries neither projected directives nor
`TemplateRef`s. So it would happily give us `zb-resource-status`, `zb-button-label`,
`simple-panel`, and `nf-empty-state-container` — the four components we can hand-write in an
afternoon — and would fail on the table and infinite scroll, which are the only reason we would
have wanted it.

Even where it works, the cost is the entire Angular runtime. ngx-library's peer dependencies are
`@angular/core`, `common`, `forms`, `animations`, `cdk`, `material`, plus `@acrodata/code-editor`,
`@codemirror/theme-one-dark`, `@ngx-translate/core`, and `ngx-infinite-scroll`. Shipping all of
that inside the canonical *React* example, so that React developers can learn to build on
ZeroBias, undercuts the lesson the app exists to teach.

Two further notes from Angular's own docs: SSR is not addressed (custom elements are client-only,
so App Router would render nothing server-side), and it explicitly warns about problems
"destroying and re-attaching custom elements" via the `disconnect()` callback — which is precisely
what React does on unmount/remount.

## What we DO take from ngx-library

1. **Its design tokens**, compiled — not retyped. See [theming.md](./theming.md).
2. **Its responsive breakpoints**, verbatim (they live only in SCSS mixins; there is no token for
   them, so they must be copied deliberately or our responsive behavior silently diverges).
3. **Its markup and SCSS**, mirrored by hand. Every styled component in ngx-library uses
   `ViewEncapsulation.None` — no `:host`, no `::ng-deep` — so its class names and selectors port
   cleanly by copying.
4. **Its side-panel navigation pattern** for the demo shell.

## What we deliberately do NOT take

- **`.mat-mdc-*` classes.** These are Angular Material's internal skins. Copying them into React
  imports Material's DOM contract without Material. Exclude them.
- **Responsive collapse of the side nav.** The ngx-library showcase's sidenav is
  `mode="side" opened` at a fixed **220px**, with **no media queries anywhere**. It does not
  collapse. If this app collapses its sidebar, that is an **invention**, not parity — decide it
  knowingly rather than assuming it's a port.
