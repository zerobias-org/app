import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import type { RfpInvitation } from '../../core/models';

interface DialogData {
  invitation: RfpInvitation;
}

@Component({
  selector: 'app-invitation-decline-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Decline Invitation</h2>
    <div mat-dialog-content>
      <p>Are you sure you want to decline this invitation?</p>
      <p class="muted">You won't be able to submit a bid for this RFP unless the buyer sends a new invitation.</p>

      <mat-form-field class="full-width">
        <mat-label>Reason (optional)</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="3"></textarea>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Decline</button>
    </div>
  `,
  styles: [`
    h2 {
      margin-top: 0;
    }

    .full-width {
      width: 100%;
    }

    .muted {
      color: var(--zb-secondary-text, #666);
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    div[mat-dialog-actions] {
      padding-top: 1rem;
    }
  `],
})
export class InvitationDeclineDialogComponent {
  private readonly dialogData = inject(MAT_DIALOG_DATA) as DialogData;
  reason = '';

  onCancel(): void {
    // Dialog will close with undefined
  }

  onConfirm(): void {
    // Return confirmation result
  }
}
