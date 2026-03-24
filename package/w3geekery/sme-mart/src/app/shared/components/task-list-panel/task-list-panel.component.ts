import {
  Component, Input, ChangeDetectionStrategy, OnInit,
  signal, computed, inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import type { TaskExtended } from '@zerobias-com/platform-sdk';
import { TaskCard } from '../task-card/task-card.component';
import { CreateSubTaskDialog, type CreateSubTaskDialogData } from '../create-subtask-dialog/create-subtask-dialog.component';
import { EngagementTasksService } from '../../../core/services/engagement-tasks.service';

@Component({
  selector: 'app-task-list-panel',
  standalone: true,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    ZbEmptyStateContainerComponent,
    TaskCard,
  ],
  templateUrl: './task-list-panel.component.html',
  styleUrl: './task-list-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPanel implements OnInit {
  private readonly tasksService = inject(EngagementTasksService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly _masterTaskId = signal('');
  private readonly _boundaryId = signal<string | null>(null);
  private readonly _isOwner = signal(false);
  @Input({ required: true })
  set masterTaskId(value: string) { this._masterTaskId.set(value); }

  @Input()
  set boundaryId(value: string | null) { this._boundaryId.set(value); }

  @Input()
  set isOwner(value: boolean) { this._isOwner.set(value); }

  readonly masterTask = signal<TaskExtended | null>(null);
  readonly subTasks = signal<TaskExtended[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly isOwnerFlag = computed(() => this._isOwner());
  readonly loaded = signal(false);

  ngOnInit(): void {
    // Auto-load when rendered (mat-tab lazy-renders content on first select)
    this.loadTasks();
  }

  async openCreateDialog(): Promise<void> {
    const master = this.masterTask();
    if (!master) return;

    const dialogRef = this.dialog.open(CreateSubTaskDialog, {
      data: {
        masterTaskId: master.id.toString(),
        activityId: master.activityId.toString(),
        boundaryId: this._boundaryId() || master.boundaryId?.toString(),
        initialTransitions: master.nextTransitions || [],
      } as CreateSubTaskDialogData,
      width: '700px',
      maxHeight: '80vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Append the new task to the list
        this.subTasks.update(tasks => [...tasks, result]);
      }
    });
  }

  async onTaskTransitioned(event: { taskId: string; transitionId: string }): Promise<void> {
    try {
      const updated = await this.tasksService.transitionTask(event.taskId, event.transitionId);
      // Update the task in our lists
      if (this.masterTask()?.id.toString() === event.taskId) {
        this.masterTask.set(updated);
      } else {
        this.subTasks.update(tasks =>
          tasks.map(t => t.id.toString() === event.taskId ? updated : t),
        );
      }
      this.snackBar.open(`Task status updated to "${updated.status}"`, 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to update status: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  /** Call from parent to trigger loading (lazy-load on tab select) */
  async loadTasks(): Promise<void> {
    if (this.loaded()) return;

    const taskId = this._masterTaskId();
    if (!taskId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const [master, children] = await Promise.all([
        this.tasksService.getTask(taskId),
        this.tasksService.listChildTasks(taskId),
      ]);
      this.masterTask.set(master);
      this.subTasks.set(children);
      this.loaded.set(true);
    } catch (err: any) {
      console.error('[TaskListPanel] Failed to load tasks:', err);
      const msg = err.message || 'Failed to load tasks';
      // Detect "not found" — the linked task ID may be stale or from a different environment
      if (msg.includes('No such Task')) {
        this.error.set(`The linked ZeroBias Task (${taskId}) was not found. It may belong to a different environment or have been deleted.`);
      } else {
        this.error.set(msg);
      }
      this.snackBar.open('Failed to load tasks', 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

}
