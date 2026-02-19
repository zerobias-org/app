import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type { PagedResults } from '@zerobias-org/types-core-js';
import type { Review, AdminReviewRow } from '../models';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly db = inject(SmeMartDbService);

  async listReviewsByProvider(providerId: string, approvedOnly = true): Promise<Review[]> {
    const filter = approvedOnly
      ? `(&(provider_id=${providerId})(approved=true))`
      : `(provider_id=${providerId})`;
    const result = await this.db.searchRows<Review>('reviews', filter, { pageSize: 100 });
    return result.items || [];
  }

  async listAdminReviews(options?: QueryOptions): Promise<PagedResults<AdminReviewRow>> {
    return this.db.listRows<AdminReviewRow>('v_admin_reviews', options);
  }

  async listPendingReviews(options?: QueryOptions): Promise<PagedResults<AdminReviewRow>> {
    return this.db.searchRows<AdminReviewRow>(
      'v_admin_reviews',
      '(approved=false)',
      options,
    );
  }

  async createReview(data: {
    provider_id: string;
    reviewer_zerobias_user_id: string;
    request_id?: string;
    rating: number;
    review_text?: string;
  }): Promise<Review> {
    return this.db.createRow<Review>('reviews', {
      ...data,
      approved: false,
    });
  }

  async approveReview(reviewId: string, approvedBy: string): Promise<Review> {
    return this.db.updateRow<Review>('reviews', reviewId, {
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    });
  }

  async rejectReview(reviewId: string, approvedBy: string): Promise<Review> {
    return this.db.updateRow<Review>('reviews', reviewId, {
      approved: false,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    });
  }
}
