import { TestBed } from '@angular/core/testing';
import { runInInjectionContext, Injector } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { onboardingGuard } from './onboarding.guard';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';
import { ProjectContextService } from '../services/project-context.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('onboardingGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let app: any;
  let clientApi: any;
  let bootstrapService: { ensureDefaultEngagement: ReturnType<typeof vi.fn> };
  let profileService: { getCompletionStatus: ReturnType<typeof vi.fn> };
  let projectContext: { setIsAdmin: ReturnType<typeof vi.fn> };
  let getRequestOrgMemberMock: ReturnType<typeof vi.fn>;
  let injector: Injector;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  const mockWhoAmI = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    // Create mocks
    router = { createUrlTree: vi.fn() };
    bootstrapService = { ensureDefaultEngagement: vi.fn() };
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
          listMyOrgs: vi.fn(),
        }),
        getOrgApi: vi.fn().mockReturnValue({
          getRequestOrgMember: getRequestOrgMemberMock,
        }),
      },
    };

    // Setup default router behavior
    router.createUrlTree.mockImplementation((path: string | any[]) => {
      const pathStr = Array.isArray(path) ? path.join('/') : path;
      return { toString: () => pathStr };
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ZerobiasClientApp, useValue: app },
        { provide: ZerobiasClientApi, useValue: clientApi },
        { provide: OnboardingBootstrapService, useValue: bootstrapService },
        { provide: MarketplaceProfileService, useValue: profileService },
        { provide: ProjectContextService, useValue: projectContext },
      ],
    });

    injector = TestBed.inject(Injector);
  });

  it('Test 1: Valid session → routes based on completion status', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue('org-456');
    clientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValue([
      { id: 'org-456', partyId: 'party-789', name: 'Test Org' },
    ]);
    bootstrapService.ensureDefaultEngagement.mockResolvedValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: true,
    });
    profileService.getCompletionStatus.mockResolvedValue(false); // Incomplete

    const result = await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(bootstrapService.ensureDefaultEngagement).toHaveBeenCalledWith('org-456', 'user-123', 'party-789');
    expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/company-profile']);
    expect(result.toString()).toContain('/onboarding/company-profile');
  });

  it('Test 2: Complete profile → routes to /projects', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue('org-456');
    clientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValue([
      { id: 'org-456', partyId: 'party-789', name: 'Test Org' },
    ]);
    bootstrapService.ensureDefaultEngagement.mockResolvedValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: false,
    });
    profileService.getCompletionStatus.mockResolvedValue(true); // Complete

    const result = await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/projects']);
    expect(result.toString()).toContain('/projects');
  });

  it('Test 3: Bootstrap fails → routes to /onboarding/bootstrap with error param', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue('org-456');
    clientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValue([
      { id: 'org-456', partyId: 'party-789', name: 'Test Org' },
    ]);
    bootstrapService.ensureDefaultEngagement.mockRejectedValue(new Error('Bootstrap failed'));

    const result = await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/bootstrap'], {
      queryParams: { error: 'bootstrap-failed' },
    });
    expect(result.toString()).toContain('/onboarding/bootstrap');
  });

  it('Test 4: Invalid session (whoAmI fails) → redirects to /login', async () => {
    app.whoAmI.mockRejectedValue(new Error('Unauthorized'));

    const result = await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  it('Test 5: whoAmI returns null → redirects to /login', async () => {
    app.whoAmI.mockResolvedValue(null);

    const result = await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  it('Test 6: No orgId → redirects to /login', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue(null);

    const result = await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result.toString()).toContain('/login');
  });

  it('Test 7: Completion status check error → routes to /onboarding/bootstrap', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue('org-456');
    clientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValue([
      { id: 'org-456', partyId: 'party-789', name: 'Test Org' },
    ]);
    bootstrapService.ensureDefaultEngagement.mockResolvedValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: true,
    });
    profileService.getCompletionStatus.mockRejectedValue(new Error('GQL query failed'));

    await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/onboarding/bootstrap'], {
      queryParams: { error: 'bootstrap-failed' },
    });
  });

  it('Test 8: Observable return from getCompletionStatus (true) → routes to /projects', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue('org-456');
    clientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValue([
      { id: 'org-456', partyId: 'party-789', name: 'Test Org' },
    ]);
    bootstrapService.ensureDefaultEngagement.mockResolvedValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: false,
    });
    profileService.getCompletionStatus.mockReturnValue(of(true)); // Observable<true>

    const result = await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/projects']);
    expect(result.toString()).toContain('/projects');
  });

  it('Test 9: Bootstrap call with correct params', async () => {
    app.whoAmI.mockResolvedValue(mockWhoAmI);
    app.getCurrentOrgId.mockReturnValue('org-456');
    clientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValue([
      { id: 'org-456', partyId: 'party-789', name: 'Test Org' },
    ]);
    bootstrapService.ensureDefaultEngagement.mockResolvedValue({
      engagementId: 'eng-123',
      projectId: 'proj-123',
      created: true,
    });
    profileService.getCompletionStatus.mockResolvedValue(false);

    await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

    expect(bootstrapService.ensureDefaultEngagement).toHaveBeenCalledWith(
      'org-456',
      'user-123',
      'party-789',
    );
  });

  describe('admin branch (AR-02)', () => {
    beforeEach(() => {
      app.whoAmI.mockResolvedValue(mockWhoAmI);
      app.getCurrentOrgId.mockReturnValue('org-456');
      clientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValue([
        { id: 'org-456', partyId: 'party-789', name: 'Test Org' },
      ]);
    });

    it('Test 10: admin user → routes to /admin', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: true });

      const result = await runInInjectionContext(injector, () =>
        onboardingGuard(mockRoute, mockState),
      );

      expect(getRequestOrgMemberMock).toHaveBeenCalledWith('user-123');
      expect(router.createUrlTree).toHaveBeenCalledWith(['/admin']);
      expect(result.toString()).toContain('/admin');
    });

    it('Test 11: admin path does NOT invoke getCompletionStatus or bootstrap', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: true });

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(profileService.getCompletionStatus).not.toHaveBeenCalled();
      expect(bootstrapService.ensureDefaultEngagement).not.toHaveBeenCalled();
    });

    it('Test 12: projectContext.setIsAdmin(true) is called for admin users', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: true });

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(projectContext.setIsAdmin).toHaveBeenCalledWith(true);
    });

    it('Test 13: projectContext.setIsAdmin(false) is called for non-admin users', async () => {
      getRequestOrgMemberMock.mockResolvedValue({ admin: false });
      bootstrapService.ensureDefaultEngagement.mockResolvedValue({
        engagementId: 'eng-123',
        projectId: 'proj-123',
        created: false,
      });
      profileService.getCompletionStatus.mockResolvedValue(true);

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(projectContext.setIsAdmin).toHaveBeenCalledWith(false);
    });

    it('Test 14: admin probe failure → defaults to non-admin and continues normal flow', async () => {
      getRequestOrgMemberMock.mockRejectedValue(new Error('SDK call failed'));
      bootstrapService.ensureDefaultEngagement.mockResolvedValue({
        engagementId: 'eng-123',
        projectId: 'proj-123',
        created: false,
      });
      profileService.getCompletionStatus.mockResolvedValue(true);

      await runInInjectionContext(injector, () => onboardingGuard(mockRoute, mockState));

      expect(projectContext.setIsAdmin).toHaveBeenCalledWith(false);
      expect(bootstrapService.ensureDefaultEngagement).toHaveBeenCalled();
      expect(router.createUrlTree).toHaveBeenCalledWith(['/projects']);
    });
  });
});
