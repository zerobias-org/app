---
phase: 7
slug: org-navigation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-30
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest via `@angular/build:unit-test` |
| **Config file** | `angular.json` (test architect) |
| **Quick run command** | `npm test -- --include src/app/pages/orgs/` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --include src/app/pages/orgs/`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-00 | 01 | 0 | Nyquist compliance | unit | `npm test -- --include src/app/pages/orgs/` | ✅ created | ⬜ pending |
| 07-01-01 | 01 | 1 | ORG-01, ORG-02 | unit | `npm test -- --include src/app/pages/orgs/org-list` | ✅ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | ORG-03, ORG-04 | unit | `npm test -- --include src/app/pages/orgs/org-detail` | ✅ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | ORG-05, ORG-06, ORG-07 | unit | `npm test -- --include src/app/pages/orgs/org-detail` | ✅ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | ORG-09 | unit | `npm test -- --include src/app/layout/` | ✅ exists | ⬜ pending |
| 07-01-05 | 01 | 1 | ORG-10, ORG-11 | unit | `npm test -- --include src/app/pages/orgs/org-detail` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/app/pages/orgs/org-list.component.spec.ts` — stubs for ORG-01, ORG-02
- [x] `src/app/pages/orgs/org-detail.component.spec.ts` — stubs for ORG-03 through ORG-08, ORG-10, ORG-11

*Existing app-shell tests cover ORG-09 nav update.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card/table toggle visual treatment | ORG-01 | Visual design | Toggle between views, verify both render correctly |
| Active org subtle border | ORG-01 | CSS visual | Check current org card has visual indicator |
| Disabled button tooltip | ORG-10 | Tooltip UX | Hover disabled "Switch" button, verify tooltip text |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** Approved — Wave 0 test scaffold task added, all tasks include `npm test` verification commands
