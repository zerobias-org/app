import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmeMartActivityService } from './sme-mart-activity.service';
import { SmeMartWorkflowService } from './sme-mart-workflow.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlSmeMartActivityResponse } from '../gql-types';

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

describe('SmeMartActivityService', () => {
  let service: SmeMartActivityService;
  let mockPipelineWrite: MockPipelineWrite;
  let mockGraphqlRead: MockGraphqlRead;
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

    const mockWorkflowService = {
      getWorkflow: vi.fn().mockResolvedValue(null),
    };

    mockProjectContext = fakeProjectContextService(false);

    TestBed.configureTestingModule({
      providers: [
        SmeMartActivityService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: SmeMartWorkflowService, useValue: mockWorkflowService },
        { provide: ProjectContextService, useValue: mockProjectContext },
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

      mockGraphqlRead.query.mockResolvedValue(mockResponse);

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
      vi.spyOn(workflowService, 'getWorkflow').mockResolvedValue(workflow);

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

  // ────────────────────────────────────────────────────────────────────────────
  // Demo visibility (Phase 24 Plan 03)
  // ────────────────────────────────────────────────────────────────────────────

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const baseActivity = {
      name: 'Activity', type: 'task', workflowId: null, customFields: [],
      createdAt: '2026-05-05T00:00:00Z', updatedAt: '2026-05-05T00:00:00Z',
    };
    const mockGqlReturn = [
      { ...baseActivity, id: '1', name: 'Real', tag: null },
      { ...baseActivity, id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...baseActivity, id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...baseActivity, id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listActivities();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listActivities();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listActivities();

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

      await service.listActivities();

      const fields = mockGraphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoRecord = { ...baseActivity, id: '3', name: 'Demo', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] };
      mockGraphqlRead.getById.mockResolvedValueOnce(demoRecord);

      const result = await service.getActivity('3');

      expect(result).toBeNull();
    });
  });
});
