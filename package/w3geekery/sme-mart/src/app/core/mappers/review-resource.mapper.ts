import type { Review, SmeMartResource } from '../models';

/** Map a Review to SmeMartResource */
export function reviewToResource(review: Review, engagementId?: string): SmeMartResource {
  return {
    id: review.id,
    name: `Review ${review.id.slice(0, 8)}`,
    type: 'sme-mart:review',
    ownerId: review.reviewer_zerobias_user_id,
    created: review.created_at,
    updated: review.updated_at ?? review.created_at,
    description: review.review_text,
    parentId: review.request_id,
    deleted: null,
    boundaryId: null,
    engagementId: engagementId ?? review.request_id,
    projectId: null,
  };
}
