import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { CurrencyPipe, DecimalPipe, TitleCasePipe, DatePipe } from '@angular/common';
import { MarkdownView } from '../markdown-view/markdown-view.component';
import { ComplianceProgress } from '../compliance-progress/compliance-progress.component';
import type {
  BidSummaryRow, BidResponse, ComplianceSummary,
  ComplianceStatus, TaskTypePricing,
} from '../../../core/models';
import { COMPLIANCE_STATUS_OPTIONS } from '../../../core/models/bid-response.model';

/** Requirement with vendor response paired */
export interface RequirementWithResponse {
  requirementId: string;
  requirementText: string;
  taskType: string;
  response?: BidResponse;
}

/** Group of requirements by task type with responses */
export interface RequirementGroup {
  taskType: string;
  requirements: RequirementWithResponse[];
  met: number;
  total: number;
  responded: number;
}

@Component({
  selector: 'app-bid-review',
  standalone: true,
  imports: [
    MatCardModule, MatChipsModule, MatIconModule, MatButtonModule,
    MatExpansionModule, MatDividerModule,
    CurrencyPipe, DecimalPipe, TitleCasePipe, DatePipe,
    MarkdownView, ComplianceProgress,
  ],
  templateUrl: './bid-review.component.html',
  styleUrl: './bid-review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidReview {
  private readonly _bid = signal<BidSummaryRow | null>(null);
  private readonly _groups = signal<RequirementGroup[]>([]);

  @Input({ required: true })
  set bid(value: BidSummaryRow) { this._bid.set(value); }

  @Input({ required: true })
  set requirementGroups(value: RequirementGroup[]) { this._groups.set(value); }

  @Output() accept = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();

  readonly bidData = computed(() => this._bid());
  readonly groups = computed(() => this._groups());
  readonly status = computed(() => this._bid()?.status || 'pending');
  readonly isPending = computed(() => this.status() === 'pending');

  readonly providerName = computed(() => {
    const bid = this._bid();
    return bid?.provider_display_name || 'Vendor';
  });

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

  readonly pricingBreakdown = computed<TaskTypePricing[]>(() => {
    const b = this._bid();
    if (!b?.pricing_breakdown) return [];
    return typeof b.pricing_breakdown === 'string'
      ? JSON.parse(b.pricing_breakdown)
      : b.pricing_breakdown;
  });

  readonly executiveSummary = computed(() => this._bid()?.executive_summary || '');
  readonly teamDescription = computed(() => this._bid()?.team_description || '');
  readonly proposedPrice = computed(() => this._bid()?.proposed_price);
  readonly proposedTimeline = computed(() => this._bid()?.proposed_timeline);
  readonly sumHours = computed(() => Number(this._bid()?.sum_estimated_hours) || 0);
  readonly sumCost = computed(() => Number(this._bid()?.sum_estimated_cost) || 0);

  getStatusColor(status: ComplianceStatus): string {
    return COMPLIANCE_STATUS_OPTIONS.find(o => o.value === status)?.color || '#9e9e9e';
  }

  getStatusLabel(status: ComplianceStatus): string {
    return COMPLIANCE_STATUS_OPTIONS.find(o => o.value === status)?.label || status;
  }

  onAccept(): void {
    const b = this._bid();
    if (b) this.accept.emit(b.id);
  }

  onReject(): void {
    const b = this._bid();
    if (b) this.reject.emit(b.id);
  }

  onBack(): void {
    this.back.emit();
  }
}
