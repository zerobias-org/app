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

- [ ] Agent uses `!important` in CSS — use `--mdc-*` custom properties for Material overrides
- [ ] Agent inlines status chip color blocks instead of shared mixin (`_invitation-status-chips.scss` for invitation statuses)
- [ ] Agent creates new chip color classes when ngx-library `_chips.scss` already has them (`.zb-chip.task-status.*`, `.zb-chip.status.*`, `.zb-chip.severity.*`)
- [ ] Agent uses `::ng-deep` when CSS custom properties would work without it
- [ ] Agent duplicates identical SCSS blocks across components (extract to shared partial)
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

- [ ] Agent uses `@Input()` decorator instead of `input()` / `input.required()` signal function — caught in Phase 14 teaser
- [ ] Agent uses "proposal" terminology instead of "bid"
- [ ] Agent creates engagement-level features on project entities (or vice versa)
- [ ] Agent doesn't handle Pipeline eventual consistency (5-10s delay needs optimistic updates)
- [ ] Agent uses `npx vitest run` instead of `npm test` (must go through `ng test`)
- [ ] Agent puts boundary CRUD in SME Mart (must be read-only — admin in ZB Governance)

## Test Maintenance (v1.2 — learned from errata 005)

- [ ] Agent modernizes component to inject() but doesn't update its spec — TestBed breaks
- [ ] Agent uses `@/` path aliases in component imports — vitest can't resolve them, use relative paths
- [ ] Specs using TestBed with Material components need `import '@angular/compiler'` for JIT
- [ ] Test failures accumulate across phases without being fixed — run full suite after each phase

## Verification (v1.2 — Phase 16 checkpoint)

- [ ] Verifier reads local `origin/dev` without `git fetch upstream` first — reports merged schema PRs as unmerged (false positive BLOCK). Always fetch upstream before checking cross-repo merge status.

## Schema Workflow (v1.2 — Phase 16 INCIDENT 2026-04-13)

**CRITICAL — Phase 16 executor bypassed SCHEMA_CHANGE_PROCESS.md entirely. Reverted.**

- [ ] **Agent self-merges schema PR without waiting for CI** — bypasses the one check that runs the real dataloader on upstream infrastructure. NEVER merge schema PRs from the executor. Merge is a human gate.
- [ ] **Agent uses `npm run validate` or `npm run verify` as schema validation** — NOT sufficient per SCHEMA_CHANGE_PROCESS.md §3. Only runs YAML structure checks. Real validation requires `dataloader --content-dev --skip-pgboss --skip-dynamo -d ./` against the Supabase scratch DB (port 15432, `supabase-pg-content-dev` container).
- [ ] **Agent writes schema YAML with flat `- name: X, type: Y` syntax** — wrong format. Actual format is `- propertyName:\n  field: className.propertyName` with SEPARATE field definition YAMLs in `fields/className.propertyName.yml`.
- [ ] **Agent declares `linkTo` on only one side of a bidirectional link** — both sides required per SCHEMA_CHANGE_PROCESS.md §2. FormSubmission → SmeMartProject needs reverse `formSubmissions: linkTo: FormSubmission.id.project, multi: true` on SmeMartProject.
- [ ] **Plan YAML examples contradict SCHEMA_CHANGE_PROCESS.md** — review mode MUST cross-check any plan touching the schema repo against the process doc. Plan 16-00 had wrong YAML format AND specified `npm run verify` instead of dataloader. Director missed it in review.

**Director review lesson:** When a plan touches the schema repo, read SCHEMA_CHANGE_PROCESS.md alongside the plan. Don't trust the plan's YAML examples without cross-check. This failure was preventable in review mode.

## Phase Completion Gate (v1.2 — systemic failure discovered 2026-04-13)

**Phases 15 AND 16 both had this pattern:** Schema Wave 0 never truly completed (PR open, CI SKIPPED, wrong YAML format — no fields/*.yml), but phases were marked COMPLETE because app-side tests passed. Verifier used "awaits schema PR merge, but does not block functional verification" as a loophole.

- [ ] **Verifier marks phase complete when schema PR is unmerged** — BLOCK. A phase is NOT complete until the schema PR it depends on is MERGED on upstream with CI: SUCCESS. "App-side code is tested" is not sufficient for phases with schema Wave 0.
- [ ] **Verifier accepts CI: SKIPPED as non-blocking** — BLOCK. Only CI: SUCCESS counts. Schema repo CI runs the real dataloader; skipping = no validation at all.
- [ ] **Schema PR contains classes/*.yml but no fields/*.yml** — BLOCK. Every new scalar property MUST have a field definition file in fields/. Grep the PR file list before approving.
- [ ] **Director lets "schema merge pending" stay in Open Items across phases without blocking** — CRITICAL. If a phase's schema dependency isn't merged, the NEXT phase cannot claim that schema work is done either. Don't stack schema debt across phases.

**Director checkpoint rule (strengthened):** Before accepting any phase with schema work as complete, verify:
1. `gh pr view <N> --repo zerobias-org/schema --json state,statusCheckRollup` returns `state: MERGED`
2. CI rollup includes at least one check with `conclusion: SUCCESS` (not SKIPPED)
3. Schema file list includes BOTH classes/*.yml AND fields/*.yml for new properties
4. Executor did not self-merge

If any check fails, the phase is INCOMPLETE regardless of app-side test results.

## Post-Phase Drift (v1.2 — discovered 2026-04-14)

**Pattern:** gsd-executor reports phase complete → user does a walkthrough → UX issues surface → fixes get made but never committed → phase stays "closed" on paper while real fixes to its deliverables sit dirty. This is the same commit-claim drift pattern documented in `.claude/post-mortems/2026-04-14-schema-inherited-props-drift.md`.

- [ ] **No post-phase director checkpoint run** — after gsd-executor reports phase complete, the director skill must run checkpoint before any new work starts. Findings get filed as errata; uncommitted edits force a follow-up commit before advancing.
- [ ] **Phase-scoped edits accumulate past the closing commit** — if a UX bug fix is discovered during post-phase verification, it belongs in a `fix(<phase>)` follow-up commit, not sitting in the working tree waiting for "something else" to carry it.
- [ ] **"Phase is done" means "tree is clean for phase-scoped files"** — add this gate to checkpoint: `git status --short | grep <phase-scope>` must be empty before declaring closeout.

Reference: errata 007 (`007-phase16-post-close-edits-uncommitted.md`).

## From v1.0 Retrospective

- [ ] REQUIREMENTS.md checkboxes stop being updated after Phase 2 (bookkeeping drift)
- [ ] VERIFICATION.md written before issues resolved, never updated (stale verification)
- [ ] Build errors accumulate without being fixed (erodes confidence in test suite)

## From v1.1 Retrospective

- [ ] Plan stubs data layer entirely — needs gap closure (budget 1 gap closure per phase)
- [ ] Model interface doesn't match form fields — causes silent data loss
- [ ] Executor goes silent during long tasks — user should nudge for progress
