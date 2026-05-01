# Phase 27.5 — Pre-Existing Modernization Violation Audit

**Snapshot date:** 2026-05-01
**Source command:** `npx eslint . --format json` (matches `npm run lint` script: `eslint . --max-warnings=0`)
**Snapshot artifact:** `/tmp/lint-snapshot.json` (ephemeral; regenerable — see Methodology)
**Status:** Inventory only. **No source files were modified by this plan.**

## Why this is an inventory, not committed annotations

Plan 03 (Phase 27.5 Wave 3) scopes CI lint to the **diff** between PR HEAD and base.
Pre-existing violations in untouched files cannot fail CI. Therefore
disable-comment annotation across ~1561 sites is unnecessary; an inventory + a
"touch it = fix it" rule (documented in CLAUDE.md / MODERNIZATION_GUIDE.md per
Plan 05) is sufficient and avoids ~15-20 hrs of mechanical churn.

## Headline numbers

| Metric | Value |
|---|---|
| Total ESLint messages | 1561 |
| - of which: rule violations | 796 |
| - of which: fatal parse errors (config noise — see below) | 765 |
| Distinct violation sites (file:line) | 1505 |
| Files with at least one message | 933 |
| Files inspected by ESLint | 1436 |
| Distinct rules with at least one violation | 15 |

**Fatal parse errors are config noise, not code violations.** They originate from `parserOptions.project: './tsconfig.app.json'` in `eslint.config.js`. Files outside the `tsconfig.app.json` program emit `"Parsing error: parserOptions.project has been provided for @typescript-eslint/parser."` with no rule attached. Distribution:

| Path prefix | Fatal-error files |
|---|---|
| `.angular-docs/examples/` | 345 |
| `.angular-docs/tutorials/` | 264 |
| `src/app/**/*.spec.ts` | 125 |
| `e2e/` | 22 |
| `scripts/`, `.claude/` | 9 |

The .angular-docs prefix is third-party docs imported by `npx angular-agents-md` and should be added to ESLint's `ignores` list in a future cleanup. Spec files are excluded from `tsconfig.app.json` by Angular CLI convention; eliminating these warnings would require either a separate `tsconfig.spec.json` reference in the parser config or a per-files override in `eslint.config.js`. Both are out of scope for Phase 27.5; tracked implicitly under MODERN-CLEANUP-1 closure work.

## Per-rule breakdown (rule violations only)

| Rule | Count |
|---|---|
| `@typescript-eslint/no-explicit-any` | 293 |
| `@angular-eslint/prefer-signals` | 176 |
| `@typescript-eslint/no-unused-vars` | 90 |
| `no-restricted-syntax` (banned `@Output()` decorator) | 80 |
| `no-undef` | 59 |
| `@angular-eslint/template/prefer-control-flow` | 34 |
| `@typescript-eslint/no-restricted-imports` (CommonModule ban) | 18 |
| `@typescript-eslint/no-non-null-asserted-optional-chain` | 13 |
| `@typescript-eslint/no-unsafe-function-type` | 10 |
| `@angular-eslint/prefer-inject` | 8 |
| `@typescript-eslint/no-require-imports` | 8 |
| `no-empty` | 3 |
| `prefer-const` | 2 |
| `no-fallthrough` | 1 |
| `no-useless-assignment` | 1 |
| **(rule violations subtotal)** | **796** |
| `(fatal parse errors — see above)` | 765 |
| **Total messages** | **1561** |

## Top-10 violating files per rule

### `@typescript-eslint/no-explicit-any` (293 violations)

| File | Count |
|---|---|
| `src/app/pages/org/tabs/documents-tab.component.ts` | 14 |
| `src/app/pages/admin/admin-dashboard.component.ts` | 13 |
| `src/app/core/services/catalog.service.ts` | 12 |
| `src/app/core/services/onboarding-bootstrap.service.ts` | 12 |
| `src/app/pages/my-profile/my-profile-expertise.component.ts` | 12 |
| `src/app/pages/project/project-detail-form.component.ts` | 12 |
| `src/app/shared/components/resource-tags-panel/resource-tags-panel.component.ts` | 10 |
| `src/app/pages/rfps/rfp-detail.component.ts` | 9 |
| `src/app/test-helpers/angular.ts` | 9 |
| `src/app/core/services/bid-ai.service.ts` | 8 |

### `@angular-eslint/prefer-signals` (176 violations)

| File | Count |
|---|---|
| `src/app/shared/components/timeline-filters/timeline-filters.component.ts` | 14 |
| `src/app/shared/components/resource-tags-panel/resource-tags-panel.component.ts` | 8 |
| `src/app/shared/components/catalog-filter-section/catalog-filter-section.component.ts` | 7 |
| `src/app/shared/components/task-card/task-card.component.ts` | 7 |
| `src/app/shared/components/timeline-filter-section/timeline-filter-section.component.ts` | 7 |
| `src/app/onboarding/company-profile-form.component.ts` | 6 |
| `src/app/pages/org/tabs/documents-tab.component.ts` | 6 |
| `src/app/pages/org/tabs/engagements-tab.component.ts` | 5 |
| `src/app/shared/components/form-builder/dynamic-form-renderer.component.ts` | 5 |
| `src/app/shared/components/note-editor-panel/note-editor-panel.component.ts` | 5 |

### `@typescript-eslint/no-unused-vars` (90 violations)

| File | Count |
|---|---|
| `src/app/core/services/provider-profiles.service.ts` | 20 |
| `src/app/core/services/demo-data.service.ts` | 7 |
| `src/app/pages/rfps/rfp-wizard/steps/rfp-step-form.component.ts` | 5 |
| `src/app/core/services/note-hierarchy.service.ts` | 3 |
| `src/app/pages/templates/template-editor.component.ts` | 3 |
| `src/app/shared/components/notes-notebooks-column/notes-notebooks-column.component.ts` | 3 |
| `proxy-common.js` | 2 |
| `src/app/core/guards/onboarding.guard.ts` | 2 |
| `src/app/core/services/document-instance.service.ts` | 2 |
| `src/app/core/services/engagement-hierarchy.service.ts` | 2 |

### `no-restricted-syntax` — banned `@Output()` decorator (80 violations)

| File | Count |
|---|---|
| `src/app/shared/components/notes-notebooks-column/notes-notebooks-column.component.ts` | 7 |
| `src/app/shared/components/note-editor-panel/note-editor-panel.component.ts` | 4 |
| `src/app/shared/components/note-folder-tree/note-folder-tree.component.ts` | 4 |
| `src/app/shared/components/task-card/task-card.component.ts` | 4 |
| `src/app/pages/rfps/rfp-wizard/steps/task-type-list.component.ts` | 3 |
| `src/app/shared/components/bid-card/bid-card.component.ts` | 3 |
| `src/app/shared/components/bid-comparison/bid-comparison.component.ts` | 3 |
| `src/app/shared/components/bid-review/bid-review.component.ts` | 3 |
| `src/app/shared/components/note-card/note-card.component.ts` | 3 |
| `src/app/shared/components/service-card/service-card.component.ts` | 3 |

### `no-undef` (59 violations)

Concentrated in JS scripts/proxy configs (no TS types). All outside `src/app/`.

| File | Count |
|---|---|
| `scripts/angular-agents-md.mjs` | 16 |
| `scripts/test-report.js` | 14 |
| `proxy-common.js` | 11 |
| `.claude/scripts/stitch-gen.mjs` | 7 |
| `scripts/gen-neon-env.mjs` | 3 |
| `proxy-dev.conf.js` | 2 |
| `proxy-prod.conf.js` | 2 |
| `proxy-qa.conf.js` | 2 |
| `proxy-uat.conf.js` | 2 |

### `@angular-eslint/template/prefer-control-flow` (34 violations)

All from third-party docs examples; not application code.

| File | Count |
|---|---|
| `.angular-docs/examples/built-in-directives/src/app/app.component.html` | 18 |
| `.angular-docs/examples/structural-directives/src/app/app.component.html` | 16 |

### `@typescript-eslint/no-restricted-imports` — CommonModule ban (18 violations)

| File | Count |
|---|---|
| `src/app/pages/engagements/tabs/vetting-suggestion-panel.component.ts` | 1 |
| `src/app/pages/org/tabs/org-document-templates-tab.component.ts` | 1 |
| `src/app/pages/org/tabs/vendor-profile-form.component.ts` | 1 |
| `src/app/pages/org/tabs/vendor-profile-tab.component.ts` | 1 |
| `src/app/pages/orgs/org-detail.component.ts` | 1 |
| `src/app/pages/orgs/org-list.component.ts` | 1 |
| `src/app/pages/project/project-completion-dialog.component.ts` | 1 |
| `src/app/pages/project/tabs/project-parties-tab.component.ts` | 1 |
| `src/app/pages/templates/template-editor.component.ts` | 1 |
| `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` | 1 |

(Plus 8 more files at 1 violation each — total 18 across 18 distinct files.)

### `@typescript-eslint/no-non-null-asserted-optional-chain` (13 violations)

| File | Count |
|---|---|
| `src/app/shared/components/sme-resource-tag-editor/sme-resource-tag-editor.component.ts` | 10 |
| `src/app/shared/components/resource-tag-autocomplete/resource-tag-autocomplete.component.ts` | 2 |
| `src/app/shared/components/resource-tags-panel/resource-tags-panel.component.ts` | 1 |

### `@typescript-eslint/no-unsafe-function-type` (10 violations)

| File | Count |
|---|---|
| `src/app/core/services/demo-mode.service.ts` | 10 |

### `@angular-eslint/prefer-inject` (8 violations)

| File | Count |
|---|---|
| `src/app/shared/components/accept-bid-dialog/accept-bid-dialog.component.ts` | 2 |
| `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` | 2 |
| `src/app/shared/components/engagement-card/engagement-card.component.ts` | 1 |
| `src/app/shared/components/provider-card/provider-card.component.ts` | 1 |
| `src/app/shared/dialogs/switching-org-dialog/switching-org-dialog.component.ts` | 1 |
| `src/app/shared/pipes/safe-resource-url.pipe.ts` | 1 |

### `@typescript-eslint/no-require-imports` (8 violations)

| File | Count |
|---|---|
| `scripts/test-report.js` | 4 |
| `proxy-dev.conf.js` | 1 |
| `proxy-prod.conf.js` | 1 |
| `proxy-qa.conf.js` | 1 |
| `proxy-uat.conf.js` | 1 |

### `no-empty` (3 violations)

| File | Count |
|---|---|
| `src/app/shared/components/notes-panel/notes-panel.component.ts` | 2 |
| `scripts/test-report.js` | 1 |

### `prefer-const` (2 violations)

| File | Count |
|---|---|
| `src/app/core/guards/onboarding.guard.ts` | 1 |
| `src/app/pages/org/tabs/documents-tab.component.ts` | 1 |

### `no-fallthrough` (1 violation)

| File | Count |
|---|---|
| `scripts/angular-agents-md.mjs` | 1 |

### `no-useless-assignment` (1 violation)

| File | Count |
|---|---|
| `src/app/core/services/marketplace-profile.service.ts` | 1 |

## Cleanup model

Cleanup is governed by **MODERN-CLEANUP-1** in `.planning/BACKLOG.md`:

- **Touch it = fix it.** When a developer modifies a file under `src/app/`, all
  violations in that file are fixed as part of the same change. The pre-commit
  hook + CI lint gate enforce this automatically because they lint the diff;
  modified files are necessarily in the diff.
- **Untouched files migrate organically.** No dedicated sweep required.
- **Full closure** of MODERN-CLEANUP-1 = the day a re-run of this audit
  reports zero rule violations (the 765 fatal parse errors are tracked
  separately as a config-cleanup task).

The "touch it = fix it" rule is documented in:
- `CLAUDE.md` — Angular 21 Patterns section (Plan 05).
- `.planning/docs/MODERNIZATION_GUIDE.md` — top of file (Plan 05).

## Methodology

1. ESLint invoked from the SME Mart workspace root (`package/w3geekery/sme-mart`)
   via `npx eslint . --format json`. This matches the `npm run lint` script
   defined by Plan 01 (`eslint . --max-warnings=0`) but adds `--format json`
   for machine-readable output. The two commands inspect the same file set.
2. Cache cleared first: `rm -f .eslintcache` to ensure a complete fresh scan.
3. Output redirected to `/tmp/lint-snapshot.json` (3.6 MB; ephemeral).
4. Per-rule rollup:
   ```
   jq -r '
     [.[] | .messages[]?]
     | group_by(.ruleId)
     | map({rule: .[0].ruleId, count: length})
     | sort_by(-.count)
     | .[]
     | "\(.rule // "unknown")\t\(.count)"
   ' /tmp/lint-snapshot.json
   ```
5. Top-10 files per rule:
   ```
   jq -r --arg rule "$RULE" '
     [.[] | {file: .filePath, count: ([.messages[] | select(.ruleId == $rule)] | length)} | select(.count > 0)]
     | sort_by(-.count)
     | .[0:10]
     | .[]
     | "\(.count)\t\(.file | sub("^.*sme-mart/"; ""))"
   ' /tmp/lint-snapshot.json
   ```
6. Distinct sites: `jq '[.[] | .filePath as $f | .messages[]? | "\($f):\(.line)"] | unique | length'`.
7. Files with violations: `jq '[.[] | select((.messages | length) > 0) | .filePath] | unique | length'`.

The snapshot is regenerable at any time by re-running steps 1-3; this audit is
a point-in-time view as of the snapshot date.

## Optional escape hatch (NOT enabled — defer until friction observed)

`eslint-plugin-only-warn-on-changed-lines` (or equivalent) can downgrade
violations on unchanged lines from error to warning. **Not added now** — Plan
03's diff-based lint already provides equivalent behavior at the workflow level
without adding a plugin to the lint pipeline. Revisit only if developers report
the diff-based gate produces false-positives on unchanged lines.
