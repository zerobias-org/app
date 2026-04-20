import type { EngagementDocument, SmeMartResource } from '../models';

/** Map an EngagementDocument to SmeMartResource */
export function documentToResource(doc: EngagementDocument): SmeMartResource {
  return {
    id: doc.id,
    name: doc.display_name ?? doc.filename,
    type: 'sme-mart:document',
    ownerId: doc.uploaded_by_zerobias_user_id,
    created: doc.created_at,
    updated: doc.updated_at ?? doc.created_at,
    description: doc.description,
    parentId: doc.zb_task_id ?? null,
    deleted: doc.archived ? doc.updated_at : null,
    boundaryId: null,
    engagementId: doc.engagement_id,
    projectId: null,
  };
}
