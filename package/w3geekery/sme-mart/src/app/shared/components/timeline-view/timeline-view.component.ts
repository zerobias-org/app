import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal, effect,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { TimelineEventCard } from '../timeline-event-card/timeline-event-card.component';
import type { TimelineEvent, TimelineEventType } from '../../../core/models';

const NODE_ICON_MAP: Record<TimelineEventType, string> = {
  comment: 'chat_bubble',
  attachment: 'attach_file',
  bid_submitted: 'rate_review',
  bid_accepted: 'check_circle',
};

@Component({
  selector: 'app-timeline-view',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, ZbEmptyStateContainerComponent, TimelineEventCard],
  templateUrl: './timeline-view.component.html',
  styleUrl: './timeline-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineView {
  private readonly _events = signal<TimelineEvent[]>([]);
  private readonly _loading = signal(false);

  @Input({ required: true })
  set events(value: TimelineEvent[]) { this._events.set(value); }

  @Input()
  set loading(value: boolean) { this._loading.set(value); }

  @Output() drillDown = new EventEmitter<TimelineEvent>();

  readonly timelineEvents = computed(() => this._events());
  readonly isLoading = computed(() => this._loading());
  readonly isEmpty = computed(() => !this._loading() && this._events().length === 0);
  readonly hasEvents = computed(() => this._events().length > 0);

  // Expand/collapse state
  readonly expandedIds = signal(new Set<string>());
  readonly allExpanded = signal(false);

  constructor() {
    // When events change, set initial expand state (latest 5 expanded)
    effect(() => {
      const events = this._events();
      if (events.length > 0) {
        const ids = new Set(events.slice(0, 5).map(e => e.id));
        this.expandedIds.set(ids);
        this.allExpanded.set(events.length <= 5);
      }
    });
  }

  isExpanded(eventId: string): boolean {
    return this.expandedIds().has(eventId);
  }

  toggleEvent(eventId: string): void {
    const ids = new Set(this.expandedIds());
    if (ids.has(eventId)) {
      ids.delete(eventId);
    } else {
      ids.add(eventId);
    }
    this.expandedIds.set(ids);
    this.allExpanded.set(ids.size === this._events().length);
  }

  toggleAll(): void {
    if (this.allExpanded()) {
      this.expandedIds.set(new Set<string>());
      this.allExpanded.set(false);
    } else {
      const ids = new Set(this._events().map(e => e.id));
      this.expandedIds.set(ids);
      this.allExpanded.set(true);
    }
  }

  /**
   * Returns the month label if this event starts a new month group,
   * or null if it's in the same month as the previous event.
   * Events are sorted newest-first.
   */
  getMonthDivider(index: number): string | null {
    const events = this._events();
    const current = events[index];
    if (!current) return null;

    const currentKey = this.monthKey(current.timestamp);

    if (index === 0) return this.monthLabel(current.timestamp);

    const prev = events[index - 1];
    const prevKey = this.monthKey(prev.timestamp);

    return currentKey !== prevKey ? this.monthLabel(current.timestamp) : null;
  }

  getSide(index: number): 'left' | 'right' {
    return index % 2 === 0 ? 'left' : 'right';
  }

  getNodeIcon(type: TimelineEventType): string {
    return NODE_ICON_MAP[type] || 'circle';
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }

  private monthLabel(date: Date): string {
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const now = new Date();
    // Only show year if it's different from current year
    return year === now.getFullYear() ? month : `${month} ${year}`;
  }
}
