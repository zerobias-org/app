import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, CurrencyPipe, TitleCasePipe, DecimalPipe } from '@angular/common';
import type { BidStatus, ComplianceSummary } from '../../../core/models';
import { ComplianceProgress } from '../compliance-progress/compliance-progress.component';

export interface BidCardData {
  id: string;
  provider_id: string | null;
  provider_display_name?: string;
  provider_headline?: string;
  provider_rating?: number;
  cover_letter: string | null;
  proposed_price: string | null;
  proposed_timeline: string | null;
  status: BidStatus;
  created_at: string;
  executive_summary?: string | null;
  team_description?: string | null;
  total_estimated_hours?: number | null;
  compliance?: ComplianceSummary | null;
}

@Component({
  selector: 'app-bid-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, DatePipe, CurrencyPipe, TitleCasePipe, DecimalPipe, ComplianceProgress],
  templateUrl: './bid-card.component.html',
  styleUrl: './bid-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidCard {
  private readonly _bid = signal<BidCardData | null>(null);
  private readonly _isBuyer = signal(false);
  private readonly _isOwnBid = signal(false);

  @Input({ required: true })
  set bid(value: BidCardData) {
    this._bid.set(value);
  }

  @Input()
  set isBuyer(value: boolean) {
    this._isBuyer.set(value);
  }

  @Input()
  set isOwnBid(value: boolean) {
    this._isOwnBid.set(value);
  }

  @Output() accept = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();
  @Output() withdraw = new EventEmitter<string>();

  readonly displayName = computed(() => this._bid()?.provider_display_name || 'Anonymous');
  readonly headline = computed(() => this._bid()?.provider_headline || '');
  readonly initials = computed(() => {
    const name = this.displayName();
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  });
  readonly coverLetter = computed(() => this._bid()?.cover_letter || '');
  readonly proposedPrice = computed(() => this._bid()?.proposed_price);
  readonly proposedTimeline = computed(() => this._bid()?.proposed_timeline);
  readonly status = computed(() => this._bid()?.status || 'pending');
  readonly createdAt = computed(() => this._bid()?.created_at || '');
  readonly rating = computed(() => this._bid()?.provider_rating);
  readonly executiveSummary = computed(() => this._bid()?.executive_summary || '');
  readonly teamDescription = computed(() => this._bid()?.team_description || '');
  readonly totalEstimatedHours = computed(() => this._bid()?.total_estimated_hours);
  readonly compliance = computed(() => this._bid()?.compliance || null);
  readonly isDraft = computed(() => this.status() === 'draft');
  readonly isPending = computed(() => this.status() === 'pending');
  readonly showBuyerActions = computed(() => this._isBuyer() && this.isPending());
  readonly showWithdraw = computed(() => this._isOwnBid() && this.isPending());

  readonly statusColor = computed(() => {
    const colorMap: Record<BidStatus, string> = {
      draft: 'default',
      pending: 'default',
      accepted: 'primary',
      rejected: 'warn',
      withdrawn: 'default',
    };
    return colorMap[this.status()] || 'default';
  });

  onAccept(): void {
    const b = this._bid();
    if (b) this.accept.emit(b.id);
  }

  onReject(): void {
    const b = this._bid();
    if (b) this.reject.emit(b.id);
  }

  onWithdraw(): void {
    const b = this._bid();
    if (b) this.withdraw.emit(b.id);
  }
}
