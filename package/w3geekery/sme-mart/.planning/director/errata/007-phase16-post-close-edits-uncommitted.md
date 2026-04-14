---
id: "007"
severity: medium
phase: 16
found: 2026-04-14
status: open
---

# Phase 16 — Post-close UX polish sitting uncommitted in working tree

After Phase 16 closed (commit 69a2da8, 2026-04-14T23:51Z), the user ran a Chrome DevTools walkthrough of the form builder and flagged multiple UX issues. Fixes were made in this session but **never committed**. Phase 16 is marked complete in ROADMAP/STATE while real fixes to its deliverables sit dirty in the working tree.

**Uncommitted changes (modifieds against 69a2da8):**
- `src/app/shared/components/form-builder/form-builder.component.scss` — dark-mode theme tokens (replaces hardcoded `#fafafa`, `#999`, `#e0e0e0`, `#ffebee`, `#c62828` with `var(--mat-sys-*)`)
- `src/app/shared/components/form-builder/form-field-editor.component.scss` — same treatment + `.type-specific` made into a 2-col grid so `.full-width` works
- `src/app/shared/components/form-builder/form-field-editor.component.html` — dropdown options label shortened ("Options" vs "Options (one per line, format: value|label)"), format moved to `<mat-hint>`
- `src/app/shared/components/form-builder/form-field-renderer.component.scss` — dark-mode treatment on file-upload chip, no-file text, description text
- `src/app/shared/components/form-builder/form-field-renderer.component.ts` — `isReadOnly = mode === 'review'` (was `mode !== 'fill'`). Preview mode dropdowns now interactive so the buyer can click and see options.
- `src/app/shared/components/form-builder/dynamic-form-renderer.component.scss` — dark-mode treatment on mode-preview/mode-review containers, error banner, form section dividers

**Root cause:** No post-phase commit gate. After a gsd-executor says "phase complete", the director skill does not automatically checkpoint — discovered only when the user asked "so meta:director doesn't do anything after execute finishes?" The window between phase close and next phase start is currently a drift zone.

**Impact:** Mirrors the exact pattern from `.claude/post-mortems/2026-04-14-schema-inherited-props-drift.md` (commit-claim drift — edits sit in working tree across phase/PR boundaries). If work resumed tomorrow and someone said "git stash && start Phase 17", all six UX fixes would vanish.

**Fix:** Commit the UX polish as a follow-up to Phase 16 (conventional-commits `fix(16-form-builder): post-UAT UX polish`) before advancing to Phase 17. The hardcoded-colors flag (FLAG-7 from verification, pre-existing "acceptable MVP limitation") is now partially addressed for the 4 form-builder files — document that in the commit message.

**Process improvement for WATCH-LIST:** "After gsd-executor reports phase complete, run director checkpoint — do not start new work until all phase-related edits are committed or explicitly tracked as errata."
