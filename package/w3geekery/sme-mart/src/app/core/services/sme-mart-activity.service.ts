import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { SmeMartWorkflowService } from './sme-mart-workflow.service';
import { SME_MART_ACTIVITY_FIELD_MAPPING, SME_MART_WORKFLOW_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type {
  SmeMartActivity,
  CreateSmeMartActivityRequest,
  UpdateSmeMartActivityRequest,
  SmeMartWorkflow,
} from '../models';
import type { GqlSmeMartActivityResponse, GqlSmeMartWorkflowResponse } from '../gql-types';

/**
 * SmeMartActivityService - Project Bloom Phase 6
 *
 * CRUD + relationship methods for SmeMartActivity entities.
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */
@Injectable({ providedIn: 'root' })
export class SmeMartActivityService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly workflowService = inject(SmeMartWorkflowService, { optional: true });

  private readonly activityFields = [
    'id',
    'name',
    'type',
    'workflowId',
    'customFields',
    'createdAt',
    'updatedAt',
  ];

  /**
   * Create a new SmeMartActivity and push to Pipeline.
   * Returns optimistic SmeMartActivity immediately.
   */
  async createActivity(data: CreateSmeMartActivityRequest): Promise<SmeMartActivity> {
    const now = new Date().toISOString();
    const activityId = this.generateUUID();

    const gqlData: Record<string, unknown> = {
      id: activityId,
      name: data.name,
      type: data.type,
      workflowId: data.workflowId,
      customFields: data.customFields ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.pipelineWrite.pushEntity('SmeMartActivity', gqlData).catch(err => {
      console.error('[ActivityService] Failed to push activity:', err);
    });

    return {
      id: activityId,
      name: data.name,
      type: data.type,
      workflowId: data.workflowId,
      customFields: data.customFields ?? [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Fetch a single activity by ID.
   */
  async getActivity(id: string): Promise<SmeMartActivity | null> {
    const activity = await this.graphqlRead.getById<GqlSmeMartActivityResponse>(
      'SmeMartActivity',
      id,
      this.activityFields,
    );

    if (!activity) return null;

    return mapGqlToNeon<SmeMartActivity>(activity, SME_MART_ACTIVITY_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * List all activities with pagination.
   */
  async listActivities(options?: QueryOptions): Promise<PagedResults<SmeMartActivity>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlSmeMartActivityResponse>(
      'SmeMartActivity',
      this.activityFields,
      gqlOptions,
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<SmeMartActivity>(gql, SME_MART_ACTIVITY_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }

  /**
   * Update an activity and push changes to Pipeline.
   * Returns updated activity optimistically.
   */
  async updateActivity(
    id: string,
    changes: UpdateSmeMartActivityRequest,
  ): Promise<SmeMartActivity> {
    // Check write-through cache first (avoids GQL round-trip on rapid edits)
    const cached = this.pipelineWrite.getCached('SmeMartActivity', id);
    const existing = cached
      ? mapGqlToNeon<SmeMartActivity>(cached, SME_MART_ACTIVITY_FIELD_MAPPING.gqlToNeon)
      : await this.getActivity(id);
    if (!existing) {
      throw new Error(`Activity ${id} not found`);
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...changes,
      updatedAt: now,
    };

    const gqlData: Record<string, unknown> = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      workflowId: updated.workflowId,
      customFields: updated.customFields,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    this.pipelineWrite.pushEntity('SmeMartActivity', gqlData).catch(err => {
      console.error('[ActivityService] Failed to push activity update:', err);
    });

    return updated;
  }

  /**
   * Delete an activity and push deletion to Pipeline.
   */
  async deleteActivity(id: string): Promise<void> {
    this.pipelineWrite.deleteEntity('SmeMartActivity', id).catch(err => {
      console.error('[ActivityService] Failed to delete activity:', err);
    });
  }

  /**
   * Get the workflow for an activity.
   * Fetches the workflow by activity's workflowId reference.
   */
  async getActivityWorkflow(activityId: string): Promise<SmeMartWorkflow | null> {
    const activity = await this.getActivity(activityId);
    console.log('[getActivityWorkflow] activity:', activity);
    if (!activity?.workflowId) return null;

    // If workflowService is injected, use it; otherwise query directly
    if (this.workflowService) {
      return this.workflowService.getWorkflow(activity.workflowId);
    }

    // Fallback: query workflow directly
    const workflowFields = ['id', 'name', 'statuses', 'transitions', 'createdAt', 'updatedAt'];
    const workflow = await this.graphqlRead.getById<GqlSmeMartWorkflowResponse>(
      'SmeMartWorkflow',
      activity.workflowId,
      workflowFields,
    );

    console.log('[getActivityWorkflow] workflow:', workflow);
    if (!workflow) return null;

    const mapped = mapGqlToNeon<SmeMartWorkflow>(workflow, SME_MART_WORKFLOW_FIELD_MAPPING.gqlToNeon);
    console.log('[getActivityWorkflow] mapped:', mapped);
    return mapped;
  }

  private generateUUID(): string {
    return `activity-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
