import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import type { Transition } from '@zerobias-com/platform-sdk';
import { EngagementTasksService } from '../../../core/services/engagement-tasks.service';
import { MarkdownEditor } from '../markdown-editor/markdown-editor.component';

export interface CreateSubTaskDialogData {
  masterTaskId: string;
  activityId: string;
  boundaryId?: string;
  /** Available initial transitions from the master task's workflow */
  initialTransitions?: Transition[];
}

@Component({
  selector: 'app-create-subtask-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MarkdownEditor,
  ],
  templateUrl: './create-subtask-dialog.component.html',
  styleUrl: './create-subtask-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSubTaskDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateSubTaskDialog>);
  private readonly data = inject<CreateSubTaskDialogData>(MAT_DIALOG_DATA);
  private readonly tasksService = inject(EngagementTasksService);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    priority: [5],
  });

  readonly priorityOptions = [
    { label: 'Low', value: 1 },
    { label: 'Medium', value: 5 },
    { label: 'High', value: 8 },
    { label: 'Critical', value: 10 },
  ];

  /** Initial transitions available for the task workflow (passed from parent) */
  readonly initialTransitions = computed(() => this.data.initialTransitions || []);
  readonly hasTransitions = computed(() => this.initialTransitions().length > 0);

  /** Selected transition for initial status (optional) */
  readonly selectedTransition = signal<Transition | null>(null);

  /** Format transition target status for display */
  transitionStatusClass(transition: Transition): string {
    return `task-status-chip ${transition.status.toLowerCase().replace(/\s+/g, '_')}`;
  }

  transitionStatusDisplay(transition: Transition): string {
    return transition.status.replace(/_/g, ' ').toUpperCase();
  }

  selectTransition(transition: Transition | null): void {
    this.selectedTransition.set(transition);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting() || this.form.invalid) return;
    this.submitting.set(true);

    try {
      const v = this.form.getRawValue();
      const task = await this.tasksService.createSubTask(this.data.masterTaskId, {
        name: v.name!,
        description: v.description || undefined,
        activityId: this.data.activityId,
        boundaryId: this.data.boundaryId,
        priority: v.priority ?? undefined,
      });

      // If an initial transition was selected, apply it after creation
      const transition = this.selectedTransition();
      if (transition) {
        try {
          const updated = await this.tasksService.transitionTask(
            task.id.toString(),
            transition.id.toString(),
          );
          this.snackBar.open('Task created', 'OK', { duration: 3000 });
          this.dialogRef.close(updated);
          return;
        } catch (err: any) {
          // Task was created but transition failed — still close with the original task
          this.snackBar.open(
            `Task created, but status change failed: ${err.message}`,
            'Dismiss',
            { duration: 5000 },
          );
        }
      }

      this.snackBar.open('Task created', 'OK', { duration: 3000 });
      this.dialogRef.close(task);
    } catch (err: any) {
      this.snackBar.open(`Failed to create task: ${err.message}`, 'Dismiss', { duration: 5000 });
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
