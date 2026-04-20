import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { ComplianceProgress } from '../compliance-progress/compliance-progress.component';
import type { BidSummaryRow, ComplianceSummary, BidStatus } from '../../../core/models';

export interface ComparisonBid {
  id: string;
  provider_display_name: string;
  provider_headline?: string;
  proposed_price: string | null;
  proposed_timeline: string | null;
  total_estimated_hours: number | null;
  status: BidStatus;
  compliance: ComplianceSummary | null;
  /** Per-category compliance from bid_responses (grouped by task type) */
  categoryCompliance: CategoryCompliance[];
  sum_estimated_cost: number;
}

export interface CategoryCompliance {
  category: string;
  met: number;
  total: number;
}

@Component({
  selector: 'app-bid-comparison',
  standalone: true,
  imports: [
    MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, MatTooltipModule,
    CurrencyPipe, DecimalPipe, TitleCasePipe,
    ComplianceProgress,
  ],
  templateUrl: './bid-comparison.component.html',
  styleUrl: './bid-comparison.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidComparison {
  private readonly _bids = signal<ComparisonBid[]>([]);
  private readonly _rfpTitle = signal('');

  @Input({ required: true })
  set bids(value: ComparisonBid[]) { this._bids.set(value); }

  @Input()
  set rfpTitle(value: string) { this._rfpTitle.set(value); }

  @Output() viewBid = new EventEmitter<string>();
  @Output() acceptBid = new EventEmitter<string>();
  @Output() rejectBid = new EventEmitter<string>();

  readonly title = computed(() => this._rfpTitle());
  readonly bidList = computed(() => this._bids().slice(0, 4));
  readonly bidCount = computed(() => this._bids().length);

  /** Get all unique category names across all bids */
  readonly categories = computed(() => {
    const cats = new Set<string>();
    for (const bid of this._bids()) {
      for (const cc of bid.categoryCompliance) {
        cats.add(cc.category);
      }
    }
    return [...cats].sort();
  });

  /** Find best price (lowest non-null) */
  readonly bestPriceBidId = computed(() => {
    let best: { id: string; price: number } | null = null;
    for (const b of this.bidList()) {
      const p = parseFloat(b.proposed_price || '');
      if (!isNaN(p) && (!best || p < best.price)) {
        best = { id: b.id, price: p };
      }
    }
    return best?.id;
  });

  /** Find best compliance (highest met count) */
  readonly bestComplianceBidId = computed(() => {
    let best: { id: string; met: number } | null = null;
    for (const b of this.bidList()) {
      const met = b.compliance?.met ?? 0;
      if (!best || met > best.met) {
        best = { id: b.id, met };
      }
    }
    return best?.id;
  });

  getCategoryCompliance(bid: ComparisonBid, category: string): string {
    const cc = bid.categoryCompliance.find(c => c.category === category);
    if (!cc) return '—';
    return `${cc.met}/${cc.total}`;
  }

  getInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  onView(id: string): void { this.viewBid.emit(id); }
  onAccept(id: string): void { this.acceptBid.emit(id); }
  onReject(id: string): void { this.rejectBid.emit(id); }
}
