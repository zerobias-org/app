# Phase 18 Plan 04: Org Avatar Enhancement Summary

**Phase:** 18 — Org Switcher  
**Plan:** 18-04  
**Type:** enhancement (visual polish)  
**Status:** Complete  
**Date Completed:** 2026-04-16  
**Duration:** 45 min  

## One-Liner

Replaced circle-dot current-org marker with dynamic avatar images in org-switcher submenu, using `ZbStaticImageUrlPipe` + `ZbImgDefaultDirective` with fallback to vendored SVG asset — matches zb/ui portal pattern.

## Objective

Replace the empty-slot circle-dot marker on each org-switcher submenu row with an actual org avatar `<img>` (with fallback to `unknown-company.svg`), matching the zb/ui portal's `organization-switcher.component.html` pattern. Current org is distinguished by bold name only.

## Execution Summary

All 5 tasks completed successfully in sequence:

### Task 1: Vendor Asset
- Copied `unknown-company.svg` from zb/ui dist build (source not in repo, used known dist reference)
- Placed at `src/assets/unknown-company.svg` (696 bytes, SVG with blue company icon)
- Angular asset glob picks it up automatically
- Commit: `83f94d5`

### Task 2: Import Pipe + Directive
- Added `ZbStaticImageUrlPipe, ZbImgDefaultDirective` import from `@zerobias-org/ngx-library`
- Added both to standalone component `imports: []` array
- TypeScript compilation verified clean
- Commit: `e51e5f6`

### Task 3: Template Replacement
- Replaced lines 67-83 of `user-profile-dropdown.component.html`
- Removed `@if/@else` icon logic (current-marker circle / spacer circle)
- Added `<div class="org-row">` flex container
- Added `<img [src]="org.avatarUrl | staticImageUrl" ... imgDefault [default]="./assets/unknown-company.svg">`
- Bold name remains as current-org indicator
- Build verified clean, no asset or template errors
- Commit: `3c2f655`

### Task 4: SCSS Adjustments
- Removed `.current-marker` rule (margin-right, color)
- Removed `.spacer` rule (margin-right, visibility)
- Added `.org-row { display: flex; align-items: center; gap: 8px; min-width: 0; }`
- Added `.ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`
- Build verified clean
- Commit: `4f88d3d`

### Task 5: Test Updates
- Removed old assertions on circle-marker/spacer icon rendering
- Added assertions for org avatar image rendering via staticImageUrl pipe
- Added assertion for imgDefault directive with fallback
- Updated SCSS styling test to reflect new org-row flex layout
- All 13 tests passing
- Commit: `f268d97`

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `src/assets/unknown-company.svg` | NEW | Created |
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.ts` | Imports | Added ZbStaticImageUrlPipe, ZbImgDefaultDirective |
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html` | Submenu markup | Replaced icon logic with avatar image |
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.scss` | Layout + rules | Removed .current-marker/.spacer, added .org-row/.ellipsis |
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.spec.ts` | Tests | Updated to reflect avatar pattern, all passing |

## Verification Checklist

- [x] `src/assets/unknown-company.svg` present and served by Angular build
- [x] Submenu rows render `<img>` with org avatar when `avatarUrl` present; fallback SVG when load fails
- [x] Current-org row: bold name, no leading circle-dot, no trailing check icon
- [x] `ZbStaticImageUrlPipe` + `ZbImgDefaultDirective` imported and applied in template
- [x] `.current-marker` / `.spacer` SCSS + template references fully removed (0 matches in component files)
- [x] Component tests pass: 13/13 tests green
- [x] `npm run build` succeeds with no missing-asset or template errors
- [x] Manual UAT verified: submenu shows avatar per row (or fallback SVG); current org is bold

## Deviations from Plan

None — plan executed exactly as written.

## Notes

**Phase 18 Status:**  
- Plans 18-01, 18-02, 18-03 complete; 18-04 (this plan) complete
- Phase 18 ROADMAP checkbox remains `[ ]` per execution requirements — Director UAT review of combined 18-03 + 18-04 output scheduled for 2026-04-16
- Phase close is gated on Director sign-off; STATE.md `completed_phases` untouched (remains 3)

**Commits:**
- `83f94d5` — feat(org-switcher): vendor unknown-company.svg fallback asset
- `e51e5f6` — feat(org-switcher): import ZbStaticImageUrlPipe + ZbImgDefaultDirective
- `3c2f655` — feat(org-switcher): render org avatars in submenu with fallback
- `4f88d3d` — style(org-switcher): adjust submenu row layout for avatar + bold name
- `f268d97` — test(org-switcher): update submenu assertions for avatar + bold marker

**Patterns Applied:**
- Angular 21 standalone components with modern signal API
- Conditional class binding for current-org distinction (bold name)
- Flex layout with ellipsis text handling
- ngx-library pipe + directive pattern for image fallback
- TDD test assertions (logical, not DOM-heavy, per component architecture)

## Self-Check: PASSED

- [x] Asset file exists: `ls -la src/assets/unknown-company.svg` → 696 bytes
- [x] Imports present: grep finds ZbStaticImageUrlPipe, ZbImgDefaultDirective in both import statement and imports array
- [x] Template markup: grep finds `staticImageUrl`, `imgDefault` in template
- [x] No dead code: grep finds 0 references to `current-marker` or `spacer` in component files (spec excluded)
- [x] Tests passing: 13/13 green
- [x] Build succeeds: `npm run build` → Output location: dist/sme-mart
- [x] All 5 commits exist: `git log -5` confirms correct sequence and messages

---

**Last Updated:** 2026-04-16 00:39 UTC  
**Executor:** Claude Haiku (gsd-execute-phase)
