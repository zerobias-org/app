import { Component, input, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import { DynamicFormRendererComponent } from './form-builder/dynamic-form-renderer.component';
import type { SmeMartProject, FormSubmission, FormBuilderConfig } from '../../core/models';

/**
 * Form submission review section for bid review page.
 * Shows vendor's submitted form responses.
 * Allows buyer to mark responses as reviewed with re-review detection.
 *
 * Inputs:
 * - project: SmeMartProject (required)
 * - submission: FormSubmission | null (required)
 * - currentUserId: Current user ID for review action
 *
 * Features:
 * - Form config parsing from project
 * - Dynamic form rendering in review mode
 * - Status display: reviewed (ZbResourceStatusComponent), revised (alert badge), or Mark button
 * - Mark Reviewed action: Updates submission.status='reviewed' with buyer identity
 * - Re-review detection: Highlights revised status when vendor re-edited after review
 */
@Component({
  selector: 'app-bid-form-review',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    DynamicFormRendererComponent,
    ZbResourceStatusComponent,
  ],
  template: `
    @if (formConfig() && submissionData()) {
      <section class="form-review-section">
        <div class="section-header">
          <h3>Submission Form Responses</h3>
          @if (isReviewed()) {
            <zb-resource-status [label]="'REVIEWED'"></zb-resource-status>
          } @else if (isRevised()) {
            <div class="revised-alert">
              <mat-icon>warning</mat-icon>
              <span>Vendor revised form - needs re-review</span>
            </div>
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
          [submission]="submissionData()!"
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

    .revised-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #fffbea;
      border: 1px solid #ffe0b2;
      border-radius: 4px;
      color: #f57f17;
      font-size: 13px;
      font-weight: 500;
    }

    .revised-alert mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidFormReviewComponent implements OnInit {
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

  readonly submissionData = computed(() => this.submission());

  readonly isReviewed = computed(() => {
    const sub = this.submission();
    return sub?.status === 'reviewed';
  });

  readonly isRevised = computed(() => {
    const sub = this.submission();
    return sub?.status === 'revised';
  });

  readonly isMarking = signal(false);

  ngOnInit(): void {
    // Component initializes with submission input
    // No additional initialization needed
  }

  async onMarkReviewed(): Promise<void> {
    const sub = this.submission();
    if (!sub || !this.currentUserId()) return;

    this.isMarking.set(true);
    try {
      await this.formSubmission.markReviewed(sub.id, this.currentUserId() as any);
      this.snackBar.open('Form marked as reviewed', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to mark reviewed: ${err.message}`, 'Dismiss', {
        duration: 5000,
      });
    } finally {
      this.isMarking.set(false);
    }
  }
}
