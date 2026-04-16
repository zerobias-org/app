---
id: "014"
severity: high
phase: 18
found: 2026-04-15
status: resolved
resolved: 2026-04-16
resolution: "Plan 18-03: dropped all client-side org filters (admin-only usage + platform hidden:true universal on UAT made filter useless) and removed explicit <mat-icon matMenuTriggerIcon>arrow_right</mat-icon> line so only Material's default submenu caret renders. DECISIONS.md updated with 2026-04-15 no-filter addendum. Director UAT 2026-04-16 confirmed populated list + single chevron."
origin:
  errata_chain: "013 → 014 (post-hotfix defects discovered)"
---

# Phase 18 Org Switcher — hidden filter wipes entire list + double chevron on trigger

After Plan 18-02 hotfix (c3d838b) reopened Phase 18 and swapped `app.getOrgs()` for `clientApi.danaClient.getMeApi().listMyOrgs()`, the submenu STILL renders empty. UAT walkthrough 2026-04-15 17:14 shows: trigger now correctly positioned above "My Organizations" (Defect 2 from errata 013 ✓), but submenu opens empty AND the trigger row shows two right-pointing chevrons.

## Defect A — `hidden:true` filter wipes the entire org list

Verified by calling `danaOld.Me.listMyOrgs` via ZB MCP against UAT profile (`uat-zb`) 2026-04-15:

All 5 orgs returned by `listMyOrgs` have `hidden: true`:

```
System Org                (slug: system)              hidden: true
Auditmation Operations    (slug: operations.auditmation.io) hidden: true
Zerobias Operations       (slug: operations.zerobias.com)   hidden: true
Roughnecks                (slug: roughnecks)          hidden: true
ZeroBias                  (slug: zerobias)            hidden: true   ← currently active
```

Service filter at `src/app/core/services/org-switcher.service.ts:22`:

```typescript
.filter((org) => !org.hidden)
```

…filters out all 5. Empty list.

**Root cause of the misunderstanding:** MEMORY.md and `DECISIONS.md` both lock the rule "Hide `hidden: true` orgs" based on assumed semantics. Real UAT data shows `hidden` is universally true on orgs the current user belongs to, so the flag means something different from what we inferred. Most likely: `hidden:true` means "don't surface this org in public discovery endpoints," NOT "don't show to a user who is already a member." The filter was always wrong for this use case; we just never exercised it.

**`/orgs` page (org-list.component.ts:107) does NOT filter on hidden** — it preserves the flag but shows every org. That's why `/orgs` works. This is further evidence that the hidden filter was misapplied in the org switcher.

**Fix:**
1. Remove `.filter((org) => !org.hidden)` from `orgs$` computed signal
2. Implement the ops-org filter properly (currently `isOpsOrg()` returns `false` — a TODO hook from errata 013):
   ```typescript
   private isOpsOrg(org: dana.Org): boolean {
     const slug = (org.slug || '').toLowerCase();
     return slug.includes('operations');
   }
   ```
3. Update service spec to reflect new filter rules (no hidden filter, slug-based ops-org filter)
4. Update MEMORY.md "Org List Filtering Rules" to match reality: filter by System Org UUID + slug-contains-`operations`. Remove the hidden-flag rule.

**Expected visible orgs for Clark on UAT after fix:**
- Roughnecks
- ZeroBias (current, bold + dot)

## Defect B — Two right-pointing chevrons on "Switch Organization"

Screenshot 2026-04-15 17:14 shows the trigger rendered as:

```
[account icon]  ▸  Switch Organization  ▸
```

Template at `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html:30-39`:

```html
<button mat-menu-item
        [matMenuTriggerFor]="orgSwitcherSubmenu"
        (click)="$event.stopPropagation()"
        data-testid="org-switcher-trigger">
  <mat-icon>switch_account</mat-icon>
  <span>Switch Organization</span>
  <mat-icon matMenuTriggerIcon>arrow_right</mat-icon>   ← custom indicator
</button>
```

`matMenuTriggerIcon` is supposed to REPLACE the default Material submenu indicator. Two possibilities:
1. Angular Material version in SME Mart doesn't implement `matMenuTriggerIcon` — directive is ignored, arrow_right renders as a regular inline icon, AND Material's default caret still appears
2. Material version does implement it, but the template placement is interacting with another rule (likely the button's content placement)

**Fix:** remove line 38 entirely (`<mat-icon matMenuTriggerIcon>arrow_right</mat-icon>`). Let Material's automatic submenu indicator render — it's consistent with the rest of mat-menu, and users already know that pattern.

If later someone wants a custom indicator, verify Material version supports `matMenuTriggerIcon` and test in isolation before re-adding.

## Impact

- **User-facing:** org switcher trigger is positioned correctly but does nothing (submenu empty). Visual polish hit (double chevron).
- **Process signal:** Plan 18-02 marked errata 013 as resolved without UAT walkthrough. Executor self-certified — director's conditional ("resolved ONLY if UAT passed") was ignored. Reinforces WATCH-LIST pattern: "Executor marks errata resolved without user-validated UAT screenshot" is a BLOCK.
- **Memory drift:** the locked Org List Filtering Rules in MEMORY.md / DECISIONS.md are wrong. Must be updated alongside the fix, or the next person to write an org-related feature will re-introduce this bug.

## Prevention patterns for WATCH-LIST

- [ ] **Service filter based on a flag whose semantics are assumed, not verified** — BLOCK. If a filter depends on a server-side flag (`hidden`, `archived`, `status`), describe the flag's meaning from the API docs OR from real data in at least one env before shipping.
- [ ] **Executor marks an errata `resolved` without UAT walkthrough evidence** — BLOCK. Status `resolved` requires a screenshot or test run attached; otherwise status is `blocked_on: UAT walkthrough`.
- [ ] **`matMenuTriggerIcon` + explicit `<mat-icon>` in a mat-menu trigger** — FLAG. Either the directive replaces the default indicator or it doesn't; don't ship both.
- [ ] **Locked filtering rule in memory is contradicted by real API data** — FLAG. When an errata uncovers a memory-vs-reality gap, update the memory file in the same change.

## Status

- Plan 18-03 (hotfix #2) required. Three tasks:
  1. Drop hidden filter + implement ops-org filter + update spec
  2. Remove explicit `matMenuTriggerIcon` line from template
  3. Update MEMORY.md "Org List Filtering Rules" + DECISIONS.md equivalent to match reality (remove hidden-flag rule, slug-based ops-org stays)
- Errata 013 should be re-opened to `open` with blocker `"superseded by 014 — UAT showed hotfix insufficient"` — it was prematurely closed. Alternatively keep 013 closed and track 014 standalone.
- Phase 18 close gate unchanged: UAT walkthrough screenshot showing populated list at correct position, WITH director review of the screenshot (not self-certified by executor).
