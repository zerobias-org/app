import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProposalsService } from '../../../core/services/proposals.service';
import type { Proposal } from '../../../core/models';

export interface ProposalFormData {
  requestId: string;
  providerId: string;
}

@Component({
  selector: 'app-proposal-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './proposal-form.component.html',
  styleUrl: './proposal-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalForm {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProposalForm>);
  private readonly data = inject<ProposalFormData>(MAT_DIALOG_DATA);
  private readonly proposals = inject(ProposalsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly form = this.fb.group({
    cover_letter: [''],
    proposed_price: [''],
    proposed_timeline: [''],
  });

  submitting = false;

  async onSubmit(): Promise<void> {
    if (this.submitting) return;
    this.submitting = true;

    try {
      const v = this.form.getRawValue();
      const proposal = await this.proposals.submitProposal({
        request_id: this.data.requestId,
        provider_id: this.data.providerId,
        cover_letter: v.cover_letter || undefined,
        proposed_price: v.proposed_price || undefined,
        proposed_timeline: v.proposed_timeline || undefined,
      });
      this.snackBar.open('Proposal submitted', 'OK', { duration: 3000 });
      this.dialogRef.close(proposal);
    } catch (err: any) {
      this.snackBar.open(`Failed to submit: ${err.message}`, 'Dismiss', { duration: 5000 });
      this.submitting = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
