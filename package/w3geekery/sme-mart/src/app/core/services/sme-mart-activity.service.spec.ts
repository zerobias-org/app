import { TestBed } from '@angular/core/testing';
import { SmeMartActivityService } from './sme-mart-activity.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { GqlSmeMartActivityResponse, GqlSmeMartWorkflowResponse } from '../gql-types';

describe('SmeMartActivityService', () => {
  let service: SmeMartActivityService;
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
        SmeMartActivityService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
      ],
    });

    service = TestBed.inject(SmeMartActivityService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createActivity', () => {
    it('should create activity optimistically', async () => {
      const request = {
        name: 'Feature Development',
        type: 'task',
        workflowId: 'workflow-123',
      };
      const result = await service.createActivity(request);

      expect(result.name).toBe('Feature Development');
      expect(result.type).toBe('task');
      expect(result.workflowId).toBe('workflow-123');
      expect(result.id).toBeTruthy();
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartActivity',
        jasmine.objectContaining({ name: 'Feature Development' }),
      );
    });

    it('should initialize empty customFields array if not provided', async () => {
      const request = {
        name: 'Task',
        type: 'task',
        workflowId: 'workflow-1',
      };
      const result = await service.createActivity(request);

      expect(result.customFields).toEqual([]);
    });

    it('should include custom fields if provided', async () => {
      const request = {
        name: 'Task',
        type: 'task',
        workflowId: 'workflow-1',
        customFields: [{ name: 'priority', type: 'select' }],
      };
      const result = await service.createActivity(request);

      expect(result.customFields).toEqual([{ name: 'priority', type: 'select' }]);
    });
  });

  describe('getActivity', () => {
    it('should query activity by ID and return mapped model', async () => {
      const mockResponse: GqlSmeMartActivityResponse = {
        id: 'activity-123',
        name: 'Test Activity',
        type: 'task',
        workflowId: 'workflow-123',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(mockResponse));

      const result = await service.getActivity('activity-123');

      expect(result?.name).toBe('Test Activity');
      expect(result?.type).toBe('task');
      expect(graphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartActivity',
        'activity-123',
        jasmine.any(Array),
      );
    });

    it('should return null if activity not found', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

      const result = await service.getActivity('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listActivities', () => {
    it('should query activities with default pagination', async () => {
      const mockResponse = {
        items: [
          {
            id: 'activity-1',
            name: 'Activity 1',
            type: 'task',
            workflowId: 'workflow-1',
            createdAt: '2026-03-19T00:00:00Z',
            updatedAt: '2026-03-19T00:00:00Z',
          } as GqlSmeMartActivityResponse,
        ],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      };

      graphqlRead.query.and.returnValue(Promise.resolve(mockResponse as any));

      const result = await service.listActivities();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Activity 1');
    });
  });

  describe('updateActivity', () => {
    it('should update activity and push changes optimistically', async () => {
      const existing: GqlSmeMartActivityResponse = {
        id: 'activity-123',
        name: 'Original Name',
        type: 'task',
        workflowId: 'workflow-123',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(existing));

      const result = await service.updateActivity('activity-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.type).toBe('task');
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartActivity',
        jasmine.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw if activity not found', async () => {
      graphqlRead.getById.and.returnValue(Promise.resolve(null));

      await expectAsync(
        service.updateActivity('nonexistent', { name: 'Test' }),
      ).toBeRejectedWithError(/not found/);
    });
  });

  describe('deleteActivity', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteActivity('activity-123');

      expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartActivity', 'activity-123');
    });
  });

  describe('getActivityWorkflow', () => {
    it('should fetch workflow by activity workflowId', async () => {
      const activity: GqlSmeMartActivityResponse = {
        id: 'activity-123',
        name: 'Test',
        type: 'task',
        workflowId: 'workflow-456',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      const workflow: GqlSmeMartWorkflowResponse = {
        id: 'workflow-456',
        name: 'Standard Workflow',
        statuses: [{ name: 'todo' }, { name: 'done' }],
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById
        .withArgs('SmeMartActivity', 'activity-123', jasmine.any(Array))
        .and.returnValue(Promise.resolve(activity));

      graphqlRead.getById
        .withArgs('SmeMartWorkflow', 'workflow-456', jasmine.any(Array))
        .and.returnValue(Promise.resolve(workflow));

      const result = await service.getActivityWorkflow('activity-123');

      expect(result?.id).toBe('workflow-456');
      expect(result?.name).toBe('Standard Workflow');
    });

    it('should return null if activity has no workflowId', async () => {
      const activity: GqlSmeMartActivityResponse = {
        id: 'activity-123',
        name: 'Test',
        type: 'task',
        workflowId: '', // Empty workflow reference
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      graphqlRead.getById.and.returnValue(Promise.resolve(activity));

      const result = await service.getActivityWorkflow('activity-123');

      expect(result).toBeNull();
    });
  });
});
