# Loading & status UI

The shared feedback components — how the app shows "the page is loading", "this
data is loading", "this action is running", and "this resource's status". All are
React ports of the portal's own patterns (`@zerobias-org/ngx-library` /
`zb-ui-lib`), so the reference app looks and behaves like the platform.

Two loading tiers, deliberately kept distinct:

| Tier | When | Component |
| --- | --- | --- |
| **Page loading** | app still connecting, before any UI | `PageLoader` (the "0" mark) |
| **In-place loading** | page is up, a specific piece of data/action is pending | `Spinner`, `TableSkeleton`, `ButtonLabel` |

## Page loader — the "0" mark

`src/components/PageLoader.tsx` — a port of the portal's `.app-loading` bootstrap
indicator (`zb-ui-lib/.../components.scss`): the ZeroBias **"0"** (a slashed zero
in the **Mitr** brand font) with a cyan bar sweeping across it via the
`zerobiasSlide` keyframes. This is the *only* full-page loading state; it is not
used for data loads once the page is up.

- Wired into [`AuthGate`](../src/components/AuthGate.tsx): shown while the session
  is still resolving (pre-auth). No visible label — just the branded mark — with
  a `role="status"` + visually-hidden text for screen readers.
- The Mitr font is loaded in [`layout.tsx`](../src/app/layout.tsx) via
  `next/font/google` as `--font-mitr`; its slashed-zero glyph is what gives the
  mark its look.
- Styles + the `zerobiasSlide` animation live in `src/styles/_layout.scss`; the
  two sweep colors are the portal's `--zb-primary` / `--zb-primary-100`.

## Spinner

`src/components/Spinner.tsx` — the equivalent of the portal's `mat-spinner`, for
in-place data loads after the page is up. An indeterminate SVG arc rotating via
the shared `zb-spin` keyframes. The arc is `currentColor`, so it inherits the
surrounding text color; `diameter` matches `mat-spinner`'s API.

- Standalone default is cyan (`--zb-primary`) — right on cards/menus.
- Inside a button it inherits the button's text color (white on a primary `.btn`)
  via a `.btn .spinner-svg { color: inherit }` rule, so it never vanishes on the
  fill.
- Used by: [`OrgSwitcher`](../src/components/OrgSwitcher.tsx) (while orgs load),
  the Products / PKV table loading lines, and `ButtonLabel`.

## Table skeleton

`src/components/TableSkeleton.tsx` — pulsing placeholder `<tr>`s that hold a
table's shape while its data loads, so the layout doesn't jump when rows arrive.
`firstColIcon` renders the first cell as a circle (for logo/avatar columns).
Paired with a `Spinner` "Loading…" line above the table for the active signal.
Used by [`products`](../src/app/products/page.tsx) and [`pkv`](../src/app/pkv/page.tsx).

## Button label

`src/components/ButtonLabel.tsx` — a port of the portal's `zb-ui-button-label`
(`ZbUiButtonLabelComponent`). Swaps a button's label for a `Spinner` while an
action is in flight. Drop it in as the button's child and drive `loading` from
the action's pending state; **keep the button's own `disabled={loading}`** so the
spinner state also blocks repeat clicks — the reason the portal uses this instead
of a plain text label.

Used by: PKV "Save pair", "Create API Key", "Create Shared Session".

## Status dots

`src/components/StatusDot.tsx` — a port of ngx-library's `zb-resource-status` in
dot mode. Renders a resource's operational status as a small colored circle:

- **Solid** fill for terminal states (e.g. `up` → solid green).
- **Outlined** ring (hollow) for transitional states (e.g. `standby` → hollow
  green), so `up` and `standby` — both green — stay distinguishable, exactly as
  the portal's dot does.
- Color-only by design (the status word is wasted space next to a name); the
  label is on hover (`title`) and exposed to assistive tech (`aria-label`).

Colors are ngx-library's own `--zb-color-*` tokens — no longer hand-mirrored, but
**compiled straight out of ngx-library** into `src/styles/_tokens.generated.scss`
by `npm run ingest:tokens` (green `--zb-color-success`, red `--zb-color-error`,
amber `--zb-color-warning`, blue `--zb-color-info`, grey `--zb-color-gray`), with
text from the matching `--zb-text-on-*-bg` token. The dot geometry (14px hole,
3px ring, `content-box`) matches ngx's `size-default` circle exactly.

Used by the connection picker in the [module chain](./module-chain.md) — see
`src/components/ConnectionPicker.tsx`.
