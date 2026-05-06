import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { SME_MART_BOARD_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type {
  SmeMartBoard,
  CreateSmeMartBoardRequest,
  UpdateSmeMartBoardRequest,
  SmeMartActivity,
} from '../models';
import type { GqlSmeMartBoardResponse, GqlSmeMartActivityResponse } from '../gql-types';

/**
 * SmeMartBoardService - Project Bloom Phase 6
 *
 * CRUD + relationship methods for SmeMartBoard container entities.
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */
@Injectable({ providedIn: 'root' })
export class SmeMartBoardService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly demoVisibility = inject(DemoVisibilityService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly boardFields = [
    'id',
    'code',
    'name',
    'scope',
    'partition',
    'parentId',
    'description',
    'createdAt',
    'updatedAt',
    'tag',
  ];

  /**
   * Create a new SmeMartBoard and push to Pipeline.
   * Returns optimistic SmeMartBoard immediately.
   */
  async createBoard(data: CreateSmeMartBoardRequest): Promise<SmeMartBoard> {
    const now = new Date().toISOString();
    const boardId = this.generateUUID();

    const gqlData: Record<string, unknown> = {
      id: boardId,
      code: data.code,
      name: data.name,
      scope: data.scope,
      partition: data.partition,
      parentId: data.parentId,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.pipelineWrite.pushEntity('SmeMartBoard', gqlData, [], 'sme-mart-board.service:59');
    } catch (err) {
      this.snackBar.open(
        `Failed to create board: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return {
      id: boardId,
      code: data.code,
      name: data.name,
      scope: data.scope,
      partition: data.partition,
      parentId: data.parentId,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Fetch a single board by ID.
   */
  async getBoard(id: string): Promise<SmeMartBoard | null> {
    const board = await this.graphqlRead.getById<GqlSmeMartBoardResponse>(
      'SmeMartBoard',
      id,
      this.boardFields,
    );

    if (!board) return null;

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filtered = this.demoVisibility.applyVisibility(
      [board as GqlSmeMartBoardResponse & { tag?: Array<{ value: string }> | null }],
    )[0] ?? null;
    if (!filtered) return null;

    return mapGqlToNeon<SmeMartBoard>(filtered, SME_MART_BOARD_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * List all boards with pagination.
   */
  async listBoards(options?: QueryOptions): Promise<PagedResults<SmeMartBoard>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlSmeMartBoardResponse>(
      'SmeMartBoard',
      this.boardFields,
      gqlOptions,
    );

    // DG-02/DG-03: Client-side demo-visibility post-filter (admin bypasses; per Option X, Decision-Probe-1 2026-05-01)
    const filteredGql = this.demoVisibility.applyVisibility(
      result.items as (GqlSmeMartBoardResponse & { tag?: Array<{ value: string }> | null })[],
    );

    const items = filteredGql.map(gql =>
      mapGqlToNeon<SmeMartBoard>(gql, SME_MART_BOARD_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }

  /**
   * Update a board and push changes to Pipeline.
   * Returns updated board optimistically.
   */
  async updateBoard(
    id: string,
    changes: UpdateSmeMartBoardRequest,
  ): Promise<SmeMartBoard> {
    // Check write-through cache first (avoids GQL round-trip on rapid edits)
    const cached = this.pipelineWrite.getCached('SmeMartBoard', id);
    const existing = cached
      ? mapGqlToNeon<SmeMartBoard>(cached, SME_MART_BOARD_FIELD_MAPPING.gqlToNeon)
      : await this.getBoard(id);
    if (!existing) {
      throw new Error(`Board ${id} not found`);
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      ...changes,
      updatedAt: now,
    };

    const gqlData: Record<string, unknown> = {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      scope: updated.scope,
      partition: updated.partition,
      parentId: updated.parentId,
      description: updated.description,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    try {
      await this.pipelineWrite.pushEntity('SmeMartBoard', gqlData, [], 'sme-mart-board.service:160');
    } catch (err) {
      this.snackBar.open(
        `Failed to update board: ${(err as Error).message}`,
        'Dismiss',
        { duration: 5000 },
      );
      throw err;
    }

    return updated;
  }

  /**
   * Delete a board and push deletion to Pipeline.
   */
  async deleteBoard(id: string): Promise<void> {
    this.pipelineWrite.deleteEntity('SmeMartBoard', id).catch(err => {
      console.error('[BoardService] Failed to delete board:', err);
    });
  }

  /**
   * Get all activities for a board.
   * (Exact relationship TBD from schema—using placeholder)
   */
  async getBoardActivities(boardId: string): Promise<SmeMartActivity[]> {
    const activityFields = [
      'id',
      'name',
      'type',
      'workflowId',
      'customFields',
      'createdAt',
      'updatedAt',
    ];

    const gqlOptions: GqlQueryOptions = {
      // TODO: Confirm exact relationship field name after schema review
      filters: { boardId: `.eq.${boardId}` },
      pageSize: 1000,
    };

    const result = await this.graphqlRead.query<GqlSmeMartActivityResponse>(
      'SmeMartActivity',
      activityFields,
      gqlOptions,
    );

    return result.items.map(gql =>
      mapGqlToNeon<SmeMartActivity>(gql, { /* use ACTIVITY_FIELD_MAPPING */ } as Parameters<typeof mapGqlToNeon>[1]),
    );
  }

  private generateUUID(): string {
    return `board-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
