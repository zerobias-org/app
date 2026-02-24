import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe, TitleCasePipe } from '@angular/common';
import type { TaskExtended, Transition } from '@zerobias-com/platform-sdk';
import { MarkdownView } from '../markdown-view/markdown-view.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    MatCardModule, MatChipsModule, MatIconModule,
    MatButtonModule, MatMenuModule,
    DatePipe, TitleCasePipe,
    MarkdownView,
  ],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  private readonly _task = signal<TaskExtended | null>(null);
  private readonly _isMaster = signal(false);

  @Input({ required: true })
  set task(value: TaskExtended) { this._task.set(value); }

  @Input()
  set isMaster(value: boolean) { this._isMaster.set(value); }

  @Output() transitioned = new EventEmitter<{ taskId: string; transitionId: string }>();

  readonly taskData = computed(() => this._task());
  readonly isMasterTask = computed(() => this._isMaster());

  readonly taskCode = computed(() => this._task()?.code || '');
  readonly taskName = computed(() => this._task()?.name || '');
  readonly taskDescription = computed(() => this._task()?.description || '');
  readonly taskStatus = computed(() => this._task()?.status || '');
  readonly taskCreated = computed(() => {
    const d = this._task()?.created;
    if (!d) return '';
    return d instanceof Date ? d.toISOString() : String(d);
  });

  readonly priorityLabel = computed(() => this._task()?.priority?.label || '');
  readonly priorityValue = computed(() => this._task()?.priority?.value ?? 0);

  readonly assignedName = computed(() => this._task()?.assigned?.contactName || '');
  readonly assignedImageUrl = computed(() => this._task()?.assigned?.imageUrl?.toString() || '');

  readonly ownerName = computed(() => this._task()?.owner?.name || '');

  readonly commentCount = computed(() => this._task()?.nbComments ?? 0);
  readonly attachmentCount = computed(() => this._task()?.nbAttachments ?? 0);

  readonly transitions = computed<Transition[]>(() => this._task()?.nextTransitions || []);
  readonly hasTransitions = computed(() => this.transitions().length > 0);

  readonly statusClass = computed(() => {
    const status = this.taskStatus().toLowerCase().replace(/\s+/g, '_');
    return `task-status-chip ${status}`;
  });

  /** Format status string: snake_case → "UPPER CASE" */
  readonly statusDisplay = computed(() =>
    this.taskStatus().replace(/_/g, ' ').toUpperCase(),
  );

  /** Format transition target status for menu display */
  transitionStatusClass(transition: Transition): string {
    return `task-status-chip ${transition.status.toLowerCase().replace(/\s+/g, '_')}`;
  }

  transitionStatusDisplay(transition: Transition): string {
    return transition.status.replace(/_/g, ' ').toUpperCase();
  }

  readonly priorityIcon = computed(() => {
    const val = this.priorityValue();
    if (val >= 8) return 'priority_high';
    if (val >= 5) return 'drag_handle';
    return 'low_priority';
  });

  readonly priorityClass = computed(() => {
    const val = this.priorityValue();
    if (val >= 8) return 'priority-high';
    if (val >= 5) return 'priority-medium';
    return 'priority-low';
  });

  readonly assignedInitials = computed(() => {
    const name = this.assignedName() || this.ownerName();
    if (!name) return '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  });

  onTransition(transition: Transition): void {
    const task = this._task();
    if (task) {
      this.transitioned.emit({
        taskId: task.id.toString(),
        transitionId: transition.id.toString(),
      });
    }
  }
}
