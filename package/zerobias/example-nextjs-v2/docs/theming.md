# Theming (light / dark)

This app themes **identically to the ZeroBias portal** — same storage, same
class, same defaults — so it looks right both standalone and when embedded in the
portal's iframe. It is a faithful port of the portal's `ZbThemeService`
(`@zerobias-org/ngx-library`) into framework-neutral code.

## The model (matches the portal exactly)

| Concern | Value |
|---|---|
| localStorage key | `zb-theme-preference` |
| Stored values | `light` \| `dark` \| `system` (default **`system`**) |
| Dark applied via | **`dark-theme` class** on `<body>` (and `<html>` from the FOWT script) |
| Native UI | `document.documentElement.style.colorScheme` = `dark`/`light` |
| Light is the default | bare `:root`; `.dark-theme` is the override |

Because dark is a *class*, the switch is a values-only swap: light values live on
`html`, dark overrides under `body.dark-theme`.

## The tokens are GENERATED — do not hand-edit them

`--zb-*` values are **compiled out of `@zerobias-org/ngx-library`**, not transcribed by hand:

```bash
npm run ingest:tokens     # after any ngx-library bump
```

[`scripts/ingest-tokens.mjs`](../scripts/ingest-tokens.mjs) compiles ngx-library's SCSS theme the
same way ngx-library's own component-showcase does, so our values are identical to the portal's
**by construction** rather than by someone retyping them correctly. It emits two files, both
marked `GENERATED — DO NOT EDIT`:

| File | What |
|---|---|
| `src/styles/_tokens.generated.scss` | 70 `--zb-*` tokens over the 157 `--mat-sys-*` values they resolve through. Light on `html`, dark on `body.dark-theme`. |
| `src/styles/_breakpoints.generated.scss` | ngx-library's `mediaQueries.scss`, verbatim — **7 max-width breakpoints** (400/480/768/992/1200/1440/1600). These exist only as SCSS mixins upstream; if we don't use them, responsive behavior diverges from the portal silently, with colors and spacing still looking perfect. |

The script **hard-fails the build** if any `--zb-*` resolves to a `--mat-sys-*` that isn't defined
in its own output. That guard is why the output can be trusted: a dangling token renders unstyled
and looks like a CSS typo, so it fails loudly instead.

Angular Material is a **build-time-only** devDependency — it is what resolves the M3 layer the
tokens reference. **No Angular code ships in the bundle**; the output is plain CSS custom
properties. See [component-strategy.md](./component-strategy.md).

[`src/styles/_tokens.local.scss`](../src/styles/_tokens.local.scss) is the small hand-authored
remainder: the ~20 tokens the portal has no opinion about (spacing, fonts, menu surfaces,
toolbar). Anything the portal *does* define must come from the generated layer, so an upstream
change reaches us on the next ingest instead of drifting.

### Gotcha: a token DERIVED from a themed token must be declared on `body`, not `:root`

A custom property whose value contains `var()` is substituted **on the element where it is
declared**. The generated layer puts light on `html` and dark on `body.dark-theme` (ngx-library's
own contract — we mirror it rather than change it). So this is a bug:

```scss
:root { --zb-menu-bg: var(--zb-background-card); }   // WRONG
```

It resolves `--zb-background-card` at `html`, where only the **light** value exists — locking in
white. The dark override on `body` lands too late, and the already-substituted value inherits
down. This shipped a white dropdown with white-on-white text in dark mode.

Declare derived tokens on `body`, so substitution happens on the same element that carries the
dark override, and they resolve correctly in both themes with no duplication:

```scss
body { --zb-menu-bg: var(--zb-background-card); }    // RIGHT
```

Tokens that are pure literals (spacing, fonts, the always-black toolbar) are fine on `:root` —
the trap only applies to values that reference a themed token.

## Standalone vs. embedded

- **Standalone** (top-level window): resolves its own preference and, while the
  preference is `system`, follows the OS `prefers-color-scheme` and reacts to
  changes live.
- **Embedded in the portal iframe**: does **not** self-apply on load. It listens
  for the portal's `theme_change` `postMessage` and follows the portal's theme.
  This is the whole point of matching the model — a bespoke toggle would drift
  from the portal when embedded.

## Where it lives

| Piece | File |
|---|---|
| Controller + `useTheme()` hook | [`src/lib/theme.ts`](../src/lib/theme.ts) |
| Light/dark token values (GENERATED) | [`src/styles/_tokens.generated.scss`](../src/styles/_tokens.generated.scss) — regenerate with `npm run ingest:tokens` |
| App-only tokens (hand-authored) | [`src/styles/_tokens.local.scss`](../src/styles/_tokens.local.scss) |
| Flash-of-wrong-theme prevention (pre-paint script) | [`src/app/layout.tsx`](../src/app/layout.tsx) |
| Toggle UI | [`src/components/UserMenu.tsx`](../src/components/UserMenu.tsx) |

The `UserMenu` toggle is a two-state flip (`toggle()`), matching the portal's
user menu. The controller also exposes a three-state `cycle()`
(`system -> light -> dark`) if you want a tri-state control.
