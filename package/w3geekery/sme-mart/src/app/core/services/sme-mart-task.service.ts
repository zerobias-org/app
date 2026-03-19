/**
 * SmeMartTaskService - Task Hierarchy Management
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Implements flat-fetch + tree rebuild pattern for hierarchical task management.
 * Includes cycle detection to prevent infinite recursion on malformed data.
 */

import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { SME_MART_TASK_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { GqlSmeMartTaskResponse } from '../gql-types/sme-mart-task.types';
import type {
  SmeMartTask,
  SmeMartTaskTreeNode,
  CreateSmeMartTaskRequest,
  UpdateSmeMartTaskRequest,
} from '../models/sme-mart-task.model';
import { PagedResults } from '@zerobias-org/types-core-js';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SmeMartTaskService manages task creation, updates, deletion, and hierarchical queries.
 *
 * Architecture: Flat-fetch + client-side tree rebuild
 * - Query: GraphQL fetches all SmeMartTasks for a board in one call (flat list)
 * - Build: Client-side algorithm rebuilds parent-child tree from parentId mapping
 * - Write: Pipeline pushes individual task changes (create/update/delete)
 *
 * Benefits:
 * - Avoids N+1 queries (single GraphQL call returns all tasks)
 * - Handles unlimited hierarchy depth (no recursive GQL depth limits)
 * - Cycle detection prevents infinite recursion if data is malformed
 * - Optimistic updates for better UX (return immediately, push in background)
 */
@Injectable({ providedIn: 'root' })
export class SmeMartTaskService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);

  /**
   * Create a new task.
   *
   * Returns optimistically (immediately) while Pipeline push happens in background.
   */
  async createTask(request: CreateSmeMartTaskRequest): Promise<SmeMartTask> {
    const now = new Date().toISOString();

    // Build GQL data (camelCase for GraphQL)
    const gqlData: Record<string, unknown> = {
      id: this.generateUUID(),
      boardId: request.boardId,
      name: request.name,
      code: request.code,
      status: request.status ?? 'todo',
      parentId: request.parentId ?? null,
      rank: request.rank ?? 0,
      priority: request.priority ?? null,
      description: request.description ?? null,
      dueDate: request.dueDate ?? null,
      activityId: request.activityId ?? null,
      customFields: request.customFields ?? [],
      createdAt: now,
      updatedAt: now,
    };

    // Map to model type (camelCase — greenfield)
    const modelData = mapGqlToNeon<SmeMartTask>(
      gqlData,
      SME_MART_TASK_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push to Pipeline
    this.pipelineWrite.pushEntity('SmeMartTask', gqlData).catch(err => {
      console.error('[SmeMartTaskService] Failed to push task to pipeline:', err);
    });

    // Return optimistically
    return modelData;
  }

  /**
   * Get a single task by ID.
   */
  async getTask(id: string): Promise<SmeMartTask | null> {
    const task = await this.graphqlRead.getById<GqlSmeMartTaskResponse>(
      'SmeMartTask',
      id,
      ['id', 'boardId', 'parentId', 'name', 'code', 'status', 'rank', 'priority',
       'description', 'dueDate', 'activityId', 'customFields', 'createdAt', 'updatedAt'],
    );

    if (!task) return null;

    return mapGqlToNeon<SmeMartTask>(
      task,
      SME_MART_TASK_FIELD_MAPPING.gqlToNeon,
    );
  }

  /**
   * List all tasks for a board with optional pagination.
   */
  async listTasks(
    boardId: string,
    options?: { pageNumber?: number; pageSize?: number },
  ): Promise<PagedResults<SmeMartTask>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const result = await this.graphqlRead.query<GqlSmeMartTaskResponse>(
      'SmeMartTask',
      ['id', 'boardId', 'parentId', 'name', 'code', 'status', 'rank', 'priority',
       'description', 'dueDate', 'activityId', 'customFields', 'createdAt', 'updatedAt'],
      {
        filters: { boardId: `.eq.${boardId}` },
        pageNumber,
        pageSize,
      },
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<SmeMartTask>(gql, SME_MART_TASK_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(
      items,
      pageNumber,
      pageSize,
      result.page.totalCount ?? items.length,
    );
  }

  /**
   * Get the hierarchical tree of tasks for a board.
   *
   * Algorithm:
   * 1. Query all SmeMartTasks for the board (flat list)
   * 2. Map GraphQL response to model type
   * 3. Rebuild parent-child tree using parentId references
   * 4. Cycle detection prevents infinite recursion on malformed data
   * 5. Return sorted tree (children sorted by rank)
   */
  async getTaskTree(boardId: string): Promise<SmeMartTaskTreeNode[]> {
    // Step 1: Query flat list of all tasks for this board
    const result = await this.graphqlRead.query<GqlSmeMartTaskResponse>(
      'SmeMartTask',
      ['id', 'boardId', 'parentId', 'name', 'code', 'status', 'rank', 'priority',
       'description', 'dueDate', 'activityId', 'customFields', 'createdAt', 'updatedAt'],
      {
        filters: { boardId: `.eq.${boardId}` },
        pageSize: 1000, // Fetch all for board
      },
    );

    // Step 2: Map all results to model type
    const allTasks: SmeMartTask[] = result.items.map(gqlTask =>
      mapGqlToNeon<SmeMartTask>(gqlTask, SME_MART_TASK_FIELD_MAPPING.gqlToNeon),
    );

    // Step 3: Build tree with cycle detection
    const taskMap = new Map<string, SmeMartTask>(
      allTasks.map(t => [t.id, t]),
    );

    const visited = new Set<string>();

    const buildNode = (task: SmeMartTask): SmeMartTaskTreeNode => {
      // Detect cycle: if we've already visited this task, skip it
      if (visited.has(task.id)) {
        console.warn(
          `[SmeMartTaskService] Cycle detected in task tree at task ${task.id}. ` +
          'Excluding subtree to prevent infinite recursion.',
        );
        return { ...task, children: [] };
      }

      visited.add(task.id);

      // Find and sort children by rank
      const children = allTasks
        .filter(t => t.parentId === task.id)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map(buildNode);

      return {
        ...task,
        children: children.length > 0 ? children : undefined,
      };
    };

    // Step 4: Return root tasks (parentId is null)
    const rootTasks = allTasks.filter(t => !t.parentId);
    return rootTasks
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map(buildNode);
  }

  /**
   * Update an existing task.
   *
   * Returns optimistically while Pipeline push happens in background.
   */
  async updateTask(
    taskId: string,
    changes: UpdateSmeMartTaskRequest,
  ): Promise<SmeMartTask> {
    const now = new Date().toISOString();

    // Build GQL data with updated fields
    const gqlData: Record<string, unknown> = {
      id: taskId,
      updatedAt: now,
      ...Object.entries(changes).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>),
    };

    // Map to model type
    const modelData = mapGqlToNeon<SmeMartTask>(
      gqlData,
      SME_MART_TASK_FIELD_MAPPING.gqlToNeon,
    );

    // Fire-and-forget push
    this.pipelineWrite.pushEntity('SmeMartTask', gqlData).catch(err => {
      console.error('[SmeMartTaskService] Failed to push task update to pipeline:', err);
    });

    // Return optimistically
    return modelData;
  }

  /**
   * Delete a task by marking it deleted in the pipeline.
   *
   * Returns immediately while Pipeline delete happens in background.
   */
  async deleteTask(taskId: string): Promise<void> {
    // Fire-and-forget delete
    this.pipelineWrite.deleteEntity('SmeMartTask', taskId).catch(err => {
      console.error('[SmeMartTaskService] Failed to delete task:', err);
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Generate a UUID v4 for new task IDs.
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
