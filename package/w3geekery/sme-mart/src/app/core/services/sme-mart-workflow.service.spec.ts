import { TestBed } from '@angular/core/testing';
import { SmeMartWorkflowService } from './sme-mart-workflow.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { GqlSmeMartWorkflowResponse } from '../gql-types';

describe('SmeMartWorkflowService', () => {
  let service: SmeMartWorkflowService;
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
        SmeMartWorkflowService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
      ],
    });

    service = TestBed.inject(SmeMartWorkflowService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createWorkflow', () => {
    it('should create workflow optimistically', async () => {
      const request = {
        name: 'Standard Workflow',
        statuses: [{ name: 'todo' }, { name: 'in_progress' }, { name: 'done' }],
      };
      const result = await service.createWorkflow(request);

      expect(result.name).toBe('Standard Workflow');
      expect(result.statuses).toHaveLength(3);
      expect(result.id).toBeTruthy();
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartWorkflow',
        jasmine.objectContaining({ name: 'Standard Workflow' }),
      );
    });

    it('should initialize empty arrays if not provided', async () => {
      const request = { name: 'Minimal Workflow' };
      const result = await service.createWorkflow(request);

      expect(result.statuses).toEqual([]);
      expect(result.transitions).toEqual([]);
    });

    it('should include statuses and transitions if provided', async () => {
      const request = {
        name: 'Complex Workflow',
        statuses: [{ name: 'todo' }, { name: 'done' }],
        transitions: [{ from: 'todo', to: 'done' }],
      };
      const result = await service.createWorkflow(request);

      expect(result.statuses).toEqual([{ name: 'todo' }, { name: 'done' }]);
      expect(result.transitions).toEqual([{ from: 'todo', to: 'done' }]);
    });
  });

  describe('getWorkflow', () => {
    it('should query workflow by ID and return mapped model', async () => {
      const mockResponse: GqlSmeMartWorkflowResponse = {
        id: 'workflow-123',
        name: 'Test Workflow',
        statuses: [{ name: 'todo' }, { name: 'done' }],
        transitions: [{ from: 'todo', to: 'done' }],
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.getWorkflow('workflow-123');

      expect(result?.name).toBe('Test Workflow');
      expect(result?.statuses).toHaveLength(2);
      expect(graphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartWorkflow',
        'workflow-123',
        jasmine.any(Array),
      );
    });

    it('should return null if workflow not found', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

      const result = await service.getWorkflow('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listWorkflows', () => {
    it('should query workflows with default pagination', async () => {
      const mockResponse = {
        items: [
          {
            id: 'workflow-1',
            name: 'Workflow 1',
            statuses: [{ name: 'todo' }],
            createdAt: '2026-03-19T00:00:00Z',
            updatedAt: '2026-03-19T00:00:00Z',
          } as GqlSmeMartWorkflowResponse,
        ],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      };

      graphqlRead.query.and.returnValue(Promise.resolve(mockResponse as any));

      const result = await service.listWorkflows();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Workflow 1');
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow and push changes optimistically', async () => {
      const existing: GqlSmeMartWorkflowResponse = {
        id: 'workflow-123',
        name: 'Original Name',
        statuses: [{ name: 'todo' }],
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(existing));

      const result = await service.updateWorkflow('workflow-123', {
        name: 'Updated Name',
        statuses: [{ name: 'todo' }, { name: 'done' }],
      });

      expect(result.name).toBe('Updated Name');
      expect(result.statuses).toHaveLength(2);
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartWorkflow',
        jasmine.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw if workflow not found', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

      await expectAsync(
        service.updateWorkflow('nonexistent', { name: 'Test' }),
      ).toBeRejectedWithError(/not found/);
    });
  });

  describe('deleteWorkflow', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteWorkflow('workflow-123');

      expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartWorkflow', 'workflow-123');
    });
  });
});
