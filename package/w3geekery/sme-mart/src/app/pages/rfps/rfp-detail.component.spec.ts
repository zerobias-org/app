/**
 * Unit Tests for RfpDetail (Plan 075 — backed by SmeMartProjectService)
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { RfpDetail } from './rfp-detail.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { BidsService } from '../../core/services/bids.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementLifecycleService } from '../../core/services/engagement-lifecycle.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeSmeMartProject } from '../../test-helpers/factories';
import type { BidSummaryRow } from '../../core/models';

describe('RfpDetail (Plan 075)', () => {
  let component: RfpDetail;
  let mockProjects: {
    getProject: ReturnType<typeof vi.fn>;
    publishRfp: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
  };
  let mockBids: {
    listBidSummaries: ReturnType<typeof vi.fn>;
    rejectBid: ReturnType<typeof vi.fn>;
    withdrawBid: ReturnType<typeof vi.fn>;
  };
  let mockProviderProfiles: { getProviderByUserId: ReturnType<typeof vi.fn> };
  let mockLifecycle: { acceptBid: ReturnType<typeof vi.fn> };
  let mockImpersonation: { effectiveUserId: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const defaultProject = makeSmeMartProject({ id: 'proj-001', status: 'published' });

  beforeEach(() => {
    mockProjects = {
      getProject: vi.fn().mockResolvedValue(defaultProject),
      publishRfp: vi.fn().mockResolvedValue({ project: makeSmeMartProject({ status: 'published' }) }),
      updateProject: vi.fn().mockResolvedValue(makeSmeMartProject({ status: 'cancelled' })),
    };
    mockBids = {
      listBidSummaries: vi.fn().mockResolvedValue([]),
      rejectBid: vi.fn().mockResolvedValue({ id: 'bid-001', status: 'rejected' }),
      withdrawBid: vi.fn().mockResolvedValue({ id: 'bid-001', status: 'withdrawn' }),
    };
    mockProviderProfiles = { getProviderByUserId: vi.fn().mockResolvedValue(null) };
    mockLifecycle = {
      acceptBid: vi.fn().mockResolvedValue({
        bid: { id: 'bid-001', status: 'accepted' },
        workRequest: { id: 'eng-001' },
        engagementTag: 'sme-mart.eng.amber-circuit',
      }),
    };
    mockImpersonation = { effectiveUserId: vi.fn().mockReturnValue('u-100') };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RfpDetail],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: SmeMartProjectService, useValue: mockProjects },
        { provide: BidsService, useValue: mockBids },
        { provide: ProviderProfilesService, useValue: mockProviderProfiles },
        { provide: EngagementLifecycleService, useValue: mockLifecycle },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: Router, useValue: mockRouter },
        { provide: ZerobiasClientApi, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'proj-001' } } } },
      ],
    });

    const fixture = TestBed.createComponent(RfpDetail);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load project and set rfp signal', async () => {
      await component.ngOnInit();
      expect(component.rfp()?.id).toBe('proj-001');
      expect(component.loading()).toBe(false);
    });

    it('should redirect to /rfps if not found', async () => {
      mockProjects.getProject.mockResolvedValue(null);
      await component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps']);
    });

    it('should redirect to engagement route if project has engagementId', async () => {
      mockProjects.getProject.mockResolvedValue(
        makeSmeMartProject({ status: 'active', engagementId: 'eng-001' }),
      );
      await component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/engagements', 'eng-001', 'overview'],
        { replaceUrl: true },
      );
    });

    it('should NOT redirect active project without engagementId', async () => {
      mockProjects.getProject.mockResolvedValue(
        makeSmeMartProject({ status: 'active', engagementId: undefined }),
      );
      await component.ngOnInit();
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(
        expect.arrayContaining(['/engagements']),
        expect.anything(),
      );
      expect(component.rfp()).not.toBeNull();
    });

    it('should set currentUserId from impersonation', async () => {
      await component.ngOnInit();
      expect(component.currentUserId()).toBe('u-100');
    });

    it('should handle errors and stop loading', async () => {
      mockProjects.getProject.mockRejectedValue(new Error('Network error'));
      await component.ngOnInit();
      expect(component.loading()).toBe(false);
    });
  });

  describe('computed signals', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should compute status from rfp', () => {
      expect(component.status()).toBe('published');
    });

    it('should compute isOwner when user is set', () => {
      expect(component.isOwner()).toBe(true);
    });
  });

  describe('parsedBids', () => {
    it('should map bid summaries when available', async () => {
      mockBids.listBidSummaries.mockResolvedValue([
        { id: 'bid-001', provider_id: 'u-300', status: 'pending', total_responses: 5, met_count: 3, partial_count: 1, not_met_count: 1, na_count: 0, planned_count: 0 },
      ] as BidSummaryRow[]);
      await component.ngOnInit();
      expect(component.parsedBids()).toHaveLength(1);
      expect(component.parsedBids()[0].id).toBe('bid-001');
    });

    it('should return empty for no bids', async () => {
      await component.ngOnInit();
      expect(component.parsedBids()).toEqual([]);
    });
  });

  describe('actions', () => {
    it('acceptBid should call lifecycle.acceptBid and navigate', async () => {
      await component.ngOnInit();
      await component.acceptBid('bid-001');
      expect(mockLifecycle.acceptBid).toHaveBeenCalledWith('bid-001', 'proj-001');
    });

    it('rejectBid should call bids.rejectBid', async () => {
      await component.ngOnInit();
      await component.rejectBid('bid-001');
      expect(mockBids.rejectBid).toHaveBeenCalledWith('bid-001');
    });

    it('publishRfp should call projects.publishRfp', async () => {
      await component.ngOnInit();
      await component.publishRfp();
      expect(mockProjects.publishRfp).toHaveBeenCalledWith('proj-001');
    });

    it('closeRfp should update project to cancelled', async () => {
      await component.ngOnInit();
      await component.closeRfp();
      expect(mockProjects.updateProject).toHaveBeenCalledWith('proj-001', { status: 'cancelled' });
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('startBidWizard should navigate to bid wizard', () => {
      component.startBidWizard();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps', 'proj-001', 'bid']);
    });

    it('goBack should navigate to /rfps', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps']);
    });
  });
});
