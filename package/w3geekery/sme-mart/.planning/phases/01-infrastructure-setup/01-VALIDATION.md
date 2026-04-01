---
phase: 1
slug: infrastructure-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (latest) |
| **Config file** | `vitest.config.ts` (existing) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run` (affected specs)
- **After every plan wave:** Run `npm test` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | INFRA-01 | unit | `npm test -- --run field-mapping` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFRA-02 | unit | `npm test -- --run test-helpers` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFRA-03 | unit | `npm test -- --run test-helpers` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFRA-04 | integration | `npm test -- --run roundtrip` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | INFRA-05 | compile | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/core/gql-types/` — GQL TypeScript interfaces for 8 entities
- [ ] `src/app/test-helpers/angular.ts` — extend with `fakePipelineWriteService()` and `fakeGraphqlReadService()`
- [ ] `src/app/core/services/*.roundtrip.spec.ts` — roundtrip field mapping tests per entity

*Existing test infrastructure (Vitest, 456+ tests) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Field mapping completeness | INFRA-01 | Mapping constants verified by code review against YAML schema | Compare field count in mapping vs YAML class definition |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
