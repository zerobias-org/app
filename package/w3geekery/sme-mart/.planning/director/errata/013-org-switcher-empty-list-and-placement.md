---
id: "013"
severity: high
phase: 18
found: 2026-04-15
status: resolved
resolved: 2026-04-16
resolution: "Plans 18-02 + 18-03 combined: 18-02 swapped getOrgs→listMyOrgs (SDK method fix) and repositioned trigger above My Organizations (placement fix); 18-03 followed up by dropping the residual over-filtering that still masked the list. Director UAT 2026-04-16 confirmed populated, correctly-placed submenu."
---

# Phase 18 Org Switcher — submenu renders empty + placement buried below Settings

Discovered during director checkpoint 2026-04-15 (post-execute, pre-push). The "Switch Organization" submenu opens but shows no orgs, AND the menu entry is placed below Settings rather than near the current-org header where users expect it. Two defects in one phase delivery; both traced to the plan/execution, not the brief.

## Defect 1 — Empty submenu (wrong SDK method)

`OrgSwitcherService.loadOrgs()` calls `this.app.getOrgs()`:

```typescript
// src/app/core/services/org-switcher.service.ts:35
private loadOrgs(): void {
  this.app.getOrgs().subscribe((orgs) => {
    this.rawOrgs.set(orgs || []);
  });
}
```

`ZerobiasClientApp.getOrgs()` returns `this.$orgs.asObservable()` — a subject that only emits when someone calls `setOrgs()`. In SME Mart's auth flow, `$orgs` is populated at best with a single org (the current one) — typically empty for standalone API-key mode.

**Correct pattern (used elsewhere in the app):**
```typescript
// src/app/pages/orgs/org-list.component.ts:107
const orgs = await this.clientApi.danaClient.getMeApi().listMyOrgs();
```

`listMyOrgs()` returns the orgs the current user is a member of — exactly what a switcher needs. This is the same source the `/orgs` list page uses.

**Root cause:**
- Planner and executor both took `app.getOrgs()` at face value based on the method name
- Research doc mentions `listOrgs()` but not `listMyOrgs()`
- No integration test against real SDK — unit tests mocked `getOrgs()` to return populated arrays, so the mock hid the real behavior (this is the "mock is lying" failure mode from `~/.claude/rules/common/testing.md`)
- WATCH-LIST pattern "Unit test uses fake that never errors" applies to this case — fake that returns populated data when real method returns empty

**Fix:**
1. Replace `app.getOrgs()` call in `OrgSwitcherService.loadOrgs()` with `clientApi.danaClient.getMeApi().listMyOrgs()`
2. Convert `loadOrgs()` from Observable subscribe to async/await (matching `org-list.component.ts` pattern)
3. Update service spec mocks to match the real method path; add a "returns empty array" test
4. Add a lightweight E2E or manual UAT assertion: submenu contains >1 org

## Defect 2 — Placement below Settings instead of near current-org header

Current placement (per screenshot 2026-04-15 16:47):
```
[current org avatar + name header]
My Organizations
My Engagements
My Projects
My Profile
Settings
---
🏢 Switch Organization  ▶       ← too far down
---
BROWSE
```

The brief decision (CONTEXT.md) says placement should be a nested submenu in the existing user menu, with an "Organization" section feel — implying near the top.

**Expected placements** (either is acceptable; zb/ui uses the first):
- Chevron trigger on the current-org header itself (click the header to open org list)
- A dedicated "Organization" section directly under the header, above "My Organizations"

**Root cause:**
- Plan Task 2 step 2 said "Inside the existing `<mat-menu>` (after the current menu items), add..." — appending to the end instead of inserting near the top
- Director review noted the placement decision in CONTEXT but did not explicitly require a position in the menu
- No UX validation step (screenshot comparison against zb/ui portal) in the plan

**Fix:**
1. Read the zb/ui portal user-menu component's organization section — confirm it's a chevron on the header or a section at top
2. Move the submenu trigger to match that pattern
3. Update Playwright E2E to assert the submenu trigger appears above `My Organizations`

## Impact

- **User-facing:** feature ships non-functional (empty list) and mispositioned — effectively a regression on the "stop editing sessionStorage in DevTools" value prop.
- **Test coverage gap:** 20 unit + 5 E2E tests passed despite the defects — the mocks shielded the real bug. Tests need to hit `listMyOrgs` specifically, and E2E needs a real-session "at least 2 orgs visible" assertion.

## Prevention patterns for WATCH-LIST

- [ ] **Service method uses SDK observable getter (`app.get*()`) instead of API method (`clientApi.*.get*Api().list*()`)** — BLOCK. The observable getters return subjects that may not emit in all auth flows. Use the concrete API method used by comparable pages.
- [ ] **Service spec mocks return populated data for a method that returns empty in real auth** — FLAG. Add one spec that asserts the empty case matches reality.
- [ ] **New UI component placed via "after existing items" without a screenshot comparison** — FLAG. Plans that add a visible menu entry must specify position relative to existing entries and verify against reference UI in review.

## Status

- Fix required before closing Phase 18 for real. Executor should open Plan 18.2 (hotfix) with tasks (1) swap SDK method, (2) reposition submenu, (3) augment specs for both defects.
- Do NOT mark Phase 18 complete in ROADMAP/STATE until hotfix lands and UAT walkthrough shows populated list at correct position.
