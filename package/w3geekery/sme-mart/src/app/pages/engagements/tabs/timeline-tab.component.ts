import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TimelinePanel } from '../../../shared/components/timeline-panel/timeline-panel.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';
import { EngagementTimelineService } from '../../../core/services/engagement-timeline.service';
import type { TimelineEvent } from '../../../core/models';

@Component({
  selector: 'app-timeline-tab',
  standalone: true,
  imports: [
    MatSnackBarModule,
    TimelinePanel,
  ],
  templateUrl: './timeline-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineTab implements OnInit {
  private readonly ctx = inject(EngagementContextService);
  private readonly engagementTimeline = inject(EngagementTimelineService);
  private readonly snackBar = inject(MatSnackBar);

  readonly timelineEvents = signal<TimelineEvent[]>([]);
  readonly loading = signal(false);

  readonly taskId = this.ctx.engagement()?.zerobias_task_id || '';

  async ngOnInit(): Promise<void> {
    const eng = this.ctx.engagement();
    if (!eng) return;

    this.loading.set(true);
    try {
      const events = await this.engagementTimeline.getTimelineEvents(eng);
      this.timelineEvents.set(events);
    } catch (err: any) {
      console.error('[TimelineTab] Failed to load timeline:', err);
      this.snackBar.open('Failed to load timeline', 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  onCommentPosted(event: TimelineEvent): void {
    this.timelineEvents.update(events => [event, ...events]);
  }

  onTimelineDrillDown(_event: TimelineEvent): void {
    // Phase 2: navigate to relevant tab based on event type
  }
}
