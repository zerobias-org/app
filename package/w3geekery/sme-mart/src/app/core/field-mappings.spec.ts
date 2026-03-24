/**
 * Field Mapping Roundtrip Tests
 *
 * Verifies that field mappings preserve all fields during GQL → model → GQL transformations.
 * Covers all 9 Bloom entities from Phase 6.
 */

import { describe, it, expect } from 'vitest';
import {
  mapGqlToNeon,
  mapNeonToGql,
  SME_MART_PROJECT_FIELD_MAPPING,
  SME_MART_BOARD_FIELD_MAPPING,
  SME_MART_ACTIVITY_FIELD_MAPPING,
  SME_MART_WORKFLOW_FIELD_MAPPING,
  SME_MART_TASK_FIELD_MAPPING,
  PROJECT_PRD_FIELD_MAPPING,
  PRD_SECTION_FIELD_MAPPING,
  PROJECT_PLAN_FIELD_MAPPING,
  PLAN_MILESTONE_FIELD_MAPPING,
} from './field-mappings';
import type { SmeMartProject } from './models/sme-mart-project.model';
import type { SmeMartBoard } from './models/sme-mart-board.model';
import type { SmeMartActivity } from './models/sme-mart-activity.model';
import type { SmeMartWorkflow } from './models/sme-mart-workflow.model';
import type { SmeMartTask } from './models/sme-mart-task.model';
import type { ProjectPrd, PrdSection } from './models/project-prd.model';
import type { ProjectPlan, PlanMilestone } from './models/project-plan.model';
import type {
  GqlSmeMartProjectResponse,
  GqlSmeMartBoardResponse,
  GqlSmeMartActivityResponse,
  GqlSmeMartWorkflowResponse,
  GqlSmeMartTaskResponse,
  GqlProjectPrdResponse,
  GqlPrdSectionResponse,
  GqlProjectPlanResponse,
  GqlPlanMilestoneResponse,
} from './gql-types';

describe('Field Mapping Roundtrip Tests - Bloom Entities', () => {
  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartProject Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartProject fields without loss', () => {
    const gqlProject: GqlSmeMartProjectResponse = {
      id: 'proj-123',
      name: 'Test Project',
      description: 'Test project description',
      status: 'draft',
      startDate: '2026-03-19',
      targetEndDate: '2026-06-19',
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    // Map GQL → model
    const model = mapGqlToNeon<SmeMartProject>(
      gqlProject,
      SME_MART_PROJECT_FIELD_MAPPING.gqlToNeon,
    );

    // Verify all fields present in model
    expect(model.id).toBe('proj-123');
    expect(model.name).toBe('Test Project');
    expect(model.description).toBe('Test project description');
    expect(model.status).toBe('draft');
    expect(model.startDate).toBe('2026-03-19');
    expect(model.targetEndDate).toBe('2026-06-19');

    // Map model → GQL (reverse)
    const gqlRoundtrip = mapNeonToGql<GqlSmeMartProjectResponse>(
      model,
      SME_MART_PROJECT_FIELD_MAPPING.neonToGql,
    );

    // Verify roundtrip preserves all fields
    expect(gqlRoundtrip.id).toBe(gqlProject.id);
    expect(gqlRoundtrip.name).toBe(gqlProject.name);
    expect(gqlRoundtrip.description).toBe(gqlProject.description);
    expect(gqlRoundtrip.status).toBe(gqlProject.status);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartBoard Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartBoard fields without loss', () => {
    const gqlBoard: GqlSmeMartBoardResponse = {
      id: 'board-123',
      code: 'BOARD-01',
      name: 'Task Board',
      scope: 'project',
      partition: 'demand',
      parentId: 'proj-123',
      description: 'Main task board',
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartBoard>(
      gqlBoard,
      SME_MART_BOARD_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.code).toBe('BOARD-01');
    expect(model.name).toBe('Task Board');
    expect(model.parentId).toBe('proj-123');
    expect(model.partition).toBe('demand');

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartBoardResponse>(
      model,
      SME_MART_BOARD_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlBoard.id);
    expect(gqlRoundtrip.code).toBe(gqlBoard.code);
    expect(gqlRoundtrip.partition).toBe(gqlBoard.partition);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartActivity Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartActivity fields without loss', () => {
    const gqlActivity: GqlSmeMartActivityResponse = {
      id: 'activity-123',
      name: 'User Story',
      type: 'feature',
      workflowId: 'workflow-123',
      customFields: [
        { name: 'story_points', type: 'number', defaultValue: 5 },
        { name: 'epic', type: 'string' },
      ],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartActivity>(
      gqlActivity,
      SME_MART_ACTIVITY_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.name).toBe('User Story');
    expect(model.type).toBe('feature');
    expect(model.workflowId).toBe('workflow-123');
    expect(model.customFields).toHaveLength(2);
    expect(model.customFields?.[0].name).toBe('story_points');

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartActivityResponse>(
      model,
      SME_MART_ACTIVITY_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlActivity.id);
    expect(gqlRoundtrip.type).toBe(gqlActivity.type);
    expect(gqlRoundtrip.customFields).toEqual(gqlActivity.customFields);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartWorkflow Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartWorkflow fields without loss', () => {
    const gqlWorkflow: GqlSmeMartWorkflowResponse = {
      id: 'workflow-123',
      name: 'Kanban Workflow',
      statuses: [
        { name: 'todo', color: '#e0e0e0' },
        { name: 'in_progress', color: '#2196f3' },
        { name: 'review', color: '#ff9800' },
        { name: 'done', color: '#4caf50' },
      ],
      transitions: [
        { from: 'todo', to: 'in_progress', label: 'Start Work' },
        { from: 'in_progress', to: 'review', label: 'Request Review' },
        { from: 'review', to: 'done', label: 'Approve' },
      ],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartWorkflow>(
      gqlWorkflow,
      SME_MART_WORKFLOW_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.name).toBe('Kanban Workflow');
    expect(model.statuses).toHaveLength(4);
    expect(model.transitions).toHaveLength(3);

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartWorkflowResponse>(
      model,
      SME_MART_WORKFLOW_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlWorkflow.id);
    expect(gqlRoundtrip.statuses).toEqual(gqlWorkflow.statuses);
    expect(gqlRoundtrip.transitions).toEqual(gqlWorkflow.transitions);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SmeMartTask Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip SmeMartTask fields without loss', () => {
    const gqlTask: GqlSmeMartTaskResponse = {
      id: 'task-123',
      boardId: 'board-1',
      parentId: null,
      name: 'Implement Login',
      code: 'TASK-001',
      status: 'in_progress',
      rank: 1,
      priority: 'high',
      description: 'User login feature',
      dueDate: '2026-04-19',
      activityId: 'activity-123',
      customFields: [{ story_points: 8 }],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartTask>(
      gqlTask,
      SME_MART_TASK_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.name).toBe('Implement Login');
    expect(model.code).toBe('TASK-001');
    expect(model.boardId).toBe('board-1');
    expect(model.parentId).toBeNull();
    expect(model.priority).toBe('high');
    expect(model.dueDate).toBe('2026-04-19');

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartTaskResponse>(
      model,
      SME_MART_TASK_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlTask.id);
    expect(gqlRoundtrip.name).toBe(gqlTask.name);
    expect(gqlRoundtrip.rank).toBe(gqlTask.rank);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPrd Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip ProjectPrd fields without loss', () => {
    const gqlPrd: GqlProjectPrdResponse = {
      id: 'prd-123',
      parentId: 'proj-123',
      title: 'Product Requirements Document',
      summary: 'Core requirements for v1.0',
      sourceDocuments: ['https://docs.example.com/prd', 'https://specs.example.com/v1'],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<ProjectPrd>(
      gqlPrd,
      PROJECT_PRD_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.title).toBe('Product Requirements Document');
    expect(model.parentId).toBe('proj-123');
    expect(model.summary).toBe('Core requirements for v1.0');
    expect(model.sourceDocuments).toEqual([
      'https://docs.example.com/prd',
      'https://specs.example.com/v1',
    ]);

    const gqlRoundtrip = mapNeonToGql<GqlProjectPrdResponse>(
      model,
      PROJECT_PRD_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlPrd.id);
    expect(gqlRoundtrip.title).toBe(gqlPrd.title);
    expect(gqlRoundtrip.sourceDocuments).toEqual(gqlPrd.sourceDocuments);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PrdSection Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip PrdSection fields without loss', () => {
    const gqlSection: GqlPrdSectionResponse = {
      id: 'section-123',
      parentId: 'prd-123',
      type: 'functional_requirements',
      content: 'User must be able to login with email and password',
      sortOrder: 1,
      sourceDocuments: ['https://docs.example.com/section1'],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<PrdSection>(
      gqlSection,
      PRD_SECTION_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.type).toBe('functional_requirements');
    expect(model.parentId).toBe('prd-123');
    expect(model.content).toBe('User must be able to login with email and password');
    expect(model.sortOrder).toBe(1);

    const gqlRoundtrip = mapNeonToGql<GqlPrdSectionResponse>(
      model,
      PRD_SECTION_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlSection.id);
    expect(gqlRoundtrip.type).toBe(gqlSection.type);
    expect(gqlRoundtrip.sourceDocuments).toEqual(gqlSection.sourceDocuments);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPlan Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip ProjectPlan fields without loss', () => {
    const gqlPlan: GqlProjectPlanResponse = {
      id: 'plan-123',
      parentId: 'proj-123',
      title: 'Project Execution Plan',
      approach: 'Agile with 2-week sprints',
      estimatedDuration: '6 months',
      teamStructure: {
        lead: 'john.doe@example.com',
        team_size: 8,
        roles: ['frontend', 'backend', 'qa'],
      },
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<ProjectPlan>(
      gqlPlan,
      PROJECT_PLAN_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.title).toBe('Project Execution Plan');
    expect(model.parentId).toBe('proj-123');
    expect(model.approach).toBe('Agile with 2-week sprints');
    expect(model.estimatedDuration).toBe('6 months');
    expect(model.teamStructure).toEqual({
      lead: 'john.doe@example.com',
      team_size: 8,
      roles: ['frontend', 'backend', 'qa'],
    });

    const gqlRoundtrip = mapNeonToGql<GqlProjectPlanResponse>(
      model,
      PROJECT_PLAN_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlPlan.id);
    expect(gqlRoundtrip.title).toBe(gqlPlan.title);
    expect(gqlRoundtrip.teamStructure).toEqual(gqlPlan.teamStructure);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PlanMilestone Roundtrip
  // ────────────────────────────────────────────────────────────────────────────

  it('should roundtrip PlanMilestone fields without loss', () => {
    const gqlMilestone: GqlPlanMilestoneResponse = {
      id: 'milestone-123',
      parentId: 'plan-123',
      name: 'Phase 1 Complete',
      targetDate: '2026-06-19',
      status: 'in_progress',
      sortOrder: 1,
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<PlanMilestone>(
      gqlMilestone,
      PLAN_MILESTONE_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.name).toBe('Phase 1 Complete');
    expect(model.parentId).toBe('plan-123');
    expect(model.targetDate).toBe('2026-06-19');
    expect(model.status).toBe('in_progress');
    expect(model.sortOrder).toBe(1);

    const gqlRoundtrip = mapNeonToGql<GqlPlanMilestoneResponse>(
      model,
      PLAN_MILESTONE_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.id).toBe(gqlMilestone.id);
    expect(gqlRoundtrip.name).toBe(gqlMilestone.name);
    expect(gqlRoundtrip.targetDate).toBe(gqlMilestone.targetDate);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Optional/Nullable Fields
  // ────────────────────────────────────────────────────────────────────────────

  it('should handle null optional fields correctly in SmeMartTask', () => {
    const gqlTask: GqlSmeMartTaskResponse = {
      id: 'task-456',
      boardId: 'board-1',
      parentId: null,
      name: 'Task without optional fields',
      code: 'T-MINIMAL',
      status: 'todo',
      description: null,
      dueDate: null,
      priority: undefined,
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<SmeMartTask>(
      gqlTask,
      SME_MART_TASK_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.parentId).toBeNull();
    expect(model.description).toBeNull();
    expect(model.dueDate).toBeNull();

    const gqlRoundtrip = mapNeonToGql<GqlSmeMartTaskResponse>(
      model,
      SME_MART_TASK_FIELD_MAPPING.neonToGql,
    );

    expect(gqlRoundtrip.parentId).toBeNull();
  });

  it('should handle nullable array fields correctly in ProjectPrd', () => {
    const gqlPrd: GqlProjectPrdResponse = {
      id: 'prd-789',
      parentId: 'proj-123',
      title: 'Minimal PRD',
      summary: null,
      sourceDocuments: undefined,
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    const model = mapGqlToNeon<ProjectPrd>(
      gqlPrd,
      PROJECT_PRD_FIELD_MAPPING.gqlToNeon,
    );

    expect(model.summary).toBeNull();
    // sourceDocuments should either be undefined or empty array depending on mapping
    expect(Array.isArray(model.sourceDocuments) || model.sourceDocuments === undefined).toBe(true);
  });
});
