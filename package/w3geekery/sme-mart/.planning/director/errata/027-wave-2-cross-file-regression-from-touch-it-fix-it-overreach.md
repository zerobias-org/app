# Errata 027 — Wave 2 Cross-File Regression from Touch-It-Fix-It Overreach

**Date:** 2026-05-05
**Severity:** High (build broken at HEAD; both tsc configs failing) — resolved
**Type:** API-surface modification dressed as Touch-It-Fix-It + verification gap
**Phase:** 24, Plan 03 Wave 2 (services 10–22 resume run)

## What happened

Commit `e178215` ("feat(24-03): apply demo-visibility post-filter to org-document service") landed two unrelated changes alongside the demo-visibility wrap:

```diff
- async unshareDocument(shareId: string): Promise<void> {
+ async unshareDocument(): Promise<void> {

- async listShares(documentId: string): Promise<OrgDocumentShare[]> {
+ async listShares(): Promise<OrgDocumentShare[]> {
```

Both methods have TODO bodies (Plan 046 deferred), so the params appeared unused. The agent's Touch-It-Fix-It instinct — fueled by ESLint flagging unused params — extended from "fix violations on lines you touch for the feature work" to "remove API parameters because the body doesn't use them yet."

Consumer at `src/app/shared/components/document-share-dialog/document-share-dialog.component.ts:293` still calls:

```ts
this.orgDocService.listShares(this.data.document.id),
```

Result: `TS2554: Expected 0 arguments, but got 1.` Under BOTH tsc configs (`tsconfig.app.json` AND `tsconfig.spec.json`) — build broken at HEAD until fix.

## Verification gap

The agent reported "Both commits passed: npx tsc -p tsconfig.spec.json --noEmit (clean)" — but did NOT run `tsc -p tsconfig.app.json --noEmit`. The consumer lives in `src/app/shared/components/`, which is included by app config but not necessarily exercised by spec config (depends on whether the consumer's spec file imports the dialog component, which evidently it didn't).

This is the same root pattern as errata 026 (only some configs checked, not all paths the change touches). Memory `feedback_tsc_spec_config_gate.md` previously framed the rule as "when fixing or adding specs, run BOTH gates" — narrow scope. The lesson from this errata: **any source change requires both gates**, because spec config compiles only specs + their imports while app config compiles app sources + their imports — they catch different things.

## Resolution

Director hand-fix at commit `f5c2ef7`:

1. Restored both params with `_` prefix per TS convention for intentionally-unused:

   ```ts
   async unshareDocument(_shareId: string): Promise<void>
   async listShares(_documentId: string): Promise<OrgDocumentShare[]>
   ```

2. Enabled `argsIgnorePattern: '^_'` (and the parallel `varsIgnorePattern`, `caughtErrorsIgnorePattern`, `destructuredArrayIgnorePattern`) on `@typescript-eslint/no-unused-vars` in `eslint.config.js`. Aligns project ESLint with standard TypeScript ergonomics so the convention works without per-file disables. Without this config change, the `_` prefix wouldn't have satisfied the lint gate.

Both tsc configs and ESLint exit clean post-fix.

## Disposition

- **Hand-fix:** committed `f5c2ef7`, NOT amended e178215. Per Clark's standing rule, fix-forward with a new commit; never amend a published commit.
- **Memory:** `feedback_tsc_spec_config_gate.md` updated to require BOTH `tsconfig.app.json` AND `tsconfig.spec.json` on every source change — broadening the scope from "spec edits" to "any source change."
- **Process:** Director handoffs for all subsequent Wave 2 services (10–22 continuation) explicitly forbid public-API signature modification. Touch-It-Fix-It is bounded to the lines being changed for the actual feature work; if a parameter looks unused, prefix with `_` (now lint-honored), don't remove it.

## Recurrence pattern

This is the **third occurrence in Phase 24** of an agent's Touch-It-Fix-It instinct overreaching:

- **`1c968e5`:** changed `(summary as any)` to `(summary as Record<string, number>)` (correct lint instinct, wrong replacement type — hand-fixed at `4a1177e`).
- **`e178215`:** removed public-method parameters to silence unused-param warnings (this errata; hand-fixed at `f5c2ef7`).
- **(non-Phase-24 historical reference):** the same pattern produced errata 023 ("fictional-class-ids-silent-failures") in earlier phases.

The discipline being violated: **Touch-It-Fix-It applies to violations on lines you're already changing for the feature work, not to the broader file.** Trying to clean up adjacent code is overreach.

## Related

- Errata 026 — same systemic verification-gate gap (only spec config run, not app config).
- Errata 024 — same systemic discipline gap (commit body claims drift from actual code).
- Memory `feedback_tsc_spec_config_gate.md` — UPDATED in this errata's resolution to broaden scope.
- Memory `feedback_verify_commit_contents.md` — pre-existing trust-but-verify rule that this errata extends.
