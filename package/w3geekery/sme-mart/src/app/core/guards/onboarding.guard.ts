import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  CanActivateFn,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';

/**
 * Onboarding guard — functional CanActivateFn that orchestrates:
 * 1. Session check (redirect unauthenticated users to /login)
 * 2. Admin branch (isAdmin=true → /admin)
 * 3. Bootstrap call (ensure default engagement exists)
 * 4. Completion status check (MarketplaceProfileService.getCompletionStatus)
 * 5. Routing decision (incomplete → /onboarding/company-profile, complete → /projects)
 *
 * Per Phase 27 CONTEXT.md and AR-02/04/05/09 requirements.
 */
export const onboardingGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const clientApi = inject(ZerobiasClientApi);
  const bootstrap = inject(OnboardingBootstrapService);
  const profileService = inject(MarketplaceProfileService);

  // Step 1: Check session validity
  // Get current user from whoAmI; org is available via getCurrentOrgId()
  let userId: string;
  let whoAmI: any;
  const app = inject(ZerobiasClientApp);

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

  userId = String(whoAmI.id);

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
    const currentOrg = orgs?.find(o => String(o.id) === orgId);
    if (currentOrg && (currentOrg as any).partyId) {
      partyId = String((currentOrg as any).partyId);
    }
  } catch (err) {
    console.warn('[ONBOARDING_GUARD] Failed to get partyId:', err);
    // Continue anyway - bootstrap will handle this
  }

  // Step 2: Admin branch (AR-02 — admin role detection)
  // Note: Admin detection will be enhanced once getPrincipal() API is available
  // For now, all users proceed to bootstrap and profile flow
  // TODO: Implement proper admin detection via getPrincipal().isAdmin when SDK supports it

  // Step 3: Ensure default engagement exists (calls OnboardingBootstrapService)
  try {
    const { engagementId, created } = await bootstrap.ensureDefaultEngagement(
      orgId,
      userId,
      partyId,
    );

    // Step 4: Check profile completion status (AR-05)
    // MarketplaceProfileService.getCompletionStatus returns Promise<boolean>
    let completionStatus: boolean;

    const result = profileService.getCompletionStatus(orgId);

    // Handle both Promise and Observable return types
    if (result instanceof Promise) {
      completionStatus = await result;
    } else {
      // Observable path (fallback in case signature changes)
      completionStatus = await firstValueFrom(result as any);
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
    return router.createUrlTree(['/onboarding/bootstrap'], {
      queryParams: { error: 'bootstrap-failed' },
    });
  }
};
