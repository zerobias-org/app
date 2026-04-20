import { Component, input, output, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import type { SmeMartProject } from '../../core/models';

/**
 * Form submission gate for bid submission.
 * Prevents bid submission if form is required but not submitted.
 *
 * Inputs:
 * - project: SmeMartProject (required)
 * - bidId: UUID for the current bid context (required)
 *
 * Behavior:
 * - Shows gate banner if project has formConfig but submission is not in 'submitted' state
 * - Hides gate if no formConfig defined or submission status is 'submitted'/'reviewed'
 * - Emits scrollToForm event when user clicks "Scroll to Form" button
 */
@Component({
  selector: 'app-bid-form-gate',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (showGate()) {
      <div class="form-gate-banner">
        <mat-icon>info</mat-icon>
        <span>You must complete and submit the submission form before submitting your bid.</span>
        <button mat-button (click)="scrollToForm.emit()">
          Scroll to Form
        </button>
      </div>
    }
  `,
  styles: [`
    .form-gate-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 4px;
      color: #1565c0;
      margin: 16px 0;
    }

    .form-gate-banner mat-icon {
      flex-shrink: 0;
    }

    .form-gate-banner span {
      flex: 1;
      font-size: 14px;
    }

    .form-gate-banner button {
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidFormGateComponent implements OnInit {
  private readonly formSubmission = inject(FormSubmissionService);

  readonly project = input.required<SmeMartProject>();
  readonly bidId = input.required<string>();

  readonly scrollToForm = output<void>();

  readonly showGate = signal(false);

  async ngOnInit(): Promise<void> {
    const proj = this.project();
    const bid = this.bidId();

    // Only show gate if project has form config
    if (!proj.formConfig || !bid) {
      this.showGate.set(false);
      return;
    }

    // Check if form submission exists and is in submitted/reviewed state
    try {
      const submission = await this.formSubmission.getByProjectAndBid(
        proj.id as any,
        bid as any
      );

      // Show gate if no submission exists or status is draft/revised (not submitted/reviewed)
      const isFormCompleted =
        submission &&
        (submission.status === 'submitted' || submission.status === 'reviewed');

      this.showGate.set(!isFormCompleted);
    } catch (err) {
      // On error, show gate to be safe (vendor must explicitly submit form)
      this.showGate.set(true);
    }
  }
}
