/**
 * Unit Tests for ProjectPrdService
 *
 * Tests CRUD operations for ProjectPrd and PrdSection entities.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectPrdService } from './project-prd.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import type { GqlProjectPrdResponse, GqlPrdSectionResponse } from '../gql-types/project-prd.types';

describe('ProjectPrdService', () => {
  let service: ProjectPrdService;
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
        ProjectPrdService,
        { provide: PipelineWriteService, useValue: pipelineWriteSpy },
        { provide: GraphqlReadService, useValue: graphqlReadSpy },
        { provide: ImpersonationService, useValue: impersonationSpy },
      ],
    });

    service = TestBed.inject(ProjectPrdService);
    pipelineWrite = TestBed.inject(PipelineWriteService) as jasmine.SpyObj<PipelineWriteService>;
    graphqlRead = TestBed.inject(GraphqlReadService) as jasmine.SpyObj<GraphqlReadService>;
    impersonation = TestBed.inject(ImpersonationService) as jasmine.SpyObj<ImpersonationService>;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // ProjectPrd CRUD
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a PRD and push to pipeline', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.createPrd({
      parentId: 'project-1',
      title: 'Product Requirements',
      summary: 'Requirements for the product',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('project-1');
    expect(result.title).toBe('Product Requirements');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPrd',
      jasmine.objectContaining({ parentId: 'project-1', title: 'Product Requirements' }),
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

    graphqlRead.getById.and.returnValue(Promise.resolve(gqlPrd));

    const result = await service.getPrd('prd-1');

    expect(result).toBeDefined();
    expect(result?.id).toBe('prd-1');
    expect(result?.title).toBe('Product Requirements');
    expect(graphqlRead.getById).toHaveBeenCalledWith('ProjectPrd', 'prd-1', jasmine.any(Array));
  });

  it('should return null if PRD not found', async () => {
    graphqlRead.getById.and.returnValue(Promise.resolve(null));

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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: gqlPrds,
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    }));

    const result = await service.listPrds('project-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Requirements');
    expect(graphqlRead.query).toHaveBeenCalledWith('ProjectPrd', jasmine.any(Array), jasmine.objectContaining({
      filters: { parentId: '.eq.project-1' },
    }));
  });

  it('should update a PRD and push to pipeline', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.updatePrd('prd-1', {
      title: 'Updated Requirements',
    });

    expect(result.title).toBe('Updated Requirements');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'ProjectPrd',
      jasmine.objectContaining({ id: 'prd-1', title: 'Updated Requirements' }),
    );
  });

  it('should delete a PRD via pipeline', async () => {
    pipelineWrite.deleteEntity.and.returnValue(Promise.resolve());

    await service.deletePrd('prd-1');

    expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('ProjectPrd', 'prd-1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // PrdSection CRUD (Child Entities)
  // ────────────────────────────────────────────────────────────────────────────

  it('should create a PRD section with correct parentId', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.createPrdSection('prd-1', {
      parentId: 'prd-1',
      type: 'functional_requirements',
      content: 'User should be able to login',
    });

    expect(result).toBeDefined();
    expect(result.parentId).toBe('prd-1');
    expect(result.type).toBe('functional_requirements');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PrdSection',
      jasmine.objectContaining({ parentId: 'prd-1', type: 'functional_requirements' }),
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

    graphqlRead.query.and.returnValue(Promise.resolve({
      items: gqlSections,
      page: { pageNumber: 1, pageSize: 1000, totalCount: 2 },
    }));

    const result = await service.getPrdSections('prd-1');

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('functional_requirements');
    expect(result[1].type).toBe('non_functional_requirements');
    expect(graphqlRead.query).toHaveBeenCalledWith('PrdSection', jasmine.any(Array), jasmine.objectContaining({
      filters: { parentId: '.eq.prd-1' },
    }));
  });

  it('should update a PRD section and push to pipeline', async () => {
    pipelineWrite.pushEntity.and.returnValue(Promise.resolve());

    const result = await service.updatePrdSection('section-1', {
      content: 'Updated content',
      sortOrder: 2,
    });

    expect(result.content).toBe('Updated content');
    expect(result.sortOrder).toBe(2);
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'PrdSection',
      jasmine.objectContaining({ id: 'section-1', content: 'Updated content' }),
    );
  });

  it('should delete a PRD section via pipeline', async () => {
    pipelineWrite.deleteEntity.and.returnValue(Promise.resolve());

    await service.deletePrdSection('section-1');

    expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('PrdSection', 'section-1');
  });
});
