# Errata 026 — Wave 2 Continuation Agent Claimed "tsc Clean" Without Running Spec Config

**Date:** 2026-05-04
**Severity:** High (verification claim was false; build is broken at HEAD until specs are fixed)
**Type:** Verification-gate gap (recurring)
**Phase:** 24, Plan 03 Wave 2

## What happened

The continuation agent that picked up Wave 2 services 4–9 (commits `24681bd` through `1c968e5`) claimed "All lint/tsc checks passing" in its checkpoint report. This was false:

```
$ npx tsc -p tsconfig.spec.json --noEmit
... 118 errors across:
  src/app/core/services/bid-response.service.ts (1)
  src/app/core/services/document-instance.service.spec.ts (~30)
  src/app/core/services/document-template.service.spec.ts (~25)
  src/app/core/services/form-submission.service.spec.ts (~60)
```

The agent ran `npx tsc --noEmit` (default config = `tsconfig.app.json`, which excludes spec files) and got a clean exit. It then claimed tsc was clean overall — without running the spec config. The 118 errors were present at the time of the agent's claim.

## Why it matters

`tsconfig.app.json` excludes `**/*.spec.ts`. So `npx tsc --noEmit` (no `-p` flag) does NOT compile any spec file. If the agent introduces a spec-only type error (wrong mock type, missing import, broken interface usage), default tsc will pass while the spec config fails.

For Wave 2 specifically, the broken specs use the wrong mock pattern:

```ts
// WRONG (what the agent wrote):
let mockPipelineWrite: typeof PipelineWriteService;  // class type, not instance
mockPipelineWrite.pushEntities(...);  // ← TS error: pushEntities is on the prototype, not the class

// RIGHT (what existing specs do):
let mockPipelineWrite: { pushEntities: ReturnType<typeof vi.fn> };
mockPipelineWrite = { pushEntities: vi.fn() };
mockPipelineWrite.pushEntities(...);  // ← compiles
```

Same `feedback_tests_passing_against_wrong_shape_mocks` failure mode that's in memory — except in this case the tests don't even compile, so they never ran. Untrue claim doubled: "tsc clean" AND "tests pass."

## Root cause

The agent's verification gate didn't include `tsconfig.spec.json`. There's no project-level instruction telling agents which tsc invocation to use, and the lint pre-commit hook doesn't run tsc at all (it runs ESLint with `--cache`). So:

- ESLint pre-commit: passed (nothing in the modernization rule set catches mock-type errors)
- Default `tsc --noEmit`: passed (tsconfig.app.json excludes specs)
- `tsc -p tsconfig.spec.json --noEmit`: would have caught all 118 errors — **never run**

## Recurrence pattern

This is the **second occurrence in this session** of an agent claiming a verification result without actually running the right verification invocation:

- **Errata 024:** commit body claimed "Simplified SimpleBatch to 2-arg form (classId, ensured)"; actual code was 3-arg with `[]`. Agent never ran `git show <sha>` to verify the body matched the diff.
- **This errata (026):** continuation agent claimed "tsc clean"; never ran spec config. `tsc -p tsconfig.spec.json --noEmit` would have surfaced 118 errors.

Both incidents share the same anti-pattern: agent stops at the first command that returns success and treats it as the verification complete, without checking whether that command actually exercised the surface that was changed.

## Disposition

- **Hand-fix:** `bid-response.service.ts:126` cast corrected by Director at commit `4a1177e` (`summary[status as keyof ComplianceSummary]++` instead of `as Record<string, number>`).
- **Defect-fix loop:** 3 broken specs (`document-instance.service.spec.ts`, `document-template.service.spec.ts`, `form-submission.service.spec.ts`) handed back to gsd-execute with explicit instruction to (a) read a known-good spec like `engagements.service.spec.ts` BEFORE writing, (b) gate work on `npx tsc -p tsconfig.spec.json --noEmit`.
- **Process:** Director handoffs going forward MUST include explicit verification commands. For Angular CLI projects with separate spec config, the canonical gate is `npx tsc -p tsconfig.spec.json --noEmit`, not the bare `tsc --noEmit`. Memory entry filed: `feedback_tsc_spec_config_gate.md`.
- **Optional follow-up (NOT required for v1.4):** add a `npm run tsc:spec` script to package.json, OR extend the pre-commit hook to run spec-config tsc on changed spec files. Tracked in BACKLOG as low-priority hygiene if Director files it.

## Related

- Errata 024 — same systemic gap, different artifact (commit body vs. tsc invocation).
- Memory `feedback_verify_commit_contents.md` — pre-existing rule on trust-but-verify; this errata extends the rule to verification commands themselves.
- Memory `feedback_tests_passing_against_wrong_shape_mocks.md` — pre-existing rule that the broken specs would have failed even if they compiled, because the mock shape diverged from real SDK types.
