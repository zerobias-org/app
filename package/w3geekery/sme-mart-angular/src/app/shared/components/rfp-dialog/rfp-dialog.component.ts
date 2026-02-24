import { Component, inject, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZbDialogComponent } from '@zerobias-org/ngx-library';
import { EngagementForm, type EngagementFormValues } from '../engagement-form/engagement-form.component';
import { WorkRequestsService } from '../../../core/services/work-requests.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';

@Component({
  selector: 'app-rfp-dialog',
  standalone: true,
  imports: [MatButtonModule, MatSnackBarModule, ZbDialogComponent, EngagementForm],
  template: `
    <zb-dialog
      title="Post an RFP"
      subTitle="Describe what you're looking for and let providers submit proposals."
      actionLabel="Post RFP"
      [actionDisabled]="!formValid()"
      [actionProcessing]="saving()"
      cancelLabel="Cancel"
      [showCloseX]="true"
      (action)="save(false)"
      (cancel)="close()"
    >
      <button leftAction mat-stroked-button (click)="save(true)" [disabled]="saving() || !formValid()">
        Save as Draft
      </button>
      <app-engagement-form (valuesChange)="onValuesChange($event)"></app-engagement-form>
    </zb-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpDialog {
  private readonly dialogRef = inject(MatDialogRef<RfpDialog>);
  private readonly impersonation = inject(ImpersonationService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(EngagementForm) formComponent!: EngagementForm;

  readonly saving = signal(false);
  readonly formValid = signal(false);
  private currentValues: EngagementFormValues | null = null;

  onValuesChange(values: EngagementFormValues): void {
    this.currentValues = values;
    this.formValid.set(!!values.title && !!values.category);
  }

  async save(asDraft: boolean): Promise<void> {
    if (!this.currentValues) return;

    this.saving.set(true);
    try {
      const rfp = await this.workRequests.createRfp({
        buyer_zerobias_user_id: this.impersonation.effectiveUserId(),
        title: this.currentValues.title,
        description: this.currentValues.description || undefined,
        category: this.currentValues.category,
        budget_type: this.currentValues.budget_type || undefined,
        budget_min: this.currentValues.budget_min || undefined,
        budget_max: this.currentValues.budget_max || undefined,
        timeline: this.currentValues.timeline || undefined,
        status: asDraft ? 'draft' : 'open',
      });
      this.snackBar.open(asDraft ? 'Draft saved' : 'RFP posted', 'OK', { duration: 3000 });
      this.dialogRef.close(rfp);
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.saving.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
