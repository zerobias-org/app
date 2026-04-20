/**
 * Unit Tests for EngagementContextService
 *
 * Tests computed signals, bid parsing, state management, and refresh mechanism.
 */

import { TestBed } from '@angular/core/testing';
import { EngagementContextService } from './engagement-context.service';
import { describe, it, expect, beforeEach } from 'vitest';
import type { EngagementDetailRow } from '../models';

function makeEngagement(overrides: Partial<EngagementDetailRow> = {}): EngagementDetailRow {
  return {
    id: 'eng-001',
    buyer_user_id: null,
    buyer_zerobias_user_id: 'user-buyer',
    buyer_zerobias_org_id: 'org-buyer',
    title: 'Test Engagement',
    description: null,
    category: '',
    budget_type: null,
    budget_min: null,
    budget_max: null,
    timeline: null,
    status: 'in_progress',
    engagement_tag: 'w3g.sme-mart.eng-001',
    zerobias_tag_id: null,
    zerobias_boundary_id: null,
    zerobias_task_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    buyer_display_name: 'Buyer Corp',
    buyer_email: 'buyer@test.com',
    bids: '[]',
    bid_count: 0,
    ...overrides,
  };
}

describe('EngagementContextService', () => {
  let service: EngagementContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EngagementContextService],
    });
    service = TestBed.inject(EngagementContextService);
  });

  describe('initial state', () => {
    it('should start with null engagement', () => {
      expect(service.engagement()).toBeNull();
    });

    it('should default isRfp to true when no engagement', () => {
      expect(service.isRfp()).toBe(true);
    });

    it('should default status to draft', () => {
      expect(service.status()).toBe('draft');
    });
  });

  describe('setEngagement()', () => {
    it('should set engagement and update computed signals', () => {
      service.setEngagement(makeEngagement());

      expect(service.engagement()).not.toBeNull();
      expect(service.status()).toBe('in_progress');
      expect(service.engagementTag()).toBe('w3g.sme-mart.eng-001');
    });
  });

  describe('isRfp()', () => {
    it('should return false when engagement_tag is set', () => {
      service.setEngagement(makeEngagement({ engagement_tag: 'w3g.eng-001' }));
      expect(service.isRfp()).toBe(false);
    });

    it('should return true when engagement_tag is null', () => {
      service.setEngagement(makeEngagement({ engagement_tag: null }));
      expect(service.isRfp()).toBe(true);
    });

    it('should return true when engagement_tag is empty string', () => {
      service.setEngagement(makeEngagement({ engagement_tag: '' }));
      expect(service.isRfp()).toBe(true);
    });
  });

  describe('isOwner()', () => {
    it('should return true when currentUserId matches buyer', () => {
      service.setEngagement(makeEngagement({ buyer_zerobias_user_id: 'user-123' }));
      service.setCurrentUserId('user-123');

      expect(service.isOwner()).toBe(true);
    });

    it('should return false when currentUserId differs from buyer', () => {
      service.setEngagement(makeEngagement({ buyer_zerobias_user_id: 'user-123' }));
      service.setCurrentUserId('user-456');

      expect(service.isOwner()).toBe(false);
    });

    it('should return false when currentUserId is null', () => {
      service.setEngagement(makeEngagement());
      service.setCurrentUserId(null);

      expect(service.isOwner()).toBe(false);
    });
  });

  describe('statusColor()', () => {
    it('should return primary for open', () => {
      service.setEngagement(makeEngagement({ status: 'open' }));
      expect(service.statusColor()).toBe('primary');
    });

    it('should return accent for in_progress', () => {
      service.setEngagement(makeEngagement({ status: 'in_progress' }));
      expect(service.statusColor()).toBe('accent');
    });

    it('should return warn for cancelled', () => {
      service.setEngagement(makeEngagement({ status: 'cancelled' }));
      expect(service.statusColor()).toBe('warn');
    });

    it('should return default for draft', () => {
      service.setEngagement(makeEngagement({ status: 'draft' }));
      expect(service.statusColor()).toBe('default');
    });
  });

  describe('parsedBids()', () => {
    it('should parse JSON bids string', () => {
      const bids = [{ id: 'b1', provider_id: 'p1', status: 'pending', created_at: '2026-01-01' }];
      service.setEngagement(makeEngagement({ bids: JSON.stringify(bids) }));

      expect(service.parsedBids()).toHaveLength(1);
      expect(service.parsedBids()[0].id).toBe('b1');
    });

    it('should return empty array for invalid JSON', () => {
      service.setEngagement(makeEngagement({ bids: 'not-json' }));
      expect(service.parsedBids()).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      service.setEngagement(makeEngagement({ bids: '[]' }));
      expect(service.parsedBids()).toEqual([]);
    });

    it('should return empty array when engagement is null', () => {
      expect(service.parsedBids()).toEqual([]);
    });
  });

  describe('hasAlreadyBid()', () => {
    it('should return true when current provider has a bid', () => {
      const bids = [{ id: 'b1', provider_id: 'prov-001', status: 'pending', created_at: '2026-01-01' }];
      service.setEngagement(makeEngagement({ bids: JSON.stringify(bids) }));
      service.setCurrentProviderId('prov-001');

      expect(service.hasAlreadyBid()).toBe(true);
    });

    it('should return false when current provider has no bid', () => {
      const bids = [{ id: 'b1', provider_id: 'prov-other', status: 'pending', created_at: '2026-01-01' }];
      service.setEngagement(makeEngagement({ bids: JSON.stringify(bids) }));
      service.setCurrentProviderId('prov-001');

      expect(service.hasAlreadyBid()).toBe(false);
    });
  });

  describe('acceptedBid()', () => {
    it('should find accepted bid', () => {
      const bids = [
        { id: 'b1', provider_id: 'p1', status: 'pending', created_at: '2026-01-01' },
        { id: 'b2', provider_id: 'p2', status: 'accepted', created_at: '2026-01-02' },
      ];
      service.setEngagement(makeEngagement({ bids: JSON.stringify(bids) }));

      expect(service.acceptedBid()?.id).toBe('b2');
    });

    it('should return null when no accepted bid', () => {
      const bids = [{ id: 'b1', provider_id: 'p1', status: 'pending', created_at: '2026-01-01' }];
      service.setEngagement(makeEngagement({ bids: JSON.stringify(bids) }));

      expect(service.acceptedBid()).toBeNull();
    });
  });

  describe('clear()', () => {
    it('should reset all state', () => {
      service.setEngagement(makeEngagement());
      service.setCurrentUserId('user-123');
      service.setCurrentProviderId('prov-123');

      service.clear();

      expect(service.engagement()).toBeNull();
      expect(service.currentUserId()).toBeNull();
      expect(service.currentProviderId()).toBeNull();
    });
  });

  describe('refresh$', () => {
    it('should emit when requestRefresh is called', () => {
      let emitted = false;
      const sub = service.refresh$.subscribe(() => { emitted = true; });

      service.requestRefresh();

      expect(emitted).toBe(true);
      sub.unsubscribe();
    });
  });
});
