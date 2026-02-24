import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { StarRating } from '../../shared/components/star-rating/star-rating.component';
import { ReviewsService } from '../../core/services/reviews.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { Review } from '../../core/models';

@Component({
  selector: 'app-my-profile-moderate-reviews',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    ZbEmptyStateContainerComponent,
    StarRating,
  ],
  templateUrl: './my-profile-moderate-reviews.component.html',
  styleUrl: './my-profile-moderate-reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfileModerateReviews implements OnInit {
  private readonly impersonation = inject(ImpersonationService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly providerId = signal<string | null>(null);

  readonly pendingReviews = computed(() =>
    this.reviews().filter(r => !r.approved && !r.approved_at),
  );

  async ngOnInit(): Promise<void> {
    try {
      const userId = this.impersonation.effectiveUserId();
      if (!userId) return;

      const provider = await this.providerProfiles.getProviderByUserId(userId);
      if (!provider) return;

      this.providerId.set(provider.id);
      const allReviews = await this.reviewsService.listReviewsByProvider(provider.id, false);
      this.reviews.set(allReviews);
    } catch (err) {
      console.warn('[ModerateReviews] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async approveReview(id: string): Promise<void> {
    try {
      await this.reviewsService.approveReview(id, this.impersonation.effectiveUserId());
      this.reviews.update(list => list.map(r =>
        r.id === id ? { ...r, approved: true, approved_at: new Date().toISOString() } : r,
      ));
      this.snackBar.open('Review approved', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async rejectReview(id: string): Promise<void> {
    try {
      await this.reviewsService.rejectReview(id, this.impersonation.effectiveUserId());
      this.reviews.update(list => list.map(r =>
        r.id === id ? { ...r, approved: false, approved_at: new Date().toISOString() } : r,
      ));
      this.snackBar.open('Review rejected', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }
}
