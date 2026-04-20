import {
  Component, Input, ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';
import { MarkdownView } from '../markdown-view/markdown-view.component';
import { ComplianceProgress } from '../compliance-progress/compliance-progress.component';
import type { BidSummaryRow, TaskTypePricing, ComplianceSummary } from '../../../core/models';

@Component({
  selector: 'app-bid-summary',
  standalone: true,
  imports: [
    MatCardModule, MatChipsModule, MatIconModule,
    CurrencyPipe, DecimalPipe, TitleCasePipe, DatePipe,
    MarkdownView, ComplianceProgress,
  ],
  templateUrl: './bid-summary.component.html',
  styleUrl: './bid-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidSummary {
  private readonly _bid = signal<BidSummaryRow | null>(null);

  @Input({ required: true })
  set bid(value: BidSummaryRow) { this._bid.set(value); }

  readonly bidData = computed(() => this._bid());
  readonly executiveSummary = computed(() => this._bid()?.executive_summary || '');
  readonly coverLetter = computed(() => this._bid()?.cover_letter || '');
  readonly teamDescription = computed(() => this._bid()?.team_description || '');
  readonly proposedPrice = computed(() => this._bid()?.proposed_price);
  readonly proposedTimeline = computed(() => this._bid()?.proposed_timeline);
  readonly status = computed(() => this._bid()?.status || 'pending');
  readonly createdAt = computed(() => this._bid()?.created_at || '');

  readonly pricingBreakdown = computed<TaskTypePricing[]>(() => {
    const b = this._bid();
    if (!b?.pricing_breakdown) return [];
    return typeof b.pricing_breakdown === 'string'
      ? JSON.parse(b.pricing_breakdown)
      : b.pricing_breakdown;
  });

  readonly totalEstimatedHours = computed(() =>
    this.pricingBreakdown().reduce((sum, row) => sum + (row.estimatedHours || 0), 0),
  );

  readonly totalEstimatedCost = computed(() =>
    this.pricingBreakdown().reduce((sum, row) => sum + (row.estimatedCost || 0), 0),
  );

  readonly compliance = computed<ComplianceSummary | null>(() => {
    const s = this._bid();
    if (!s || !s.total_responses) return null;
    return {
      met: Number(s.met_count) || 0,
      partially_met: Number(s.partial_count) || 0,
      not_met: Number(s.not_met_count) || 0,
      not_applicable: Number(s.na_count) || 0,
      planned: Number(s.planned_count) || 0,
      total: Number(s.total_responses) || 0,
      responded: Number(s.total_responses) || 0,
    };
  });

  readonly sumHours = computed(() => Number(this._bid()?.sum_estimated_hours) || 0);
  readonly sumCost = computed(() => Number(this._bid()?.sum_estimated_cost) || 0);
}
