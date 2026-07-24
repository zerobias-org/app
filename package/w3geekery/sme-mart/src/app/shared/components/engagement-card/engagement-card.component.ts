import { Component, inject, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, TitleCasePipe, CurrencyPipe } from '@angular/common';
import type { EngagementSummaryRow, RequestStatus } from '../../../core/models';

@Component({
  selector: 'app-engagement-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, DatePipe, TitleCasePipe, CurrencyPipe],
  templateUrl: './engagement-card.component.html',
  styleUrl: './engagement-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementCard {
  private readonly router = inject(Router);

  readonly engagement = input.required<EngagementSummaryRow>();
  readonly currentProviderId = input<string | null>(null);
  // The card is shared between /rfps and /engagements lists. The parent list
  // tells the card which context it is in — do NOT infer from a missing
  // `engagement_tag` field (that broke on the new platform.Project data model
  // which doesn't populate the legacy tag column on the transform path).
  readonly asRfp = input<boolean>(false);

  readonly title = computed(() => this.engagement().title || '');
  readonly description = computed(() => this.engagement().description || '');
  readonly category = computed(() => this.engagement().category || '');
  readonly status = computed(() => this.engagement().status || 'draft');
  readonly engagementTag = computed(() => this.engagement().engagement_tag || null);
  readonly createdAt = computed(() => this.engagement().created_at || '');
  readonly bidCount = computed(() => this.engagement().bid_count || 0);
  readonly budgetMin = computed(() => this.engagement().budget_min);
  readonly budgetMax = computed(() => this.engagement().budget_max);
  readonly budgetType = computed(() => this.engagement().budget_type);
  readonly timeline = computed(() => this.engagement().timeline);
  readonly buyerName = computed(() => this.engagement().buyer_display_name || 'Unknown');
  readonly acceptedProviderName = computed(() => this.engagement().accepted_provider_name || null);
  readonly isRfp = computed(() => this.asRfp());
  readonly lifecycleLabel = computed(() => this.isRfp() ? 'RFP' : 'Engagement');

  readonly statusColor = computed(() => {
    const colorMap: Record<RequestStatus, string> = {
      draft: 'default',
      open: 'primary',
      in_progress: 'accent',
      completed: 'primary',
      cancelled: 'warn',
    };
    return colorMap[this.status()] || 'default';
  });

  readonly hasMyBid = computed(() => {
    const providerId = this.currentProviderId();
    const accepted = this.engagement().accepted_provider_id;
    return providerId ? accepted === providerId : false;
  });

  navigate(): void {
    const e = this.engagement();
    const path = this.isRfp() ? '/rfps' : '/engagements';
    this.router.navigate([path, e.id]);
  }
}
