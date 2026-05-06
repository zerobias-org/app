---
phase: 20
plan: 02
subsystem: data-integrity
tags: [remediation, await-error-surface, snackbar, callsite-tag, fire-and-forget]

requires:
  - phase: 20-01
    provides: AUDIT.md call-site table + telemetry instrumentation
provides:
  - 42 fire-and-forget user-action call sites converted to await + try/catch + MatSnackBar + re-throw
  - Explicit callSiteTag string of the form <file>.ts:<line> at every Wave-2 call site
  - Service-level rejection-path specs across remediated services
  - Three v1.5 polish backlog entries (FF-POLISH-1/2/3) for sites needing UX upgrades beyond the SIMPLE pattern

affects:
  - Wave 3 verification (downstream — kill-network specs + round-trip gate verify the remediated sites)
  - Phase 27 onboarding flow (downstream — relies on engagements/projects/profile-items writes being non-silent)

key-files:
  modified:
    - src/app/core/services/bids.service.ts (1 site)
    - src/app/core/services/sme-mart-task.service.ts (2 sites)
    - src/app/core/services/notes.service.ts (3 sites)
    - src/app/core/services/note-folder.service.ts (3 sites)
    - src/app/core/services/vendor-profile.service.ts (3 sites)
    - src/app/core/services/vetting.service.ts (4 sites)
    - src/app/core/services/reviews.service.ts (3 sites)
    - src/app/core/services/engagements.service.ts (2 sites)
    - src/app/core/services/service-offerings.service.ts (2 sites)
    - src/app/core/services/rfp-invitation.service.ts (1 site)
    - src/app/core/services/org-document.service.ts (4 sites)
    - src/app/core/services/sme-mart-project.service.ts (1 site)
    - src/app/core/services/project-prd.service.ts (4 sites)
    - src/app/core/services/project-plan.service.ts (4 sites)
    - src/app/core/services/sme-mart-board.service.ts (2 sites)
    - src/app/core/services/note-hierarchy.service.ts (1 site)
    - src/app/core/services/sme-mart-workflow.service.ts (2 sites)
    - .planning/BACKLOG.md (FF-POLISH-1/2/3 added)
---

# Plan 20-02 — Wave 2 Summary

**Status:** Complete. See [PHASE-20-SUMMARY.md](PHASE-20-SUMMARY.md) "Wave 2 — Opportunistic Remediation" for full details.

## Pattern (the "SIMPLE" remediation)

```ts
// Before:
this.pipelineWrite.pushEntity('X', data).catch(err => console.error(err));

// After:
try {
  await this.pipelineWrite.pushEntity('X', data, [], 'caller.service:NN');
} catch (err) {
  this.snackBar.open(`Failed to save X: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
  throw err;
}
```

Three properties at once: (a) user-visible toast on every failure, (b) telemetry attribution via explicit `callSiteTag`, (c) caller observes the rejection so optimistic-UI rollback can run.

## Commits

`d64d11d`, `a1321a0`, `8c2236c`, `2a66bc2`, `13415a5`, `8f50a66`, `6f0e58b`, `9418936`, `c8210ed`, `769bfde`, `b2e014c`, `150df9a`, `eb228ce`, `672024e`, `7422387`, `89e7c13` (final BACKLOG cleanup + polish entries).

Wave 2 also picked up `1721b21` (drop unused imports / dead test fixtures introduced or orphaned by Wave 2 edits) and `ea09400` (test expectations updated to include the new `callSiteTag` parameter).

## Polish backlog entries (v1.5)

- `FF-POLISH-1` — bids.service.ts:368 (submit button disabled-state + retry CTA + form-data preservation)
- `FF-POLISH-2` — vetting.service.ts:184 (per-item batch error handling)
- `FF-POLISH-3` — submit-button-disable sweep across review / engagement / offerings / rfp / prd / plan / task forms

## Related

- DECISIONS.md "Phase 20 Telemetry callSiteTag Uses Post-Edit await Line Number" (2026-04-29) — locks the convention so Wave 2 commits do not need amends.
- Requirements FF-04, FF-05
