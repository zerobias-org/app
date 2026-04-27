---
version: alpha
name: SME Mart
description: ZeroBias ngx-library Material 3 theme applied to SME Mart. Source palette primary=#03aff0 (ZB Azure) / tertiary=#6aa84f (ZB Green). Values below are the M3 tone-40 resolutions that ship at runtime via mat.theme().
colors:
  primary: "#00658d"
  on-primary: "#ffffff"
  primary-container: "#c6e7ff"
  on-primary-container: "#001e2d"
  secondary: "#3a637c"
  on-secondary: "#ffffff"
  secondary-container: "#c6e7ff"
  tertiary: "#316b19"
  on-tertiary: "#ffffff"
  tertiary-container: "#b1f491"
  on-tertiary-container: "#062100"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  background: "#f5faff"
  on-background: "#171c20"
  surface: "#f5faff"
  surface-container: "#dee3e8"
  surface-container-high: "#d0d5da"
  on-surface: "#171c20"
  on-surface-variant: "#404b52"
  outline: "#556068"
  outline-variant: "#bdc8d1"
  status-backlog: "#e9e9e9"
  status-in-progress: "#d7e0ee"
  status-done: "#d8ecba"
  status-cancelled: "#eed5d1"
  status-label: "#0f0f10"
typography:
  display-lg:
    fontFamily: Roboto
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1.15
  h1:
    fontFamily: Roboto
    fontSize: 2rem
    fontWeight: 500
    lineHeight: 1.25
  h2:
    fontFamily: Roboto
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.3
  h3:
    fontFamily: Roboto
    fontSize: 1.25rem
    fontWeight: 500
    lineHeight: 1.35
  body-md:
    fontFamily: Roboto
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Roboto
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: Roboto
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.25
  button:
    fontFamily: Roboto
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.02em
  caps:
    fontFamily: Roboto
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0.08em
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 10px 20px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 10px 20px
    height: 40px
  button-tertiary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 10px 20px
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  panel-header:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.h3}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  chip-neutral:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    typography: "{typography.caps}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  chip-status-backlog:
    backgroundColor: "{colors.status-backlog}"
    textColor: "{colors.status-label}"
    typography: "{typography.caps}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  chip-status-in-progress:
    backgroundColor: "{colors.status-in-progress}"
    textColor: "{colors.status-label}"
    typography: "{typography.caps}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  chip-status-done:
    backgroundColor: "{colors.status-done}"
    textColor: "{colors.status-label}"
    typography: "{typography.caps}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  chip-status-cancelled:
    backgroundColor: "{colors.status-cancelled}"
    textColor: "{colors.status-label}"
    typography: "{typography.caps}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px 14px
    height: 40px
  table-header:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.caps}"
    padding: 12px 16px
  table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    padding: 12px 16px
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview

SME Mart is a marketplace for Subject Matter Experts in compliance / cybersecurity. The UI is a Material 3 surface produced by `@zerobias-org/ngx-library` on top of Angular Material. The feel is **enterprise-calm**: light neutrals, high contrast type, a single saturated azure for primary action, and a secondary green reserved for affirmative states (save, publish, success).

This DESIGN.md is the canonical token contract. Any generated mock or agent-authored UI must resolve its colors, typography, and component tokens from this file. The *source* palette entered into `mat.define-theme` is `primary: #03aff0` and `tertiary: #6aa84f`; the values captured above are the M3 tone-40 outputs that the theme pipeline actually ships at runtime. Use the resolved values when drawing.

## Colors

The palette leans cool: Azure blue for identity and primary action, Limestone white-blue for surfaces, Ink near-black for text. Green is structurally reserved for positive affirmation — do not use it as a general accent.

- **Primary (#00658d) — Deep Azure.** The single driver for primary buttons, links, and focus states. Pairs with `#ffffff` text at 7.3:1.
- **Primary container (#c6e7ff).** Hover and selected-row backgrounds for primary elements. Text goes ink (#001e2d) for legibility.
- **Secondary (#3a637c) — Slate.** Muted blue for secondary text, metadata, and outline buttons. Not for primary action.
- **Tertiary (#316b19) — Forest.** Positive-action surfaces only: publish, approve, success toast. Never a neutral accent.
- **Error (#ba1a1a).** Destructive actions, validation errors. Use sparingly; prefer prevention over correction.
- **Background / Surface (#f5faff) — Limestone.** Warm-cool page background. Not pure white.
- **Surface container (#dee3e8).** Raised chrome: panel headers, table headers, chip backgrounds.
- **On-surface (#171c20) — Ink.** All body text.
- **Outline (#556068) / outline-variant (#bdc8d1).** Dividers and form-field borders.

### Status chips

SME Mart uses a fixed status palette for task/engagement states, matched to ZeroBias `zb-resource-status`:

- **Backlog / Todo (#e9e9e9):** neutral gray. No connotation.
- **In-Progress / Awaiting Approval (#d7e0ee):** muted blue. Work is active.
- **Done (#d8ecba):** muted green. Terminal success.
- **Cancelled (#eed5d1):** muted rose. Terminal negative.

Label text is always `#0f0f10` regardless of background, per the ngx-library chip spec.

## Typography

Roboto everywhere, with `Helvetica Neue` and the system sans-serif as fallbacks. No display font — the system is a working tool, not a magazine.

- **h1 / h2 / h3:** 500 weight, used only for page and section titles.
- **body-md (14px):** the default body size. Most UI copy.
- **body-sm (12px):** metadata, captions, helper text.
- **label (14px / 500):** form labels, card titles.
- **button (14px / 500, +letter-spacing):** all Material buttons.
- **caps (12px / 500, +letter-spacing):** chip content, table headers. Rendered UPPERCASE at the component level (snake_case inputs are auto-transformed by `zb-resource-status`).

## Layout

Spacing scales in 4px units (`xs` 4 → `xl` 32). Use the named tokens; don't hand-pick pixel values.

Standard page frame:

- Left rail: fixed app shell navigation (`zb-drawer`).
- Main: 16px page padding, `lg` (24px) between major sections.
- List + detail layouts use `react-resizable-panels`-style split with a 4px gutter.

Drawer width defaults to `280px` (CSS var `--drawer-width`).

## Shapes

- **sm (4px)** — default input corner, small chips.
- **md (8px)** — card and panel corner. The workhorse.
- **lg (12px)** — dialogs and floating surfaces.
- **full (9999px)** — buttons and status chips. All Material buttons are pill-shaped in this system.

## Components

The primitives ship from `@zerobias-org/ngx-library`. Agents and mocks must map to these — do not substitute third-party components. The token inputs listed in the YAML front matter describe the visual contract; the **Angular component** that realises it is named in parentheses.

- **button-primary** — Filled `mat-button` with `color="primary"`. Use for the single primary action per view.
- **button-secondary** — `mat-stroked-button` or text button. Secondary/tertiary actions.
- **button-tertiary** — Filled button with `color="accent"`. *Only* for publish / approve flows.
- **panel / panel-header** — `ZbSimplePanelComponent`. Pattern: header strip on `surface-container`, body on `surface`. The `header-only` variant is how master detail cards render in the task surfaces.
- **card** — any Material `mat-card` or `ZbSimplePanel` body. Same padding and radius as panel.
- **chip-*** — status-bearing chips render via `ZbResourceStatusComponent`. Neutral chips via `ZbChipColorsDirective` on a plain element. Never hand-style chips.
- **input** — `mat-form-field appearance="outline"` + `matInput`. Outline variant is the project default.
- **table-header / table-row** — `ZbCustomizableTableComponent` or `ZbRemoteTableComponent`. Row hover is `primary-container`.
- **dialog** — Angular Material `MatDialog`. Title uses h3; actions right-aligned.

## Do's and Don'ts

**DO**

- Use `{colors.primary}` for the single primary action on any screen.
- Use `{colors.tertiary}` ONLY for publish / approve / success.
- Reach for ngx-library primitives before Angular Material before custom CSS.
- Keep chip text uppercase snake-less (convert spaces -> underscores before passing to `zb-resource-status`).

**DON'T**

- Do not introduce a fourth accent color for "variety." The system is intentionally sparse.
- Do not hard-code hex values in components — read `--zb-*` / `--mat-sys-*` custom properties or the tokens above.
- Do not use green as a neutral accent. Green == affirmative only.
- Do not use `!important` to force token overrides — fix specificity instead.
- Do not invent component names not in this file. If a new pattern is needed, add it here first, then build it in ngx-library, then use it.

## References

- Source palette generator: `node_modules/@zerobias-org/ngx-library/src/styles/_theme-colors.scss`
- Applied theme: `node_modules/@zerobias-org/ngx-library/src/styles/theme.scss`
- Project overrides: `src/styles.scss`
- Component catalog: `node_modules/@zerobias-org/ngx-library/AGENTS.md`
- Memory: `MEMORY.md` -> "ngx-library" + "ZB task-status chip colors"
