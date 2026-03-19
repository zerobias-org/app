/**
 * Unit Tests for ProjectPrdService
 *
 * Tests CRUD operations for ProjectPrd and PrdSection entities.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectPrdService } from './project-prd.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import type { GqlProjectPrdResponse, GqlPrdSectionResponse } from '../gql-types/project-prd.types';

describe('ProjectPrdService', () => {
  let service: ProjectPrdService;
  let mockPipelineWrite: { pushEntity: ReturnType<typeof vi.fn>; pushEntities: ReturnType<typeof vi.fn>; deleteEntity: ReturnType<typeof vi.fn>; deleteEntities: ReturnType<typeof vi.fn> };
  let mockGraphqlRead: { query: ReturnType<typeof vi.fn>; getById: ReturnType<typeof vi.fn> };
  let mockImpersonation: { effectiveUserId: ReturnType<typeof vi.fn> };

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
    };
    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('user-123'),
    };

    TestBed.configureTestingModule({
      providers: [
        ProjectPrdService,
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: GraphqlReadService, useValue: mockGraphqlRead },
        { provide: ImpersonationService, useValue: mockImpersonation },
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
    );
  });

  it('should delete a PRD section via pipeline', async () => {
    mockPipelineWrite.deleteEntity.mockResolvedValue(undefined);

    await service.deletePrdSection('section-1');

    expect(mockPipelineWrite.deleteEntity).toHaveBeenCalledWith('PrdSection', 'section-1');
  });
});
