/**
 * Unit Tests for ReviewsService (Pipeline + GraphQL Migration)
 *
 * Tests verify service works with mocked PipelineWriteService and GraphqlReadService.
 * All service methods should return data immediately (optimistic updates) without
 * waiting for GQL indexing.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReviewsService } from './reviews.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { REVIEW_FIELD_MAPPING } from '../field-mappings';
import { REVIEW_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ReviewsService (Pipeline + GraphQL)', () => {
  let service: ReviewsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false); // non-admin by default

    TestBed.configureTestingModule({
      providers: [
        ReviewsService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(ReviewsService);
  });

  describe('listReviewsByProvider()', () => {
    it('should query GQL with providerId filter and status=approved by default', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [REVIEW_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.listReviewsByProvider('provider-001-uuid');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Review',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            providerId: '.eq.provider-001-uuid',
            status: '.eq.approved',
          }),
        }),
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should support approvedOnly=false to list all reviews', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [REVIEW_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      await service.listReviewsByProvider('provider-001-uuid', false);

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Review',
        expect.any(Array),
        expect.objectContaining({
          filters: {
            providerId: '.eq.provider-001-uuid',
            // No 'approved' filter when approvedOnly=false
          },
        }),
      );
    });

    it('should transform GQL responses to Neon shape', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [REVIEW_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.listReviewsByProvider('provider-001-uuid');

      expect(result[0]).toHaveProperty('provider_id');
      expect(result[0]).not.toHaveProperty('providerId');
      expect(result[0]).toHaveProperty('reviewer_zerobias_user_id');
      expect(result[0]).not.toHaveProperty('reviewerZerobiasUserId');
    });
  });

  describe('listAdminReviews()', () => {
    it('should query GQL for all reviews with pagination', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [REVIEW_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      const result = await service.listAdminReviews({ pageNumber: 1, pageSize: 50 });

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Review',
        expect.any(Array),
        expect.objectContaining({
          filters: {},
          pageNumber: 1,
          pageSize: 50,
        }),
      );
      expect(result).toHaveProperty('pageNumber', 1);
      expect(result).toHaveProperty('pageSize', 50);
    });

    it('should replace v_admin_reviews VIEW with GQL query', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
      });

      await service.listAdminReviews();

      // Should query 'Review' entity, not 'v_admin_reviews' table
      expect(graphqlRead.query).toHaveBeenCalledWith('Review', expect.any(Array), expect.any(Object));
      expect(graphqlRead.query).not.toHaveBeenCalledWith('v_admin_reviews', expect.any(Array), expect.any(Object));
    });
  });

  describe('listPendingReviews()', () => {
    it('should query GQL with status=pending filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [REVIEW_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      await service.listPendingReviews({ pageNumber: 1, pageSize: 50 });

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Review',
        expect.any(Array),
        expect.objectContaining({
          filters: { status: '.eq.pending' },
        }),
      );
    });

    it('should return PagedResults with pending reviews', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [REVIEW_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      const result = await service.listPendingReviews();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pageNumber');
      expect(result).toHaveProperty('count');
      expect(result.count).toBe(1);
    });
  });

  describe('createReview()', () => {
    it('should push to Pipeline and return optimistic Review with generated UUID', async () => {
      const result = await service.createReview({
        provider_id: 'provider-001-uuid',
        reviewer_zerobias_user_id: 'user-buyer-001-uuid',
        request_id: 'eng-001-uuid',
        rating: 5,
        review_text: 'Excellent service!',
      });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Review',
        expect.objectContaining({
          providerId: 'provider-001-uuid',
          reviewerZerobiasUserId: 'user-buyer-001-uuid',
          engagementId: 'eng-001-uuid',
        }),
        [],
        'reviews.service:143',
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('approved', false);
      expect(result).toHaveProperty('approved_at', null);
      expect(result).toHaveProperty('approved_by', null);
    });

    it('should apply field mapping during Pipeline push (camelCase GQL)', async () => {
      await service.createReview({
        provider_id: 'provider-001-uuid',
        reviewer_zerobias_user_id: 'user-001-uuid',
        rating: 4,
      });

      // Verify the pushed data has GQL field names (camelCase)
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Review',
        expect.objectContaining({
          providerId: 'provider-001-uuid',
          reviewerZerobiasUserId: 'user-001-uuid',
          approved: false,
        }),
        [],
        'reviews.service:143',
      );
    });

    it('should handle optional fields with null defaults', async () => {
      const result = await service.createReview({
        provider_id: 'provider-001-uuid',
        reviewer_zerobias_user_id: 'user-001-uuid',
        rating: 3,
      });

      expect(result).toHaveProperty('request_id', null);
      expect(result).toHaveProperty('review_text', null);
      expect(result).toHaveProperty('approved_at', null);
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Network failure');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.createReview({
          provider_id: 'provider-001-uuid',
          reviewer_zerobias_user_id: 'user-001-uuid',
          rating: 5,
        })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save review'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('approveReview()', () => {
    it('should fetch, merge approval metadata, and push to Pipeline', async () => {
      graphqlRead.getById.mockResolvedValue(REVIEW_GQL_FIXTURE);

      const result = await service.approveReview('review-001-uuid', 'admin-user-uuid');

      expect(graphqlRead.getById).toHaveBeenCalledWith('Review', 'review-001-uuid', expect.any(Array));
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Review',
        expect.objectContaining({
          approved: true,
          approvedBy: 'admin-user-uuid',
        }),
        [],
        'reviews.service:193',
      );
      expect(result).toHaveProperty('approved', true);
      expect(result).toHaveProperty('approved_by', 'admin-user-uuid');
      expect(result).toHaveProperty('approved_at');
    });

    it('should throw error if review not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      await expect(service.approveReview('nonexistent-id', 'admin-user')).rejects.toThrow('Review nonexistent-id not found');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      graphqlRead.getById.mockResolvedValue(REVIEW_GQL_FIXTURE);
      const mockError = new Error('Save failed');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.approveReview('review-001-uuid', 'admin-user-uuid')).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to approve review'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('rejectReview()', () => {
    it('should fetch, set approved=false, and push to Pipeline', async () => {
      graphqlRead.getById.mockResolvedValue(REVIEW_GQL_FIXTURE);

      const result = await service.rejectReview('review-001-uuid', 'admin-user-uuid');

      expect(graphqlRead.getById).toHaveBeenCalledWith('Review', 'review-001-uuid', expect.any(Array));
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Review',
        expect.objectContaining({
          approved: false,
          approvedBy: 'admin-user-uuid',
        }),
        [],
        'reviews.service:228',
      );
      expect(result).toHaveProperty('approved', false);
      expect(result).toHaveProperty('approved_by', 'admin-user-uuid');
    });

    it('should throw error if review not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      await expect(service.rejectReview('nonexistent-id', 'admin-user')).rejects.toThrow('Review nonexistent-id not found');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      graphqlRead.getById.mockResolvedValue(REVIEW_GQL_FIXTURE);
      const mockError = new Error('Save failed');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.rejectReview('review-001-uuid', 'admin-user-uuid')).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to reject review'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('field mapping roundtrip', () => {
    it('should correctly map Neon → GQL → Neon', () => {
      const neonOriginal = {
        id: 'review-001',
        provider_id: 'provider-001',
        reviewer_zerobias_user_id: 'user-001',
        request_id: 'eng-001',
        rating: 5,
        review_text: 'Great work',
        approved: true,
        approved_at: '2026-03-18T16:00:00Z',
        approved_by: 'admin-001',
        created_at: '2026-03-18T15:00:00Z',
        updated_at: '2026-03-18T16:00:00Z',
      };

      // Map Neon → GQL
      const gqlShape = REVIEW_FIELD_MAPPING.neonToGql;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gqlData: Record<string, any> = {};
      for (const [neonField, gqlField] of Object.entries(gqlShape)) {
        if (neonField in neonOriginal) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gqlData[gqlField] = (neonOriginal as any)[neonField];
        }
      }

      // Map GQL → Neon (reverse)
      const gqlReverseShape = REVIEW_FIELD_MAPPING.gqlToNeon;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const neonResult: Record<string, any> = {};
      for (const [gqlField, neonField] of Object.entries(gqlReverseShape)) {
        if (gqlField in gqlData) {
          neonResult[neonField] = gqlData[gqlField];
        }
      }

      // Verify roundtrip preserved all fields
      expect(neonResult['provider_id']).toBe(neonOriginal.provider_id);
      expect(neonResult['reviewer_zerobias_user_id']).toBe(neonOriginal.reviewer_zerobias_user_id);
      expect(neonResult['request_id']).toBe(neonOriginal.request_id);
      expect(neonResult['approved']).toBe(neonOriginal.approved);
      expect(neonResult['approved_by']).toBe(neonOriginal.approved_by);
    });
  });
});

describe('Demo visibility (Phase 24 Plan 03)', () => {
  let service: ReviewsService;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  const mockGqlReturn = [
    { ...REVIEW_GQL_FIXTURE, id: '1', tag: null },
    { ...REVIEW_GQL_FIXTURE, id: '2', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
    { ...REVIEW_GQL_FIXTURE, id: '3', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
    { ...REVIEW_GQL_FIXTURE, id: '4', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
  ];

  beforeEach(() => {
    graphqlRead = fakeGraphqlReadService();
    mockProjectContext = fakeProjectContextService(false); // non-admin by default

    TestBed.configureTestingModule({
      providers: [
        ReviewsService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: fakePipelineWriteService() },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    });

    service = TestBed.inject(ReviewsService);
  });

  it('[DG-02] strips demo records for non-admin in listAdminReviews', async () => {
    graphqlRead.query.mockResolvedValue({
      items: mockGqlReturn,
      page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
    });

    const result = await service.listAdminReviews();

    expect(result.items.length).toBeLessThan(4);
  });

  it('[DG-03] admin sees all records including demo in listAdminReviews', async () => {
    graphqlRead.query.mockResolvedValue({
      items: mockGqlReturn,
      page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
    });
    mockProjectContext.setIsAdmin(true);

    const result = await service.listAdminReviews();

    expect(result.items.length).toBe(4);
  });

  it('[DG-02] does NOT add server-side tag negation filter', async () => {
    graphqlRead.query.mockResolvedValue({
      items: mockGqlReturn,
      page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
    });

    await service.listAdminReviews();

    const callArgs = graphqlRead.query.mock.calls[0];
    const filters = callArgs[2]?.filters ?? {};
    const filterValues = Object.values(filters).join(' ');
    expect(filterValues).not.toContain('.not in.');
    expect(filterValues).not.toContain('.ne.');
  });

  it('requests tag field in GQL query', async () => {
    graphqlRead.query.mockResolvedValue({
      items: mockGqlReturn,
      page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
    });

    await service.listAdminReviews();

    const callArgs = graphqlRead.query.mock.calls[0];
    const fields = callArgs[1] as string[];
    expect(fields).toContain('tag');
  });

  it('[DG-02] applies filter to listPendingReviews', async () => {
    graphqlRead.query.mockResolvedValue({
      items: mockGqlReturn,
      page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
    });

    const result = await service.listPendingReviews();

    expect(result.items.length).toBeLessThan(4);
  });
});
