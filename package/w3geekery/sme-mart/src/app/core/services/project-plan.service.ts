/**
 * ProjectPlanService - Project Plan Management
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Manages both ProjectPlan parent entities and PlanMilestone child entities.
 */

import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { PROJECT_PLAN_FIELD_MAPPING, PLAN_MILESTONE_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { GqlProjectPlanResponse, GqlPlanMilestoneResponse } from '../gql-types/project-plan.types';
import type {
  ProjectPlan,
  PlanMilestone,
  CreateProjectPlanRequest,
  UpdateProjectPlanRequest,
  CreatePlanMilestoneRequest,
  UpdatePlanMilestoneRequest,
} from '../models/project-plan.model';
import { PagedResults } from '@zerobias-org/types-core-js';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ProjectPlanService manages ProjectPlan and PlanMilestone entities.
 *
 * Architecture:
 * - Query: GraphQL fetches entities with optional filtering
 * - Write: Pipeline pushes individual entity changes (create/update/delete)
 * - Optimistic: Returns immediately, pushes in background
 *
 * Parent-child relationship: ProjectPlan.id → PlanMilestone.parentId
 */
@Injectable({ providedIn: 'root' })
export class ProjectPlanService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPlan CRUD Methods
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Create a new ProjectPlan.
   *
   * Returns optimistically (immediately) while Pipeline push happens in background.
   */
  async createPlan(request: CreateProjectPlanRequest): Promise<ProjectPlan> {
    const now = new Date().toISOString();

    // Build GQL data (camelCase for GraphQL)
    const gqlData: Record<string, unknown> = {
      id: this.generateUUID(),
      parentId: request.parentId,
      title: request.title,
      approach: request.approach ?? null,
      estimatedDuration: request.estimatedDuration ?? null,
      teamStructure: request.teamStructure ?? {},
      createdAt: now,
      updatedAt: now,
    };

    // Map to model type (camelCase — greenfield)
    const modelData = mapGqlToNeon<ProjectPlan>(
      gqlData,
      PROJECT_PLAN_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push to Pipeline
    this.pipelineWrite.pushEntity('ProjectPlan', gqlData).catch(err => {
      console.error('[ProjectPlanService] Failed to push plan to pipeline:', err);
    });

    // Return optimistically
    return modelData;
  }

  /**
   * Get a single ProjectPlan by ID.
   */
  async getPlan(id: string): Promise<ProjectPlan | null> {
    const plan = await this.graphqlRead.getById<GqlProjectPlanResponse>(
      'ProjectPlan',
      id,
      ['id', 'parentId', 'title', 'approach', 'estimatedDuration', 'teamStructure', 'createdAt', 'updatedAt'],
    );

    if (!plan) return null;

    return mapGqlToNeon<ProjectPlan>(
      plan,
      PROJECT_PLAN_FIELD_MAPPING.gqlToNeon,
    );
  }

  /**
   * List all ProjectPlans for a project with optional pagination.
   */
  async listPlans(
    projectId: string,
    options?: { pageNumber?: number; pageSize?: number },
  ): Promise<PagedResults<ProjectPlan>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const result = await this.graphqlRead.query<GqlProjectPlanResponse>(
      'ProjectPlan',
      ['id', 'parentId', 'title', 'approach', 'estimatedDuration', 'teamStructure', 'createdAt', 'updatedAt'],
      {
        filters: { parentId: `.eq.${projectId}` },
        pageNumber,
        pageSize,
      },
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<ProjectPlan>(gql, PROJECT_PLAN_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(
      items,
      pageNumber,
      pageSize,
      result.page.totalCount ?? items.length,
    );
  }

  /**
   * Update an existing ProjectPlan.
   *
   * Returns optimistically while Pipeline push happens in background.
   */
  async updatePlan(
    planId: string,
    changes: UpdateProjectPlanRequest,
  ): Promise<ProjectPlan> {
    const now = new Date().toISOString();

    // Build GQL data with updated fields
    const gqlData: Record<string, unknown> = {
      id: planId,
      updatedAt: now,
      ...Object.entries(changes).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>),
    };

    // Map to model type
    const modelData = mapGqlToNeon<ProjectPlan>(
      gqlData,
      PROJECT_PLAN_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    this.pipelineWrite.pushEntity('ProjectPlan', gqlData).catch(err => {
      console.error('[ProjectPlanService] Failed to push plan update to pipeline:', err);
    });

    // Return optimistically
    return modelData;
  }

  /**
   * Delete a ProjectPlan by marking it deleted in the pipeline.
   *
   * Returns immediately while Pipeline delete happens in background.
   */
  async deletePlan(planId: string): Promise<void> {
    // Fire-and-forget delete
    this.pipelineWrite.deleteEntity('ProjectPlan', planId).catch(err => {
      console.error('[ProjectPlanService] Failed to delete plan:', err);
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PlanMilestone CRUD Methods (Child Entities)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Create a new PlanMilestone within a ProjectPlan.
   */
  async createMilestone(
    planId: string,
    request: CreatePlanMilestoneRequest,
  ): Promise<PlanMilestone> {
    const now = new Date().toISOString();

    // Build GQL data
    const gqlData: Record<string, unknown> = {
      id: this.generateUUID(),
      parentId: planId,
      name: request.name,
      targetDate: request.targetDate ?? null,
      status: request.status ?? 'todo',
      sortOrder: request.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    // Map to model type
    const modelData = mapGqlToNeon<PlanMilestone>(
      gqlData,
      PLAN_MILESTONE_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    this.pipelineWrite.pushEntity('PlanMilestone', gqlData).catch(err => {
      console.error('[ProjectPlanService] Failed to push milestone to pipeline:', err);
    });

    // Return optimistically
    return modelData;
  }

  /**
   * Get all PlanMilestones for a ProjectPlan.
   */
  async getMilestones(planId: string): Promise<PlanMilestone[]> {
    const result = await this.graphqlRead.query<GqlPlanMilestoneResponse>(
      'PlanMilestone',
      ['id', 'parentId', 'name', 'targetDate', 'status', 'sortOrder', 'createdAt', 'updatedAt'],
      {
        filters: { parentId: `.eq.${planId}` },
        pageSize: 1000, // Fetch all milestones for this plan
      },
    );

    return result.items.map(gql =>
      mapGqlToNeon<PlanMilestone>(gql, PLAN_MILESTONE_FIELD_MAPPING.gqlToNeon),
    );
  }

  /**
   * Update an existing PlanMilestone.
   */
  async updateMilestone(
    milestoneId: string,
    changes: UpdatePlanMilestoneRequest,
  ): Promise<PlanMilestone> {
    const now = new Date().toISOString();

    // Build GQL data
    const gqlData: Record<string, unknown> = {
      id: milestoneId,
      updatedAt: now,
      ...Object.entries(changes).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>),
    };

    // Map to model type
    const modelData = mapGqlToNeon<PlanMilestone>(
      gqlData,
      PLAN_MILESTONE_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    this.pipelineWrite.pushEntity('PlanMilestone', gqlData).catch(err => {
      console.error('[ProjectPlanService] Failed to push milestone update to pipeline:', err);
    });

    // Return optimistically
    return modelData;
  }

  /**
   * Delete a PlanMilestone by marking it deleted in the pipeline.
   */
  async deleteMilestone(milestoneId: string): Promise<void> {
    // Fire-and-forget delete
    this.pipelineWrite.deleteEntity('PlanMilestone', milestoneId).catch(err => {
      console.error('[ProjectPlanService] Failed to delete milestone:', err);
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
