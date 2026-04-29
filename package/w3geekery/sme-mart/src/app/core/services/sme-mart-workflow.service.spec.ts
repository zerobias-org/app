import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmeMartWorkflowService } from './sme-mart-workflow.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import type { GqlSmeMartWorkflowResponse } from '../gql-types';

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

describe('SmeMartWorkflowService', () => {
  let service: SmeMartWorkflowService;
  let mockPipelineWrite: MockPipelineWrite;
  let mockGraphqlRead: MockGraphqlRead;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

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

    TestBed.configureTestingModule({
      providers: [
        SmeMartWorkflowService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(SmeMartWorkflowService);
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
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartWorkflow',
        expect.objectContaining({ name: 'Standard Workflow' }),
        [],
        'sme-mart-workflow.service:53',
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

    it('should surface error to user on Pipeline rejection for createWorkflow', async () => {
      const mockError = new Error('Network failure');
      mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.createWorkflow({
          name: 'Test Workflow',
          statuses: [{ name: 'todo' }],
        })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create workflow'),
        'Dismiss',
        expect.any(Object),
      );
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

      mockGraphqlRead.getById.mockResolvedValue(mockResponse);

      const result = await service.getWorkflow('workflow-123');

      expect(result?.name).toBe('Test Workflow');
      expect(result?.statuses).toHaveLength(2);
      expect(mockGraphqlRead.getById).toHaveBeenCalledWith(
        'SmeMartWorkflow',
        'workflow-123',
        expect.any(Array),
      );
    });

    it('should return null if workflow not found', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

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

      mockGraphqlRead.query.mockResolvedValue(mockResponse as any);

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

      mockGraphqlRead.getById.mockResolvedValue(existing);

      const result = await service.updateWorkflow('workflow-123', {
        name: 'Updated Name',
        statuses: [{ name: 'todo' }, { name: 'done' }],
      });

      expect(result.name).toBe('Updated Name');
      expect(result.statuses).toHaveLength(2);
      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
        'SmeMartWorkflow',
        expect.objectContaining({ name: 'Updated Name' }),
        [],
        'sme-mart-workflow.service:148',
      );
    });

    it('should throw if workflow not found', async () => {
      mockGraphqlRead.getById.mockResolvedValue(null);

      await expect(
        service.updateWorkflow('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(/not found/);
    });

    it('should surface error to user on Pipeline rejection for updateWorkflow', async () => {
      const existing: GqlSmeMartWorkflowResponse = {
        id: 'workflow-123',
        name: 'Original Name',
        statuses: [{ name: 'todo' }],
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      };

      mockGraphqlRead.getById.mockResolvedValue(existing);
      const mockError = new Error('Save failed');
      mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.updateWorkflow('workflow-123', { name: 'New Name' })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update workflow'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('deleteWorkflow', () => {
    it('should call deleteEntity on pipeline write', async () => {
      await service.deleteWorkflow('workflow-123');

      expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('SmeMartWorkflow', 'workflow-123');
    });
  });
});
