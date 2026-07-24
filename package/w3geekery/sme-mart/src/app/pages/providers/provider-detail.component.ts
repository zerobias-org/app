import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { ZbEmptyStateContainerComponent, ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { StarRating } from '../../shared/components/star-rating/star-rating.component';
import { ServiceCard } from '../../shared/components/service-card/service-card.component';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ServiceOfferingsService } from '../../core/services/service-offerings.service';
import { ReviewsService } from '../../core/services/reviews.service';
import type { ServiceOffering, Review, ProviderDetailView } from '../../core/models';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    DatePipe,
    ZbEmptyStateContainerComponent,
    ZbResourceStatusComponent,
    StarRating,
    ServiceCard,
  ],
  templateUrl: './provider-detail.component.html',
  styleUrl: './provider-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly serviceOfferings = inject(ServiceOfferingsService);
  private readonly reviewsService = inject(ReviewsService);

  readonly providerId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly loading = signal(true);
  readonly provider = signal<ProviderDetailView | null>(null);
  readonly services = signal<ServiceOffering[]>([]);
  readonly reviews = signal<Review[]>([]);

  readonly initials = signal('');
  readonly rating = signal<number | null>(null);

  async ngOnInit() {
    const id = this.providerId();
    if (!id) return;

    try {
      const [detail, svcList, reviewList] = await Promise.all([
        this.providerProfiles.getProvider(id),
        this.serviceOfferings.getServicesByProvider(id),
        this.reviewsService.listReviewsByProvider(id),
      ]);

      if (detail) {
        this.provider.set(detail);
        this.initials.set(this.getInitials(detail.legalName));
      }
      this.services.set(svcList);
      this.reviews.set(reviewList);
    } catch (err) {
      console.warn('[ProviderDetail] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private getInitials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }
}
