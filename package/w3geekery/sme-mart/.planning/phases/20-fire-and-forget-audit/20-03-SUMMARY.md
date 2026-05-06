---
phase: 20
plan: 03
subsystem: data-integrity
tags: [verification, kill-network, round-trip, soak-config, audit-cleanup, fire-and-forget]

requires:
  - phase: 20-01
    provides: AUDIT.md + telemetry instrumentation
  - phase: 20-02
    provides: 42 remediated fire-and-forget call sites with await + try/catch + snackbar + re-throw
provides:
  - Kill-network rejection-path specs filling the note-folder coverage gap
  - Parameterized round-trip-per-class-id assertions over all 23 SME_MART_CLASS_IDS entries (drift gate)
  - AUDIT.md prose cleanup — column-header rename + 16 AWAITED-row code citations
  - ROUND-TRIP-RESULTS.md (23/23 ✅ canonical)
  - UAT-SOAK-READY.md (telemetry sink + soak query patterns + 7-day non-blocking timeline)
  - PHASE-20-SUMMARY.md (consolidated Waves 1+2+3 narrative)

affects:
  - UAT 7-day soak (post-merge, non-blocking)
  - Future class-id additions (round-trip block fails fast on drift)

key-files:
  created:
    - .planning/phases/20-fire-and-forget-audit/ROUND-TRIP-RESULTS.md
    - .planning/phases/20-fire-and-forget-audit/UAT-SOAK-READY.md
    - .planning/phases/20-fire-and-forget-audit/PHASE-20-SUMMARY.md
  modified:
    - .planning/phases/20-fire-and-forget-audit/AUDIT.md (Error Surface? column header + AWAITED rows 45-60)
    - src/app/core/services/note-folder.service.spec.ts (3 kill-network rejection-path tests)
    - src/app/core/services/pipeline-write.service.spec.ts (parameterized round-trip over 23 classes + drift guards)
---

# Plan 20-03 — Wave 3 Summary

**Status:** Complete. See [PHASE-20-SUMMARY.md](PHASE-20-SUMMARY.md) "Wave 3 — Verification" for full details.

## Outcome

1. **Note-folder kill-network coverage** — 3 new specs covering the
   3 remediated callSites (`note-folder.service:107,230,260`).
   Each test mocks `PipelineWriteService.pushEntity` to reject,
   asserts `MatSnackBar.open` with a contextual message, and
   asserts the rejection re-throws.
2. **Round-trip-per-class-id gate** — `it.each` over a 23-row
   CASES table mapping every `SmeMartClassName` to its canonical
   platform-assigned UUID. Length + uniqueness drift guards
   catch silent regressions (new class added without test, or
   copy-paste duplicating a UUID/name).
3. **AUDIT.md prose cleanup** — "Error Surface?" column header
   now distinguishes "snackbar exists" from "snackbar reflects
   actual outcome". The 16 AWAITED rows (45-60) carry concrete
   `<file>.ts:NN — surfaces via <mechanism>` citations.
4. **ROUND-TRIP-RESULTS.md** — 23/23 ✅ canonical, no errata.
5. **UAT-SOAK-READY.md** — telemetry sink, event shape, query
   patterns (browser console + CloudWatch Insights template),
   non-blocking 7-day soak timeline.
6. **Build green at HEAD** — `npx tsc --noEmit` exits 0;
   `npm test` reports 1537/1537 across 118 files.

## Wave 3 commit boundary

This plan corresponds to a single Wave-3 commit. Director will
spot-check kill-network coverage, AUDIT.md prose, and verifier
output before push. UAT 1-week soak runs post-merge,
**not** phase-close blocking.

## Related

- Requirements FF-01..FF-08 — all addressed across Phase 20 (this
  wave finalizes FF-06 with code citations and FF-07/FF-08 with
  the round-trip gate enforcing the watch-list patterns).
- DECISIONS.md "Phase 20 Telemetry callSiteTag Uses Post-Edit
  await Line Number" — Wave 2 corrections accepted, not amended.
- BACKLOG #094 — pre-existing dead-code diagnostics in Wave-2-touched files; out of Wave 3 scope.
