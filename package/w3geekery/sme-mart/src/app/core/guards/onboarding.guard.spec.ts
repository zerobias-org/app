import { TestBed } from '@angular/core/testing';
import { runInInjectionContext, Injector } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { onboardingGuard } from './onboarding.guard';
import { PlatformEngagementProvisioner } from '../services/platform-engagement-provisioner.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';
import { ProjectContextService } from '../services/project-context.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('onboardingGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let app: { whoAmI: ReturnType<typeof vi.fn>; getCurrentOrgId: ReturnType<typeof vi.fn> };
  let clientApi: {
    toUUID: ReturnType<typeof vi.fn>;
    danaClient: {
      getMeApi: () => { listMyOrgs: ReturnType<typeof vi.fn> };
      getOrgApi: () => { getRequestOrgMember: ReturnType<typeof vi.fn> };
    };
  };
  let provisioner: { isOrgProvisioned: ReturnType<typeof vi.fn> };
  let profileService: { getCompletionStatus: ReturnType<typeof vi.fn> };
  let projectContext: { setIsAdmin: ReturnType<typeof vi.fn> };
  let getRequestOrgMemberMock: ReturnType<typeof vi.fn>;
  let injector: Injector;

  const mockRoute = {} as ActivatedRouteSnapshot;
  // url='/' so the guard's alreadyAt(target) helper never short-circuits in
  // these tests — every assertion expects a UrlTree redirect.
  const mockState = { url: '/' } as RouterStateSnapshot;

  const mockWhoAmI = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    router = { createUrlTree: vi.fn() };
    provisioner = { isOrgProvisioned: vi.fn().mockResolvedValue(true) };
    profileService = { getCompletionStatus: vi.fn() };
    projectContext = { setIsAdmin: vi.fn() };

    app = {
      whoAmI: vi.fn(),
      getCurrentOrgId: vi.fn(),
    };

    // Default admin probe: non-admin. Admin tests override the mockResolvedValue.
    getRequestOrgMemberMock = vi.fn().mockResolvedValue({ admin: false });

    clientApi = {
      toUUID: vi.fn((id: string) => id),
      danaClient: {
        getMeApi: vi.fn().mockReturnValue({
          listMyOrgs: vi.fn().mockResolvedValue([
            { id: 'org-456', name: 'Test Org', slug: 'testorg', partyId: 'party-789' },
          ]),
        }),
        getOrgApi: vi.fn().mockReturnValue({
          getRequestOrgMember: getRequestOrgMemberMock,
        }),
      },
    };

    router.createUrlTree.mockImplementation((path: string | unknown[]) => {
      const pathStr = Array.isArray(path) ? path.join('/') : path;
      return { toString: () => pathStr };
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ZerobiasClientApp, useValue: app },
        { provide: ZerobiasClientApi, useValue: clientApi },
        { provide: PlatformEngagementProvisioner, useValue: provisioner },
        { provide: MarketplaceProfileService, useValue: profileService },
        { provide: ProjectContextService, useValue: projectContext },
      ],
    });

    injector = TestBed.inject(Injector);
  });

  // ── Session checks ──

  it('whoAmI fails → redirects to /login', async () => {
    app.whoAmI.mockRejectedValue(new Error('Unauthorized'));

    const result = await runInInjectionContext(injector, () =>
      onboardingGuard(mockRoute, mockState),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  it('whoAmI returns null → redirects to /login', async () => {
    app.whoAmI.mockResolvedValue(null);

    const result = await runInInjectionContext(injector, () =>
      onboardingGuard(mockRoute, mockState),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  it('No orgId → redirects to /login', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue(null);

    const result = await runInInjectionContext(injector, () =>
      onboardingGuard(mockRoute, mockState),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  // ── Admin signal (read-only) ──

  describe('admin signal', () => {
    beforeEach(() => {
      app.whoAmI.mockResolvedValue(mockWhoAmI);
      app.getCurrentOrgId.mockReturnValue('org-456');
    });

    it('admin user → returns true (no force-redirect)', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: true });

      const result = await runInInjectionContext(injector, () =>
        onboardingGuard(mockRoute, mockState),
      );

      expect(getRequestOrgMemberMock).toHaveBeenCalledWith('user-123');
      expect(result).toBe(true);
      expect(router.createUrlTree).not.toHaveBeenCalledWith(['/admin']);
    });

    it('setIsAdmin(true) is called for admin users', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: true });

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(projectContext.setIsAdmin).toHaveBeenCalledWith(true);
    });

    it('setIsAdmin(false) is called for non-admin users', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: false });
      profileService.getCompletionStatus.mockResolvedValue(true);

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(projectContext.setIsAdmin).toHaveBeenCalledWith(false);
    });

    it('admin probe failure → defaults to non-admin and continues normal flow', async () => {
      getRequestOrgMemberMock.mockRejectedValue(new Error('SDK call failed'));
      profileService.getCompletionStatus.mockResolvedValue(true);

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(projectContext.setIsAdmin).toHaveBeenCalledWith(false);
    });

    it('admin path does NOT call provisioner.isOrgProvisioned or completion check', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: true });

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(provisioner.isOrgProvisioned).not.toHaveBeenCalled();
      expect(profileService.getCompletionStatus).not.toHaveBeenCalled();
    });
  });

  // ── Provisioning probe (read-only, never auto-creates) ──

  describe('provisioning probe', () => {
    beforeEach(() => {
      app.whoAmI.mockResolvedValue(mockWhoAmI);
      app.getCurrentOrgId.mockReturnValue('org-456');
    });

    it('non-admin + org NOT provisioned → redirects to /onboarding/platform-engagement', async () => {
      provisioner.isOrgProvisioned.mockResolvedValue(false);

      const result = await runInInjectionContext(injector, () =>
        onboardingGuard(mockRoute, mockState),
      );

      expect(provisioner.isOrgProvisioned).toHaveBeenCalledWith('org-456', 'Test Org', 'testorg');
      expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/platform-engagement']);
      expect(result.toString()).toContain('/onboarding/platform-engagement');
    });

    it('non-admin + probe returns false → completion is NOT checked (no fall-through)', async () => {
      provisioner.isOrgProvisioned.mockResolvedValue(false);

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(profileService.getCompletionStatus).not.toHaveBeenCalled();
    });

    it('non-admin + provisioned + profile complete → returns true (stays where user navigated)', async () => {
      provisioner.isOrgProvisioned.mockResolvedValue(true);
      profileService.getCompletionStatus.mockResolvedValue(true);

      const result = await runInInjectionContext(injector, () =>
        onboardingGuard(mockRoute, mockState),
      );

      expect(result).toBe(true);
    });

    it('non-admin + provisioned + profile incomplete → redirects to /onboarding/company-profile', async () => {
      provisioner.isOrgProvisioned.mockResolvedValue(true);
      profileService.getCompletionStatus.mockResolvedValue(false);

      const result = await runInInjectionContext(injector, () =>
        onboardingGuard(mockRoute, mockState),
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/company-profile']);
      expect(result.toString()).toContain('/onboarding/company-profile');
    });

    it('completion check supports Observable<boolean> return shape', async () => {
      provisioner.isOrgProvisioned.mockResolvedValue(true);
      profileService.getCompletionStatus.mockReturnValue(of(true));

      const result = await runInInjectionContext(injector, () =>
        onboardingGuard(mockRoute, mockState),
      );

      expect(result).toBe(true);
    });

    it('completion check error → redirects to /onboarding/company-profile (not holding page)', async () => {
      provisioner.isOrgProvisioned.mockResolvedValue(true);
      profileService.getCompletionStatus.mockRejectedValue(new Error('GQL boundary down'));

      const result = await runInInjectionContext(injector, () =>
        onboardingGuard(mockRoute, mockState),
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/company-profile']);
      expect(result.toString()).toContain('/onboarding/company-profile');
    });
  });
});
