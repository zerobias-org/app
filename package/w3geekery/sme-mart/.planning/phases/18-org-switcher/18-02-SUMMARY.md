---
phase: 18-org-switcher
plan: 02
type: hotfix
subsystem: ui
tags: [angular-21, org-switching, bug-fix, test-hardening, e2e]

# Dependency graph
requires:
  - phase: 18-01
    plan: 1
    provides: "OrgSwitcherService, SwitchingOrgDialog, UserProfileDropdown with submenu UI"
provides:
  - Fixed OrgSwitcherService using listMyOrgs() API method (was broken with getOrgs() subject)
  - Repositioned org switcher trigger above My Organizations (placement fix)
  - Real-session E2E tests asserting populated submenu and correct placement
  - Hardened service specs with empty-array and error-handling regression tests
affects:
  - Phase 19+ (all future org-scoped features depend on working org switching)

# Tech tracking
tech-stack:
  updated:
    - OrgSwitcherService: async/await with listMyOrgs() instead of Observable.subscribe on getOrgs()
    - E2E tests: real-session assertions without route mocks
  patterns:
    - SDK method (listMyOrgs) vs Observable subject getter (getOrgs) distinction enforced
    - Empty-array regression test as guard against silent data loss
key-files:
  modified:
    - src/app/core/services/org-switcher.service.ts (37-42, listMyOrgs call + error handling)
    - src/app/core/services/org-switcher.service.spec.ts (11 tests, 2 new regression tests)
    - src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html (trigger repositioned)
    - e2e/page-objects/org-switcher.page.ts (2 new assertion helpers)
    - e2e/specs/org-switcher.spec.ts (2 new errata 013 regression tests)

key-decisions:
  - Chose Pattern B for placement (dedicated trigger above My Organizations, not chevron on header), matching zb/ui portal structure
  - Kept E2E tests against real UAT session (no route mocking) to catch the exact defect
  - Service error handling degrades gracefully: failed listMyOrgs() logs error but returns empty list (no exception thrown to UI)

requirements-completed:
  - OS-01 (Placement): Org switcher trigger now appears above My Organizations
  - OS-02 (SDK Call): Service uses listMyOrgs() not getOrgs()
  - OS-04 (Filtering): Empty-array regression test ensures empty response is handled

# Metrics
duration: 45min
completed: 2026-04-16T00:19:00Z

---

# Phase 18, Plan 2: Hotfix — Empty Submenu + Placement (Errata 013)

**GAP-CLOSURE HOTFIX**

Two post-execute defects in Phase 18 fixed:
1. **Empty submenu** — Swapped `app.getOrgs()` (subject that doesn't emit in API-key mode) for `clientApi.danaClient.getMeApi().listMyOrgs()` (actual SDK method)
2. **Mispositioned trigger** — Moved org switcher trigger to appear immediately after menu header, before "My Organizations"
3. **Test hardening** — Added real-session E2E assertions and service-level regression tests

## Accomplishments

- **OrgSwitcherService** now calls the correct SDK method (`listMyOrgs()`) with async/await pattern
- **Service spec** includes 2 regression tests: empty array response + error handling
- **UserProfileDropdown** template repositioned org switcher trigger (Pattern B: dedicated section above My Organizations)
- **E2E tests** verify: submenu populated (>= 1 org) + trigger positioned before My Organizations
- **All 11 service tests passing** (3 filter + 1 sort + 2 regression + 5 switchTo)
- **Build verified** — no TypeScript or template errors

## Task Commits

1. **Task 1: Swap SDK method + harden specs** - `37cd480`
2. **Task 2: Reposition trigger** - `ec818ee`
3. **Task 3: Real-session E2E tests** - `16d26d0`

## Files Modified

### `src/app/core/services/org-switcher.service.ts`

- **Line 10:** Added `ZerobiasClientApi` injection
- **Lines 35-42:** Replaced `this.app.getOrgs().subscribe()` with `await this.clientApi.danaClient.getMeApi().listMyOrgs()` + try/catch

**Before:**
```typescript
private loadOrgs(): void {
  this.app.getOrgs().subscribe((orgs) => {
    this.rawOrgs.set(orgs || []);
  });
}
```

**After:**
```typescript
private async loadOrgs(): Promise<void> {
  try {
    const orgs = await this.clientApi.danaClient.getMeApi().listMyOrgs();
    this.rawOrgs.set(orgs || []);
  } catch (error) {
    console.error('[OrgSwitcherService] Failed to load orgs:', error);
    this.rawOrgs.set([]);
  }
}
```

### `src/app/core/services/org-switcher.service.spec.ts`

- **Lines 4-5:** Import `ZerobiasClientApi`
- **Lines 11-60:** Updated mock to provide `ZerobiasClientApi` with proper `danaClient.getMeApi().listMyOrgs()` chain
- **Lines 66-223:** Updated all existing tests to await async `loadOrgs()` and use `mockResolvedValue()` / `mockRejectedValue()`
- **Lines 225-276:** Added two regression tests:
  - "should handle empty array response gracefully" — verifies `orgs$` emits `[]` when API returns `[]`
  - "should handle listMyOrgs error gracefully" — verifies error is logged and empty list is set on failure

### `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html`

- **Lines 27-36:** Moved "Switch Organization" trigger button from bottom (after Settings) to top (right after menu header, before My Organizations)
- Maintains `data-testid="org-switcher-trigger"` for E2E selection
- Added divider before/after for visual separation (matches zb/ui portal pattern)

**HTML DOM order after fix:**
```
Menu header (org + avatar)
Divider
[data-testid="org-switcher-trigger"] Switch Organization
Divider
My Organizations
My Engagements
My Projects
My Profile
Settings
Divider
[BROWSE section...]
```

### `e2e/page-objects/org-switcher.page.ts`

- **Lines 228-257:** Added `assertSubmenuAboveMyOrganizations()` helper
  - Validates trigger Y position < My Organizations Y position (DOM visual order)
  - Throws clear error if elements not found or assertion fails
- **Lines 259-263:** Added `expectSubmenuPopulated(minOrgCount)` helper
  - Asserts org count >= minOrgCount (default 1)
  - Guards against regression of empty-array bug

### `e2e/specs/org-switcher.spec.ts`

- **Lines 128-137:** New test "should populate submenu with at least one org on real session"
  - Runs against real UAT session (no mocks)
  - Explicitly verifies >= 1 org visible (regression guard for errata 013 defect 1)
- **Lines 139-148:** New test "should position org switcher trigger above My Organizations"
  - Verifies visual placement of trigger vs My Organizations (regression guard for errata 013 defect 2)

## Deviations from Plan

None. Plan executed exactly as written.

## Known Stubs

None. All functionality wired end-to-end with real SDK calls.

## Test Coverage

### Unit Tests (11/11 passing)

- 3 filter tests (hidden, system org, ops org)
- 1 sort test (alphabetical order)
- 2 regression tests (empty array, error handling)
- 5 switchTo behavior tests

### E2E Tests (7 total)

- 5 existing tests (open menu, display orgs, highlight current, switch org, same-org no-op)
- 2 new errata 013 regression tests (populated submenu, placement above My Organizations)

## Placement Pattern Reference

**zb/ui portal** (`~/Projects/zb/ui/projects/portal/src/app/portal/components/zerobias-user/zerobias-user.component.html`):

Lines 18-40 show the pattern:
```html
<div class="menu-open-panel">
  <div class="main-org-user"><!-- Avatar + Name --></div>  <!-- Org user header -->
  
  <div class="main-menu">
    <mat-divider></mat-divider>
    <div mat-menu-item>
      <zb-ui-organization-switcher>...</zb-ui-organization-switcher>  <!-- Switcher here -->
    </div>
    <mat-divider></mat-divider>
    <!-- Rest of menu items -->
```

**SME Mart adoption:**
- Header → Divider → **Switch Organization** → Divider → My Organizations (rest of menu)
- Pattern B confirmed: dedicated trigger section, not chevron on header

## UAT Walkthrough

To verify errata 013 is resolved:

1. Navigate to `https://uat.zerobias.com` (or run `npm run dev` locally)
2. Click user avatar (top-right)
3. Verify menu appears with: User info → **Switch Organization (new position)** → My Organizations
4. Click "Switch Organization"
5. Verify submenu shows >= 2 orgs
6. Verify current org has circle marker and bold text
7. Click different org → Loading dialog → Reload with new org context

**Expected vs Before:**
- **Before:** Empty submenu (0 orgs), trigger below Settings
- **After:** Populated submenu (2+ orgs), trigger above My Organizations

## Errata 013 Status

Errata 013 (`013-org-switcher-empty-list-and-placement.md`) can now be marked RESOLVED:

```yaml
status: resolved  # Changed from "open"
```

Both defects (empty list + placement) are fixed, unit tests cover regressions, and E2E tests verify against real session.

## Self-Check: PASSED

- [x] All 3 task commits exist in git history with correct messages
- [x] Service uses `listMyOrgs()` not `getOrgs()`
- [x] Service spec includes empty-array + error-handling regression tests
- [x] `grep -n "app.getOrgs" src/.../org-switcher.service.ts` returns 0 matches
- [x] `grep -n "listMyOrgs" src/.../org-switcher.service.ts` returns 1 match
- [x] Trigger element `[data-testid="org-switcher-trigger"]` appears in DOM before My Organizations
- [x] E2E tests have assertions for: org count >= 1, trigger Y < My Orgs Y
- [x] No route.fulfill interception in E2E (real session requirement met)
- [x] Build successful with no errors
- [x] All 11 unit tests passing
- [x] No stubs blocking errata 013 resolution

---

*Phase: 18 (Org Switcher)*
*Plan: 02 (Hotfix — Empty Submenu + Placement)*
*Completed: 2026-04-16T00:19:00Z*
*Type: Gap-closure (errata 013)*
