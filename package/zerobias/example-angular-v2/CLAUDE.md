# CLAUDE.md

## MANDATORY: read the `angular-architect` skill BEFORE writing any code

Before writing or editing **any** code in this package (`example-angular-v2`), you **MUST** first
invoke the **`angular-architect`** skill:

```
Skill(angular-architect)
```

and adhere to modern **Angular 21** best practices it describes. This is mandatory, every session,
before the first code edit — no exceptions. If you are about to Write/Edit a `.ts`/`.html`/`.scss`
file here and have not loaded that skill this session, stop and load it first.

Angular 21 essentials to enforce (see [AGENTS.md](./AGENTS.md) for the full list): standalone +
**zoneless**, **signals** (`signal`/`computed`/`effect`), new control flow (`@if`/`@for`),
`inject()` over constructor DI, `ChangeDetectionStrategy.OnPush`, **Signal Forms**
(`@angular/forms/signals`), `@angular/aria` for a11y, and Vitest for tests.

## CRITICAL / REQUIRED: components & styles — ngx-library FIRST, then Material, then hand-roll

Do NOT mint new components or new SCSS until you have checked ngx-library. Strict order of
preference, every time:

1. **`@zerobias-org/ngx-library` FIRST.** For any UI element you need — cards/panels, chips, badges,
   status dots, dialogs, tables, autocompletes, buttons, lists, avatars, etc. — **search ngx-library
   first** and use its component or SCSS. It ships deep SCSS layers (`.zb-chip` groups for severity /
   priority / task-status / state / raci / party-type / cmm / generic, plus buttons, checkbox, and
   the `--zb-*` token system). **Before writing ANY SCSS, check what ngx-library already provides.**
   - Components: the `Zb*Component`s (e.g. `zb-simple-panel`, `zb-dialog`, `zb-remote-table`,
     `zb-resource-status`, `zb-simple-autocomplete`) — see `docs/using-ngx-library.md` and the
     package's own `node_modules/@zerobias-org/ngx-library/docs/COMPONENT_API.md` + `CSS_CLASSES.md`.
   - Styles/classes: the `.zb-*` classes and `--zb-*` tokens — never hardcode a color or hand-roll a
     chip/badge/card that already exists.
2. **Angular Material** — if it's genuinely not in ngx-library, use a Material component next.
   Reference: https://v21.material.angular.dev/
3. **Hand-roll — LAST RESORT ONLY**, when neither ngx-library nor Material has it (e.g. the app-shell
   layout, which ngx-library does not ship). If you hand-roll, still style with `--zb-*` tokens.

If you catch yourself writing a `.card` / `.chip` / `.badge` / `.panel` style, or a bespoke
component, STOP and check ngx-library first.

## The rest

Agent guidance for this app lives in **[AGENTS.md](./AGENTS.md)** — read it first (app layout, the
ZeroBias v2 client/SDK + `ngx-library` patterns, build/deploy, and the local Angular docs index).
Consuming the component library: [docs/using-ngx-library.md](./docs/using-ngx-library.md).
