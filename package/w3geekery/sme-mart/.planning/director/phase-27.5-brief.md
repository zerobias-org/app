# Phase 27.5 — Modernization Rule Enforcement (ESLint + pre-commit + CI gate)

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 4–6 hrs
**Repos:** `app/` (SME Mart frontend).
**Origin:** Phase 27 Wave 2 imported `CommonModule` despite the rule sitting in CONTEXT.md AND in the gsd-plan handoff (caught + patched in commit `6bc9c7d`). Prior occurrences across earlier phases. Director/Clark assessment 2026-04-30: **rules-as-text-in-handoff has structurally failed.** The project has zero machine enforcement — no ESLint config, no `npm run lint` script, no pre-commit hook, no CI lint gate. Without a physical commit-time gate, agents will keep violating regardless of how many handoffs paste the rules block.

## Goal

Machine-enforced modernization rules at commit time and in CI so that violations physically cannot land. The "non-negotiable patterns block" that currently lives in handoff prompts and CLAUDE.md becomes a set of ESLint rules that fail on commit + fail CI. After this phase closes, every subsequent phase lands modern-by-default — not by hope, not by handoff vigilance.

This is **not** a "modernization cleanup" phase. We are not chasing every existing violation in the repo. The goal is to install the gate so **no new violations land** from this commit forward. Pre-existing violations are accounted for via `eslint-disable-next-line` escape hatches with comment justifications, then tracked separately for cleanup at a sustainable cadence.

## Architecture

### Starting state

- No `eslint.config.*` / `.eslintrc*` in the project.
- No `npm run lint` script in `package.json`.
- No `lint` builder configured in `angular.json`.
- No husky / lint-staged / pre-commit hooks.
- No lint step in `.github/workflows/deploy.yml` or any CI workflow.
- Modernization rules exist as prose in:
  - `CLAUDE.md` ("Angular 21 Patterns" + "File Naming Convention")
  - `.planning/docs/MODERNIZATION_GUIDE.md`
  - Director handoff prompts (paste-verbatim block)
  - Memory `feedback_handoff_must_include_modernization_rules.md`

The rules are well-documented; they are just not enforced. Every commit that follows the rules does so by agent or human attention, both of which fail at non-zero rate.

### Deliverables

**1. ESLint configuration (`eslint.config.js` flat config)**

Install: `eslint`, `typescript-eslint`, `angular-eslint` (the modern monorepo), `@angular-eslint/eslint-plugin`, `@angular-eslint/eslint-plugin-template`, `@angular-eslint/template-parser`. Use the latest versions compatible with Angular 21.

Configured rule set targeting the non-negotiable patterns block:

| Rule | Enforces | Source |
|---|---|---|
| `@angular-eslint/prefer-standalone` | Standalone components only; bans NgModule-wrapped components | angular-eslint |
| `@angular-eslint/prefer-inject` | Field-level `inject()`; bans constructor parameter DI | angular-eslint |
| `@angular-eslint/prefer-signals` (or equivalent) | Signal-based `input()` / `output()`; bans `@Input()` / `@Output()` decorators | angular-eslint (verify exact rule name) |
| `@angular-eslint/template/prefer-control-flow` | `@if` / `@for` / `@switch`; bans `*ngIf` / `*ngFor` / `*ngSwitch` | angular-eslint template plugin |
| `no-restricted-imports` (custom config) | Bans `import { CommonModule }` from `@angular/common` in component sources | typescript-eslint base |
| `@angular-eslint/template/no-deprecated-element` (or `no-restricted-syntax` template variant) | Bans `<mat-spinner>` deprecated alias; require `<mat-progress-spinner>` | verify; may need custom selector rule |
| `no-restricted-syntax` (custom AST query) | Bans `@Input()` / `@Output()` decorators if `prefer-signals` doesn't already do it cleanly | typescript-eslint base |

**Plan-author task: verify each rule name against the installed angular-eslint version.** Rule names evolve; do NOT trust this brief's exact strings without checking the installed plugin's documentation. ZB MCP and angular-eslint's GitHub docs are the source of truth — not memory, not this brief.

Configuration scope:
- Component sources (`src/app/**/*.{ts,html}`).
- Test files exempted from `prefer-standalone` only (test harness modules sometimes legitimately need NgModule). All other rules apply equally to specs.
- `MarketplaceProfileItem` / generated SDK files (`node_modules`, `dist`, `.angular`) excluded entirely.

**2. `npm run lint` script + `angular.json` lint builder**

- `package.json`: `"lint": "eslint . --max-warnings=0"` (zero-warning policy: warnings fail CI).
- `angular.json`: `"lint"` builder pointing at the same eslint config so `ng lint` works for IDE integration.
- Verify both invocations produce identical output.

**3. Pre-commit hook (husky + lint-staged)**

- Install `husky` (v9+) and `lint-staged`.
- `.husky/pre-commit`: runs `npx lint-staged`.
- `.lintstagedrc.json` (or `package.json` `"lint-staged"` section): `{ "*.{ts,html}": "eslint --max-warnings=0" }` — staged files only, not the full repo, for fast pre-commit feedback.
- The hook runs on every `git commit`. Violations block the commit with the rule name + offending line in stderr.
- Document the bypass for emergencies (`git commit --no-verify`) in the SUMMARY but note it should NOT be used by agents and should be explicitly authorized by Clark when used by humans.

**4. CI gate (deploy workflow)**

- Add a `lint` step to `.github/workflows/deploy.yml` (and any other CI workflows that run on PRs / pushes).
- Step runs `npm run lint`. Failure fails the workflow. PRs with violations cannot merge.
- The lint step runs BEFORE the build step (fast-fail; lint is faster than tsc/build).

**5. Pre-existing violation accounting**

- Run `npm run lint` once with the new config and capture output to `.planning/phases/27.5-modernization-enforcement/INITIAL-AUDIT.md`.
- For every existing violation:
  - Apply `eslint-disable-next-line <rule-name>` with a one-line comment explaining context (e.g., `// pre-existing — pre-Phase-27.5 enforcement; track in MODERN-CLEANUP-1`).
  - Or fix in-place if trivial (e.g., a single `*ngIf` -> `@if` swap).
- Do NOT do a sweeping repo-wide migration in this phase. Scope is the gate, not the cleanup.
- File a single BACKLOG entry `MODERN-CLEANUP-1` capturing the count and category of disable-comments left behind, sized for a future dedicated cleanup phase or rolling-as-touched cleanup.

**6. Documentation updates**

- `CLAUDE.md` "Angular 21 Patterns" section: add a paragraph noting that modernization rules are now machine-enforced via ESLint + pre-commit hook + CI gate. Reference the eslint config path. Note that the rules-block in handoff prompts is now redundant with enforcement BUT should be retained in handoffs as belt-and-suspenders + so plan authors don't write code that the gate will reject.
- `.planning/docs/MODERNIZATION_GUIDE.md`: cross-link to the eslint config + add a "If lint fires on you" troubleshooting section with the most common violations and their fixes.

## Requirements

- **ENF-01:** `eslint.config.js` exists at the app root and configures the rule set covering all 7 patterns above.
- **ENF-02:** `npm run lint` exits 0 on a clean tree and exits non-zero on any violation. `--max-warnings=0` configured.
- **ENF-03:** `ng lint` invocation works identically via the `angular.json` lint builder.
- **ENF-04:** Pre-commit hook blocks commits that introduce violations on staged files. Verified by intentionally staging a `CommonModule` import and observing the commit reject.
- **ENF-05:** CI workflow runs `npm run lint` and fails on violation. Verified by pushing a branch with an intentional violation and observing the CI failure.
- **ENF-06:** Pre-existing violations are either fixed or annotated with `eslint-disable-next-line <rule>` + comment. Repo lints clean (`npm run lint` exits 0) at phase close.
- **ENF-07:** `INITIAL-AUDIT.md` captures the count + category of pre-existing violations annotated. `MODERN-CLEANUP-1` BACKLOG entry exists.
- **ENF-08:** `CLAUDE.md` + `MODERNIZATION_GUIDE.md` reflect the new enforcement layer.

## Dependencies

- **Phase 27 closes first.** Verifier runs against the routing wire-up state without lint enforcement; do not introduce a new gate mid-verification.
- **Phase 28 + 26 + 25 + 20 already closed** — their existing code becomes the initial baseline that the audit captures.
- No external blockers (Brian, Kevin, Andrey).
- Phase 30 + 31 plans MUST NOT start until 27.5 closes — that is the entire point of inserting this phase here.

## Verification

- `npm run lint` on `HEAD` exits 0.
- `git checkout -b lint-test-violation && echo "import { CommonModule } from '@angular/common';" >> src/app/app.config.ts && git add src/app/app.config.ts && git commit -m test` → pre-commit hook rejects.
- Push a branch to remote with an intentional violation → CI run fails on the lint step.
- Try to commit a `*ngIf` in a fresh component template → rejected.
- Try to commit a constructor-DI param → rejected.
- Try to commit `<mat-spinner>` template usage → rejected.
- Try to commit a `@Input()` decorator → rejected.
- Annotated `eslint-disable-next-line` lines lint clean (the gate respects the escape hatch).
- Existing tests still pass (`npm test`) — the lint changes should not affect runtime behavior.

## Out of scope

- **Repo-wide modernization sweep.** Pre-existing violations get annotated with disable comments, not fixed. `MODERN-CLEANUP-1` BACKLOG entry tracks the cleanup for a later phase.
- **Prettier / formatting rules.** Different concern (style, not modernization). Defer entirely.
- **Stylelint for SCSS.** Different concern. Defer.
- **Test coverage thresholds.** Different concern (Phase 052 P4 / dedicated test-infra milestone, per DECISIONS.md).
- **Custom rules for project-specific patterns** (e.g., "always use `pushEntities` not direct `Pipeline.receive`"). The rule set in this phase is strictly the modernization patterns; project-specific lint can layer on later if needed.
- **Migrating the `provideAnimationsAsync` deprecation** — the framework deprecation flagged in Phase 27 Wave 3. Forward-compat work, separate from modernization rules. Track in dependency-update tracking, not here.

## References

- Phase 27 Wave 2 patch commit `6bc9c7d` (CommonModule violation) — the immediate precipitating incident.
- Memory `feedback_handoff_must_include_modernization_rules.md` — Wave 2 patch was issued because rules-in-CONTEXT.md and rules-in-handoff both failed.
- `.planning/docs/MODERNIZATION_GUIDE.md` — the prose source of truth that becomes machine-enforced after this phase.
- CLAUDE.md "Angular 21 Patterns" + "File Naming Convention" sections.
- angular-eslint docs: https://github.com/angular-eslint/angular-eslint (verify exact rule names against the installed version).
- husky v9 docs: https://typicode.github.io/husky/
- lint-staged docs: https://github.com/lint-staged/lint-staged

## Plan-author non-negotiables (paste verbatim into gsd-plan handoff)

- **Source of truth for rule names:** angular-eslint's installed-plugin docs + ZB MCP (where applicable). NOT this brief's exact strings, NOT prior memory entries. Verify before encoding.
- **Do NOT do a repo-wide migration sweep.** Annotate with `eslint-disable-next-line` for pre-existing violations. The cleanup is a separate phase.
- **Pre-commit hook MUST run on staged files only**, not the whole repo. Hook latency above ~3s breaks Clark's commit cadence.
- **`--max-warnings=0` everywhere.** Warnings ARE failures. The whole point is to make the gate physical, not negotiable.
- **CI lint step runs BEFORE build step.** Fast-fail; don't burn CI minutes on a build that lint would have rejected.
- **The bypass `git commit --no-verify` is a human-authorized emergency only.** Document it but make clear agents must NOT use it.
