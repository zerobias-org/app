import { Component, input, output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import type { SmeMartProject } from '../../core/models';

/**
 * Form submission gate for bid submission.
 * Prevents bid submission if form is required but not submitted.
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
export class BidFormGateComponent {
  private readonly formSubmission = inject(FormSubmissionService);

  readonly project = input.required<SmeMartProject>();
  readonly projectId = input.required<string>();

  readonly scrollToForm = output<void>();

  readonly showGate = signal(false);

  async ngOnInit(): Promise<void> {
    const proj = this.project();
    const projId = this.projectId();

    // Only show gate if project has form config
    if (!proj.formConfig || !projId) {
      return;
    }

    // Check if form submission exists and is in submitted state
    const submission = await this.formSubmission.getByProjectAndBid(projId as any, ''); // TODO: get actual bidId
    const isFormSubmitted = submission && submission.status === 'submitted';

    this.showGate.set(!isFormSubmitted);
  }
}
