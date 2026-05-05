import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivateFn,
} from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';
import { ProjectContextService } from '../services/project-context.service';

/**
 * Onboarding guard — functional CanActivateFn that orchestrates:
 * 1. Session check (redirect unauthenticated users to /login)
 * 2. Admin branch — danaClient.getOrgApi().getRequestOrgMember(userId).admin -> /admin
 * 3. Bootstrap call (ensure default engagement exists)
 * 4. Completion status check (MarketplaceProfileService.getCompletionStatus)
 * 5. Routing decision (incomplete -> /onboarding/company-profile, complete -> /projects)
 *
 * Per Phase 27 CONTEXT.md and AR-02/04/05/09 requirements.
 */
export const onboardingGuard: CanActivateFn = async (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const clientApi = inject(ZerobiasClientApi);
  const bootstrap = inject(OnboardingBootstrapService);
  const profileService = inject(MarketplaceProfileService);
  const projectContext = inject(ProjectContextService);

  // Short-circuit helper: if the navigation already targets `target` (or a
  // child of it), let it through. Without this the guard loops — every
  // redirect re-fires the guard on the destination route and returns the
  // same UrlTree, causing infinite navigation cancellation. Phase 27 shipped
  // without it; surfaced 2026-05-05 by a working dev session showing 3
  // SDK calls/sec with the URL stuck at `/`.
  const alreadyAt = (target: string): boolean =>
    state.url === target || state.url.startsWith(target + '/') || state.url.startsWith(target + '?');

  // Step 1: Check session validity
  // Get current user from whoAmI; org is available via getCurrentOrgId()
  const app = inject(ZerobiasClientApp);
  let whoAmI: { id?: unknown } | void | undefined;

  try {
    // Get whoAmI from the app directly (it returns a Promise)
    whoAmI = await app.whoAmI();
  } catch (err) {
    // Session invalid → AR-01 branded login redirect
    console.error('[ONBOARDING_GUARD] Session check failed', err);
    return router.createUrlTree(['/login']);
  }

  if (!whoAmI || !whoAmI.id) {
    return router.createUrlTree(['/login']);
  }

  const userId = String(whoAmI.id);

  // Get current org context via ZerobiasClientApp method
  const orgId = app.getCurrentOrgId() || '';

  if (!orgId) {
    return router.createUrlTree(['/login']);
  }

  // Get partyId via danaClient
  let partyId = '';
  try {
    const meApi = clientApi.danaClient.getMeApi();
    const orgs = await meApi.listMyOrgs();
    const currentOrg = orgs?.find(o => String(o.id) === orgId) as { partyId?: unknown } | undefined;
    if (currentOrg && currentOrg.partyId) {
      partyId = String(currentOrg.partyId);
    }
  } catch (err) {
    console.warn('[ONBOARDING_GUARD] Failed to get partyId:', err);
    // Continue anyway - bootstrap will handle this
  }

  // Step 2: Admin branch (AR-02) — danaOld.Org.getRequestOrgMember.admin
  // Request-org-scoped via dana-org-id header (set by SDK). orgMemberId == user's principal id.
  let isAdmin = false;
  try {
    const orgMember = await clientApi.danaClient
      .getOrgApi()
      .getRequestOrgMember(clientApi.toUUID(userId));
    isAdmin = !!orgMember.admin;
  } catch (err) {
    console.warn('[ONBOARDING_GUARD] Admin check failed; defaulting to non-admin', err);
  }
  projectContext.setIsAdmin(isAdmin);

  if (isAdmin) {
    return alreadyAt('/admin') ? true : router.createUrlTree(['/admin']);
  }

  // Step 3: Ensure default engagement exists (calls OnboardingBootstrapService)
  try {
    await bootstrap.ensureDefaultEngagement(orgId, userId, partyId);

    // Step 4: Check profile completion status (AR-05)
    // MarketplaceProfileService.getCompletionStatus returns Promise<boolean>
    let completionStatus: boolean;

    const result = profileService.getCompletionStatus(orgId);

    // Handle both Promise and Observable return types
    if (result instanceof Promise) {
      completionStatus = await result;
    } else {
      // Observable path (fallback in case signature changes)
      completionStatus = await firstValueFrom(result as Observable<boolean>);
    }

    // Step 5: Route based on completion (AR-05)
    if (!completionStatus) {
      return alreadyAt('/onboarding/company-profile')
        ? true
        : router.createUrlTree(['/onboarding/company-profile']);
    } else {
      return alreadyAt('/projects') ? true : router.createUrlTree(['/projects']);
    }

    // TODO: per-app ToS gate (v1.5) — DECISIONS.md "Per-App ToS Architecture — Two-Layer"
  } catch (err) {
    // Bootstrap or completion-check failed (AR-09 — graceful error handling)
    // OnboardingBootstrapService already logged + snackbar; guard just redirects
    console.error('[ONBOARDING_GUARD] Bootstrap failed', { error: err });
    return alreadyAt('/onboarding/bootstrap')
      ? true
      : router.createUrlTree(['/onboarding/bootstrap'], {
          queryParams: { error: 'bootstrap-failed' },
        });
  }
};
