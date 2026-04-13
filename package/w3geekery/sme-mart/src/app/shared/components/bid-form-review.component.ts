import { Component, input, output, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import { DynamicFormRendererComponent } from './form-builder/dynamic-form-renderer.component';
import type { SmeMartProject, FormSubmission, FormBuilderConfig } from '../../core/models';

/**
 * Form submission review section for bid review page.
 * Shows vendor's submitted form responses.
 * Allows buyer to mark responses as reviewed (with re-review detection for revised status).
 */
@Component({
  selector: 'app-bid-form-review',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDividerModule, DynamicFormRendererComponent],
  template: `
    @if (formConfig() && formSubmission()) {
      <section class="form-review-section">
        <div class="section-header">
          <h3>Submission Form Responses</h3>
          @if (isReviewed()) {
            <span class="reviewed-badge">Reviewed</span>
          } @else if (isRevised()) {
            <span class="revised-badge">Revised - Needs Re-review</span>
          } @else {
            <button
              mat-raised-button
              color="primary"
              (click)="onMarkReviewed()"
              [disabled]="isMarking()"
            >
              Mark Reviewed
            </button>
          }
        </div>

        <app-dynamic-form-renderer
          [config]="formConfig()!"
          mode="review"
          [submission]="formSubmission()!"
        ></app-dynamic-form-renderer>
      </section>
    }
  `,
  styles: [`
    .form-review-section {
      padding: 24px 0;
      border-top: 1px solid var(--mat-sys-outline-variant, #ddd);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0;
      font-weight: 500;
    }

    .reviewed-badge {
      padding: 4px 12px;
      background: #c8e6c9;
      color: #2e7d32;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .revised-badge {
      padding: 4px 12px;
      background: #fff9c4;
      color: #f57f17;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidFormReviewComponent {
  private readonly formSubmission = inject(FormSubmissionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly project = input.required<SmeMartProject>();
  readonly submission = input.required<FormSubmission | null>();
  readonly currentUserId = input<string | null>(null);

  readonly formConfig = computed(() => {
    const proj = this.project();
    if (!proj.formConfig) return null;
    try {
      return typeof proj.formConfig === 'string'
        ? JSON.parse(proj.formConfig)
        : proj.formConfig;
    } catch {
      return null;
    }
  });

  readonly formSubmission = computed(() => this.submission());

  readonly isReviewed = computed(() => {
    const sub = this.submission();
    return sub?.status === 'reviewed';
  });

  readonly isRevised = computed(() => {
    const sub = this.submission();
    return sub?.status === 'revised';
  });

  readonly isMarking = signal(false);

  async onMarkReviewed(): Promise<void> {
    const sub = this.submission();
    if (!sub || !this.currentUserId()) return;

    this.isMarking.set(true);
    try {
      await this.formSubmission.markReviewed(sub.id, this.currentUserId() as any);
      this.snackBar.open('Form marked as reviewed', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to mark reviewed: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isMarking.set(false);
    }
  }
}
