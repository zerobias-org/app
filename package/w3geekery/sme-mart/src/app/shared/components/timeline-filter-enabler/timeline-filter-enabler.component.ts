import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { TimelineEnabledFilters, TimelineFilterType } from '../../../core/models';
import { DEFAULT_TIMELINE_ENABLED_FILTERS } from '../../../core/models';

interface FilterOption {
  type: TimelineFilterType;
  label: string;
}

const OPTIONS: FilterOption[] = [
  { type: 'eventType', label: 'Event Type' },
  { type: 'dateRange', label: 'Date Range' },
  { type: 'actor', label: 'Actor' },
  { type: 'tag', label: 'Tag / Source' },
];

@Component({
  selector: 'app-timeline-filter-enabler',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatCheckboxModule, MatTooltipModule],
  templateUrl: './timeline-filter-enabler.component.html',
  styleUrl: './timeline-filter-enabler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineFilterEnabler {
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  private readonly _enabled = signal<TimelineEnabledFilters>({ ...DEFAULT_TIMELINE_ENABLED_FILTERS });

  @Input()
  set enabledFilters(value: TimelineEnabledFilters) {
    this._enabled.set(value);
  }

  @Output() enabledChange = new EventEmitter<TimelineEnabledFilters>();

  readonly options = OPTIONS;

  isEnabled(type: TimelineFilterType): boolean {
    return this._enabled()[type];
  }

  onToggle(type: TimelineFilterType, event: MatCheckboxChange): void {
    const current = this._enabled();
    const updated: TimelineEnabledFilters = { ...current, [type]: event.checked };
    this._enabled.set(updated);
    this.enabledChange.emit(updated);
  }
}
