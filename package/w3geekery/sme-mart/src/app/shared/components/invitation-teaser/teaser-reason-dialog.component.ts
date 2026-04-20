import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

interface DialogData {
  projectTitle: string;
}

@Component({
  selector: 'app-teaser-reason-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Request Invitation</h2>
    <div mat-dialog-content>
      <p>Request an invitation to bid on <strong>{{ projectTitle }}</strong></p>

      <mat-form-field class="full-width">
        <mat-label>Why should you be invited? (optional)</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="4"></textarea>
      </mat-form-field>

      <p class="note">The buyer will review your request and may invite you to bid.</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Send Request</button>
    </div>
  `,
  styles: [`
    h2 {
      margin-top: 0;
    }

    .full-width {
      width: 100%;
    }

    .note {
      font-size: 0.875rem;
      color: var(--zb-secondary-text, #666);
      margin-top: 0.5rem;
    }

    div[mat-dialog-actions] {
      padding-top: 1rem;
    }
  `],
})
export class TeaserReasonDialogComponent {
  private readonly dialogData = inject(MAT_DIALOG_DATA) as DialogData;
  reason = '';

  get projectTitle(): string {
    return this.dialogData.projectTitle;
  }

  onCancel(): void {
    // Dialog will close with undefined
  }

  onConfirm(): void {
    // Return confirmation result
  }
}
