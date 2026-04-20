/**
 * Unit Tests for EngagementLifecycleService (Plan 075 — acceptBidAndLink flow)
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { EngagementLifecycleService } from './engagement-lifecycle.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { BidsService } from './bids.service';
import { EngagementsService } from '../../core/services/engagements.service';
import { SmeMartProjectService } from './sme-mart-project.service';
import { NotificationService } from './notification.service';
import { ImpersonationService } from './impersonation.service';
import type { Bid, Engagement, SmeMartProject } from '../models';
import { fakeSmeMartTagService, fakeNotificationService } from '../../test-helpers/angular';
import { makeSmeMartProject } from '../../test-helpers/factories';

describe('EngagementLifecycleService (Plan 075)', () => {
  let service: EngagementLifecycleService;
  let mockTagService: ReturnType<typeof fakeSmeMartTagService>;
  let mockBids: { getBid: ReturnType<typeof vi.fn>; acceptBid: ReturnType<typeof vi.fn> };
  let mockEngagements: { createEngagement: ReturnType<typeof vi.fn> };
  let mockProjects: { getProject: ReturnType<typeof vi.fn>; updateProject: ReturnType<typeof vi.fn>; linkToEngagement: ReturnType<typeof vi.fn> };
  let mockImpersonation: { effectiveUserId: ReturnType<typeof vi.fn>; effectiveOrgId: ReturnType<typeof vi.fn> };

  const fakeBid: Bid = { id: 'bid-001', provider_id: 'prov-001', status: 'accepted' } as Bid;
  const fakeEngagement: Engagement = { id: 'eng-001', status: 'in_progress' } as Engagement;
  const fakeProject = makeSmeMartProject({ id: 'proj-001', name: 'Test RFP', status: 'active' });

  beforeEach(() => {
    mockTagService = fakeSmeMartTagService();
    mockBids = {
      getBid: vi.fn().mockResolvedValue(fakeBid),
      acceptBid: vi.fn().mockResolvedValue(fakeBid),
    };
    mockEngagements = {
      createEngagement: vi.fn().mockResolvedValue(fakeEngagement),
    };
    mockProjects = {
      getProject: vi.fn().mockResolvedValue(makeSmeMartProject({ id: 'proj-001', name: 'Test RFP' })),
      updateProject: vi.fn().mockResolvedValue(fakeProject),
      linkToEngagement: vi.fn().mockResolvedValue(undefined),
    };
    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('user-001'),
      effectiveOrgId: vi.fn().mockReturnValue('org-001'),
    };

    TestBed.configureTestingModule({
      providers: [
        EngagementLifecycleService,
        { provide: SmeMartTagService, useValue: mockTagService },
        { provide: BidsService, useValue: mockBids },
        { provide: EngagementsService, useValue: mockEngagements },
        { provide: SmeMartProjectService, useValue: mockProjects },
        { provide: NotificationService, useValue: fakeNotificationService() },
        { provide: ImpersonationService, useValue: mockImpersonation },
      ],
    });

    service = TestBed.inject(EngagementLifecycleService);
  });

  describe('delegation', () => {
    it('should delegate generateEngagementTag', () => {
      expect(service.generateEngagementTag()).toBe('sme-mart.eng.amber-circuit');
    });

    it('should delegate isRfpPhase', () => {
      expect(service.isRfpPhase('tag')).toBe(true);
    });

    it('should delegate isEngagementPhase', () => {
      expect(service.isEngagementPhase('tag')).toBe(false);
    });
  });

  describe('acceptBidAndLink', () => {
    it('should accept bid, create engagement, link project, and activate', async () => {
      const result = await service.acceptBidAndLink('bid-001', 'proj-001');

      // Tag created
      expect(mockTagService.createTag).toHaveBeenCalled();

      // Bid accepted
      expect(mockBids.acceptBid).toHaveBeenCalledWith('bid-001');

      // Engagement created
      expect(mockEngagements.createEngagement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test RFP',
          engagement_tag: 'sme-mart.eng.amber-circuit',
        }),
      );

      // Project linked to engagement
      expect(mockProjects.linkToEngagement).toHaveBeenCalledWith('proj-001', 'eng-001');

      // Project activated
      expect(mockProjects.updateProject).toHaveBeenCalledWith('proj-001', { status: 'active' });

      expect(result.bid).toBe(fakeBid);
      expect(result.engagement).toBe(fakeEngagement);
      expect(result.engagementTag).toBe('sme-mart.eng.amber-circuit');
    });

    it('should still complete flow if tag creation fails', async () => {
      mockTagService.createTag.mockRejectedValue(new Error('Tag error'));

      const result = await service.acceptBidAndLink('bid-001', 'proj-001');

      expect(mockBids.acceptBid).toHaveBeenCalled();
      expect(mockEngagements.createEngagement).toHaveBeenCalled();
      expect(result.zerobiasTagId).toBeUndefined();
    });
  });

  describe('acceptBid (legacy wrapper)', () => {
    it('should delegate to acceptBidAndLink and return legacy shape', async () => {
      const result = await service.acceptBid('bid-001', 'proj-001');

      expect(result.bid).toBe(fakeBid);
      expect(result.workRequest).toBe(fakeEngagement);
      expect(result.engagementTag).toBe('sme-mart.eng.amber-circuit');
    });
  });
});
