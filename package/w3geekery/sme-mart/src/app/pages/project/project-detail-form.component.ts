import { Component, input, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormSubmissionService } from '../../core/services/form-submission.service';
import { DynamicFormRendererComponent } from '../../shared/components/form-builder/dynamic-form-renderer.component';
import type { SmeMartProject, FormSubmission, FormBuilderConfig } from '../../core/models';

/**
 * Embedded component for project detail's Submission Form tab.
 * Handles vendor form submission with role-aware mode (fill vs review).
 *
 * Inputs:
 * - project: SmeMartProject (required)
 * - bidId: UUID for the associated bid (required for vendor submission)
 * - currentUserId: Current user ID (for vendor identification)
 * - isVendor: Role-aware mode flag (true = fill, false = review)
 *
 * Flows:
 * - Vendor fill: ngOnInit loads existing submission, form handlers create/update with projectId + bidId
 * - Buyer review: currentSubmission input provided, read-only display
 */
@Component({
  selector: 'app-project-detail-form',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, DynamicFormRendererComponent],
  template: `
    @if (formConfig()) {
      <app-dynamic-form-renderer
        [config]="formConfig()!"
        [mode]="isVendor() ? 'fill' : 'review'"
        [submission]="currentSubmission() || { submissionData: {} }"
        (submit)="onFormSubmit($event)"
        (draftSave)="onDraftSave($event)"
      ></app-dynamic-form-renderer>
    } @else {
      <p class="no-form">No submission form configured for this project.</p>
    }
  `,
  styles: [`
    .no-form {
      color: var(--mat-sys-on-surface-variant, #999);
      padding: 24px;
      text-align: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailFormComponent {
  private readonly formSubmission = inject(FormSubmissionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly project = input.required<SmeMartProject>();
  readonly bidId = input.required<string>();
  readonly currentUserId = input<string | null>(null);
  readonly isVendor = input(false); // True if user is vendor (different org from project owner)

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

  readonly currentSubmission = signal<FormSubmission | null>(null);
  readonly isSubmitting = signal(false);

  async ngOnInit(): Promise<void> {
    const proj = this.project();
    const bid = this.bidId();

    // Load existing submission if vendor is viewing their own submission
    if (this.isVendor() && bid && proj.id) {
      try {
        const submission = await this.formSubmission.getByProjectAndBid(
          proj.id as any,
          bid as any
        );
        if (submission) {
          this.currentSubmission.set(submission);
        }
      } catch (err) {
        console.error('Failed to load form submission:', err);
      }
    }
  }

  async onFormSubmit(data: Record<string, unknown>): Promise<void> {
    const proj = this.project();
    const bid = this.bidId();

    if (!proj.id || !bid) {
      this.snackBar.open('Unable to submit form: missing context', 'Dismiss', { duration: 5000 });
      return;
    }

    this.isSubmitting.set(true);
    try {
      const submission = this.currentSubmission();
      let result: FormSubmission;

      if (submission && submission.id) {
        // Update existing submission
        result = await this.formSubmission.update(submission.id as any, {
          submissionData: data,
          status: 'submitted',
          submittedAt: new Date(),
        });
      } else {
        // Create new submission
        result = await this.formSubmission.create(proj.id as any, bid as any);
        // Update with submission data
        result = await this.formSubmission.update(result.id as any, {
          submissionData: data,
          status: 'submitted',
          submittedAt: new Date(),
        });
      }

      this.currentSubmission.set(result);
      this.snackBar.open('Form submitted successfully', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to submit form: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async onDraftSave(data: Record<string, unknown>): Promise<void> {
    const proj = this.project();
    const bid = this.bidId();

    if (!proj.id || !bid) {
      this.snackBar.open('Unable to save draft: missing context', 'Dismiss', { duration: 5000 });
      return;
    }

    this.isSubmitting.set(true);
    try {
      const submission = this.currentSubmission();
      let result: FormSubmission;

      if (submission && submission.id) {
        // Update existing submission with draft
        result = await this.formSubmission.update(submission.id as any, {
          submissionData: data,
          status: 'draft',
        });
      } else {
        // Create new draft submission
        result = await this.formSubmission.create(proj.id as any, bid as any);
        // Update with submission data
        result = await this.formSubmission.update(result.id as any, {
          submissionData: data,
          status: 'draft',
        });
      }

      this.currentSubmission.set(result);
      this.snackBar.open('Draft saved', 'OK', { duration: 2000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to save draft: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
