import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { SmeMartResourceService } from './sme-mart-resource.service';
import { Memoize } from '../../shared/utils/memoize.decorator';
import { SME_MART_PROJECT_FIELD_MAPPING, SME_MART_BOARD_FIELD_MAPPING, mapGqlToNeon, mapNeonToGql } from '../field-mappings';
import { PROJECT_TYPE_ID } from '../constants/project-types';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ZerobiasClientOrgIdService } from '@zerobias-com/zerobias-angular-client';
import type { ProjectExtended } from '@zerobias-com/platform-sdk';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults, UUID } from '@zerobias-org/types-core-js';
import type {
  SmeMartProject,
  CreateSmeMartProjectRequest,
  UpdateSmeMartProjectRequest,
  SmeMartBoard,
} from '../models';
import type { GqlSmeMartProjectResponse, GqlSmeMartBoardResponse } from '../gql-types';

// D-15: Dual-read window timeout values (primary 5s, fallback 5s)
const PRIMARY_READ_TIMEOUT_MS = 5000;

/**
 * SmeMartProjectService — Project Bloom + RFP container (Plan 075 Phase 2)
 *
 * SmeMartProject now serves double duty:
 * - Project container (status: draft → active → completed)
 * - RFP entity (status: draft → published → active → completed)
 *
 * Phase 29.5 refactor: Implements dual-read window (D-15) for platform.Project migration.
 * - Primary path: reads from platform.Project.list with parentId (nil for RFPs) + tagId filter
 * - Fallback path: legacy GQL SmeMartProject reads for data aging out
 * - Demo visibility: post-filter applied to merged result set
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * Reads: dual-read primary platform.Project, fallback GQL SmeMartProject.
 */
@Injectable({ providedIn: 'root' })
export class SmeMartProjectService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly tagService = inject(SmeMartTagService);
  private readonly resourceService = inject(SmeMartResourceService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly orgIdService = inject(ZerobiasClientOrgIdService);

  /** Scalar fields queryable via standard GraphqlReadService.query() */
  private readonly scalarFields = [
    'id',
    'name',
    'description',
    'status',
    'engagementId', // scalar mirror of engagement link (schema v1.0.9)
    'projectType', // 'rfp' | 'pilot' | 'project' (Plan 077)
    'startDate',
    'targetEndDate',
    // RFP fields (Plan 075)
    'category',
    'budgetType',
    'budgetMin',
    'budgetMax',
    'timeline',
    'responseDeadline',
    'questionsDeadline',
    'evaluationCriteria',
    'wizardStep',
    'wizardData',
    'dateCreated',
    'dateLastModified',
    'tag',
  ];

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  /**
   * Create a new SmeMartProject and push to Pipeline.
   * Returns optimistic SmeMartProject immediately (doesn't wait for GQL indexing).
   */
  async createProject(data: CreateSmeMartProjectRequest): Promise<SmeMartProject> {
    const now = new Date().toISOString();
    const projectId = this.generateUUID();

    const project: SmeMartProject = {
      id: projectId,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? 'draft',
      startDate: data.startDate ?? now,
      targetEndDate: data.targetEndDate ?? null,
      category: data.category ?? null,
      budgetType: data.budgetType ?? null,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      timeline: data.timeline ?? null,
      responseDeadline: data.responseDeadline ?? null,
      questionsDeadline: data.questionsDeadline ?? null,
      evaluationCriteria: data.evaluationCriteria ?? null,
      wizardStep: data.wizardStep ?? null,
      wizardData: data.wizardData ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.pushToGql(project);
    return project;
  }

  /**
   * Fetch a single project by ID. Cached for 30s.
   */
  @Memoize(30000)
  async getProject(id: string): Promise<SmeMartProject | null> {
    // D-15 dual-read: primary platform.Project.get (handles new platform-Project
    // rows like the depth-2 Project-tier records), fallback GQL SmeMartProject
    // (legacy class still in use during the deprecation window).
    try {
      const projectApi = this.clientApi.platformClient.getProjectApi();
      const projectIdUuid = new UUID(id);
      const platformProject = await projectApi.get(projectIdUuid);
      if (platformProject) {
        // RECONCILE-FR-014: SDK 2.x dropped inline Project tags — fetch for demo-visibility parity.
        const getTagsById = await this.fetchProjectTagsMap([String((platformProject as ProjectExtended).id)]);
        return this.transformPlatformProjectToSmeMartProject(
          platformProject as ProjectExtended,
          getTagsById.get(String((platformProject as ProjectExtended).id)),
        );
      }
    } catch (err) {
      // 404 / not-found on platform path → try GQL fallback. Other errors also
      // fall through (network/timeout/etc); the GQL path will surface its own.
      console.debug('[GET_PROJECT:PLATFORM_MISS]', { id, error: (err as Error).message });
    }

    const gql = await this.graphqlRead.getById<GqlSmeMartProjectResponse>(
      'SmeMartProject',
      id,
      this.scalarFields,
    );

    if (!gql) return null;

    return mapGqlToNeon<SmeMartProject>(gql, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * List all projects with pagination.
   * D-15: Dual-read window - primary platform.Project.list, fallback to legacy GQL SmeMartProject
   *
   * Primary path: platform.Project.list({ parentId: null }) for RFP-like projects
   * Fallback path: GQL SmeMartProject search (legacy data during deprecation window)
   * Demo visibility: post-filter applied to merged results
   */
  async listProjects(options?: QueryOptions & { statusFilter?: string }): Promise<PagedResults<SmeMartProject>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    // DUAL_READ_WINDOW_D15: Try platform.Project.list first (primary)
    let items: SmeMartProject[] = [];
    let totalCount = 0;

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PRIMARY_READ_TIMEOUT')), PRIMARY_READ_TIMEOUT_MS)
      );

      // Scope to current org via 4th positional arg (ownerId). Server returns
      // every Project the user has visibility into; without ownerId, multi-org
      // members see cross-org leak (sibling of errata 036(a) / 039).
      const currentOrgId = this.orgIdService.getCurrentOrgId();
      const platformProjects = await Promise.race([
        this.clientApi.platformClient
          .getProjectApi()
          .list(pageNumber, pageSize, undefined, currentOrgId as never),
        timeout,
      ]);

      if (platformProjects) {
        // Tier filter: keep only Project-tier rows (projectTypeId === project-type 'project').
        // platform.Project.list has no server-side projectType filter, so we filter client-side.
        // Engagement-tier rows are listed at /engagements; other-type rows belong elsewhere.
        // (SDK 2.x: tier is now Project.projectTypeId, not the old marketplace tagId — Nic 2026-07-01.)
        const projectTier = platformProjects.items.filter(
          proj => String((proj as ProjectExtended).projectTypeId ?? '') === PROJECT_TYPE_ID.project,
        );

        // Transform platform.Project[] to SmeMartProject[]
        // RECONCILE-FR-014: SDK 2.x dropped inline Project tags — fetch for demo-visibility.
        const tagsById = await this.fetchProjectTagsMap(projectTier.map(p => String((p as ProjectExtended).id)));
        const transformed = projectTier.map(proj => this.transformPlatformProjectToSmeMartProject(
          proj as ProjectExtended,
          tagsById.get(String((proj as ProjectExtended).id)),
        ));

        // DG-02/DG-03: Client-side demo-visibility post-filter
        const filtered = this.demoVisibility.applyVisibility(transformed) as SmeMartProject[];

        items = filtered;
        totalCount = platformProjects.pageSize * pageNumber + items.length; // Approximation pending actual paging info

        console.debug('[PROJECT_LIST:PRIMARY_SUCCESS]', {
          count: items.length,
          source: 'platform.Project.list',
        });
      }
    } catch (primaryErr) {
      // DUAL_READ_WINDOW_D15: Primary read failed, try fallback (legacy GQL)
      console.debug('[PROJECT_LIST:PRIMARY_FAILED]', {
        error: (primaryErr as Error).message,
        attemptingFallback: true,
      });

      try {
        const filters: Record<string, string> = {};
        if (options?.statusFilter) {
          filters['status'] = `.eq.${options.statusFilter}`;
        }

        const gqlOptions: GqlQueryOptions = {
          filters,
          pageNumber,
          pageSize,
        };

        const result = await this.graphqlRead.query<GqlSmeMartProjectResponse>(
          'SmeMartProject',
          this.scalarFields,
          gqlOptions,
        );

        // DG-02/DG-03: Client-side demo-visibility post-filter
        const filteredGql = this.demoVisibility.applyVisibility(result.items as (GqlSmeMartProjectResponse & { tag?: Array<{ value: string }> | null })[]);

        items = filteredGql.map(gql =>
          mapGqlToNeon<SmeMartProject>(gql, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon),
        );
        totalCount = result.page.totalCount ?? items.length;

        console.debug('[PROJECT_LIST:FALLBACK_SUCCESS]', {
          count: items.length,
          source: 'GQL_SmeMartProject',
        });
      } catch (fallbackErr) {
        console.error('[PROJECT_LIST:BOTH_FAILED]', {
          primaryError: (primaryErr as Error).message,
          fallbackError: (fallbackErr as Error).message,
        });
        throw fallbackErr;
      }
    }

    const paged = new PagedResults<SmeMartProject>();
    paged.items = items;
    paged.pageNumber = pageNumber;
    paged.pageSize = pageSize;
    paged.count = totalCount;
    return paged;
  }

  /**
   * Update a project and push changes to Pipeline.
   * Returns updated project optimistically.
   */
  async updateProject(
    id: string,
    changes: UpdateSmeMartProjectRequest,
  ): Promise<SmeMartProject> {
    // Check write-through cache first (avoids GQL round-trip on rapid edits)
    const cached = this.pipelineWrite.getCached('SmeMartProject', id);
    const existing = cached
      ? mapGqlToNeon<SmeMartProject>(cached, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon)
      : await this.getProject(id);
    if (!existing) {
      throw new Error(`Project ${id} not found`);
    }

    const updated: SmeMartProject = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    await this.pushToGql(updated);
    return updated;
  }

  /**
   * Delete a project and push deletion to Pipeline.
   */
  async deleteProject(id: string): Promise<void> {
    this.pipelineWrite.deleteEntity('SmeMartProject', id).catch(err => {
      console.error('[ProjectService] Failed to delete project:', err);
    });
  }

  // ---------------------------------------------------------------------------
  // RFP Methods (Plan 075)
  // ---------------------------------------------------------------------------

  /**
   * Create a new RFP as a SmeMartProject in draft status.
   * Called from RfpWizardService when the first step saves.
   */
  async createAsRfp(data: {
    name: string;
    description?: string;
    category: string;
    budgetType?: string;
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
  }): Promise<SmeMartProject> {
    return this.createProject({
      name: data.name,
      description: data.description,
      status: 'draft',
      category: data.category,
      budgetType: data.budgetType as SmeMartProject['budgetType'],
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      timeline: data.timeline,
    });
  }

  /**
   * Publish an RFP: create ZB tag, set status to 'published'.
   * Returns updated project + tag info.
   */
  async publishRfp(
    projectId: string,
    rfpTagIdentifier?: string,
  ): Promise<{ project: SmeMartProject; rfpTagName: string; zerobiasTagId?: string }> {
    const existing = await this.getProject(projectId);
    if (!existing) throw new Error(`Project ${projectId} not found`);

    const rfpTagName = this.tagService.generateRfpTag(rfpTagIdentifier);

    // Create ZB platform tag for tracking
    let zerobiasTagId: string | undefined;
    try {
      const tag = await this.tagService.createTag(rfpTagName, `RFP: ${existing.name}`);
      zerobiasTagId = tag?.id?.toString();
    } catch (err) {
      console.warn('[ProjectService] Failed to create RFP tag, continuing:', err);
    }

    const project = await this.updateProject(projectId, {
      status: 'published',
    });

    return { project, rfpTagName, zerobiasTagId };
  }

  /**
   * Link a project to an engagement via sme_resource_links (Neon).
   * Creates bidirectional 'relates_to' links.
   */
  async linkToEngagement(projectId: string, engagementId: string): Promise<void> {
    // Create both directions for the relates_to link
    await this.resourceService.linkResources(
      projectId,
      'sme-mart:work-request', // reuse existing resource type for projects
      engagementId,
      'sme-mart:work-request',
      'relates_to',
      { source: 'bid-acceptance', linkedAt: new Date().toISOString() },
    );
  }

  // ---------------------------------------------------------------------------
  // Relationship queries
  // ---------------------------------------------------------------------------

  /**
   * List projects filtered by engagement ID.
   *
   * Uses `engagementId` scalar field (schema v1.0.9) for server-side filtering.
   */
  async listProjectsByEngagement(engagementId: string, options?: QueryOptions): Promise<PagedResults<SmeMartProject>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    // D-15 dual-read: primary platform.Project.list (depth-2 Project-tier
    // children of this engagement), fallback GQL SmeMartProject filtered by
    // engagementId scalar (legacy data during the deprecation window).
    try {
      // Scope to current org via 4th positional arg (ownerId) — sibling fix to
      // listProjects above. Cross-org leak risk otherwise.
      const currentOrgId = this.orgIdService.getCurrentOrgId();
      const platformList = await this.clientApi.platformClient
        .getProjectApi()
        .list(pageNumber, pageSize, undefined, currentOrgId as never);

      if (platformList) {
        // Children of the requested engagement Project, tier=Project (D-50).
        // platform.Project.list has no server-side parentId/projectType filter,
        // so we filter client-side. (SDK 2.x: tier = projectTypeId, not old tagId.)
        const children = platformList.items.filter(p => {
          const proj = p as ProjectExtended;
          return String(proj.parentId ?? '') === engagementId
            && String(proj.projectTypeId ?? '') === PROJECT_TYPE_ID.project;
        });

        if (children.length > 0) {
          // RECONCILE-FR-014: SDK 2.x dropped inline Project tags — fetch for demo-visibility.
          const childTagsById = await this.fetchProjectTagsMap(children.map(p => String((p as ProjectExtended).id)));
          const transformed = children.map(p => this.transformPlatformProjectToSmeMartProject(
            p as ProjectExtended,
            childTagsById.get(String((p as ProjectExtended).id)),
          ));
          const filtered = this.demoVisibility.applyVisibility(transformed) as SmeMartProject[];
          const paged = new PagedResults<SmeMartProject>();
          paged.items = filtered;
          paged.pageNumber = pageNumber;
          paged.pageSize = pageSize;
          paged.count = filtered.length;
          return paged;
        }
      }
    } catch (err) {
      console.debug('[LIST_PROJECTS_BY_ENGAGEMENT:PLATFORM_MISS]', { engagementId, error: (err as Error).message });
    }

    const gqlOptions: GqlQueryOptions = {
      pageNumber,
      pageSize,
      filters: { engagementId: `.eq.${engagementId}` },
    };

    const result = await this.graphqlRead.query<GqlSmeMartProjectResponse>(
      'SmeMartProject',
      this.scalarFields,
      gqlOptions,
    );

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filteredGql = this.demoVisibility.applyVisibility(result.items as (GqlSmeMartProjectResponse & { tag?: Array<{ value: string }> | null })[]);

    const items = filteredGql.map(gql =>
      mapGqlToNeon<SmeMartProject>(gql, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon),
    );

    const paged = new PagedResults<SmeMartProject>();
    paged.items = items;
    paged.pageNumber = pageNumber;
    paged.pageSize = pageSize;
    paged.count = items.length;
    return paged;
  }

  /**
   * List published RFPs for the marketplace.
   */
  async listPublishedRfps(options?: QueryOptions): Promise<PagedResults<SmeMartProject>> {
    return this.listProjects({ ...options, statusFilter: 'published' });
  }

  /**
   * Get all boards for a project.
   * Relationship query: boards where parentId === projectId
   */
  async getProjectBoards(projectId: string): Promise<SmeMartBoard[]> {
    const boardFields = [
      'id',
      'code',
      'name',
      'scope',
      'partition',
      'parentId',
      'description',
      'createdAt',
      'updatedAt',
    ];

    const gqlOptions: GqlQueryOptions = {
      filters: { parentId: `.eq.${projectId}` },
      pageSize: 1000,
    };

    const result = await this.graphqlRead.query<GqlSmeMartBoardResponse>(
      'SmeMartBoard',
      boardFields,
      gqlOptions,
    );

    return result.items.map(gql =>
      mapGqlToNeon<SmeMartBoard>(gql, SME_MART_BOARD_FIELD_MAPPING.gqlToNeon),
    );
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /**
   * Transform platform.Project (ProjectExtended) to SmeMartProject.
   * Maps platform project shape to legacy SmeMartProject fields.
   */
  /**
   * RECONCILE-FR-014 (interim). SDK 2.x `platform.Project.list` no longer returns a project's
   * resource-tags inline, but demo-visibility (DG-02/03) filters by tag. Batch-fetch each
   * project's resource-tags via hydra `getTagsForResource`, shaped as the GQL `[{value}]` array
   * `DemoVisibilityService.isLocalDemoTagged` consumes. DELETE once backend FR-014 (task-71)
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
          // Tag fetch failed for this project — treat as untagged (visible). A transient
          // hydra error must not hide real projects.
          return [id, [] as Array<{ value: string }>] as const;
        }
      }),
    );
    return new Map(entries);
  }

  private transformPlatformProjectToSmeMartProject(
    proj: ProjectExtended,
    resourceTags?: Array<{ value: string }>,
  ): SmeMartProject & { tag?: Array<{ value: string }> | null } {
    return {
      id: String(proj.id),
      name: proj.name ?? '',
      description: proj.description ?? null,
      status: String(proj.status ?? 'draft'),
      // Map platform.Project.parentId -> engagementId scalar mirror.
      // Per D-46/D-50 hierarchy: depth-2 Project's parentId IS the depth-1
      // Engagement Project's id. Required so project-detail can hydrate the
      // engagement-name breadcrumb crumb via EngagementsService.getEngagement.
      engagementId: proj.parentId ? String(proj.parentId) : null,
      projectType: 'project', // Default to 'project' until further distinction in platform schema
      startDate: proj.created?.toDate().toISOString() ?? new Date().toISOString(),
      targetEndDate: null, // Not available in platform.Project shape
      category: null, // Not available in platform.Project shape
      budgetType: null, // Not available in platform.Project shape
      budgetMin: null, // Not available in platform.Project shape
      budgetMax: null, // Not available in platform.Project shape
      timeline: null, // Not available in platform.Project shape
      responseDeadline: null, // Not available in platform.Project shape
      questionsDeadline: null, // Not available in platform.Project shape
      evaluationCriteria: null, // Not available in platform.Project shape
      wizardStep: null, // Not available in platform.Project shape
      wizardData: null, // Not available in platform.Project shape
      createdAt: proj.created?.toDate().toISOString() ?? new Date().toISOString(),
      updatedAt: proj.updated?.toDate().toISOString() ?? new Date().toISOString(),
      // D-24 demo-visibility. RECONCILE-FR-014: was proj.tag (gone in SDK 2.x);
      // resource-tags fetched separately and passed in, shaped as the GQL [{value}] array.
      tag: resourceTags ?? null,
    };
  }

  /**
   * Push a SmeMartProject to Pipeline (full replace — all fields).
   * Fire-and-forget — caller returns optimistic result.
   */
  private async pushToGql(project: SmeMartProject): Promise<void> {
    const gqlData = mapNeonToGql<Record<string, unknown>>(
      project,
      SME_MART_PROJECT_FIELD_MAPPING.neonToGql,
    );
    // Push both scalar `engagementId` AND link `engagement` for relationship
    if (project.engagementId) {
      gqlData['engagement'] = project.engagementId;
    }
    try {
      await this.pipelineWrite.pushEntity('SmeMartProject', gqlData, [], 'sme-mart-project.service:345');
    } catch (err) {
      this.snackBar.open(
        `Failed to save project: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }
  }

  private generateUUID(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
