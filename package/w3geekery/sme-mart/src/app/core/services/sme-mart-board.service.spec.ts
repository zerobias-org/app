import { TestBed } from '@angular/core/testing';
import { SmeMartBoardService } from './sme-mart-board.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { GqlSmeMartBoardResponse } from '../gql-types';

describe('SmeMartBoardService', () => {
  let service: SmeMartBoardService;
  let pipelineWrite: jasmine.SpyObj<PipelineWriteService>;
  let graphqlRead: jasmine.SpyObj<GraphqlReadService>;

  beforeEach(() => {
    const pipelineWriteSpy = jasmine.createSpyObj<PipelineWriteService>(
      'PipelineWriteService',
      ['pushEntity', 'pushEntities', 'deleteEntity', 'deleteEntities'],
    );
    const graphqlReadSpy = jasmine.createSpyObj<GraphqlReadService>(
      'GraphqlReadService',
      ['query', 'getById', 'rawQuery'],
    );

    TestBed.configureTestingModule({
      providers: [
        SmeMartBoardService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
      ],
    });

    service = TestBed.inject(SmeMartBoardService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
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
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartBoard',
        jasmine.objectContaining({ code: 'B1' }),
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

      graphqlRead.getById.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.getBoard('board-123');

      expect(result?.name).toBe('Test Board');
      expect(result?.code).toBe('B1');
      expect(graphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartBoard',
        'board-123',
        jasmine.any(Array),
      );
    });

    it('should return null if board not found', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

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

      graphqlRead.query.and.returnValue(Promise.resolve(mockResponse as any));

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

      graphqlRead.getById.and.returnValue(Promise.resolve(existing));

      const result = await service.updateBoard('board-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.code).toBe('B1');
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartBoard',
        jasmine.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw if board not found', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

      await expectAsync(
        service.updateBoard('nonexistent', { name: 'Test' }),
      ).toBeRejectedWithError(/not found/);
    });
  });

  describe('deleteBoard', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteBoard('board-123');

      expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartBoard', 'board-123');
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
        ] as any[],
        page: { pageNumber: 1, pageSize: 1000, totalCount: 1 },
      };

      graphqlRead.query.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.getBoardActivities('board-123');

      expect(result).toHaveLength(1);
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'SmeMartActivity',
        jasmine.any(Array),
        jasmine.objectContaining({
          filters: { boardId: '.eq.board-123' },
        }),
      );
    });
  });
});
