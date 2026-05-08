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
import { PlatformEngagementProvisioner } from '../services/platform-engagement-provisioner.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';
import { ProjectContextService } from '../services/project-context.service';

/**
 * Onboarding guard — read-only CanActivateFn:
 *   1. Session check (redirect unauthenticated users to /login)
 *   2. Admin signal write (DemoVisibility + others read it). Admins navigate freely.
 *   3. Probe whether the org has a provisioned platform engagement (hydra tag).
 *      - Provisioned: check profile completion, route accordingly.
 *      - Not provisioned (or probe failed): route to /onboarding/platform-engagement
 *        holding page. NEVER auto-creates. Provisioning is admin-only and
 *        triggered explicitly from the admin Provisioning tab (or, in future,
 *        the zb/ui governance app — see BACKLOG ZBUI-PROVISIONING-ACTION).
 *
 * No mutations from this guard. Probes only.
 */
export const onboardingGuard: CanActivateFn = async (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const clientApi = inject(ZerobiasClientApi);
  const provisioner = inject(PlatformEngagementProvisioner);
  const profileService = inject(MarketplaceProfileService);
  const projectContext = inject(ProjectContextService);

  // Short-circuit helper: if the navigation already targets `target` (or a
  // child of it), let it through — otherwise the guard loops on its own
  // redirect target. Phase 27 shipped without this; surfaced 2026-05-05 as
  // a 3-SDK-calls/sec hammering with the URL stuck at `/`.
  const alreadyAt = (target: string): boolean =>
    state.url === target || state.url.startsWith(target + '/') || state.url.startsWith(target + '?');

  // Step 1: Session check
  const app = inject(ZerobiasClientApp);
  let whoAmI: { id?: unknown } | void | undefined;

  try {
    whoAmI = await app.whoAmI();
  } catch (err) {
    console.error('[ONBOARDING_GUARD] Session check failed', err);
    return router.createUrlTree(['/login']);
  }

  if (!whoAmI || !whoAmI.id) {
    return router.createUrlTree(['/login']);
  }

  const userId = String(whoAmI.id);
  const orgId = app.getCurrentOrgId() || '';
  if (!orgId) {
    return router.createUrlTree(['/login']);
  }

  // Pull current org's name + slug (needed for hydra tag probe) from listMyOrgs.
  // Slug is preferred over slugify(name) because it's platform-canonical
  // (lowercased nmtoken) — e.g. "Brian Hierholzer Inc." -> slug `brianhierholzer`,
  // not `brian-hierholzer-inc`.
  let orgName = '';
  let orgSlug: string | undefined;
  try {
    const meApi = clientApi.danaClient.getMeApi();
    const orgs = await meApi.listMyOrgs();
    const currentOrg = orgs?.find(o => String(o.id) === orgId) as
      | { name?: unknown; slug?: unknown }
      | undefined;
    if (currentOrg && currentOrg.name) {
      orgName = String(currentOrg.name);
    }
    if (currentOrg && currentOrg.slug) {
      orgSlug = String(currentOrg.slug);
    }
  } catch (err) {
    console.warn('[ONBOARDING_GUARD] Failed to read org name/slug from listMyOrgs:', err);
  }

  // Step 2: Admin signal — read-only, populates ProjectContextService for
  // downstream consumers (DemoVisibility, etc.). Failure defaults to false.
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
    return true;
  }

  // Step 3: Authoritative provisioning probe — hydra marketplace tag.
  // Decoupled from AuditgraphDB; if the tag exists, the org is provisioned.
  const isProvisioned = await provisioner.isOrgProvisioned(orgId, orgName, orgSlug);

  if (!isProvisioned) {
    // Either genuinely fresh or probe failed — both states route to holding
    // page. User waits for a ZB admin to provision via the admin tab.
    return alreadyAt('/onboarding/platform-engagement')
      ? true
      : router.createUrlTree(['/onboarding/platform-engagement']);
  }

  // Step 4: Profile completion routes us within the provisioned app.
  let completionStatus: boolean;
  try {
    const result = profileService.getCompletionStatus(orgId);
    completionStatus = result instanceof Promise
      ? await result
      : await firstValueFrom(result as Observable<boolean>);
  } catch (err) {
    console.error('[ONBOARDING_GUARD] Profile completion check failed', err);
    // Treat as incomplete — send to company-profile to retry. Better than
    // black-holing the user back to the holding page (their org IS provisioned).
    return alreadyAt('/onboarding/company-profile')
      ? true
      : router.createUrlTree(['/onboarding/company-profile']);
  }

  if (!completionStatus) {
    return alreadyAt('/onboarding/company-profile')
      ? true
      : router.createUrlTree(['/onboarding/company-profile']);
  }

  return true;
};
