import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
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
  private readonly _engagement = signal<EngagementSummaryRow | null>(null);
  private readonly _currentProviderId = signal<string | null>(null);

  @Input({ required: true })
  set engagement(value: EngagementSummaryRow) {
    this._engagement.set(value);
  }

  @Input()
  set currentProviderId(value: string | null) {
    this._currentProviderId.set(value);
  }

  readonly title = computed(() => this._engagement()?.title || '');
  readonly description = computed(() => this._engagement()?.description || '');
  readonly category = computed(() => this._engagement()?.category || '');
  readonly status = computed(() => this._engagement()?.status || 'draft');
  readonly engagementTag = computed(() => this._engagement()?.engagement_tag || null);
  readonly createdAt = computed(() => this._engagement()?.created_at || '');
  readonly proposalCount = computed(() => this._engagement()?.proposal_count || 0);
  readonly budgetMin = computed(() => this._engagement()?.budget_min);
  readonly budgetMax = computed(() => this._engagement()?.budget_max);
  readonly budgetType = computed(() => this._engagement()?.budget_type);
  readonly timeline = computed(() => this._engagement()?.timeline);
  readonly buyerName = computed(() => this._engagement()?.buyer_display_name || 'Unknown');
  readonly acceptedProviderName = computed(() => this._engagement()?.accepted_provider_name || null);

  readonly isRfp = computed(() => !this.engagementTag());
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

  readonly hasMyProposal = computed(() => {
    const providerId = this._currentProviderId();
    const accepted = this._engagement()?.accepted_provider_id;
    return providerId ? accepted === providerId : false;
  });

  constructor(private readonly router: Router) {}

  navigate(): void {
    const engagement = this._engagement();
    if (engagement) {
      const path = this.isRfp() ? '/rfps' : '/my/engagements';
      this.router.navigate([path, engagement.id]);
    }
  }
}
