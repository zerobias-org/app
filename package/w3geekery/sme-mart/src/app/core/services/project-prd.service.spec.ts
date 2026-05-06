/**
 * Unit Tests for ProjectPrdService
 *
 * Tests CRUD operations for ProjectPrd and PrdSection entities.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectPrdService } from './project-prd.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { ImpersonationService } from './impersonation.service';
import { fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlProjectPrdResponse, GqlPrdSectionResponse } from '../gql-types/project-prd.types';

describe('ProjectPrdService', () => {
  let service: ProjectPrdService;
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
        ProjectPrdService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(ProjectPrdService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPrd CRUD
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a PRD and push to pipeline', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.createPrd({
      parentId: 'project-1',
      title: 'Product Requirements',
      summary: 'Requirements for the product',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('project-1');
    expect(result.title).toBe('Product Requirements');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPrd',
      expect.objectContaining({ parentId: 'project-1', title: 'Product Requirements' }),
      [],
      'project-prd.service:76',
    );
  });

  it('should surface error to user on Pipeline rejection for createPrd', async () => {
    const mockError = new Error('Network failure');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(
      service.createPrd({
        parentId: 'project-1',
        title: 'Product Requirements',
      })
    ).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create PRD'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should fetch a single PRD by ID', async () => {
    const gqlPrd: GqlProjectPrdResponse = {
      id: 'prd-1',
      parentId: 'project-1',
      title: 'Product Requirements',
      summary: 'Requirements',
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-03-19T00:00:00Z',
    };

    mockGraphqlRead.getById.mockResolvedValue(gqlPrd);

    const result = await service.getPrd('prd-1');

    expect(result).toBeDefined();
    expect(result?.id).toBe('prd-1');
    expect(result?.title).toBe('Product Requirements');
    expect(mockGraphqlRead.getById).toHaveBeenCalledWith('ProjectPrd', 'prd-1', expect.any(Array));
  });

  it('should return null if PRD not found', async () => {
    mockGraphqlRead.getById.mockResolvedValue(null);

    const result = await service.getPrd('nonexistent');

    expect(result).toBeNull();
  });

  it('should list PRDs for a project', async () => {
    const gqlPrds: GqlProjectPrdResponse[] = [
      {
        id: 'prd-1',
        parentId: 'project-1',
        title: 'Requirements',
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: gqlPrds,
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    });

    const result = await service.listPrds('project-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Requirements');
    expect(mockGraphqlRead.query).toHaveBeenCalledWith('ProjectPrd', expect.any(Array), expect.objectContaining({
      filters: { parentId: '.eq.project-1' },
    }));
  });

  it('should update a PRD and push to pipeline', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.updatePrd('prd-1', {
      title: 'Updated Requirements',
    });

    expect(result.title).toBe('Updated Requirements');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPrd',
      expect.objectContaining({ id: 'prd-1', title: 'Updated Requirements' }),
      [],
      'project-prd.service:164',
    );
  });

  it('should surface error to user on Pipeline rejection for updatePrd', async () => {
    const mockError = new Error('Save failed');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(service.updatePrd('prd-1', { title: 'New Title' })).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update PRD'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should delete a PRD via pipeline', async () => {
    mockPipelineWrite.deleteEntity.mockResolvedValue(undefined);

    await service.deletePrd('prd-1');

    expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('ProjectPrd', 'prd-1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PrdSection CRUD (Child Entities)
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a PRD section with correct parentId', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.createPrdSection('prd-1', {
      parentId: 'prd-1',
      type: 'functional_requirements',
      content: 'User should be able to login',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('prd-1');
    expect(result.type).toBe('functional_requirements');
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PrdSection',
      expect.objectContaining({ parentId: 'prd-1', type: 'functional_requirements' }),
      [],
      'project-prd.service:216',
    );
  });

  it('should surface error to user on Pipeline rejection for createPrdSection', async () => {
    const mockError = new Error('Network failure');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(
      service.createPrdSection('prd-1', {
        parentId: 'prd-1',
        type: 'functional_requirements',
        content: 'Requirements',
      })
    ).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create PRD section'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should get all sections for a PRD', async () => {
    const gqlSections: GqlPrdSectionResponse[] = [
      {
        id: 'section-1',
        parentId: 'prd-1',
        type: 'functional_requirements',
        content: 'Requirements',
        sortOrder: 1,
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
      {
        id: 'section-2',
        parentId: 'prd-1',
        type: 'non_functional_requirements',
        content: 'Performance',
        sortOrder: 2,
        createdAt: '2026-03-19T00:00:00Z',
        updatedAt: '2026-03-19T00:00:00Z',
      },
    ];

    mockGraphqlRead.query.mockResolvedValue({
      items: gqlSections,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 2 },
    });

    const result = await service.getPrdSections('prd-1');

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('functional_requirements');
    expect(result[1].type).toBe('non_functional_requirements');
    expect(mockGraphqlRead.query).toHaveBeenCalledWith('PrdSection', expect.any(Array), expect.objectContaining({
      filters: { parentId: '.eq.prd-1' },
    }));
  });

  it('should update a PRD section and push to pipeline', async () => {
    mockPipelineWrite.pushEntity.mockResolvedValue(undefined);

    const result = await service.updatePrdSection('section-1', {
      content: 'Updated content',
      sortOrder: 2,
    });

    expect(result.content).toBe('Updated content');
    expect(result.sortOrder).toBe(2);
    expect(mockPipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PrdSection',
      expect.objectContaining({ id: 'section-1', content: 'Updated content' }),
      [],
      'project-prd.service:270',
    );
  });

  it('should surface error to user on Pipeline rejection for updatePrdSection', async () => {
    const mockError = new Error('Update failed');
    mockPipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

    await expect(service.updatePrdSection('section-1', { content: 'New content' })).rejects.toThrow(mockError);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update PRD section'),
      'Dismiss',
      expect.any(Object),
    );
  });

  it('should delete a PRD section via pipeline', async () => {
    mockPipelineWrite.deleteEntity.mockResolvedValue(undefined);

    await service.deletePrdSection('section-1');

    expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('PrdSection', 'section-1');
  });

  // ── Demo visibility (Phase 24 Plan 03) ──

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const basePrd = {
      parentId: 'project-1', title: 'PRD', summary: 'A PRD', sourceDocuments: '[]',
      createdAt: '2026-05-05T00:00:00Z', updatedAt: '2026-05-05T00:00:00Z',
    };
    const mockGqlReturn = [
      { ...basePrd, id: '1', title: 'Real', tag: null },
      { ...basePrd, id: '2', title: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...basePrd, id: '3', title: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...basePrd, id: '4', title: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listPrds('project-1');

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listPrds('project-1');

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGraphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listPrds('project-1');

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

      await service.listPrds('project-1');

      const fields = mockGraphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoRecord = { ...basePrd, id: '3', title: 'Demo', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] };
      mockGraphqlRead.getById.mockResolvedValueOnce(demoRecord);

      const result = await service.getPrd('3');

      expect(result).toBeNull();
    });
  });
});
