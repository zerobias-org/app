import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal, inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import type { TimelineEvent, TimelineEventType } from '../../../core/models';
import { MarkdownView } from '../markdown-view/markdown-view.component';

const ICON_MAP: Record<TimelineEventType, string> = {
  comment: 'chat_bubble',
  attachment: 'attach_file',
  bid_submitted: 'rate_review',
  bid_accepted: 'check_circle',
};

const LABEL_MAP: Record<TimelineEventType, string> = {
  comment: 'Comment',
  attachment: 'Attachment',
  bid_submitted: 'Bid Submitted',
  bid_accepted: 'Bid Accepted',
};

@Component({
  selector: 'app-timeline-event-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, DatePipe, CurrencyPipe, DecimalPipe, MarkdownView],
  templateUrl: './timeline-event-card.component.html',
  styleUrl: './timeline-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineEventCard {
  private readonly _event = signal<TimelineEvent | null>(null);
  private readonly _expanded = signal(false);

  @Input({ required: true })
  set event(value: TimelineEvent) { this._event.set(value); }

  @Input()
  set expanded(value: boolean) { this._expanded.set(value); }

  @Output() toggleExpand = new EventEmitter<string>();
  @Output() drillDown = new EventEmitter<TimelineEvent>();

  readonly timelineEvent = computed(() => this._event());
  readonly isExpanded = computed(() => this._expanded());
  readonly payload = computed(() => this._event()?.payload);

  readonly icon = computed(() => {
    const type = this._event()?.type;
    return type ? ICON_MAP[type] : 'circle';
  });

  readonly typeLabel = computed(() => {
    const type = this._event()?.type;
    return type ? LABEL_MAP[type] : '';
  });

  readonly accentClass = computed(() => `accent-${this._event()?.type || 'comment'}`);

  readonly actorInitials = computed(() => {
    const name = this._event()?.actor.name || '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  });

  readonly previewText = computed(() => {
    const p = this._event()?.payload;
    if (!p) return '';
    switch (p.type) {
      case 'comment':
        return (p.plainText || p.markdown || '').slice(0, 80);
      case 'attachment':
        return p.attachment.fileMetadata?.name || 'File';
      case 'bid_submitted':
        return `${p.providerName} submitted a bid`;
      case 'bid_accepted':
        return `${p.providerName}'s bid accepted`;
    }
  });

  readonly commentMarkdown = computed(() => {
    const p = this._event()?.payload;
    if (!p || p.type !== 'comment') return '';
    return p.markdown || p.plainText || '';
  });

  onToggle(): void {
    const ev = this._event();
    if (ev) this.toggleExpand.emit(ev.id);
  }

  onDrillDown(): void {
    const ev = this._event();
    if (ev) this.drillDown.emit(ev);
  }
}
