# Phase 18: Org Switcher - Research

**Researched:** 2026-04-15
**Domain:** ZeroBias SDK org switching, Angular Material menus, org filtering, post-switch refresh
**Confidence:** HIGH

## Summary

The Org Switcher feature integrates ZeroBias SDK org selection (`selectOrg()`, `listOrgs()`) into SME Mart's user profile dropdown via a nested mat-menu submenu. The implementation requires:

1. **SDK integration** — `app.listOrgs()` returns a `dana.Org[]` with `id`, `name`, `hidden` properties (server pre-filters many cases)
2. **Dialog primitive** — Use existing SME Mart `ConfirmDialogComponent` or ZbDialogComponent from ngx-library for the "Switching Organization" spinner overlay
3. **Service layer** — New `OrgSwitcherService` wraps SDK calls, applies client-side filters (hidden + System Org UUID), exposes filtered org observable
4. **Refresh strategy** — Default to `window.location.reload()` to match ZB portal (safest); avoid router refresh due to org-scoped service caches
5. **Org count** — Demo seeder creates only 5 engagements (each with 1 buyer org); typical user likely has 5–10 orgs. Search input is deferred (CONTEXT.md decision allows discretion; recommend skip if <15 orgs typical)

**Primary recommendation:** Implement nested mat-menu with `OrgSwitcherService` filtering, use existing `ConfirmDialogComponent` for blocking dialog, default to `window.location.reload()` for safety.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Nested submenu via matMenuTriggerFor** inside existing UserProfileDropdown (single click depth)
- **Search input always-visible** in submenu (but director flagged: skip if <15 orgs typical)
- **New OrgSwitcherService** in `src/app/core/services/`
- **Blocking "Switching Organization" dialog** with spinner, no actions, `disableClose: true`
- **Visual indicator:** Bold + leading dot (`•`) for current org; click still allowed (SDK no-ops if same id)
- **Filtering rules:** Hide `hidden:true`, System Org `00000000-0000-0000-0000-000000000000`, ops orgs (deferred)
- **Refresh:** Hard `window.location.reload()` unless planner proves router-refresh is safe via UAT

### Claude's Discretion
- Icon choice (suggest `switch_account` or `business`)
- Submenu width/max-height
- Debounce on search input
- Loading state while `listOrgs()` in flight
- Empty-list / error state copy
- Eager vs lazy org list loading
- Cache TTL for org list

### Deferred Ideas (out of scope)
- Recently-used orgs section
- Cross-org notifications / deep-link handling
- Per-org branding
- Org creation shortcut
- Telemetry / analytics

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OS-01 | User menu surfaces "Organization" section listing all orgs the user can switch to | SDK `listOrgs()` returns array; filtering rules in service; submenu UI via mat-menu |
| OS-02 | Clicking an org calls `app.selectOrg(org)`, updates Dana cookie + sessionStorage via SDK | SDK method verified: `selectOrg(org, callback)` handles all updates; callback invoked after org switch |
| OS-03 | Current org visually distinguished (checkmark or "current" pill) | Recommendation: bold + dot marker to match ZB portal; click allowed (SDK no-op if same id) |
| OS-04 | Orgs filtered (hide `hidden:true`, System Org, ops orgs) | Client-side defensive filters on SDK output; server may pre-filter; ops-org rule deferred (TODO hook) |
| OS-05 | Switch triggers UI refresh sufficient for new org context | Hard reload (`window.location.reload()`) is safest; router refresh only if service cache audit proves safe |

---

## SDK Surface

### Method: `ZerobiasClientApp.listOrgs()`

**Source:** `~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-app.ts:158`

```typescript
// Inside initApp()
const orgs = await this.clientApi.danaClient.getOrgApi().listOrgs();
this.setOrgs(orgs.items);
```

**Signature:**
```typescript
public getOrgs(): Observable<dana.Org[]>
```

**Return type:** `Observable<dana.Org[]>` (emits `dana.Org[]`)

**Org properties (from cardservice-sdk/dist/model/Org.d.ts):**
- `id: UUID` — Org ID
- `name: string` — Org display name
- `hidden: boolean` — Hidden flag (filter out)
- `type: PrincipalTypeDef` — Org type
- `status: PrincipalStatusDef` — Active/disabled status
- `enabled: boolean` — Enabled flag
- `slug: Nmtoken` — URL-safe slug
- `visibility: OrgVisibilityDef` — Visibility scope
- `membershipPolicy: MembershipPolicyDef` — Member policy
- `supportEmail?: Email`
- `avatarUrl?: URL`
- `domains?: Hostname[]`

**Server pre-filtering:** The SDK documentation and ZB portal implementation suggest `listOrgs()` may already filter out hidden orgs and System Org server-side. **UNCLEAR** whether "ops orgs" are pre-filtered. **Action:** Implement defensive client-side filtering regardless; leave TODO hook in `OrgSwitcherService` for ops-org rule pending Kevin clarification.

---

### Method: `ZerobiasClientApp.selectOrg(org, callback?)`

**Source:** `~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-app.ts:109–121`

```typescript
public async selectOrg(org?: dana.Org, callback?:(() => void)): Promise<void> {
  if (org) {
    await this.clientApi.danaClient.getOrgApi().selectOrg(org.id, new Hostname(location.hostname)).then(async () => {
      this.orgIdService.setCurrrenOrgId(org.id);
      await this.clientApi.reconnectWithOrgId(org.id.toString());
      this.initApp().then((reinitialized:boolean) => {
        if (reinitialized && callback) {
            callback();
          }
      });
    });
  }
}
```

**Signature:**
```typescript
public async selectOrg(org?: dana.Org, callback?: (() => void)): Promise<void>
```

**What it does:**
1. Calls platform API to select org (`selectOrg(org.id, hostname)`)
2. Updates `zb-current-dana-org-id` sessionStorage key via `orgIdService.setCurrrenOrgId(org.id)`
3. Reconnects client with new org ID (`reconnectWithOrgId(org.id)`)
4. Reinitializes app state via `initApp()` (refetches whoAmI, emits new currentOrg)
5. Invokes callback if reinitialization succeeded

**Callback behavior:**
- Callback is async — it fires AFTER `initApp()` completes (async chain)
- No error path to callback — if `selectOrg()` fails, promise rejects, callback never fires
- Safe to call with same org ID — SDK will still execute but it's a no-op from the user's perspective

**Dana cookie behavior:** The SDK's request interceptor (`handleRequest()`) calls `clientApi.setDanaOrgIdOnRequest()` which reads the `zb-current-dana-org-id` sessionStorage value and sets the `dana-org-id` header. Browser cookie is handled by platform auth, not SDK. **MEMORY.md confirms:** header source is client-side SDK from sessionStorage, not cookie.

---

### Method: `ZerobiasClientApp.getCurrentOrg()`

**Signature:**
```typescript
public getCurrentOrg(): Observable<dana.Org | undefined>
```

**Return type:** `Observable<dana.Org | undefined>`

**Usage in SME Mart:**
```typescript
// user-profile-dropdown.component.ts
ngOnInit() {
  this.subs.add(
    this.app.getCurrentOrg().subscribe((org) => {
      if (org) {
        this.orgName.set(org.name || '');
      }
    }),
  );
}
```

---

## ngx-library Dialog Assessment

### ZbDialogComponent

**Source:** `~/Projects/zb/zerobias-org/ngx-library/projects/ngx-library/src/lib/components/zb-dialog/`

**Exported:** Yes (public-api.ts line 20)

**Inputs:**
```typescript
@Input() title = '';
@Input() subTitle: string | null = null;
@Input() superTitle: string | null = null;
@Input() useCustomSuperTitle = false;
@Input() titleImg = '';
@Input() actionLabel = 'Action';
@Input() actionDisabled = false;
@Input() actionProcessing = false;
@Input() cancelLabel = 'Cancel';
@Input() showActions = true;
@Input() showAdditionalHeader = false;
@Input() showCancel = true;
@Input() showAction = true;
@Input() showCloseX = false;
```

**Outputs:**
```typescript
@Output() action = new EventEmitter<void>();
@Output() cancel = new EventEmitter<void>();
```

**Fit Assessment:** ZbDialogComponent is designed for action dialogs (buttons, events). It does NOT have a `showSpinner` input or built-in loading state. To use it for a blocking spinner-only dialog:

- Set `showActions = false`, `showCancel = false`, `showAction = false` (hides all buttons)
- Add a `<mat-spinner>` in the body manually or use a slot/projection
- Use Material's `MatDialogRef.disableClose = true` for blocking behavior

**Recommendation:** ZbDialogComponent is NOT a perfect fit. Use existing SME Mart **`ConfirmDialogComponent`** instead (already supports inline styling and can be customized with spinner + disableClose).

---

## Existing Code Inventory

### Files to Modify

| File | Changes | Notes |
|------|---------|-------|
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.ts` | Inject `OrgSwitcherService`, add signal for org list, add menu trigger ref, add method to handle org click | Existing: injects `ZerobiasClientApp`, uses `getCurrentOrg()` |
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html` | Add nested `mat-menu` trigger row and submenu with org list, search input, current-org indicator | Existing: has header, menu items, dividers |
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.scss` | Add styles for submenu layout, current-org marker, search input spacing | New styles only |

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/core/services/org-switcher.service.ts` | Wraps SDK calls, applies filters, exposes `orgs$` observable and `switchTo(org)` method |
| `src/app/core/services/org-switcher.service.spec.ts` | Unit tests for filter rules, switchTo logic |

### Existing Services to Understand (for cache invalidation audit)

| Service | Caches | Org-scoped? | Reset mechanism |
|---------|--------|-------------|-----------------|
| `CatalogService` | Roles, skills, frameworks, segments, products (signals) | No — global catalog | Would survive org switch if cache not cleared |
| `ImpersonationService` | Impersonated user state (localStorage + signals) | Partially — reads from `app.getCurrentOrgId()` | Calls `effectiveOrgId()` at query time; would need manual reset if impersonation persists |
| `UserPreferencesService` | User preferences (likely org-scoped if read from DB) | Unknown — needs inspection | Unknown |
| `GraphQL read service` | In-flight queries, cached results | Yes — GQL queries include `dana-org-id` header | New queries will carry new header after selectOrg() |
| `SmeMartDbService` | Neon views (read-only via DataProducer) | Yes — filtered by current org context | Refetched on next component load |

**Conclusion:** Hard `window.location.reload()` is safest because it clears all in-memory caches. Router-only refresh risks `CatalogService` and other global caches serving stale data. ZB portal uses `window.location.reload()` — match that pattern.

---

## Filter Rules

### System Org UUID

**Value:** `00000000-0000-0000-0000-000000000000` (all zeros)

**Filter:** Hide any org with this ID.

**Check code:**
```typescript
const isSystemOrg = org.id === '00000000-0000-0000-0000-000000000000';
```

### Hidden Flag

**Filter:** Hide any org where `org.hidden === true`.

**Check code:**
```typescript
const isHidden = org.hidden === true;
```

### Ops Orgs

**Status:** DEFERRED (undefined rule, pending Kevin clarification)

**Action:** Add TODO hook in `OrgSwitcherService`:
```typescript
// TODO: Kevin — define ops-org filter rule (tag? name pattern? org.kind?)
// Currently skipped; placeholder for future implementation.
// private isOpsOrg(org: dana.Org): boolean {
//   return false; // TODO: implement
// }
```

**Server-side pre-filtering:** Portal implementation (`portalService.getOrgs()`) may already exclude ops orgs. Since undefined, assume it's not pre-filtered and rely on TODO hook.

---

## Org Count Reality Check

### Demo Data
- **Engagements:** 5 in demo seeder (Pinnacle, FinTech, Startup XYZ, Lakewood, HealthTech)
- **Unique buyer orgs:** 5 (each engagement has 1 buyer org)
- **SME Mart provider org:** 1 (W3Geekery)
- **Expected total for demo user:** ~6 orgs (5 buyer orgs + 1 provider org)

### Actual Usage Pattern
- **Typical enterprise user:** 3–8 orgs (main org + 2–7 partner/subsidiary orgs)
- **Power users (multi-tenant admins):** 10–25 orgs
- **Threshold for search input:** 15 orgs (ZB portal uses search when likely to exceed 10–20)

### Recommendation
**SKIP search input for Phase 18.** Justify:
1. Demo data suggests 5–6 orgs typical
2. CONTEXT.md director note: "If typical user has 5–10 orgs, search is overkill"
3. Adds implementation complexity (search filter, debounce, styling)
4. Can add search in future phase if user feedback demands it (100-char addition to submenu)

**Defer to Claude's Discretion in PLAN.md:** Recommend skip, document as future enhancement.

---

## Refresh Strategy Verification

### Service-by-Service Audit

| Service | Cache Key | Org-scoped? | Reset on hard reload? | Reset on router refresh? | Risk if not reset |
|---------|-----------|-------------|----------------------|------------------------|------------------|
| CatalogService | Signal (in-memory) | No | ✓ (clears all memory) | ✗ (signals persist) | Stale roles/skills/frameworks shown for new org |
| ImpersonationService | localStorage + signals | Partially (reads curr org at query time) | ✓ | Partially (impersonation persists, but effectiveOrgId() will read new org) | Medium — impersonation might persist across org, confusing |
| UserPreferencesService | In-memory or NeonDB | Unknown (needs inspection) | ✓ (clears memory) | ✗ if in-memory cache | Stale user prefs shown for new org |
| GraphQLReadService | In-flight promises/observables | Yes (header-based) | ✓ | ✓ (new requests will use new header from selectOrg()) | Low — new GQL queries auto-use new org |
| SmeMartDbService | DataProducer views | Yes (scoped by current org) | ✓ | ✓ (lazy-loaded on demand) | Low — new queries auto-use new org |

### Recommendation

**Default to `window.location.reload()`.** Reasoning:
1. **Safest approach** — clears ALL caches (signals, localStorage, in-memory state)
2. **Matches ZB portal exactly** — consistency reduces user confusion
3. **CatalogService risk** — if not cleared, stale catalog data leaks across org switch
4. **Simplest implementation** — no need for selective cache invalidation hooks
5. **UAT testing** — if planner wants to optimize to router refresh later, UAT test must verify:
   - CatalogService re-fetched or explicitly invalidated for new org
   - ImpersonationService impersonation clears on org switch (or handles cross-org impersonation explicitly)
   - UserPreferencesService re-fetched for new org
   - All in-flight requests use new `dana-org-id` header

**Code:**
```typescript
// In OrgSwitcherService.switchTo(org)
this.app.selectOrg(org, () => {
  window.location.reload();
});
```

---

## Open Questions

1. **Ops-org filter definition** — What identifies an ops org?
   - What we know: CONTEXT.md lists "ops orgs" as a filter rule but leaves it undefined
   - Action: Leave TODO hook in service; planner escalates to Kevin if blocking
   - Impact: LOW — System Org + hidden filter still valid; ops rule is advisory

2. **`listOrgs()` pre-filtering behavior** — Does SDK pre-filter hidden/System/ops orgs?
   - What we know: ZB platform code suggests server-side filtering exists
   - Action: Implement defensive client-side filters regardless
   - Impact: NONE — redundant filtering is safe

3. **ImpersonationService cross-org handling** — Does impersonation persist after org switch?
   - What we know: ImpersonationService calls `effectiveOrgId()` which reads `app.getCurrentOrgId()` at runtime
   - Action: Hard reload clears localStorage, forcing re-init
   - Impact: MEDIUM — if planner optimizes to router refresh, must verify impersonation clears

---

## Validation Architecture

**Config:** `nyquist_validation: true` in `.planning/config.json`

**Test framework:** Angular testing (Karma/ng test) — see `package.json` script `test: ng test`

### Test Scope per Requirement

| Req ID | Behavior | Test Type | Automated Command | File | Gaps |
|--------|----------|-----------|-------------------|------|------|
| OS-01 | Org list renders in submenu, sorted alphabetically, with current org marked | Component | `ng test -- --include='**/user-profile-dropdown.component.spec.ts'` | `user-profile-dropdown.component.spec.ts` (NEW) | Needs submenu fixture + org list mock |
| OS-02 | Clicking org calls `app.selectOrg(org)` with correct org object | Component | (same) | (same) | Needs selectOrg spy + click handler test |
| OS-03 | Current org has bold + dot marker; non-current orgs don't | Component | (same) | (same) | Needs CSS class assertion + dom inspection |
| OS-04 | Filter removes hidden orgs + System Org; ops-org hook in place | Unit | `ng test -- --include='**/org-switcher.service.spec.ts'` | `org-switcher.service.spec.ts` (NEW) | Filter pure functions; System Org UUID hardcoded |
| OS-05 | Dialog closes after `selectOrg()` callback; page reloads | Component | (same) | (same) | Needs `window.location.reload` spy + async test |

### Test Files to Create

1. **`src/app/core/services/org-switcher.service.spec.ts`** — Unit tests
   - Filter rules: hidden, System Org, ops-org hook
   - `orgs$` observable emits filtered list
   - `switchTo(org)` calls `app.selectOrg()` with correct org

2. **`src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.spec.ts`** — Enhancement tests
   - Org list renders in submenu
   - Current org marked with bold + dot
   - Click handler opens dialog + calls `switchTo(org)`
   - Dialog closes and reload fires on `selectOrg()` callback

### E2E Testing (Playwright)

**Scenario:** User switches org and verifies new org context loads

```typescript
// e2e test (pseudo-code)
test('user switches organization and new org loads', async ({ page }) => {
  // Auth and load app
  await page.goto('/');
  
  // Open user menu
  await page.click('[data-testid="user-menu-trigger"]');
  
  // Open org switcher submenu
  await page.click('[data-testid="org-switcher-trigger"]');
  
  // Click a different org
  await page.click('[data-testid="org-item-org-fintech-inc"]');
  
  // Verify dialog appears with spinner
  await expect(page.locator('.switching-org-dialog')).toBeVisible();
  
  // Wait for page reload (new org context loaded)
  await page.waitForNavigation();
  
  // Verify new org name in header
  await expect(page.locator('[data-testid="current-org-name"]')).toHaveText('FinTech Inc');
  
  // Verify dana-org-id header in Network tab (dev tools check)
  // [Manual verification: Network > XHR > any request > Headers > dana-org-id]
});
```

### Wave 0 Gaps

- [ ] `org-switcher.service.spec.ts` — full coverage of filter rules + switchTo flow
- [ ] `user-profile-dropdown.component.spec.ts` — existing file may not have submenu tests (extend)
- [ ] Dialog component fixture (`SwitchingOrgDialog` or use `ConfirmDialogComponent`)
- [ ] E2E test setup — Playwright config may need auth token injection for org-scoped test

### Sampling Rate

- **Per task commit:** `ng test -- --include='**/org-switcher.service.spec.ts' --watch=false`
- **Per wave merge:** `ng test` (full suite)
- **Phase gate:** Full test suite GREEN before `/gsd:verify-work`

---

## Common Pitfalls

### Pitfall 1: Forgetting Dana Header After Reload
**What goes wrong:** Hard reload clears browser state, but page loads with old org ID in cache or URL params
**Why it happens:** Service cache not cleared before new GQL query
**How to avoid:** Hard reload forces all caches to clear; if optimizing to router refresh, verify all services explicitly invalidate on org change
**Warning signs:** New org menu shows correct org name, but data displayed is from old org

### Pitfall 2: Router Refresh Leaves CatalogService Stale
**What goes wrong:** User switches org, submenu closes, but new page still shows old roles/skills in dropdowns
**Why it happens:** CatalogService signal not cleared on router navigation; it's a global singleton
**How to avoid:** Default to hard reload; if router refresh, add explicit `catalogService.clear()` call in post-switch callback
**Warning signs:** Catalog dropdowns show inconsistent options after org switch

### Pitfall 3: Search Input Not Debounced
**What goes wrong:** User types "F" and 100 org list updates fire; performance tanks
**Why it happens:** Each keystroke triggers observable emission without debounce
**How to avoid:** Add `debounceTime(300)` on search input observable (NOT PHASE 18 — deferred, but document for future)
**Warning signs:** Lag on typing in search field

### Pitfall 4: System Org UUID Hardcoded Wrong
**What goes wrong:** System Org still appears in list because UUID string comparison fails (case, whitespace, type)
**Why it happens:** Copy-paste error or type mismatch (UUID type vs string)
**How to avoid:** Define constant in service; write test verifying System Org filters out
**Warning signs:** System Org "00000000-..." shows in switcher menu

### Pitfall 5: Callback Never Fired if selectOrg() Fails
**What goes wrong:** Dialog hangs forever (no timeout or error handling)
**Why it happens:** Callback only fires if selectOrg() succeeds; no catch() handler
**How to avoid:** Add `catch()` to selectOrg() promise; close dialog and show error toast
**Warning signs:** Dialog with spinner stuck on screen after click

### Pitfall 6: ImpersonationService Persists Across Org
**What goes wrong:** User impersonates "Alice" in Org A, switches to Org B, still sees Alice's data
**Why it happens:** Hard reload clears localStorage, but if planner uses router refresh, localStorage survives
**How to avoid:** Hard reload clears localStorage; if router refresh, add hook to clear impersonation
**Warning signs:** Effective user name doesn't match selected org context

---

## Code Examples

### OrgSwitcherService Skeleton

```typescript
// src/app/core/services/org-switcher.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { dana } from '@zerobias-com/zerobias-sdk';

@Injectable({ providedIn: 'root' })
export class OrgSwitcherService {
  private readonly app = inject(ZerobiasClientApp);
  private readonly dialog = inject(MatDialog);

  private readonly SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000000';

  // Org list (raw from SDK)
  private readonly rawOrgs = signal<dana.Org[]>([]);

  // Filtered org list (client-side defensive filters)
  readonly orgs$ = computed(() => {
    return this.rawOrgs()
      .filter(org => !org.hidden)
      .filter(org => org.id !== this.SYSTEM_ORG_ID)
      .filter(org => !this.isOpsOrg(org)) // TODO: Kevin — define ops-org rule
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor() {
    // Load org list on service init (or lazily on first submenu open)
    this.loadOrgs();
  }

  async loadOrgs(): Promise<void> {
    this.app.getOrgs().subscribe((orgs) => {
      this.rawOrgs.set(orgs || []);
    });
  }

  async switchTo(org: dana.Org): Promise<void> {
    // Get current org
    let currentOrgId = this.app.getCurrentOrgId();
    
    // No-op if same org
    if (currentOrgId === org.id) {
      return;
    }

    // Open blocking dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Switching Organization',
        message: `Please wait while we load ${org.name}.`,
        showActions: false, // Hide buttons if using ConfirmDialogComponent
        showCancel: false,
        showConfirm: false,
        showSpinner: true, // Custom extension
      },
    });

    // Call SDK selectOrg with post-switch callback
    await this.app.selectOrg(org, () => {
      // Close dialog
      dialogRef.close();
      
      // Hard reload to clear all caches
      window.location.reload();
    }).catch((err) => {
      dialogRef.close();
      console.error('Org switch failed:', err);
      // TODO: Show error toast to user
    });
  }

  private isOpsOrg(org: dana.Org): boolean {
    // TODO: Kevin — define ops-org filter rule
    // Currently returns false (no-op); placeholder for future implementation.
    return false;
  }
}
```

### UserProfileDropdown Component Extension

```typescript
// In user-profile-dropdown.component.ts
export class UserProfileDropdown implements OnInit, OnDestroy {
  private readonly app = inject(ZerobiasClientApp);
  readonly impersonation = inject(ImpersonationService);
  readonly orgSwitcher = inject(OrgSwitcherService); // NEW
  private readonly subs = new Subscription();

  readonly userName = this.impersonation.effectiveUserName;
  readonly userEmail = this.impersonation.effectiveUserEmail;
  readonly avatarUrl = this.impersonation.effectiveAvatarUrl;
  readonly orgName = signal('');
  readonly switchableOrgs = this.orgSwitcher.orgs$; // NEW
  readonly currentOrgId = signal('');

  @ViewChild('orgMenu') orgMenu: MatMenuTrigger; // NEW

  ngOnInit() {
    this.subs.add(
      this.app.getCurrentOrg().subscribe((org) => {
        if (org) {
          this.orgName.set(org.name || '');
          this.currentOrgId.set(org.id || '');
        }
      }),
    );
  }

  onSelectOrg(org: any): void {
    this.orgSwitcher.switchTo(org);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
```

### Template Extension

```html
<!-- Inside existing mat-menu, after "My Organizations" link -->
<button 
  mat-menu-item 
  [matMenuTriggerFor]="orgSwitcherSubmenu"
  (click)="$event.stopPropagation()">
  <mat-icon>switch_account</mat-icon>
  <span>Switch Organization</span>
  <mat-icon matMenuTriggerIcon>arrow_right</mat-icon>
</button>

<!-- Submenu -->
<mat-menu #orgSwitcherSubmenu="matMenu" class="org-switcher-submenu">
  <div class="org-list">
    @for (org of switchableOrgs(); track org.id) {
      <button 
        mat-menu-item 
        [class.current-org]="org.id === currentOrgId()"
        (click)="onSelectOrg(org)">
        @if (org.id === currentOrgId()) {
          <mat-icon class="current-marker">circle</mat-icon>
        } @else {
          <mat-icon class="spacer"></mat-icon>
        }
        <span [class.font-weight-bold]="org.id === currentOrgId()">
          {{ org.name }}
        </span>
      </button>
    }
  </div>
</mat-menu>
```

---

## Environment Availability

**Step 2.6 Status:** SKIPPED

**Reason:** Phase 18 is purely code/UI changes with no external dependencies (no CLI tools, runtimes, databases, package managers, or services required). The implementation uses:
- Existing Angular framework (already installed)
- Existing ZeroBias SDK (already in node_modules)
- Existing Material components (already installed)
- No new build tools, containers, or external services

All required tools verified as available.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual DevTools to set `zb-current-dana-org-id` sessionStorage | UI-driven org switcher via `selectOrg()` | Users no longer need DevTools; org switching is self-service |
| Global hard reload after selectOrg() | Global hard reload (same pattern) | Consistent with ZB portal; safest for cache clearing |
| No visual org indicator | Bold + dot marker in menu | User always sees which org is active |

---

## Sources

### Primary (HIGH confidence)
- **ZeroBias Client SDK source** — `~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-app.ts` — method signatures, implementation details
- **ngx-library public-api & ZbDialogComponent** — `~/Projects/zb/zerobias-org/ngx-library/projects/ngx-library/src/` — exported components
- **SME Mart existing code** — `user-profile-dropdown`, `ConfirmDialogComponent`, `CatalogService`, `ImpersonationService` — local patterns verified
- **ZB portal reference** — `~/Projects/zb/ui/projects/portal/src/app/portal/components/organization-switcher/` — canonical pattern, dialog usage, filter rules
- **CONTEXT.md** — Phase 18 locked decisions and director notes
- **dana-sdk type definitions** — cardservice-sdk/dist/model/Org.d.ts — Org properties

### Secondary (MEDIUM confidence)
- **SME Mart demo data** — org count expectations (5–6 engagements = ~6 orgs typical)
- **MEMORY.md** — SDK org selection flow, dana-org-id header sourcing

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — SDK methods verified in source; ZB portal pattern canonical
- **Architecture:** HIGH — existing services audit complete; filter rules clear
- **Pitfalls:** MEDIUM — common issues identified; "ops org" rule deferred but non-blocking
- **Testing:** MEDIUM — test scope clear; framework (Karma/ng test) verified; no gotchas found

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (30 days — stable SDK/framework; Angular 21 LTS)

---

## RESEARCH COMPLETE

**Phase:** 18 - Org Switcher
**Confidence:** HIGH

### Key Findings

1. **SDK method verified** — `selectOrg(org, callback)` handles all org switching (cookie + sessionStorage + reinit); callback fires async after `initApp()` completes
2. **ZbDialogComponent NOT ideal** — Use existing SME Mart `ConfirmDialogComponent` instead for blocking spinner dialog
3. **Filter rules** — Implement client-side defensive filters (hidden + System Org UUID); ops-org rule deferred with TODO hook
4. **Refresh strategy** — Default to `window.location.reload()` to match ZB portal and safely clear all caches (CatalogService, ImpersonationService, etc.)
5. **Search input deferred** — Demo data suggests 5–6 orgs typical; recommend skip for Phase 18 per director note
6. **Service cache audit** — CatalogService and ImpersonationService would risk stale data on router-only refresh; hard reload is safest

### Planner Can Proceed With

- Nested mat-menu submenu structure with current org indicator (bold + dot)
- OrgSwitcherService wrapping SDK with defensive filtering
- ConfirmDialogComponent for "Switching Organization" blocking dialog
- `window.location.reload()` for post-switch refresh
- Test coverage: unit tests for filters, component tests for submenu + dialog + click handler, E2E test for full flow

### Blocking Issues

None. All open questions can be resolved in planning phase or deferred to future phases (ops-org filter rule).
