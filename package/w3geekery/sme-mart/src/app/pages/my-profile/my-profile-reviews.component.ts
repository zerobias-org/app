import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { StarRating } from '../../shared/components/star-rating/star-rating.component';
import { ReviewsService } from '../../core/services/reviews.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { Review } from '../../core/models';

@Component({
  selector: 'app-my-profile-reviews',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatChipsModule, ZbEmptyStateContainerComponent, StarRating],
  templateUrl: './my-profile-reviews.component.html',
  styleUrl: './my-profile-reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileReviews implements OnInit {
  private readonly impersonation = inject(ImpersonationService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly providerProfiles = inject(ProviderProfilesService);

  readonly loading = signal(true);
  readonly reviews = signal<Review[]>([]);

  readonly averageRating = computed(() => {
    const r = this.reviews();
    if (!r.length) return null;
    const sum = r.reduce((acc, rev) => acc + rev.rating, 0);
    return sum / r.length;
  });

  async ngOnInit() {
    try {
      const userId = this.impersonation.effectiveUserId();
      const detail = await this.providerProfiles.getProviderByUserId(userId);
      if (detail) {
        const reviewList = await this.reviewsService.listReviewsByProvider(detail.id, false);
        this.reviews.set(reviewList);
      }
    } catch (err) {
      console.warn('[MyProfileReviews] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(review: Review): string {
    return review.approved ? 'Approved' : 'Pending';
  }

  getStatusColor(review: Review): string {
    return review.approved ? 'primary' : 'accent';
  }
}
