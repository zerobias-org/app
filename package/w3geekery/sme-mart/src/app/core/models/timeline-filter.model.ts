import type { TimelineEventType } from './timeline-event.model';

export type TimelineFilterType = 'eventType' | 'dateRange' | 'actor' | 'tag';

/** Which timeline filter sections are enabled/visible in the filter panel */
export interface TimelineEnabledFilters {
  eventType: boolean;
  dateRange: boolean;
  actor: boolean;
  tag: boolean;
}

/** Active timeline filter selections */
export interface TimelineFilterState {
  eventTypes: TimelineEventType[];
  dateFrom: Date | null;
  dateTo: Date | null;
  actorIds: string[];
  tags: string[];
  searchTerm: string;
}

export const DEFAULT_TIMELINE_ENABLED_FILTERS: TimelineEnabledFilters = {
  eventType: true,
  dateRange: false,
  actor: false,
  tag: false,
};

export const DEFAULT_TIMELINE_FILTER_STATE: TimelineFilterState = {
  eventTypes: [],
  dateFrom: null,
  dateTo: null,
  actorIds: [],
  tags: [],
  searchTerm: '',
};
