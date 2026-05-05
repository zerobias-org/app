/**
 * Unit Tests for SmeMartTaskService
 *
 * Tests CRUD operations, tree rebuild algorithm, and cycle detection.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SmeMartTaskService } from './sme-mart-task.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { ImpersonationService } from './impersonation.service';
import { fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlSmeMartTaskResponse } from '../gql-types/sme-mart-task.types';

type MockFn = ReturnType<typeof vi.fn>;

interface MockPipelineWrite {
  pushEntity: MockFn;
  pushEntities: MockFn;
  deleteEntity: MockFn;
  deleteEntities: MockFn;
  getCached: MockFn;
  seedCache: MockFn;
}

interface MockGraphqlRead {
  query: MockFn;
  getById: MockFn;
}

interface MockImpersonation {
  effectiveUserId: MockFn;
}

describe('SmeMartTaskService', () => {
  let service: SmeMartTaskService;
  let mockPipelineWrite: MockPipelineWrite;
  let mockGraphqlRead: MockGraphqlRead;
  let mockImpersonation: MockImpersonation;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    mockPipelineWrite = {
      pushEntity: vi.fn().mockResolvedValue(undefined),
      pushEntities: vi.fn().mockResolvedValue(undefined),
      deleteEntity: vi.fn().mockResolvedValue(undefined),
      deleteEntities: vi.fn().mockResolvedValue(undefined),
      getCached: vi.fn().mockReturnValue(null),
      seedCache: vi.fn(),
    };
    mockGraphqlRead = {
      query: vi.fn().mockResolvedValue({ items: [], page: { totalCount: 0 } }),
      getById: vi.fn().mockResolvedValue(null),
    };
    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('user-123'),
    };
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false); // non-admin by default

    TestBed.configureTestingModule({
      providers: [
        SmeMartTaskService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(SmeMartTaskService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // createTask
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a task and push to pipeline with await', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.createTask({
      boardId: 'board-1',
      name: 'Task 1',
      code: 'T1',
      status: 'todo',
    });

    expect(result).toBeDefined();
    expect(result.boardId).toBe('board-1');
    expect(result.name).toBe('Task 1');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'SmeMartTask',
      expect.objectContaining({ boardId: 'board-1', name: 'Task 1', code: 'T1' }),
      [],
      'sme-mart-task.service:82',
    );
  });

  it('should surface error to user on Pipeline rejection in createTask', async () => {
    const mockError = new Error('Save failed');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(
      service.createTask({
        boardId: 'board-1',
        name: 'Task 1',
        code: 'T1',
      })
    ).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to save task'),
      'Dismiss',
      expect.any(Object),
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getTask
  // ────────────────────────────────────────────────────────────────────────────

  it('should fetch a single task by ID', async () => {
    const gqlTask: GqlSmeMartTaskResponse = {
      id: 'task-1',
      boardId: 'board-1',
      parentId: null,
      name: 'Task 1',
      code: 'T1',
      status: 'todo',
      rank: 1,
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    mockGraphqlRead.getById.mockResolvedValue(gqlTask);

    const result = await service.getTask('task-1');

    expect(result).toBeDefined();
    expect(result?.id).toBe('task-1');
    expect(result?.name).toBe('Task 1');
    expect(mockGraphqlRead.getById).toHaveBeenCalledWith('SmeMartTask', 'task-1', expect.any(Array));
  });

  it('should return null if task not found', async () => {
    mockGraphqlRead.getById.mockResolvedValue(null);

    const result = await service.getTask('nonexistent');

    expect(result).toBeNull();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // listTasks
  // ────────────────────────────────────────────────────────────────────────────

  it('should list tasks for a board', async () => {
    const gqlTasks: GqlSmeMartTaskResponse[] = [
      {
        id: 'task-1',
        boardId: 'board-1',
        parentId: null,
        name: 'Task 1',
        code: 'T1',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: 'task-2',
        boardId: 'board-1',
        parentId: null,
        name: 'Task 2',
        code: 'T2',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: gqlTasks,
      page: { pageNumber: 1, pageSize: 50, totalCount: 2 },
    });

    const result = await service.listTasks('board-1');

    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('Task 1');
    expect(result.items[1].name).toBe('Task 2');
    expect(mockGraphqlRead.query).toHaveBeenCalledWith('SmeMartTask', expect.any(Array), expect.objectContaining({
      filters: { boardId: '.eq.board-1' },
    }));
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getTaskTree
  // ────────────────────────────────────────────────────────────────────────────

  it('should rebuild task tree from flat list with 3 levels deep', async () => {
    const flatTasks: GqlSmeMartTaskResponse[] = [
      {
        id: '1',
        parentId: null,
        name: 'Root',
        rank: 1,
        boardId: 'board-1',
        code: 'T1',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: '2',
        parentId: '1',
        name: 'Subtask 1',
        rank: 1,
        boardId: 'board-1',
        code: 'T2',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: '3',
        parentId: '1',
        name: 'Subtask 2',
        rank: 2,
        boardId: 'board-1',
        code: 'T3',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: '4',
        parentId: '2',
        name: 'Sub-subtask',
        rank: 1,
        boardId: 'board-1',
        code: 'T4',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: flatTasks,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
    });

    const tree = await service.getTaskTree('board-1');

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![0].id).toBe('2');
    expect(tree[0].children![0].children).toHaveLength(1);
    expect(tree[0].children![0].children![0].id).toBe('4');
    expect(tree[0].children![1].id).toBe('3');
    expect(tree[0].children![1].children).toBeUndefined();
  });

  it('should sort tree nodes by rank', async () => {
    const flatTasks: GqlSmeMartTaskResponse[] = [
      {
        id: '1',
        parentId: null,
        name: 'Root',
        rank: 1,
        boardId: 'board-1',
        code: 'T1',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: '2',
        parentId: '1',
        name: 'Subtask B',
        rank: 2,
        boardId: 'board-1',
        code: 'T2',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: '3',
        parentId: '1',
        name: 'Subtask A',
        rank: 1,
        boardId: 'board-1',
        code: 'T3',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: flatTasks,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 3 },
    });

    const tree = await service.getTaskTree('board-1');

    expect(tree[0].children![0].name).toBe('Subtask A'); // rank 1
    expect(tree[0].children![1].name).toBe('Subtask B'); // rank 2
  });

  it('should detect cycles and prevent infinite recursion', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    // Create a cycle: task 1 → 2 → 1
    const flatTasks: GqlSmeMartTaskResponse[] = [
      {
        id: '1',
        parentId: '2',
        name: 'Task 1',
        rank: 1,
        boardId: 'board-1',
        code: 'T1',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: '2',
        parentId: '1',
        name: 'Task 2',
        rank: 1,
        boardId: 'board-1',
        code: 'T2',
        status: 'todo',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: flatTasks,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 2 },
    });

    await service.getTaskTree('board-1');

    // Should detect cycle and warn
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching('Cycle detected'),
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateTask
  // ────────────────────────────────────────────────────────────────────────────

  it('should update a task and push to pipeline', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.updateTask('task-1', {
      name: 'Updated Task',
      status: 'in_progress',
    });

    expect(result.name).toBe('Updated Task');
    expect(result.status).toBe('in_progress');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'SmeMartTask',
      expect.objectContaining({ id: 'task-1', name: 'Updated Task' }),
      [],
      'sme-mart-task.service:257',
    );
  });

  it('should surface error to user on Pipeline rejection in updateTask', async () => {
    const mockError = new Error('Update failed');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(
      service.updateTask('task-1', { name: 'Updated Task' })
    ).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update task'),
      'Dismiss',
      expect.any(Object),
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // deleteTask
  // ────────────────────────────────────────────────────────────────────────────

  it('should delete a task via pipeline', async () => {
    mockPipelineWrite.deleteEntity.mockResolvedValue(undefined);

    await service.deleteTask('task-1');

    expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartTask', 'task-1');
  });

  it('should surface error to user on Pipeline rejection in deleteTask', async () => {
    const mockError = new Error('Delete failed');
    mockPipelineWrite.deleteEntity.mockRejectedValueOnce(mockError);

    await expect(service.deleteTask('task-1')).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete task'),
      'Dismiss',
      expect.any(Object),
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Demo visibility (Phase 24 Plan 03)
  // ────────────────────────────────────────────────────────────────────────────

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const baseTask = {
      boardId: 'board-1', parentId: null, name: 'Task', code: 'T', status: 'todo',
      rank: 0, priority: null, description: null, dueDate: null, activityId: null,
      customFields: [], createdAt: '2026-05-05T00:00:00Z', updatedAt: '2026-05-05T00:00:00Z',
    };
    const mockGqlReturn = [
      { ...baseTask, id: '1', name: 'Real', tag: null },
      { ...baseTask, id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...baseTask, id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...baseTask, id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listTasks('board-1');

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listTasks('board-1');

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listTasks('board-1');

      const callArgs = mockGraphqlRead.query.mock.calls[0];
      const filters = (callArgs[2] as { filters?: Record<string, string> })?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listTasks('board-1');

      const fields = mockGraphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoRecord = { ...baseTask, id: '3', name: 'Demo', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] };
      mockGraphqlRead.getById.mockResolvedValueOnce(demoRecord);

      const result = await service.getTask('3');

      expect(result).toBeNull();
    });
  });
});
