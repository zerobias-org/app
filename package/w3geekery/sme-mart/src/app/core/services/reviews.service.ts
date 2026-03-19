import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { REVIEW_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { QueryOptions } from '@zerobias-org/data-utils';
import { PagedResults } from '@zerobias-org/types-core-js';
import type { Review, AdminReviewRow } from '../models';
import type { GqlReviewResponse } from '../gql-types';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  /**
   * List reviews for a specific provider, optionally filtered to approved only.
   * Queries GraphQL with providerId and optional approved filter, returns array (no pagination).
   */
  async listReviewsByProvider(providerId: string, approvedOnly = true): Promise<Review[]> {
    const filters: Record<string, string> = { providerId: `.eq.${providerId}` };
    if (approvedOnly) {
      filters.approved = '.eq.true';
    }

    const gqlOptions: GqlQueryOptions = {
      filters,
      pageNumber: 1,
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlReviewResponse>(
      'Review',
      this.getReviewFields(),
      gqlOptions,
    );

    // Transform and return as array
    return result.items.map(gql =>
      mapGqlToNeon<Review>(gql, REVIEW_FIELD_MAPPING.gqlToNeon),
    );
  }

  /**
   * List all reviews for admin dashboard (no v_admin_reviews VIEW, use GQL query instead).
   * Queries GraphQL with pagination support.
   */
  async listAdminReviews(options?: QueryOptions): Promise<PagedResults<Review>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: {},
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlReviewResponse>(
      'Review',
      this.getReviewFields(),
      gqlOptions,
    );

    // Transform GQL responses to Review (Neon shape)
    const items = result.items.map(gql =>
      mapGqlToNeon<Review>(gql, REVIEW_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }

  /**
   * List pending (unapproved) reviews for admin review workflow.
   * Queries GraphQL with approved=false filter.
   */
  async listPendingReviews(options?: QueryOptions): Promise<PagedResults<Review>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: { approved: '.eq.false' },
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlReviewResponse>(
      'Review',
      this.getReviewFields(),
      gqlOptions,
    );

    // Transform GQL responses to Review (Neon shape)
    const items = result.items.map(gql =>
      mapGqlToNeon<Review>(gql, REVIEW_FIELD_MAPPING.gqlToNeon),
    );

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }

  /**
   * Create a new review and push to Pipeline.
   * Returns optimistic Review immediately (doesn't wait for GQL indexing).
   * Reviews default to unapproved (approved: false, approvedAt/approvedBy: null).
   */
  async createReview(data: {
    provider_id: string;
    reviewer_zerobias_user_id: string;
    request_id?: string;
    rating: number;
    review_text?: string;
  }): Promise<Review> {
    // Generate UUID for new review
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Build Neon-shaped Review
    const review: Review = {
      id,
      provider_id: data.provider_id,
      reviewer_zerobias_user_id: data.reviewer_zerobias_user_id,
      request_id: data.request_id ?? null,
      rating: data.rating,
      review_text: data.review_text ?? null,
      approved: false,
      approved_at: null,
      approved_by: null,
      created_at: now,
      updated_at: now,
    };

    // Transform to GQL shape and push to Pipeline (fire-and-forget)
    const gqlData = mapNeonToGql<GqlReviewResponse>(review, REVIEW_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Review', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to push Review to Pipeline:', err);
    });

    // Return optimistic response immediately
    return review;
  }

  /**
   * Approve a review and push approval metadata to Pipeline (fire-and-forget).
   * Sets approved=true, approvedAt={now}, approvedBy={approverId}.
   * Returns optimistic updated Review.
   */
  async approveReview(reviewId: string, approvedBy: string): Promise<Review> {
    // Fetch current review to merge updates
    const current = await this.graphqlRead.getById<GqlReviewResponse>(
      'Review',
      reviewId,
      this.getReviewFields(),
    );

    if (!current) throw new Error(`Review ${reviewId} not found`);

    // Transform current GQL to Neon, merge approval updates
    const neonCurrent = mapGqlToNeon<Review>(current, REVIEW_FIELD_MAPPING.gqlToNeon);
    const updated: Review = {
      ...neonCurrent,
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      updated_at: new Date().toISOString(),
    };

    // Push to Pipeline
    const gqlData = mapNeonToGql<GqlReviewResponse>(updated, REVIEW_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Review', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to approve Review in Pipeline:', err);
    });

    // Return optimistic response
    return updated;
  }

  /**
   * Reject a review by setting approved=false and updating metadata.
   * Returns optimistic updated Review.
   */
  async rejectReview(reviewId: string, approvedBy: string): Promise<Review> {
    // Fetch current review to merge updates
    const current = await this.graphqlRead.getById<GqlReviewResponse>(
      'Review',
      reviewId,
      this.getReviewFields(),
    );

    if (!current) throw new Error(`Review ${reviewId} not found`);

    // Transform current GQL to Neon, merge rejection updates
    const neonCurrent = mapGqlToNeon<Review>(current, REVIEW_FIELD_MAPPING.gqlToNeon);
    const updated: Review = {
      ...neonCurrent,
      approved: false,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      updated_at: new Date().toISOString(),
    };

    // Push to Pipeline
    const gqlData = mapNeonToGql<GqlReviewResponse>(updated, REVIEW_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Review', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to reject Review in Pipeline:', err);
    });

    // Return optimistic response
    return updated;
  }

  /**
   * Get standard field list for Review GQL queries.
   */
  private getReviewFields(): string[] {
    return [
      'id',
      'providerId',
      'reviewerZerobiasUserId',
      'engagementId',
      'rating',
      'reviewText',
      'approved',
      'approvedAt',
      'approvedBy',
      'createdAt',
      'updatedAt',
    ];
  }
}
