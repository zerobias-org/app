import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { SME_MART_WORKFLOW_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type {
  SmeMartWorkflow,
  CreateSmeMartWorkflowRequest,
  UpdateSmeMartWorkflowRequest,
} from '../models';
import type { GqlSmeMartWorkflowResponse } from '../gql-types';

/**
 * SmeMartWorkflowService - Project Bloom Phase 6
 *
 * CRUD methods for SmeMartWorkflow entities.
 * Workflows define statuses and transitions for activities.
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */
@Injectable({ providedIn: 'root' })
export class SmeMartWorkflowService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  private readonly workflowFields = [
    'id',
    'name',
    'statuses',
    'transitions',
    'createdAt',
    'updatedAt',
  ];

  /**
   * Create a new SmeMartWorkflow and push to Pipeline.
   * Returns optimistic SmeMartWorkflow immediately.
   */
  async createWorkflow(data: CreateSmeMartWorkflowRequest): Promise<SmeMartWorkflow> {
    const now = new Date().toISOString();
    const workflowId = this.generateUUID();

    const gqlData: Record<string, unknown> = {
      id: workflowId,
      name: data.name,
      statuses: data.statuses ?? [],
      transitions: data.transitions ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.pipelineWrite.pushEntity('SmeMartWorkflow', gqlData).catch(err => {
      console.error('[WorkflowService] Failed to push workflow:', err);
    });

    return {
      id: workflowId,
      name: data.name,
      statuses: data.statuses ?? [],
      transitions: data.transitions ?? [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Fetch a single workflow by ID.
   */
  async getWorkflow(id: string): Promise<SmeMartWorkflow | null> {
    const workflow = await this.graphqlRead.getById<GqlSmeMartWorkflowResponse>(
      'SmeMartWorkflow',
      id,
      this.workflowFields,
    );

    if (!workflow) return null;

    return mapGqlToNeon<SmeMartWorkflow>(workflow, SME_MART_WORKFLOW_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * List all workflows with pagination.
   */
  async listWorkflows(options?: QueryOptions): Promise<PagedResults<SmeMartWorkflow>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlSmeMartWorkflowResponse>(
      'SmeMartWorkflow',
      this.workflowFields,
      gqlOptions,
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<SmeMartWorkflow>(gql, SME_MART_WORKFLOW_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }

  /**
   * Update a workflow and push changes to Pipeline.
   * Returns updated workflow optimistically.
   */
  async updateWorkflow(
    id: string,
    changes: UpdateSmeMartWorkflowRequest,
  ): Promise<SmeMartWorkflow> {
    // Check write-through cache first (avoids GQL round-trip on rapid edits)
    const cached = this.pipelineWrite.getCached('SmeMartWorkflow', id);
    const existing = cached
      ? mapGqlToNeon<SmeMartWorkflow>(cached, SME_MART_WORKFLOW_FIELD_MAPPING.gqlToNeon)
      : await this.getWorkflow(id);
    if (!existing) {
      throw new Error(`Workflow ${id} not found`);
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
      statuses: updated.statuses,
      transitions: updated.transitions,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    this.pipelineWrite.pushEntity('SmeMartWorkflow', gqlData).catch(err => {
      console.error('[WorkflowService] Failed to push workflow update:', err);
    });

    return updated;
  }

  /**
   * Delete a workflow and push deletion to Pipeline.
   */
  async deleteWorkflow(id: string): Promise<void> {
    this.pipelineWrite.deleteEntity('SmeMartWorkflow', id).catch(err => {
      console.error('[WorkflowService] Failed to delete workflow:', err);
    });
  }

  private generateUUID(): string {
    return `workflow-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
