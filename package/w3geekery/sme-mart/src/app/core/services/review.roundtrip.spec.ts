/**
 * Roundtrip Field Validation Tests for Review Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, REVIEW_FIELD_MAPPING } from '@/core/field-mappings';
import { REVIEW_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlReviewResponse } from '@/core/gql-types';
import type { Review } from '@/core/models/review.model';

/**
 * Test factory to create a Neon Review object with all fields populated
 */
function makeReview(overrides?: Partial<Review>): Review {
  return {
    id: 'review-001',
    provider_id: 'provider-001',
    reviewer_zerobias_user_id: 'user-buyer-001',
    request_id: 'eng-001',
    rating: 5,
    review_text: 'Outstanding work from the compliance team.',
    approved: true,
    approved_at: '2026-03-18T16:00:00Z',
    approved_by: 'user-admin-uuid',
    created_at: '2026-03-18T15:30:00Z',
    updated_at: '2026-03-18T16:00:00Z',
    ...overrides,
  };
}

describe('INFRA-04: Review Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon Review fields to GQL camelCase', () => {
      const neonModel = makeReview();

      const gqlData = mapNeonToGql<GqlReviewResponse>(neonModel, REVIEW_FIELD_MAPPING.neonToGql);

      expect(gqlData.id).toBe('review-001');
      expect(gqlData.providerId).toBe('provider-001');
      expect(gqlData.reviewerZerobiasUserId).toBe('user-buyer-001');
      expect(gqlData.engagementId).toBe('eng-001'); // request_id → engagementId
      expect(gqlData.rating).toBe(5);
      expect(gqlData.reviewText).toBe('Outstanding work from the compliance team.');
      expect(gqlData.approved).toBe(true);
      expect(gqlData.approvedAt).toBe('2026-03-18T16:00:00Z');
      expect(gqlData.approvedBy).toBe('user-admin-uuid');
      expect(gqlData.createdAt).toBe('2026-03-18T15:30:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-18T16:00:00Z');
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeReview();
      const gqlData = mapNeonToGql<GqlReviewResponse>(neonModel, REVIEW_FIELD_MAPPING.neonToGql);
      const gqlKeys = Object.keys(gqlData);

      const expectedFieldCount = Object.keys(REVIEW_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      expect(gqlData.id).toBeDefined();
      expect(gqlData.providerId).toBeDefined();
      expect(gqlData.reviewerZerobiasUserId).toBeDefined();
      expect(gqlData.engagementId).toBeDefined();
      expect(gqlData.rating).toBeDefined();
    });

    it('should handle unapproved reviews', () => {
      const neonModel = makeReview({
        approved: false,
        approved_at: null,
        approved_by: null,
      });

      const gqlData = mapNeonToGql<GqlReviewResponse>(neonModel, REVIEW_FIELD_MAPPING.neonToGql);

      expect(gqlData.approved).toBe(false);
      expect(gqlData.approvedAt).toBeNull();
      expect(gqlData.approvedBy).toBeNull();
    });

    it('should handle various rating values', () => {
      for (let rating = 1; rating <= 5; rating++) {
        const neonModel = makeReview({ rating });
        const gqlData = mapNeonToGql<GqlReviewResponse>(neonModel, REVIEW_FIELD_MAPPING.neonToGql);
        expect(gqlData.rating).toBe(rating);
      }
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeReview({
        review_text: null,
        approved: false,
        approved_at: null,
        approved_by: null,
      });

      const gqlData = mapNeonToGql<GqlReviewResponse>(neonModel, REVIEW_FIELD_MAPPING.neonToGql);

      expect(gqlData.reviewText).toBeNull();
      expect(gqlData.approvedAt).toBeNull();
      expect(gqlData.approvedBy).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = REVIEW_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Review>(gqlData, REVIEW_FIELD_MAPPING.gqlToNeon);

      expect(neonModel.id).toBe('review-001-uuid');
      expect(neonModel.provider_id).toBe('provider-001-uuid');
      expect(neonModel.reviewer_zerobias_user_id).toBe('user-buyer-001-uuid');
      expect(neonModel.request_id).toBe('eng-001-uuid-hipaa-assessment');
      expect(neonModel.rating).toBe(5);
      expect(neonModel.approved).toBe(true);
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = REVIEW_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Review>(gqlData, REVIEW_FIELD_MAPPING.gqlToNeon);
      const neonKeys = Object.keys(neonModel);

      const expectedFieldCount = Object.keys(REVIEW_FIELD_MAPPING.gqlToNeon).length;
      expect(neonKeys.length).toBe(expectedFieldCount);
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      const originalNeon = makeReview({
        id: 'review-roundtrip-001',
        provider_id: 'provider-roundtrip-001',
        reviewer_zerobias_user_id: 'user-reviewer-roundtrip',
        request_id: 'eng-roundtrip-001',
        rating: 4,
        review_text: 'Good work with minor improvements needed',
        approved: true,
      });

      const gqlData = mapNeonToGql<GqlReviewResponse>(
        originalNeon,
        REVIEW_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<Review>(gqlData, REVIEW_FIELD_MAPPING.gqlToNeon);

      expect(roundtrippedNeon.id).toBe('review-roundtrip-001');
      expect(roundtrippedNeon.provider_id).toBe('provider-roundtrip-001');
      expect(roundtrippedNeon.reviewer_zerobias_user_id).toBe('user-reviewer-roundtrip');
      expect(roundtrippedNeon.request_id).toBe('eng-roundtrip-001');
      expect(roundtrippedNeon.rating).toBe(4);
      expect(roundtrippedNeon.review_text).toBe('Good work with minor improvements needed');
      expect(roundtrippedNeon.approved).toBe(true);
    });

    it('should preserve review text content through roundtrip', () => {
      const longReviewText = `Excellent compliance audit delivered by the team.
Key strengths:
- Thorough documentation review
- Clear remediation recommendations
- Responsive to questions

Areas for improvement:
- Could have included more industry benchmarks`;

      const originalNeon = makeReview({
        review_text: longReviewText,
      });

      const gqlData = mapNeonToGql<GqlReviewResponse>(
        originalNeon,
        REVIEW_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<Review>(gqlData, REVIEW_FIELD_MAPPING.gqlToNeon);

      expect(roundtrippedNeon.review_text).toBe(longReviewText);
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(REVIEW_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(REVIEW_FIELD_MAPPING.gqlToNeon);
      expect(forwardKeys.length).toBe(reverseKeys.length);
    });
  });
});
