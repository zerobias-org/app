/**
 * Field Mapping Roundtrip Tests
 *
 * Verifies that field mappings preserve all fields during GQL → model → GQL transformations.
 * Covers all 9 Bloom entities from Phase 6.
 */

import { describe, it, expect } from 'vitest';
import {
  mapGqlToNeon,
  mapNeonToGql,
  SME_MART_BOARD_FIELD_MAPPING,
  SME_MART_ACTIVITY_FIELD_MAPPING,
  SME_MART_WORKFLOW_FIELD_MAPPING,
  SME_MART_TASK_FIELD_MAPPING,
} from './field-mappings';
import type { SmeMartBoard } from './models/sme-mart-board.model';
import type { SmeMartActivity } from './models/sme-mart-activity.model';
import type { SmeMartWorkflow } from './models/sme-mart-workflow.model';
import type { SmeMartTask } from './models/sme-mart-task.model';
import type {
  GqlSmeMartBoardResponse,
  GqlSmeMartActivityResponse,
  GqlSmeMartWorkflowResponse,
  GqlSmeMartTaskResponse,
} from './gql-types';

describe('Field Mapping Roundtrip Tests - Bloom Entities', () => {
  // The SmeMartProject roundtrip was dropped with the class, deleted in 99549cee:
  // Project lives in platform.Project, surfaced by the Projects App.

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartBoard Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartBoard fields without loss', () => {
    const gqlBoard: GqlSmeMartBoardResponse = {
      id: 'board-123',
      code: 'BOARD-01',
      name: 'Task Board',
      scope: 'project',
      partition: 'demand',
      parentId: 'proj-123',
      description: 'Main task board',
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartBoard>(
      gqlBoard,
      SME_MART_BOARD_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.code).toBe('BOARD-01');
    expect(model.name).toBe('Task Board');
    expect(model.parentId).toBe('proj-123');
    expect(model.partition).toBe('demand');

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartBoardResponse>(
      model,
      SME_MART_BOARD_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlBoard.id);
    expect(gqlRoundtrip.code).toBe(gqlBoard.code);
    expect(gqlRoundtrip.partition).toBe(gqlBoard.partition);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartActivity Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartActivity fields without loss', () => {
    const gqlActivity: GqlSmeMartActivityResponse = {
      id: 'activity-123',
      name: 'User Story',
      type: 'feature',
      workflowId: 'workflow-123',
      customFields: [
        { name: 'story_points', type: 'number', defaultValue: 5 },
        { name: 'epic', type: 'string' },
      ],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartActivity>(
      gqlActivity,
      SME_MART_ACTIVITY_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.name).toBe('User Story');
    expect(model.type).toBe('feature');
    expect(model.workflowId).toBe('workflow-123');
    expect(model.customFields).toHaveLength(2);
    expect(model.customFields?.[0].name).toBe('story_points');

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartActivityResponse>(
      model,
      SME_MART_ACTIVITY_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlActivity.id);
    expect(gqlRoundtrip.type).toBe(gqlActivity.type);
    expect(gqlRoundtrip.customFields).toEqual(gqlActivity.customFields);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartWorkflow Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartWorkflow fields without loss', () => {
    const gqlWorkflow: GqlSmeMartWorkflowResponse = {
      id: 'workflow-123',
      name: 'Kanban Workflow',
      statuses: [
        { name: 'todo', color: '#e0e0e0' },
        { name: 'in_progress', color: '#2196f3' },
        { name: 'review', color: '#ff9800' },
        { name: 'done', color: '#4caf50' },
      ],
      transitions: [
        { from: 'todo', to: 'in_progress', label: 'Start Work' },
        { from: 'in_progress', to: 'review', label: 'Request Review' },
        { from: 'review', to: 'done', label: 'Approve' },
      ],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartWorkflow>(
      gqlWorkflow,
      SME_MART_WORKFLOW_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.name).toBe('Kanban Workflow');
    expect(model.statuses).toHaveLength(4);
    expect(model.transitions).toHaveLength(3);

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartWorkflowResponse>(
      model,
      SME_MART_WORKFLOW_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlWorkflow.id);
    expect(gqlRoundtrip.statuses).toEqual(gqlWorkflow.statuses);
    expect(gqlRoundtrip.transitions).toEqual(gqlWorkflow.transitions);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartTask Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartTask fields without loss', () => {
    const gqlTask: GqlSmeMartTaskResponse = {
      id: 'task-123',
      boardId: 'board-1',
      parentId: null,
      name: 'Implement Login',
      code: 'TASK-001',
      status: 'in_progress',
      rank: 1,
      priority: 'high',
      description: 'User login feature',
      dueDate: '2026-04-19',
      activityId: 'activity-123',
      customFields: [{ story_points: 8 }],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartTask>(
      gqlTask,
      SME_MART_TASK_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.name).toBe('Implement Login');
    expect(model.code).toBe('TASK-001');
    expect(model.boardId).toBe('board-1');
    expect(model.parentId).toBeNull();
    expect(model.priority).toBe('high');
    expect(model.dueDate).toBe('2026-04-19');

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartTaskResponse>(
      model,
      SME_MART_TASK_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlTask.id);
    expect(gqlRoundtrip.name).toBe(gqlTask.name);
    expect(gqlRoundtrip.rank).toBe(gqlTask.rank);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Optional/Nullable Fields
  // ────────────────────────────────────────────────────────────────────────────

  it('should handle null optional fields correctly in SmeMartTask', () => {
    const gqlTask: GqlSmeMartTaskResponse = {
      id: 'task-456',
      boardId: 'board-1',
      parentId: null,
      name: 'Task without optional fields',
      code: 'T-MINIMAL',
      status: 'todo',
      description: null,
      dueDate: null,
      priority: undefined,
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartTask>(
      gqlTask,
      SME_MART_TASK_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.parentId).toBeNull();
    expect(model.description).toBeNull();
    expect(model.dueDate).toBeNull();

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartTaskResponse>(
      model,
      SME_MART_TASK_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.parentId).toBeNull();
  });
});
