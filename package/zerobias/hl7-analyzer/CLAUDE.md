# CLAUDE.md

Agent guidance for this app lives in **[AGENTS.md](./AGENTS.md)** — read it first (what the app
does, page/service layout, the invariants that must not be broken, local dev, build/deploy). The
repo-wide rules are in [`../../../AGENTS.md`](../../../AGENTS.md). This file holds the rules that
apply the moment you are about to write code here.

## Angular 21 — the non-negotiables

There is no skill to load; the rules are these, and they are enforced by the existing code:

- **Standalone** components/directives/pipes. No NgModules.
- **Zoneless** change detection (the app default — no zone.js). Never add
  `provideZoneChangeDetection`.
- **Signals** for component/service state, `computed()` for derived state, `effect()` sparingly
  (and always with `untracked()` around the work, as in `pages/messages/message-detail.ts`).
- **New control flow** in templates — `@if` / `@for` / `@switch`, never `*ngIf` / `*ngFor`.
- **`inject()`** over constructor DI.
- **`ChangeDetectionStrategy.OnPush`** on every component. The one deliberate exception is
  `pages/messages/messages.ts`, which extends `ZbRemoteTableContainerComponent` — that base class
  mutates plain fields from RxJS callbacks, so an OnPush host would never re-render them. The
  reason is in the component's header comment; keep it there if you touch it.
- **Vitest** for unit tests (`npm test`).
- TypeScript strict; small components; feature routes lazy-loaded (`app.routes.ts`).

Angular changes fast across versions — prefer version-exact docs over memory. Run
`npx github:w3geekery/angular-agents-md` in this folder to download the pinned docs into
`.angular-docs/` (gitignored).

## REQUIRED: components & styles — ngx-library FIRST, then Material, then hand-roll

Do NOT mint new components or new SCSS until you have checked ngx-library. Strict order of
preference, every time:

1. **`@zerobias-org/ngx-library` FIRST.** For any UI element you need — cards/panels, chips, badges,
   status dots, dialogs, tables, autocompletes, buttons, lists, avatars — **search ngx-library
   first** and use its component or SCSS. It ships deep SCSS layers (`.zb-chip` groups for severity /
   priority / task-status / state / raci / party-type / cmm / generic, plus buttons, checkbox, and
   the `--zb-*` token system). **Before writing ANY SCSS, check what ngx-library already provides.**
   - Components: the `Zb*Component`s. This app uses `zb-simple-panel`, `zb-remote-table` (+
     `zb-remote-table-header`, `ZbRemoteTableService`) and `zb-resource-status` — see
     [docs/using-ngx-library.md](./docs/using-ngx-library.md) and the installed package's own
     `node_modules/@zerobias-org/ngx-library/docs/COMPONENT_API.md` + `CSS_CLASSES.md`.
   - Styles/classes: the `.zb-*` classes and `--zb-*` tokens — never hardcode a color or hand-roll a
     chip/badge/card that already exists.
2. **Angular Material** — if it's genuinely not in ngx-library, use a Material component next.
   Reference: https://v21.material.angular.dev/
3. **Hand-roll — LAST RESORT ONLY**, when neither has it. In this app that is exactly three things:
   the app-shell layout, and the two code views `shared/json-view/` and `shared/er7-view/`. Those
   two are hand-rolled `<pre>`s on purpose — the highlights are arbitrary character ranges and JSON
   paths, which a CodeMirror-based `zb-code-editor` cannot place. Style everything with `--zb-*`
   tokens regardless.

If you catch yourself writing a `.card` / `.chip` / `.badge` / `.panel` style, or a bespoke
component, STOP and check ngx-library first.

## Specific to this app

- **The header comments in `src/app/core/*.ts` are the design record.** Each one states what was
  verified against the live UAT receiver and what happens if you get it wrong (the `messageStructure`
  vs `messageType` attribute, the MSH off-by-one in ER7, why `response` is content and not envelope
  in the fingerprint). Read the header before changing a file, and update it when the behaviour
  changes — several of those notes exist because the obvious "fix" is wrong and returns zero rows or
  a plausible-looking wrong answer rather than an error.
- **Never claim more than the data supports.** This app reports on live clinical traffic, and the
  invariants in [AGENTS.md](./AGENTS.md#invariants) — unparsed messages are never counted valid or
  invalid, a highlight is dropped rather than approximated, a capped run is labelled provisional —
  are correctness requirements, not polish. Do not "simplify" them away.
- **All backend access goes through the DataProducer SDK.** No hand-built `/api/hub/...` URLs, ever.
- **Local dev needs `ZB_TOKEN_UAT` exported and binds `0.0.0.0`** (the developer works over SSH).
  Both are deliberate — see [AGENTS.md](./AGENTS.md#local-development). The auth scheme is
  `APIKey`, not `Bearer`; `Bearer` 401s against UAT.
