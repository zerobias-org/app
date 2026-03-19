import { TestBed } from '@angular/core/testing';
import { SmeMartProjectService } from './sme-mart-project.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { GqlSmeMartProjectResponse } from '../gql-types';

describe('SmeMartProjectService', () => {
  let service: SmeMartProjectService;
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
        SmeMartProjectService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
      ],
    });

    service = TestBed.inject(SmeMartProjectService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createProject', () => {
    it('should create project optimistically without waiting for pipeline', async () => {
      const request = { name: 'Acme Security Review' };
      const result = await service.createProject(request);

      expect(result.name).toBe('Acme Security Review');
      expect(result.id).toBeTruthy();
      expect(result.status).toBe('draft');
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartProject',
        jasmine.objectContaining({ name: 'Acme Security Review' }),
      );
    });

    it('should use provided status in creation', async () => {
      const request = { name: 'Active Project', status: 'active' };
      const result = await service.createProject(request);

      expect(result.status).toBe('active');
    });

    it('should set default start date if not provided', async () => {
      const request = { name: 'Test Project' };
      const result = await service.createProject(request);

      expect(result.startDate).toBeTruthy();
      expect(typeof result.startDate).toBe('string');
    });
  });

  describe('getProject', () => {
    it('should query project by ID and return mapped model', async () => {
      const mockResponse: GqlSmeMartProjectResponse = {
        id: 'proj-123',
        name: 'Test Project',
        description: 'Test description',
        status: 'active',
        startDate: '2026-03-19',
        targetEndDate: '2026-06-19',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.getProject('proj-123');

      expect(result?.name).toBe('Test Project');
      expect(result?.status).toBe('active');
      expect(graphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartProject',
        'proj-123',
        jasmine.any(Array),
      );
    });

    it('should return null if project not found', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

      const result = await service.getProject('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listProjects', () => {
    it('should query projects with default pagination', async () => {
      const mockResponse = {
        items: [
          {
            id: 'proj-1',
            name: 'Project 1',
            status: 'draft',
            startDate: '2026-03-19',
            createdAt: '2026-03-19T00:00:00Z',
            updatedAt: '2026-03-19T00:00:00Z',
          } as GqlSmeMartProjectResponse,
        ],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      };

      graphqlRead.query.and.returnValue(Promise.resolve(mockResponse as any));

      const result = await service.listProjects();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Project 1');
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'SmeMartProject',
        jasmine.any(Array),
        jasmine.objectContaining({ pageNumber: 1, pageSize: 50 }),
      );
    });

    it('should respect pagination options', async () => {
      const mockResponse = {
        items: [],
        page: { pageNumber: 2, pageSize: 25, totalCount: 0 },
      };

      graphqlRead.query.and.returnValue(Promise.resolve(mockResponse as any));

      await service.listProjects({ pageNumber: 2, pageSize: 25 });

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'SmeMartProject',
        jasmine.any(Array),
        jasmine.objectContaining({ pageNumber: 2, pageSize: 25 }),
      );
    });
  });

  describe('updateProject', () => {
    it('should update project and push changes optimistically', async () => {
      const existing: GqlSmeMartProjectResponse = {
        id: 'proj-123',
        name: 'Original Name',
        status: 'draft',
        startDate: '2026-03-19',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(existing));

      const result = await service.updateProject('proj-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.id).toBe('proj-123');
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartProject',
        jasmine.objectContaining({ name: 'Updated Name', id: 'proj-123' }),
      );
    });

    it('should throw if project not found on update', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

      await expectAsync(service.updateProject('nonexistent', { name: 'Test' })).toBeRejectedWithError(
        /not found/,
      );
    });

    it('should merge update changes with existing data', async () => {
      const existing: GqlSmeMartProjectResponse = {
        id: 'proj-123',
        name: 'Original Name',
        status: 'draft',
        startDate: '2026-03-19',
        targetEndDate: '2026-06-19',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(existing));

      const result = await service.updateProject('proj-123', {
        status: 'active',
        // name should remain unchanged
      });

      expect(result.name).toBe('Original Name');
      expect(result.status).toBe('active');
    });
  });

  describe('deleteProject', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteProject('proj-123');

      expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartProject', 'proj-123');
    });
  });

  describe('getProjectBoards', () => {
    it('should query boards with parentId filter', async () => {
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
          },
        ] as any[],
        page: { pageNumber: 1, pageSize: 1000, totalCount: 1 },
      };

      graphqlRead.query.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.getProjectBoards('proj-123');

      expect(result).toHaveLength(1);
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'SmeMartBoard',
        jasmine.any(Array),
        jasmine.objectContaining({
          filters: { parentId: '.eq.proj-123' },
        }),
      );
    });
  });
});
