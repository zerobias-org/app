import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { EngagementHierarchyService } from './engagement-hierarchy.service';
import {
  ENGAGEMENT_FIELD_MAPPING,
  BID_FIELD_MAPPING,
  NOTE_FIELD_MAPPING,
  NOTE_FOLDER_FIELD_MAPPING,
  SERVICE_OFFERING_FIELD_MAPPING,
  REVIEW_FIELD_MAPPING,
  DOCUMENT_FIELD_MAPPING,
  mapGqlToNeon,
} from '../field-mappings';
import type { SmeMartClassName } from './pipeline-write.service';
import type {
  SmeMartResource,
  SmeMartResourceType,
  SmeMartResourceTag,
  SmeMartResourceTagRow,
  SmeMartResourceLink,
  SmeMartResourceLinkRow,
  SmeMartLinkType,
} from '../models';
import {
  noteToResource,
  noteFolderToResource,
  workRequestToResource,
  bidToResource,
  reviewToResource,
  serviceOfferingToResource,
  documentToResource,
} from '../mappers';

/**
 * Unified resource operations for all SME Mart entities.
 *
 * - Tags: Neon sme_resource_tags (AuditgraphDB objects are not Hydra resources)
 * - Links: Neon sme_resource_links (same reason — no Hydra resource identity)
 * - Search: GraphQL (entities migrated to AuditgraphDB in Waves 1-4)
 * - Tag search: Delegates to EngagementHierarchyService (already on Hydra)
 *
 * See: Plan 059 Wave 5 (Hydra migration audit)
 */
@Injectable({ providedIn: 'root' })
export class SmeMartResourceService {
  private readonly db = inject(SmeMartDbService);
  private readonly gql = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly hierarchy = inject(EngagementHierarchyService);

  // ── Tag Operations (Neon — AuditgraphDB objects lack Hydra resource identity) ──

  /**
   * Assign ZB platform tags to a resource.
   * Creates rows in sme_resource_tags (Neon).
   * Tag must already exist in ZB platform (created via hydra.Tag.createTag).
   */
  async tagResource(
    resourceId: string,
    resourceType: SmeMartResourceType,
    tags: Array<{ zbTagId: string; zbTagName: string }>,
  ): Promise<void> {
    const userId = this.impersonation.effectiveUserId();
    for (const tag of tags) {
      try {
        await this.db.createRow('sme_resource_tags', {
          resource_id: resourceId,
          resource_type: resourceType,
          zb_tag_id: tag.zbTagId,
          zb_tag_name: tag.zbTagName,
          assigned_by: userId,
        });
      } catch (err: any) {
        // Ignore duplicate key (tag already assigned)
        if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
          continue;
        }
        throw err;
      }
    }
  }

  /** Remove a tag assignment from a resource */
  async untagResource(resourceId: string, zbTagId: string): Promise<void> {
    if (this.db.mode() === 'neon') {
      await this.db.neonQueryPublic(
        `DELETE FROM "sme_resource_tags" WHERE "resource_id" = '${resourceId}' AND "zb_tag_id" = '${zbTagId}'`,
      );
    }
  }

  /** Get all tags assigned to a resource */
  async getTagsForResource(
    resourceId: string,
    resourceType: SmeMartResourceType,
  ): Promise<SmeMartResourceTag[]> {
    const filter = `(&(resource_id=${resourceId})(resource_type=${resourceType}))`;
    const result = await this.db.searchRows<SmeMartResourceTagRow>(
      'sme_resource_tags', filter, { pageNumber: 1, pageSize: 100 },
    );
    return (result.items || []).map(row => this.mapTagRow(row));
  }

  // ── Link Operations (Neon — no Hydra link types for AuditgraphDB objects) ──

  /** Create a typed link between two resources */
  async linkResources(
    fromId: string,
    fromType: SmeMartResourceType,
    toId: string,
    toType: SmeMartResourceType,
    linkType: SmeMartLinkType,
    context?: Record<string, unknown>,
  ): Promise<SmeMartResourceLink> {
    const userId = this.impersonation.effectiveUserId();
    const row = await this.db.createRow<SmeMartResourceLinkRow>('sme_resource_links', {
      from_resource_id: fromId,
      from_resource_type: fromType,
      to_resource_id: toId,
      to_resource_type: toType,
      link_type: linkType,
      created_by: userId,
      context: context ?? null,
    });
    return this.mapLinkRow(row);
  }

  /** Remove a resource link */
  async deleteResourceLink(linkId: string): Promise<void> {
    await this.db.deleteRow('sme_resource_links', linkId);
  }

  /** List all links for a resource (from or to) */
  async listResourceLinks(
    resourceId: string,
    resourceType: SmeMartResourceType,
  ): Promise<SmeMartResourceLink[]> {
    if (this.db.mode() === 'neon') {
      // Neon sme_resource_links uses UUID columns — skip query for non-UUID IDs
      // (e.g., GQL slug IDs like "eng-001-crystal-harbor")
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(resourceId)) {
        return [];
      }
      const rows = await this.db.neonQueryPublic<SmeMartResourceLinkRow>(
        `SELECT * FROM "sme_resource_links"
         WHERE ("from_resource_id" = '${resourceId}' AND "from_resource_type" = '${resourceType}')
            OR ("to_resource_id" = '${resourceId}' AND "to_resource_type" = '${resourceType}')
         ORDER BY "created_at" DESC`,
      );
      return rows.map(row => this.mapLinkRow(row));
    }
    // Hub mode: use search with OR filter
    const fromFilter = `(&(from_resource_id=${resourceId})(from_resource_type=${resourceType}))`;
    const fromResult = await this.db.searchRows<SmeMartResourceLinkRow>(
      'sme_resource_links', fromFilter, { pageNumber: 1, pageSize: 100 },
    );
    const toFilter = `(&(to_resource_id=${resourceId})(to_resource_type=${resourceType}))`;
    const toResult = await this.db.searchRows<SmeMartResourceLinkRow>(
      'sme_resource_links', toFilter, { pageNumber: 1, pageSize: 100 },
    );
    const all = [...(fromResult.items || []), ...(toResult.items || [])];
    // Deduplicate by id
    const seen = new Set<string>();
    return all
      .filter(row => {
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      })
      .map(row => this.mapLinkRow(row));
  }

  // ── Resource Search (GQL — entities in AuditgraphDB since Waves 1-4) ──

  /** Search resources by type with optional name query. Used by links panel autocomplete. */
  async searchResourcesByType(
    type: SmeMartResourceType,
    query?: string,
    limit = 20,
  ): Promise<SmeMartResource[]> {
    const config = RESOURCE_GQL_CONFIG[type];

    const options: GqlQueryOptions = {
      pageNumber: 1,
      pageSize: limit,
    };

    if (query) {
      options.filters = { [config.nameField]: `.ilike.*${query}*` };
    }

    try {
      const result = await this.gql.query<Record<string, unknown>>(
        config.className,
        config.fields,
        options,
      );

      return result.items.map(gqlObj => {
        const neonShaped = mapGqlToNeon<Record<string, any>>(gqlObj, config.gqlToNeon);
        return config.mapper(neonShaped);
      });
    } catch (err) {
      console.warn(`[SmeMartResource] GQL search failed for ${type}, falling back to Neon:`, err);
      // Fallback to Neon for resilience during migration
      return this.searchResourcesByTypeNeon(type, query, limit);
    }
  }

  /** Neon fallback for searchResourcesByType (used during GQL migration transition) */
  private async searchResourcesByTypeNeon(
    type: SmeMartResourceType,
    query?: string,
    limit = 20,
  ): Promise<SmeMartResource[]> {
    const tableMap: Record<SmeMartResourceType, string> = {
      'sme-mart:note': 'notes',
      'sme-mart:note-folder': 'note_folders',
      'sme-mart:work-request': 'work_requests',
      'sme-mart:bid': 'bids',
      'sme-mart:review': 'reviews',
      'sme-mart:service-offering': 'service_offerings',
      'sme-mart:document': 'engagement_documents',
    };
    const mapperMap: Record<SmeMartResourceType, (row: any) => SmeMartResource> = {
      'sme-mart:note': noteToResource,
      'sme-mart:note-folder': noteFolderToResource,
      'sme-mart:work-request': workRequestToResource,
      'sme-mart:bid': bidToResource,
      'sme-mart:review': reviewToResource,
      'sme-mart:service-offering': serviceOfferingToResource,
      'sme-mart:document': documentToResource,
    };

    const table = tableMap[type];
    const mapper = mapperMap[type];

    if (this.db.mode() === 'neon' && query) {
      const nameCol = type === 'sme-mart:work-request' ? 'engagement_name'
        : type === 'sme-mart:service-offering' ? 'title'
        : 'name';
      const rows = await this.db.neonQueryPublic<Record<string, any>>(
        `SELECT * FROM "${table}" WHERE LOWER("${nameCol}") LIKE LOWER('%${query.replace(/'/g, "''")}%') LIMIT ${limit}`,
      );
      return rows.map(mapper);
    }

    const filter = query ? `(name=*${query}*)` : '';
    const result = await this.db.searchRows<Record<string, any>>(
      table, filter, { pageNumber: 1, pageSize: limit },
    );
    return (result.items || []).map(mapper);
  }

  // ── Tag Search (delegates to EngagementHierarchyService — already on Hydra) ──

  /**
   * Search ZB platform tags by name prefix.
   * Used for autocomplete in tag editors.
   */
  async searchTags(namePrefix: string, limit = 20) {
    return this.hierarchy.searchTagsByName(namePrefix, limit);
  }

  // ── Row Mappers ──

  private mapTagRow(row: SmeMartResourceTagRow): SmeMartResourceTag {
    const fullName = row.zb_tag_name;
    return {
      resourceId: row.resource_id,
      resourceType: row.resource_type,
      zbTagId: row.zb_tag_id,
      zbTagName: fullName,
      displayName: this.stripTagPrefix(fullName),
      assignedAt: row.assigned_at,
      assignedBy: row.assigned_by,
    };
  }

  private mapLinkRow(row: SmeMartResourceLinkRow): SmeMartResourceLink {
    return {
      id: row.id,
      fromResourceId: row.from_resource_id,
      fromResourceType: row.from_resource_type,
      toResourceId: row.to_resource_id,
      toResourceType: row.to_resource_type,
      linkType: row.link_type,
      created: row.created_at,
      createdBy: row.created_by,
      context: row.context ?? undefined,
    };
  }

  /**
   * Strip the hierarchical tag prefix for display.
   * e.g. "sme-mart.eng.amber-circuit.note.risk-assessment" → "risk-assessment"
   */
  private stripTagPrefix(fullName: string): string {
    if (!fullName.startsWith('sme-mart.')) return fullName;
    const parts = fullName.split('.');
    return parts[parts.length - 1];
  }
}

// ── GQL Search Configuration ──

/** Per-type config for GQL-based resource search */
interface ResourceGqlConfig {
  className: SmeMartClassName;
  fields: string[];
  nameField: string;
  gqlToNeon: Record<string, string>;
  mapper: (row: any) => SmeMartResource;
}

const RESOURCE_GQL_CONFIG: Record<SmeMartResourceType, ResourceGqlConfig> = {
  'sme-mart:note': {
    className: 'Note',
    fields: ['id', 'name', 'content', 'authorZerobiasUserId', 'createdAt', 'updatedAt', 'folderId', 'archived', 'boundaryId', 'engagementId', 'projectId'],
    nameField: 'name',
    gqlToNeon: NOTE_FIELD_MAPPING.gqlToNeon,
    mapper: noteToResource,
  },
  'sme-mart:note-folder': {
    className: 'NoteFolder',
    fields: ['id', 'name', 'description', 'createdByZerobiasUserId', 'createdAt', 'updatedAt', 'parentId', 'engagementId'],
    nameField: 'name',
    gqlToNeon: NOTE_FOLDER_FIELD_MAPPING.gqlToNeon,
    mapper: noteFolderToResource,
  },
  'sme-mart:work-request': {
    className: 'Engagement',
    fields: ['id', 'name', 'description', 'buyerZerobiasUserId', 'createdAt', 'updatedAt'],
    nameField: 'name',
    gqlToNeon: ENGAGEMENT_FIELD_MAPPING.gqlToNeon,
    mapper: workRequestToResource,
  },
  'sme-mart:bid': {
    className: 'Bid',
    fields: ['id', 'engagementId', 'providerId', 'coverLetter', 'createdAt', 'updatedAt'],
    nameField: 'coverLetter',
    gqlToNeon: BID_FIELD_MAPPING.gqlToNeon,
    mapper: bidToResource,
  },
  'sme-mart:review': {
    className: 'Review',
    fields: ['id', 'engagementId', 'reviewerZerobiasUserId', 'reviewText', 'createdAt', 'updatedAt'],
    nameField: 'reviewText',
    gqlToNeon: REVIEW_FIELD_MAPPING.gqlToNeon,
    mapper: reviewToResource,
  },
  'sme-mart:service-offering': {
    className: 'ServiceOffering',
    fields: ['id', 'name', 'description', 'providerId', 'createdAt', 'updatedAt', 'isActive'],
    nameField: 'name',
    gqlToNeon: SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon,
    mapper: serviceOfferingToResource,
  },
  'sme-mart:document': {
    className: 'SmeMartDocument',
    fields: ['id', 'displayName', 'filename', 'description', 'uploadedByZerobiasUserId', 'createdAt', 'updatedAt', 'zbTaskId', 'archived', 'engagementId'],
    nameField: 'displayName',
    gqlToNeon: DOCUMENT_FIELD_MAPPING.gqlToNeon,
    mapper: documentToResource,
  },
};
