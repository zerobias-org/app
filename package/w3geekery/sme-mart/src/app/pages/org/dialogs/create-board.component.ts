import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UUID } from '@zerobias-org/types-core-js';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { BoardStatus, BoardType, type BoardExtended } from '@zerobias-com/platform-sdk';

/** Context passed when opening the dialog: the parent project scoping the new board. */
export interface CreateBoardDialogData {
  readonly projectId: string;
}

interface BoardTypeOption {
  readonly label: string;
  readonly value: string;
}

/**
 * Minimal Create Board dialog (D-Q7): name (required) + description (optional) +
 * boardType dropdown. No template selector, no permissions UI, no seed tasks.
 *
 * Dependency-free of SME-Mart domain services — only Material, Reactive Forms and the
 * ZeroBias SDK. The caller owns the dialog title (no Material header here).
 */
@Component({
  selector: 'app-create-board',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-board.component.html',
  styleUrl: './create-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBoardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateBoardComponent>);
  private readonly data = inject<CreateBoardDialogData>(MAT_DIALOG_DATA);
  private readonly clientApi = inject(ZerobiasClientApi);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly boardTypeOptions: readonly BoardTypeOption[] = [
    { label: 'Kanban', value: 'kanban' },
    { label: 'List', value: 'list' },
    { label: 'Timeline', value: 'timeline' },
    { label: 'Calendar', value: 'calendar' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    boardType: ['kanban', Validators.required],
  });

  async onSubmit(): Promise<void> {
    if (this.isSubmitting() || this.form.invalid) {
      return;
    }
    this.isSubmitting.set(true);
    this.submitError.set(null);
    try {
      const v = this.form.getRawValue();
      const board: BoardExtended = await this.clientApi.platformClient.getBoardApi().create({
        name: v.name,
        description: v.description || undefined,
        status: BoardStatus.Active,
        boardType: BoardType.from(v.boardType),
        projectId: new UUID(this.data.projectId),
      });
      this.dialogRef.close(board);
    } catch (err) {
      console.error('[CreateBoard] create failed:', err);
      this.submitError.set('Failed to create board. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
