/**
 * Unit Tests for ProjectPlanService
 *
 * Tests CRUD operations for ProjectPlan and PlanMilestone entities.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectPlanService } from './project-plan.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import type { GqlProjectPlanResponse, GqlPlanMilestoneResponse } from '../gql-types/project-plan.types';

describe('ProjectPlanService', () => {
  let service: ProjectPlanService;
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
        ProjectPlanService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
        { provide: ImpersonationService, useValue: impersonationSpy },
      ],
    });

    service = TestBed.inject(ProjectPlanService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
    impersonation = TestBed.inject(ImpersonationService) as jasmine.SpyObj<ImpersonationService>;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPlan CRUD
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a plan and push to pipeline', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.createPlan({
      parentId: 'project-1',
      title: 'Project Execution Plan',
      approach: 'Agile methodology',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('project-1');
    expect(result.title).toBe('Project Execution Plan');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPlan',
      jasmine.objectContaining({ parentId: 'project-1', title: 'Project Execution Plan' }),
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

    graphqlRead.getById.and.returnValue(Promise.resolve(gqlPlan));

    const result = await service.getPlan('plan-1');

    expect(result).toBeDefined();
    expect(result?.id).toBe('plan-1');
    expect(result?.title).toBe('Project Execution Plan');
    expect(graphqlRead.getById).toHaveBeenCalledWith('ProjectPlan', 'plan-1', jasmine.any(Array));
  });

  it('should return null if plan not found', async () => {
    graphqlRead.getById.and.returnValue(Promise.resolve(null));

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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: gqlPlans,
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    }));

    const result = await service.listPlans('project-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Project Execution Plan');
    expect(graphqlRead.query).toHaveBeenCalledWith('ProjectPlan', jasmine.any(Array), jasmine.objectContaining({
      filters: { parentId: '.eq.project-1' },
    }));
  });

  it('should update a plan and push to pipeline', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.updatePlan('plan-1', {
      title: 'Updated Plan',
      estimatedDuration: '8 months',
    });

    expect(result.title).toBe('Updated Plan');
    expect(result.estimatedDuration).toBe('8 months');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPlan',
      jasmine.objectContaining({ id: 'plan-1', title: 'Updated Plan' }),
    );
  });

  it('should delete a plan via pipeline', async () => {
    pipelineWrite.deleteEntity.and.returnValue(Promise.resolve());

    await service.deletePlan('plan-1');

    expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('ProjectPlan', 'plan-1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PlanMilestone CRUD (Child Entities)
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a milestone with correct parentId', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.createMilestone('plan-1', {
      parentId: 'plan-1',
      name: 'Phase 1 Complete',
      targetDate: '2026-06-30',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('plan-1');
    expect(result.name).toBe('Phase 1 Complete');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PlanMilestone',
      jasmine.objectContaining({ parentId: 'plan-1', name: 'Phase 1 Complete' }),
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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: gqlMilestones,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 2 },
    }));

    const result = await service.getMilestones('plan-1');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Phase 1 Complete');
    expect(result[1].name).toBe('Phase 2 Complete');
    expect(graphqlRead.query).toHaveBeenCalledWith('PlanMilestone', jasmine.any(Array), jasmine.objectContaining({
      filters: { parentId: '.eq.plan-1' },
    }));
  });

  it('should update a milestone and push to pipeline', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.updateMilestone('milestone-1', {
      status: 'done',
      targetDate: '2026-07-15',
    });

    expect(result.status).toBe('done');
    expect(result.targetDate).toBe('2026-07-15');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PlanMilestone',
      jasmine.objectContaining({ id: 'milestone-1', status: 'done' }),
    );
  });

  it('should delete a milestone via pipeline', async () => {
    pipelineWrite.deleteEntity.and.returnValue(Promise.resolve());

    await service.deleteMilestone('milestone-1');

    expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('PlanMilestone', 'milestone-1');
  });
});
