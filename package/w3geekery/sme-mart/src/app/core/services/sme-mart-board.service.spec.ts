import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmeMartBoardService } from './sme-mart-board.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlSmeMartBoardResponse } from '../gql-types';

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
  rawQuery: MockFn;
}

describe('SmeMartBoardService', () => {
  let service: SmeMartBoardService;
  let mockPipelineWrite: MockPipelineWrite;
  let mockGraphqlRead: MockGraphqlRead;
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
      query: vi.fn().mockResolvedValue({ items: [] }),
      getById: vi.fn().mockResolvedValue(null),
      rawQuery: vi.fn().mockResolvedValue(null),
    };
    mockSnackBar = {
      open: vi.fn(),
    };
    mockProjectContext = fakeProjectContextService(false);

    TestBed.configureTestingModule({
      providers: [
        SmeMartBoardService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(SmeMartBoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createBoard', () => {
    it('should create board optimistically', async () => {
      const request = {
        code: 'B1',
        name: 'Demand Board',
        scope: 'demand',
        partition: 'P1',
        parentId: 'proj-123',
      };
      const result = await service.createBoard(request);

      expect(result.name).toBe('Demand Board');
      expect(result.code).toBe('B1');
      expect(result.parentId).toBe('proj-123');
      expect(result.id).toBeTruthy();
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartBoard',
        expect.objectContaining({ code: 'B1' }),
        [],
        'sme-mart-board.service:59',
      );
    });

    it('should surface error to user on Pipeline rejection for createBoard', async () => {
      const mockError = new Error('Network failure');
      mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.createBoard({
          code: 'B1',
          name: 'Demand Board',
          scope: 'demand',
          partition: 'P1',
          parentId: 'proj-123',
        })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create board'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('getBoard', () => {
    it('should query board by ID and return mapped model', async () => {
      const mockResponse: GqlSmeMartBoardResponse = {
        id: 'board-123',
        code: 'B1',
        name: 'Test Board',
        scope: 'demand',
        partition: 'P1',
        parentId: 'proj-123',
        description: 'Test description',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(mockResponse);

      const result = await service.getBoard('board-123');

      expect(result?.name).toBe('Test Board');
      expect(result?.code).toBe('B1');
      expect(mockGraphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartBoard',
        'board-123',
        expect.any(Array),
      );
    });

    it('should return null if board not found', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

      const result = await service.getBoard('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listBoards', () => {
    it('should query boards with default pagination', async () => {
      const mockResponse = {
        items: [
          {
            id: 'board-1',
            code: 'B1',
            name: 'Board 1',
            scope: 'demand',
            partition: 'P1',
            parentId: 'proj-123',
            createdAt: '2026-03-19T00:00:00Z',
            updatedAt: '2026-03-19T00:00:00Z',
          } as GqlSmeMartBoardResponse,
        ],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      };

      mockGraphqlRead.query.mockResolvedValue(mockResponse);

      const result = await service.listBoards();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].code).toBe('B1');
    });
  });

  describe('updateBoard', () => {
    it('should update board and push changes optimistically', async () => {
      const existing: GqlSmeMartBoardResponse = {
        id: 'board-123',
        code: 'B1',
        name: 'Original Name',
        scope: 'demand',
        partition: 'P1',
        parentId: 'proj-123',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(existing);

      const result = await service.updateBoard('board-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.code).toBe('B1');
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartBoard',
        expect.objectContaining({ name: 'Updated Name' }),
        [],
        'sme-mart-board.service:160',
      );
    });

    it('should throw if board not found', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

      await expect(
        service.updateBoard('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(/not found/);
    });

    it('should surface error to user on Pipeline rejection for updateBoard', async () => {
      const existing: GqlSmeMartBoardResponse = {
        id: 'board-123',
        code: 'B1',
        name: 'Original Name',
        scope: 'demand',
        partition: 'P1',
        parentId: 'proj-123',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(existing);
      const mockError = new Error('Save failed');
      mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.updateBoard('board-123', { name: 'New Name' })).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update board'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('deleteBoard', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteBoard('board-123');

      expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartBoard', 'board-123');
    });
  });

  describe('getBoardActivities', () => {
    it('should query activities with boardId filter', async () => {
      const mockResponse = {
        items: [
          {
            id: 'activity-1',
            name: 'Activity 1',
            type: 'task',
            workflowId: 'workflow-1',
            createdAt: '2026-03-19T00:00:00Z',
            updatedAt: '2026-03-19T00:00:00Z',
          },
        ] as unknown[],
        page: { pageNumber: 1, pageSize: 1000, totalCount: 1 },
      };

      mockGraphqlRead.query.mockResolvedValue(mockResponse);

      const result = await service.getBoardActivities('board-123');

      expect(result).toHaveLength(1);
      expect(mockGraphqlRead.query).toHaveBeenCalledWith(
        'SmeMartActivity',
        expect.any(Array),
        expect.objectContaining({
          filters: { boardId: '.eq.board-123' },
        }),
      );
    });
  });

  // ── Demo visibility (Phase 24 Plan 03) ──

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const baseBoard = {
      code: 'B', name: 'Board', scope: 'demand', partition: 'P1' as const,
      parentId: 'proj-1', description: '', createdAt: '2026-05-05T00:00:00Z',
      updatedAt: '2026-05-05T00:00:00Z',
    };
    const mockGqlReturn = [
      { ...baseBoard, id: '1', name: 'Real', tag: null },
      { ...baseBoard, id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...baseBoard, id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...baseBoard, id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listBoards();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listBoards();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listBoards();

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

      await service.listBoards();

      const fields = mockGraphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoRecord = { ...baseBoard, id: '3', name: 'Demo', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] };
      mockGraphqlRead.getById.mockResolvedValueOnce(demoRecord);

      const result = await service.getBoard('3');

      expect(result).toBeNull();
    });
  });
});
