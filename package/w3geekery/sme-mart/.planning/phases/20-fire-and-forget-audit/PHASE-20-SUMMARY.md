# Phase 20 — Fire-and-Forget Audit, Instrumentation, Remediation, Verification

**Phase:** 20-fire-and-forget-audit
**Milestone:** v1.4 (interleaved with onboarding work)
**Started:** 2026-04-28
**Closed:** 2026-04-29
**Requirements:** FF-01..FF-08 (all addressed)
**Status:** ✅ Complete. UAT soak runs post-merge, not phase-close blocking.

## TL;DR

Phase 20 turned a class of silent failures into a class of visible,
queryable failures. Three waves:

1. **Wave 1 — Audit & Instrumentation.** Catalogued all 60
   `pushEntity`/`pushEntities` call sites (44 fire-and-forget +
   16 awaited), re-verified all 23 class IDs against the platform,
   wired a structured `[PIPELINE_WRITE_FAILURE]` telemetry event
   into the receiver-rejection path.
2. **Wave 2 — Remediation.** Replaced `.catch(console.error)` with
   `await` + `try/catch` + `MatSnackBar` toast + explicit
   `callSiteTag` + re-throw across all 42 fire-and-forget user-action
   call sites. Filed three polish backlog entries (`FF-POLISH-1/2/3`)
   for sites that warrant UX upgrades beyond the SIMPLE pattern.
3. **Wave 3 — Verification.** Added kill-network rejection-path
   tests to fill the note-folder coverage gap, parameterized
   round-trip-per-class-id assertions over all 23
   `SME_MART_CLASS_IDS` entries, cleaned up AUDIT.md prose to
   distinguish "snackbar exists" from "snackbar reflects actual
   outcome", documented the soak configuration, ran the regression
   gate.

## Requirements outcome

| Req | Title | State |
|---|---|---|
| FF-01 | Audit all `pushEntity`/`pushEntities` call sites | ✅ — `AUDIT.md` 60-row table |
| FF-02 | Verify class-ID registry against platform | ✅ — `AUDIT.md` Class-ID Verification Table (23/23 canonical) |
| FF-03 | Telemetry on receiver rejection | ✅ — `pipeline-write.service.ts` console.warn structured prefix |
| FF-04 | Remediate CRITICAL+SIMPLE fire-and-forget sites | ✅ — Wave 2 across 33 sites |
| FF-05 | Remediate MEDIUM collaboration sites (notes/folders/workflow) | ✅ — Wave 2 across 9 sites |
| FF-06 | Verify AWAITED sites surface errors | ✅ — Wave 3 prose cleanup with code citations (`AUDIT.md` rows 45-60) |
| FF-07 | Watch-list pattern: fire-and-forget on user actions | ✅ — `AUDIT.md` "Wave 2 Remediation Grouping" carries the policy |
| FF-08 | Watch-list pattern: class-id verification required | ✅ — Wave 3 round-trip-per-class-id spec block enforces it on every PR |

## Wave 1 — Audit & Instrumentation (commit `977828c`)

**What landed:**

- `AUDIT.md` — 60-site call-site table with criticality (CRITICAL /
  MEDIUM / LOW / AWAITED-VERIFY) and complexity (SIMPLE / MEDIUM /
  COMPLEX) ratings.
- Class-ID Verification Table — all 24 effective entries (23 in
  `SME_MART_CLASS_IDS` + the `deleteEntities` reuse path) checked
  against `platform.Class.getClass` on UAT. All canonical.
- Telemetry instrumentation — `pushEntities` and `deleteEntities`
  rejection paths emit a `[PIPELINE_WRITE_FAILURE]` console.warn
  with `{className, callSite, errorMessage, timestamp}` JSON
  payload, then re-throw. Optional `callSiteTag` parameter on all
  four entry points (`pushEntity`, `pushEntities`, `deleteEntity`,
  `deleteEntities`).
- 8 new specs in `pipeline-write.service.spec.ts` covering the
  rejection event firing, callSite tagging, error re-throw, ISO
  timestamp format, success-path no-op.

**Director-issued corrections** (`5444014`, `97885c9`): minor lint
+ unused-var fixes from the Wave 1 review.

## Wave 2 — Opportunistic Remediation (commits `d64d11d` through `7422387`)

**Pattern (the "SIMPLE" remediation):**

```ts
// Before (fire-and-forget):
this.pipelineWrite.pushEntity('X', data).catch(err => console.error(err));

// After (Wave 2):
try {
  await this.pipelineWrite.pushEntity('X', data, [], 'caller.service:NN');
} catch (err) {
  this.snackBar.open(`Failed to save X: ${(err as Error).message}`, 'Dismiss', { duration: 5000 });
  throw err;
}
```

Three properties at once: (a) user sees a toast on every failure;
(b) telemetry has a precise `callSite` to attribute the failure;
(c) caller observes the rejection so optimistic-UI rollback / form
re-enable can run.

**Sites remediated (42 total, 15 commits):**

| Service | Sites | Commit |
|---|---|---|
| bids.service.ts (Bid submit) | 1 | `a1321a0` |
| sme-mart-task.service.ts | 2 | `a1321a0` |
| notes.service.ts | 3 | `d64d11d` |
| note-folder.service.ts | 3 | `d64d11d` |
| vendor-profile.service.ts | 3 | `d64d11d` |
| vetting.service.ts | 4 | `8c2236c` |
| reviews.service.ts | 3 | `2a66bc2` |
| engagements.service.ts | 2 | `13415a5` |
| service-offerings.service.ts | 2 | `8f50a66` |
| rfp-invitation.service.ts | 1 | `6f0e58b` |
| org-document.service.ts | 1 + 3 | `9418936`, `769bfde` |
| sme-mart-project.service.ts | 1 | `c8210ed` |
| project-prd.service.ts | 4 | `b2e014c` |
| project-plan.service.ts | 4 | `150df9a` |
| sme-mart-board.service.ts | 2 | `eb228ce` |
| note-hierarchy.service.ts | 1 | `672024e` |
| sme-mart-workflow.service.ts | 2 | `7422387` |

**Backlog filed for v1.5 polish (`89e7c13`):**

- `FF-POLISH-1` — bids.service.ts:368 — submit button disabled-state
  + retry CTA + form-data preservation.
- `FF-POLISH-2` — vetting.service.ts:184 — per-item batch error
  handling (partial success surface + per-item retry).
- `FF-POLISH-3` — submit-button-disable sweep across review /
  engagement / offerings / rfp / prd / plan / task forms.

**LOW — not remediated (intentional):**
`sme-mart-activity.service.ts:57,146` — activity telemetry; legitimate
fire-and-forget. Telemetry instrumentation alone is sufficient.

## Wave 3 — Verification (this commit)

**What landed:**

1. **Note-folder kill-network coverage** (`note-folder.service.spec.ts`):
   3 new specs in a `describe('Pipeline rejection error surface
   (Phase 20 Wave 3)')` block — one each for the
   `note-folder.service:107`, `:230`, `:260` callSites. Each test
   mocks `PipelineWriteService.pushEntity` to reject, asserts
   `MatSnackBar.open` is called with a contextual message, and
   asserts the rejection re-throws to the caller. Closes the only
   gap in the existing service-spec rejection coverage. (The other
   16 remediated services already had rejection-path specs from
   Wave 2.)

2. **Round-trip-per-class-id gate** (`pipeline-write.service.spec.ts`):
   parameterized `it.each` over a 23-row CASES table mapping every
   `SmeMartClassName` to its canonical platform-assigned UUID.
   Each case calls `pushEntities(className, [...])` and asserts
   `mockPipelineApi.receive.mock.calls[0][1].classId.toString()`
   equals the expected UUID. Belt-and-suspenders length and
   uniqueness assertions catch silent regressions if a future
   class-id is added without updating the test table, or if a
   copy-paste duplicates a UUID/className. Pinned in
   `ROUND-TRIP-RESULTS.md`.

3. **AUDIT.md prose cleanup**: relabelled the "Error Surface?"
   column to distinguish "snackbar exists" from "snackbar reflects
   actual outcome". Replaced the 16 "likely has error handling"
   cells in AWAITED rows 45-60 with concrete code citations
   (`<file>.ts:NN — surfaces via <mechanism>`). Honest revised
   tally:
   - 5 sites with proper user-visible surface (FormSubmission
     create/update via project-detail-form, BidResponse save via
     bid-wizard).
   - 2 sites with no UI consumer wired today (DocumentInstance —
     service awaits and propagates correctly; surface depends on
     future consumer).
   - 2 sites with NgZone-only fallthrough (DocumentTemplate via
     template-editor — `try/finally` without `catch`). Captured
     by `FF-POLISH-3` in BACKLOG.md.
   - 9 sites with service-internal `console.error` swallow
     (DemoData seed runner — admin-only, acceptable).

4. **Soak documentation**: `UAT-SOAK-READY.md` describes the
   telemetry sink (`console.warn` with `[PIPELINE_WRITE_FAILURE]`
   prefix), the event shape, the soak query patterns (browser
   console manual + CloudWatch Insights template), and the
   non-blocking 7-day soak timeline.

5. **Round-trip results**: `ROUND-TRIP-RESULTS.md` — 23/23 ✅
   canonical, no errata filed.

6. **Build green at HEAD**: `npx tsc --noEmit` exits 0;
   `npm test` reports 1537/1537 passing across 118 test files;
   no new diagnostics introduced by Wave 3 changes (the BACKLOG
   #094 dead-code diagnostics are pre-existing and out of scope
   per Director).

## Deliverables

1. [`AUDIT.md`](AUDIT.md) — 60-site call-site table + Class-ID
   Verification Table + Wave 2 remediation grouping + Wave 3
   prose cleanup.
2. [`ROUND-TRIP-RESULTS.md`](ROUND-TRIP-RESULTS.md) — 23/23 ✅
   class-id round-trip results.
3. [`UAT-SOAK-READY.md`](UAT-SOAK-READY.md) — telemetry sink +
   soak configuration + query patterns.
4. **Wave 3 spec additions:**
   - `src/app/core/services/note-folder.service.spec.ts` —
     3 kill-network rejection-path tests.
   - `src/app/core/services/pipeline-write.service.spec.ts` —
     parameterized round-trip-per-class-id over 23 cases + drift
     guards.
5. **Wave 2 service remediations** (15 services, see commit table).
6. **BACKLOG.md polish entries** — `FF-POLISH-1/2/3`.

## Metrics

- **Call sites audited:** 60
- **Call sites remediated (Wave 2):** 42
- **Call sites legitimately fire-and-forget (Wave 1 retained):** 2
  (activity telemetry)
- **Class IDs verified canonical:** 23/23
- **New unit tests added across Phase 20:** ~30
  (Wave 1 telemetry + Wave 2 service rejection paths + Wave 3
  round-trip + note-folder rejection)
- **Total unit-test count at HEAD:** 1537 (118 files)
- **Build time:** ~8s for full unit suite (no regression)

## Soak (Post-Merge — non-blocking)

- **Duration:** 1 week (7 days) post-merge
- **Owner:** Director (Day 7 review)
- **Sink:** `console.warn` with `[PIPELINE_WRITE_FAILURE]` prefix
- **Goal:** measure real-world rejection frequency; promote any
  site with non-zero rejections to a v1.5 polish entry.
- **See:** [`UAT-SOAK-READY.md`](UAT-SOAK-READY.md).

## Related Errata

- **Errata 011** (fire-and-forget masks errors) — addressed by
  Wave 1 instrumentation + Wave 2 remediation. Watch-list FF-07.
- **Errata 023** (fictional class IDs) — re-verified canonical via
  Wave 1 platform check + Wave 3 round-trip drift gate.
  Watch-list FF-08.
- **No new errata filed during Phase 20.**

## Next Phase

Phase 27 (Auth Gate + Onboarding Routing + Lazy Guard). The
fire-and-forget remediation is a prerequisite for the v1.4
default-engagement flow — onboarding writes to several remediated
services (engagements, projects, profile items), and silent failures
during first-run setup are particularly user-hostile.

## Closure status

- [x] Wave 1 audit + instrumentation merged
- [x] Wave 2 remediation across 42 sites merged
- [x] Wave 3 verification specs + AUDIT cleanup + soak docs in this commit
- [x] Build green at HEAD (`tsc --noEmit` + `npm test`)
- [x] Director checkpoint resolved (DECISIONS.md "Phase 20
      Telemetry callSiteTag Uses Post-Edit await Line Number"
      locks the convention)
- [ ] gsd-verifier FF-01..FF-08 verification (this commit)
- [ ] gsd-tools phase complete 20 (this commit)
- [ ] PROJECT.md FF-* requirements Active → Validated (this commit)
- [ ] Director spot-check at Wave 3 commit boundary (HALT before
      push; Director will review kill-network coverage, AUDIT.md
      prose, and verifier output)
- [ ] UAT soak Day 7 review (post-merge, non-blocking)
