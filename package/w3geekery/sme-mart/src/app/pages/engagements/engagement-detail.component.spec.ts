import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { EngagementDetail } from './engagement-detail.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementContextService } from '../../core/services/engagement-context.service';
import { EngagementHierarchyService } from '../../core/services/engagement-hierarchy.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeEngagementDetailRow } from '../../test-helpers/factories';
import type { EngagementDetailRow } from '../../core/models';

const makeEngagement = (overrides: Partial<EngagementDetailRow> = {}) =>
  makeEngagementDetailRow({ status: 'in_progress', engagement_tag: 'sme-mart.eng.amber-circuit', zerobias_tag_id: 'tag-uuid', ...overrides });

describe('EngagementDetail', () => {
  let component: EngagementDetail;
  let mockWorkRequests: { getEngagement: ReturnType<typeof vi.fn> };
  let mockProviderProfiles: { getProviderByUserId: ReturnType<typeof vi.fn> };
  let mockCtx: {
    setEngagement: ReturnType<typeof vi.fn>;
    setCurrentUserId: ReturnType<typeof vi.fn>;
    setCurrentProviderId: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    refresh$: { subscribe: ReturnType<typeof vi.fn> };
  };
  let mockHierarchy: { buildBreadcrumbs: ReturnType<typeof vi.fn> };
  let mockImpersonation: { effectiveUserId: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockWorkRequests = {
      getEngagement: vi.fn().mockResolvedValue(makeEngagement()),
    };
    mockProviderProfiles = {
      getProviderByUserId: vi.fn().mockResolvedValue(null),
    };
    mockCtx = {
      setEngagement: vi.fn(),
      setCurrentUserId: vi.fn(),
      setCurrentProviderId: vi.fn(),
      clear: vi.fn(),
      refresh$: { subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) },
    };
    mockHierarchy = {
      buildBreadcrumbs: vi.fn().mockResolvedValue([
        { level: 'engagement', label: 'HIPAA Assessment', active: true },
      ]),
    };
    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('u-100'),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [EngagementDetail],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: WorkRequestsService, useValue: mockWorkRequests },
        { provide: ProviderProfilesService, useValue: mockProviderProfiles },
        { provide: EngagementContextService, useValue: mockCtx },
        { provide: EngagementHierarchyService, useValue: mockHierarchy },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: Router, useValue: mockRouter },
        { provide: ZerobiasClientApi, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 'wr-001' } } },
        },
      ],
    });

    const fixture = TestBed.createComponent(EngagementDetail);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have tab definitions', () => {
    expect(component.tabs).toHaveLength(6);
    expect(component.tabs.map(t => t.path)).toEqual([
      'overview', 'documents', 'details', 'tasks', 'timeline', 'notes',
    ]);
  });

  // ---------------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------------

  describe('ngOnInit', () => {
    it('should load engagement and push to context', async () => {
      await component.ngOnInit();
      expect(mockCtx.setEngagement).toHaveBeenCalledWith(makeEngagement());
      expect(component.loading()).toBe(false);
    });

    it('should set current user id in context', async () => {
      await component.ngOnInit();
      expect(mockCtx.setCurrentUserId).toHaveBeenCalledWith('u-100');
    });

    it('should set provider id if user is a provider', async () => {
      mockProviderProfiles.getProviderByUserId.mockResolvedValue({ id: 'prov-001' });
      await component.ngOnInit();
      expect(mockCtx.setCurrentProviderId).toHaveBeenCalledWith('prov-001');
    });

    it('should redirect to /rfps if not found', async () => {
      mockWorkRequests.getEngagement.mockResolvedValue(null);
      await component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps']);
    });

    it('should redirect to RFP route if no engagement_tag', async () => {
      mockWorkRequests.getEngagement.mockResolvedValue(
        makeEngagement({ engagement_tag: null }),
      );
      await component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/rfps', 'wr-001'],
        { replaceUrl: true },
      );
    });

    it('should build breadcrumbs', async () => {
      await component.ngOnInit();
      // Breadcrumbs load async (non-blocking), give it a tick
      await vi.waitFor(() => {
        expect(mockHierarchy.buildBreadcrumbs).toHaveBeenCalled();
      });
    });

    it('should handle errors and stop loading', async () => {
      mockWorkRequests.getEngagement.mockRejectedValue(new Error('fail'));
      await component.ngOnInit();
      expect(component.loading()).toBe(false);
    });

    it('should subscribe to refresh$', async () => {
      await component.ngOnInit();
      expect(mockCtx.refresh$.subscribe).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('should clear context', async () => {
      await component.ngOnInit();
      component.ngOnDestroy();
      expect(mockCtx.clear).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  describe('goBack', () => {
    it('should navigate to /my/engagements', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my/engagements']);
    });
  });

  describe('onBreadcrumbNavigate', () => {
    it('should not navigate for active crumb', () => {
      component.onBreadcrumbNavigate({ level: 'boundary', label: 'Test', active: true } as any);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to my engagements for boundary/project level', () => {
      component.onBreadcrumbNavigate({ level: 'boundary', label: 'Test', active: false } as any);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my/engagements']);
    });

    it('should navigate for project level', () => {
      component.onBreadcrumbNavigate({ level: 'project', label: 'Test', active: false } as any);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my/engagements']);
    });
  });
});
