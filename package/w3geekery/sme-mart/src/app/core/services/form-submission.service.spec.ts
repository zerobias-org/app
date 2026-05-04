import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormSubmissionService } from './form-submission.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import type { FormSubmission } from '../models/form-builder.model';
import type { UUID } from '@zerobias-org/types-core-js';

describe('FormSubmissionService', () => {
  let service: FormSubmissionService;
  let pipelineWrite: ReturnType<typeof TestBed.inject<typeof PipelineWriteService>>;
  let gqlRead: ReturnType<typeof TestBed.inject<typeof GraphqlReadService>>;

  beforeEach(() => {
    const pushEntityMock = vi.fn().mockResolvedValue(undefined);
    const getCachedMock = vi.fn().mockReturnValue(null);
    const seedCacheMock = vi.fn();
    const queryMock = vi.fn().mockResolvedValue({
      items: [],
      page: { pageNumber: 1, pageSize: 50 },
    });
    const getByIdMock = vi.fn().mockResolvedValue(null);

    pipelineWrite = {
      pushEntity: pushEntityMock,
      pushEntities: vi.fn().mockResolvedValue(undefined),
      getCached: getCachedMock,
      seedCache: seedCacheMock,
    };

    gqlRead = {
      query: queryMock,
      getById: getByIdMock,
      rawQuery: vi.fn().mockResolvedValue({}),
    };

    TestBed.configureTestingModule({
      providers: [
        FormSubmissionService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: gqlRead },
      ],
    });

    service = TestBed.inject(FormSubmissionService);
  });

  describe('create', () => {
    it('should create a new FormSubmission with draft status', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;
      const bidId = '22222222-2222-2222-2222-222222222222' as unknown as UUID;

      const result = await service.create(projectId, bidId);

      expect(result).toBeDefined();
      expect(result.projectId).toBe(projectId);
      expect(result.bidId).toBe(bidId);
      expect(result.status).toBe('draft');
      expect(result.submissionData).toEqual({});
      expect(pipelineWrite['pushEntity']).toHaveBeenCalled();
    });

    it('should reject if projectId is missing', async () => {
      const bidId = '22222222-2222-2222-2222-222222222222' as unknown as UUID;

      await expect(service.create('' as unknown as UUID, bidId)).rejects.toThrow(
        /projectId and bidId are required/,
      );
    });

    it('should reject if bidId is missing', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;

      await expect(service.create(projectId, '' as unknown as UUID)).rejects.toThrow(
        /projectId and bidId are required/,
      );
    });

    it('should call pushEntity with correct class ID and flat object', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;
      const bidId = '22222222-2222-2222-2222-222222222222' as unknown as UUID;

      await service.create(projectId, bidId);

      const call = pipelineWrite['pushEntity'].mock.calls[0];
      expect(call[0]).toBe('FormSubmission');
      expect(call[1]['projectId']).toBe(projectId);
      expect(call[1]['bidId']).toBe(bidId);
      expect(call[1]['status']).toBe('draft');
    });
  });

  describe('getById', () => {
    it('should fetch FormSubmission by id', async () => {
      const id = '33333333-3333-3333-3333-333333333333' as unknown as UUID;
      const mockData = {
        id,
        projectId: '11111111-1111-1111-1111-111111111111',
        bidId: '22222222-2222-2222-2222-222222222222',
        submissionData: JSON.stringify({ field1: 'value1' }),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      gqlRead['getById'].mockResolvedValue(mockData);

      const result = await service.getById(id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(id);
      expect(gqlRead['getById']).toHaveBeenCalled();
    });

    it('should return null if FormSubmission not found', async () => {
      const id = '33333333-3333-3333-3333-333333333333' as unknown as UUID;

      gqlRead['getById'].mockResolvedValue(null);

      const result = await service.getById(id);

      expect(result).toBeNull();
    });

    it('should parse JSON submissionData on retrieval', async () => {
      const id = '33333333-3333-3333-3333-333333333333' as unknown as UUID;
      const submissionDataObj = { field1: 'value1', field2: 123 };
      const mockData = {
        id,
        projectId: '11111111-1111-1111-1111-111111111111',
        bidId: '22222222-2222-2222-2222-222222222222',
        submissionData: JSON.stringify(submissionDataObj),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      gqlRead['getById'].mockResolvedValue(mockData);

      const result = await service.getById(id);

      expect(result?.submissionData).toEqual(submissionDataObj);
    });
  });

  describe('getByProjectAndBid', () => {
    it('should fetch FormSubmission by projectId and bidId', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;
      const bidId = '22222222-2222-2222-2222-222222222222' as unknown as UUID;
      const mockData = {
        id: '33333333-3333-3333-3333-333333333333',
        projectId,
        bidId,
        submissionData: '{}',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      gqlRead['query'].mockResolvedValue({
        items: [mockData],
        page: { pageNumber: 1, pageSize: 1 },
      });

      const result = await service.getByProjectAndBid(projectId, bidId);

      expect(result).toBeDefined();
      expect(result?.projectId).toBe(projectId);
      expect(result?.bidId).toBe(bidId);
    });

    it('should return null if no FormSubmission found for project/bid pair', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;
      const bidId = '22222222-2222-2222-2222-222222222222' as unknown as UUID;

      gqlRead['query'].mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 1 },
      });

      const result = await service.getByProjectAndBid(projectId, bidId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update FormSubmission status and data', async () => {
      const id = '33333333-3333-3333-3333-333333333333' as unknown as UUID;
      const mockData = {
        id,
        projectId: '11111111-1111-1111-1111-111111111111',
        bidId: '22222222-2222-2222-2222-222222222222',
        submissionData: '{}',
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      gqlRead['getById'].mockResolvedValue(mockData);

      const result = await service.update(id, { status: 'submitted' });

      expect(pipelineWrite['pushEntity']).toHaveBeenCalled();
      expect(result?.status).toBe('submitted');
    });

    it('should throw if update fails to fetch updated entity', async () => {
      const id = '33333333-3333-3333-3333-333333333333' as unknown as UUID;

      gqlRead['getById'].mockResolvedValue(null);

      await expect(service.update(id, { status: 'submitted' })).rejects.toThrow(
        /Failed to update/,
      );
    });
  });

  describe('markReviewed', () => {
    it('should mark submission as reviewed with timestamp and reviewer', async () => {
      const id = '33333333-3333-3333-3333-333333333333' as unknown as UUID;
      const reviewedBy = '44444444-4444-4444-4444-444444444444' as unknown as UUID;
      const mockData = {
        id,
        projectId: '11111111-1111-1111-1111-111111111111',
        bidId: '22222222-2222-2222-2222-222222222222',
        submissionData: '{}',
        status: 'reviewed',
        reviewedAt: new Date().toISOString(),
        reviewedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      gqlRead['getById'].mockResolvedValue(mockData);

      const result = await service.markReviewed(id, reviewedBy);

      expect(result?.status).toBe('reviewed');
      expect(result?.reviewedBy).toBe(reviewedBy);
      expect(result?.reviewedAt).toBeDefined();
    });
  });

  describe('isDraft', () => {
    it('should return true for draft submissions', () => {
      const submission: FormSubmission = {
        id: '33333333-3333-3333-3333-333333333333' as unknown as UUID,
        projectId: '11111111-1111-1111-1111-111111111111' as unknown as UUID,
        bidId: '22222222-2222-2222-2222-222222222222' as unknown as UUID,
        submissionData: {},
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.isDraft(submission)).toBe(true);
    });

    it('should return false for non-draft submissions', () => {
      const submission: FormSubmission = {
        id: '33333333-3333-3333-3333-333333333333' as unknown as UUID,
        projectId: '11111111-1111-1111-1111-111111111111' as unknown as UUID,
        bidId: '22222222-2222-2222-2222-222222222222' as unknown as UUID,
        submissionData: {},
        status: 'submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.isDraft(submission)).toBe(false);
    });
  });

  describe('getFormSubmissionLock', () => {
    it('should return true if any submission exists for project', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;

      gqlRead['query'].mockResolvedValue({
        items: [{ id: '33333333-3333-3333-3333-333333333333' }],
        page: { pageNumber: 1, pageSize: 1, totalCount: 1 },
      });

      const isLocked = await service.getFormSubmissionLock(projectId);

      expect(isLocked).toBe(true);
    });

    it('should return false if no submissions exist for project', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;

      gqlRead['query'].mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 1, totalCount: 0 },
      });

      const isLocked = await service.getFormSubmissionLock(projectId);

      expect(isLocked).toBe(false);
    });

    it('should return false on query error', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;

      gqlRead['query'].mockRejectedValue(new Error('Query failed'));

      const isLocked = await service.getFormSubmissionLock(projectId);

      expect(isLocked).toBe(false);
    });
  });

  describe('listByProject', () => {
    it('should list all submissions for a project with pagination', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;
      const mockData = [
        {
          id: '33333333-3333-3333-3333-333333333333',
          projectId,
          bidId: '22222222-2222-2222-2222-222222222222',
          submissionData: '{}',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      gqlRead['query'].mockResolvedValue({
        items: mockData,
        page: { pageNumber: 1, pageSize: 10 },
      });

      const results = await service.listByProject(projectId, 1, 10);

      expect(results.length).toBe(1);
      expect(results[0].projectId).toBe(projectId);
      expect(gqlRead['query']).toHaveBeenCalled();
    });

    it('should return empty array on query error', async () => {
      const projectId = '11111111-1111-1111-1111-111111111111' as unknown as UUID;

      gqlRead['query'].mockRejectedValue(new Error('Query failed'));

      const results = await service.listByProject(projectId);

      expect(results).toEqual([]);
    });
  });

  describe('Demo Visibility (Option X - Client-Side Post-Filter)', () => {
    let demoVisibility: ReturnType<typeof TestBed.inject<typeof DemoVisibilityService>>;

    beforeEach(() => {
      const demoVisibilityMock = {
        applyVisibility: vi.fn((records) => records)
      };
      const projectContextMock = {
        isAdmin: vi.fn().mockReturnValue(false)
      };

      TestBed.configureTestingModule({
        providers: [
          FormSubmissionService,
          { provide: PipelineWriteService, useValue: pipelineWrite },
          { provide: GraphqlReadService, useValue: gqlRead },
          { provide: DemoVisibilityService, useValue: demoVisibilityMock },
          { provide: ProjectContextService, useValue: projectContextMock }
        ]
      });

      service = TestBed.inject(FormSubmissionService);
      demoVisibility = TestBed.inject(DemoVisibilityService);
    });

    it('[DG-02] listByProject strips demo records for non-admin users', async () => {
      const projectId = '22222222-2222-2222-2222-222222222222' as unknown as UUID;
      const realSubmission: FormSubmission = {
        id: 'real-1' as UUID,
        projectId,
        bidId: 'bid-1' as UUID,
        submissionData: {},
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        tag: null
      };
      const demoSubmission: FormSubmission = {
        id: 'demo-1' as UUID,
        projectId,
        bidId: 'bid-2' as UUID,
        submissionData: {},
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]
      };

      gqlRead['query'].mockResolvedValue({
        items: [realSubmission, demoSubmission],
        page: { pageNumber: 1, pageSize: 10 }
      });
      demoVisibility.applyVisibility.mockImplementation((records: Array<Record<string, unknown> & { tag?: Array<{ value: string }> | null }>) =>
        records.filter(r => !r.tag?.some((t) => [
          '81053c14-a8e5-4939-b538-c122c7d0eb1a',
          'd618b602-21cc-40a1-a9fa-534b7bc1672c'
        ].includes(t.value)))
      );

      const result = await service.listByProject(projectId);

      expect(demoVisibility.applyVisibility).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('real-1');
    });

    it('[DG-02] includes tag field in GQL query for listByProject', async () => {
      const projectId = '33333333-3333-3333-3333-333333333333' as unknown as UUID;

      gqlRead['query'].mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 10 }
      });

      await service.listByProject(projectId);

      const fieldList = gqlRead['query'].mock.calls[0][1];
      expect(fieldList).toContain('tag');
    });
  });
});
