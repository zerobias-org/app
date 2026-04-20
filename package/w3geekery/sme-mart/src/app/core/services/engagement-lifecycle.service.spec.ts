import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { EngagementLifecycleService } from './engagement-lifecycle.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { BidsService } from './bids.service';
import { EngagementsService } from '../../core/services/engagements.service';
import { NotificationService } from './notification.service';
import type { Bid, WorkRequest } from '../models';
import { fakeSmeMartTagService, fakeNotificationService } from '../../test-helpers/angular';

describe('EngagementLifecycleService', () => {
  let service: EngagementLifecycleService;
  let mockTagService: ReturnType<typeof fakeSmeMartTagService>;
  let mockBids: { acceptBid: ReturnType<typeof vi.fn> };
  let mockWorkRequests: { graduateToEngagement: ReturnType<typeof vi.fn> };

  const fakeBid: Bid = { id: 'bid-001', status: 'accepted' } as Bid;
  const fakeWr: WorkRequest = { id: 'wr-001', status: 'in_progress' } as WorkRequest;

  beforeEach(() => {
    mockTagService = fakeSmeMartTagService();
    mockBids = {
      acceptBid: vi.fn().mockResolvedValue(fakeBid),
    };
    mockWorkRequests = {
      graduateToEngagement: vi.fn().mockResolvedValue(fakeWr),
    };

    TestBed.configureTestingModule({
      providers: [
        EngagementLifecycleService,
        { provide: SmeMartTagService, useValue: mockTagService },
        { provide: BidsService, useValue: mockBids },
        { provide: EngagementsService, useValue: mockWorkRequests },
        { provide: NotificationService, useValue: fakeNotificationService() },
      ],
    });

    service = TestBed.inject(EngagementLifecycleService);
  });

  // ---------------------------------------------------------------------------
  // Delegation methods
  // ---------------------------------------------------------------------------

  describe('delegation', () => {
    it('should delegate generateEngagementTag', () => {
      expect(service.generateEngagementTag()).toBe('sme-mart.eng.amber-circuit');
    });

    it('should delegate generateUniqueTag', () => {
      expect(service.generateUniqueEngagementTag([])).toBe('sme-mart.eng.blue-wave');
    });

    it('should delegate isRfpPhase', () => {
      expect(service.isRfpPhase('tag')).toBe(true);
    });

    it('should delegate isEngagementPhase', () => {
      expect(service.isEngagementPhase('tag')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // acceptBid
  // ---------------------------------------------------------------------------

  describe('acceptBid', () => {
    it('should create tag then accept bid and graduate in parallel', async () => {
      const result = await service.acceptBid('bid-001', 'wr-001');

      expect(mockTagService.createTag).toHaveBeenCalled();
      expect(mockBids.acceptBid).toHaveBeenCalledWith('bid-001');
      expect(mockWorkRequests.graduateToEngagement).toHaveBeenCalledWith(
        'wr-001',
        'sme-mart.eng.amber-circuit',
        'tag-uuid',
      );
      expect(result.bid).toBe(fakeBid);
      expect(result.workRequest).toBe(fakeWr);
    });

    it('should still accept bid if tag creation fails', async () => {
      mockTagService.createTag.mockRejectedValue(new Error('Tag error'));

      const result = await service.acceptBid('bid-001', 'wr-001');

      expect(mockBids.acceptBid).toHaveBeenCalled();
      expect(mockWorkRequests.graduateToEngagement).toHaveBeenCalledWith(
        'wr-001',
        'sme-mart.eng.amber-circuit',
        undefined,
      );
      expect(result.engagementTag).toBe('sme-mart.eng.amber-circuit');
    });

    it('should pass undefined tag id when tag has no id', async () => {
      mockTagService.createTag.mockResolvedValue({ name: 'sme-mart.eng.amber-circuit' });

      await service.acceptBid('bid-001', 'wr-001');

      expect(mockWorkRequests.graduateToEngagement).toHaveBeenCalledWith(
        'wr-001',
        'sme-mart.eng.amber-circuit',
        undefined,
      );
    });
  });
});
