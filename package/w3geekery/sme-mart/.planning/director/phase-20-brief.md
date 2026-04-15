# Phase 20 — Fire-and-Forget `pushEntity` Audit, Instrumentation + Opportunistic Remediation

**Milestone:** v1.3
**Est:** ~8 hrs audit+instrument + opportunistic remediation (complex fixes deferred to v1.4)
**Repos:** `app/` (SME Mart only)
**Origin:** Errata 011 (director-flagged, v1.2 carry-forward)

## Goal

Eliminate silent failures caused by `PipelineWriteService.pushEntity` fire-and-forget `.catch()` handlers. Audit every call site (48 identified across 13+ services), add telemetry to measure real-world failure rates, and **remediate any site where the fix is simple**. Complex remediations (new dialogs, flow restructuring, UX design) are deferred to v1.4 with individual backlog entries.

## Architecture

### Audit (deliverable 1)

- Grep every `pushEntity` call site (current count: 48). For each, document:
  - Service + line
  - Entity class written
  - Triggering action (user-initiated vs background/telemetry)
  - Current error handling (just `.catch(err => console.error)` or anything extra)
  - Silent-failure risk: **CRITICAL** (user thinks data saved but didn't), **MEDIUM** (data saved partial/stale), **LOW** (telemetry, idempotent retry)
  - Remediation complexity: **SIMPLE** (change `.catch` to `await` + toast), **MEDIUM** (new error state in UI), **COMPLEX** (UX flow change, dialog, retry logic)
- Output: `.planning/phases/20-fire-and-forget-audit/AUDIT.md` — ranked table.

### Instrumentation (deliverable 2)

- Add lightweight telemetry to `PipelineWriteService.pushEntity`:
  - Count `.catch()` invocations per entity class + call site (caller-provided tag or stack-derived)
  - Log to console + optional remote sink (env-gated) for 1-week soak on UAT
  - No user-facing behavior change
- Confirm telemetry surface is visible in devtools + CloudWatch/analytics (whichever SME Mart uses)

### Opportunistic Remediation (deliverable 3 — time-boxed)

For every call site flagged CRITICAL **with SIMPLE complexity**, apply the fix in this phase:
- Replace `.catch(console.error)` with `await` + surfaced error state (toast, inline form error, retry prompt)
- Add spec coverage: test the error path asserts user-visible failure (addresses WATCH-LIST: "Unit test uses fake that never errors")

Call sites that are CRITICAL+MEDIUM or CRITICAL+COMPLEX are **NOT** remediated here. For each, add a stub entry to `.planning/BACKLOG.md` under a new "Fire-and-Forget Remediation" section with:
- Call site identifier
- Proposed fix approach
- Complexity rationale (why deferred)

## Requirements

- **FF-01:** AUDIT.md exists with 100% of `pushEntity` call sites cataloged, each rated for risk + complexity.
- **FF-02:** Telemetry ships — every `.catch()` fires a counted event in addition to the current console.error.
- **FF-03:** All CRITICAL+SIMPLE call sites have fire-and-forget removed and error state surfaced to users; each has at least one spec covering the error path.
- **FF-04:** CRITICAL+MEDIUM and CRITICAL+COMPLEX call sites have individual backlog entries with proposed remediations.
- **FF-05:** WATCH-LIST pattern updated: "Service method ends with `.catch(err => console.error(err))`" is a BLOCK for user-triggered actions going forward.

## Dependencies

None. Self-contained in `app/`.

## Verification

- Audit review: walk the ranked table with user; sanity-check risk classifications.
- Spec suite: every remediated call site has a new failing-write spec that passes with the fix.
- UAT soak (post-merge, not pre-close): telemetry reports non-zero `.catch()` fires on at least one call site, confirming the real-world failure hypothesis. If zero fires after 1 week, update the retrospective — we were wrong about scope, not zero though we don't care.

## Out of scope

- Rewriting the Pipeline write pattern across the app (remediation is call-site-by-call-site based on risk/complexity classification)
- `PipelineWriteService` internal redesign (stays fire-and-forget at the service level; callers decide `await` vs not)
- Telemetry dashboard/alerting (just log to sink; analysis is manual for this milestone)

## References

- Errata 011 (`.planning/director/errata/011-pipeline-fire-and-forget-masks-errors.md`)
- `src/app/core/services/pipeline-write.service.ts:174` (pushEntity definition)
- 48 call sites identified 2026-04-15 via `grep -rn "pushEntity" src/app/` (excluding specs)
- Phase 17 SUMMARY lines 104-106 — schema gotchas the CLI surfaced that the app was silently eating
