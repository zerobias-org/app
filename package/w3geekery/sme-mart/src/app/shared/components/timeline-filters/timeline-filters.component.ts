import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed, ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TimelineFilterSection } from '../timeline-filter-section/timeline-filter-section.component';
import { TimelineFilterEnabler } from '../timeline-filter-enabler/timeline-filter-enabler.component';
import type {
  CatalogItem,
  TimelineEnabledFilters,
  TimelineFilterState,
  TimelineFilterType,
} from '../../../core/models';
import {
  DEFAULT_TIMELINE_ENABLED_FILTERS,
  DEFAULT_TIMELINE_FILTER_STATE,
} from '../../../core/models';

@Component({
  selector: 'app-timeline-filters',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    TimelineFilterSection,
    TimelineFilterEnabler,
  ],
  templateUrl: './timeline-filters.component.html',
  styleUrl: './timeline-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineFilters {
  @ViewChild(TimelineFilterEnabler) private filterEnabler!: TimelineFilterEnabler;

  private readonly _enabledFilters = signal<TimelineEnabledFilters>({ ...DEFAULT_TIMELINE_ENABLED_FILTERS });
  private readonly _filterState = signal<TimelineFilterState>({ ...DEFAULT_TIMELINE_FILTER_STATE });
  private readonly _eventTypeItems = signal<CatalogItem[]>([]);
  private readonly _actorItems = signal<CatalogItem[]>([]);
  private readonly _tagItems = signal<CatalogItem[]>([]);

  @Input()
  set enabledFilters(value: TimelineEnabledFilters) { this._enabledFilters.set(value); }

  @Input()
  set filterState(value: TimelineFilterState) { this._filterState.set(value); }

  @Input()
  set eventTypeItems(value: CatalogItem[]) { this._eventTypeItems.set(value); }

  @Input()
  set actorItems(value: CatalogItem[]) { this._actorItems.set(value); }

  @Input()
  set tagItems(value: CatalogItem[]) { this._tagItems.set(value); }

  @Output() filterStateChange = new EventEmitter<TimelineFilterState>();
  @Output() enabledChange = new EventEmitter<TimelineEnabledFilters>();

  readonly dateRangeCollapsed = signal(false);

  get currentEnabled(): TimelineEnabledFilters {
    return this._enabledFilters();
  }

  get currentState(): TimelineFilterState {
    return this._filterState();
  }

  get hasActiveFilters(): boolean {
    const f = this._filterState();
    return f.eventTypes.length > 0
      || f.dateFrom !== null
      || f.dateTo !== null
      || f.actorIds.length > 0
      || f.tags.length > 0;
  }

  // Accessors for section items
  eventTypeItems$ = computed(() => this._eventTypeItems());
  actorItems$ = computed(() => this._actorItems());
  tagItems$ = computed(() => this._tagItems());

  // Selected IDs as Sets for section inputs
  selectedEventTypes = computed(() => new Set(this._filterState().eventTypes));
  selectedActorIds = computed(() => new Set(this._filterState().actorIds));
  selectedTags = computed(() => new Set(this._filterState().tags));

  // Date accessors
  dateFrom = computed(() => this._filterState().dateFrom);
  dateTo = computed(() => this._filterState().dateTo);

  get hasDateRange(): boolean {
    const f = this._filterState();
    return f.dateFrom !== null || f.dateTo !== null;
  }

  get dateRangeCount(): number {
    const f = this._filterState();
    let count = 0;
    if (f.dateFrom) count++;
    if (f.dateTo) count++;
    return count;
  }

  // Event handlers

  onEnabledChange(updated: TimelineEnabledFilters): void {
    this._enabledFilters.set(updated);
    this.enabledChange.emit(updated);
  }

  onSectionChange(event: { filterType: TimelineFilterType; selectedIds: Set<string> }): void {
    const current = this._filterState();
    let updated: TimelineFilterState;

    switch (event.filterType) {
      case 'eventType':
        updated = { ...current, eventTypes: [...event.selectedIds] as any };
        break;
      case 'actor':
        updated = { ...current, actorIds: [...event.selectedIds] };
        break;
      case 'tag':
        updated = { ...current, tags: [...event.selectedIds] };
        break;
      default:
        return;
    }

    this._filterState.set(updated);
    this.filterStateChange.emit(updated);
  }

  onRemoveSection(type: TimelineFilterType): void {
    // Disable the section
    const current = this._enabledFilters();
    const updated: TimelineEnabledFilters = { ...current, [type]: false };
    this._enabledFilters.set(updated);
    this.enabledChange.emit(updated);

    // Clear that section's selections
    const state = this._filterState();
    let updatedState: TimelineFilterState;
    switch (type) {
      case 'eventType':
        updatedState = { ...state, eventTypes: [] };
        break;
      case 'dateRange':
        updatedState = { ...state, dateFrom: null, dateTo: null };
        break;
      case 'actor':
        updatedState = { ...state, actorIds: [] };
        break;
      case 'tag':
        updatedState = { ...state, tags: [] };
        break;
      default:
        return;
    }
    this._filterState.set(updatedState);
    this.filterStateChange.emit(updatedState);
  }

  onDateFromChange(event: MatDatepickerInputEvent<Date>): void {
    const current = this._filterState();
    const updated = { ...current, dateFrom: event.value };
    this._filterState.set(updated);
    this.filterStateChange.emit(updated);
  }

  onDateToChange(event: MatDatepickerInputEvent<Date>): void {
    const current = this._filterState();
    const updated = { ...current, dateTo: event.value };
    this._filterState.set(updated);
    this.filterStateChange.emit(updated);
  }

  toggleDateRangeCollapse(): void {
    this.dateRangeCollapsed.update(v => !v);
  }

  clearAll(): void {
    const cleared: TimelineFilterState = { ...DEFAULT_TIMELINE_FILTER_STATE };
    this._filterState.set(cleared);
    this.filterStateChange.emit(cleared);
  }

  openFilterMenu(): void {
    this.filterEnabler?.menuTrigger?.openMenu();
  }
}
