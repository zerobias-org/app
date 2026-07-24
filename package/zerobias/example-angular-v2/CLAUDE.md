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

## TODO — next time we work in this app

_Both items below were completed in **0.3.0** — see [CHANGELOG.md](./CHANGELOG.md).
Kept here (checked) for traceability; prune when convenient._

- [x] **Response type name + "TS" shape popover** (parity with `example-nextjs-v2` 0.4.0). Name each
      `app-call-reveal` response with the SDK class it returns (e.g. `Response · ProjectExtended`) and
      add a small "TS" badge whose hover/click popover shows the REAL class shape with a copy button,
      so a dev can paste the type into their code. The shape must be **extracted from the installed
      SDK `.d.ts` at build time** (anti-rot — never hand-authored): port
      `example-nextjs-v2/scripts/extract-response-shapes.mjs` + its generated `response-shapes` map,
      and the `TypeShapePopover` component. Response types: create/update Project/Board/Task ->
      `ProjectExtended` / `BoardExtended` / `TaskExtended`; addComment -> `TaskComment` (all from
      `@zerobias-com/platform-sdk`).
      **UX details worked out in the nextjs build (port these too):**
      - **Hover reveals, click PINS** — the pinned popover survives moving the cursor away so you can
        select/copy the shape; click the badge again to unpin.
      - **Close on a ~250ms delay** (cancelled if the cursor re-enters the badge OR popover) **plus a
        transparent bridge element across the gap** — without both, the popover vanishes before the
        cursor can travel from the badge into it (real bug hit in nextjs; Clark caught it).
      - **Reset `text-transform`/`letter-spacing` on the popover** — the `call-reveal` label ancestor
        uppercases its text, which bleeds into the shape unless reset (the shape must read in real case).
      - **Force the CodeBlock's copy button always-visible inside the popover** (it's the primary
        action there, not a hover-reveal like in the panels).

- [x] **`objectLiteral()` should render arrays and nested objects as real literals.** Today
      `shared/call-reveal/call-reveal.ts`'s `literalOf()` renders a top-level array field
      (`approvers` / `notified` on `NewTask`) via `toString()`, so a populated array shows as a
      comma-joined **string** (`approvers: "a,b"`) instead of `approvers: ["a", "b"]`, and an empty
      array shows as `""` instead of `[]`. `example-nextjs-v2` fixed this in 0.4.0 — port that
      `literalOf`: add an `Array.isArray` branch that maps each element through `literalOf` (`[]`
      when empty), and an `inlineObjectLiteral` helper so nested plain objects (e.g. a `NewTaskLink`
      `{ resourceId }`) render as `{ resourceId: "…" }` rather than JSON. SDK value types (UUID /
      enum / DateTime) keep the existing meaningful-`toString` path. See
      `example-nextjs-v2/src/components/CallReveal.tsx` for the reference implementation.
