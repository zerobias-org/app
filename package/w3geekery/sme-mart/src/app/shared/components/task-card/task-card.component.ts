import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, computed, signal, inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import type { TaskExtended, TagView, Transition } from '@zerobias-com/platform-sdk';
import { ZbChipColorsDirective, ZbSnakeToSpacesPipe, ZbSimplePanelComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { MarkdownView } from '../markdown-view/markdown-view.component';
import { CreateSubTaskDialog, type CreateSubTaskDialogData } from '../create-subtask-dialog/create-subtask-dialog.component';
import { EngagementTasksService } from '../../../core/services/engagement-tasks.service';
import { ResourceTagAutocomplete } from '../resource-tag-autocomplete/resource-tag-autocomplete.component';
import { ResourceTagsPanel } from '../resource-tags-panel/resource-tags-panel.component';
import { SmeResourceLinksPanel } from '../sme-resource-links-panel/sme-resource-links-panel.component';
import { EngagementContextService } from '../../../core/services/engagement-context.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    MatCardModule, MatChipsModule, MatIconModule,
    MatButtonModule, MatMenuModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    DatePipe,
    ZbChipColorsDirective, ZbSnakeToSpacesPipe, ZbSimplePanelComponent, ZbEmptyStateContainerComponent,
    MarkdownView,
    ResourceTagAutocomplete,
    ResourceTagsPanel,
    SmeResourceLinksPanel,
  ],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  private readonly tasksService = inject(EngagementTasksService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly engagementCtx = inject(EngagementContextService);

  readonly engagementId = computed(() => this.engagementCtx.engagement()?.id ?? null);

  private readonly _task = signal<TaskExtended | null>(null);
  private readonly _isMaster = signal(false);
  private readonly _isExpanded = signal(false);
  private readonly _tags = signal<TagView[]>([]);
  private readonly _parentTaskCode = signal<string | null>(null);
  private readonly _isOwner = signal(false);

  @Input({ required: true })
  set task(value: TaskExtended) { this._task.set(value); }

  @Input()
  set isMaster(value: boolean) { this._isMaster.set(value); }

  @Input()
  set isExpanded(value: boolean) {
    this._isExpanded.set(value);
    // Load subtasks when first expanded (non-master cards only)
    if (value && !this._isMaster() && !this.subTasksLoaded()) {
      this.loadSubTasks();
    }
  }

  @Input()
  set tags(value: TagView[]) { this._tags.set(value); }

  /** Code of the parent/master task — shown as a chip on sub-tasks */
  @Input()
  set parentTaskCode(value: string | null) { this._parentTaskCode.set(value); }

  @Input()
  set isOwner(value: boolean) { this._isOwner.set(value); }

  /** Master card: direct sub-tasks passed from task-list-panel */
  @Input()
  set masterSubTasks(value: TaskExtended[]) { this._masterSubTasks.set(value); }

  @Output() transitioned = new EventEmitter<{ taskId: string; transitionId: string }>();
  @Output() expanded = new EventEmitter<string>();
  @Output() createSubTask = new EventEmitter<void>();
  @Output() subTaskExpanded = new EventEmitter<string>();

  readonly taskData = computed(() => this._task());
  readonly isMasterTask = computed(() => this._isMaster());
  readonly isExpandedTask = computed(() => this._isExpanded());
  readonly taskTags = computed(() => this._tags());
  readonly parentCode = computed(() => this._parentTaskCode());
  readonly isOwnerFlag = computed(() => this._isOwner());

  /** Master sub-tasks (passed via input for master card) */
  private readonly _masterSubTasks = signal<TaskExtended[]>([]);
  readonly masterSubTaskList = computed(() => this._masterSubTasks());
  readonly masterSubTaskCount = computed(() => this._masterSubTasks().length);
  readonly expandedMasterSubTaskId = signal<string | null>(null);

  /** Sub-subtask state */
  readonly subTasks = signal<TaskExtended[]>([]);
  readonly subTasksLoading = signal(false);
  readonly subTasksLoaded = signal(false);
  readonly subTaskCount = computed(() => this.subTasks().length);

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

  onTagsChanged(tags: TagView[]): void {
    this._tags.set(tags);
  }

  onMasterSubTaskClick(taskId: string): void {
    this.expandedMasterSubTaskId.update(current => current === taskId ? null : taskId);
    this.subTaskExpanded.emit(taskId);
  }

  onCreateSubTaskClick(): void {
    this.createSubTask.emit();
  }

  onCardClick(): void {
    const task = this._task();
    if (task && !this._isMaster()) {
      this.expanded.emit(task.id.toString());
    }
  }

  // ---------------------------------------------------------------------------
  // Sub-subtasks (children of this subtask)
  // ---------------------------------------------------------------------------

  async loadSubTasks(): Promise<void> {
    const task = this._task();
    if (!task || this.subTasksLoaded()) return;

    this.subTasksLoading.set(true);
    try {
      const children = await this.tasksService.listChildTasks(task.id.toString());
      this.subTasks.set(children);
      this.subTasksLoaded.set(true);
    } catch (err: any) {
      console.warn('[TaskCard] Failed to load subtasks:', err);
    } finally {
      this.subTasksLoading.set(false);
    }
  }

  async openCreateSubTaskDialog(): Promise<void> {
    const task = this._task();
    if (!task) return;

    const dialogRef = this.dialog.open(CreateSubTaskDialog, {
      data: {
        masterTaskId: task.id.toString(),
        activityId: task.activityId.toString(),
        boundaryId: task.boundaryId?.toString(),
        initialTransitions: task.nextTransitions || [],
      } as CreateSubTaskDialogData,
      width: '700px',
      maxHeight: '80vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.subTasks.update(tasks => [...tasks, result]);
      }
    });
  }

  async onSubTaskTransitioned(event: { taskId: string; transitionId: string }): Promise<void> {
    try {
      const updated = await this.tasksService.transitionTask(event.taskId, event.transitionId);
      this.subTasks.update(tasks =>
        tasks.map(t => t.id.toString() === event.taskId ? updated : t),
      );
      this.snackBar.open(`Task status updated to "${updated.status}"`, 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to update status: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }
}
