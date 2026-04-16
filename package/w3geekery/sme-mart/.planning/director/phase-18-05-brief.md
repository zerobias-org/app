# Plan 18-05 — Org Switcher: Lazy Load + Retry on Submenu Open

**Phase:** 18 — Org Switcher
**Type:** gap_closure (errata 016)
**Est:** 30–45 min, 2 tasks
**Origin:** 2026-04-16 UAT screenshot — submenu renders empty while user impersonates. No ImpersonationService coupling intended; org switcher should just be resilient to boot-time session edge cases.

## Goal

Make `OrgSwitcherService` load orgs on first submenu open (lazy), retry on each open if previous load failed or returned empty. Drop the constructor eager-load. Ignores impersonation state entirely — always calls `clientApi.danaClient.getMeApi().listMyOrgs()` which uses real API-key auth.

## Root cause hypothesis

Clark's impersonation flow calls `reloadCurrentRoute()` which triggers a full `window.location.reload()`. On the post-reload boot, `OrgSwitcherService` constructor fires and calls `loadOrgs()` before SDK auth / dana-org-id cookie is fully warm. `listMyOrgs()` either throws 401 or returns `[]`; error is caught and logged; `rawOrgs` stays empty forever (constructor only fires once per service lifetime in `providedIn: 'root'`). No retry mechanism exists.

Not actually an impersonation bug — same class of failure would happen on any boot-timing race. Impersonation reload just made it deterministic to reproduce.

## Fix

### Task 1 — Convert eager constructor load to lazy-on-open with auto-retry

In `src/app/core/services/org-switcher.service.ts`:

1. **Remove `this.loadOrgs()` from constructor.** Empty constructor is fine.
2. **Add a `hasLoaded` signal** (`signal<boolean>(false)`) to track whether a successful load has happened.
3. **Change `loadOrgs()` visibility to public** and make it idempotent:
   ```typescript
   async loadOrgs(): Promise<void> {
     if (this.hasLoaded()) return;
     if (this.loadingUsers?.()) return; // guard against double-fire
     this.loadingOrgs.set(true);
     try {
       const orgs = await this.clientApi.danaClient.getMeApi().listMyOrgs();
       this.rawOrgs.set(orgs || []);
       if ((orgs || []).length > 0) {
         this.hasLoaded.set(true); // only mark loaded if we got something
       }
     } catch (error) {
       console.error('[OrgSwitcherService] Failed to load orgs:', error);
       this.rawOrgs.set([]);
       // do NOT set hasLoaded — allow retry on next submenu open
     } finally {
       this.loadingOrgs.set(false);
     }
   }
   ```
4. **Add `loadingOrgs` signal** for UX feedback (optional spinner in submenu).

### Task 2 — Trigger loadOrgs on submenu open in user-profile-dropdown

In `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.ts`:

1. **Add submenu-open handler.** Use the `matMenuTriggerFor` pattern — listen for menu open event:
   ```typescript
   onOrgSwitcherOpened(): void {
     this.orgSwitcher.loadOrgs(); // idempotent if already loaded
   }
   ```
2. **Wire up in template** on the submenu trigger button — add `(menuOpened)="onOrgSwitcherOpened()"` to the `<mat-menu>` or the trigger button. Material's `MatMenu` exposes a `(opened)` event on the menu panel itself.

### Task 3 — Tests

1. **Service spec update:**
   - Remove existing "constructor calls loadOrgs on construction" test
   - Add: "loadOrgs is idempotent — second call after success is a no-op"
   - Add: "loadOrgs retries after failure — second call after caught error re-attempts listMyOrgs"
   - Add: "loadingOrgs signal flips true during in-flight, false after"

2. **Component spec update:**
   - Add: "opening the org switcher submenu triggers orgSwitcher.loadOrgs()"
   - Add: "repeated opens after successful load do not re-fetch" (verified via spy call count)

3. **E2E:** optional — add a test that exercises the impersonate-then-switch flow if feasible. Not a must-have for close.

## Requirements addressed

- **OS-01**: menu renders populated list (resilient to boot-timing race)
- **OS-05**: UI refresh sufficient to pick up new org context (now includes post-impersonation session edge case)

## Exit criteria

- [ ] Submenu opens with populated list both on fresh app boot AND after impersonation reload (manual UAT)
- [ ] `npm test -- --include='**/org-switcher.service.spec.ts'` green
- [ ] `npm test -- --include='**/user-profile-dropdown.component.spec.ts'` green
- [ ] Console shows `[OrgSwitcherService]` log ONLY on the first load attempt (no retry spam on repeated opens after success)
- [ ] Clark UAT screenshot: populated list while impersonating "Pinnacle Corp (Buyer)"

## Out of scope

- Explicit ImpersonationService coupling — org switcher must NOT know about impersonation state. It uses real API-key auth and calls `listMyOrgs()` directly.
- Server-side fix for whatever 401/empty response caused the initial failure — that's platform-side if it's real; we just retry on the client.
- Preventing the boot-time race entirely — retry-on-open is cheaper and handles arbitrary timing edge cases.

## References

- Errata 014 + 015 (previous Phase 18 hotfix defects)
- `src/app/core/services/impersonation.service.ts` — `reloadCurrentRoute()` mechanics
- Current service: `src/app/core/services/org-switcher.service.ts`
- Current component: `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.{ts,html}`
