import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, CurrencyPipe, TitleCasePipe, DecimalPipe } from '@angular/common';
import type { ProposalStatus } from '../../../core/models';

export interface ProposalCardData {
  id: string;
  provider_id: string | null;
  provider_display_name?: string;
  provider_headline?: string;
  provider_rating?: number;
  cover_letter: string | null;
  proposed_price: string | null;
  proposed_timeline: string | null;
  status: ProposalStatus;
  created_at: string;
}

@Component({
  selector: 'app-proposal-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, DatePipe, CurrencyPipe, TitleCasePipe, DecimalPipe],
  templateUrl: './proposal-card.component.html',
  styleUrl: './proposal-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalCard {
  private readonly _proposal = signal<ProposalCardData | null>(null);
  private readonly _isBuyer = signal(false);
  private readonly _isOwnProposal = signal(false);

  @Input({ required: true })
  set proposal(value: ProposalCardData) {
    this._proposal.set(value);
  }

  @Input()
  set isBuyer(value: boolean) {
    this._isBuyer.set(value);
  }

  @Input()
  set isOwnProposal(value: boolean) {
    this._isOwnProposal.set(value);
  }

  @Output() accept = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();
  @Output() withdraw = new EventEmitter<string>();

  readonly displayName = computed(() => this._proposal()?.provider_display_name || 'Anonymous');
  readonly headline = computed(() => this._proposal()?.provider_headline || '');
  readonly initials = computed(() => {
    const name = this.displayName();
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  });
  readonly coverLetter = computed(() => this._proposal()?.cover_letter || '');
  readonly proposedPrice = computed(() => this._proposal()?.proposed_price);
  readonly proposedTimeline = computed(() => this._proposal()?.proposed_timeline);
  readonly status = computed(() => this._proposal()?.status || 'pending');
  readonly createdAt = computed(() => this._proposal()?.created_at || '');
  readonly rating = computed(() => this._proposal()?.provider_rating);
  readonly isPending = computed(() => this.status() === 'pending');
  readonly showBuyerActions = computed(() => this._isBuyer() && this.isPending());
  readonly showWithdraw = computed(() => this._isOwnProposal() && this.isPending());

  readonly statusColor = computed(() => {
    const colorMap: Record<ProposalStatus, string> = {
      pending: 'default',
      accepted: 'primary',
      rejected: 'warn',
      withdrawn: 'default',
    };
    return colorMap[this.status()] || 'default';
  });

  onAccept(): void {
    const p = this._proposal();
    if (p) this.accept.emit(p.id);
  }

  onReject(): void {
    const p = this._proposal();
    if (p) this.reject.emit(p.id);
  }

  onWithdraw(): void {
    const p = this._proposal();
    if (p) this.withdraw.emit(p.id);
  }
}
