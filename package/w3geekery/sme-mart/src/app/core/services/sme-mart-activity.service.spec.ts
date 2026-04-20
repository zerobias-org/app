import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmeMartActivityService } from './sme-mart-activity.service';
import { SmeMartWorkflowService } from './sme-mart-workflow.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { GqlSmeMartActivityResponse, GqlSmeMartWorkflowResponse } from '../gql-types';

type MockFn = ReturnType<typeof vi.fn>;

interface MockPipelineWrite {
  pushEntity: MockFn;
  pushEntities: MockFn;
  deleteEntity: MockFn;
  deleteEntities: MockFn;
}

interface MockGraphqlRead {
  query: MockFn;
  getById: MockFn;
  rawQuery: MockFn;
}

describe('SmeMartActivityService', () => {
  let service: SmeMartActivityService;
  let mockPipelineWrite: MockPipelineWrite;
  let mockGraphqlRead: MockGraphqlRead;

  beforeEach(() => {
    mockPipelineWrite = {
      pushEntity: vi.fn().mockResolvedValue(undefined),
      pushEntities: vi.fn().mockResolvedValue(undefined),
      deleteEntity: vi.fn().mockResolvedValue(undefined),
      deleteEntities: vi.fn().mockResolvedValue(undefined),
    };
    mockGraphqlRead = {
      query: vi.fn().mockResolvedValue({ items: [] }),
      getById: vi.fn().mockResolvedValue(null),
      rawQuery: vi.fn().mockResolvedValue(null),
    };

    const mockWorkflowService = {
      getWorkflow: vi.fn().mockResolvedValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        SmeMartActivityService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: SmeMartWorkflowService, useValue: mockWorkflowService },
      ],
    });

    service = TestBed.inject(SmeMartActivityService);
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
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartActivity',
        expect.objectContaining({ name: 'Feature Development' }),
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

      mockGraphqlRead.getById.mockResolvedValue(mockResponse);

      const result = await service.getActivity('activity-123');

      expect(result?.name).toBe('Test Activity');
      expect(result?.type).toBe('task');
      expect(mockGraphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartActivity',
        'activity-123',
        expect.any(Array),
      );
    });

    it('should return null if activity not found', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

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

      mockGraphqlRead.query.mockResolvedValue(mockResponse as any);

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

      mockGraphqlRead.getById.mockResolvedValue(existing);

      const result = await service.updateActivity('activity-123', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(result.type).toBe('task');
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartActivity',
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw if activity not found', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

      await expect(
        service.updateActivity('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(/not found/);
    });
  });

  describe('deleteActivity', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteActivity('activity-123');

      expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartActivity', 'activity-123');
    });
  });

  describe('getActivityWorkflow', () => {
    it('should fetch workflow by activity workflowId using injected workflowService', async () => {
      const activity: GqlSmeMartActivityResponse = {
        id: 'activity-123',
        name: 'Test',
        type: 'task',
        workflowId: 'workflow-456',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      const workflow = {
        id: 'workflow-456',
        name: 'Standard Workflow',
        statuses: [{ name: 'todo' }, { name: 'done' }],
        transitions: [],
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(activity);
      const workflowService = TestBed.inject(SmeMartWorkflowService);
      vi.spyOn(workflowService, 'getWorkflow').mockResolvedValue(workflow as any);

      const result = await service.getActivityWorkflow('activity-123');

      expect(result).toBeDefined();
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

      mockGraphqlRead.getById.mockResolvedValue(activity);

      const result = await service.getActivityWorkflow('activity-123');

      expect(result).toBeNull();
    });
  });
});
