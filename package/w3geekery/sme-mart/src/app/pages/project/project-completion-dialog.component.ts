import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import type { SmeMartProject } from '../../core/models';

@Component({
  selector: 'app-project-completion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './project-completion-dialog.component.html',
  styleUrls: ['./project-completion-dialog.component.scss'],
})
export class ProjectCompletionDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ProjectCompletionDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as { project: SmeMartProject };

  readonly notes = signal('');

  onCancel(): void {
    this.dialogRef.close();
  }

  onComplete(): void {
    this.dialogRef.close({ notes: this.notes() });
  }
}
