# SME Mart — Watch List Seed

**Purpose:** Project-specific anti-patterns to seed the director's WATCH-LIST.md on first creation. These are known failure modes from prior milestones and Clark's behavioral rules.

---

## Angular Patterns

- [ ] Agent creates NgModules instead of standalone components
- [ ] Agent uses constructor injection instead of `inject()` function
- [ ] Agent uses old control flow (`*ngIf`, `*ngFor`) instead of `@if`, `@for`, `@switch`
- [ ] Agent drops file type suffix (`foo.ts` instead of `foo.component.ts`)
- [ ] Agent adds Nx config (`nx.json`, `project.json`, `@nx/*` deps)
- [ ] Agent imports from barrel files that don't exist

## CSS / Styling

- [ ] Agent uses `!important` in CSS (last resort only — fix specificity instead)
- [ ] Agent builds custom component when ngx-library has an equivalent
- [ ] Agent doesn't check `@zerobias-org/ngx-library` public-api.ts for available exports

## Data Layer

- [ ] Agent writes to Neon directly for entities already migrated to Pipeline+GQL
- [ ] Agent does partial Pipeline push (must be full-replace — all fields or they get nulled)
- [ ] Agent uses wrong GQL field names (schema names vs display names)
- [ ] Agent hardcodes class IDs or pipeline IDs that differ between environments
- [ ] Agent queries GQL without checking if schema has been reloaded (15-min delay after merge)
- [ ] Agent mutates objects instead of creating new immutable copies

## Git / Workflow

- [ ] Agent doesn't pull latest before starting work
- [ ] Agent doesn't check git branch before working
- [ ] Agent commits without running `npm test` first
- [ ] Agent commits `.env.local` or files containing real credentials
- [ ] Agent modifies GQL schema YAML without running dataloader validation
- [ ] Agent targets wrong branch for schema PRs (must be `--base dev`)

## Code Quality

- [ ] Agent uses `any` type assertions
- [ ] Agent creates files over 800 lines
- [ ] Agent adds deep nesting (>4 levels)
- [ ] Agent silently swallows errors
- [ ] Agent hardcodes values that should come from environment config
- [ ] Agent adds unnecessary abstraction layers over direct API usage

## Scope

- [ ] Plan crosses into project management territory (boards, tasks, activities, workflows)
- [ ] Plan doesn't account for 15 hrs/week budget constraint
- [ ] Agent defers bugs to later phases instead of fixing them
- [ ] Plan assumes platform features that Kevin's team hasn't built yet

## SME Mart Specific

- [ ] Agent uses "proposal" terminology instead of "bid"
- [ ] Agent creates engagement-level features on project entities (or vice versa)
- [ ] Agent doesn't handle Pipeline eventual consistency (5-10s delay needs optimistic updates)
- [ ] Agent doesn't seed PipelineWriteCache from GQL on first load
- [ ] Agent uses `npx vitest run` instead of `npm test` (must go through `ng test`)

## From v1.0 Retrospective

- [ ] REQUIREMENTS.md checkboxes stop being updated after Phase 2 (bookkeeping drift)
- [ ] VERIFICATION.md written before issues resolved, never updated (stale verification)
- [ ] Build errors accumulate without being fixed (erodes confidence in test suite)
