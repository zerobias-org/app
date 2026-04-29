---
phase: 20
plan: 01
subsystem: data-integrity
tags: [audit, telemetry, class-ids, pipeline-write, fire-and-forget, errata-011, errata-023]

requires:
  - phase: 02-services-migration
    provides: PipelineWriteService — receiver entry point shared by all SME Mart writes
  - phase: 13-pilot-projects
    provides: SME_MART_CLASS_IDS registry baseline
provides:
  - 60-row call-site audit (44 fire-and-forget + 16 awaited)
  - Class-ID Verification Table (23/23 canonical against platform.Class.getClass on UAT)
  - [PIPELINE_WRITE_FAILURE] structured-event telemetry on receiver-rejection path
  - Optional callSiteTag parameter on pushEntity/pushEntities/deleteEntity/deleteEntities
  - 8 telemetry-instrumentation specs in pipeline-write.service.spec.ts
  - REQUIREMENTS.md FF-01..FF-08 specified

affects:
  - Wave 2 remediation (downstream — uses telemetry as silent-failure detector)
  - Future class-id additions (Wave 3 round-trip gate enforces the convention)

key-files:
  created:
    - .planning/phases/20-fire-and-forget-audit/AUDIT.md (call-site table + class-ID verification)
  modified:
    - src/app/core/services/pipeline-write.service.ts (telemetry + callSiteTag)
    - src/app/core/services/pipeline-write.service.spec.ts (8 telemetry specs)
    - .planning/REQUIREMENTS.md (FF-01..FF-08 specified)
---

# Plan 20-01 — Wave 1 Summary

**Status:** Complete. See [PHASE-20-SUMMARY.md](PHASE-20-SUMMARY.md) "Wave 1 — Audit & Instrumentation" for full details.

## Outcome

- All 60 `pushEntity`/`pushEntities` call sites cataloged in [AUDIT.md](AUDIT.md) with criticality (CRITICAL / MEDIUM / LOW / AWAITED-VERIFY) and complexity (SIMPLE / MEDIUM / COMPLEX) ratings.
- All 23 entries in `SME_MART_CLASS_IDS` re-verified against `platform.Class.getClass` on UAT — 23/23 canonical, no fictional/drifted consts (corrects errata 023).
- Receiver-rejection path emits `[PIPELINE_WRITE_FAILURE] {className, callSite, errorMessage, timestamp}` structured event via `console.warn`, then re-throws.
- Sets up Wave 2 (opportunistic remediation) and Wave 3 (verification + soak readiness).

## Commits

- `977828c` — feat(phase-20-wave1): fire-and-forget audit, class-ID verification, telemetry instrumentation
- `5444014`, `97885c9` — director-checkpoint corrections

## Related

- Errata 011 (silent fire-and-forget) — addressed
- Errata 023 (fictional class IDs) — re-verified canonical
- Requirements FF-01, FF-02, FF-03, FF-06
