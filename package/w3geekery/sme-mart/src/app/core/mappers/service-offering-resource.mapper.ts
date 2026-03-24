import type { ServiceOffering, SmeMartResource } from '../models';

/** Map a ServiceOffering to SmeMartResource */
export function serviceOfferingToResource(offering: ServiceOffering): SmeMartResource {
  return {
    id: offering.id,
    name: offering.title,
    type: 'sme-mart:service-offering',
    ownerId: offering.provider_id ?? '',
    created: offering.created_at,
    updated: offering.updated_at ?? offering.created_at,
    description: offering.description,
    parentId: null,
    deleted: offering.is_active ? null : offering.created_at,
    boundaryId: null,
    engagementId: null,
    projectId: null,
  };
}
