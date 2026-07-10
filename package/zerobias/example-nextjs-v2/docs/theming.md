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

Because dark is a *class*, the switch is a values-only swap — see
[`src/styles/_tokens.scss`](../src/styles/_tokens.scss): light values live in
`:root`, dark overrides under `html.dark-theme, body.dark-theme`.

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
| Light/dark token values | [`src/styles/_tokens.scss`](../src/styles/_tokens.scss) |
| Flash-of-wrong-theme prevention (pre-paint script) | [`src/app/layout.tsx`](../src/app/layout.tsx) |
| Toggle UI | [`src/components/UserMenu.tsx`](../src/components/UserMenu.tsx) |

The `UserMenu` toggle is a two-state flip (`toggle()`), matching the portal's
user menu. The controller also exposes a three-state `cycle()`
(`system -> light -> dark`) if you want a tri-state control.
