/**
 * ProjectPrdService - PRD (Product Requirements Document) Management
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Manages both ProjectPrd parent entities and PrdSection child entities.
 */

import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { PROJECT_PRD_FIELD_MAPPING, PRD_SECTION_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { GqlProjectPrdResponse, GqlPrdSectionResponse } from '../gql-types/project-prd.types';
import type {
  ProjectPrd,
  PrdSection,
  CreateProjectPrdRequest,
  UpdateProjectPrdRequest,
  CreatePrdSectionRequest,
  UpdatePrdSectionRequest,
} from '../models/project-prd.model';
import { PagedResults } from '@zerobias-org/types-core-js';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProjectPrdService manages PRD and PrdSection entities.
 *
 * Architecture:
 * - Query: GraphQL fetches entities with optional filtering
 * - Write: Pipeline pushes individual entity changes (create/update/delete)
 * - Optimistic: Returns immediately, pushes in background
 *
 * Parent-child relationship: ProjectPrd.id → PrdSection.parentId
 */
@Injectable({ providedIn: 'root' })
export class ProjectPrdService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly snackBar = inject(MatSnackBar);

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPrd CRUD Methods
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Create a new ProjectPrd.
   *
   * Returns optimistically (immediately) while Pipeline push happens in background.
   */
  async createPrd(request: CreateProjectPrdRequest): Promise<ProjectPrd> {
    const now = new Date().toISOString();

    // Build GQL data (camelCase for GraphQL)
    const gqlData: Record<string, unknown> = {
      id: this.generateUUID(),
      parentId: request.parentId,
      title: request.title,
      summary: request.summary ?? null,
      sourceDocuments: request.sourceDocuments ?? [],
      createdAt: now,
      updatedAt: now,
    };

    // Map to model type (camelCase — greenfield)
    const modelData = mapGqlToNeon<ProjectPrd>(
      gqlData,
      PROJECT_PRD_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push to Pipeline
    try {
      await this.pipelineWrite.pushEntity('ProjectPrd', gqlData, [], 'project-prd.service:76');
    } catch (err) {
      this.snackBar.open(
        `Failed to create PRD: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // Return optimistically
    return modelData;
  }

  /**
   * Get a single ProjectPrd by ID.
   */
  async getPrd(id: string): Promise<ProjectPrd | null> {
    const prd = await this.graphqlRead.getById<GqlProjectPrdResponse>(
      'ProjectPrd',
      id,
      ['id', 'parentId', 'title', 'summary', 'sourceDocuments', 'createdAt', 'updatedAt'],
    );

    if (!prd) return null;

    return mapGqlToNeon<ProjectPrd>(
      prd,
      PROJECT_PRD_FIELD_MAPPING.gqlToNeon,
    );
  }

  /**
   * List all ProjectPrds for a project with optional pagination.
   */
  async listPrds(
    projectId: string,
    options?: { pageNumber?: number; pageSize?: number },
  ): Promise<PagedResults<ProjectPrd>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const result = await this.graphqlRead.query<GqlProjectPrdResponse>(
      'ProjectPrd',
      ['id', 'parentId', 'title', 'summary', 'sourceDocuments', 'createdAt', 'updatedAt'],
      {
        filters: { parentId: `.eq.${projectId}` },
        pageNumber,
        pageSize,
      },
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<ProjectPrd>(gql, PROJECT_PRD_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(
      items,
      pageNumber,
      pageSize,
      result.page.totalCount ?? items.length,
    );
  }

  /**
   * Update an existing ProjectPrd.
   *
   * Returns optimistically while Pipeline push happens in background.
   */
  async updatePrd(
    prdId: string,
    changes: UpdateProjectPrdRequest,
  ): Promise<ProjectPrd> {
    const now = new Date().toISOString();

    // Build GQL data with updated fields
    const gqlData: Record<string, unknown> = {
      id: prdId,
      updatedAt: now,
      ...Object.entries(changes).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>),
    };

    // Map to model type
    const modelData = mapGqlToNeon<ProjectPrd>(
      gqlData,
      PROJECT_PRD_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    try {
      await this.pipelineWrite.pushEntity('ProjectPrd', gqlData, [], 'project-prd.service:164');
    } catch (err) {
      this.snackBar.open(
        `Failed to update PRD: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // Return optimistically
    return modelData;
  }

  /**
   * Delete a ProjectPrd by marking it deleted in the pipeline.
   *
   * Returns immediately while Pipeline delete happens in background.
   */
  async deletePrd(prdId: string): Promise<void> {
    // Fire-and-forget delete
    this.pipelineWrite.deleteEntity('ProjectPrd', prdId).catch(err => {
      console.error('[ProjectPrdService] Failed to delete PRD:', err);
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PrdSection CRUD Methods (Child Entities)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Create a new PrdSection within a ProjectPrd.
   */
  async createPrdSection(
    prdId: string,
    request: CreatePrdSectionRequest,
  ): Promise<PrdSection> {
    const now = new Date().toISOString();

    // Build GQL data
    const gqlData: Record<string, unknown> = {
      id: this.generateUUID(),
      parentId: prdId,
      type: request.type,
      content: request.content ?? null,
      sortOrder: request.sortOrder ?? 0,
      sourceDocuments: request.sourceDocuments ?? [],
      createdAt: now,
      updatedAt: now,
    };

    // Map to model type
    const modelData = mapGqlToNeon<PrdSection>(
      gqlData,
      PRD_SECTION_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    try {
      await this.pipelineWrite.pushEntity('PrdSection', gqlData, [], 'project-prd.service:216');
    } catch (err) {
      this.snackBar.open(
        `Failed to create PRD section: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // Return optimistically
    return modelData;
  }

  /**
   * Get all PrdSections for a ProjectPrd.
   */
  async getPrdSections(prdId: string): Promise<PrdSection[]> {
    const result = await this.graphqlRead.query<GqlPrdSectionResponse>(
      'PrdSection',
      ['id', 'parentId', 'type', 'content', 'sortOrder', 'sourceDocuments', 'createdAt', 'updatedAt'],
      {
        filters: { parentId: `.eq.${prdId}` },
        pageSize: 1000, // Fetch all sections for this PRD
      },
    );

    return result.items.map(gql =>
      mapGqlToNeon<PrdSection>(gql, PRD_SECTION_FIELD_MAPPING.gqlToNeon),
    );
  }

  /**
   * Update an existing PrdSection.
   */
  async updatePrdSection(
    sectionId: string,
    changes: UpdatePrdSectionRequest,
  ): Promise<PrdSection> {
    const now = new Date().toISOString();

    // Build GQL data
    const gqlData: Record<string, unknown> = {
      id: sectionId,
      updatedAt: now,
      ...Object.entries(changes).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>),
    };

    // Map to model type
    const modelData = mapGqlToNeon<PrdSection>(
      gqlData,
      PRD_SECTION_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    try {
      await this.pipelineWrite.pushEntity('PrdSection', gqlData, [], 'project-prd.service:270');
    } catch (err) {
      this.snackBar.open(
        `Failed to update PRD section: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    // Return optimistically
    return modelData;
  }

  /**
   * Delete a PrdSection by marking it deleted in the pipeline.
   */
  async deletePrdSection(sectionId: string): Promise<void> {
    // Fire-and-forget delete
    this.pipelineWrite.deleteEntity('PrdSection', sectionId).catch(err => {
      console.error('[ProjectPrdService] Failed to delete section:', err);
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Generate a UUID v4 for new entity IDs.
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
