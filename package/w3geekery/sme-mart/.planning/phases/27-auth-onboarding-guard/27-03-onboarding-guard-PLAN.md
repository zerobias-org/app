---
phase: 27
plan: 03
type: execute
wave: 2
depends_on: [27-01, 27-02]
files_modified:
  - src/app/core/guards/onboarding.guard.ts
  - src/app/core/guards/onboarding.guard.spec.ts
  - src/app/onboarding/onboarding-bootstrap-shell.component.ts
  - src/app/onboarding/onboarding-bootstrap-shell.component.html
  - src/app/onboarding/onboarding-bootstrap-shell.component.scss
  - src/app/onboarding/onboarding-bootstrap-shell.component.spec.ts
autonomous: false
requirements_addressed: [AR-02, AR-04, AR-05, AR-09]
must_haves:
  truths:
    - Authenticated non-admin user on first login sees loading shell, waits for bootstrap, redirects to company-profile form
    - Authenticated user with completed profile skips loading shell, routes to /projects
    - Admin users skip bootstrap entirely, route to /admin
    - Guard redirects user to /login if session invalid (AR-01 branded login redirect fires)
    - Bootstrap failure shows user-friendly "Onboarding in progress" message, allows dismiss, redirects to /onboarding/bootstrap on retry
  artifacts:
    - path: "src/app/core/guards/onboarding.guard.ts"
      provides: "Functional CanActivateFn that checks session → admin/non-admin branch → bootstrap service call → MarketplaceProfileService completion check → UrlTree redirect"
      min_lines: 80
    - path: "src/app/core/guards/onboarding.guard.spec.ts"
      provides: "Unit tests for guard routing logic (admin/first-time/returning/error paths)"
      min_lines: 120
    - path: "src/app/onboarding/onboarding-bootstrap-shell.component.ts"
      provides: "Loading shell with mat-progress-spinner + Dismiss button, error snackbar integration"
      min_lines: 40
    - path: "src/app/onboarding/onboarding-bootstrap-shell.component.html"
      provides: "Template with spinner, optional error message, dismiss button"
      min_lines: 15
    - path: "src/app/onboarding/onboarding-bootstrap-shell.component.scss"
      provides: "Centered spinner layout with Material theme colors"
      min_lines: 10
  key_links:
    - from: "onboarding.guard.ts"
      to: "OnboardingBootstrapService"
      via: "inject(OnboardingBootstrapService).ensureDefaultEngagement()"
      pattern: "ensureDefaultEngagement\\(currentOrgId"
    - from: "onboarding.guard.ts"
      to: "MarketplaceProfileService"
      via: "inject(MarketplaceProfileService).getCompletionStatus(orgId)"
      pattern: "getCompletionStatus\\(orgId"
    - from: "onboarding.guard.ts"
      to: "Router"
      via: "inject(Router).createUrlTree('/login') or navigateByUrl('/projects')"
      pattern: "createUrlTree|navigateByUrl"
    - from: "onboarding-bootstrap-shell.component.ts"
      to: "MatSnackBar"
      via: "inject(MatSnackBar).open() from OnboardingBootstrapService error"
      pattern: "this\\.snackBar\\.open|MatSnackBar"
---

<objective>
Implement the functional guard that orchestrates session checks, default-engagement bootstrap, and routing decisions for the onboarding flow.

Purpose: Fulfill AR-02 (guard checks admin role), AR-04 (guard has loading surface), AR-05 (guard redirects based on completion status), AR-09 (guard surfaces errors gracefully). Route authenticated users through the lazy-on-load bootstrap, then to their appropriate destination (company-profile form for first-time, /projects for returning, /admin for admins).

Output: Functional `CanActivateFn` that serves as the route guard, plus loading shell component with error handling and user-friendly messaging.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
@.planning/phases/27-auth-onboarding-guard/27-CONTEXT.md — user decisions (locked)
@.planning/phases/27-auth-onboarding-guard/27-RESEARCH.md — routing patterns, guard signature
@.planning/phases/27-auth-onboarding-guard/27-VALIDATION.md — test map, Wave 0 gaps (guard, shell, spec files)
@.planning/director/phase-27-brief.md — AR-02/04/05/09 requirement spec
@.planning/phases/27-auth-onboarding-guard/27-02-bootstrap-service-SUMMARY.md — OnboardingBootstrapService impl + test coverage (DEPENDENCY)
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/docs/MODERNIZATION_GUIDE.md — Angular 21 patterns (inject(), input(), @if, standalone)
@src/app/app.config.ts — provideRouter entry point (where guard attaches)
@src/app/core/services/onboarding-bootstrap.service.ts — from Plan 27-02 (DEPENDENCY — must exist before Plan 27-03 starts)
@src/app/core/services/marketplace-profile.service.ts — READ FIRST to confirm existence and getCompletionStatus signature; if missing, temporary shim documented in task action
@.planning/phases/28-company-profile-form/28-CONTEXT.md — routing destination contract ("user sees company-profile form on first login")
</context>

## Wave 0 Probe — Phase 28 Service Availability

Before starting any task in this plan, run:

```bash
test -f src/app/core/services/marketplace-profile.service.ts && echo "PHASE_28_SHIPPED=true" || echo "PHASE_28_SHIPPED=false"
```

**If PHASE_28_SHIPPED=true:**
- Read the file and confirm the exact `getCompletionStatus` signature.
- Use the service directly per Path A below.

**If PHASE_28_SHIPPED=false:**
- Use the temporary direct-MPI-read shim per Path B below.
- Tag the shim removal as a Phase 28 follow-up: leave a `// TODO: remove shim once Phase 28's MarketplaceProfileService.getCompletionStatus lands` comment alongside the shim code.

<interfaces>
<!-- Key SDK types and service contracts for executor reference -->

From src/app/core/services/onboarding-bootstrap.service.ts (Plan 27-02 output):
```typescript
async ensureDefaultEngagement(
  currentOrgId: string,
  currentUserId: string,
  currentPartyId: string
): Promise<{ engagementId: string; projectId: string; created: boolean }>
```

From Router (Angular built-in):
```typescript
canActivate?: (CanActivateFn | CanActivateChildFn)[];
// Functional signature:
export type CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;

// Return: true (allow), false (deny), UrlTree (redirect to specific route)
```

From ZerobiasAppService (expected signature for session check):
```typescript
async getPrincipal(): Promise<OrgPrincipalWithAdminFlag>;
// OrgPrincipalWithAdminFlag has:
// - id: string (principal/user ID)
// - orgId: string
// - partyId: string
// - isAdmin: boolean (authoritative per project conventions)
```

From MarketplaceProfileService (Phase 28, if exists; otherwise temporary shim):
```typescript
// Path A (if Phase 28 shipped):
getCompletionStatus(orgId: string): Promise<boolean> | Observable<boolean>;
// Returns true/false (not a string; see Phase 28's 28-02 artifact for actual return type)
// 'true' → user completed profile, proceed to /projects
// 'false' → user needs company-profile form, route to /onboarding/company-profile

// Path B (temporary shim if Phase 28 not shipped):
// Direct GQL query reading MarketplaceProfileItem(section='onboarding_complete')
// Returns boolean: true if record exists, false otherwise
```

From MatSnackBar (Material):
```typescript
open(message: string, action?: string, config?: MatSnackBarConfig): MatSnackBarRef;
```

From OnboardingBootstrapService (Plan 27-02):
```typescript
// Error handling pattern (emitted at time of bootstrap failure):
console.warn('[ONBOARDING_GUARD_FAILURE]', { callSiteTag: 'onboarding-guard:bootstrap-failure', error });
this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
// Then re-throws, allowing guard to catch and redirect to /onboarding/bootstrap
```

</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create onboarding.guard.ts functional CanActivateFn</name>
  <files>
    src/app/core/guards/onboarding.guard.ts
  </files>
  <read_first>
    src/app/core/services/onboarding-bootstrap.service.ts — DEPENDENCY from Plan 27-02 (must exist)
    src/app/core/services/marketplace-profile.service.ts — check for getCompletionStatus(orgId) signature; if missing, use temporary shim
    src/app/app.config.ts — provideRouter structure for reference
    .planning/docs/MODERNIZATION_GUIDE.md — inject() pattern, no constructor DI
    27-RESEARCH.md "Routing Decision Tree" section — exact branch logic for admin/first-time/returning paths
  </read_first>
  <action>
Create a functional `onboardingGuard: CanActivateFn` that orchestrates session check → bootstrap → routing decision:

**Step 0: Determine which path to use (A or B)**
- If `marketplace-profile.service.ts` exists and has `getCompletionStatus` method returning a Promise or Observable, use **Path A**.
- If the file does not exist, use **Path B (temporary shim)** with a TODO comment for removal.

**Path A: Use MarketplaceProfileService (Phase 28 shipped)**

```typescript
import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZerobiasAppService } from '../services/zerobias-app.service';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';

export const onboardingGuard = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const zerobias = await ZerobiasAppService.getInstance();
  const bootstrap = inject(OnboardingBootstrapService);
  const profileService = inject(MarketplaceProfileService);

  // Step 1: Check session validity
  let principal;
  try {
    principal = await zerobias.whoAmI();
  } catch (err) {
    // Session invalid → AR-01 branded login redirect fires in app-init
    return router.createUrlTree(['/login']);
  }

  if (!principal) {
    return router.createUrlTree(['/login']);
  }

  // Step 2: Admin branch (AR-02 — admin role detection via isAdmin)
  if (principal.isAdmin) {
    return router.createUrlTree(['/admin']);
  }

  // Step 3: Ensure default engagement exists (calls OnboardingBootstrapService)
  try {
    const { engagementId, created } = await bootstrap.ensureDefaultEngagement(
      principal.orgId,
      principal.id,
      principal.partyId
    );

    // Step 4: Check profile completion status (AR-05)
    // EXECUTOR NOTE: Read the actual signature from marketplace-profile.service.ts
    // If it returns Observable<boolean>, use firstValueFrom() below
    // If it returns Promise<boolean>, use await directly without firstValueFrom
    let completionStatus: boolean;
    
    // Probe the return type by attempting await first (Promise path)
    const result = profileService.getCompletionStatus(principal.orgId);
    if (result instanceof Promise) {
      completionStatus = await result;
    } else {
      // Observable path
      completionStatus = await firstValueFrom(result);
    }

    // Step 5: Route based on completion (AR-05)
    if (!completionStatus) {
      return router.createUrlTree(['/onboarding/company-profile']);
    } else {
      return router.createUrlTree(['/projects']);
    }

    // TODO: per-app ToS gate (v1.5) — DECISIONS.md "Per-App ToS Architecture — Two-Layer"

  } catch (err) {
    // Bootstrap or completion-check failed (AR-09 — graceful error handling)
    // OnboardingBootstrapService already logged + snackbar; guard just redirects
    console.error('[ONBOARDING_GUARD] Bootstrap failed', { error: err });
    return router.createUrlTree(['/onboarding/bootstrap'], { queryParams: { error: 'bootstrap-failed' } });
  }
};
```

**Path B: Temporary direct-MPI shim (Phase 28 not shipped)**

```typescript
import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { ZerobiasAppService } from '../services/zerobias-app.service';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { GraphqlReadService } from '../services/graphql-read.service';

export const onboardingGuard = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const zerobias = await ZerobiasAppService.getInstance();
  const bootstrap = inject(OnboardingBootstrapService);
  const graphqlRead = inject(GraphqlReadService);

  // Step 1: Check session validity
  let principal;
  try {
    principal = await zerobias.whoAmI();
  } catch (err) {
    return router.createUrlTree(['/login']);
  }

  if (!principal) {
    return router.createUrlTree(['/login']);
  }

  // Step 2: Admin branch (AR-02)
  if (principal.isAdmin) {
    return router.createUrlTree(['/admin']);
  }

  // Step 3: Ensure default engagement exists
  try {
    const { engagementId, created } = await bootstrap.ensureDefaultEngagement(
      principal.orgId,
      principal.id,
      principal.partyId
    );

    // Step 4: Check profile completion status via temporary direct-MPI shim
    // TODO: remove shim once Phase 28's MarketplaceProfileService.getCompletionStatus lands
    const mpiRecords = await graphqlRead.query(
      'MarketplaceProfileItem',
      ['id', 'section', 'status'],
      {
        filters: { orgId: `.eq.${principal.orgId}`, section: '.eq.onboarding_complete' },
        pageSize: 1,
      }
    );
    const completionStatus = mpiRecords && mpiRecords.length > 0;

    // Step 5: Route based on completion (AR-05)
    if (!completionStatus) {
      return router.createUrlTree(['/onboarding/company-profile']);
    } else {
      return router.createUrlTree(['/projects']);
    }

    // TODO: per-app ToS gate (v1.5) — DECISIONS.md "Per-App ToS Architecture — Two-Layer"

  } catch (err) {
    // Bootstrap failed (AR-09)
    console.error('[ONBOARDING_GUARD] Bootstrap failed', { error: err });
    return router.createUrlTree(['/onboarding/bootstrap'], { queryParams: { error: 'bootstrap-failed' } });
  }
};
```

**Key design decisions:**
1. **Async function (not Observable)** — matches functional guard signature, uses `await` for ZerobiasAppService.whoAmI() and OnboardingBootstrapService.ensureDefaultEngagement()
2. **Step-by-step branches:** (a) session check, (b) admin detection, (c) bootstrap call, (d) completion status check (Path A or B), (e) final routing
3. **Path A (Phase 28 shipped):** Injects MarketplaceProfileService, calls getCompletionStatus, probes return type (Promise vs Observable)
4. **Path B (Phase 28 not shipped):** Temporary GQL shim reading onboarding_complete marker directly. Marked with TODO for removal.
5. **Per-app ToS gate (v1.5) insertion point** (LOCKED DECISION): Add TODO comment per DECISIONS.md "Per-App ToS Architecture — Two-Layer"
6. **No controller component initialization** — guard ONLY routes; no imperative component creation
7. **Uses `inject()` for all services** (Angular 21 modernization)
8. **Returns Promise<boolean | UrlTree>** (functional guard async signature)
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>
    onboarding.guard.ts created with functional CanActivateFn signature, async session check, admin branch (isAdmin), bootstrap service call, Wave 0 probe-aware completion status check (Path A or B determined at execute time), routing decision tree, and v1.5 ToS placeholder comment. TypeScript compiles. Guard is importable from src/app/core/guards/index.ts or directly from the file.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create onboarding.guard.spec.ts with routing decision tree tests</name>
  <files>
    src/app/core/guards/onboarding.guard.spec.ts
  </files>
  <read_first>
    src/app/core/services/onboarding-bootstrap.service.spec.ts — test patterns for OnboardingBootstrapService mocks (DEPENDENCY from Plan 27-02)
    27-VALIDATION.md "Per-Task Verification Map" row for 27-03 — required test types (routing unit tests, AR-02/04/05/09)
    .planning/docs/MODERNIZATION_GUIDE.md — Angular 21 testing patterns (TestBed, inject)
  </read_first>
  <behavior>
    - Test 1: Admin principal → guard returns UrlTree to /admin (AR-02)
    - Test 2: Non-admin, profile incomplete (Path A, Promise returning false) → guard calls bootstrap, returns UrlTree to /onboarding/company-profile (AR-05)
    - Test 3: Non-admin, profile complete (Path A, Promise returning true) → guard calls bootstrap, returns UrlTree to /projects (AR-05)
    - Test 4: Bootstrap fails (e.g., Step C error) → guard catches error, returns UrlTree to /onboarding/bootstrap?error=bootstrap-failed (AR-09)
    - Test 5: Invalid session (whoAmI rejects) → guard returns UrlTree to /login (AR-01 precondition)
    - Test 6: Path B shim (MarketplaceProfileService unavailable) → direct GQL query reads onboarding_complete, routes accordingly
  </behavior>
  <action>
Create comprehensive unit test suite for the guard with both Path A (Phase 28 shipped) and Path B (Phase 28 not shipped) scenarios:

```typescript
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { onboardingGuard } from './onboarding.guard';
import { ZerobiasAppService } from '../services/zerobias-app.service';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';
import { GraphqlReadService } from '../services/graphql-read.service';

describe('onboardingGuard', () => {
  let router: Router;
  let zerobiasService: jasmine.SpyObj<ZerobiasAppService>;
  let bootstrapService: jasmine.SpyObj<OnboardingBootstrapService>;
  let profileService: jasmine.SpyObj<MarketplaceProfileService>;
  let graphqlRead: jasmine.SpyObj<GraphqlReadService>;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  const mockPrincipal = {
    id: 'user-123',
    orgId: 'org-456',
    partyId: 'party-789',
    isAdmin: false,
  };

  const mockAdminPrincipal = {
    id: 'admin-123',
    orgId: 'org-456',
    partyId: 'party-789',
    isAdmin: true,
  };

  beforeEach(() => {
    const zeroMock = jasmine.createSpyObj('ZerobiasAppService', ['whoAmI']);
    const bootMock = jasmine.createSpyObj('OnboardingBootstrapService', ['ensureDefaultEngagement']);
    const profMock = jasmine.createSpyObj('MarketplaceProfileService', ['getCompletionStatus']);
    const gqlMock = jasmine.createSpyObj('GraphqlReadService', ['query']);

    TestBed.configureTestingModule({
      providers: [
        { provide: ZerobiasAppService, useValue: zeroMock },
        { provide: OnboardingBootstrapService, useValue: bootMock },
        { provide: MarketplaceProfileService, useValue: profMock },
        { provide: GraphqlReadService, useValue: gqlMock },
      ],
    });

    router = TestBed.inject(Router);
    zerobiasService = TestBed.inject(ZerobiasAppService) as jasmine.SpyObj<ZerobiasAppService>;
    bootstrapService = TestBed.inject(OnboardingBootstrapService) as jasmine.SpyObj<OnboardingBootstrapService>;
    profileService = TestBed.inject(MarketplaceProfileService) as jasmine.SpyObj<MarketplaceProfileService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;

    spyOn(router, 'createUrlTree').and.callThrough();
  });

  it('Test 1: Admin principal routes to /admin (AR-02)', async () => {
    zerobiasService.whoAmI.and.resolveValue(mockAdminPrincipal);

    const result = await onboardingGuard(mockRoute, mockState);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin']);
    expect(result.toString()).toContain('/admin');
  });

  it('Test 2: Non-admin, incomplete profile (Promise path) routes to company-profile form (AR-05)', async () => {
    zerobiasService.whoAmI.and.resolveValue(mockPrincipal);
    bootstrapService.ensureDefaultEngagement.and.resolveValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: true,
    });
    profileService.getCompletionStatus.and.resolveValue(false); // Promise<false>

    const result = await onboardingGuard(mockRoute, mockState);

    expect(bootstrapService.ensureDefaultEngagement).toHaveBeenCalledWith('org-456', 'user-123', 'party-789');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/company-profile']);
    expect(result.toString()).toContain('/onboarding/company-profile');
  });

  it('Test 3: Non-admin, complete profile (Promise path) routes to /projects (AR-05)', async () => {
    zerobiasService.whoAmI.and.resolveValue(mockPrincipal);
    bootstrapService.ensureDefaultEngagement.and.resolveValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: false,
    });
    profileService.getCompletionStatus.and.resolveValue(true); // Promise<true>

    const result = await onboardingGuard(mockRoute, mockState);

    expect(bootstrapService.ensureDefaultEngagement).toHaveBeenCalledWith('org-456', 'user-123', 'party-789');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/projects']);
    expect(result.toString()).toContain('/projects');
  });

  it('Test 4: Non-admin, complete profile (Observable path) routes to /projects (AR-05)', async () => {
    zerobiasService.whoAmI.and.resolveValue(mockPrincipal);
    bootstrapService.ensureDefaultEngagement.and.resolveValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: false,
    });
    profileService.getCompletionStatus.and.returnValue(of(true)); // Observable<true>

    const result = await onboardingGuard(mockRoute, mockState);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/projects']);
    expect(result.toString()).toContain('/projects');
  });

  it('Test 5: Bootstrap fails, guard redirects to /onboarding/bootstrap with error param (AR-09)', async () => {
    zerobiasService.whoAmI.and.resolveValue(mockPrincipal);
    bootstrapService.ensureDefaultEngagement.and.rejectWith(new Error('Step C failed: Pipeline.receive error'));

    const result = await onboardingGuard(mockRoute, mockState);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/bootstrap'], { queryParams: { error: 'bootstrap-failed' } });
    expect(result.toString()).toContain('/onboarding/bootstrap');
  });

  it('Test 6: Invalid session (whoAmI rejects) redirects to /login (AR-01)', async () => {
    zerobiasService.whoAmI.and.rejectWith(new Error('Unauthorized'));

    const result = await onboardingGuard(mockRoute, mockState);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  it('Test 7: whoAmI returns null, redirects to /login', async () => {
    zerobiasService.whoAmI.and.resolveValue(null);

    const result = await onboardingGuard(mockRoute, mockState);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  it('Test 8: Path B shim (GQL query for onboarding_complete) — found', async () => {
    // Simulate MarketplaceProfileService not injected; use GraphqlReadService directly
    zerobiasService.whoAmI.and.resolveValue(mockPrincipal);
    bootstrapService.ensureDefaultEngagement.and.resolveValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: false,
    });
    graphqlRead.query.and.resolveValue([{ section: 'onboarding_complete', status: 'active' }]); // Shim: found

    const result = await onboardingGuard(mockRoute, mockState);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/projects']);
    expect(result.toString()).toContain('/projects');
  });

  it('Test 9: Path B shim (GQL query for onboarding_complete) — not found', async () => {
    zerobiasService.whoAmI.and.resolveValue(mockPrincipal);
    bootstrapService.ensureDefaultEngagement.and.resolveValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: false,
    });
    graphqlRead.query.and.resolveValue([]); // Shim: not found

    const result = await onboardingGuard(mockRoute, mockState);

    expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/company-profile']);
    expect(result.toString()).toContain('/onboarding/company-profile');
  });
});
```

**Test coverage:**
- Routing decision tree: admin/non-admin branches (AR-02)
- Bootstrap service integration: called with correct params
- Profile completion status (Path A Promise): routes based on true/false
- Profile completion status (Path A Observable): routes based on firstValueFrom result
- Profile completion status (Path B shim): GQL query reads onboarding_complete marker
- Error handling: bootstrap failure → /onboarding/bootstrap redirect with error query param (AR-09)
- Session validity: invalid/null session → /login (AR-01)

All tests use `await onboardingGuard()` (async guard) and verify `router.createUrlTree()` calls.
  </action>
  <verify>
    <automated>npm test -- --include='**/onboarding.guard.spec.ts'</automated>
  </verify>
  <done>
    onboarding.guard.spec.ts created with 9 test cases covering: admin routing, incomplete/complete profile routing (both Promise and Observable paths), bootstrap failure, invalid session, and both Path A and Path B completion status flows. All tests pass. Coverage of AR-02, AR-04, AR-05, AR-09.
  </done>
</task>

<task type="auto">
  <name>Task 3: Create onboarding-bootstrap-shell.component.ts (loading surface with error handling)</name>
  <files>
    src/app/onboarding/onboarding-bootstrap-shell.component.ts
  </files>
  <read_first>
    .planning/docs/MODERNIZATION_GUIDE.md — Angular 21 standalone components, @Input/@Output → input()/output(), inject() for services
    27-RESEARCH.md "Loading Surface (AR-04)" section — mat-progress-spinner, snackbar integration with OnboardingBootstrapService
    27-CONTEXT.md "Loading surface + retry UI (AR-04)" — exact requirements
  </read_first>
  <action>
Create the loading shell component that displays during bootstrap and surfaces errors gracefully (AR-04, AR-09):

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding-bootstrap-shell',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './onboarding-bootstrap-shell.component.html',
  styleUrls: ['./onboarding-bootstrap-shell.component.scss'],
})
export class OnboardingBootstrapShellComponent implements OnInit {
  private router = inject(Router);

  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit() {
    // This component is routed to when AR-04 loading surface is needed.
    // The guard (Task 1) orchestrates the actual bootstrap call.
    // If bootstrap succeeds, the guard routes away automatically.
    // If bootstrap fails, the guard routes here with ?error=bootstrap-failed query param.
    const error = new URLSearchParams(window.location.search).get('error');
    if (error === 'bootstrap-failed') {
      this.isLoading = false;
      this.errorMessage = 'Onboarding setup encountered an issue. Please try again.';
    }
  }

  dismissError() {
    // User clicked dismiss on error; redirect to login to retry
    this.router.navigate(['/login']);
  }
}
```

**Design decisions:**
1. **Standalone component** (Angular 21 default, no NgModule)
2. **OnInit only** — minimal logic. The real work is orchestrated by the guard (Task 1).
3. **Error detection via query param** — guard passes `?error=bootstrap-failed`, component reads and displays message
4. **Dismiss button action** — routes to /login to restart the flow (user can retry)
5. **No direct OnboardingBootstrapService call** — guard owns the bootstrap orchestration; this component is purely a UI surface
6. **Uses Material components** (mat-progress-spinner, mat-button) per ngx-library availability
7. **Uses `inject()` for Router** (Angular 21 modernization)
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>
    onboarding-bootstrap-shell.component.ts created as a standalone component with loading spinner display, error message surfacing (from query param), and dismiss button. TypeScript compiles.
  </done>
</task>

<task type="auto">
  <name>Task 4: Create onboarding-bootstrap-shell.component.html (template)</name>
  <files>
    src/app/onboarding/onboarding-bootstrap-shell.component.html
  </files>
  <action>
Create the template for the loading shell:

```html
<div class="onboarding-shell-container">
  @if (isLoading) {
    <div class="loading-section">
      <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
      <p class="loading-text">Setting up your account...</p>
    </div>
  } @else if (errorMessage) {
    <div class="error-section">
      <p class="error-text">{{ errorMessage }}</p>
      <button mat-raised-button color="primary" (click)="dismissError()">
        Retry
      </button>
    </div>
  }
</div>
```

**Template decisions:**
1. **@if control flow** (Angular 21, no *ngIf)
2. **Centered spinner** with friendly "Setting up your account..." message during loading (AR-04)
3. **Error section** (only shows if errorMessage is set) with user-friendly message and Retry button
4. **Button routes to /login** via dismissError() method
5. **Material button styling** (mat-raised-button, color="primary")
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>
    onboarding-bootstrap-shell.component.html created with @if control flow for loading/error states, mat-progress-spinner, and Retry button.
  </done>
</task>

<task type="auto">
  <name>Task 5: Create onboarding-bootstrap-shell.component.scss (styling)</name>
  <files>
    src/app/onboarding/onboarding-bootstrap-shell.component.scss
  </files>
  <action>
Create the stylesheet for the loading shell component:

```scss
.onboarding-shell-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e9e9e9 100%);
}

.loading-section,
.error-section {
  text-align: center;
  padding: 2rem;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-text {
  font-size: 1.125rem;
  color: #0f0f10;
  margin: 0;
  font-weight: 500;
}

.error-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  padding: 2rem;
}

.error-text {
  font-size: 1rem;
  color: #d8534f; // Material error color
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

button {
  margin-top: 1rem;
}
```

**Styling decisions:**
1. **Full-screen centered layout** (min-height: 100vh, flexbox center)
2. **Subtle gradient background** (Material grey colors: #f5f5f5 → #e9e9e9)
3. **Loading section** — spinner + text, stacked vertically with gap
4. **Error section** — card-style (white bg, rounded corners, subtle shadow) with error message in Material error red (#d8534f) and Retry button
5. **Material theme colors** (text #0f0f10 = Material dark text, error #d8534f = Material red)
6. **Responsive padding/margins** (1.5rem gap, 2rem section padding)
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>
    onboarding-bootstrap-shell.component.scss created with centered flex layout, gradient background, loading spinner styling, and error card styling with Material colors.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 6: Create onboarding-bootstrap-shell.component.spec.ts (component unit tests)</name>
  <files>
    src/app/onboarding/onboarding-bootstrap-shell.component.spec.ts
  </files>
  <behavior>
    - Test 1: Component initializes with isLoading=true (normal path)
    - Test 2: Query param ?error=bootstrap-failed sets errorMessage and isLoading=false
    - Test 3: Dismiss button calls dismissError() and routes to /login
    - Test 4: Template shows spinner during loading, hides on error
    - Test 5: Error message is rendered when errorMessage is set
  </behavior>
  <action>
Create component unit test suite:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { OnboardingBootstrapShellComponent } from './onboarding-bootstrap-shell.component';

describe('OnboardingBootstrapShellComponent', () => {
  let component: OnboardingBootstrapShellComponent;
  let fixture: ComponentFixture<OnboardingBootstrapShellComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [OnboardingBootstrapShellComponent, MatProgressSpinnerModule, MatButtonModule],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(OnboardingBootstrapShellComponent);
    component = fixture.componentInstance;
  });

  it('Test 1: Component initializes with isLoading=true by default', () => {
    fixture.detectChanges();
    expect(component.isLoading).toBe(true);
    expect(component.errorMessage).toBeNull();
  });

  it('Test 2: Query param ?error=bootstrap-failed sets errorMessage and isLoading=false', () => {
    spyOnProperty(window, 'location', 'get').and.returnValue({
      search: '?error=bootstrap-failed',
    } as Location);

    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toContain('encountered an issue');
  });

  it('Test 3: dismissError() calls router.navigate to /login', () => {
    component.dismissError();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('Test 4: Template shows spinner during loading, hides on error', () => {
    component.isLoading = true;
    fixture.detectChanges();

    let spinnerEl = fixture.nativeElement.querySelector('mat-progress-spinner');
    expect(spinnerEl).toBeTruthy();

    component.isLoading = false;
    component.errorMessage = 'Test error';
    fixture.detectChanges();

    spinnerEl = fixture.nativeElement.querySelector('mat-progress-spinner');
    expect(spinnerEl).toBeFalsy();

    const errorEl = fixture.nativeElement.querySelector('.error-text');
    expect(errorEl).toBeTruthy();
  });

  it('Test 5: Error message is rendered when errorMessage is set', () => {
    component.isLoading = false;
    component.errorMessage = 'Custom error message';
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.error-text');
    expect(errorEl.textContent).toContain('Custom error message');
  });
});
```

**Test coverage:**
- Initialization state (isLoading=true by default)
- Query param detection (error=bootstrap-failed)
- Button click handler (dismissError → router.navigate)
- Template rendering based on state (spinner vs error)
- Error message display
  </action>
  <verify>
    <automated>npm test -- --include='**/onboarding-bootstrap-shell.component.spec.ts'</automated>
  </verify>
  <done>
    onboarding-bootstrap-shell.component.spec.ts created with 5 test cases covering initialization, query param detection, dismiss button behavior, and template rendering. All tests pass.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Functional guard (onboarding.guard.ts) with Wave 0 probe determining Phase 28 availability at execute time. Guard orchestrates session check → admin/non-admin branch → bootstrap service → completion status check (Path A if Phase 28 shipped, Path B temporary shim if not) → routing decision. Loading shell component (onboarding-bootstrap-shell) with error handling, full test coverage for guard (9 tests covering both paths) and shell component (5 tests). All source files, templates, styles, and specs created.
  </what-built>
  <how-to-verify>
    1. **Code inspection:** Review `onboarding.guard.ts` for the Wave 0 probe block and two-path decision logic (Path A: MarketplaceProfileService, Path B: temporary GQL shim). Verify `onboarding-bootstrap-shell.component.ts` has no direct bootstrap service call (guard owns that). Verify ToS comment uses lowercase "per-app" with exact casing from DECISIONS.md.
    2. **Test execution:** Run `npm test -- --include='**/onboarding.guard.spec.ts'` — all 9 tests pass (covering Path A Promise, Path A Observable, Path B shim). Run `npm test -- --include='**/onboarding-bootstrap-shell.component.spec.ts'` — all 5 tests pass.
    3. **Type checking:** `npx tsc --noEmit` exits 0 (all TypeScript compiled).
    4. **Manual walk-through (local dev, assuming Phase 28 not shipped):** Start dev server. Simulate a non-admin first-time user login:
       - Verify guard fires (break in `onboarding.guard.ts` line 1 on app load)
       - Watch network tab: bootstrap service calls fire (all 5 steps from 27-02); GQL query fires for `onboarding_complete` (Path B shim)
       - Observe page shows loading spinner ("Setting up your account...")
       - After bootstrap completes, page redirects to /onboarding/company-profile (shim returns false)
    5. **Error simulation:** Temporarily mock `OnboardingBootstrapService.ensureDefaultEngagement()` to reject. Verify guard catches error, routes to /onboarding/bootstrap?error=bootstrap-failed, loading shell displays error message with Retry button.
  </how-to-verify>
  <resume-signal>Type "approved" if code review and test execution pass. Describe any issues if tests fail or logic doesn't match AR-02/04/05/09 requirements, or if Phase 28 service signature differs from Path A assumption.</resume-signal>
</task>

</tasks>

<verification>
AR-02, AR-04, AR-05, AR-09 verification paths:

| Requirement | Evidence |
|---|---|
| AR-02 (Admin detection) | Guard checks `principal.isAdmin` → returns `/admin` UrlTree. Test 1 in guard.spec.ts verifies. Grep: `isAdmin` appears in guard + spec files. |
| AR-04 (Loading surface) | OnboardingBootstrapShellComponent displays mat-progress-spinner + "Setting up your account..." text. Template uses @if control flow. Component + template + styles created. |
| AR-05 (Routing based on completion) | Guard determines completion status via Path A (MarketplaceProfileService) or Path B (temporary GQL shim). Routes to `/onboarding/company-profile` if incomplete, `/projects` if complete. Tests 2, 3, 4, 8, 9 in guard.spec.ts verify all paths. |
| AR-09 (Graceful error handling) | Bootstrap failure → guard catches exception → routes to `/onboarding/bootstrap?error=bootstrap-failed`. Shell component detects error query param → displays error message + Retry button. Test 5 in guard.spec.ts + Test 2 in shell.spec.ts verify. |

Post-merge on UAT, full end-to-end test will cover actual guard firing during Route.canActivate evaluation once routing is wired (Plan 27-04). Phase 28 integration validated when MarketplaceProfileService lands (Path A probe confirms its presence + signature).
</verification>

<success_criteria>
1. onboarding.guard.ts functional CanActivateFn created with Wave 0 probe for Phase 28 service availability, two paths (A: Phase 28 shipped, B: temporary shim), async signature, orchestrates session → bootstrap → routing.
2. Guard routing decision tree verified: admin → /admin, non-admin incomplete → /onboarding/company-profile, complete → /projects, invalid/error → /onboarding/bootstrap.
3. onboarding-bootstrap-shell component created, standalone, displays spinner + error message via query param.
4. Guard and shell component fully unit tested (9 guard tests + 5 shell tests, all green, including both Path A and Path B scenarios).
5. All TypeScript compiles (`npx tsc --noEmit`).
6. Guard is importable and ready for route attachment (Plan 27-04).
7. AR-02/04/05/09 requirements fully implemented.
8. Wave 0 probe and Path A/B decision logic clear in task action and test suite.
</success_criteria>

<output>
After completion, create `.planning/phases/27-auth-onboarding-guard/27-03-onboarding-guard-SUMMARY.md` with:
- Guard decision tree (session check → admin branch → bootstrap → completion status via Path A or B → routing)
- Wave 0 probe result (Phase 28 shipped or temporary shim active)
- Bootstrap service integration (Task 1 orchestrates Task 3 from 27-02)
- Loading shell component (error handling via query param, Dismiss button)
- Test coverage summary (guard: 9 tests including Path A Promise, Path A Observable, Path B shim; shell: 5 tests; all green)
- AR-02/04/05/09 verification evidence
- No open issues
</output>
