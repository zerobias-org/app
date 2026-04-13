---
phase: 16
slug: form-builder
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose {file}` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose {changed-spec}`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 00 | 0 | (schema) | integration | `npm run verify` (schema repo) | ✅ | ⬜ pending |
| TBD | 01 | 1 | D3-01 | unit | `npx vitest run src/app/shared/components/form-builder/*.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | D3-02 | unit | `npx vitest run src/app/shared/components/form-builder/*.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | D3-03 | unit | `npx vitest run src/app/shared/components/form-builder/*.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | D3-04 | unit | `npx vitest run src/app/shared/components/form-builder/*.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | 02 | 2 | D3-02 | unit | `npx vitest run src/app/core/services/form-submission.service.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | 02 | 2 | D3-05 | unit | `npx vitest run src/app/pages/project/*.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | 02 | 2 | D3-06 | unit | `npx vitest run src/app/shared/components/bid-review/*.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `FormSubmission.yml` — new schema class in zerobias-org/schema
- [ ] `formConfig` field — added to SmeMartProject.yml
- [ ] `npm run verify` passes in schema repo
- [ ] Schema PR merged, ~15 min reload delay
- [ ] FormSubmission model + field mapping constants created
- [ ] FormSubmission class ID captured and registered in SME_MART_CLASS_IDS

*Existing test infrastructure (vitest) covers framework needs. Spec files created alongside components.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CDK DragDrop reorder | D3-02 | DOM drag events hard to unit test | Drag field 3 above field 1, verify order persists in formConfig JSON |
| File upload via FileService | D3-02 | Requires live ZB FileService | Upload a PDF in file field, verify fileId stored in submissionData |
| RFP wizard step navigation | D3-04 | Multi-step wizard state | Add 3 fields, navigate away to Documents step, return → fields preserved |
| Form lock after submission | D3-05 | Cross-entity state | Vendor submits form, buyer opens builder → fields are read-only/locked |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
