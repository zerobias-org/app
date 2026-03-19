/**
 * Unit Tests for SmeMartTaskService
 *
 * Tests CRUD operations, tree rebuild algorithm, and cycle detection.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmeMartTaskService } from './sme-mart-task.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import type { GqlSmeMartTaskResponse } from '../gql-types/sme-mart-task.types';
import type { SmeMartTask } from '../models/sme-mart-task.model';

describe('SmeMartTaskService', () => {
  let service: SmeMartTaskService;
  let pipelineWrite: jasmine.SpyObj<PipelineWriteService>;
  let graphqlRead: jasmine.SpyObj<GraphqlReadService>;
  let impersonation: jasmine.SpyObj<ImpersonationService>;

  beforeEach(() => {
    const pipelineWriteSpy = jasmine.createSpyObj(
      'PipelineWriteService',
      ['pushEntity', 'pushEntities', 'deleteEntity', 'deleteEntities'],
    );
    const graphqlReadSpy = jasmine.createSpyObj(
      'GraphqlReadService',
      ['query', 'getById'],
    );
    const impersonationSpy = jasmine.createSpyObj(
      'ImpersonationService',
      ['effectiveUserId'],
    );

    impersonationSpy.effectiveUserId.and.returnValue('user-123');

    TestBed.configureTestingModule({
      providers: [
        SmeMartTaskService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
        { provide: ImpersonationService, useValue: impersonationSpy },
      ],
    });

    service = TestBed.inject(SmeMartTaskService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
    impersonation = TestBed.inject(ImpersonationService) as jasmine.SpyObj<ImpersonationService>;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // createTask
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a task and push to pipeline fire-and-forget', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.createTask({
      boardId: 'board-1',
      name: 'Task 1',
      code: 'T1',
      status: 'todo',
    });

    expect(result).toBeDefined();
    expect(result.boardId).toBe('board-1');
    expect(result.name).toBe('Task 1');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'SmeMartTask',
      jasmine.objectContaining({ boardId: 'board-1', name: 'Task 1', code: 'T1' }),
    );
  });

  it('should return task optimistically before pipeline completes', async () => {
    pipelineWrite.pushEntity.and.returnValue(new Promise(() => {})); // Never completes

    const taskPromise = service.createTask({
      boardId: 'board-1',
      name: 'Task 1',
      code: 'T1',
    });

    const result = await Promise.race([taskPromise, Promise.resolve('completed')]);
    expect(result).not.toBe('completed'); // Task returned immediately
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

    graphqlRead.getById.and.returnValue(Promise.resolve(gqlTask));

    const result = await service.getTask('task-1');

    expect(result).toBeDefined();
    expect(result?.id).toBe('task-1');
    expect(result?.name).toBe('Task 1');
    expect(graphqlRead.getById).toHaveBeenCalledWith('SmeMartTask', 'task-1', jasmine.any(Array));
  });

  it('should return null if task not found', async () => {
    graphqlRead.getById.and.returnValue(Promise.resolve(null));

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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: gqlTasks,
      page: { pageNumber: 1, pageSize: 50, totalCount: 2 },
    }));

    const result = await service.listTasks('board-1');

    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('Task 1');
    expect(result.items[1].name).toBe('Task 2');
    expect(graphqlRead.query).toHaveBeenCalledWith('SmeMartTask', jasmine.any(Array), jasmine.objectContaining({
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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: flatTasks,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 4 },
    }));

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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: flatTasks,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 3 },
    }));

    const tree = await service.getTaskTree('board-1');

    expect(tree[0].children![0].name).toBe('Subtask A'); // rank 1
    expect(tree[0].children![1].name).toBe('Subtask B'); // rank 2
  });

  it('should detect cycles and prevent infinite recursion', async () => {
    const consoleWarnSpy = spyOn(console, 'warn');

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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: flatTasks,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 2 },
    }));

    const tree = await service.getTaskTree('board-1');

    // Should detect cycle and warn
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      jasmine.stringMatching('Cycle detected'),
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateTask
  // ────────────────────────────────────────────────────────────────────────────

  it('should update a task and push to pipeline', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.updateTask('task-1', {
      name: 'Updated Task',
      status: 'in_progress',
    });

    expect(result.name).toBe('Updated Task');
    expect(result.status).toBe('in_progress');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'SmeMartTask',
      jasmine.objectContaining({ id: 'task-1', name: 'Updated Task' }),
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // deleteTask
  // ────────────────────────────────────────────────────────────────────────────

  it('should delete a task via pipeline', async () => {
    pipelineWrite.deleteEntity.and.returnValue(Promise.resolve());

    await service.deleteTask('task-1');

    expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartTask', 'task-1');
  });
});
