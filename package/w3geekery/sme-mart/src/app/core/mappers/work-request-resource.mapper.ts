import type { Engagement, SmeMartResource } from '../models';

/** Map an Engagement to SmeMartResource */
export function engagementToResource(engagement: Engagement): SmeMartResource {
  return {
    id: engagement.id,
    name: engagement.title,
    type: 'sme-mart:engagement',
    ownerId: engagement.buyer_zerobias_user_id,
    created: engagement.created_at,
    updated: engagement.updated_at ?? engagement.created_at,
    description: engagement.description,
    parentId: null,
    deleted: null,
    boundaryId: engagement.zerobias_boundary_id,
    engagementId: engagement.id, // Engagement IS the engagement
    projectId: null,
  };
}

/** Backwards compatibility alias (deprecated) */
export const workRequestToResource = engagementToResource;
