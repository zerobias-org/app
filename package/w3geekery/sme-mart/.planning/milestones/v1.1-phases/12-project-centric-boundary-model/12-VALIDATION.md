---
phase: 12
slug: project-centric-boundary-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (via `ng test` / karma+jasmine configured in angular.json) |
| **Config file** | `karma.conf.js` / `angular.json` test architect config |
| **Quick run command** | `npm test -- --include='src/app/pages/orgs/**' --include='src/app/pages/project/**'` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run targeted tests for modified components
- **After every plan wave:** Run full suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | SC-1 | unit | `npm test -- --include='**/org-list*'` | ✅ | ⬜ pending |
| 12-01-02 | 01 | 1 | SC-2 | unit | `npm test -- --include='**/org-list*'` | ✅ | ⬜ pending |
| 12-01-03 | 01 | 1 | SC-3 | unit | `npm test -- --include='**/org-detail*'` | ✅ | ⬜ pending |
| 12-01-04 | 01 | 2 | SC-4 | unit | `npm test -- --include='**/project-parties*'` | ❌ W0 | ⬜ pending |
| 12-01-05 | 01 | 2 | SC-5 | unit | `npm test -- --include='**/project-parties*'` | ❌ W0 | ⬜ pending |
| 12-01-06 | 01 | 2 | SC-6 | unit | `npm test -- --include='**/boundary*'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/pages/project/tabs/project-parties-tab.component.spec.ts` — stubs for parties tab
- [ ] `src/app/core/services/boundary.service.spec.ts` — stubs for BoundaryService
- [ ] Existing `org-list.component.spec.ts` and `org-detail.component.spec.ts` — extend with new test cases

*Existing test infrastructure covers framework setup. Only new component test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Internal/External badge color | SC-1 | Visual styling (green vs blue chip) | Navigate to /orgs, verify green badge on home org, blue on others |
| Accordion expand/collapse UX | SC-4/SC-5 | Interaction UX | Open project parties tab, verify single boundary auto-expands, multiple collapse |
| Navigation links work | SC-3 | E2E routing | Click engagement header → engagement detail, click project row → project detail |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
