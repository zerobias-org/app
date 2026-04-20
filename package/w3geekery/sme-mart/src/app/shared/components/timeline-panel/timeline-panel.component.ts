import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZbSearchInputComponent } from '@zerobias-org/ngx-library';
import { TimelineView } from '../timeline-view/timeline-view.component';
import { TimelineComposer } from '../timeline-composer/timeline-composer.component';
import { TimelineFilters } from '../timeline-filters/timeline-filters.component';
import { ResizableDrawerDirective } from '../../directives/resizable-drawer.directive';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import type {
  TimelineEvent,
  TimelineEventType,
  CatalogItem,
  TimelineEnabledFilters,
  TimelineFilterState,
} from '../../../core/models';
import { DEFAULT_TIMELINE_FILTER_STATE } from '../../../core/models';

const EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  comment: 'Comment',
  attachment: 'Attachment',
  bid_submitted: 'Bid Submitted',
  bid_accepted: 'Bid Accepted',
};

@Component({
  selector: 'app-timeline-panel',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    ZbSearchInputComponent,
    TimelineView,
    TimelineComposer,
    TimelineFilters,
    ResizableDrawerDirective,
  ],
  templateUrl: './timeline-panel.component.html',
  styleUrl: './timeline-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelinePanel {
  private readonly prefs = inject(UserPreferencesService);

  private readonly _events = signal<TimelineEvent[]>([]);
  private readonly _loading = signal(false);
  private readonly _taskId = signal<string | null>(null);

  @Input({ required: true })
  set events(value: TimelineEvent[]) { this._events.set(value); }

  @Input()
  set loading(value: boolean) { this._loading.set(value); }

  @Input()
  set taskId(value: string) { this._taskId.set(value || null); }

  @Output() drillDown = new EventEmitter<TimelineEvent>();
  @Output() commentPosted = new EventEmitter<TimelineEvent>();

  readonly isLoading = computed(() => this._loading());
  readonly hasTaskId = computed(() => !!this._taskId());
  readonly currentTaskId = computed(() => this._taskId());

  // Filter state — enabled filters from PKV, selections are session-only
  readonly filterState = signal<TimelineFilterState>({ ...DEFAULT_TIMELINE_FILTER_STATE });
  readonly enabledFilters = this.prefs.timelineEnabledFilters;
  readonly drawerOpen = signal(false);

  // Derived: available filter options extracted from events
  readonly eventTypeItems = computed<CatalogItem[]>(() => {
    const types = new Set(this._events().map(e => e.type));
    return [...types].map(t => ({ id: t, name: EVENT_TYPE_LABELS[t] || t }));
  });

  readonly actorItems = computed<CatalogItem[]>(() => {
    const seen = new Map<string, string>();
    for (const e of this._events()) {
      const key = e.actor.userId || e.actor.name;
      if (!seen.has(key)) seen.set(key, e.actor.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  });

  readonly tagItems = computed<CatalogItem[]>(() => {
    const seen = new Set<string>();
    const items: CatalogItem[] = [];
    for (const e of this._events()) {
      const label = e.source.label;
      if (label && !seen.has(label)) {
        seen.add(label);
        items.push({ id: label, name: label });
      }
    }
    return items;
  });

  readonly activeFilterCount = computed(() => {
    const f = this.filterState();
    let count = 0;
    if (f.eventTypes.length) count++;
    if (f.dateFrom || f.dateTo) count++;
    if (f.actorIds.length) count++;
    if (f.tags.length) count++;
    if (f.searchTerm) count++;
    return count;
  });

  readonly filterTooltip = computed(() => {
    const count = this.activeFilterCount();
    if (count === 0) return 'Toggle filters';
    return `Toggle filters (${count} active)`;
  });

  readonly filteredEvents = computed(() => {
    let events = this._events();
    const f = this.filterState();

    // Text search
    if (f.searchTerm) {
      const term = f.searchTerm.toLowerCase();
      events = events.filter(e => this.matchesSearch(e, term));
    }

    // Event type
    if (f.eventTypes.length > 0) {
      events = events.filter(e => f.eventTypes.includes(e.type));
    }

    // Date range
    if (f.dateFrom) {
      events = events.filter(e => e.timestamp >= f.dateFrom!);
    }
    if (f.dateTo) {
      const endOfDay = new Date(f.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      events = events.filter(e => e.timestamp <= endOfDay);
    }

    // Actor
    if (f.actorIds.length > 0) {
      events = events.filter(e => {
        const key = e.actor.userId || e.actor.name;
        return f.actorIds.includes(key);
      });
    }

    // Tag/Source
    if (f.tags.length > 0) {
      events = events.filter(e => e.source.label && f.tags.includes(e.source.label));
    }

    return events;
  });

  // Actions

  toggleDrawer(): void {
    this.drawerOpen.update(v => !v);
  }

  onSearch(term: string | null): void {
    this.filterState.update(s => ({ ...s, searchTerm: term || '' }));
  }

  onFilterStateChange(state: TimelineFilterState): void {
    this.filterState.set(state);
  }

  onEnabledChange(enabled: TimelineEnabledFilters): void {
    this.prefs.setTimelineEnabledFilters(enabled);
  }

  onCommentPosted(event: TimelineEvent): void {
    this.commentPosted.emit(event);
  }

  private matchesSearch(event: TimelineEvent, term: string): boolean {
    if (event.actor.name.toLowerCase().includes(term)) return true;
    if (event.source.label?.toLowerCase().includes(term)) return true;

    const p = event.payload;
    switch (p.type) {
      case 'comment':
        if (p.plainText?.toLowerCase().includes(term)) return true;
        if (p.markdown?.toLowerCase().includes(term)) return true;
        break;
      case 'attachment':
        if (p.attachment.fileMetadata?.name?.toLowerCase().includes(term)) return true;
        break;
      case 'bid_submitted':
        if (p.providerName.toLowerCase().includes(term)) return true;
        if (p.coverLetterPreview?.toLowerCase().includes(term)) return true;
        break;
      case 'bid_accepted':
        if (p.providerName.toLowerCase().includes(term)) return true;
        break;
    }

    return false;
  }
}
