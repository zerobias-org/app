import { bidToResource } from './bid-resource.mapper';
import type { Bid } from '../models';

describe('bidToResource', () => {
  const bid: Bid = {
    id: 'bid-001',
    request_id: 'wr-001',
    provider_id: 'u-300',
    cover_letter: 'We are well positioned to deliver this engagement.',
    proposed_price: '7500',
    proposed_timeline: '3 weeks',
    status: 'pending',
    created_at: '2026-01-05T10:00:00Z',
    updated_at: '2026-01-06T08:00:00Z',
  };

  it('should map core fields', () => {
    const r = bidToResource(bid);
    expect(r.id).toBe('bid-001');
    expect(r.type).toBe('sme-mart:bid');
    expect(r.ownerId).toBe('u-300');
    expect(r.description).toBe('We are well positioned to deliver this engagement.');
  });

  it('should map parentId from request_id', () => {
    expect(bidToResource(bid).parentId).toBe('wr-001');
  });

  it('should use provided engagementId', () => {
    const r = bidToResource(bid, 'eng-custom');
    expect(r.engagementId).toBe('eng-custom');
  });

  it('should fallback engagementId to request_id', () => {
    expect(bidToResource(bid).engagementId).toBe('wr-001');
  });

  it('should handle null provider_id', () => {
    const noProvider = { ...bid, provider_id: null };
    expect(bidToResource(noProvider).ownerId).toBe('');
  });
});
