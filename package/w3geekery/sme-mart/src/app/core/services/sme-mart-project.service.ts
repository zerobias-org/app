import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { SmeMartResourceService } from './sme-mart-resource.service';
import { Memoize } from '../../shared/utils/memoize.decorator';
import { SME_MART_PROJECT_FIELD_MAPPING, SME_MART_BOARD_FIELD_MAPPING, mapGqlToNeon, mapNeonToGql } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type {
  SmeMartProject,
  CreateSmeMartProjectRequest,
  UpdateSmeMartProjectRequest,
  SmeMartBoard,
} from '../models';
import type { GqlSmeMartProjectResponse, GqlSmeMartBoardResponse } from '../gql-types';

/**
 * SmeMartProjectService — Project Bloom + RFP container (Plan 075 Phase 2)
 *
 * SmeMartProject now serves double duty:
 * - Project container (status: draft → active → completed)
 * - RFP entity (status: draft → published → active → completed)
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */
@Injectable({ providedIn: 'root' })
export class SmeMartProjectService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly tagService = inject(SmeMartTagService);
  private readonly resourceService = inject(SmeMartResourceService);

  /** Scalar fields queryable via standard GraphqlReadService.query() */
  private readonly scalarFields = [
    'id',
    'name',
    'description',
    'status',
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
  ];

  /** All fields including link expansions — for rawQuery only */
  private readonly allFields = [
    ...this.scalarFields.filter(f => f !== 'dateCreated' && f !== 'dateLastModified'),
    'dateCreated',
    'dateLastModified',
    'engagement { id }',
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

    this.pushToGql(project);
    return project;
  }

  /**
   * Fetch a single project by ID. Cached for 30s.
   */
  @Memoize(30000)
  async getProject(id: string): Promise<SmeMartProject | null> {
    const project = await this.graphqlRead.getById<GqlSmeMartProjectResponse>(
      'SmeMartProject',
      id,
      this.scalarFields,
    );

    if (!project) return null;

    return mapGqlToNeon<SmeMartProject>(project, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * List all projects with pagination.
   */
  async listProjects(options?: QueryOptions & { statusFilter?: string }): Promise<PagedResults<SmeMartProject>> {
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

    const result = await this.graphqlRead.query<GqlSmeMartProjectResponse>(
      'SmeMartProject',
      this.scalarFields,
      gqlOptions,
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<SmeMartProject>(gql, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon),
    );

    const paged = new PagedResults<SmeMartProject>();
    paged.items = items;
    paged.pageNumber = result.page.pageNumber;
    paged.pageSize = result.page.pageSize;
    paged.count = result.page.totalCount ?? items.length;
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

    this.pushToGql(updated);
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
   * Uses rawQuery because `engagement` is a link field (not a scalar),
   * requiring nested filter syntax: engagement: { id: ".eq.xxx" }
   */
  async listProjectsByEngagement(engagementId: string, options?: QueryOptions): Promise<PagedResults<SmeMartProject>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    // engagement is a link field — needs subfield selection and nested filter
    const fieldStr = this.allFields.join(' ');
    const query = `{ SmeMartProject(engagement: { id: ".eq.${engagementId}" }) { ${fieldStr} } }`;

    const data = await this.graphqlRead.rawQuery(query, pageNumber, pageSize);
    const rawItems = (data['SmeMartProject'] as Record<string, unknown>[]) ?? [];

    // Flatten nested link: { engagement: { id: "..." } } → { engagement: "..." }
    const items = rawItems.map(gql => {
      const flat = { ...gql };
      if (flat['engagement'] && typeof flat['engagement'] === 'object') {
        flat['engagement'] = (flat['engagement'] as Record<string, unknown>)['id'];
      }
      return mapGqlToNeon<SmeMartProject>(flat as any, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon);
    });

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
   * Push a SmeMartProject to Pipeline (full replace — all fields).
   * Fire-and-forget — caller returns optimistic result.
   */
  private pushToGql(project: SmeMartProject): void {
    const gqlData = mapNeonToGql<Record<string, unknown>>(
      project,
      SME_MART_PROJECT_FIELD_MAPPING.neonToGql,
    );
    this.pipelineWrite.pushEntity('SmeMartProject', gqlData).catch(err => {
      console.error('[ProjectService] Failed to push project:', err);
    });
  }

  private generateUUID(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
