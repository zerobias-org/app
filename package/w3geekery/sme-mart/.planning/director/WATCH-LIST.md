# Director Watch List

Accumulated from RETROSPECTIVE.md v1.0 + v1.1 + WATCH-LIST-SEED.md.

## SDK & API (v1.1 — HIGH priority)

- [ ] Plan calls SDK method without citing actual signature — BLOCK until verified via MCP describe or source
- [ ] Plan assumes `.results` on API response (may be `.items` on paged responses)
- [ ] Plan passes `string` where SDK expects `UUID` type
- [ ] Plan stubs data layer with placeholders — BLOCK, not FLAG
- [ ] Agent doesn't check cross-org API behavior (may 403 or return wrong org's data)

## Type Safety (v1.1 — HIGH priority)

- [ ] TypeScript interface and form fields diverge — verify field-for-field alignment
- [ ] Agent uses `[key: string]: any` index signature on interfaces
- [ ] Agent uses `any` type assertions
- [ ] Agent uses `@Input()` decorator instead of `input()` signal function
- [ ] Agent uses `*ngIf`/`*ngFor` instead of `@if`/`@for` control flow

## Angular Patterns

- [ ] Agent creates NgModules instead of standalone components
- [ ] Agent uses constructor injection instead of `inject()` function
- [ ] Agent drops file type suffix (`foo.ts` instead of `foo.component.ts`)
- [ ] Agent adds Nx config (`nx.json`, `project.json`, `@nx/*` deps)
- [ ] Agent imports from barrel files that don't exist

## CSS / Styling

- [ ] Agent uses `!important` in CSS
- [ ] Agent builds custom component when ngx-library has an equivalent
- [ ] Agent doesn't check `@zerobias-org/ngx-library` public-api.ts for available exports

## Data Layer

- [ ] Agent writes to Neon directly for entities already migrated to Pipeline+GQL
- [ ] Agent does partial Pipeline push (must be full-replace — all fields or they get nulled)
- [ ] Agent uses wrong GQL field names (schema names vs display names)
- [ ] Agent hardcodes class IDs or pipeline IDs that differ between environments
- [ ] Agent mutates objects instead of creating new immutable copies
- [ ] Agent treats `data` field (JSON string) as a parsed object in templates

## Git / Workflow

- [ ] Agent doesn't pull latest before starting work
- [ ] Agent doesn't check git branch before working
- [ ] Agent commits without running `npm test` first
- [ ] Agent modifies GQL schema YAML without running dataloader validation
- [ ] Agent targets wrong branch for schema PRs (must be `--base dev`)

## Code Quality

- [ ] Agent creates files over 800 lines
- [ ] Agent adds deep nesting (>4 levels)
- [ ] Agent silently swallows errors
- [ ] Agent hardcodes values that should come from environment config

## Scope

- [ ] Plan crosses into project management territory (boards, tasks, activities, workflows)
- [ ] Plan doesn't account for 15 hrs/week budget constraint
- [ ] Agent defers bugs to later phases instead of fixing them
- [ ] Plan assumes platform features that Kevin's team hasn't built yet

## SME Mart Specific

- [ ] Agent uses "proposal" terminology instead of "bid"
- [ ] Agent creates engagement-level features on project entities (or vice versa)
- [ ] Agent doesn't handle Pipeline eventual consistency (5-10s delay needs optimistic updates)
- [ ] Agent uses `npx vitest run` instead of `npm test` (must go through `ng test`)
- [ ] Agent puts boundary CRUD in SME Mart (must be read-only — admin in ZB Governance)

## From v1.0 Retrospective

- [ ] REQUIREMENTS.md checkboxes stop being updated after Phase 2 (bookkeeping drift)
- [ ] VERIFICATION.md written before issues resolved, never updated (stale verification)
- [ ] Build errors accumulate without being fixed (erodes confidence in test suite)

## From v1.1 Retrospective

- [ ] Plan stubs data layer entirely — needs gap closure (budget 1 gap closure per phase)
- [ ] Model interface doesn't match form fields — causes silent data loss
- [ ] Executor goes silent during long tasks — user should nudge for progress
