import type { Bid, SmeMartResource } from '../models';

/** Map a Bid to SmeMartResource */
export function bidToResource(bid: Bid, engagementId?: string): SmeMartResource {
  return {
    id: bid.id,
    name: `Bid ${bid.id.slice(0, 8)}`,
    type: 'sme-mart:bid',
    ownerId: bid.provider_id ?? '',
    created: bid.created_at,
    updated: bid.updated_at ?? bid.created_at,
    description: bid.cover_letter,
    parentId: bid.request_id,
    deleted: null,
    boundaryId: null,
    engagementId: engagementId ?? bid.request_id,
    projectId: null,
  };
}
