import { TestBed } from '@angular/core/testing';
import { runInInjectionContext, Injector } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { ZerobiasClientApi, ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { onboardingGuard } from './onboarding.guard';
import { OnboardingBootstrapService } from '../services/onboarding-bootstrap.service';
import { MarketplaceProfileService } from '../services/marketplace-profile.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('onboardingGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let app: any;
  let clientApi: any;
  let bootstrapService: { ensureDefaultEngagement: ReturnType<typeof vi.fn> };
  let profileService: { getCompletionStatus: ReturnType<typeof vi.fn> };
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

    app = {
      whoAmI: vi.fn(),
      getCurrentOrgId: vi.fn(),
    };

    clientApi = {
      danaClient: {
        getMeApi: vi.fn().mockReturnValue({
          listMyOrgs: vi.fn(),
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
});
