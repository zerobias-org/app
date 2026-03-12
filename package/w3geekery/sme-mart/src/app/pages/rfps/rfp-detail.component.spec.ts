import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { RfpDetail } from './rfp-detail.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { BidsService } from '../../core/services/bids.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementLifecycleService } from '../../core/services/engagement-lifecycle.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeEngagementDetailRow } from '../../test-helpers/factories';
import type { BidSummaryRow } from '../../core/models';

describe('RfpDetail', () => {
  let component: RfpDetail;
  let mockWorkRequests: {
    getEngagement: ReturnType<typeof vi.fn>;
    updateRfp: ReturnType<typeof vi.fn>;
    cancelEngagement: ReturnType<typeof vi.fn>;
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

  beforeEach(() => {
    mockWorkRequests = {
      getEngagement: vi.fn().mockResolvedValue(makeEngagementDetailRow()),
      updateRfp: vi.fn().mockResolvedValue(makeEngagementDetailRow({ status: 'open' })),
      cancelEngagement: vi.fn().mockResolvedValue(makeEngagementDetailRow({ status: 'cancelled' })),
    };
    mockBids = {
      listBidSummaries: vi.fn().mockResolvedValue([]),
      rejectBid: vi.fn().mockResolvedValue({ id: 'bid-001', status: 'rejected' }),
      withdrawBid: vi.fn().mockResolvedValue({ id: 'bid-001', status: 'withdrawn' }),
    };
    mockProviderProfiles = {
      getProviderByUserId: vi.fn().mockResolvedValue(null),
    };
    mockLifecycle = {
      acceptBid: vi.fn().mockResolvedValue({
        bid: { id: 'bid-001', status: 'accepted' },
        workRequest: makeEngagementDetailRow({ status: 'in_progress' }),
        engagementTag: 'sme-mart.eng.amber-circuit',
      }),
    };
    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('u-100'),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RfpDetail],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: WorkRequestsService, useValue: mockWorkRequests },
        { provide: BidsService, useValue: mockBids },
        { provide: ProviderProfilesService, useValue: mockProviderProfiles },
        { provide: EngagementLifecycleService, useValue: mockLifecycle },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: Router, useValue: mockRouter },
        { provide: ZerobiasClientApi, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: 'wr-001' } } },
        },
      ],
    });

    const fixture = TestBed.createComponent(RfpDetail);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------------

  describe('ngOnInit', () => {
    it('should load engagement and set rfp signal', async () => {
      await component.ngOnInit();
      expect(component.rfp()?.id).toBe('wr-001');
      expect(component.loading()).toBe(false);
    });

    it('should redirect to /rfps if not found', async () => {
      mockWorkRequests.getEngagement.mockResolvedValue(null);
      await component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps']);
    });

    it('should redirect to engagement route if has engagement_tag', async () => {
      mockWorkRequests.getEngagement.mockResolvedValue(
        makeEngagementDetailRow({ engagement_tag: 'sme-mart.eng.amber-circuit' }),
      );
      await component.ngOnInit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/engagements', 'wr-001', 'overview'],
        { replaceUrl: true },
      );
    });

    it('should set currentUserId from impersonation', async () => {
      await component.ngOnInit();
      expect(component.currentUserId()).toBe('u-100');
    });

    it('should set currentProviderId if user is a provider', async () => {
      mockProviderProfiles.getProviderByUserId.mockResolvedValue({ id: 'prov-001' });
      await component.ngOnInit();
      expect(component.currentProviderId()).toBe('prov-001');
    });

    it('should handle errors and stop loading', async () => {
      mockWorkRequests.getEngagement.mockRejectedValue(new Error('Network error'));
      await component.ngOnInit();
      expect(component.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Computed signals
  // ---------------------------------------------------------------------------

  describe('computed signals', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('should compute status from rfp', () => {
      expect(component.status()).toBe('open');
    });

    it('should compute isOwner when user is buyer', () => {
      expect(component.isOwner()).toBe(true);
    });

    it('should compute isOwner as false for different user', () => {
      mockImpersonation.effectiveUserId.mockReturnValue('u-999');
      component.currentUserId.set('u-999');
      expect(component.isOwner()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // parsedBids
  // ---------------------------------------------------------------------------

  describe('parsedBids', () => {
    it('should map bid summaries when available', async () => {
      mockBids.listBidSummaries.mockResolvedValue([
        { id: 'bid-001', provider_id: 'u-300', status: 'pending', total_responses: 5, met_count: 3, partial_count: 1, not_met_count: 1, na_count: 0, planned_count: 0 },
      ] as BidSummaryRow[]);
      await component.ngOnInit();
      expect(component.parsedBids()).toHaveLength(1);
      expect(component.parsedBids()[0].id).toBe('bid-001');
    });

    it('should fall back to embedded bids when no summaries', async () => {
      const bidsJson = JSON.stringify([{ id: 'bid-002', provider_id: 'u-400', status: 'pending' }]);
      mockWorkRequests.getEngagement.mockResolvedValue(makeEngagementDetailRow({ bids: bidsJson as any }));
      await component.ngOnInit();
      expect(component.parsedBids()).toHaveLength(1);
    });

    it('should return empty for no bids', async () => {
      await component.ngOnInit();
      expect(component.parsedBids()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  describe('acceptBid', () => {
    it('should call lifecycle.acceptBid and navigate', async () => {
      await component.ngOnInit();
      await component.acceptBid('bid-001');
      expect(mockLifecycle.acceptBid).toHaveBeenCalledWith('bid-001', 'wr-001');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/engagements', 'wr-001', 'overview']);
    });

    it('should skip if no rfp loaded', async () => {
      await component.acceptBid('bid-001');
      expect(mockLifecycle.acceptBid).not.toHaveBeenCalled();
    });
  });

  describe('rejectBid', () => {
    it('should call bids.rejectBid', async () => {
      await component.ngOnInit();
      await component.rejectBid('bid-001');
      expect(mockBids.rejectBid).toHaveBeenCalledWith('bid-001');
    });
  });

  describe('withdrawBid', () => {
    it('should call bids.withdrawBid', async () => {
      await component.ngOnInit();
      await component.withdrawBid('bid-001');
      expect(mockBids.withdrawBid).toHaveBeenCalledWith('bid-001');
    });
  });

  describe('publishRfp', () => {
    it('should update status to open', async () => {
      await component.ngOnInit();
      await component.publishRfp();
      expect(mockWorkRequests.updateRfp).toHaveBeenCalledWith('wr-001', { status: 'open' });
    });
  });

  describe('closeRfp', () => {
    it('should cancel the engagement', async () => {
      await component.ngOnInit();
      await component.closeRfp();
      expect(mockWorkRequests.cancelEngagement).toHaveBeenCalledWith('wr-001');
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  describe('navigation', () => {
    beforeEach(async () => {
      await component.ngOnInit();
    });

    it('startBidWizard should navigate to bid wizard', () => {
      component.startBidWizard();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps', 'wr-001', 'bid']);
    });

    it('navigateToComparison should navigate to compare page', () => {
      component.navigateToComparison();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps', 'wr-001', 'compare']);
    });

    it('editRfp should navigate to edit page', () => {
      component.editRfp();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps', 'wr-001', 'edit']);
    });

    it('goBack should navigate to /rfps', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps']);
    });
  });
});
