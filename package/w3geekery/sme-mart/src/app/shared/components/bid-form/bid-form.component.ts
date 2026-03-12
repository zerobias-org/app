import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BidsService } from '../../../core/services/bids.service';
import type { Bid } from '../../../core/models';

export interface BidFormData {
  requestId: string;
  providerId: string;
}

@Component({
  selector: 'app-bid-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './bid-form.component.html',
  styleUrl: './bid-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidForm {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BidForm>);
  private readonly data = inject<BidFormData>(MAT_DIALOG_DATA);
  private readonly bids = inject(BidsService);
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
      const bid = await this.bids.submitBid({
        request_id: this.data.requestId,
        provider_id: this.data.providerId,
        cover_letter: v.cover_letter || undefined,
        proposed_price: v.proposed_price || undefined,
        proposed_timeline: v.proposed_timeline || undefined,
      });
      this.snackBar.open('Bid submitted', 'OK', { duration: 3000 });
      this.dialogRef.close(bid);
    } catch (err: any) {
      this.snackBar.open(`Failed to submit: ${err.message}`, 'Dismiss', { duration: 5000 });
      this.submitting = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
