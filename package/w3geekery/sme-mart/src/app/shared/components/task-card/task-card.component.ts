import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import type { TaskExtended, TagView, Transition } from '@zerobias-com/platform-sdk';
import { ZbChipColorsDirective, ZbSnakeToSpacesPipe } from '@zerobias-org/ngx-library';
import { MarkdownView } from '../markdown-view/markdown-view.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    MatCardModule, MatChipsModule, MatIconModule,
    MatButtonModule, MatMenuModule, MatTooltipModule,
    DatePipe,
    ZbChipColorsDirective, ZbSnakeToSpacesPipe, MarkdownView,
  ],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  private readonly _task = signal<TaskExtended | null>(null);
  private readonly _isMaster = signal(false);
  private readonly _isExpanded = signal(false);
  private readonly _tags = signal<TagView[]>([]);
  private readonly _parentTaskCode = signal<string | null>(null);

  @Input({ required: true })
  set task(value: TaskExtended) { this._task.set(value); }

  @Input()
  set isMaster(value: boolean) { this._isMaster.set(value); }

  @Input()
  set isExpanded(value: boolean) { this._isExpanded.set(value); }

  @Input()
  set tags(value: TagView[]) { this._tags.set(value); }

  /** Code of the parent/master task — shown as a chip on sub-tasks */
  @Input()
  set parentTaskCode(value: string | null) { this._parentTaskCode.set(value); }

  @Output() transitioned = new EventEmitter<{ taskId: string; transitionId: string }>();
  @Output() expanded = new EventEmitter<string>();

  readonly taskData = computed(() => this._task());
  readonly isMasterTask = computed(() => this._isMaster());
  readonly isExpandedTask = computed(() => this._isExpanded());
  readonly taskTags = computed(() => this._tags());
  readonly parentCode = computed(() => this._parentTaskCode());

  readonly taskCode = computed(() => this._task()?.code || '');
  readonly taskName = computed(() => this._task()?.name || '');
  readonly taskDescription = computed(() => this._task()?.description || '');
  readonly taskStatus = computed(() => (this._task()?.status || '').replace(/\s+/g, '_'));
  readonly taskStatusClass = computed(() => this.taskStatus().toLowerCase());
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

  normalizeStatus(status: string): string {
    return status.replace(/\s+/g, '_');
  }

  onTransition(transition: Transition): void {
    const task = this._task();
    if (task) {
      this.transitioned.emit({
        taskId: task.id.toString(),
        transitionId: transition.id.toString(),
      });
    }
  }

  onCardClick(): void {
    const task = this._task();
    if (task && !this._isMaster()) {
      this.expanded.emit(task.id.toString());
    }
  }
}
