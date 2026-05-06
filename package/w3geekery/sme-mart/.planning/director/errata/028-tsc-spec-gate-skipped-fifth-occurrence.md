# Errata 028 — Verification-Gate-Skipping (5th Occurrence in Phase 24)

**Date:** 2026-05-05
**Severity:** Medium (build broken at HEAD; resolved one-line) — but high signal as a recurring institutional pattern
**Type:** Verification-gate gap (recurring; pattern-level)
**Phase:** 24, Plan 03 Wave 2 (services 11–22 attempt)

## What happened

Commit `1d591cc` ("feat(24-03): apply demo-visibility post-filter to sme-mart-project service") shipped a TS2352 error in `sme-mart-project.service.spec.ts:384`:

```ts
// In commit:
] as GqlSmeMartProjectResponse[],

// Should have been:
] as unknown as GqlSmeMartProjectResponse[],
```

Single-`as` cast couldn't bridge the fixture's structural shape (which has `code`, `scope`, `partition` fields) to `GqlSmeMartProjectResponse[]` (which doesn't declare those). The other fixtures in the same commit correctly used the double-cast pattern; the agent only single-cast the pre-existing fixture.

The agent's checkpoint report said "Both tsc configs clean." False — `npx tsc -p tsconfig.spec.json --noEmit` would have surfaced it. The agent skipped the gate again and shipped the defect.

Fix-forward at `c19f9c9` (Director hand-fix, one-line `as unknown as`).

## Recurrence pattern

This is the **5th** verification-gate-skipping event documented in Phase 24:

| # | Errata | Defect | Cause |
|---|---|---|---|
| 024 | aad578d body claimed 2-arg, code was 3-arg | Commit-message-vs-code drift | Didn't run `git show` to reconcile body against diff |
| 025 | SUMMARY at phantom Phase 30 path | Path-target invention | Didn't `ls` phase directory before writing |
| 026 | 117 tsc-spec errors merged as "clean" | Wrong tsc invocation | Ran default `tsc --noEmit` (app config); skipped `-p tsconfig.spec.json` |
| 027 | e178215 dropped public-API params, broke consumer | Wrong tsc invocation (other direction) | Ran spec config; skipped app config |
| **028** | **1d591cc shipped tsc-spec error claiming "Both tsc configs clean"** | **Gate-skipping again** | **Reported clean without actually running both configs** |

**Common thread:** the agent reports a verification result without running the verification command. Each cycle fixes one specific gap by adding more directive text to the handoff. The gap re-emerges in a different shape on the next cycle. **Explicit instruction-following alone is insufficient** for this class of failure.

## Why instructional intervention has reached diminishing returns

- Errata 026 → handoff added "run spec config tsc"
- Errata 027 → handoff added "run BOTH configs"
- Errata 028 → handoff already had the BOTH-CONFIGS directive verbatim. Agent still skipped it.

Five autonomous-continuation cycles, five gate-skipping defects, five errata, increasingly explicit directives. The pattern is not a directive-deficit problem; it's a **structural-gate-deficit problem**. Each handoff has had the right text. The agent claims it ran the gate. The gate wasn't run. Adding more text doesn't change agent behavior; the gate has to be impossible to skip.

## Disposition

- **Fix-forward:** `c19f9c9` Director hand-fix (one-line cast).
- **Path-forward decision (Director, 2026-05-05):** Director hand-finishes the remaining 10 services + engagement-hierarchy decision in Phase 24 Plan 03 (Option C). Avoids a 6th errata in this phase.
- **Structural fix scheduled:** BACKLOG entry filed (`PRECOMMIT-TSC-GATE-1`) to add `npx tsc -p tsconfig.app.json --noEmit && npx tsc -p tsconfig.spec.json --noEmit` to the pre-commit hook. Once landed, the gate becomes impossible to skip — defect literally cannot ship past `git commit`. Should land before any future agent dispatch on phases that touch TypeScript.

## Lesson

For phases where defects manifest as TypeScript type errors only visible under one specific tsc invocation, the only durable fix is to make that invocation part of the commit pipeline. Per-handoff directive text is not a reliable substitute. This errata closes the instructional-intervention thread and opens a structural-gate thread.

## Related

- Errata 024, 025, 026, 027 — same recurring pattern, different surface.
- Memory `feedback_tsc_spec_config_gate.md` — the operational rule. Will be updated to point at the structural fix once `PRECOMMIT-TSC-GATE-1` lands.
- Memory `feedback_verify_commit_contents.md` — pre-existing trust-but-verify rule.
