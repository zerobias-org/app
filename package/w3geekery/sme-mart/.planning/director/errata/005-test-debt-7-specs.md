---
id: "005"
severity: medium
phase: 14-15
found: 2026-04-10
status: fixed
fixed: 2026-04-10
---

# 7 failing spec files / 33 failing tests accumulated across Phases 14-15

Pre-existing test failures accumulated without being fixed during phase execution:

- project-detail.component.spec.ts — mock services returning undefined instead of Observable/Promise
- my-invitations.component.spec.ts — JIT compilation failed (Directionality)
- project-invited-vendors-tab.component.spec.ts — JIT compilation
- template-editor.component.spec.ts — `@/core/services` path alias unresolved
- project-completion-dialog.component.spec.ts — TestBed mock setup
- project-list.component.spec.ts — TestBed mock setup
- wave-1-integration.spec.ts — TestBed mock setup

**Root cause:** Components modernized to `inject()` pattern but specs not updated to match. TestBed configuration must be complete before `createComponent()` when using `inject()` at class construction time.

**Impact:** 33 tests failing, masking potential regressions. WATCH-LIST item from v1.0 retro: "Build errors accumulate without being fixed."

**Fix:** gsd-execute rewrote mock setups to work with inject() pattern. 1259/1259 tests passing.
