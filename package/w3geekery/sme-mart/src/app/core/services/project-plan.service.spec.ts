/**
 * Unit Tests for ProjectPlanService
 *
 * Tests CRUD operations for ProjectPlan and PlanMilestone entities.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectPlanService } from './project-plan.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { ImpersonationService } from './impersonation.service';
import { fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlProjectPlanResponse, GqlPlanMilestoneResponse } from '../gql-types/project-plan.types';

describe('ProjectPlanService', () => {
  let service: ProjectPlanService;
  let mockPipelineWrite: { pushEntity: ReturnType<typeof vi.fn>; pushEntities: ReturnType<typeof vi.fn>; deleteEntity: ReturnType<typeof vi.fn>; deleteEntities: ReturnType<typeof vi.fn>; getCached: ReturnType<typeof vi.fn>; seedCache: ReturnType<typeof vi.fn> };
  let mockGraphqlRead: { query: ReturnType<typeof vi.fn>; getById: ReturnType<typeof vi.fn> };
  let mockImpersonation: { effectiveUserId: ReturnType<typeof vi.fn> };
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
    };
    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('user-123'),
    };
    mockSnackBar = {
      open: vi.fn(),
    };
    mockProjectContext = fakeProjectContextService(false);

    TestBed.configureTestingModule({
      providers: [
        ProjectPlanService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(ProjectPlanService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPlan CRUD
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a plan and push to pipeline', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.createPlan({
      parentId: 'project-1',
      title: 'Project Execution Plan',
      approach: 'Agile methodology',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('project-1');
    expect(result.title).toBe('Project Execution Plan');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPlan',
      expect.objectContaining({ parentId: 'project-1', title: 'Project Execution Plan' }),
      [],
      'project-plan.service:77',
    );
  });

  it('should surface error to user on Pipeline rejection for createPlan', async () => {
    const mockError = new Error('Network failure');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(
      service.createPlan({
        parentId: 'project-1',
        title: 'Project Execution Plan',
      })
    ).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create plan'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should fetch a single plan by ID', async () => {
    const gqlPlan: GqlProjectPlanResponse = {
      id: 'plan-1',
      parentId: 'project-1',
      title: 'Project Execution Plan',
      approach: 'Agile',
      estimatedDuration: '6 months',
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    mockGraphqlRead.getById.mockResolvedValue(gqlPlan);

    const result = await service.getPlan('plan-1');

    expect(result).toBeDefined();
    expect(result?.id).toBe('plan-1');
    expect(result?.title).toBe('Project Execution Plan');
    expect(mockGraphqlRead.getById).toHaveBeenCalledWith('ProjectPlan', 'plan-1', expect.any(Array));
  });

  it('should return null if plan not found', async () => {
    mockGraphqlRead.getById.mockResolvedValue(null);

    const result = await service.getPlan('nonexistent');

    expect(result).toBeNull();
  });

  it('should list plans for a project', async () => {
    const gqlPlans: GqlProjectPlanResponse[] = [
      {
        id: 'plan-1',
        parentId: 'project-1',
        title: 'Project Execution Plan',
        approach: 'Agile',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: gqlPlans,
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    });

    const result = await service.listPlans('project-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Project Execution Plan');
    expect(mockGraphqlRead.query).toHaveBeenCalledWith('ProjectPlan', expect.any(Array), expect.objectContaining({
      filters: { parentId: '.eq.project-1' },
    }));
  });

  it('should update a plan and push to pipeline', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.updatePlan('plan-1', {
      title: 'Updated Plan',
      estimatedDuration: '8 months',
    });

    expect(result.title).toBe('Updated Plan');
    expect(result.estimatedDuration).toBe('8 months');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPlan',
      expect.objectContaining({ id: 'plan-1', title: 'Updated Plan' }),
      [],
      'project-plan.service:165',
    );
  });

  it('should surface error to user on Pipeline rejection for updatePlan', async () => {
    const mockError = new Error('Save failed');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(service.updatePlan('plan-1', { title: 'New Title' })).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update plan'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should delete a plan via pipeline', async () => {
    mockPipelineWrite.deleteEntity.mockResolvedValue(undefined);

    await service.deletePlan('plan-1');

    expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('ProjectPlan', 'plan-1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PlanMilestone CRUD (Child Entities)
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a milestone with correct parentId', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.createMilestone('plan-1', {
      parentId: 'plan-1',
      name: 'Phase 1 Complete',
      targetDate: '2026-06-30',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('plan-1');
    expect(result.name).toBe('Phase 1 Complete');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PlanMilestone',
      expect.objectContaining({ parentId: 'plan-1', name: 'Phase 1 Complete' }),
      [],
      'project-plan.service:217',
    );
  });

  it('should surface error to user on Pipeline rejection for createMilestone', async () => {
    const mockError = new Error('Network failure');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(
      service.createMilestone('plan-1', {
        parentId: 'plan-1',
        name: 'Phase 1',
      })
    ).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create milestone'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should get all milestones for a plan', async () => {
    const gqlMilestones: GqlPlanMilestoneResponse[] = [
      {
        id: 'milestone-1',
        parentId: 'plan-1',
        name: 'Phase 1 Complete',
        targetDate: '2026-06-30',
        status: 'in_progress',
        sortOrder: 1,
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: 'milestone-2',
        parentId: 'plan-1',
        name: 'Phase 2 Complete',
        targetDate: '2026-12-31',
        status: 'todo',
        sortOrder: 2,
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: gqlMilestones,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 2 },
    });

    const result = await service.getMilestones('plan-1');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Phase 1 Complete');
    expect(result[1].name).toBe('Phase 2 Complete');
    expect(mockGraphqlRead.query).toHaveBeenCalledWith('PlanMilestone', expect.any(Array), expect.objectContaining({
      filters: { parentId: '.eq.plan-1' },
    }));
  });

  it('should update a milestone and push to pipeline', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.updateMilestone('milestone-1', {
      status: 'done',
      targetDate: '2026-07-15',
    });

    expect(result.status).toBe('done');
    expect(result.targetDate).toBe('2026-07-15');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PlanMilestone',
      expect.objectContaining({ id: 'milestone-1', status: 'done' }),
      [],
      'project-plan.service:271',
    );
  });

  it('should surface error to user on Pipeline rejection for updateMilestone', async () => {
    const mockError = new Error('Update failed');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(service.updateMilestone('milestone-1', { status: 'done' })).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update milestone'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should delete a milestone via pipeline', async () => {
    mockPipelineWrite.deleteEntity.mockResolvedValue(undefined);

    await service.deleteMilestone('milestone-1');

    expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('PlanMilestone', 'milestone-1');
  });

  // ── Demo visibility (Phase 24 Plan 03) ──

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const basePlan = {
      parentId: 'project-1', title: 'Plan', approach: 'agile', estimatedDuration: '4 weeks',
      teamStructure: '[]', createdAt: '2026-05-05T00:00:00Z', updatedAt: '2026-05-05T00:00:00Z',
    };
    const mockGqlReturn = [
      { ...basePlan, id: '1', title: 'Real', tag: null },
      { ...basePlan, id: '2', title: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...basePlan, id: '3', title: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...basePlan, id: '4', title: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listPlans('project-1');

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listPlans('project-1');

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listPlans('project-1');

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

      await service.listPlans('project-1');

      const fields = mockGraphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoRecord = { ...basePlan, id: '3', title: 'Demo', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] };
      mockGraphqlRead.getById.mockResolvedValueOnce(demoRecord);

      const result = await service.getPlan('3');

      expect(result).toBeNull();
    });
  });
});
