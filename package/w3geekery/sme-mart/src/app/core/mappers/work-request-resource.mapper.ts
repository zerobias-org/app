import type { WorkRequest, SmeMartResource } from '../models';

/** Map a WorkRequest to SmeMartResource */
export function workRequestToResource(wr: WorkRequest): SmeMartResource {
  return {
    id: wr.id,
    name: wr.title,
    type: 'sme-mart:work-request',
    ownerId: wr.buyer_zerobias_user_id,
    created: wr.created_at,
    updated: wr.updated_at ?? wr.created_at,
    description: wr.description,
    parentId: null,
    deleted: null,
    boundaryId: wr.zerobias_boundary_id,
    engagementId: wr.id, // WorkRequest IS the engagement
    projectId: null,
  };
}
