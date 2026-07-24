import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { Memoize } from '../../shared/utils/memoize.decorator';
import { ENGAGEMENT_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { ProjectExtended } from '@zerobias-com/platform-sdk';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults, UUID } from '@zerobias-org/types-core-js';
import type {
  Engagement,
  EngagementSummaryRow,
  EngagementDetailRow,
} from '../models';
import type { RequestStatus } from '../models/enums';
import type { GqlEngagementResponse } from '../gql-types';
import { PROJECT_TYPE_ID } from '../constants/project-types';

// D-15: Dual-read window timeout values (primary 5s, fallback 5s)
const PRIMARY_READ_TIMEOUT_MS = 5000;

/**
 * EngagementsService — Phase 29.5 Platform Model Migration
 *
 * Engagements are now corp-to-corp agreements (buyer org ↔ provider org).
 * RFP creation/management has moved to SmeMartProjectService.
 *
 * Phase 29.5 refactor: Implements dual-read window (D-15) for platform.Project migration.
 * - Primary path: reads from platform.Project.list with ownerId + tagId filter
 * - Fallback path: legacy GQL SmeMartProject reads for data aging out
 * - Demo visibility: post-filter applied to merged result set
 *
 * Writes: still go through PipelineWriteService (legacy path maintained for backward compat).
 */
@Injectable({ providedIn: 'root' })
export class EngagementsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly loading = signal(false);

  /**
   * List all engagements with summary info (buyer, bid counts).
   * D-15: Dual-read window - primary platform.Project.list, fallback to legacy GQL Engagement
   *
   * Primary path: platform.Project.list({ ownerId, parentId: null })
   * Fallback path: GQL SmeMartProject search (legacy data during deprecation window)
   * Demo visibility: post-filter applied to merged results
   */
  async listEngagements(options?: QueryOptions & { statusFilter?: string; buyerOrgId?: string }): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      // DUAL_READ_WINDOW_D15: Try platform.Project.list first (primary)
      let items: EngagementSummaryRow[] = [];
      let totalCount = 0;

      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), PRIMARY_READ_TIMEOUT_MS)
        );

        const platformProjects = await Promise.race([
          this.clientApi.platformClient
            .getProjectApi()
            .list(pageNumber, pageSize, undefined, options?.buyerOrgId as never),
          timeout,
        ]);

        if (platformProjects) {
          // Depth-1 filter: engagement-tier Projects only (parentId === null).
          // platform.Project.list has no server-side parentId filter (parkit-10 SDK
          // shape note), so we filter client-side. Depth-2 Project-tier rows are
          // listed at /projects, not /engagements.
          const depth1 = platformProjects.items.filter(
            proj => !(proj as ProjectExtended).parentId,
          );

          // RECONCILE-FR-014: SDK 2.x dropped inline Project tags — fetch them for demo-visibility.
          const tagsById = await this.fetchProjectTagsMap(depth1.map(p => String((p as ProjectExtended).id)));

          // Transform platform.Project[] to EngagementSummaryRow[]
          const transformed = depth1.map(proj => this.transformPlatformProjectToEngagementSummary(
            proj as ProjectExtended,
            tagsById.get(String((proj as ProjectExtended).id)),
          ));

          // DG-02/DG-03: Client-side demo-visibility post-filter
          // Note: applyVisibility handles both GQL Engagement and platform.Project shapes (D-24)
          const filtered = this.demoVisibility.applyVisibility(transformed) as EngagementSummaryRow[];

          items = filtered;
          totalCount = platformProjects.pageSize * pageNumber + items.length; // Approximation pending actual paging info

          console.debug('[ENGAGEMENT_LIST:PRIMARY_SUCCESS]', {
            count: items.length,
            buyerOrgId: options?.buyerOrgId,
            source: 'platform.Project.list',
          });
        }
      } catch (primaryErr) {
        // DUAL_READ_WINDOW_D15: Primary read failed, try fallback (legacy GQL)
        console.debug('[ENGAGEMENT_LIST:PRIMARY_FAILED]', {
          error: (primaryErr as Error).message,
          attemptingFallback: true,
        });

        try {
          const filters: Record<string, string> = {};
          if (options?.statusFilter) {
            filters['status'] = `.eq.${options.statusFilter}`;
          }
          if (options?.buyerOrgId) {
            filters['buyerZerobiasOrgId'] = `.eq.${options.buyerOrgId}`;
          }

          const gqlOptions: GqlQueryOptions = {
            filters,
            pageNumber,
            pageSize,
          };

          const gqlResult = await this.graphqlRead.query<GqlEngagementResponse>(
            'Engagement',
            this.getEngagementFields(),
            gqlOptions,
          );

          // DG-02/DG-03: Client-side demo-visibility post-filter
          const filteredGql = this.demoVisibility.applyVisibility(gqlResult.items as (GqlEngagementResponse & { tag?: Array<{ value: string }> | null })[]);
          items = filteredGql.map(gql => this.transformGqlToEngagementSummary(gql as GqlEngagementResponse));
          totalCount = gqlResult.page.totalCount ?? items.length;

          console.debug('[ENGAGEMENT_LIST:FALLBACK_SUCCESS]', {
            count: items.length,
            buyerOrgId: options?.buyerOrgId,
            source: 'GQL_Engagement',
          });
        } catch (fallbackErr) {
          console.error('[ENGAGEMENT_LIST:BOTH_FAILED]', {
            primaryError: (primaryErr as Error).message,
            fallbackError: (fallbackErr as Error).message,
          });
          throw fallbackErr;
        }
      }

      this.engagements.set(items);
      return PagedResults.fromArray(items, pageNumber, pageSize, totalCount);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get the default engagement (depth-1 platform.Project) for a given org.
   * D-15: Dual-read window (platform.Project.list primary, 5s timeout, no fallback).
   * Returns null if no default engagement exists or if the read times out.
   *
   * Used by: DefaultProjectBoardComponent to hydrate engagement header + breadcrumb.
   */
  async getDefaultEngagement(orgId: string): Promise<ProjectExtended | null> {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), PRIMARY_READ_TIMEOUT_MS)
      );

      const projects = await Promise.race([
        this.clientApi.platformClient
          .getProjectApi()
          .list(1, 100, undefined, orgId as never), // pageNumber, pageSize, _, buyerOrgId
        timeout,
      ]);

      if (!projects || !projects.items || projects.items.length === 0) {
        console.warn('[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT]', { orgId, reason: 'no_projects_found' });
        return null;
      }

      // Get the first (depth-1) project (default engagement) — parentId = null or undefined
      const defaultEngagement = projects.items.find((p) => !p.parentId) as ProjectExtended | undefined;
      if (!defaultEngagement) {
        console.warn('[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT]', { orgId, reason: 'no_root_project_found' });
        return null;
      }

      return defaultEngagement;
    } catch (err) {
      console.warn('[ENGAGEMENTS:GET_DEFAULT_ENGAGEMENT_ERROR]', {
        orgId,
        error: (err as Error).message,
      });
      return null;
    }
  }

  /**
   * Get the Project-tier child (depth-2 platform.Project) of an engagement.
   * D-15: Dual-read window (platform.Project.list primary, 5s timeout, no fallback).
   * Returns null if the project-tier child does not exist.
   *
   * Per D-50 canonical tier mapping: depth 2 = Project tier (FIXED name).
   * The returned project has parentId = engagement.id and tagId = SME_MART_TIER_PROJECT_TAG_ID.
   *
   * Used by: DefaultProjectBoardComponent to hydrate project-tier section.
   */
  async getProjectTierProject(engagementId: string): Promise<ProjectExtended | null> {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), PRIMARY_READ_TIMEOUT_MS)
      );

      const projects = await Promise.race([
        this.clientApi.platformClient
          .getProjectApi()
          .list(1, 100, undefined, undefined as never), // pageNumber, pageSize, _, buyerOrgId (undefined = all orgs accessible to user)
        timeout,
      ]);

      if (!projects || !projects.items || projects.items.length === 0) {
        console.warn('[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT]', { engagementId, reason: 'no_projects_found' });
        return null;
      }

      // Find the project-tier child: parentId = engagementId AND projectType = 'project'
      // (SDK 2.x: tier is Project.projectTypeId, not the old marketplace tagId — Nic 2026-07-01.)
      const projectTier = projects.items.find(
        (p) =>
          String(p.parentId) === engagementId &&
          String((p as ProjectExtended).projectTypeId) === PROJECT_TYPE_ID.project
      ) as ProjectExtended | undefined;

      if (!projectTier) {
        console.warn('[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT]', {
          engagementId,
          reason: 'project_tier_not_found',
          expectedProjectTypeId: PROJECT_TYPE_ID.project,
        });
        return null;
      }

      return projectTier;
    } catch (err) {
      console.warn('[ENGAGEMENTS:GET_PROJECT_TIER_PROJECT_ERROR]', {
        engagementId,
        error: (err as Error).message,
      });
      return null;
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

      // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
      const filteredGql = this.demoVisibility.applyVisibility(result.items as (GqlEngagementResponse & { tag?: Array<{ value: string }> | null })[]);

      const items = filteredGql.map(gql => this.transformGqlToEngagementSummary(gql as GqlEngagementResponse));
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
    // D-15 dual-read: try platform.Project.get first (handles depth-1
    // engagement-tier Projects from the new data path), fall back to GQL
    // Engagement (legacy class still in use during the deprecation window).
    try {
      const projectApi = this.clientApi.platformClient.getProjectApi();
      const projectIdUuid = new UUID(id);
      const platformProject = await projectApi.get(projectIdUuid);
      if (platformProject) {
        // RECONCILE-FR-014: SDK 2.x dropped inline Project tags — fetch for demo-visibility parity.
        const tagsById = await this.fetchProjectTagsMap([String((platformProject as ProjectExtended).id)]);
        const summary = this.transformPlatformProjectToEngagementSummary(
          platformProject as ProjectExtended,
          tagsById.get(String((platformProject as ProjectExtended).id)),
        );
        return {
          ...summary,
          buyer_email: null,
          bids: '[]',
        } as EngagementDetailRow;
      }
    } catch (err) {
      console.debug('[GET_ENGAGEMENT:PLATFORM_MISS]', { id, error: (err as Error).message });
    }

    const engagement = await this.graphqlRead.getById<GqlEngagementResponse>(
      'Engagement',
      id,
      this.getEngagementFields(),
    );

    if (!engagement) return null;

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility([engagement as GqlEngagementResponse & { tag?: Array<{ value: string }> | null }])[0] ?? null;
    if (!filtered) return null;

    // Transform to EngagementDetailRow
    // Note: bids array would come from nested GQL query or separate call
    return this.transformGqlToEngagementDetail(filtered as GqlEngagementResponse);
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

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility([engagement as GqlEngagementResponse & { tag?: Array<{ value: string }> | null }])[0] ?? null;
    if (!filtered) return null;

    // Transform GQL response back to Engagement (Neon model)
    return mapGqlToNeon<Engagement>(filtered as GqlEngagementResponse, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
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
      status: 'in_progress' as unknown as RequestStatus,
      engagement_tag: data.engagement_tag,
      zerobias_tag_id: data.zerobias_tag_id || null,
      zerobias_boundary_id: null,
      zerobias_task_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const gqlData = mapNeonToGql<GqlEngagementResponse>(engagement, ENGAGEMENT_FIELD_MAPPING.neonToGql);
    try {
      await this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>, [], 'engagements.service:172');
    } catch (err) {
      this.snackBar.open(
        `Failed to create engagement: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return engagement;
  }

  /**
   * Update an engagement and push changes to Pipeline.
   */
  async updateEngagement(id: string, data: Partial<Engagement>): Promise<Engagement> {
    // Check write-through cache first, fall back to GQL fetch
    const cached = this.pipelineWrite.getCached('Engagement', id);
    const current = cached
      ? mapGqlToNeon<Engagement>(cached, ENGAGEMENT_FIELD_MAPPING.gqlToNeon)
      : await this.getEngagementRaw(id);
    if (!current) throw new Error(`Engagement ${id} not found`);

    const updated: Engagement = { ...current, ...data, updated_at: new Date().toISOString() };

    const gqlData = mapNeonToGql<GqlEngagementResponse>(updated, ENGAGEMENT_FIELD_MAPPING.neonToGql);
    try {
      await this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>, [], 'engagements.service:205');
    } catch (err) {
      this.snackBar.open(
        `Failed to update engagement: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return updated;
  }

  /**
   * Cancel an engagement.
   */
  async cancelEngagement(id: string): Promise<Engagement> {
    return this.updateEngagement(id, { status: 'cancelled' as unknown as RequestStatus });
  }

  /**
   * Mark engagement as completed.
   */
  async completeEngagement(id: string): Promise<Engagement> {
    return this.updateEngagement(id, { status: 'completed' as unknown as RequestStatus });
  }

  /**
   * RECONCILE-FR-014 (interim). SDK 2.x `platform.Project.list` no longer returns a
   * project's resource-tags inline, but demo-visibility (DG-02/03) filters engagements
   * by tag. Batch-fetch each project's resource-tags via hydra `getTagsForResource` and
   * shape them as the GQL `[{value}]` array `DemoVisibilityService.isLocalDemoTagged`
   * consumes. DELETE this and read the inline tags field once backend FR-014 (task-71)
   * ships — or entirely if backlog 041 (tombstone demo-data) lands first.
   */
  private async fetchProjectTagsMap(projectIds: string[]): Promise<Map<string, Array<{ value: string }>>> {
    const resourceApi = this.clientApi.hydraClient.getResourceApi();
    const entries = await Promise.all(
      projectIds.map(async (id) => {
        try {
          const tags = await resourceApi.getTagsForResource(new UUID(id));
          return [id, (tags ?? []).map(t => ({ value: String(t.id) }))] as const;
        } catch {
          // Tag fetch failed for this project — treat as untagged (i.e. visible).
          // Non-fatal: a transient hydra error must not hide real engagements.
          return [id, [] as Array<{ value: string }>] as const;
        }
      }),
    );
    return new Map(entries);
  }

  /**
   * Transform platform.Project to EngagementSummaryRow (D-15 migration).
   * SDK 2.x: Project.tag/tagId are gone. Tier is now Project.projectTypeId, and a
   * project's resource-tags are fetched separately (RECONCILE-FR-014) and passed in as
   * `resourceTags` (shaped as the GQL `[{value}]` array demo-visibility consumes).
   * Engagement shape: { id, title, description, buyer_zerobias_org_id, status, engagement_tag, ... }
   */
  private transformPlatformProjectToEngagementSummary(
    proj: ProjectExtended,
    resourceTags?: Array<{ value: string }>,
  ): EngagementSummaryRow & { tag?: Array<{ value: string }> | null } {
    return {
      id: String(proj.id),
      buyer_user_id: null, // Not available on platform.Project
      buyer_zerobias_user_id: proj.createdBy ? String(proj.createdBy) : '', // creator UUID or empty
      buyer_zerobias_org_id: String(proj.ownerId), // D-03: engagement ownerId = buyerOrgId
      title: proj.name,
      description: proj.description ?? null,
      category: '', // Not applicable; this is persistence-only
      budget_type: null,
      budget_min: null,
      budget_max: null,
      timeline: null,
      status: 'in_progress' as unknown as RequestStatus, // Map platform.Project.status ('active'|'archived'|'closed') to engagement status
      engagement_tag: '', // RECONCILE-FR-014: per-org marketplace tag retired; engagement identity is now projectType==engagement + ownerId
      zerobias_tag_id: null, // RECONCILE-FR-014: marketplace tag id retired (was proj.tagId, gone in SDK 2.x)
      zerobias_boundary_id: proj.boundaryId ? String(proj.boundaryId) : null,
      zerobias_task_id: null,
      created_at: proj.created?.toDate().toISOString() ?? new Date().toISOString(),
      updated_at: proj.updated?.toDate().toISOString() ?? new Date().toISOString(),
      buyer_display_name: null,
      buyer_avatar_url: null,
      bid_count: 0,
      pending_bid_count: 0,
      accepted_provider_name: null,
      accepted_provider_id: null,
      // D-24 demo-visibility. RECONCILE-FR-014: was proj.tag (gone in SDK 2.x);
      // resource-tags fetched separately and passed in, shaped as the GQL [{value}] array.
      tag: resourceTags ?? null,
    };
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
      'tag',
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
