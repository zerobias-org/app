import { reviewToResource } from './review-resource.mapper';
import type { Review } from '../models';

describe('reviewToResource', () => {
  const review: Review = {
    id: 'rev-001',
    provider_id: 'u-300',
    reviewer_zerobias_user_id: 'u-200',
    request_id: 'wr-001',
    rating: 5,
    review_text: 'Excellent work on the SOC 2 readiness assessment.',
    approved: true,
    approved_at: '2026-02-15T10:00:00Z',
    approved_by: 'u-admin',
    created_at: '2026-02-10T09:00:00Z',
    updated_at: '2026-02-10T09:00:00Z',
  };

  it('should map core fields', () => {
    const r = reviewToResource(review);
    expect(r.id).toBe('rev-001');
    expect(r.type).toBe('sme-mart:review');
    expect(r.ownerId).toBe('u-200');
    expect(r.description).toBe('Excellent work on the SOC 2 readiness assessment.');
  });

  it('should map parentId from request_id', () => {
    expect(reviewToResource(review).parentId).toBe('wr-001');
  });

  it('should use provided engagementId', () => {
    const r = reviewToResource(review, 'eng-custom');
    expect(r.engagementId).toBe('eng-custom');
  });

  it('should fallback engagementId to request_id', () => {
    expect(reviewToResource(review).engagementId).toBe('wr-001');
  });
});
