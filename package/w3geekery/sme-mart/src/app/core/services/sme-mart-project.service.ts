import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { SME_MART_PROJECT_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
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
 * SmeMartProjectService - Project Bloom Phase 6
 *
 * CRUD + relationship methods for SmeMartProject container entities.
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */
@Injectable({ providedIn: 'root' })
export class SmeMartProjectService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  private readonly projectFields = [
    'id',
    'name',
    'description',
    'status',
    'startDate',
    'targetEndDate',
    'createdAt',
    'updatedAt',
  ];

  /**
   * Create a new SmeMartProject and push to Pipeline.
   * Returns optimistic SmeMartProject immediately (doesn't wait for GQL indexing).
   */
  async createProject(data: CreateSmeMartProjectRequest): Promise<SmeMartProject> {
    const now = new Date().toISOString();
    const projectId = this.generateUUID();

    // Build GQL data (camelCase for GraphQL)
    const gqlData: Record<string, unknown> = {
      id: projectId,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? 'draft',
      startDate: data.startDate ?? now,
      targetEndDate: data.targetEndDate ?? null,
      createdAt: now,
      updatedAt: now,
    };

    // Fire-and-forget push to Pipeline
    this.pipelineWrite.pushEntity('SmeMartProject', gqlData).catch(err => {
      console.error('[ProjectService] Failed to push project:', err);
    });

    // Return optimistically
    return {
      id: projectId,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? 'draft',
      startDate: data.startDate ?? now,
      targetEndDate: data.targetEndDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Fetch a single project by ID.
   */
  async getProject(id: string): Promise<SmeMartProject | null> {
    const project = await this.graphqlRead.getById<GqlSmeMartProjectResponse>(
      'SmeMartProject',
      id,
      this.projectFields,
    );

    if (!project) return null;

    return mapGqlToNeon<SmeMartProject>(project, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * List all projects with pagination.
   */
  async listProjects(options?: QueryOptions): Promise<PagedResults<SmeMartProject>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlSmeMartProjectResponse>(
      'SmeMartProject',
      this.projectFields,
      gqlOptions,
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<SmeMartProject>(gql, SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon),
    );

    // Create PagedResults with pre-paginated items from GraphQL
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
    const existing = await this.getProject(id);
    if (!existing) {
      throw new Error(`Project ${id} not found`);
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...changes,
      updatedAt: now,
    };

    // Build GQL data for Pipeline
    const gqlData: Record<string, unknown> = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      status: updated.status,
      startDate: updated.startDate,
      targetEndDate: updated.targetEndDate,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    // Fire-and-forget push to Pipeline
    this.pipelineWrite.pushEntity('SmeMartProject', gqlData).catch(err => {
      console.error('[ProjectService] Failed to push project update:', err);
    });

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
      mapGqlToNeon<SmeMartBoard>(gql, { /* use BOARD_FIELD_MAPPING */ } as any),
    );
  }

  private generateUUID(): string {
    return `proj-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
