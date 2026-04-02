---
phase: 13
slug: pilot-projects
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via `ng test` → Angular CLI) |
| **Config file** | `angular.json` (test target uses `@angular/build:unit-test`) |
| **Quick run command** | `npm test -- --include='**/sme-mart-project*'` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --include='**/sme-mart-project*'`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | PLT-01 | unit | `npm test -- --include='**/sme-mart-project.service*'` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | PLT-04 | unit | `npm test -- --include='**/project-card*'` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | PLT-04 | unit | `npm test -- --include='**/project-list*'` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 1 | PLT-02 | unit | `npm test -- --include='**/project-detail*'` | ❌ W0 | ⬜ pending |
| 13-01-05 | 01 | 1 | PLT-03 | unit | `npm test -- --include='**/project-detail*'` | ❌ W0 | ⬜ pending |
| 13-01-06 | 01 | 1 | PLT-02 | unit | `npm test -- --include='**/vetting-suggestion*'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/pages/project/project-card.component.spec.ts` — stubs for PLT-04 (type chip, icon)
- [ ] `src/app/pages/project/project-list.component.spec.ts` — stubs for PLT-04 (type filter)
- [ ] `src/app/pages/project/project-detail.component.spec.ts` — stubs for PLT-02/PLT-03 (completion, promotion)
- [ ] `src/app/pages/engagements/tabs/vetting-suggestion-panel.component.spec.ts` — stubs for PLT-02 (pilot suggestion)

*Existing: `sme-mart-project.service.spec.ts` already has test infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pilot badge renders with correct color | PLT-04 | Visual styling verification | Inspect project card in browser, verify chip color |
| Completion dialog shows summary | PLT-02 | Dialog interaction flow | Click "Mark Complete" on pilot detail, verify dialog content |
| Promotion creates linked project | PLT-03 | End-to-end data flow through Pipeline | Promote pilot, verify new project appears with link |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
