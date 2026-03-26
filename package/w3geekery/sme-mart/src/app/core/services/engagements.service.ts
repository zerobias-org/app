import { Injectable, inject, signal } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { Memoize } from '../../shared/utils/memoize.decorator';
import { ENGAGEMENT_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type {
  Engagement,
  EngagementSummaryRow,
  EngagementDetailRow,
} from '../models';
import type { GqlEngagementResponse } from '../gql-types';

/**
 * EngagementsService — Plan 075 Phase 2 cleanup
 *
 * Engagements are now corp-to-corp agreements (buyer org ↔ provider org).
 * RFP creation/management has moved to SmeMartProjectService.
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */
@Injectable({ providedIn: 'root' })
export class EngagementsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly loading = signal(false);

  /**
   * List all published engagements with summary info (buyer, bid counts).
   * Queries GQL via GraphqlReadService, transforms responses to EngagementSummaryRow.
   */
  async listEngagements(options?: QueryOptions & { statusFilter?: string }): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const filters: Record<string, string> = {};
      if (options?.statusFilter) {
        filters['status'] = `.eq.${options.statusFilter}`;
      }

      const gqlOptions: GqlQueryOptions = {
        filters,
        pageNumber,
        pageSize,
      };

      const result = await this.graphqlRead.query<GqlEngagementResponse>(
        'Engagement',
        this.getEngagementFields(),
        gqlOptions,
      );

      // Transform GQL responses to EngagementSummaryRow
      const items = result.items.map(gql => this.transformGqlToEngagementSummary(gql));
      this.engagements.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Search engagements by title/description filter.
   * Applies ILIKE filter for fuzzy text search.
   */
  async searchEngagements(filter: string, options?: QueryOptions): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const gqlOptions: GqlQueryOptions = {
        filters: {
          name: `.ilike.%${filter}%`,
        },
        pageNumber,
        pageSize,
      };

      const result = await this.graphqlRead.query<GqlEngagementResponse>(
        'Engagement',
        this.getEngagementFields(),
        gqlOptions,
      );

      const items = result.items.map(gql => this.transformGqlToEngagementSummary(gql));
      this.engagements.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch a single engagement with full details and related bid data. Cached for 30s.
   */
  @Memoize(30000)
  async getEngagement(id: string): Promise<EngagementDetailRow | null> {
    const engagement = await this.graphqlRead.getById<GqlEngagementResponse>(
      'Engagement',
      id,
      this.getEngagementFields(),
    );

    if (!engagement) return null;

    // Transform to EngagementDetailRow
    // Note: bids array would come from nested GQL query or separate call
    return this.transformGqlToEngagementDetail(engagement);
  }

  /**
   * Fetch raw engagement row (used for wizard flows that need all fields).
   */
  async getEngagementRaw(id: string): Promise<Engagement | null> {
    const engagement = await this.graphqlRead.getById<GqlEngagementResponse>(
      'Engagement',
      id,
      this.getEngagementFields(),
    );

    if (!engagement) return null;

    // Transform GQL response back to Engagement (Neon model)
    return mapGqlToNeon<Engagement>(engagement, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * Create an engagement (corp-to-corp agreement between buyer and provider).
   * Called from EngagementLifecycleService when a bid is accepted.
   */
  async createEngagement(data: {
    buyer_zerobias_user_id: string;
    buyer_zerobias_org_id?: string;
    title: string;
    description?: string;
    engagement_tag: string;
    zerobias_tag_id?: string;
  }): Promise<Engagement> {
    const id = `eng-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const engagement: Engagement = {
      id,
      buyer_user_id: null,
      buyer_zerobias_user_id: data.buyer_zerobias_user_id,
      buyer_zerobias_org_id: data.buyer_zerobias_org_id || null,
      title: data.title,
      description: data.description || null,
      category: '', // Engagements no longer carry RFP fields (moved to SmeMartProject)
      budget_type: null,
      budget_min: null,
      budget_max: null,
      timeline: null,
      status: 'in_progress' as any,
      engagement_tag: data.engagement_tag,
      zerobias_tag_id: data.zerobias_tag_id || null,
      zerobias_boundary_id: null,
      zerobias_task_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const gqlData = mapNeonToGql<GqlEngagementResponse>(engagement, ENGAGEMENT_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to push engagement to Pipeline:', err);
    });

    return engagement;
  }

  /**
   * Update an engagement and push changes to Pipeline.
   */
  async updateEngagement(id: string, data: Partial<Engagement>): Promise<Engagement> {
    const current = await this.getEngagementRaw(id);
    if (!current) throw new Error(`Engagement ${id} not found`);

    const updated: Engagement = { ...current, ...data, updated_at: new Date().toISOString() };

    const gqlData = mapNeonToGql<GqlEngagementResponse>(updated, ENGAGEMENT_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to update engagement in Pipeline:', err);
    });

    return updated;
  }

  /**
   * Cancel an engagement.
   */
  async cancelEngagement(id: string): Promise<Engagement> {
    return this.updateEngagement(id, { status: 'cancelled' as any });
  }

  /**
   * Mark engagement as completed.
   */
  async completeEngagement(id: string): Promise<Engagement> {
    return this.updateEngagement(id, { status: 'completed' as any });
  }

  /**
   * Get standard field list for Engagement GQL queries.
   */
  private getEngagementFields(): string[] {
    // Only fields that exist in the GQL Engagement schema (Object base + custom properties)
    // Object inherited: id, name, description, dateCreated, dateLastModified
    // Custom (from Engagement.yml): all camelCase field names
    // Fields removed from schema 2026-03-24 (PR #20): category, budgetType,
    // budgetMin, budgetMax, timeline, responseDeadline, questionsDeadline,
    // evaluationCriteria, wizardStep, wizardData, zerobiasBoundaryId
    return [
      'id',
      'name',
      'description',
      'status',
      'engagementTag',
      'zerobiasTaskId',
      'zerobiasTagId',
      'buyerZerobiasUserId',
      'buyerZerobiasOrgId',
      'dateCreated',
      'dateLastModified',
    ];
  }

  /**
   * Transform GQL engagement response to EngagementSummaryRow.
   * For now, bid counts are 0 (would require separate query or nested GQL).
   */
  private transformGqlToEngagementSummary(gql: GqlEngagementResponse): EngagementSummaryRow {
    const engagement = mapGqlToNeon<Engagement>(gql, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
    return {
      ...engagement,
      buyer_display_name: null,  // Would come from Zerobias user lookup
      buyer_avatar_url: null,    // Would come from Zerobias user lookup
      bid_count: 0,              // Would require separate query
      pending_bid_count: 0,      // Would require separate query
      accepted_provider_name: null,
      accepted_provider_id: null,
    };
  }

  /**
   * Transform GQL engagement response to EngagementDetailRow.
   * For now, bids array is '[]' JSON string (would require nested GQL or separate query).
   */
  private transformGqlToEngagementDetail(gql: GqlEngagementResponse): EngagementDetailRow {
    const engagement = mapGqlToNeon<Engagement>(gql, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
    return {
      ...engagement,
      buyer_display_name: null,  // Would come from Zerobias user lookup
      buyer_email: null,         // Would come from Zerobias user lookup
      bids: '[]',                // Would require nested GQL or separate query
      bid_count: 0,              // Would require separate query
    };
  }
}
